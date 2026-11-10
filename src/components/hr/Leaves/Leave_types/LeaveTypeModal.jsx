// src/modules/Leave/Leave_types/LeaveTypeModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Tag, Settings, Gift, Shield, Clock, Palette, Eye } from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const LeaveTypeModal = ({ show, leaveType, onClose, onSaved, readOnly = false }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_paid: true,
    annual_quota: 0,
    max_consecutive_days: '',
    minimum_notice_days: 0,
    carry_forward_allowed: false,
    max_carry_forward_days: 0,
    encashment_allowed: false,
    approval_required: true,
    document_required: false,
    document_required_after_days: '',
    half_day_allowed: true,
    applicable_gender: 'all',
    available_during_probation: true,
    color: '',
    icon: '',
    // NOTE: status is workflow-managed — see LeaveTypeManagement quick actions.
    custom_fields: {},
  });

  useEffect(() => {
    if (!show) return;

    if (leaveType) {
      setFormData({
        name: leaveType.name || '',
        code: leaveType.code || '',
        description: leaveType.description || '',
        is_paid: leaveType.is_paid ?? true,
        annual_quota: leaveType.annual_quota ?? 0,
        max_consecutive_days: leaveType.max_consecutive_days ?? '',
        minimum_notice_days: leaveType.minimum_notice_days ?? 0,
        carry_forward_allowed: leaveType.carry_forward_allowed ?? false,
        max_carry_forward_days: leaveType.max_carry_forward_days ?? 0,
        encashment_allowed: leaveType.encashment_allowed ?? false,
        approval_required: leaveType.approval_required ?? true,
        document_required: leaveType.document_required ?? false,
        document_required_after_days: leaveType.document_required_after_days ?? '',
        half_day_allowed: leaveType.half_day_allowed ?? true,
        applicable_gender: leaveType.applicable_gender || 'all',
        available_during_probation: leaveType.available_during_probation ?? true,
        color: leaveType.color || '',
        icon: leaveType.icon || '',
        custom_fields: leaveType.custom_fields || {},
      });
    } else {
      setFormData({
        name: '', code: '', description: '',
        is_paid: true, annual_quota: 0, max_consecutive_days: '',
        minimum_notice_days: 0, carry_forward_allowed: false,
        max_carry_forward_days: 0, encashment_allowed: false,
        approval_required: true, document_required: false,
        document_required_after_days: '', half_day_allowed: true,
        applicable_gender: 'all', available_during_probation: true,
        color: '', icon: '', custom_fields: {},
      });
    }
    setValidationErrors({});
  }, [leaveType, show]);

  const validate = useCallback(() => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.code?.trim()) errors.code = 'Code is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = useCallback((field, value) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  }, [validationErrors, readOnly]);

  const handleSave = useCallback(async () => {
    if (readOnly) return;
    if (!validate()) return;

    setSaveLoading(true);
    try {
      const payload = { ...formData };
      if (payload.max_consecutive_days === '') payload.max_consecutive_days = null;
      if (payload.document_required_after_days === '') payload.document_required_after_days = null;

      if (leaveType) {
        // Edit: do NOT send status — workflow-managed via row quick actions
        await hrAPI.updateLeaveType(leaveType.leave_type_id, payload);
      } else {
        // Create: always start as 'active'
        await hrAPI.createLeaveType({ ...payload, status: 'active' });
      }
      toast.success(`Leave type ${leaveType ? 'updated' : 'created'}!`);
      onSaved && onSaved();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed';
      toast.error(msg);
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  }, [formData, leaveType, onSaved, validate, readOnly]);

  if (!show) return null;

  const disabled = readOnly || saveLoading;

  // ── compact class helpers ──
  const labelCls = 'text-[10px] font-medium text-gray-700 mb-0.5 block';
  const inputCls = 'w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-3xl w-full max-h-[92vh] flex flex-col shadow-xl">

        {/* ── HEADER — ONLY Save + X ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-b">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold flex items-center gap-1.5">
              {readOnly
                ? <><Eye className="w-3.5 h-3.5 text-blue-600" /> View Leave Type</>
                : (leaveType ? 'Edit Leave Type' : 'Create Leave Type')}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              {leaveType ? `Editing: ${leaveType.name}` : 'New leave type (will be Active)'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!readOnly && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saveLoading}
                className="px-2.5 py-1 text-[11px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="w-3 h-3" /> {saveLoading ? 'Saving…' : 'Save'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saveLoading}
              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY — flat, no accordions ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">

          {/* Basic Information */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b">
              <Tag className="w-3 h-3 text-gray-600" />
              <span className="text-[11px] font-medium">Basic Information</span>
            </div>
            <div className="p-2.5 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className={`${inputCls} ${validationErrors.name ? 'border-red-500' : ''}`}
                    disabled={disabled} />
                  {validationErrors.name && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.name}</p>}
                </div>
                <div>
                  <label className={labelCls}>Code <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.code}
                    onChange={e => handleChange('code', e.target.value)}
                    className={`${inputCls} ${validationErrors.code ? 'border-red-500' : ''}`}
                    disabled={disabled} />
                  {validationErrors.code && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.code}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  className={`${inputCls} resize-none`}
                  disabled={disabled} />
              </div>
            </div>
          </div>

          {/* Quota & Limits */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b">
              <Clock className="w-3 h-3 text-gray-600" />
              <span className="text-[11px] font-medium">Quota & Limits</span>
            </div>
            <div className="p-2.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className={labelCls}>Annual Quota (days)</label>
                  <input type="number" min="0" step="0.5"
                    value={formData.annual_quota}
                    onChange={e => handleChange('annual_quota', parseFloat(e.target.value) || 0)}
                    className={inputCls}
                    disabled={disabled} />
                </div>
                <div>
                  <label className={labelCls}>Max Consecutive Days</label>
                  <input type="number" min="0"
                    value={formData.max_consecutive_days}
                    onChange={e => handleChange('max_consecutive_days', e.target.value)}
                    className={inputCls}
                    disabled={disabled} />
                </div>
                <div>
                  <label className={labelCls}>Minimum Notice (days)</label>
                  <input type="number" min="0"
                    value={formData.minimum_notice_days}
                    onChange={e => handleChange('minimum_notice_days', parseInt(e.target.value) || 0)}
                    className={inputCls}
                    disabled={disabled} />
                </div>
              </div>
            </div>
          </div>

          {/* Carry Forward & Encashment */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b">
              <Gift className="w-3 h-3 text-gray-600" />
              <span className="text-[11px] font-medium">Carry Forward & Encashment</span>
            </div>
            <div className="p-2.5 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox"
                    checked={formData.carry_forward_allowed}
                    onChange={e => handleChange('carry_forward_allowed', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={disabled} />
                  <span className="text-[11px]">Allow carry forward</span>
                </label>
                {formData.carry_forward_allowed && (
                  <div>
                    <label className={labelCls}>Max Carry Forward (days)</label>
                    <input type="number" min="0" step="0.5"
                      value={formData.max_carry_forward_days}
                      onChange={e => handleChange('max_carry_forward_days', parseFloat(e.target.value) || 0)}
                      className={inputCls}
                      disabled={disabled} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox"
                    checked={formData.encashment_allowed}
                    onChange={e => handleChange('encashment_allowed', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={disabled} />
                  <span className="text-[11px]">Encashment allowed</span>
                </label>
              </div>
            </div>
          </div>

          {/* Approval & Documents */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b">
              <Shield className="w-3 h-3 text-gray-600" />
              <span className="text-[11px] font-medium">Approval & Documents</span>
            </div>
            <div className="p-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox"
                    checked={formData.approval_required}
                    onChange={e => handleChange('approval_required', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={disabled} />
                  <span className="text-[11px]">Approval required</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox"
                    checked={formData.document_required}
                    onChange={e => handleChange('document_required', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={disabled} />
                  <span className="text-[11px]">Document required</span>
                </label>
                {formData.document_required && (
                  <div className="md:col-span-2">
                    <label className={labelCls}>Document required after (days)</label>
                    <input type="number" min="0"
                      value={formData.document_required_after_days}
                      onChange={e => handleChange('document_required_after_days', e.target.value)}
                      className={inputCls}
                      disabled={disabled} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b">
              <Settings className="w-3 h-3 text-gray-600" />
              <span className="text-[11px] font-medium">Additional Settings</span>
            </div>
            <div className="p-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox"
                    checked={formData.half_day_allowed}
                    onChange={e => handleChange('half_day_allowed', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={disabled} />
                  <span className="text-[11px]">Half-day allowed</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox"
                    checked={formData.available_during_probation}
                    onChange={e => handleChange('available_during_probation', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={disabled} />
                  <span className="text-[11px]">Available during probation</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox"
                    checked={formData.is_paid}
                    onChange={e => handleChange('is_paid', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={disabled} />
                  <span className="text-[11px]">Paid leave</span>
                </label>
                <div>
                  <label className={labelCls}>Applicable Gender</label>
                  <select value={formData.applicable_gender}
                    onChange={e => handleChange('applicable_gender', e.target.value)}
                    className={inputCls}
                    disabled={disabled}>
                    <option value="all">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Customisation */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b">
              <Palette className="w-3 h-3 text-gray-600" />
              <span className="text-[11px] font-medium">Visual Customisation</span>
            </div>
            <div className="p-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Color</label>
                  <input type="color" value={formData.color || '#cccccc'}
                    onChange={e => handleChange('color', e.target.value)}
                    className="w-full h-8 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={disabled} />
                </div>
                <div>
                  <label className={labelCls}>Icon (auto-assigned)</label>
                  <input type="text" value={formData.icon}
                    onChange={e => handleChange('icon', e.target.value)}
                    placeholder="e.g. Umbrella"
                    className={`${inputCls} bg-gray-50 text-gray-600`}
                    disabled />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER — no buttons ── */}
        <div className="flex-shrink-0 flex items-center justify-end px-2 py-1 border-t bg-gray-50">
          <p className="text-[9px] text-gray-500">
            {leaveType
              ? (leaveType.updated_at ? `Last updated: ${formatDate(leaveType.updated_at)}` : 'Editing leave type')
              : 'New leave type (will be Active)'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeaveTypeModal);