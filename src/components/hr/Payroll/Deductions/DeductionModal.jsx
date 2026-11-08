import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, FileText, Percent, CheckCircle } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const DeductionModal = ({ show, record, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'fixed',
    calculation_basis: 'fixed_amount',
    value: 0,
    percentage: 0,
    minimum_amount: '',
    maximum_amount: '',
    is_mandatory: true,
    tax_deductible: false,
    included_in_payslip: true,
    prorate_on_joining: true,
    prorate_on_exit: true,
    applicable_departments: '[]',
    applicable_positions: '[]',
    applicable_employment_types: '[]',
    status: 'active',
  });

  const isEdit = !!record;

  // Populate form when editing or reset for create
  useEffect(() => {
    if (record) {
      setFormData({
        name: record.name || '',
        code: record.code || '',
        description: record.description || '',
        type: record.type || 'fixed',
        calculation_basis: record.calculation_basis || 'fixed_amount',
        value: record.value || 0,
        percentage: record.percentage || 0,
        minimum_amount: record.minimum_amount || '',
        maximum_amount: record.maximum_amount || '',
        is_mandatory: record.is_mandatory !== undefined ? record.is_mandatory : true,
        tax_deductible: record.tax_deductible !== undefined ? record.tax_deductible : false,
        included_in_payslip: record.included_in_payslip !== undefined ? record.included_in_payslip : true,
        prorate_on_joining: record.prorate_on_joining !== undefined ? record.prorate_on_joining : true,
        prorate_on_exit: record.prorate_on_exit !== undefined ? record.prorate_on_exit : true,
        applicable_departments: JSON.stringify(record.applicable_departments || []),
        applicable_positions: JSON.stringify(record.applicable_positions || []),
        applicable_employment_types: JSON.stringify(record.applicable_employment_types || []),
        status: record.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        type: 'fixed',
        calculation_basis: 'fixed_amount',
        value: 0,
        percentage: 0,
        minimum_amount: '',
        maximum_amount: '',
        is_mandatory: true,
        tax_deductible: false,
        included_in_payslip: true,
        prorate_on_joining: true,
        prorate_on_exit: true,
        applicable_departments: '[]',
        applicable_positions: '[]',
        applicable_employment_types: '[]',
        status: 'active',
      });
    }
    setValidationErrors({});
  }, [record]);

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
    if (!formData.name.trim()) errors.name = 'Deduction name is required';
    if (formData.type === 'percentage' && (isNaN(parseFloat(formData.percentage)) || parseFloat(formData.percentage) < 0)) {
      errors.percentage = 'Percentage must be a non-negative number';
    }
    try { JSON.parse(formData.applicable_departments || '[]'); } catch (e) { errors.applicable_departments = 'Invalid JSON'; }
    try { JSON.parse(formData.applicable_positions || '[]'); } catch (e) { errors.applicable_positions = 'Invalid JSON'; }
    try { JSON.parse(formData.applicable_employment_types || '[]'); } catch (e) { errors.applicable_employment_types = 'Invalid JSON'; }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        percentage: parseFloat(formData.percentage) || 0,
        minimum_amount: formData.minimum_amount ? parseFloat(formData.minimum_amount) : null,
        maximum_amount: formData.maximum_amount ? parseFloat(formData.maximum_amount) : null,
        applicable_departments: JSON.parse(formData.applicable_departments || '[]'),
        applicable_positions: JSON.parse(formData.applicable_positions || '[]'),
        applicable_employment_types: JSON.parse(formData.applicable_employment_types || '[]'),
      };

      const response = record
        ? await hrAPI.updateDeduction(record.deduction_id, payload)
        : await hrAPI.createDeduction(payload);

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
      <div className="bg-white rounded-md max-w-3xl w-full h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-b">
          <h2 className="text-sm font-semibold">{record ? 'Edit Deduction' : 'Create Deduction'}</h2>
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
                Deduction Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.name ? 'border-red-500' : ''}`}
                placeholder="Provident Fund"
                disabled={saveLoading}
              />
              {validationErrors.name && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.name}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={e => handleChange('code', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="PF"
                disabled={saveLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 resize-none"
              placeholder="Deduction description"
              disabled={saveLoading}
            />
          </div>

          {/* Type & Calculation Basis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Type</label>
              <select
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                disabled={saveLoading}
              >
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
                <option value="statutory">Statutory</option>
                <option value="loan">Loan</option>
                <option value="penalty">Penalty</option>
                <option value="tax">Tax</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Calculation Basis</label>
              <select
                value={formData.calculation_basis}
                onChange={e => handleChange('calculation_basis', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                disabled={saveLoading}
              >
                <option value="fixed_amount">Fixed Amount</option>
                <option value="base_salary_percentage">Base Salary Percentage</option>
                <option value="gross_salary_percentage">Gross Salary Percentage</option>
              </select>
            </div>
          </div>

          {/* Value / Percentage / Min-Max */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Value</label>
              <input
                type="number"
                value={formData.value}
                onChange={e => handleChange('value', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                step="0.01"
                min="0"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Percentage</label>
              <input
                type="number"
                value={formData.percentage}
                onChange={e => handleChange('percentage', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.percentage ? 'border-red-500' : ''}`}
                step="0.01"
                min="0"
                disabled={saveLoading}
              />
              {validationErrors.percentage && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.percentage}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Min Amount</label>
              <input
                type="number"
                value={formData.minimum_amount}
                onChange={e => handleChange('minimum_amount', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                step="0.01"
                min="0"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Max Amount</label>
              <input
                type="number"
                value={formData.maximum_amount}
                onChange={e => handleChange('maximum_amount', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                step="0.01"
                min="0"
                disabled={saveLoading}
              />
            </div>
          </div>

          {/* Flags */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Flags</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center gap-1 text-[10px] text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.is_mandatory}
                  onChange={e => handleChange('is_mandatory', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                Mandatory
              </label>
              <label className="flex items-center gap-1 text-[10px] text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.tax_deductible}
                  onChange={e => handleChange('tax_deductible', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                Tax Deductible
              </label>
              <label className="flex items-center gap-1 text-[10px] text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.included_in_payslip}
                  onChange={e => handleChange('included_in_payslip', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                Included in Payslip
              </label>
              <label className="flex items-center gap-1 text-[10px] text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.prorate_on_joining}
                  onChange={e => handleChange('prorate_on_joining', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                Prorate on Joining
              </label>
              <label className="flex items-center gap-1 text-[10px] text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.prorate_on_exit}
                  onChange={e => handleChange('prorate_on_exit', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                Prorate on Exit
              </label>
            </div>
          </div>

          {/* Applicable JSON arrays */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Applicable To (JSON arrays)</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Departments</label>
                <textarea
                  rows="2"
                  value={formData.applicable_departments}
                  onChange={e => handleChange('applicable_departments', e.target.value)}
                  className={`w-full px-2 py-1 border rounded text-xs font-mono focus:ring-1 focus:ring-primary-500 ${validationErrors.applicable_departments ? 'border-red-500' : ''}`}
                  placeholder='["HR", "IT"]'
                  disabled={saveLoading}
                />
                {validationErrors.applicable_departments && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.applicable_departments}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Positions</label>
                <textarea
                  rows="2"
                  value={formData.applicable_positions}
                  onChange={e => handleChange('applicable_positions', e.target.value)}
                  className={`w-full px-2 py-1 border rounded text-xs font-mono focus:ring-1 focus:ring-primary-500 ${validationErrors.applicable_positions ? 'border-red-500' : ''}`}
                  placeholder='["Manager", "Developer"]'
                  disabled={saveLoading}
                />
                {validationErrors.applicable_positions && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.applicable_positions}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employment Types</label>
                <textarea
                  rows="2"
                  value={formData.applicable_employment_types}
                  onChange={e => handleChange('applicable_employment_types', e.target.value)}
                  className={`w-full px-2 py-1 border rounded text-xs font-mono focus:ring-1 focus:ring-primary-500 ${validationErrors.applicable_employment_types ? 'border-red-500' : ''}`}
                  placeholder='["full_time", "contract"]'
                  disabled={saveLoading}
                />
                {validationErrors.applicable_employment_types && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.applicable_employment_types}</p>}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {record ? `Editing deduction #${record.deduction_id}` : 'New deduction'}
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

export default DeductionModal;