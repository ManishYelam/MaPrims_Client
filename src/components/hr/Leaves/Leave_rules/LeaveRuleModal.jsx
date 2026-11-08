import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Send, AlertCircle } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const LeaveRuleModal = ({ show, rule, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    // Basic
    leave_type_id: '',
    accrual_method: 'monthly',
    accrual_rate: 0,
    accrual_frequency: 'monthly',
    accrual_start_from: 'hire_date',
    fixed_accrual_date: null,
    pro_rata_for_new_hire: false,

    // Balance & Limits
    max_balance: 30,
    min_service_days: 0,
    min_age: 0,
    min_tenure_months: 0,

    // Restrictions
    employment_types: [],
    dept_ids: [],
    position_ids: [],
    gender_restriction: 'both',
    work_location_ids: [],
    employee_statuses: ['active'],
    probation_only: false,
    exclude_terminated: true,

    // Carry Over
    carry_over_allowed: false,
    carry_over_max: 0,
    carry_over_expiry_months: 3,
    carry_over_priority: 'oldest_first',

    // Leave Rules
    notice_period_days: 0,
    max_consecutive_days: 0,
    min_gap_days: 0,
    blockout_periods: [],
    half_day_allowed: true,
    multiple_types_allowed: false,
    max_requests_per_month: 0,
    auto_approve_threshold: 0,
    escalation_hours: 48,
    allow_reapply_after_days: 0,
    delegate_allowed: false,
    deduction_percentage: 0,

    // Encashment
    encashment_allowed: false,
    encashment_cap: 0,
    encashment_frequency: 'yearly',

    // Calendar
    exclude_weekends: true,
    exclude_holidays: true,
    working_days_only: true,

    // Document
    requires_document: false,
    document_types: [],

    // Notifications
    notify_employee_on_submit: true,
    notify_approver_on_submit: true,
    notify_employee_on_approval: true,
    notify_employee_on_rejection: true,
    reminder_days_before: 1,

    // Metadata
    inherited_from: null,
    custom_rules: {},
  });

  // Fetch leave types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await hrAPI.getLeaveTypes();
        if (res.data?.success) setLeaveTypes(res.data.data || []);
      } catch (err) { console.error(err); }
    };
    if (show) fetchTypes();
  }, [show]);

  // Populate form when editing
  useEffect(() => {
    if (rule) {
      setFormData({
        leave_type_id: rule.leave_type_id || '',
        accrual_method: rule.accrual_method || 'monthly',
        accrual_rate: rule.accrual_rate ?? 0,
        accrual_frequency: rule.accrual_frequency || 'monthly',
        accrual_start_from: rule.accrual_start_from || 'hire_date',
        fixed_accrual_date: rule.fixed_accrual_date || null,
        pro_rata_for_new_hire: rule.pro_rata_for_new_hire ?? false,
        max_balance: rule.max_balance ?? 30,
        min_service_days: rule.min_service_days ?? 0,
        min_age: rule.min_age ?? 0,
        min_tenure_months: rule.min_tenure_months ?? 0,
        employment_types: rule.employment_types || [],
        dept_ids: rule.dept_ids || [],
        position_ids: rule.position_ids || [],
        gender_restriction: rule.gender_restriction || 'both',
        work_location_ids: rule.work_location_ids || [],
        employee_statuses: rule.employee_statuses || ['active'],
        probation_only: rule.probation_only ?? false,
        exclude_terminated: rule.exclude_terminated ?? true,
        carry_over_allowed: rule.carry_over_allowed ?? false,
        carry_over_max: rule.carry_over_max ?? 0,
        carry_over_expiry_months: rule.carry_over_expiry_months ?? 3,
        carry_over_priority: rule.carry_over_priority || 'oldest_first',
        notice_period_days: rule.notice_period_days ?? 0,
        max_consecutive_days: rule.max_consecutive_days ?? 0,
        min_gap_days: rule.min_gap_days ?? 0,
        blockout_periods: rule.blockout_periods || [],
        half_day_allowed: rule.half_day_allowed ?? true,
        multiple_types_allowed: rule.multiple_types_allowed ?? false,
        max_requests_per_month: rule.max_requests_per_month ?? 0,
        auto_approve_threshold: rule.auto_approve_threshold ?? 0,
        escalation_hours: rule.escalation_hours ?? 48,
        allow_reapply_after_days: rule.allow_reapply_after_days ?? 0,
        delegate_allowed: rule.delegate_allowed ?? false,
        deduction_percentage: rule.deduction_percentage ?? 0,
        encashment_allowed: rule.encashment_allowed ?? false,
        encashment_cap: rule.encashment_cap ?? 0,
        encashment_frequency: rule.encashment_frequency || 'yearly',
        exclude_weekends: rule.exclude_weekends ?? true,
        exclude_holidays: rule.exclude_holidays ?? true,
        working_days_only: rule.working_days_only ?? true,
        requires_document: rule.requires_document ?? false,
        document_types: rule.document_types || [],
        notify_employee_on_submit: rule.notify_employee_on_submit ?? true,
        notify_approver_on_submit: rule.notify_approver_on_submit ?? true,
        notify_employee_on_approval: rule.notify_employee_on_approval ?? true,
        notify_employee_on_rejection: rule.notify_employee_on_rejection ?? true,
        reminder_days_before: rule.reminder_days_before ?? 1,
        inherited_from: rule.inherited_from || null,
        custom_rules: rule.custom_rules || {},
      });
    } else {
      // Reset to defaults
      setFormData({
        leave_type_id: '',
        accrual_method: 'monthly',
        accrual_rate: 0,
        accrual_frequency: 'monthly',
        accrual_start_from: 'hire_date',
        fixed_accrual_date: null,
        pro_rata_for_new_hire: false,
        max_balance: 30,
        min_service_days: 0,
        min_age: 0,
        min_tenure_months: 0,
        employment_types: [],
        dept_ids: [],
        position_ids: [],
        gender_restriction: 'both',
        work_location_ids: [],
        employee_statuses: ['active'],
        probation_only: false,
        exclude_terminated: true,
        carry_over_allowed: false,
        carry_over_max: 0,
        carry_over_expiry_months: 3,
        carry_over_priority: 'oldest_first',
        notice_period_days: 0,
        max_consecutive_days: 0,
        min_gap_days: 0,
        blockout_periods: [],
        half_day_allowed: true,
        multiple_types_allowed: false,
        max_requests_per_month: 0,
        auto_approve_threshold: 0,
        escalation_hours: 48,
        allow_reapply_after_days: 0,
        delegate_allowed: false,
        deduction_percentage: 0,
        encashment_allowed: false,
        encashment_cap: 0,
        encashment_frequency: 'yearly',
        exclude_weekends: true,
        exclude_holidays: true,
        working_days_only: true,
        requires_document: false,
        document_types: [],
        notify_employee_on_submit: true,
        notify_approver_on_submit: true,
        notify_employee_on_approval: true,
        notify_employee_on_rejection: true,
        reminder_days_before: 1,
        inherited_from: null,
        custom_rules: {},
      });
    }
    setValidationErrors({});
  }, [rule]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
    }
  };

  // Helper for array fields (comma-separated input)
  const handleArrayChange = (field, value) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    handleChange(field, arr);
  };

  const validate = () => {
    const errors = {};
    if (!formData.leave_type_id) errors.leave_type_id = 'Leave type is required';
    if (!formData.accrual_method) errors.accrual_method = 'Accrual method is required';
    if (formData.accrual_rate < 0) errors.accrual_rate = 'Must be >= 0';
    if (formData.max_balance < 0) errors.max_balance = 'Must be >= 0';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (status = 'draft') => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = { ...formData, status: status };
      // Clean up empty arrays / nulls
      if (payload.fixed_accrual_date === '') payload.fixed_accrual_date = null;
      if (payload.inherited_from === '') payload.inherited_from = null;
      const response = rule
        ? await hrAPI.updateLeaveRule(rule.leave_rule_id, payload)
        : await hrAPI.createLeaveRule(payload);
      if (response.data?.success) {
        onSaved();
      } else {
        throw new Error(response.data?.message || 'Save failed');
      }
    } catch (err) {
      console.error(err);
      // Could show toast via parent
    } finally {
      setSaveLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-4xl w-full h-[95vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-b">
          <h2 className="text-sm font-semibold">{rule ? 'Edit Leave Rule' : 'Create Leave Rule'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Leave Type <span className="text-red-500">*</span></label>
              <select
                value={formData.leave_type_id}
                onChange={e => handleChange('leave_type_id', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.leave_type_id ? 'border-red-500' : ''}`}
                disabled={saveLoading}
              >
                <option value="">Select</option>
                {leaveTypes.map(lt => <option key={lt.leave_type_id} value={lt.leave_type_id}>{lt.name}</option>)}
              </select>
              {validationErrors.leave_type_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.leave_type_id}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Accrual Method <span className="text-red-500">*</span></label>
              <select
                value={formData.accrual_method}
                onChange={e => handleChange('accrual_method', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.accrual_method ? 'border-red-500' : ''}`}
                disabled={saveLoading}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="per_project">Per Project</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Accrual Frequency</label>
              <input
                type="text"
                value={formData.accrual_frequency}
                onChange={e => handleChange('accrual_frequency', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., monthly"
                disabled={saveLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Accrual Rate</label>
              <input
                type="number"
                value={formData.accrual_rate}
                onChange={e => handleChange('accrual_rate', parseFloat(e.target.value) || 0)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.accrual_rate ? 'border-red-500' : ''}`}
                step="0.01"
                min="0"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Max Balance</label>
              <input
                type="number"
                value={formData.max_balance}
                onChange={e => handleChange('max_balance', parseFloat(e.target.value) || 0)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.max_balance ? 'border-red-500' : ''}`}
                step="0.01"
                min="0"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Accrual Start From</label>
              <select
                value={formData.accrual_start_from}
                onChange={e => handleChange('accrual_start_from', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                disabled={saveLoading}
              >
                <option value="hire_date">Hire Date</option>
                <option value="fixed_date">Fixed Date</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Fixed Accrual Date</label>
              <input
                type="date"
                value={formData.fixed_accrual_date || ''}
                onChange={e => handleChange('fixed_accrual_date', e.target.value || null)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                disabled={saveLoading}
              />
            </div>
          </div>

          {/* Pro Rata & Limits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={formData.pro_rata_for_new_hire}
                onChange={e => handleChange('pro_rata_for_new_hire', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 w-3 h-3"
                disabled={saveLoading}
              />
              <label className="text-[10px] font-medium text-gray-700">Pro Rata for New Hire</label>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Min Service Days</label>
              <input
                type="number"
                value={formData.min_service_days}
                onChange={e => handleChange('min_service_days', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                min="0"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Min Age</label>
              <input
                type="number"
                value={formData.min_age}
                onChange={e => handleChange('min_age', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                min="0"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Min Tenure Months</label>
              <input
                type="number"
                value={formData.min_tenure_months}
                onChange={e => handleChange('min_tenure_months', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                min="0"
                disabled={saveLoading}
              />
            </div>
          </div>

          {/* Restrictions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Gender Restriction</label>
              <select
                value={formData.gender_restriction}
                onChange={e => handleChange('gender_restriction', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                disabled={saveLoading}
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employee Statuses (comma)</label>
              <input
                type="text"
                value={formData.employee_statuses.join(', ')}
                onChange={e => handleArrayChange('employee_statuses', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="active, probation"
                disabled={saveLoading}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.probation_only}
                  onChange={e => handleChange('probation_only', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                <label className="text-[10px] font-medium text-gray-700">Probation Only</label>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.exclude_terminated}
                  onChange={e => handleChange('exclude_terminated', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                <label className="text-[10px] font-medium text-gray-700">Exclude Terminated</label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employment Types (comma)</label>
              <input
                type="text"
                value={formData.employment_types.join(', ')}
                onChange={e => handleArrayChange('employment_types', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="full_time, part_time"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Dept IDs (comma)</label>
              <input
                type="text"
                value={formData.dept_ids.join(', ')}
                onChange={e => handleArrayChange('dept_ids', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="1, 2, 3"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Position IDs (comma)</label>
              <input
                type="text"
                value={formData.position_ids.join(', ')}
                onChange={e => handleArrayChange('position_ids', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="1, 2, 3"
                disabled={saveLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Work Location IDs (comma)</label>
              <input
                type="text"
                value={formData.work_location_ids.join(', ')}
                onChange={e => handleArrayChange('work_location_ids', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="1, 2, 3"
                disabled={saveLoading}
              />
            </div>
          </div>

          {/* Carry Over */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Carry Over</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.carry_over_allowed}
                  onChange={e => handleChange('carry_over_allowed', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                <label className="text-[10px] font-medium text-gray-700">Allowed</label>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Max Carry Over</label>
                <input
                  type="number"
                  value={formData.carry_over_max}
                  onChange={e => handleChange('carry_over_max', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  step="0.01"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Expiry Months</label>
                <input
                  type="number"
                  value={formData.carry_over_expiry_months}
                  onChange={e => handleChange('carry_over_expiry_months', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Priority</label>
                <select
                  value={formData.carry_over_priority}
                  onChange={e => handleChange('carry_over_priority', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  disabled={saveLoading}
                >
                  <option value="oldest_first">Oldest First</option>
                  <option value="newest_first">Newest First</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leave Rules */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Leave Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Notice Period Days</label>
                <input
                  type="number"
                  value={formData.notice_period_days}
                  onChange={e => handleChange('notice_period_days', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Max Consecutive Days</label>
                <input
                  type="number"
                  value={formData.max_consecutive_days}
                  onChange={e => handleChange('max_consecutive_days', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  step="0.5"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Min Gap Days</label>
                <input
                  type="number"
                  value={formData.min_gap_days}
                  onChange={e => handleChange('min_gap_days', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Max Requests/Month</label>
                <input
                  type="number"
                  value={formData.max_requests_per_month}
                  onChange={e => handleChange('max_requests_per_month', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Auto Approve Threshold</label>
                <input
                  type="number"
                  value={formData.auto_approve_threshold}
                  onChange={e => handleChange('auto_approve_threshold', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  step="0.01"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Escalation Hours</label>
                <input
                  type="number"
                  value={formData.escalation_hours}
                  onChange={e => handleChange('escalation_hours', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Allow Reapply After Days</label>
                <input
                  type="number"
                  value={formData.allow_reapply_after_days}
                  onChange={e => handleChange('allow_reapply_after_days', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
            </div>
          </div>

          {/* Boolean Toggles */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Leave Options</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
              {[
                { key: 'half_day_allowed', label: 'Half Day Allowed' },
                { key: 'multiple_types_allowed', label: 'Multiple Types' },
                { key: 'delegate_allowed', label: 'Delegate Allowed' },
                { key: 'encashment_allowed', label: 'Encashment Allowed' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1 text-[10px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData[key] || false}
                    onChange={e => handleChange(key, e.target.checked)}
                    disabled={saveLoading}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Encashment Details */}
          {formData.encashment_allowed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t pt-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Encashment Cap</label>
                <input
                  type="number"
                  value={formData.encashment_cap}
                  onChange={e => handleChange('encashment_cap', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  step="0.01"
                  min="0"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Encashment Frequency</label>
                <select
                  value={formData.encashment_frequency}
                  onChange={e => handleChange('encashment_frequency', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  disabled={saveLoading}
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="on_demand">On Demand</option>
                </select>
              </div>
            </div>
          )}

          {/* Deduction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t pt-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Deduction Percentage</label>
              <input
                type="number"
                value={formData.deduction_percentage}
                onChange={e => handleChange('deduction_percentage', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                step="0.01"
                min="0"
                max="100"
                disabled={saveLoading}
              />
            </div>
          </div>

          {/* Calendar */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Calendar & Working Days</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {[
                { key: 'exclude_weekends', label: 'Exclude Weekends' },
                { key: 'exclude_holidays', label: 'Exclude Holidays' },
                { key: 'working_days_only', label: 'Working Days Only' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1 text-[10px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData[key] || false}
                    onChange={e => handleChange(key, e.target.checked)}
                    disabled={saveLoading}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Document */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Document Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.requires_document}
                  onChange={e => handleChange('requires_document', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={saveLoading}
                />
                <label className="text-[10px] font-medium text-gray-700">Requires Document</label>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Document Types (comma)</label>
                <input
                  type="text"
                  value={formData.document_types.join(', ')}
                  onChange={e => handleArrayChange('document_types', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  placeholder="certificate, approval"
                  disabled={saveLoading}
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Notifications</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
              {[
                { key: 'notify_employee_on_submit', label: 'Emp on Submit' },
                { key: 'notify_approver_on_submit', label: 'Approver on Submit' },
                { key: 'notify_employee_on_approval', label: 'Emp on Approval' },
                { key: 'notify_employee_on_rejection', label: 'Emp on Rejection' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1 text-[10px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData[key] || false}
                    onChange={e => handleChange(key, e.target.checked)}
                    disabled={saveLoading}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-1">
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Reminder Days Before</label>
              <input
                type="number"
                value={formData.reminder_days_before}
                onChange={e => handleChange('reminder_days_before', parseInt(e.target.value) || 0)}
                className="w-24 px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                min="0"
                disabled={saveLoading}
              />
            </div>
          </div>

          {/* Inherited & Custom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t pt-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Inherited From</label>
              <input
                type="number"
                value={formData.inherited_from || ''}
                onChange={e => handleChange('inherited_from', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                placeholder="Parent rule ID"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Custom Rules (JSON)</label>
              <textarea
                rows="2"
                value={JSON.stringify(formData.custom_rules, null, 2)}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange('custom_rules', parsed);
                  } catch (err) {
                    // Ignore invalid JSON for now
                  }
                }}
                className="w-full px-2 py-1 border rounded text-xs font-mono focus:ring-1 focus:ring-primary-500"
                placeholder='{"key": "value"}'
                disabled={saveLoading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">{rule ? 'Editing existing rule' : 'New rule'}</p>
          <div className="flex gap-1.5">
            <button onClick={onClose} className="px-2.5 py-1 text-[10px] border rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled={saveLoading}>Cancel</button>
            <button onClick={() => handleSave('draft')} className="px-2.5 py-1 text-[10px] border rounded bg-gray-200 hover:bg-gray-300 flex items-center gap-1 disabled:opacity-50" disabled={saveLoading}>
              <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Draft'}
            </button>
            <button onClick={() => handleSave('active')} className="px-2.5 py-1 text-[10px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50" disabled={saveLoading}>
              <Send className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRuleModal;