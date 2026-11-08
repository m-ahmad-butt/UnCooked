import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';
import { Plus, Trash2, Search, Loader2, Eye, Upload, KeyRound, Mail } from 'lucide-react';
import ImportSheet from '../../components/ImportSheet';

const AdminStudents = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { say } = useGuide();
  const warn = useWarn();
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(params.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importKind, setImportKind] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getStudents({ page, search, limit: 10 });
      setStudents(data.students || data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      warn('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const deliverPasswords = async (ids) => {
    try {
      const { data } = await adminAPI.sendStudentPasswords(ids ? { ids } : {});
      const sent = data.data?.sent || 0;
      const reset = data.data?.reset || 0;
      say({
        title: reset && !sent ? 'Passwords reset' : 'Passwords sent',
        body: data.message || 'Done',
        action: 'OK',
      });
      load();
    } catch (err) {
      warn(err.response?.data?.message || 'Could not email passwords');
    }
  };

  const handleDelete = async () => {
    try {
      await adminAPI.deleteStudent(deleteTarget.id || deleteTarget._id);
      say({ title: 'Done', body: 'Student deleted', action: 'OK' });
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
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => deliverPasswords()} className="n-btn-secondary"><Mail size={16} /> Send all</button>
            <button onClick={() => setImportKind('students')} className="n-btn-secondary"><Upload size={16} /> Upload students</button>
            <button onClick={() => setImportKind('registrations')} className="n-btn-secondary"><Upload size={16} /> Upload courses</button>
            <button onClick={() => navigate('/admin/students/new')} className="n-btn"><Plus size={16} /> Add Student</button>
          </div>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search students…" className="n-input pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-notion-muted" /></div>
        ) : students.length === 0 ? (
          <div className="n-card p-12 text-center text-sm text-notion-muted">No students found</div>
        ) : (
          <>
            <div className="hidden md:block n-card overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-notion-surface">
                  <th className="n-th">Reg No</th><th className="n-th">Name</th><th className="n-th">Email</th>
                  <th className="n-th">Program</th><th className="n-th">Semester</th><th className="n-th">Branch</th>
                  <th className="n-th">DateSheet</th><th className="n-th text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id || s._id} className="hover:bg-notion-surface/50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/students/${s.id || s._id}`)}>
                      <td className="n-td font-medium">{s.registrationNumber}</td>
                      <td className="n-td">{s.fullName}</td>
                      <td className="n-td text-notion-muted">{s.email}</td>
                      <td className="n-td">{s.program}</td>
                      <td className="n-td">{s.semester || 'Not set'}</td>
                      <td className="n-td">{s.branch?.name || 'Not set'}</td>
                      <td className="n-td">
                        <span className={`n-tag ${s.dateSheetSaved ? 'bg-notion-green-soft text-notion-green' : 'bg-notion-yellow-soft text-notion-yellow'}`}>
                          {s.dateSheetSaved ? 'Saved' : 'Pending'}
                        </span>
                      </td>
                      <td className="n-td text-right" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => deliverPasswords([s.id || s._id])} className="n-btn-ghost p-1.5" title={s.passwordSent ? 'Reset password' : 'Send password'}><KeyRound size={14} /></button>
                        <button onClick={() => navigate(`/admin/students/${s.id || s._id}`)} className="n-btn-ghost p-1.5"><Eye size={14} /></button>
                        <button onClick={() => setDeleteTarget(s)} className="n-btn-ghost p-1.5 text-notion-red"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {students.map((s) => (
                <div key={s.id || s._id} className="n-card p-4 cursor-pointer" onClick={() => navigate(`/admin/students/${s.id || s._id}`)}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold">{s.fullName}</span>
                    <span className={`n-tag ${s.dateSheetSaved ? 'bg-notion-green-soft text-notion-green' : 'bg-notion-yellow-soft text-notion-yellow'}`}>
                      {s.dateSheetSaved ? 'Saved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-notion-muted">{s.registrationNumber} · {s.email}</p>
                  <p className="text-xs text-notion-muted">{s.program}, semester {s.semester || 'not set'}, {s.branch?.name || 'no branch'}</p>
                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setDeleteTarget(s)} className="n-btn-danger py-1 px-2 text-xs"><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Student" message={`Delete "${deleteTarget?.fullName}"? This cannot be undone.`} confirmText="Delete" danger />
      {importKind && (
        <ImportSheet
          kind={importKind}
          onClose={() => setImportKind(null)}
          onDone={(result) => {
            setImportKind(null);
            say({ title: 'Import finished', body: `Added ${result.created || 0}. Skipped ${result.skipped || 0}.`, action: 'OK' });
            load();
          }}
        />
      )}
    </div>
  );
};

export default AdminStudents;
