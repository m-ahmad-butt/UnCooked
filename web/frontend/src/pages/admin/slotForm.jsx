import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import AdminFormFrame from '../../components/AdminFormFrame';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';

const empty = { courseId: '', date: '', startTime: '', endTime: '', capacity: 30 };

const AdminSlotForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { say } = useGuide();
  const warn = useWarn();
  const [form, setForm] = useState(empty);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: courseData } = await adminAPI.getCourses({ limit: 200, pageSize: 200 });
        if (cancelled) return;
        setCourses(courseData.courses || courseData.data || []);

        if (isEdit) {
          const { data } = await adminAPI.getSlot(id);
          const s = data.data || data;
          setForm({
            courseId: s.course?.id || s.course?._id || s.courseId || s.course || '',
            date: s.date ? String(s.date).slice(0, 10) : '',
            startTime: s.startTime || '',
            endTime: s.endTime || '',
            capacity: s.capacity || 30,
          });
        }
      } catch {
        warn(isEdit ? 'Failed to load slot' : 'Failed to load courses');
        if (isEdit) navigate('/admin/slots');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.courseId || !form.date || !form.startTime || !form.endTime)
      return warn('All fields are required');
    setSaving(true);
    try {
      if (isEdit) {
        await adminAPI.updateSlot(id, form);
        say({ title: 'Done', body: 'Slot updated', action: 'OK' });
      } else {
        await adminAPI.createSlot(form);
        say({ title: 'Done', body: 'Slot created', action: 'OK' });
      }
      navigate('/admin/slots');
    } catch (err) {
      warn(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="n-page">
      <AdminNavbar />
      <AdminFormFrame
        title={isEdit ? 'Edit Slot' : 'Add Slot'}
        onBack={() => navigate('/admin/slots')}
        loading={loading}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="n-label">Course *</label>
            <select
              value={form.courseId}
              onChange={(e) => set('courseId', e.target.value)}
              className="n-input"
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.courseCode} — {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="n-label">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="n-input"
              />
            </div>
            <div>
              <label className="n-label">Start Time *</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className="n-input"
              />
            </div>
            <div>
              <label className="n-label">End Time *</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                className="n-input"
              />
            </div>
          </div>
          <div>
            <label className="n-label">Capacity</label>
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => set('capacity', Number(e.target.value))}
              className="n-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/slots')}
              className="n-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="n-btn">
              {saving ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isEdit ? (
                'Update'
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </AdminFormFrame>
    </div>
  );
};

export default AdminSlotForm;
