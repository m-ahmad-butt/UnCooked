import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';
import { Plus, Pencil, Trash2, Search, Loader2, Upload } from 'lucide-react';
import ImportSheet from '../../components/ImportSheet';

const isActive = (value) => String(value || '').toLowerCase() !== 'inactive';
const statusLabel = (value) => (isActive(value) ? 'Active' : 'Inactive');

const AdminBranches = () => {
  const navigate = useNavigate();
  const { say } = useGuide();
  const warn = useWarn();
  const [branches, setBranches] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getBranches({ page, search, limit: 10 });
      setBranches(data.branches || data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      warn('Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    try {
      await adminAPI.deleteBranch(deleteTarget.id || deleteTarget._id);
      say({ title: 'Done', body: 'Branch deleted', action: 'OK' });
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
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setImportOpen(true)} className="n-btn-secondary">
              <Upload size={16} /> Upload
            </button>
            <button onClick={() => navigate('/admin/branches/new')} className="n-btn">
              <Plus size={16} /> Add Branch
            </button>
          </div>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-muted"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search branches…"
            className="n-input pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-notion-muted" />
          </div>
        ) : branches.length === 0 ? (
          <div className="n-card p-12 text-center text-sm text-notion-muted">No branches found</div>
        ) : (
          <>
            <div className="hidden md:block n-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-notion-surface">
                    <th className="n-th">Name</th>
                    <th className="n-th">Code</th>
                    <th className="n-th">City</th>
                    <th className="n-th">Contact</th>
                    <th className="n-th">Status</th>
                    <th className="n-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr
                      key={b.id || b._id}
                      className="hover:bg-notion-surface/50 transition-colors"
                    >
                      <td className="n-td font-medium">{b.name}</td>
                      <td className="n-td">{b.code}</td>
                      <td className="n-td">{b.city}</td>
                      <td className="n-td">{b.contactNumber}</td>
                      <td className="n-td">
                        <span
                          className={`n-tag ${isActive(b.status) ? 'bg-notion-green-soft text-notion-green' : 'bg-notion-red-soft text-notion-red'}`}
                        >
                          {statusLabel(b.status)}
                        </span>
                      </td>
                      <td className="n-td text-right">
                        <button
                          onClick={() => navigate(`/admin/branches/${b.id || b._id}/edit`)}
                          className="n-btn-ghost p-1.5"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="n-btn-ghost p-1.5 text-notion-red"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {branches.map((b) => (
                <div key={b.id || b._id} className="n-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{b.name}</span>
                    <span
                      className={`n-tag ${isActive(b.status) ? 'bg-notion-green-soft text-notion-green' : 'bg-notion-red-soft text-notion-red'}`}
                    >
                      {statusLabel(b.status)}
                    </span>
                  </div>
                  <p className="text-xs text-notion-muted">
                    Code: {b.code} · City: {b.city}
                  </p>
                  <p className="text-xs text-notion-muted">Contact: {b.contactNumber}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/branches/${b.id || b._id}/edit`)}
                      className="n-btn-secondary py-1 px-2 text-xs"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="n-btn-danger py-1 px-2 text-xs"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Branch"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        danger
      />
      {importOpen && (
        <ImportSheet
          kind="branches"
          onClose={() => setImportOpen(false)}
          onDone={(result) => {
            setImportOpen(false);
            say({
              title: 'Import finished',
              body: `Saved ${result.created || 0}. Skipped ${result.skipped || 0}.`,
              action: 'OK',
            });
            load();
          }}
        />
      )}
    </div>
  );
};

export default AdminBranches;
