import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { X, Save, Search } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const JobApplicationSelectionModal = lazy(() => import('../Applications/JobApplicationSelectionModal'));

const OfferLetterModal = ({ show, record, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showAppModal, setShowAppModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [form, setForm] = useState({
    job_application_id: '',
    title: 'Employment Offer',
    salary_offered: 0,
    annual_ctc: 0,
    monthly_salary: 0,
    salary_breakdown: {},
    benefits: [],
    employment_type: 'full_time',
    work_mode: 'onsite',
    work_location: '',
    joining_date: '',
    probation_period_months: 6,
    notice_period_days: 30,
    expiry_date: '',
    content: '',
  });

  useEffect(() => {
    if (record) {
      setForm({
        job_application_id: record.job_application_id || '',
        title: record.title || 'Employment Offer',
        salary_offered: record.salary_offered || 0,
        annual_ctc: record.annual_ctc || 0,
        monthly_salary: record.monthly_salary || 0,
        salary_breakdown: record.salary_breakdown || {},
        benefits: record.benefits || [],
        employment_type: record.employment_type || 'full_time',
        work_mode: record.work_mode || 'onsite',
        work_location: record.work_location || '',
        joining_date: record.joining_date || '',
        probation_period_months: record.probation_period_months || 6,
        notice_period_days: record.notice_period_days || 30,
        expiry_date: record.expiry_date || '',
        content: record.content || '',
      });
      if (record.application) {
        setSelectedApplication(record.application);
      } else {
        setSelectedApplication(null);
      }
    } else {
      setForm({
        job_application_id: '',
        title: 'Employment Offer',
        salary_offered: 0,
        annual_ctc: 0,
        monthly_salary: 0,
        salary_breakdown: {},
        benefits: [],
        employment_type: 'full_time',
        work_mode: 'onsite',
        work_location: '',
        joining_date: '',
        probation_period_months: 6,
        notice_period_days: 30,
        expiry_date: '',
        content: '',
      });
      setSelectedApplication(null);
    }
    setErrors({});
  }, [record, show]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleApplicationSelect = useCallback((app) => {
    if (app) {
      setForm(prev => ({ ...prev, job_application_id: app.job_app_id }));
      setSelectedApplication(app);
    }
    setShowAppModal(false);
  }, []);

  const getApplicationDisplayName = () => {
    if (selectedApplication) {
      return `${selectedApplication.candidate_first_name} ${selectedApplication.candidate_last_name || ''} (App #${selectedApplication.job_app_id})`.trim();
    }
    return 'Select Application';
  };

  const validate = () => {
    const errs = {};
    if (!form.job_application_id) errs.job_application_id = 'Application is required';
    if (!form.salary_offered || form.salary_offered <= 0) errs.salary_offered = 'Salary must be > 0';
    if (!form.joining_date) errs.joining_date = 'Joining date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        salary_offered: parseFloat(form.salary_offered),
        annual_ctc: parseFloat(form.annual_ctc) || 0,
        monthly_salary: parseFloat(form.monthly_salary) || 0,
        probation_period_months: parseInt(form.probation_period_months, 10),
        notice_period_days: parseInt(form.notice_period_days, 10),
      };
      if (record) {
        await hrAPI.updateOfferLetter(record.offer_letter_id, payload);
      } else {
        await hrAPI.createOfferLetter(payload);
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
        <div className="bg-white rounded-md max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-3 border-b">
            <h2 className="text-sm font-semibold">{record ? 'Edit Offer' : 'New Offer'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[10px]">
            <div>
              <label className="block font-medium mb-0.5">Application *</label>
              <button
                type="button"
                onClick={() => setShowAppModal(true)}
                className={`w-full flex items-center justify-between px-2 py-1.5 border rounded text-xs ${errors.job_application_id ? 'border-red-500' : ''}`}
                disabled={loading || !!record}
              >
                <span className={selectedApplication ? 'text-gray-900' : 'text-gray-400'}>
                  {getApplicationDisplayName()}
                </span>
                <Search className="w-3 h-3 text-gray-400" />
              </button>
              {errors.job_application_id && <p className="text-red-600 text-[9px] mt-0.5">{errors.job_application_id}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Title</label>
                <input value={form.title} onChange={e => handleChange('title', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
              </div>
              <div>
                <label className="block font-medium mb-0.5">Salary Offered *</label>
                <input type="number" value={form.salary_offered} onChange={e => handleChange('salary_offered', e.target.value)} className={`w-full border rounded px-2 py-1 ${errors.salary_offered ? 'border-red-500' : ''}`} disabled={loading} />
                {errors.salary_offered && <p className="text-red-600 text-[9px] mt-0.5">{errors.salary_offered}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Annual CTC</label>
                <input type="number" value={form.annual_ctc} onChange={e => handleChange('annual_ctc', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
              </div>
              <div>
                <label className="block font-medium mb-0.5">Monthly Salary</label>
                <input type="number" value={form.monthly_salary} onChange={e => handleChange('monthly_salary', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
              </div>
              <div>
                <label className="block font-medium mb-0.5">Probation (months)</label>
                <input type="number" value={form.probation_period_months} onChange={e => handleChange('probation_period_months', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Employment Type</label>
                <select value={form.employment_type} onChange={e => handleChange('employment_type', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading}>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-0.5">Work Mode</label>
                <select value={form.work_mode} onChange={e => handleChange('work_mode', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading}>
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Joining Date *</label>
                <input type="date" value={form.joining_date} onChange={e => handleChange('joining_date', e.target.value)} className={`w-full border rounded px-2 py-1 ${errors.joining_date ? 'border-red-500' : ''}`} disabled={loading} />
                {errors.joining_date && <p className="text-red-600 text-[9px] mt-0.5">{errors.joining_date}</p>}
              </div>
              <div>
                <label className="block font-medium mb-0.5">Expiry Date</label>
                <input type="date" value={form.expiry_date} onChange={e => handleChange('expiry_date', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-0.5">Work Location</label>
              <input value={form.work_location} onChange={e => handleChange('work_location', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
            </div>

            <div>
              <label className="block font-medium mb-0.5">Notice Period (days)</label>
              <input type="number" value={form.notice_period_days} onChange={e => handleChange('notice_period_days', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
            </div>

            <div>
              <label className="block font-medium mb-0.5">Content / Letter Body</label>
              <textarea rows={4} value={form.content} onChange={e => handleChange('content', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-3 border-t bg-gray-50">
            <button onClick={onClose} className="px-3 py-1 text-[10px] border rounded bg-white hover:bg-gray-50" disabled={loading}>Cancel</button>
            <button onClick={handleSave} className="px-3 py-1 text-[10px] bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-1" disabled={loading}><Save className="w-3 h-3" /> {loading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>

      {/* Lazy‑loaded selection modal */}
      <Suspense fallback={null}>
        {showAppModal && (
          <JobApplicationSelectionModal
            show={showAppModal}
            onClose={() => setShowAppModal(false)}
            onSelect={handleApplicationSelect}
            selectedApplicationId={form.job_application_id}
          />
        )}
      </Suspense>
    </>
  );
};

export default OfferLetterModal;