import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import AdminFormFrame from '../../components/AdminFormFrame';
import PhoneInput from '../../components/PhoneInput';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';
import { phoneError } from '../../utils/validators';

const empty = { name: '', code: '', city: '', address: '', contactNumber: '', status: 'active' };
const isActive = (value) => String(value || '').toLowerCase() !== 'inactive';

const AdminBranchForm = () => {
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
        const { data } = await adminAPI.getBranch(id);
        const b = data.data || data;
        if (cancelled) return;
        setForm({
          name: b.name || '',
          code: b.code || '',
          city: b.city || '',
          address: b.address || '',
          contactNumber: b.contactNumber || '',
          status: isActive(b.status) ? 'active' : 'inactive',
        });
      } catch {
        warn('Failed to load branch');
        navigate('/admin/branches');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit, navigate]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.city) return warn('Name, code, and city are required');
    const phoneErr = phoneError(form.contactNumber);
    if (phoneErr) return warn(phoneErr);
    setSaving(true);
    try {
      if (isEdit) {
        await adminAPI.updateBranch(id, form);
        say({ title: 'Done', body: 'Branch updated', action: 'OK' });
      } else {
        await adminAPI.createBranch(form);
        say({ title: 'Done', body: 'Branch created', action: 'OK' });
      }
      navigate('/admin/branches');
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
        title={isEdit ? 'Edit Branch' : 'Add Branch'}
        onBack={() => navigate('/admin/branches')}
        loading={loading}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="n-label">Name *</label><input value={form.name} onChange={(e) => set('name', e.target.value)} className="n-input" /></div>
            <div><label className="n-label">Code *</label><input value={form.code} onChange={(e) => set('code', e.target.value)} className="n-input" /></div>
            <div><label className="n-label">City *</label><input value={form.city} onChange={(e) => set('city', e.target.value)} className="n-input" /></div>
            <div><label className="n-label">Contact Number</label><PhoneInput value={form.contactNumber} onChange={(v) => set('contactNumber', v)} /></div>
          </div>
          <div><label className="n-label">Address</label><input value={form.address} onChange={(e) => set('address', e.target.value)} className="n-input" /></div>
          <div>
            <label className="n-label">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="n-input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/admin/branches')} className="n-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="n-btn">
              {saving ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </AdminFormFrame>
    </div>
  );
};

export default AdminBranchForm;
