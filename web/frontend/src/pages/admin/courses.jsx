import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';
import { Plus, Pencil, Trash2, Search, Loader2, Upload } from 'lucide-react';
import ImportSheet from '../../components/ImportSheet';

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Artificial Intelligence',
  'Data Science',
  'Business Administration',
  'Mathematics',
  'Electrical Engineering',
];

const isActive = (value) => String(value || '').toLowerCase() !== 'inactive';
const statusLabel = (value) => (isActive(value) ? 'Active' : 'Inactive');
const levelLabel = (value) => (value === 'easy' ? 'Easy' : value === 'hard' ? 'Hard' : 'Medium');

const AdminCourses = () => {
  const navigate = useNavigate();
  const { say } = useGuide();
  const warn = useWarn();
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getCourses({ page, pageSize: 10, search, department });
      setCourses(data.courses || data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      warn('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [page, search, department]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try {
      await adminAPI.deleteCourse(deleteTarget.id || deleteTarget._id);
      say({ title: 'Done', body: 'Course deleted', action: 'OK' });
      setDeleteTarget(null);
      load();
    } catch (err) {
      warn(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="n-page">
      <AdminNavbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setImportOpen(true)} className="n-btn-secondary"><Upload size={16} /> Upload</button>
            <button onClick={() => navigate('/admin/courses/new')} className="n-btn"><Plus size={16} /> Add Course</button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-muted" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search courses" className="n-input pl-9" />
          </div>
          <select
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            className="n-input sm:max-w-xs"
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-notion-muted" /></div>
        ) : courses.length === 0 ? (
          <div className="n-card p-12 text-center text-sm text-notion-muted">No courses found</div>
        ) : (
          <>
            <div className="hidden md:block n-card overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-notion-surface">
                  <th className="n-th">Code</th><th className="n-th">Title</th><th className="n-th">Credit Hrs</th>
                  <th className="n-th">Department</th><th className="n-th">Level</th><th className="n-th">Status</th><th className="n-th text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id || c._id} className="hover:bg-notion-surface/50 transition-colors">
                      <td className="n-td font-medium">{c.courseCode}</td>
                      <td className="n-td">{c.title}</td>
                      <td className="n-td">{c.creditHours}</td>
                      <td className="n-td">{c.department}</td>
                      <td className="n-td">{levelLabel(c.difficulty)}</td>
                      <td className="n-td">
                        <span className={`n-tag ${isActive(c.status) ? 'bg-notion-green-soft text-notion-green' : 'bg-notion-red-soft text-notion-red'}`}>{statusLabel(c.status)}</span>
                      </td>
                      <td className="n-td text-right">
                        <button onClick={() => navigate(`/admin/courses/${c.id || c._id}/edit`)} className="n-btn-ghost p-1.5"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(c)} className="n-btn-ghost p-1.5 text-notion-red"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {courses.map((c) => (
                <div key={c.id || c._id} className="n-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{c.courseCode}</span>
                    <span className={`n-tag ${isActive(c.status) ? 'bg-notion-green-soft text-notion-green' : 'bg-notion-red-soft text-notion-red'}`}>{statusLabel(c.status)}</span>
                  </div>
                  <p className="text-sm">{c.title}</p>
                  <p className="text-xs text-notion-muted">{c.creditHours} credit hours, {c.department}, {levelLabel(c.difficulty)}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => navigate(`/admin/courses/${c.id || c._id}/edit`)} className="n-btn-secondary py-1 px-2 text-xs"><Pencil size={12} /> Edit</button>
                    <button onClick={() => setDeleteTarget(c)} className="n-btn-danger py-1 px-2 text-xs"><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Course" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmText="Delete" danger />
      {importOpen && (
        <ImportSheet
          kind="courses"
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

export default AdminCourses;
