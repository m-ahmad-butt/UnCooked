import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import AdminFormFrame from '../../components/AdminFormFrame';
import CnicInput from '../../components/CnicInput';
import PhoneInput from '../../components/PhoneInput';
import SemesterInput from '../../components/SemesterInput';
import { adminAPI } from '../../utils/api';
import { useGuide, useWarn } from '../../components/GuideModal';
import { cnicError, formatCnic, phoneError, semesterError } from '../../utils/validators';
import { Loader2, ScanLine } from 'lucide-react';

const emptyPersonal = { fullName: '', email: '', phone: '', cnic: '', dob: '', gender: '', address: '' };
const emptyParent = { fatherName: '', parentCnic: '', parentOccupation: '', parentContact: '', emergencyContact: '' };
const emptyAcademic = { registrationNumber: '', program: '', semester: '', session: '', previousQualification: '', previousInstitute: '', previousMarks: '' };

const AdminStudentForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { say } = useGuide();
  const warn = useWarn();
  const [tab, setTab] = useState('personal');
  const [personal, setPersonal] = useState(emptyPersonal);
  const [parent, setParent] = useState(emptyParent);
  const [academic, setAcademic] = useState(emptyAcademic);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [parentOcrLoading, setParentOcrLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await adminAPI.getStudent(id);
        const s = data.data || data.student || data;
        if (cancelled) return;
        setPersonal({
          fullName: s.fullName || '',
          email: s.email || '',
          phone: s.phone || '',
          cnic: formatCnic(s.cnic || ''),
          dob: s.dob ? String(s.dob).slice(0, 10) : '',
          gender: s.gender || '',
          address: s.address || '',
        });
        setParent({
          fatherName: s.fatherName || '',
          parentCnic: formatCnic(s.parentCnic || ''),
          parentOccupation: s.parentOccupation || '',
          parentContact: s.parentContact || '',
          emergencyContact: s.emergencyContact || '',
        });
        setAcademic({
          registrationNumber: s.registrationNumber || '',
          program: s.program || '',
          semester: s.semester != null ? String(s.semester) : '',
          session: s.session || '',
          previousQualification: s.previousQualification || '',
          previousInstitute: s.previousInstitute || '',
          previousMarks: s.previousMarks || '',
        });
      } catch {
        warn('Failed to load student');
        navigate('/admin/students');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit, navigate]);

  const setP = (k, v) => setPersonal((p) => ({ ...p, [k]: v }));
  const setPr = (k, v) => setParent((p) => ({ ...p, [k]: v }));
  const setA = (k, v) => setAcademic((p) => ({ ...p, [k]: v }));

  const backTo = isEdit ? `/admin/students/${id}` : '/admin/students';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!personal.fullName || (!isEdit && !personal.email)) {
      setTab('personal');
      return warn('Name and email are required');
    }
    if (!isEdit && !String(academic.registrationNumber || '').trim()) {
      setTab('academic');
      return warn('Registration number is required');
    }
    const semErr = semesterError(academic.semester);
    if (semErr) {
      setTab('academic');
      return warn(semErr);
    }
    if (!isEdit) {
      try {
        const { data } = await adminAPI.checkStudentFields({
          email: personal.email.trim(),
          registrationNumber: String(academic.registrationNumber).trim(),
        });
        if (data && data.ok === false) {
          if (data.field === 'email') setTab('personal');
          else setTab('academic');
          return warn(data.message || 'Check that again');
        }
      } catch (err) {
        return warn(err.response?.data?.message || 'Could not verify student fields');
      }
    }
    setSaving(true);
    try {
      if (isEdit) {
        const { email, ...personalRest } = personal;
        await adminAPI.updateStudent(id, { ...personalRest, ...parent, ...academic });
        say({ title: 'Done', body: 'Student updated', action: 'OK' });
        navigate(`/admin/students/${id}`);
      } else {
        await adminAPI.createStudent({ ...personal, ...parent, ...academic });
        say({
          title: 'Done',
          body: 'Student created. Use Send passwords on the Students page to email their login.',
          action: 'OK',
        });
        navigate('/admin/students');
      }
    } catch (err) {
      const msg = err.response?.data?.message || (isEdit ? 'Failed to update student' : 'Failed to create student');
      if (/email/i.test(msg)) setTab('personal');
      else if (/registration/i.test(msg)) setTab('academic');
      warn(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCnicUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOcrLoading(true);
    try {
      const form = new FormData();
      form.append('cnic', file);
      const { data } = await adminAPI.ocrCnic(form);
      const fields = data.data || data;
      setPersonal((p) => ({
        ...p,
        fullName: fields.fullName || p.fullName,
        cnic: formatCnic(fields.cnic || p.cnic),
        dob: fields.dob ? String(fields.dob).slice(0, 10) : p.dob,
        gender: fields.gender || p.gender,
        address: fields.address || p.address,
      }));
      if (fields.fatherName) setParent((p) => ({ ...p, fatherName: fields.fatherName }));
      setTab('personal');
      say({ title: 'Done', body: 'CNIC fields autofilled — review before saving', action: 'OK' });
    } catch (err) {
      warn(err.response?.data?.message || 'CNIC OCR failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleParentCnicUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setParentOcrLoading(true);
    try {
      const form = new FormData();
      form.append('cnic', file);
      const { data } = await adminAPI.ocrCnic(form);
      const fields = data.data || data;
      setParent((p) => ({
        ...p,
        fatherName: fields.fullName || fields.fatherName || p.fatherName,
        parentCnic: formatCnic(fields.cnic || p.parentCnic),
      }));
      setTab('parent');
      say({ title: 'Done', body: 'Parent CNIC fields autofilled — review before saving', action: 'OK' });
    } catch (err) {
      warn(err.response?.data?.message || 'Parent CNIC OCR failed');
    } finally {
      setParentOcrLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'parent', label: 'Parent' },
    { id: 'academic', label: 'Academic' },
  ];
  const stepIndex = tabs.findIndex((t) => t.id === tab);
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex === tabs.length - 1;

  const goBack = () => {
    if (!isFirst) setTab(tabs[stepIndex - 1].id);
  };

  const goNext = async () => {
    if (tab === 'personal') {
      if (!personal.fullName || (!isEdit && !personal.email)) {
        return warn('Name and email are required');
      }
      const phoneErr = phoneError(personal.phone);
      if (phoneErr) return warn(phoneErr);
      const cnicErr = cnicError(personal.cnic);
      if (cnicErr) return warn(cnicErr);
      if (!isEdit) {
        try {
          const { data } = await adminAPI.checkStudentFields({ email: personal.email.trim() });
          if (data && data.ok === false) {
            return warn(data.message || 'Email already exists');
          }
        } catch (err) {
          return warn(err.response?.data?.message || 'Could not verify email');
        }
      }
    }
    if (tab === 'parent') {
      const parentCnicErr = cnicError(parent.parentCnic);
      if (parentCnicErr) return warn(parentCnicErr);
      const parentPhoneErr = phoneError(parent.parentContact);
      if (parentPhoneErr) return warn(parentPhoneErr);
      const emergencyErr = phoneError(parent.emergencyContact);
      if (emergencyErr) return warn(emergencyErr);
    }
    if (isLast) return;
    setTab(tabs[stepIndex + 1].id);
  };

  return (
    <div className="n-page">
      <AdminNavbar />
      <AdminFormFrame
        title={isEdit ? 'Edit Student' : 'Add Student'}
        onBack={() => navigate(backTo)}
        loading={loading}
      >
        <div>
          <div className="mb-4 flex gap-1 rounded-notion bg-notion-surface p-1">
            {tabs.map((t) => {
              const isCurrent = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!isCurrent}
                  title={isCurrent ? undefined : 'Use Back / Next to change steps'}
                  className={`flex-1 rounded-notion px-3 py-1.5 text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-notion-text text-white shadow-sm'
                      : 'cursor-not-allowed text-notion-muted/45'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              // Never auto-submit on Enter when changing steps — that was
              // firing "Registration number required" as soon as Academic opened.
              e.preventDefault();
              if (!isLast) goNext();
            }}
            className="space-y-4"
          >
            {tab === 'personal' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded-notion border border-dashed border-notion-border bg-notion-surface p-3">
                  <ScanLine size={16} className="text-notion-muted" />
                  <span className="text-sm text-notion-muted">Autofill from CNIC image</span>
                  <label className="n-btn-secondary cursor-pointer text-xs">
                    {ocrLoading ? <Loader2 size={14} className="animate-spin" /> : 'Upload CNIC'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={ocrLoading} onChange={handleCnicUpload} />
                  </label>
                </div>
                <div><label className="n-label">Full Name *</label><input value={personal.fullName} onChange={(e) => setP('fullName', e.target.value)} className="n-input" /></div>
                <div>
                  <label className="n-label">Email {isEdit ? '' : '*'}</label>
                  <input type="email" value={personal.email} onChange={(e) => setP('email', e.target.value)} className="n-input" disabled={isEdit} />
                </div>
                <div><label className="n-label">Phone</label><PhoneInput value={personal.phone} onChange={(v) => setP('phone', v)} /></div>
                <div><label className="n-label">CNIC</label><CnicInput value={personal.cnic} onChange={(v) => setP('cnic', v)} /></div>
                <div><label className="n-label">Date of Birth</label><input type="date" value={personal.dob} onChange={(e) => setP('dob', e.target.value)} className="n-input" /></div>
                <div>
                  <label className="n-label">Gender</label>
                  <select value={personal.gender} onChange={(e) => setP('gender', e.target.value)} className="n-input">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2"><label className="n-label">Address</label><input value={personal.address} onChange={(e) => setP('address', e.target.value)} className="n-input" /></div>
              </div>
            )}
            {tab === 'parent' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded-notion border border-dashed border-notion-border bg-notion-surface p-3">
                  <ScanLine size={16} className="text-notion-muted" />
                  <span className="text-sm text-notion-muted">Autofill from parent CNIC image</span>
                  <label className="n-btn-secondary cursor-pointer text-xs">
                    {parentOcrLoading ? <Loader2 size={14} className="animate-spin" /> : 'Upload Parent CNIC'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={parentOcrLoading} onChange={handleParentCnicUpload} />
                  </label>
                </div>
                <div><label className="n-label">Father&apos;s Name</label><input value={parent.fatherName} onChange={(e) => setPr('fatherName', e.target.value)} className="n-input" /></div>
                <div><label className="n-label">Parent CNIC</label><CnicInput value={parent.parentCnic} onChange={(v) => setPr('parentCnic', v)} /></div>
                <div><label className="n-label">Occupation</label><input value={parent.parentOccupation} onChange={(e) => setPr('parentOccupation', e.target.value)} className="n-input" /></div>
                <div><label className="n-label">Parent Contact</label><PhoneInput value={parent.parentContact} onChange={(v) => setPr('parentContact', v)} /></div>
                <div className="sm:col-span-2"><label className="n-label">Emergency Contact</label><PhoneInput value={parent.emergencyContact} onChange={(v) => setPr('emergencyContact', v)} /></div>
              </div>
            )}
            {tab === 'academic' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="n-label">Registration Number *</label><input value={academic.registrationNumber} onChange={(e) => setA('registrationNumber', e.target.value)} className="n-input" disabled={isEdit} placeholder="e.g. FA20-BCS-001" /></div>
                <div><label className="n-label">Program</label><input value={academic.program} onChange={(e) => setA('program', e.target.value)} className="n-input" placeholder="e.g. BSCS" /></div>
                <div><label className="n-label">Semester</label><SemesterInput value={academic.semester} onChange={(v) => setA('semester', v)} /></div>
                <div><label className="n-label">Session</label><input value={academic.session} onChange={(e) => setA('session', e.target.value)} className="n-input" placeholder="e.g. Fall 2026" /></div>
                <div><label className="n-label">Previous Qualification</label><input value={academic.previousQualification} onChange={(e) => setA('previousQualification', e.target.value)} className="n-input" /></div>
                <div><label className="n-label">Previous Institute</label><input value={academic.previousInstitute} onChange={(e) => setA('previousInstitute', e.target.value)} className="n-input" /></div>
                <div><label className="n-label">Previous Marks / %</label><input value={academic.previousMarks} onChange={(e) => setA('previousMarks', e.target.value)} className="n-input" /></div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button type="button" onClick={() => navigate(backTo)} className="n-btn-secondary">Cancel</button>
              <div className="flex flex-wrap gap-2">
                {!isFirst && (
                  <button type="button" onClick={goBack} className="n-btn-secondary">Back</button>
                )}
                {!isLast ? (
                  <button key="next-step" type="button" onClick={goNext} className="n-btn">Next</button>
                ) : (
                  <button
                    key="add-student"
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="n-btn"
                  >
                    {saving
                      ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : isEdit ? 'Save Changes' : 'Add Student'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </AdminFormFrame>
    </div>
  );
};

export default AdminStudentForm;
