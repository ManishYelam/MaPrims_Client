import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { X, Save, User, Clock, Eye } from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));
const ShiftSelectionModal = lazy(() => import('../Shifts/ShiftSelectionModal'));

const assignmentSchema = yup.object().shape({
  emp_id: yup.string().required('Employee is required'),
  shift_id: yup.string().required('Shift is required'),
  date: yup.string().required('Date is required'),
  effective_from: yup.string().nullable(),
  effective_to: yup.string().nullable(),
  assignment_type: yup.string().nullable(),
  status: yup.string().nullable(),
  reason: yup.string().nullable(),
});

const ShiftAssignmentModal = ({ show, record, onClose, onSaved, readOnly = false }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    emp_id: '',
    shift_id: '',
    date: '',
    effective_from: '',
    effective_to: '',
    assignment_type: 'regular',
    status: 'active',
    reason: '',
  });

  const isEdit = !!record;
  const isDisabled = saveLoading || readOnly;

  useEffect(() => {
    if (record) {
      setFormData({
        emp_id: record.emp_id || '',
        shift_id: record.shift_id || '',
        date: record.date || '',
        effective_from: record.effective_from || '',
        effective_to: record.effective_to || '',
        assignment_type: record.assignment_type || 'regular',
        status: record.status || 'active',
        reason: record.reason || '',
      });
      setSelectedEmployee(record.employee || null);
      setSelectedShift(record.shift || null);
    } else {
      setFormData({
        emp_id: '',
        shift_id: '',
        date: '',
        effective_from: '',
        effective_to: '',
        assignment_type: 'regular',
        status: 'active',
        reason: '',
      });
      setSelectedEmployee(null);
      setSelectedShift(null);
    }
    setValidationErrors({});
    setApiError(null);
  }, [record, show]);

  const validateForm = useCallback(async () => {
    try {
      await assignmentSchema.validate(formData, { abortEarly: false });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors = {};
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
        setValidationErrors(errors);
        const firstError = Object.values(errors)[0];
        if (firstError) toast.error(firstError);
      }
      return false;
    }
  }, [formData]);

  const handleInputChange = useCallback((field, value) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError, readOnly]);

  const handleEmployeeSelect = useCallback((emp) => {
    if (readOnly) return;
    if (emp) {
      setSelectedEmployee(emp);
      handleInputChange('emp_id', emp.emp_id);
    } else {
      setSelectedEmployee(null);
      handleInputChange('emp_id', '');
    }
    setShowEmployeeModal(false);
  }, [handleInputChange, readOnly]);

  const handleShiftSelect = useCallback((shift) => {
    if (readOnly) return;
    if (shift) {
      setSelectedShift(shift);
      handleInputChange('shift_id', shift.id);
    } else {
      setSelectedShift(null);
      handleInputChange('shift_id', '');
    }
    setShowShiftModal(false);
  }, [handleInputChange, readOnly]);

  const handleSave = useCallback(async () => {
    if (readOnly) return;
    const isValid = await validateForm();
    if (!isValid) return;

    const payload = { ...formData };
    if (!payload.effective_from) delete payload.effective_from;
    if (!payload.effective_to) delete payload.effective_to;
    if (!payload.reason) delete payload.reason;

    setSaveLoading(true);
    setApiError(null);
    try {
      const response = record
        ? await hrAPI.updateShiftAssignment(record.shift_assign_id, payload)
        : await hrAPI.createShiftAssignment(payload);
      toast.success(`Assignment ${record ? 'updated' : 'created'} successfully!`);
      onSaved();
    } catch (error) {
      const apiError = error.response?.data;
      let errorMessage = 'Failed to save assignment';
      if (apiError?.message) errorMessage = apiError.message;
      else if (error.message) errorMessage = error.message;
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Save error:', error);
    } finally {
      setSaveLoading(false);
    }
  }, [formData, record, onSaved, validateForm, readOnly]);

  const displayEmployeeText = useMemo(() => {
    if (selectedEmployee) {
      return `${selectedEmployee.first_name} ${selectedEmployee.last_name}`;
    }
    return 'None';
  }, [selectedEmployee]);

  const displayShiftText = useMemo(() => {
    if (selectedShift) {
      return `${selectedShift.name}${selectedShift.code ? ` (${selectedShift.code})` : ''}`;
    }
    return 'Select Shift';
  }, [selectedShift]);

  const inputCls = 'w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600';
  const pickerCls = `flex-1 px-2 py-1 border rounded text-xs flex items-center justify-between ${
    isDisabled || isEdit ? 'cursor-not-allowed bg-gray-100' : 'bg-white cursor-pointer hover:bg-gray-50'
  }`;

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      {/* max-h instead of fixed h so the modal only grows to fit its content */}
      <div className="bg-white rounded-md max-w-lg w-full max-h-[92vh] flex flex-col shadow-xl">
        {/* HEADER — Save + X only (no footer buttons) */}
        <div className="flex-shrink-0 flex items-center justify-between p-2.5 border-b">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {readOnly
                ? <><Eye className="w-4 h-4 text-blue-600" /> View Shift Assignment</>
                : (record ? 'Edit Shift Assignment' : 'New Shift Assignment')}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {record ? `Assignment #${record.shift_assign_id}` : 'Enter assignment details'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!readOnly && (
              <button
                onClick={handleSave}
                className="px-2.5 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-60"
                disabled={saveLoading}
              >
                <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
              disabled={saveLoading}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY — min-h-0 lets it shrink/scroll inside max-h parent */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          {apiError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-2.5 rounded-md flex items-start justify-between">
              <span className="text-xs text-red-700">{apiError}</span>
              <button onClick={() => setApiError(null)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">
                Employee <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <div
                  className={pickerCls}
                  onClick={() => !isDisabled && !isEdit && setShowEmployeeModal(true)}
                >
                  <span className={formData.emp_id ? 'text-gray-900' : 'text-gray-400'}>
                    {displayEmployeeText}
                  </span>
                  <User className="w-3 h-3 text-gray-400" />
                </div>
                {!isEdit && !readOnly && formData.emp_id && (
                  <button
                    onClick={() => { handleInputChange('emp_id', ''); setSelectedEmployee(null); }}
                    className="p-0.5 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {validationErrors.emp_id && (
                <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.emp_id}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">
                Shift <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <div
                  className={pickerCls}
                  onClick={() => !isDisabled && !isEdit && setShowShiftModal(true)}
                >
                  <span className={formData.shift_id ? 'text-gray-900' : 'text-gray-400'}>
                    {displayShiftText}
                  </span>
                  <Clock className="w-3 h-3 text-gray-400" />
                </div>
                {!isEdit && !readOnly && formData.shift_id && (
                  <button
                    onClick={() => { handleInputChange('shift_id', ''); setSelectedShift(null); }}
                    className="p-0.5 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {validationErrors.shift_id && (
                <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.shift_id}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.date}
              onChange={e => handleInputChange('date', e.target.value)}
              className={`${inputCls} ${validationErrors.date ? 'border-red-500' : ''}`}
              disabled={isDisabled || isEdit}
            />
            {validationErrors.date && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.date}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Effective From</label>
              <input
                type="date"
                value={formData.effective_from}
                onChange={e => handleInputChange('effective_from', e.target.value)}
                className={inputCls}
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Effective To</label>
              <input
                type="date"
                value={formData.effective_to}
                onChange={e => handleInputChange('effective_to', e.target.value)}
                className={inputCls}
                disabled={isDisabled}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Assignment Type</label>
            <select
              value={formData.assignment_type}
              onChange={e => handleInputChange('assignment_type', e.target.value)}
              className={inputCls}
              disabled={isDisabled || isEdit}
            >
              <option value="regular">Regular</option>
              <option value="temporary">Temporary</option>
              <option value="replacement">Replacement</option>
              <option value="rotational">Rotational</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Reason</label>
            <textarea
              rows={readOnly ? 1 : 2}
              value={formData.reason}
              onChange={e => handleInputChange('reason', e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Optional reason for this assignment"
              disabled={isDisabled || isEdit}
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Status</label>
            <select
              value={formData.status}
              onChange={e => handleInputChange('status', e.target.value)}
              className={inputCls}
              disabled={isDisabled}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* FOOTER — only last-updated hint, no buttons */}
        <div className="flex-shrink-0 flex items-center justify-end px-2.5 py-1.5 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {record
              ? `Last updated: ${record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : '—'}`
              : 'New assignment'}
          </p>
        </div>

        <Suspense fallback={null}>
          {showEmployeeModal && !readOnly && (
            <EmployeeSelectionModal
              show={showEmployeeModal}
              onClose={() => setShowEmployeeModal(false)}
              onSelect={handleEmployeeSelect}
              selectedEmployeeId={formData.emp_id || null}
              excludeId={record?.emp_id || null}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {showShiftModal && !readOnly && (
            <ShiftSelectionModal
              show={showShiftModal}
              onClose={() => setShowShiftModal(false)}
              onSelect={handleShiftSelect}
              selectedShiftId={formData.shift_id || null}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default React.memo(ShiftAssignmentModal);