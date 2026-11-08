import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { X, Save, User } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

const LeaveRequestModal = ({ show, record, onClose, onSaved }) => {
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
      if (record.employee) {
        setSelectedEmployee(record.employee);
      } else {
        setSelectedEmployee(null);
      }
    } else {
      setFormData({
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
    }
  };

  const handleEmployeeSelect = (emp) => {
    if (emp) {
      setSelectedEmployee(emp);
      setFormData(prev => ({ ...prev, emp_id: emp.emp_id }));
      if (validationErrors.emp_id) {
        setValidationErrors(prev => { const newErrors = { ...prev }; delete newErrors.emp_id; return newErrors; });
      }
    }
  };

  const openEmployeeModal = () => setShowEmployeeModal(true);
  const closeEmployeeModal = () => setShowEmployeeModal(false);

  const validate = () => {
    const errors = {};
    if (!formData.emp_id) errors.emp_id = 'Employee is required';
    if (!formData.leave_type_id) errors.leave_type_id = 'Leave type is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';
    if (!formData.end_date) errors.end_date = 'End date is required';
    if (formData.days <= 0) errors.days = 'Days must be greater than 0';
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      errors.end_date = 'End date must be after start date';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.half_day_on) delete payload.half_day_on;
      if (!payload.half_day_session) delete payload.half_day_session;
      if (!payload.contact_during_leave) delete payload.contact_during_leave;
      if (!payload.attachment_url) delete payload.attachment_url;
      if (!payload.attachments || payload.attachments.length === 0) delete payload.attachments;

      const response = record
        ? await hrAPI.updateLeaveRequest(record.leave_req_id, payload)
        : await hrAPI.createLeaveRequest(payload);
      if (response.data?.success) {
        onSaved();
      } else {
        throw new Error(response.data?.message || 'Save failed');
      }
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

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
        <div className="bg-white rounded-md max-w-2xl w-full h-[90vh] flex flex-col shadow-xl">
          <div className="flex-shrink-0 flex items-center justify-between p-2 border-b">
            <h2 className="text-sm font-semibold">{record ? 'Edit Leave Request' : 'Create Leave Request'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Employee <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div
                  onClick={openEmployeeModal}
                  className={`flex-1 flex items-center gap-2 px-2 py-1.5 border rounded text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                    validationErrors.emp_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {selectedEmployee ? (
                    <>
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-medium text-gray-900">{getEmployeeDisplayName(selectedEmployee)}</span>
                      <span className="text-gray-500 text-[10px]">
                        ({selectedEmployee.employee_code || 'N/A'})
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-500">Click to select an employee</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openEmployeeModal}
                  className="px-2.5 py-1.5 text-xs font-medium text-primary-600 border border-primary-300 rounded hover:bg-primary-50"
                >
                  Browse
                </button>
              </div>
              {validationErrors.emp_id && (
                <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.emp_id}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leave_type_id}
                onChange={e => handleChange('leave_type_id', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${
                  validationErrors.leave_type_id ? 'border-red-500' : ''
                }`}
                disabled={saveLoading}
              >
                <option value="">Select</option>
                {leaveTypes.map(lt => (
                  <option key={lt.leave_type_id} value={lt.leave_type_id}>
                    {lt.name}
                  </option>
                ))}
              </select>
              {validationErrors.leave_type_id && (
                <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.leave_type_id}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={e => handleChange('start_date', e.target.value)}
                  className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${
                    validationErrors.start_date ? 'border-red-500' : ''
                  }`}
                  disabled={saveLoading}
                />
                {validationErrors.start_date && (
                  <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.start_date}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={e => handleChange('end_date', e.target.value)}
                  className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${
                    validationErrors.end_date ? 'border-red-500' : ''
                  }`}
                  disabled={saveLoading}
                />
                {validationErrors.end_date && (
                  <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.end_date}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.days}
                  onChange={e => handleChange('days', parseFloat(e.target.value) || 0)}
                  className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${
                    validationErrors.days ? 'border-red-500' : ''
                  }`}
                  step="0.5"
                  min="0.5"
                  disabled={true}
                />
                {validationErrors.days && (
                  <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.days}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[10px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_half_day}
                    onChange={e => handleChange('is_half_day', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={saveLoading}
                  />
                  Half Day
                </label>
                {formData.is_half_day && (
                  <div className="flex-1">
                    <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Session</label>
                    <select
                      value={formData.half_day_session}
                      onChange={e => handleChange('half_day_session', e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                      disabled={saveLoading}
                    >
                      <option value="first_half">First Half</option>
                      <option value="second_half">Second Half</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {formData.is_half_day && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Half Day On</label>
                <input
                  type="date"
                  value={formData.half_day_on}
                  onChange={e => handleChange('half_day_on', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  disabled={saveLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Reason</label>
              <textarea
                rows="2"
                value={formData.reason}
                onChange={e => handleChange('reason', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 resize-none"
                disabled={saveLoading}
                placeholder="Reason for leave (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center gap-1 text-[10px] text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.emergency_leave}
                  onChange={e => handleChange('emergency_leave', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                Emergency Leave
              </label>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Contact During Leave</label>
                <input
                  type="text"
                  value={formData.contact_during_leave}
                  onChange={e => handleChange('contact_during_leave', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  placeholder="Phone/email"
                  disabled={saveLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Attachment URL</label>
              <input
                type="text"
                value={formData.attachment_url}
                onChange={e => handleChange('attachment_url', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="https://..."
                disabled={saveLoading}
              />
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center justify-between p-2 border-t bg-gray-50">
            <p className="text-[10px] text-gray-500">
              {record ? `Editing request #${record.leave_req_id}` : 'New request'}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={onClose}
                className="px-2.5 py-1 text-[10px] border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-2.5 py-1 text-[10px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50"
                disabled={saveLoading}
              >
                <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {showEmployeeModal && (
          <EmployeeSelectionModal
            show={showEmployeeModal}
            onClose={closeEmployeeModal}
            onSelect={handleEmployeeSelect}
            selectedEmployeeId={formData.emp_id}
            excludeId={record ? record.emp_id : null}
          />
        )}
      </Suspense>
    </>
  );
};

export default LeaveRequestModal;