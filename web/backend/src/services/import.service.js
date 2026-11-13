const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const { User, Branch, Course, ExamSlot, CourseAssignment } = require('../models');
const {
  cellText,
  makePassword,
  previewRow,
} = require('./importHelpers');

const KINDS = ['branches', 'courses', 'students', 'slots', 'registrations'];

const parseSheet = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers = [];
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    const values = row.values || [];
    if (rowNumber === 1) {
      for (let i = 1; i < values.length; i += 1) headers[i] = cellText(values[i]);
      return;
    }
    const obj = {};
    for (let i = 1; i < values.length; i += 1) {
      const header = headers[i] || `col${i}`;
      obj[header] = cellText(values[i]);
    }
    rows.push(obj);
  });
  return rows;
};

const findBranch = (value) => {
  const text = String(value || '').trim();
  if (!text) return null;
  const safe = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Branch.findOne({
    $or: [{ code: text.toUpperCase() }, { name: new RegExp(`^${safe}$`, 'i') }],
  });
};

const previewImport = async (kind, buffer) => {
  if (!KINDS.includes(kind)) {
    const error = new Error('Unknown import type');
    error.status = 400;
    throw error;
  }
  const rawRows = await parseSheet(buffer);
  if (!rawRows.length) {
    const error = new Error('The file has no data rows');
    error.status = 400;
    throw error;
  }
  const rows = rawRows.map((raw, index) => ({ index: index + 2, ...previewRow(kind, raw) }));
  if (kind === 'students') {
    for (const row of rows) {
      if (!row.ok || !row.branch) continue;
      const branch = await findBranch(row.branch);
      if (!branch) {
        row.ok = false;
        row.message = [row.message, `Branch ${row.branch} was not found`].filter(Boolean).join('. ');
      } else {
        row.branchName = branch.name;
        row.branchId = branch._id.toString();
      }
    }
  }
  if (kind === 'registrations') {
    const extra = new Map();
    const current = new Map();
    for (const row of rows) {
      if (!row.ok) continue;
      const ors = [];
      if (row.email) ors.push({ email: row.email });
      if (row.registrationNumber) ors.push({ registrationNumber: row.registrationNumber });
      const student = await User.findOne({ role: 'STUDENT', $or: ors });
      if (!student) {
        row.ok = false;
        row.message = 'Student was not found. Upload students first.';
        continue;
      }
      const course = await Course.findOne({ courseCode: row.courseCode });
      if (!course) {
        row.ok = false;
        row.message = `Course ${row.courseCode} was not found. Upload courses first.`;
        continue;
      }
      row.studentId = student._id.toString();
      row.studentName = student.fullName;
      row.email = student.email;
      row.registrationNumber = student.registrationNumber || row.registrationNumber;
      row.courseId = course._id.toString();
      row.title = course.title;
      if (student.dateSheetSaved) {
        row.ok = false;
        row.message = 'Date sheet is already saved';
        continue;
      }
      const already = await CourseAssignment.findOne({ student: student._id, course: course._id });
      if (already) {
        row.message = 'Already registered';
        continue;
      }
      const key = row.studentId;
      if (!current.has(key)) current.set(key, await CourseAssignment.countDocuments({ student: student._id }));
      const next = (extra.get(key) || 0) + 1;
      if (current.get(key) + next > 6) {
        row.ok = false;
        row.message = 'Maximum 6 courses';
        continue;
      }
      extra.set(key, next);
    }
  }
  return { kind, rows, ready: rows.filter((row) => row.ok).length, blocked: rows.filter((row) => !row.ok).length };
};

const commitStudents = async (rows) => {
  const results = [];
  for (const row of rows) {
    if (!row.ok) {
      results.push({ index: row.index, status: 'skipped', message: row.message });
      continue;
    }
    const existing = await User.findOne({
      $or: [{ email: row.email }, { registrationNumber: row.registrationNumber }],
    });
    const branch = row.branchId
      ? await Branch.findById(row.branchId)
      : await findBranch(row.branch);
    if (row.branch && !branch) {
      results.push({ index: row.index, status: 'skipped', message: `Branch ${row.branch} was not found` });
      continue;
    }
    const fields = {
      fullName: row.fullName,
      email: row.email,
      registrationNumber: row.registrationNumber,
      program: row.program,
      semester: row.semester,
      selectedBranch: branch ? branch._id : null,
      password: await bcrypt.hash(row.password, 10),
      pendingPassword: row.password,
      passwordSent: false,
      role: 'STUDENT',
      isVerified: true,
    };
    try {
      if (existing) {
        if (existing.role === 'ADMIN') {
          results.push({ index: row.index, status: 'skipped', message: 'That email belongs to an admin' });
          continue;
        }
        Object.assign(existing, fields);
        await existing.save();
        results.push({ index: row.index, status: 'created', message: 'Updated' });
        continue;
      }
      await User.create(fields);
      results.push({ index: row.index, status: 'created', message: 'Created' });
    } catch (err) {
      results.push({ index: row.index, status: 'skipped', message: err.code === 11000 ? 'Duplicate value' : 'Could not create student' });
    }
  }
  return results;
};

