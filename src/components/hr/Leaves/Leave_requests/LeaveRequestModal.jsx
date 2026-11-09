// src/modules/Leave/Leave_requests/LeaveRequestModal.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { X, Save, User, Eye } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

const LeaveRequestModal = ({ show, record, onClose, onSaved, readOnly = false }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const [formData, setFormData] = useState({
    emp_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    days: 0,
    is_half_day: false,
    half_day_on: '',
    half_day_session: 'first_half',
    reason: '',
    emergency_leave: false,
    contact_during_leave: '',
    attachment_url: '',
    attachments: [],
    // NOTE: status is workflow-managed — not editable here.
  });

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const res = await hrAPI.getLeaveTypes();
        if (res.data?.success) setLeaveTypes(res.data.data || []);
      } catch (err) { console.error(err); }
    };
    if (show) fetchLeaveTypes();
  }, [show]);

  useEffect(() => {
    if (record) {
      setFormData({
        emp_id: record.emp_id || '',
        leave_type_id: record.leave_type_id || '',
        start_date: record.start_date || '',
        end_date: record.end_date || '',
        days: record.days || 0,
        is_half_day: record.is_half_day || false,
        half_day_on: record.half_day_on || '',
        half_day_session: record.half_day_session || 'first_half',
        reason: record.reason || '',
        emergency_leave: record.emergency_leave || false,
        contact_during_leave: record.contact_during_leave || '',
        attachment_url: record.attachment_url || '',
        attachments: record.attachments || [],
      });
      setSelectedEmployee(record.employee || null);
    } else {
      setFormData({
        emp_id: '', leave_type_id: '', start_date: '', end_date: '', days: 0,
        is_half_day: false, half_day_on: '', half_day_session: 'first_half',
        reason: '', emergency_leave: false, contact_during_leave: '',
        attachment_url: '', attachments: [],
      });
      setSelectedEmployee(null);
    }
    setValidationErrors({});
  }, [record]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end >= start) {
        let days = (end - start) / (1000 * 60 * 60 * 24) + 1;
        if (formData.is_half_day) days = 0.5;
        setFormData(prev => ({ ...prev, days: parseFloat(days.toFixed(2)) }));
      }
    }
  }, [formData.start_date, formData.end_date, formData.is_half_day]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleEmployeeSelect = (emp) => {
    if (readOnly) return;
    if (emp) {
      setSelectedEmployee(emp);
      setFormData(prev => ({ ...prev, emp_id: emp.emp_id }));
      if (validationErrors.emp_id) {
        setValidationErrors(prev => { const n = { ...prev }; delete n.emp_id; return n; });
      }
    }
  };

  const openEmployeeModal  = () => { if (!readOnly) setShowEmployeeModal(true); };
  const closeEmployeeModal = () => setShowEmployeeModal(false);

  const validate = () => {
    const errors = {};
    if (!formData.emp_id) errors.emp_id = 'Employee is required';
    if (!formData.leave_type_id) errors.leave_type_id = 'Leave type is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';
    if (!formData.end_date) errors.end_date = 'End date is required';
    if (formData.days <= 0) errors.days = 'Days must be greater than 0';
    if (formData.start_date && formData.end_date &&
        new Date(formData.end_date) < new Date(formData.start_date)) {
      errors.end_date = 'End date must be after start date';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (readOnly) return;
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.half_day_on) delete payload.half_day_on;
      if (!payload.half_day_session) delete payload.half_day_session;
      if (!payload.contact_during_leave) delete payload.contact_during_leave;
      if (!payload.attachment_url) delete payload.attachment_url;
      if (!payload.attachments || payload.attachments.length === 0) delete payload.attachments;

      if (record) {
        // Edit: do NOT send status — workflow-managed via row actions
        await hrAPI.updateLeaveRequest(record.leave_req_id, payload);
      } else {
        // Create: always start as 'pending'
        await hrAPI.createLeaveRequest({ ...payload, status: 'pending' });
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const getEmployeeDisplayName = (emp) => {
    if (!emp) return 'No employee selected';
    if (emp.display_name) return emp.display_name;
    return [emp.first_name, emp.last_name].filter(Boolean).join(' ') || emp.email || `ID: ${emp.emp_id}`;
  };

  if (!show) return null;

  const disabled = readOnly || saveLoading;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
        <div className="bg-white rounded-md max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">

          {/* ── HEADER — ONLY Save + X ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-b">
            <div className="min-w-0">
              <h2 className="text-xs font-semibold flex items-center gap-1.5">
                {readOnly
                  ? <><Eye className="w-3.5 h-3.5 text-blue-600" /> View Leave Request</>
                  : (record ? 'Edit Leave Request' : 'Create Leave Request')}
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                {record ? `Request #${record.leave_req_id}` : 'New request (will be Pending)'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!readOnly && (
                <button onClick={handleSave} disabled={saveLoading}
                  className="px-2.5 py-1 text-[11px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50">
                  <Save className="w-3 h-3" /> {saveLoading ? 'Saving…' : 'Save'}
                </button>
              )}
              <button onClick={onClose} disabled={saveLoading}
                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">

            {/* Employee — single clickable picker, no Browse button */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Employee <span className="text-red-500">*</span>
              </label>
              <div onClick={openEmployeeModal}
                className={`w-full flex items-center gap-1.5 px-1.5 py-1 border rounded text-[11px] transition-colors ${
                  readOnly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'
                } ${validationErrors.emp_id ? 'border-red-500' : 'border-gray-300'}`}>
                {selectedEmployee ? (
                  <>
                    <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{getEmployeeDisplayName(selectedEmployee)}</span>
                    <span className="text-gray-500 text-[10px] whitespace-nowrap">({selectedEmployee.employee_code || 'N/A'})</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Click to select an employee</span>
                  </>
                )}
              </div>
              {validationErrors.emp_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.emp_id}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select value={formData.leave_type_id}
                onChange={e => handleChange('leave_type_id', e.target.value)}
                className={`w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${
                  validationErrors.leave_type_id ? 'border-red-500' : ''
                }`}
                disabled={disabled}>
                <option value="">Select</option>
                {leaveTypes.map(lt => (
                  <option key={lt.leave_type_id} value={lt.leave_type_id}>{lt.name}</option>
                ))}
              </select>
              {validationErrors.leave_type_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.leave_type_id}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Start Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.start_date}
                  onChange={e => handleChange('start_date', e.target.value)}
                  className={`w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${validationErrors.start_date ? 'border-red-500' : ''}`}
                  disabled={disabled} />
                {validationErrors.start_date && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.start_date}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">End Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.end_date}
                  onChange={e => handleChange('end_date', e.target.value)}
                  className={`w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${validationErrors.end_date ? 'border-red-500' : ''}`}
                  disabled={disabled} />
                {validationErrors.end_date && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.end_date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Days <span className="text-red-500">*</span></label>
                <input type="number" value={formData.days}
                  className={`w-full px-1.5 py-1 border rounded text-[11px] bg-gray-50 text-gray-600 ${validationErrors.days ? 'border-red-500' : ''}`}
                  step="0.5" min="0.5" disabled />
                {validationErrors.days && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.days}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Half Day</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[10px] text-gray-700">
                    <input type="checkbox" checked={formData.is_half_day}
                      onChange={e => handleChange('is_half_day', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 w-3 h-3"
                      disabled={disabled} />
                    Half Day
                  </label>
                  {formData.is_half_day && (
                    <select value={formData.half_day_session}
                      onChange={e => handleChange('half_day_session', e.target.value)}
                      className="flex-1 px-1.5 py-1 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                      disabled={disabled}>
                      <option value="first_half">First Half</option>
                      <option value="second_half">Second Half</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {formData.is_half_day && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Half Day On</label>
                <input type="date" value={formData.half_day_on}
                  onChange={e => handleChange('half_day_on', e.target.value)}
                  className="w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  disabled={disabled} />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Reason</label>
              <textarea rows="2" value={formData.reason}
                onChange={e => handleChange('reason', e.target.value)}
                className="w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 resize-none disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Reason for leave (optional)"
                disabled={disabled} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center">
                <label className="flex items-center gap-1 text-[10px] text-gray-700">
                  <input type="checkbox" checked={formData.emergency_leave}
                    onChange={e => handleChange('emergency_leave', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={disabled} />
                  Emergency Leave
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Contact During Leave</label>
                <input type="text" value={formData.contact_during_leave}
                  onChange={e => handleChange('contact_during_leave', e.target.value)}
                  className="w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="Phone/email"
                  disabled={disabled} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Attachment URL</label>
              <input type="text" value={formData.attachment_url}
                onChange={e => handleChange('attachment_url', e.target.value)}
                className="w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="https://..."
                disabled={disabled} />
            </div>
          </div>

          {/* ── FOOTER — no buttons ── */}
          <div className="flex-shrink-0 flex items-center justify-end px-2 py-1 border-t bg-gray-50">
            <p className="text-[9px] text-gray-500">
              {record ? `Request #${record.leave_req_id}` : 'New request (will be Pending)'}
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {showEmployeeModal && !readOnly && (
          <EmployeeSelectionModal show={showEmployeeModal}
            onClose={closeEmployeeModal} onSelect={handleEmployeeSelect}
            selectedEmployeeId={formData.emp_id}
            excludeId={record ? record.emp_id : null} />
        )}
      </Suspense>
    </>
  );
};

export default LeaveRequestModal;