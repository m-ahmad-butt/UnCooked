import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';
import { Plus, Pencil, Trash2, Loader2, Filter, Upload } from 'lucide-react';
import ImportSheet from '../../components/ImportSheet';

const AdminSlots = () => {
  const navigate = useNavigate();
  const { say } = useGuide();
  const warn = useWarn();
  const [slots, setSlots] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filterCourse, setFilterCourse] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await adminAPI.getCourses({ limit: 200 });
        setCourses(data.courses || data.data || []);
      } catch { /* ignore */ }
    };
    fetchCourses();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterCourse) params.courseId = filterCourse;
      const { data } = await adminAPI.getSlots(params);
      setSlots(data.slots || data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      warn('Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, [page, filterCourse]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if ((deleteTarget?.booked || 0) > 0) return warn('Cannot delete a slot that has bookings');
    try {
      await adminAPI.deleteSlot(deleteTarget.id || deleteTarget._id);
      say({ title: 'Done', body: 'Slot deleted', action: 'OK' });
      setDeleteTarget(null);
      load();
    } catch (err) {
      warn(err.response?.data?.message || 'Failed to delete');
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="n-page">
      <AdminNavbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Exam Slots</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setImportOpen(true)} className="n-btn-secondary"><Upload size={16} /> Upload</button>
            <button onClick={() => navigate('/admin/slots/new')} className="n-btn"><Plus size={16} /> Add Slot</button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 max-w-sm">
          <Filter size={16} className="text-notion-muted" />
          <select value={filterCourse} onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }} className="n-input">
            <option value="">All Courses</option>
            {courses.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.courseCode} — {c.title}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-notion-muted" /></div>
        ) : slots.length === 0 ? (
          <div className="n-card p-12 text-center text-sm text-notion-muted">No exam slots found</div>
        ) : (
          <>
            <div className="hidden md:block n-card overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-notion-surface">
                  <th className="n-th">Course</th><th className="n-th">Date</th><th className="n-th">Start</th>
                  <th className="n-th">End</th><th className="n-th">Capacity</th><th className="n-th">Booked</th>
                  <th className="n-th text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.id || s._id} className="hover:bg-notion-surface/50 transition-colors">
                      <td className="n-td font-medium">{s.course?.courseCode || '—'} <span className="text-notion-muted font-normal">— {s.course?.title}</span></td>
                      <td className="n-td">{fmtDate(s.date)}</td>
                      <td className="n-td">{s.startTime}</td>
                      <td className="n-td">{s.endTime}</td>
                      <td className="n-td">{s.capacity}</td>
                      <td className="n-td">{s.booked || 0}</td>
                      <td className="n-td text-right">
                        <button onClick={() => navigate(`/admin/slots/${s.id || s._id}/edit`)} className="n-btn-ghost p-1.5"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(s)} className="n-btn-ghost p-1.5 text-notion-red" disabled={(s.booked || 0) > 0}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {slots.map((s) => (
                <div key={s.id || s._id} className="n-card p-4">
                  <div className="mb-1 font-semibold text-sm">{s.course?.courseCode} — {s.course?.title}</div>
                  <p className="text-xs text-notion-muted">{fmtDate(s.date)} · {s.startTime} – {s.endTime}</p>
                  <p className="text-xs text-notion-muted">Capacity: {s.capacity} · Booked: {s.booked || 0}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => navigate(`/admin/slots/${s.id || s._id}/edit`)} className="n-btn-secondary py-1 px-2 text-xs"><Pencil size={12} /> Edit</button>
                    <button onClick={() => setDeleteTarget(s)} className="n-btn-danger py-1 px-2 text-xs" disabled={(s.booked || 0) > 0}><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Slot" message="Are you sure you want to delete this exam slot?" confirmText="Delete" danger />
      {importOpen && (
        <ImportSheet
          kind="slots"
          onClose={() => setImportOpen(false)}
          onDone={(result) => {
            setImportOpen(false);
            say({ title: 'Import finished', body: `Saved ${result.created || 0}. Skipped ${result.skipped || 0}.`, action: 'OK' });
            load();
          }}
        />
      )}
    </div>
  );
};

export default AdminSlots;
