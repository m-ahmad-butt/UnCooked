import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';
import { ArrowLeft, Loader2 } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Artificial Intelligence',
  'Data Science',
  'Business Administration',
  'Mathematics',
  'Electrical Engineering',
];

const empty = { courseCode: '', title: '', creditHours: 3, department: 'Computer Science', difficulty: 'medium', status: 'active' };
const isActive = (value) => String(value || '').toLowerCase() !== 'inactive';

const AdminCourseForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { say } = useGuide();
  const warn = useWarn();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await adminAPI.getCourse(id);
        const c = data.data || data;
        if (cancelled) return;
        setForm({
          courseCode: c.courseCode || '',
          title: c.title || '',
          creditHours: c.creditHours || 3,
          department: c.department || 'Computer Science',
          difficulty: c.difficulty || 'medium',
          status: isActive(c.status) ? 'active' : 'inactive',
        });
      } catch {
        warn('Failed to load course');
        navigate('/admin/courses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit, navigate]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.courseCode || !form.title) return warn('Course code and title are required');
    setSaving(true);
    try {
      if (isEdit) {
        await adminAPI.updateCourse(id, form);
        say({ title: 'Done', body: 'Course updated', action: 'OK' });
      } else {
        await adminAPI.createCourse(form);
        say({ title: 'Done', body: 'Course created', action: 'OK' });
      }
      navigate('/admin/courses');
    } catch (err) {
      warn(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="n-page">
      <AdminNavbar />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/courses')} className="n-btn-ghost p-2"><ArrowLeft size={18} /></button>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Course' : 'Add Course'}</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-notion-muted" /></div>
        ) : (
          <form onSubmit={handleSave} className="n-card space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="n-label">Course Code *</label><input value={form.courseCode} onChange={(e) => set('courseCode', e.target.value)} className="n-input" /></div>
              <div><label className="n-label">Title *</label><input value={form.title} onChange={(e) => set('title', e.target.value)} className="n-input" /></div>
              <div><label className="n-label">Credit Hours</label><input type="number" min="1" max="6" value={form.creditHours} onChange={(e) => set('creditHours', Number(e.target.value))} className="n-input" /></div>
              <div>
                <label className="n-label">Department</label>
                <select value={form.department} onChange={(e) => set('department', e.target.value)} className="n-input">
                  {DEPARTMENTS.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <label className="n-label">Level</label>
                <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} className="n-input">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="n-label">Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className="n-input">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => navigate('/admin/courses')} className="n-btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="n-btn">
                {saving ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : isEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminCourseForm;
