import React, { useState, useEffect, lazy, Suspense } from 'react';
import { X, Save, User, Briefcase } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

const getEmployeeDisplayName = (emp) => {
  if (!emp) return '';
  if (emp.display_name) return emp.display_name;
  if (emp.name) return emp.name;
  if (emp.first_name || emp.last_name) {
    return [emp.first_name, emp.last_name].filter(Boolean).join(' ');
  }
  return emp.email || `ID: ${emp.emp_id}`;
};

const ExpenseModal = ({ show, record, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState({
    emp_id: '',
    title: '',
    description: '',
    category: 'other',
    expense_date: '',
    total_amount: 0,
    currency: 'INR',
    vendor_name: '',
    reimbursable: true,
    business_purpose: '',
    project_id: '',
    dept_id: '',
    cost_center: '',
    receipt_url: ''
  });

  useEffect(() => {
    if (record) {
      setForm({
        emp_id: record.emp_id || '',
        title: record.title || '',
        description: record.description || '',
        category: record.category || 'other',
        expense_date: record.expense_date || '',
        total_amount: record.total_amount || 0,
        currency: record.currency || 'INR',
        vendor_name: record.vendor_name || '',
        reimbursable: record.reimbursable ?? true,
        business_purpose: record.business_purpose || '',
        project_id: record.project_id || '',
        dept_id: record.dept_id || '',
        cost_center: record.cost_center || '',
        receipt_url: record.receipt_url || ''
      });
      setSelectedEmployee(
        record.employee_name
          ? { emp_id: record.emp_id, display_name: record.employee_name }
          : record.employee
          ? record.employee
          : null
      );
    } else {
      setForm({
        emp_id: '', title: '', description: '', category: 'other',
        expense_date: '', total_amount: 0, currency: 'INR',
        vendor_name: '', reimbursable: true, business_purpose: '',
        project_id: '', dept_id: '', cost_center: '', receipt_url: ''
      });
      setSelectedEmployee(null);
    }
    setErrors({});
  }, [record, show]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleEmployeeSelect = (emp) => {
    if (emp) {
      setSelectedEmployee(emp);
      handleChange('emp_id', emp.emp_id);
      // Auto-fill department ID and cost center from employee's department
      if (emp.dept_id) {
        handleChange('dept_id', emp.dept_id);
      } else {
        handleChange('dept_id', '');
      }
      if (emp.department?.cost_centre) {
        handleChange('cost_center', emp.department.cost_centre);
      } else if (emp.department?.cost_center) {
        handleChange('cost_center', emp.department.cost_center);
      } else {
        handleChange('cost_center', '');
      }
    } else {
      setSelectedEmployee(null);
      handleChange('emp_id', '');
      handleChange('dept_id', '');
      handleChange('cost_center', '');
    }
    setShowEmployeeModal(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.emp_id) errs.emp_id = 'Employee is required';
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.expense_date) errs.expense_date = 'Date is required';
    if (!form.total_amount || parseFloat(form.total_amount) <= 0) errs.total_amount = 'Amount must be > 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, total_amount: parseFloat(form.total_amount) };
      if (record) {
        await hrAPI.updateExpense(record.expense_id, payload);
      } else {
        await hrAPI.createExpense(payload);
      }
      onSaved();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-md max-w-xl w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-sm font-semibold">{record ? 'Edit Expense' : 'New Expense'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[10px]">
          {/* Employee selection */}
          <div>
            <label className="block font-medium mb-0.5">Employee *</label>
            <div className="flex items-center gap-1">
              <div
                className={`flex-1 px-2 py-1 border rounded flex items-center justify-between cursor-pointer ${errors.emp_id ? 'border-red-500' : ''} ${loading || !!record ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                onClick={() => !loading && !record && setShowEmployeeModal(true)}
              >
                <span className={form.emp_id ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedEmployee
                    ? `${getEmployeeDisplayName(selectedEmployee)} (${selectedEmployee.emp_id})`
                    : 'Select Employee'}
                </span>
                <User className="w-3 h-3 text-gray-400" />
              </div>
              {!record && form.emp_id && (
                <button onClick={() => { handleChange('emp_id', ''); setSelectedEmployee(null); handleChange('dept_id', ''); handleChange('cost_center', ''); }} className="p-0.5 text-gray-400 hover:text-red-600"><X className="w-3 h-3" /></button>
              )}
            </div>
            {errors.emp_id && <p className="text-red-600 text-[9px] mt-0.5">{errors.emp_id}</p>}
          </div>

          {/* Department (read-only, auto-filled) */}
          <div>
            <label className="block font-medium mb-0.5">Department</label>
            <div className="flex items-center gap-1">
              <div className="flex-1 px-2 py-1 border rounded bg-gray-100 text-gray-700 flex items-center justify-between cursor-not-allowed">
                <span className={form.dept_id ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedEmployee?.department
                    ? `${selectedEmployee.department.name} (${selectedEmployee.department.dept_id})`
                    : form.dept_id
                    ? `ID: ${form.dept_id}`
                    : 'Auto-filled from employee'}
                </span>
                <Briefcase className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Cost Center (read-only, auto-filled) */}
          <div>
            <label className="block font-medium mb-0.5">Cost Center</label>
            <div className="flex items-center gap-1">
              <div className="flex-1 px-2 py-1 border rounded bg-gray-100 text-gray-700 flex items-center justify-between cursor-not-allowed">
                <span className={form.cost_center ? 'text-gray-900' : 'text-gray-400'}>
                  {form.cost_center || 'Auto-filled from employee'}
                </span>
                <Briefcase className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Title and Category */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium mb-0.5">Title *</label>
              <input value={form.title} onChange={e => handleChange('title', e.target.value)} className={`w-full border rounded px-2 py-1 ${errors.title ? 'border-red-500' : ''}`} disabled={loading} />
              {errors.title && <p className="text-red-600 text-[9px] mt-0.5">{errors.title}</p>}
            </div>
            <div>
              <label className="block font-medium mb-0.5">Category</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading}>
                <option value="travel">Travel</option>
                <option value="food">Food</option>
                <option value="accommodation">Accommodation</option>
                <option value="transport">Transport</option>
                <option value="medical">Medical</option>
                <option value="training">Training</option>
                <option value="office_supplies">Office Supplies</option>
                <option value="client_meeting">Client Meeting</option>
                <option value="internet">Internet</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Date and Amount */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium mb-0.5">Date *</label>
              <input type="date" value={form.expense_date} onChange={e => handleChange('expense_date', e.target.value)} className={`w-full border rounded px-2 py-1 ${errors.expense_date ? 'border-red-500' : ''}`} disabled={loading} />
              {errors.expense_date && <p className="text-red-600 text-[9px] mt-0.5">{errors.expense_date}</p>}
            </div>
            <div>
              <label className="block font-medium mb-0.5">Total Amount *</label>
              <input type="number" value={form.total_amount} onChange={e => handleChange('total_amount', e.target.value)} className={`w-full border rounded px-2 py-1 ${errors.total_amount ? 'border-red-500' : ''}`} min="0" step="0.01" disabled={loading} />
              {errors.total_amount && <p className="text-red-600 text-[9px] mt-0.5">{errors.total_amount}</p>}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-0.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => handleChange('description', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium mb-0.5">Vendor Name</label>
              <input value={form.vendor_name} onChange={e => handleChange('vendor_name', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
            </div>
            <div>
              <label className="block font-medium mb-0.5">Business Purpose</label>
              <input value={form.business_purpose} onChange={e => handleChange('business_purpose', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium mb-0.5">Project ID</label>
              <input type="number" value={form.project_id} onChange={e => handleChange('project_id', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
            </div>
            <div>
              <label className="block font-medium mb-0.5">Receipt URL</label>
              <input value={form.receipt_url} onChange={e => handleChange('receipt_url', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.reimbursable} onChange={e => handleChange('reimbursable', e.target.checked)} disabled={loading} className="rounded" />
            <label className="text-[10px]">Reimbursable</label>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-3 border-t bg-gray-50">
          <button onClick={onClose} className="px-3 py-1 border rounded bg-white" disabled={loading}>Cancel</button>
          <button onClick={handleSave} className="px-3 py-1 bg-primary-600 text-white rounded flex items-center gap-1" disabled={loading}>
            <Save className="w-3 h-3" /> {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Employee Modal only */}
      <Suspense fallback={null}>
        {showEmployeeModal && (
          <EmployeeSelectionModal
            show={showEmployeeModal}
            onClose={() => setShowEmployeeModal(false)}
            onSelect={handleEmployeeSelect}
            selectedEmployeeId={form.emp_id || null}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ExpenseModal;