import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { X, Save, Search } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const RequisitionSelectionModal = lazy(() => import('../Requisitions/RequisitionSelectionModal'));

const JobApplicationModal = ({ show, record, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);

  const [form, setForm] = useState({
    job_id: '',
    candidate_first_name: '',
    candidate_last_name: '',
    email: '',
    phone: '',
    current_company: '',
    current_position: '',
    years_experience: 0,
    current_ctc: '',
    expected_ctc: '',
    notice_period_days: '',
    resume_url: '',
    source: 'career_portal',
  });

  useEffect(() => {
    if (record) {
      setForm({
        job_id: record.job_id || '',
        candidate_first_name: record.candidate_first_name || '',
        candidate_last_name: record.candidate_last_name || '',
        email: record.email || '',
        phone: record.phone || '',
        current_company: record.current_company || '',
        current_position: record.current_position || '',
        years_experience: record.years_experience || 0,
        current_ctc: record.current_ctc || '',
        expected_ctc: record.expected_ctc || '',
        notice_period_days: record.notice_period_days || '',
        resume_url: record.resume_url || '',
        source: record.source || 'career_portal',
      });
      if (record.job) {
        setSelectedRequisition(record.job);
      } else {
        setSelectedRequisition(null);
      }
    } else {
      setForm({
        job_id: '',
        candidate_first_name: '',
        candidate_last_name: '',
        email: '',
        phone: '',
        current_company: '',
        current_position: '',
        years_experience: 0,
        current_ctc: '',
        expected_ctc: '',
        notice_period_days: '',
        resume_url: '',
        source: 'career_portal',
      });
      setSelectedRequisition(null);
    }
    setErrors({});
  }, [record, show]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleRequisitionSelect = useCallback((req) => {
    if (req) {
      setForm(prev => ({ ...prev, job_id: req.job_requisition_id }));
      setSelectedRequisition(req);
    }
    setShowRequisitionModal(false);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.job_id) errs.job_id = 'Requisition is required';
    if (!form.candidate_first_name.trim()) errs.candidate_first_name = 'First name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, years_experience: parseInt(form.years_experience) || 0 };
      if (record) {
        await hrAPI.updateJobApplication(record.job_app_id, payload);
      } else {
        await hrAPI.createJobApplication(payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-2 z-50">
        <div className="bg-white rounded-md max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-3 border-b">
            <h2 className="text-sm font-semibold">{record ? 'Edit Application' : 'New Application'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[10px]">
            <div>
              <label className="block font-medium mb-0.5">Requisition <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => setShowRequisitionModal(true)}
                className={`w-full flex items-center justify-between px-2 py-1.5 border rounded text-xs ${errors.job_id ? 'border-red-500' : ''}`}
                disabled={loading || !!record}
              >
                <span className={selectedRequisition ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedRequisition ? `${selectedRequisition.title} (${selectedRequisition.requisition_code})` : 'Select Requisition'}
                </span>
                <Search className="w-3 h-3 text-gray-400" />
              </button>
              {errors.job_id && <p className="text-red-600 text-[9px] mt-0.5">{errors.job_id}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.candidate_first_name}
                  onChange={e => handleChange('candidate_first_name', e.target.value)}
                  className={`w-full border rounded px-2 py-1 ${errors.candidate_first_name ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.candidate_first_name && <p className="text-red-600 text-[9px] mt-0.5">{errors.candidate_first_name}</p>}
              </div>
              <div>
                <label className="block font-medium mb-0.5">Last Name</label>
                <input
                  type="text"
                  value={form.candidate_last_name}
                  onChange={e => handleChange('candidate_last_name', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={`w-full border rounded px-2 py-1 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.email && <p className="text-red-600 text-[9px] mt-0.5">{errors.email}</p>}
              </div>
              <div>
                <label className="block font-medium mb-0.5">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Current Company</label>
                <input
                  type="text"
                  value={form.current_company}
                  onChange={e => handleChange('current_company', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block font-medium mb-0.5">Current Position</label>
                <input
                  type="text"
                  value={form.current_position}
                  onChange={e => handleChange('current_position', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Experience (yrs)</label>
                <input
                  type="number"
                  value={form.years_experience}
                  onChange={e => handleChange('years_experience', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  min="0"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block font-medium mb-0.5">Current CTC</label>
                <input
                  type="number"
                  value={form.current_ctc}
                  onChange={e => handleChange('current_ctc', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  min="0"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block font-medium mb-0.5">Expected CTC</label>
                <input
                  type="number"
                  value={form.expected_ctc}
                  onChange={e => handleChange('expected_ctc', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Notice Period (days)</label>
                <input
                  type="number"
                  value={form.notice_period_days}
                  onChange={e => handleChange('notice_period_days', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  min="0"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block font-medium mb-0.5">Source</label>
                <select
                  value={form.source}
                  onChange={e => handleChange('source', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={loading}
                >
                  <option value="career_portal">Career Portal</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="naukri">Naukri</option>
                  <option value="indeed">Indeed</option>
                  <option value="employee_referral">Employee Referral</option>
                  <option value="consultancy">Consultancy</option>
                  <option value="campus">Campus</option>
                  <option value="direct">Direct</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-0.5">Resume URL</label>
              <input
                type="text"
                value={form.resume_url}
                onChange={e => handleChange('resume_url', e.target.value)}
                className="w-full border rounded px-2 py-1"
                disabled={loading}
                placeholder="https://example.com/resume.pdf"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-3 border-t bg-gray-50">
            <button onClick={onClose} className="px-3 py-1 text-[10px] border rounded bg-white hover:bg-gray-50" disabled={loading}>Cancel</button>
            <button onClick={handleSave} className="px-3 py-1 text-[10px] bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-1" disabled={loading}>
              <Save className="w-3 h-3" /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {showRequisitionModal && (
          <RequisitionSelectionModal
            show={showRequisitionModal}
            onClose={() => setShowRequisitionModal(false)}
            onSelect={handleRequisitionSelect}
            selectedRequisitionId={form.job_id}
            onlyOpen={true}
          />
        )}
      </Suspense>
    </>
  );
};

export default JobApplicationModal;