const commitBranches = async (rows) => {
  const results = [];
  for (const row of rows) {
    if (!row.ok) {
      results.push({ index: row.index, status: 'skipped', message: row.message });
      continue;
    }
    try {
      await Branch.findOneAndUpdate(
        { code: row.code },
        {
          name: row.name,
          code: row.code,
          city: row.city || '—',
          address: row.address,
          contactNumber: row.contactNumber,
          status: row.status,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ index: row.index, status: 'created', message: 'Saved' });
    } catch (err) {
      results.push({ index: row.index, status: 'skipped', message: 'Could not save branch' });
    }
  }
  return results;
};

const commitCourses = async (rows) => {
  const results = [];
  for (const row of rows) {
    if (!row.ok) {
      results.push({ index: row.index, status: 'skipped', message: row.message });
      continue;
    }
    try {
      await Course.findOneAndUpdate(
        { courseCode: row.courseCode },
        {
          courseCode: row.courseCode,
          title: row.title,
          creditHours: Number(row.creditHours),
          department: row.department,
          difficulty: row.difficulty || 'medium',
          status: row.status,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ index: row.index, status: 'created', message: 'Saved' });
    } catch (err) {
      results.push({ index: row.index, status: 'skipped', message: 'Could not save course' });
    }
  }
  return results;
};

const commitSlots = async (rows) => {
  const results = [];
  for (const row of rows) {
    if (!row.ok) {
      results.push({ index: row.index, status: 'skipped', message: row.message });
      continue;
    }
    const course = await Course.findOne({ courseCode: row.courseCode });
    if (!course) {
      results.push({ index: row.index, status: 'skipped', message: `Course ${row.courseCode} was not found` });
      continue;
    }
    const date = new Date(row.date);
    try {
      await ExamSlot.findOneAndUpdate(
        { course: course._id, date, startTime: row.startTime },
        {
          $set: {
            endTime: row.endTime || undefined,
            capacity: Number(row.capacity),
          },
          $setOnInsert: {
            course: course._id,
            date,
            startTime: row.startTime,
            booked: 0,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ index: row.index, status: 'created', message: 'Saved' });
    } catch (err) {
      results.push({ index: row.index, status: 'skipped', message: 'Could not save slot' });
    }
  }
  return results;
};

const commitRegistrations = async (rows) => {
  const results = [];
  for (const row of rows) {
    if (!row.ok) {
      results.push({ index: row.index, status: 'skipped', message: row.message });
      continue;
    }
    if (!row.studentId || !row.courseId) {
      results.push({ index: row.index, status: 'skipped', message: 'Student or course was not found' });
      continue;
    }
    try {
      const count = await CourseAssignment.countDocuments({ student: row.studentId });
      const existing = await CourseAssignment.findOne({ student: row.studentId, course: row.courseId });
      if (!existing && count >= 6) {
        results.push({ index: row.index, status: 'skipped', message: 'Maximum 6 courses' });
        continue;
      }
      await CourseAssignment.findOneAndUpdate(
        { student: row.studentId, course: row.courseId },
        { student: row.studentId, course: row.courseId },
        { upsert: true, setDefaultsOnInsert: true }
      );
      results.push({ index: row.index, status: 'created', message: existing ? 'Already registered' : 'Registered' });
    } catch (err) {
      results.push({ index: row.index, status: 'skipped', message: err.code === 11000 ? 'Already registered' : 'Could not register course' });
    }
  }
  return results;
};

const commitImport = async (kind, rows) => {
  if (!KINDS.includes(kind)) {
    const error = new Error('Unknown import type');
    error.status = 400;
    throw error;
  }
  if (!Array.isArray(rows) || !rows.length) {
    const error = new Error('Nothing to import');
    error.status = 400;
    throw error;
  }
  const runners = {
    branches: commitBranches,
    courses: commitCourses,
    students: commitStudents,
    slots: commitSlots,
    registrations: commitRegistrations,
  };
  const results = await runners[kind](rows);
  return {
    created: results.filter((item) => item.status === 'created').length,
    skipped: results.filter((item) => item.status !== 'created').length,
    results,
  };
};

const issueStudentPassword = () => makePassword();

module.exports = {
  previewImport,
  commitImport,
  issueStudentPassword,
  KINDS,
};
