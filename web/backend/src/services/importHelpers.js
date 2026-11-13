const crypto = require('crypto');

const keyOf = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const cellText = (value) => {
  if (value == null) return '';
  if (typeof value === 'object' && value.text != null) return String(value.text).trim();
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
};

const pick = (row, names) => {
  const wanted = new Set(names.map(keyOf));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(keyOf(key))) return String(value ?? '').trim();
  }
  return '';
};

const makePassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = 'Vu';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return out;
};

const difficultyOf = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'easy' || v === 'medium' || v === 'hard') return v;
  return 'medium';
};

const statusOf = (value, fallback = 'active') => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'inactive' || v === 'disabled') return 'inactive';
  if (v === 'active' || v === 'enabled') return 'active';
  return fallback;
};

const previewRow = (kind, raw) => {
  if (kind === 'branches') {
    const row = {
      name: pick(raw, ['name', 'branch', 'branchname']),
      code: pick(raw, ['code', 'branchcode']).toUpperCase(),
      city: pick(raw, ['city']),
      address: pick(raw, ['address']),
      contactNumber: pick(raw, ['contact', 'contactnumber', 'phone']),
      status: statusOf(pick(raw, ['status'])),
    };
    const issues = [];
    if (!row.name) issues.push('Name is required');
    if (!row.code) issues.push('Code is required');
    return { ...row, ok: issues.length === 0, message: issues.join('. ') };
  }

  if (kind === 'courses') {
    const credits = pick(raw, ['credithours', 'credits', 'credit']);
    const row = {
      courseCode: pick(raw, ['coursecode', 'code']).toUpperCase(),
      title: pick(raw, ['title', 'name', 'course']),
      creditHours: credits || '3',
      department: pick(raw, ['department', 'discipline']),
      difficulty: difficultyOf(pick(raw, ['difficulty', 'level'])),
      status: statusOf(pick(raw, ['status'])),
    };
    const issues = [];
    if (!row.courseCode) issues.push('Course code is required');
    if (!row.title) issues.push('Title is required');
    if (!Number(row.creditHours)) issues.push('Credit hours must be a number');
    return { ...row, ok: issues.length === 0, message: issues.join('. ') };
  }

  if (kind === 'students') {
    const given = pick(raw, ['password', 'pass']);
    const row = {
      fullName: pick(raw, ['name', 'fullname', 'student']),
      registrationNumber: pick(raw, ['roll', 'rollno', 'registrationnumber', 'regno']),
      program: pick(raw, ['discipline', 'program', 'degree']),
      semester: pick(raw, ['semester', 'sem']),
      branch: pick(raw, ['branch', 'branchcode', 'centre', 'center']),
      email: pick(raw, ['email', 'mail']).toLowerCase(),
      password: given || makePassword(),
    };
    const issues = [];
    if (!row.fullName) issues.push('Name is required');
    if (!row.email || !row.email.includes('@')) issues.push('A valid email is required');
    if (!row.registrationNumber) issues.push('Roll number is required');
    if (row.password.length < 4) issues.push('Password must be at least 4 characters');
    return { ...row, ok: issues.length === 0, message: issues.join('. ') };
  }

  if (kind === 'registrations') {
    const row = {
      studentName: pick(raw, ['student', 'name', 'fullname']),
      email: pick(raw, ['email', 'mail']).toLowerCase(),
      registrationNumber: pick(raw, ['roll', 'rollno', 'registrationnumber', 'regno']),
      courseCode: pick(raw, ['coursecode', 'code']).toUpperCase(),
      title: pick(raw, ['title', 'course']),
    };
    const issues = [];
    if (!row.email && !row.registrationNumber) issues.push('Email or roll is required');
    if (!row.courseCode) issues.push('Course code is required');
    return { ...row, ok: issues.length === 0, message: issues.join('. ') };
  }

  const row = {
    courseCode: pick(raw, ['coursecode', 'course', 'code']).toUpperCase(),
    date: pick(raw, ['date']),
    startTime: pick(raw, ['starttime', 'start', 'time']),
    endTime: pick(raw, ['endtime', 'end']),
    capacity: pick(raw, ['capacity', 'seats']) || '30',
  };
  const issues = [];
  if (!row.courseCode) issues.push('Course code is required');
  if (!row.date || Number.isNaN(new Date(row.date).getTime())) issues.push('A valid date is required');
  if (!row.startTime) issues.push('Start time is required');
  if (row.endTime && row.endTime <= row.startTime) issues.push('End time must be after start time');
  if (!Number(row.capacity) || Number(row.capacity) < 1) issues.push('Capacity must be at least 1');
  return { ...row, ok: issues.length === 0, message: issues.join('. ') };
};

module.exports = {
  keyOf,
  cellText,
  pick,
  makePassword,
  difficultyOf,
  statusOf,
  previewRow,
};
