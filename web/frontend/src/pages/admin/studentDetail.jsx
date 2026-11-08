import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import ConfirmModal from '../../components/ConfirmModal';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';
import { ArrowLeft, Plus, Trash2, Loader2, AlertTriangle, KeyRound, Upload } from 'lucide-react';
import ImportSheet from '../../components/ImportSheet';

const AdminStudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { say } = useGuide();
  const warn = useWarn();
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const loadStudent = useCallback(async () => {
    try {
      const { data } = await adminAPI.getStudent(id);
      const next = data.data || data.student || data;
      setStudent(next && next.fullName ? next : null);
    } catch {
      warn('Failed to load student');
      navigate('/admin/students');
    }
  }, [id, navigate]);

  const loadAssignments = useCallback(async () => {
    try {
      const { data } = await adminAPI.getStudentAssignments(id);
      const rows = data.data || data.assignments || data;
      setAssignments(Array.isArray(rows) ? rows : []);
    } catch {
      /* ignore */
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadStudent(), loadAssignments()]);
      setLoading(false);
    };
    init();
  }, [loadStudent, loadAssignments]);

  const openAssign = async () => {
    try {
      const { data } = await adminAPI.getCourses({ pageSize: 100 });
      const rows = data.data || data.courses || [];
      setCourses(Array.isArray(rows) ? rows : []);
    } catch {
      warn('Failed to load courses');
    }
    setSelectedCourse('');
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedCourse) return warn('Select a course');
    setAssigning(true);
    try {
      await adminAPI.assignCourse({ studentId: id, courseId: selectedCourse });
      say({ title: 'Done', body: 'Course assigned', action: 'OK' });
      setAssignOpen(false);
      loadAssignments();
    } catch (err) {
      warn(err.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async () => {
    try {
      await adminAPI.removeAssignment(removeTarget._id);
      say({ title: 'Done', body: 'Assignment removed', action: 'OK' });
      setRemoveTarget(null);
      loadAssignments();
    } catch (err) {
      warn(err.response?.data?.message || 'Failed to remove');
    }
  };

  const assignedIds = assignments.map((a) => String(a.course?.id || a.course?._id || a.courseId || ''));

  if (loading) return (
    <div className="n-page">
      <AdminNavbar />
      <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-notion-muted" /></div>
    </div>
  );

  if (!student) return null;

  const count = assignments.length;

  return (
    <div className="n-page">
      <AdminNavbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/admin/students')} className="n-btn-ghost p-2"><ArrowLeft size={18} /></button>
          <div className="flex-1 min-w-[12rem]">
            <h1 className="text-2xl font-bold tracking-tight">{student.fullName}</h1>
            <p className="text-sm text-notion-muted">{student.registrationNumber} · {student.email}</p>
          </div>
          <button
            onClick={async () => {
              try {
                const { data } = await adminAPI.resetStudentPassword(id);
                const password = data.data?.password;
                const emailed = data.data?.emailed;
                say({
                  title: 'Password reset',
                  body: emailed
                    ? `Emailed to ${student.email}. New password: ${password}`
                    : `Email failed. New password: ${password}`,
                  action: 'OK',
                });
              } catch (err) {
                warn(err.response?.data?.message || 'Could not reset password');
              }
            }}
            className="n-btn-secondary"
          >
            <KeyRound size={16} /> Reset password
          </button>
          <button onClick={() => navigate(`/admin/students/${id}/edit`)} className="n-btn-secondary">Edit</button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="n-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-notion-muted">Personal</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-notion-muted text-xs">Phone</dt><dd>{student.phone || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">CNIC</dt><dd>{student.cnic || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">DOB</dt><dd>{student.dob ? new Date(student.dob).toLocaleDateString() : '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Gender</dt><dd>{student.gender || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Address</dt><dd>{student.address || '—'}</dd></div>
            </dl>
          </div>
          <div className="n-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-notion-muted">Parent / Guardian</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-notion-muted text-xs">Father&apos;s Name</dt><dd>{student.fatherName || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Parent CNIC</dt><dd>{student.parentCnic || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Occupation</dt><dd>{student.parentOccupation || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Contact</dt><dd>{student.parentContact || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Emergency</dt><dd>{student.emergencyContact || '—'}</dd></div>
            </dl>
          </div>
          <div className="n-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-notion-muted">Academic</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-notion-muted text-xs">Program</dt><dd>{student.program || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Semester</dt><dd>{student.semester || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Session</dt><dd>{student.session || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Branch</dt><dd>{student.branch?.name || '—'}</dd></div>
              <div><dt className="text-notion-muted text-xs">Date Sheet</dt>
                <dd><span className={`n-tag ${student.dateSheetSaved ? 'bg-notion-green-soft text-notion-green' : 'bg-notion-yellow-soft text-notion-yellow'}`}>{student.dateSheetSaved ? 'Saved' : 'Pending'}</span></dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="n-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Course Assignments</h3>
              <p className="text-sm text-notion-muted">{count}/6 courses assigned</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setImportOpen(true)} className="n-btn-secondary text-xs"><Upload size={14} /> Upload CSV</button>
              <button onClick={openAssign} disabled={count >= 6} className="n-btn text-xs"><Plus size={14} /> Assign Course</button>
            </div>
          </div>

          {(count < 4 || count > 6) && (
            <div className={`mb-4 flex items-center gap-2 rounded-notion p-3 text-sm ${count < 4 ? 'bg-notion-yellow-soft text-notion-yellow' : 'bg-notion-red-soft text-notion-red'}`}>
              <AlertTriangle size={16} />
              {count < 4 ? 'Student has less than 4 courses assigned' : 'Student has more than 6 courses assigned'}
            </div>
          )}

          <div className="w-full mb-2 h-2 rounded-full bg-notion-surface overflow-hidden">
            <div className={`h-full rounded-full transition-all ${count >= 4 && count <= 6 ? 'bg-notion-green' : count < 4 ? 'bg-notion-yellow' : 'bg-notion-red'}`} style={{ width: `${Math.min((count / 6) * 100, 100)}%` }} />
          </div>

          {assignOpen && (
            <div className="mb-4 rounded-notion border border-notion-border bg-notion-surface p-4">
              <h4 className="mb-3 text-sm font-semibold">Assign a course</h4>
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="n-input mb-3">
                <option value="">Select a course…</option>
                {courses.filter((c) => !assignedIds.includes(String(c.id || c._id))).map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.courseCode} — {c.title}</option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="mb-3 text-xs text-notion-muted">No courses in the catalog yet. Upload them on the Courses page first.</p>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setAssignOpen(false)} className="n-btn-secondary">Cancel</button>
                <button onClick={handleAssign} disabled={assigning || !selectedCourse} className="n-btn">
                  {assigning ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Assign'}
                </button>
              </div>
            </div>
          )}

          {assignments.length === 0 ? (
            <p className="py-6 text-center text-sm text-notion-muted">No courses assigned yet</p>
          ) : (
            <div className="mt-4 space-y-2">
              {assignments.map((a) => (
                <div key={a._id} className="flex items-center justify-between rounded-notion border border-notion-border px-4 py-3">
                  <div>
                    <span className="font-medium text-sm">{a.course?.courseCode || a.courseCode}</span>
                    <span className="ml-2 text-sm text-notion-muted">{a.course?.title || a.courseTitle}</span>
                  </div>
                  <button onClick={() => setRemoveTarget(a)} className="n-btn-ghost p-1.5 text-notion-red"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove} title="Remove Assignment" message={`Remove "${removeTarget?.course?.title || removeTarget?.courseTitle}" from this student?`} confirmText="Remove" danger />
      {importOpen && (
        <ImportSheet
          kind="registrations"
          onClose={() => setImportOpen(false)}
          onDone={(result) => {
            setImportOpen(false);
            setAssignOpen(false);
            say({ title: 'Import finished', body: `Added ${result.created || 0}. Skipped ${result.skipped || 0}.`, action: 'OK' });
            loadAssignments();
          }}
        />
      )}
    </div>
  );
};

export default AdminStudentDetail;
