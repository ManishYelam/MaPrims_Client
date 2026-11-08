import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { X, Save, Search } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

// Lazy‑loaded selection modals
const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));
const JobApplicationSelectionModal = lazy(() => import('../Applications/JobApplicationSelectionModal'));

const InterviewModal = ({ show, record, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showInterviewerModal, setShowInterviewerModal] = useState(false);
  const [selectedInterviewer, setSelectedInterviewer] = useState(null);

  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [form, setForm] = useState({
    job_application_id: '',
    interviewer_id: '',
    interview_round: 'Screening',
    round_number: 1,
    type: 'phone',
    scheduled_at: '',
    duration_minutes: 30,
    timezone: 'Asia/Kolkata',
    location: '',
    meeting_link: '',
    meeting_id: '',
    meeting_password: '',
    panel_members: [],
  });

  useEffect(() => {
    if (record) {
      setForm({
        job_application_id: record.job_application_id || '',
        interviewer_id: record.interviewer_id || '',
        interview_round: record.interview_round || 'Screening',
        round_number: record.round_number || 1,
        type: record.type || 'phone',
        scheduled_at: record.scheduled_at ? new Date(record.scheduled_at).toISOString().slice(0, 16) : '',
        duration_minutes: record.duration_minutes || 30,
        timezone: record.timezone || 'Asia/Kolkata',
        location: record.location || '',
        meeting_link: record.meeting_link || '',
        meeting_id: record.meeting_id || '',
        meeting_password: record.meeting_password || '',
        panel_members: record.panel_members || [],
      });
      setSelectedInterviewer(record.interviewer || null);
      setSelectedApplication(record.application || null);
    } else {
      setForm({
        job_application_id: '',
        interviewer_id: '',
        interview_round: 'Screening',
        round_number: 1,
        type: 'phone',
        scheduled_at: '',
        duration_minutes: 30,
        timezone: 'Asia/Kolkata',
        location: '',
        meeting_link: '',
        meeting_id: '',
        meeting_password: '',
        panel_members: [],
      });
      setSelectedInterviewer(null);
      setSelectedApplication(null);
    }
    setErrors({});
  }, [record, show]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleInterviewerSelect = useCallback((emp) => {
    if (emp) {
      setForm(prev => ({ ...prev, interviewer_id: emp.emp_id }));
      setSelectedInterviewer(emp);
    }
    setShowInterviewerModal(false);
  }, []);

  const getInterviewerDisplayName = () => {
    if (selectedInterviewer) {
      return [selectedInterviewer.first_name, selectedInterviewer.last_name].filter(Boolean).join(' ') || selectedInterviewer.email || `ID: ${selectedInterviewer.emp_id}`;
    }
    return 'Select Interviewer';
  };

  const handleApplicationSelect = useCallback((app) => {
    if (app) {
      setForm(prev => ({ ...prev, job_application_id: app.job_app_id }));
      setSelectedApplication(app);
    }
    setShowApplicationModal(false);
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
    if (!form.interviewer_id) errs.interviewer_id = 'Interviewer is required';
    if (!form.scheduled_at) errs.scheduled_at = 'Date & time is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        round_number: parseInt(form.round_number, 10),
        duration_minutes: parseInt(form.duration_minutes, 10),
      };
      if (record) {
        await hrAPI.updateInterview(record.interview_id, payload);
      } else {
        await hrAPI.createInterview(payload);
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
        <div className="bg-white rounded-md max-w-xl w-full max-h-[90vh] flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-3 border-b">
            <h2 className="text-sm font-semibold">{record ? 'Edit Interview' : 'New Interview'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[10px]">
            {/* Application */}
            <div>
              <label className="block font-medium mb-0.5">Application *</label>
              <button
                type="button"
                onClick={() => setShowApplicationModal(true)}
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

            {/* Interviewer */}
            <div>
              <label className="block font-medium mb-0.5">Interviewer *</label>
              <button
                type="button"
                onClick={() => setShowInterviewerModal(true)}
                className={`w-full flex items-center justify-between px-2 py-1.5 border rounded text-xs ${errors.interviewer_id ? 'border-red-500' : ''}`}
                disabled={loading}
              >
                <span className={selectedInterviewer ? 'text-gray-900' : 'text-gray-400'}>
                  {getInterviewerDisplayName()}
                </span>
                <Search className="w-3 h-3 text-gray-400" />
              </button>
              {errors.interviewer_id && <p className="text-red-600 text-[9px] mt-0.5">{errors.interviewer_id}</p>}
            </div>

            {/* Round & Number */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Round</label>
                <input
                  type="text"
                  value={form.interview_round}
                  onChange={e => handleChange('interview_round', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block font-medium mb-0.5">Round Number</label>
                <input
                  type="number"
                  value={form.round_number}
                  onChange={e => handleChange('round_number', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  min="1"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Type & Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-0.5">Type</label>
                <select
                  value={form.type}
                  onChange={e => handleChange('type', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={loading}
                >
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                  <option value="onsite">Onsite</option>
                  <option value="technical">Technical</option>
                  <option value="hr">HR</option>
                  <option value="managerial">Managerial</option>
                  <option value="panel">Panel</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-0.5">Duration (min)</label>
                <input
                  type="number"
                  value={form.duration_minutes}
                  onChange={e => handleChange('duration_minutes', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  min="5"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Scheduled At */}
            <div>
              <label className="block font-medium mb-0.5">Scheduled At *</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => handleChange('scheduled_at', e.target.value)}
                className={`w-full border rounded px-2 py-1 ${errors.scheduled_at ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.scheduled_at && <p className="text-red-600 text-[9px] mt-0.5">{errors.scheduled_at}</p>}
            </div>

            {/* Location / Meeting Link */}
            <div>
              <label className="block font-medium mb-0.5">Location / Meeting Link</label>
              <input
                type="text"
                value={form.location || form.meeting_link}
                onChange={e => handleChange('location', e.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder="Office address or video link"
                disabled={loading}
              />
            </div>

            {/* Panel Members */}
            <div>
              <label className="block font-medium mb-0.5">Panel Members (comma separated IDs)</label>
              <input
                type="text"
                value={form.panel_members.join(', ')}
                onChange={e => handleChange('panel_members', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full border rounded px-2 py-1"
                disabled={loading}
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

      {/* Lazy‑loaded Employee Selection Modal */}
      <Suspense fallback={null}>
        {showInterviewerModal && (
          <EmployeeSelectionModal
            show={showInterviewerModal}
            onClose={() => setShowInterviewerModal(false)}
            onSelect={handleInterviewerSelect}
            selectedEmployeeId={form.interviewer_id}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showApplicationModal && (
          <JobApplicationSelectionModal
            show={showApplicationModal}
            onClose={() => setShowApplicationModal(false)}
            onSelect={handleApplicationSelect}
            selectedApplicationId={form.job_application_id}
          />
        )}
      </Suspense>
    </>
  );
};

export default InterviewModal;