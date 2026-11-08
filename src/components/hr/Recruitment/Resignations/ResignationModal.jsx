import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { X, Save, Search } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

const ResignationModal = ({ show, record, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState({
    emp_id: '',
    reason: '',
    reason_category: 'personal',
    notice_period_days: 30,
    requested_last_working_day: '',
    remarks: '',
  });

  useEffect(() => {
    if (record) {
      setForm({
        emp_id: record.emp_id || '',
        reason: record.reason || '',
        reason_category: record.reason_category || 'personal',
        notice_period_days: record.notice_period_days || 30,
        requested_last_working_day: record.requested_last_working_day || '',
        remarks: record.remarks || '',
      });
      if (record.employee) {
        setSelectedEmployee(record.employee);
      } else {
        setSelectedEmployee(null);
      }
    } else {
      setForm({
        emp_id: '',
        reason: '',
        reason_category: 'personal',
        notice_period_days: 30,
        requested_last_working_day: '',
        remarks: '',
      });
      setSelectedEmployee(null);
    }
    setErrors({});
  }, [record, show]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleEmpSelect = useCallback((emp) => {
    if (emp) {
      setForm(prev => ({ ...prev, emp_id: emp.emp_id }));
      setSelectedEmployee(emp);
    }
    setShowEmpModal(false);
  }, []);

  const getEmployeeDisplayName = () => {
    if (selectedEmployee) {
      return [selectedEmployee.first_name, selectedEmployee.last_name].filter(Boolean).join(' ') || selectedEmployee.email || `ID: ${selectedEmployee.emp_id}`;
    }
    return 'Select Employee';
  };

  const validate = () => {
    const errs = {};
    if (!form.emp_id) errs.emp_id = 'Employee is required';
    if (!form.reason.trim()) errs.reason = 'Reason is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        notice_period_days: parseInt(form.notice_period_days, 10),
      };
      if (record) {
        await hrAPI.updateResignation(record.resignation_id, payload);
      } else {
        await hrAPI.createResignation(payload);
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
        <div className="bg-white rounded-md max-w-md w-full max-h-[90vh] flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-3 border-b">
            <h2 className="text-sm font-semibold">{record ? 'Edit Resignation' : 'New Resignation'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[10px]">
            <div>
              <label className="block font-medium mb-0.5">Employee *</label>
              <button
                type="button"
                onClick={() => setShowEmpModal(true)}
                className={`w-full flex items-center justify-between px-2 py-1.5 border rounded text-xs ${errors.emp_id ? 'border-red-500' : ''}`}
                disabled={loading || !!record}
              >
                <span className={selectedEmployee ? 'text-gray-900' : 'text-gray-400'}>
                  {getEmployeeDisplayName()}
                </span>
                <Search className="w-3 h-3 text-gray-400" />
              </button>
              {errors.emp_id && <p className="text-red-600 text-[9px] mt-0.5">{errors.emp_id}</p>}
            </div>

            <div>
              <label className="block font-medium mb-0.5">Reason *</label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={e => handleChange('reason', e.target.value)}
                className={`w-full border rounded px-2 py-1 ${errors.reason ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.reason && <p className="text-red-600 text-[9px] mt-0.5">{errors.reason}</p>}
            </div>

            <div>
              <label className="block font-medium mb-0.5">Category</label>
              <select
                value={form.reason_category}
                onChange={e => handleChange('reason_category', e.target.value)}
                className="w-full border rounded px-2 py-1"
                disabled={loading}
              >
                <option value="personal">Personal</option>
                <option value="career_growth">Career Growth</option>
                <option value="relocation">Relocation</option>
                <option value="compensation">Compensation</option>
                <option value="work_culture">Work Culture</option>
                <option value="health">Health</option>
                <option value="family">Family</option>
                <option value="higher_studies">Higher Studies</option>
                <option value="other">Other</option>
              </select>
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
                <label className="block font-medium mb-0.5">Requested Last Working Day</label>
                <input
                  type="date"
                  value={form.requested_last_working_day}
                  onChange={e => handleChange('requested_last_working_day', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-0.5">Remarks</label>
              <textarea
                rows={2}
                value={form.remarks}
                onChange={e => handleChange('remarks', e.target.value)}
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

      <Suspense fallback={null}>
        {showEmpModal && (
          <EmployeeSelectionModal
            show={showEmpModal}
            onClose={() => setShowEmpModal(false)}
            onSelect={handleEmpSelect}
            selectedEmployeeId={form.emp_id}
          />
        )}
      </Suspense>
    </>
  );
};

export default ResignationModal;