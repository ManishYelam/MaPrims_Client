import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Calendar, FileText, DollarSign } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const PayrollRunModal = ({ show, record, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    payroll_code: '',
    payroll_month: 1,
    payroll_year: new Date().getFullYear(),
    period_start: '',
    period_end: '',
    payment_date: '',
    status: 'draft',
    notes: '',
  });

  const isEdit = !!record;

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Auto-fill period_start and period_end based on month/year
  const autoFillPeriodDates = useCallback((month, year) => {
    if (!month || !year) return;
    // Month is 1-based, so subtract 1 for Date
    const startDate = new Date(year, month - 1, 1);
    // Last day of month: create date with day 0 of next month
    const endDate = new Date(year, month, 0);
    setFormData(prev => ({
      ...prev,
      period_start: formatDate(startDate),
      period_end: formatDate(endDate),
    }));
  }, []);

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (record) {
      setFormData({
        name: record.name || '',
        payroll_code: record.payroll_code || '',
        payroll_month: record.payroll_month || 1,
        payroll_year: record.payroll_year || new Date().getFullYear(),
        period_start: record.period_start || '',
        period_end: record.period_end || '',
        payment_date: record.payment_date || '',
        status: record.status || 'draft',
        notes: record.notes || '',
      });
      // If editing and period dates are missing, auto-fill them
      if (!record.period_start || !record.period_end) {
        autoFillPeriodDates(record.payroll_month || 1, record.payroll_year || new Date().getFullYear());
      }
    } else {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      setFormData({
        name: '',
        payroll_code: '',
        payroll_month: currentMonth,
        payroll_year: currentYear,
        period_start: '',
        period_end: '',
        payment_date: '',
        status: 'draft',
        notes: '',
      });
      // Auto-fill for new record
      autoFillPeriodDates(currentMonth, currentYear);
    }
    setValidationErrors({});
  }, [record, autoFillPeriodDates]);

  // Recalculate period dates when month or year changes
  useEffect(() => {
    // Only auto-fill when not editing? Actually always auto-fill if user changes month/year
    if (formData.payroll_month && formData.payroll_year) {
      autoFillPeriodDates(formData.payroll_month, formData.payroll_year);
    }
  }, [formData.payroll_month, formData.payroll_year, autoFillPeriodDates]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Payroll run name is required';
    if (!formData.payroll_month || formData.payroll_month < 1 || formData.payroll_month > 12) errors.payroll_month = 'Month must be between 1 and 12';
    if (!formData.payroll_year || formData.payroll_year < 2000 || formData.payroll_year > 2100) errors.payroll_year = 'Year is invalid';
    if (formData.period_start && formData.period_end && new Date(formData.period_end) < new Date(formData.period_start)) {
      errors.period_end = 'End date cannot be before start date';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.payroll_code) delete payload.payroll_code;
      if (!payload.period_start) delete payload.period_start;
      if (!payload.period_end) delete payload.period_end;
      if (!payload.payment_date) delete payload.payment_date;
      if (!payload.notes) delete payload.notes;

      const response = record
        ? await hrAPI.updatePayrollRun(record.payroll_run_id, payload)
        : await hrAPI.createPayrollRun(payload);

      if (response.data?.success) {
        onSaved();
      } else {
        throw new Error(response.data?.message || 'Save failed');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'An error occurred while saving.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-2xl w-full h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-b">
          <h2 className="text-sm font-semibold">{record ? 'Edit Payroll Run' : 'Create Payroll Run'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Payroll Run Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.name ? 'border-red-500' : ''}`}
                placeholder="January 2025 Payroll"
                disabled={saveLoading}
              />
              {validationErrors.name && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.name}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Payroll Code</label>
              <input
                type="text"
                value={formData.payroll_code}
                onChange={e => handleChange('payroll_code', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="PR-2025-01"
                disabled={saveLoading}
              />
            </div>
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.payroll_month}
                onChange={e => handleChange('payroll_month', parseInt(e.target.value))}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.payroll_month ? 'border-red-500' : ''}`}
                disabled={saveLoading}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              {validationErrors.payroll_month && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.payroll_month}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.payroll_year}
                onChange={e => handleChange('payroll_year', parseInt(e.target.value) || new Date().getFullYear())}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.payroll_year ? 'border-red-500' : ''}`}
                min="2000"
                max="2100"
                disabled={saveLoading}
              />
              {validationErrors.payroll_year && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.payroll_year}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Period & Payment</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Period Start</label>
                <input
                  type="date"
                  value={formData.period_start}
                  onChange={e => handleChange('period_start', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 bg-gray-100 cursor-not-allowed"
                  disabled
                  title="Auto-filled from month/year"
                />
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Period End</label>
                <input
                  type="date"
                  value={formData.period_end}
                  onChange={e => handleChange('period_end', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 bg-gray-100 cursor-not-allowed"
                  disabled
                  title="Auto-filled from month/year"
                />
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Payment Date</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={e => handleChange('payment_date', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  disabled={saveLoading}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Status</label>
            <select
              value={formData.status}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
              disabled={saveLoading}
            >
              <option value="draft">Draft</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Notes</label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 resize-none"
              placeholder="Additional notes or remarks"
              disabled={saveLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {record ? `Editing payroll run #${record.payroll_run_id}` : 'New payroll run'}
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
  );
};

export default PayrollRunModal;