// src/modules/Leave/Leave_balances/LeaveBalanceModal.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { X, Save, User, Eye } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

const LeaveBalanceModal = ({ show, record, onClose, onSaved, readOnly = false }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const [formData, setFormData] = useState({
    emp_id: '',
    leave_type_id: '',
    year: new Date().getFullYear(),
    opening_balance: 0,
    accrued: 0,
    manual_credit: 0,
    carried_over: 0,
    taken: 0,
    pending: 0,
    cancelled: 0,
    adjustment: 0,
    adjustment_reason: '',
    encashed: 0,
    balance: 0,
    expired: 0,
    expiry_date: '',
    // NOTE: status is intentionally NOT user-editable — see workflow rules.
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
        year: record.year || new Date().getFullYear(),
        opening_balance: record.opening_balance ?? 0,
        accrued: record.accrued ?? 0,
        manual_credit: record.manual_credit ?? 0,
        carried_over: record.carried_over ?? 0,
        taken: record.taken ?? 0,
        pending: record.pending ?? 0,
        cancelled: record.cancelled ?? 0,
        adjustment: record.adjustment ?? 0,
        adjustment_reason: record.adjustment_reason || '',
        encashed: record.encashed ?? 0,
        balance: record.balance ?? 0,
        expired: record.expired ?? 0,
        expiry_date: record.expiry_date || '',
      });
      setSelectedEmployee(record.employee || null);
    } else {
      setFormData({
        emp_id: '',
        leave_type_id: '',
        year: new Date().getFullYear(),
        opening_balance: 0,
        accrued: 0,
        manual_credit: 0,
        carried_over: 0,
        taken: 0,
        pending: 0,
        cancelled: 0,
        adjustment: 0,
        adjustment_reason: '',
        encashed: 0,
        balance: 0,
        expired: 0,
        expiry_date: '',
      });
      setSelectedEmployee(null);
    }
    setValidationErrors({});
  }, [record]);

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
    if (!formData.year) errors.year = 'Year is required';
    if (formData.year < 2000 || formData.year > 2100) errors.year = 'Invalid year';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (readOnly) return;
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = { ...formData };
      if (payload.expiry_date === '') payload.expiry_date = null;

      if (record) {
        // Editing: status is workflow-managed — do NOT send it here.
        await hrAPI.updateLeaveBalance(record.leave_balance_id, payload);
      } else {
        // Creating: always start as 'pending'.
        await hrAPI.createLeaveBalance({ ...payload, status: 'pending' });
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
                  ? <><Eye className="w-3.5 h-3.5 text-blue-600" /> View Leave Balance</>
                  : (record ? 'Edit Leave Balance' : 'Create Leave Balance')}
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                {record ? `Record #${record.leave_balance_id}` : 'New record (will be Pending)'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!readOnly && (
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="px-2.5 py-1 text-[11px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" /> {saveLoading ? 'Saving…' : 'Save'}
                </button>
              )}
              <button
                onClick={onClose}
                disabled={saveLoading}
                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">

            {/* Employee — single clickable picker field (no Browse button) */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Employee <span className="text-red-500">*</span>
              </label>
              <div
                onClick={openEmployeeModal}
                className={`w-full flex items-center gap-1.5 px-1.5 py-1 border rounded text-[11px] transition-colors ${
                  readOnly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'
                } ${validationErrors.emp_id ? 'border-red-500' : 'border-gray-300'}`}
              >
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
                className={`w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${
                  validationErrors.leave_type_id ? 'border-red-500' : ''
                }`}
                disabled={disabled}
              >
                <option value="">Select</option>
                {leaveTypes.map(lt => (
                  <option key={lt.leave_type_id} value={lt.leave_type_id}>{lt.name}</option>
                ))}
              </select>
              {validationErrors.leave_type_id && (
                <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.leave_type_id}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={e => handleChange('year', parseInt(e.target.value) || 0)}
                  className={`w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${
                    validationErrors.year ? 'border-red-500' : ''
                  }`}
                  min="2000"
                  max="2100"
                  disabled={disabled}
                />
                {validationErrors.year && (
                  <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.year}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={e => handleChange('expiry_date', e.target.value)}
                  className="w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="border-t pt-2">
              <h4 className="text-[11px] font-semibold text-gray-700 mb-1">Balance Components</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { key: 'opening_balance', label: 'Opening Balance' },
                  { key: 'accrued', label: 'Accrued' },
                  { key: 'manual_credit', label: 'Manual Credit' },
                  { key: 'carried_over', label: 'Carried Over' },
                  { key: 'taken', label: 'Taken' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'cancelled', label: 'Cancelled' },
                  { key: 'adjustment', label: 'Adjustment' },
                  { key: 'encashed', label: 'Encashed' },
                  { key: 'balance', label: 'Balance' },
                  { key: 'expired', label: 'Expired' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[9px] font-medium text-gray-700 mb-0.5">{label}</label>
                    <input
                      type="number"
                      value={formData[key]}
                      onChange={e => handleChange(key, parseFloat(e.target.value) || 0)}
                      className="w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                      step="0.01"
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Adjustment Reason</label>
              <textarea
                rows="2"
                value={formData.adjustment_reason}
                onChange={e => handleChange('adjustment_reason', e.target.value)}
                className="w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 resize-none disabled:bg-gray-50 disabled:text-gray-600"
                disabled={disabled}
                placeholder="Optional reason for adjustment"
              />
            </div>
          </div>

          {/* ── FOOTER — no buttons ── */}
          <div className="flex-shrink-0 flex items-center justify-end px-2 py-1 border-t bg-gray-50">
            <p className="text-[9px] text-gray-500">
              {record ? `Record #${record.leave_balance_id}` : 'New record (will be Pending)'}
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {showEmployeeModal && !readOnly && (
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

export default LeaveBalanceModal;