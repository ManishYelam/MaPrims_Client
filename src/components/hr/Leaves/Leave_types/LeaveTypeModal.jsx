// LeaveTypeModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Save, Tag, FileText, Settings, Gift, Shield, Clock,
  ChevronDown, ChevronUp, Palette, Image,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const LeaveTypeModal = ({ show, leaveType, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState('basic');
  const [validationErrors, setValidationErrors] = useState({});

  // Form state – mirrors the LeaveType model fields
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
    status: 'active',
    custom_fields: {},
  });

  // Populate form when editing an existing leave type
  useEffect(() => {
    if (!show) return;

    if (leaveType) {
      setFormData({
        name: leaveType.name || '',
        code: leaveType.code || '',
        description: leaveType.description || '',
        is_paid: leaveType.is_paid ?? true,
        annual_quota: leaveType.annual_quota ?? 0,
        max_consecutive_days: leaveType.max_consecutive_days || '',
        minimum_notice_days: leaveType.minimum_notice_days ?? 0,
        carry_forward_allowed: leaveType.carry_forward_allowed ?? false,
        max_carry_forward_days: leaveType.max_carry_forward_days ?? 0,
        encashment_allowed: leaveType.encashment_allowed ?? false,
        approval_required: leaveType.approval_required ?? true,
        document_required: leaveType.document_required ?? false,
        document_required_after_days: leaveType.document_required_after_days || '',
        half_day_allowed: leaveType.half_day_allowed ?? true,
        applicable_gender: leaveType.applicable_gender || 'all',
        available_during_probation: leaveType.available_during_probation ?? true,
        color: leaveType.color || '',
        icon: leaveType.icon || '',
        status: leaveType.status || 'active',
        custom_fields: leaveType.custom_fields || {},
      });
    } else {
      // Reset to defaults
      setFormData({
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
        status: 'active',
        custom_fields: {},
      });
    }
    setValidationErrors({});
  }, [leaveType, show]);

  // Validation
  const validate = useCallback(() => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.code?.trim()) errors.code = 'Code is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Generic handler
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [validationErrors]);

  // Toggle sections
  const toggleSection = useCallback(section => {
    setExpandedSection(prev => (prev === section ? null : section));
  }, []);

  // Save
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    const savePromise = async () => {
      const payload = { ...formData };
      // Convert empty numeric strings to null
      if (payload.max_consecutive_days === '') payload.max_consecutive_days = null;
      if (payload.document_required_after_days === '') payload.document_required_after_days = null;

      const response = leaveType
        ? await hrAPI.updateLeaveType(leaveType.leave_type_id, payload)
        : await hrAPI.createLeaveType(payload);

      if (response.data) {
        onSaved && onSaved();
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to save leave type');
    };

    try {
      setSaveLoading(true);
      await toast.promise(savePromise(), {
        loading: 'Saving leave type...',
        success: `Leave type ${leaveType ? 'updated' : 'created'}!`,
        error: err => err.response?.data?.message || err.message || 'Save failed',
      });
    } finally {
      setSaveLoading(false);
    }
  }, [formData, leaveType, onSaved, validate]);

  if (!show) return null;

  // ---------- Section Components ----------
  const Section = ({ id, title, icon: Icon, children }) => (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {expandedSection === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expandedSection === id && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b">
          <div>
            <h2 className="text-base font-semibold">
              {leaveType ? 'Edit Leave Type' : 'Add Leave Type'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {leaveType ? `Editing: ${leaveType.name}` : 'Define a new leave type'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Basic Information */}
          <Section id="basic" title="Basic Information" icon={Tag}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded text-sm ${validationErrors.name ? 'border-red-500' : ''}`}
                  disabled={saveLoading}
                />
                {validationErrors.name && <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => handleChange('code', e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded text-sm ${validationErrors.code ? 'border-red-500' : ''}`}
                  disabled={saveLoading}
                />
                {validationErrors.code && <p className="text-xs text-red-600 mt-1">{validationErrors.code}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              />
            </div>
          </Section>

          {/* Quota & Limits */}
          <Section id="quota" title="Quota & Limits" icon={Clock}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Annual Quota (days)</label>
                <input
                  type="number" min="0" step="0.5"
                  value={formData.annual_quota}
                  onChange={e => handleChange('annual_quota', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Max Consecutive Days</label>
                <input
                  type="number" min="0"
                  value={formData.max_consecutive_days}
                  onChange={e => handleChange('max_consecutive_days', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Minimum Notice (days)</label>
                <input
                  type="number" min="0"
                  value={formData.minimum_notice_days}
                  onChange={e => handleChange('minimum_notice_days', parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm"
                  disabled={saveLoading}
                />
              </div>
            </div>
          </Section>

          {/* Carry Forward & Encashment */}
          <Section id="carry" title="Carry Forward & Encashment" icon={Gift}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.carry_forward_allowed}
                  onChange={e => handleChange('carry_forward_allowed', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600"
                  disabled={saveLoading}
                />
                <span className="text-sm">Allow carry forward</span>
              </label>
              {formData.carry_forward_allowed && (
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Max Carry Forward (days)</label>
                  <input
                    type="number" min="0" step="0.5"
                    value={formData.max_carry_forward_days}
                    onChange={e => handleChange('max_carry_forward_days', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border rounded text-sm"
                    disabled={saveLoading}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.encashment_allowed}
                  onChange={e => handleChange('encashment_allowed', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600"
                  disabled={saveLoading}
                />
                <span className="text-sm">Encashment allowed</span>
              </label>
            </div>
          </Section>

          {/* Approval & Documents */}
          <Section id="approval" title="Approval & Documents" icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.approval_required}
                  onChange={e => handleChange('approval_required', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600"
                  disabled={saveLoading}
                />
                <span className="text-sm">Approval required</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.document_required}
                  onChange={e => handleChange('document_required', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600"
                  disabled={saveLoading}
                />
                <span className="text-sm">Document required</span>
              </label>
              {formData.document_required && (
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Document required after (days)</label>
                  <input
                    type="number" min="0"
                    value={formData.document_required_after_days}
                    onChange={e => handleChange('document_required_after_days', e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded text-sm"
                    disabled={saveLoading}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Additional Settings */}
          <Section id="additional" title="Additional Settings" icon={Settings}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.half_day_allowed}
                  onChange={e => handleChange('half_day_allowed', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600"
                  disabled={saveLoading}
                />
                <span className="text-sm">Half‑day allowed</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.available_during_probation}
                  onChange={e => handleChange('available_during_probation', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600"
                  disabled={saveLoading}
                />
                <span className="text-sm">Available during probation</span>
              </label>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Applicable Gender</label>
                <select
                  value={formData.applicable_gender}
                  onChange={e => handleChange('applicable_gender', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm"
                  disabled={saveLoading}
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                <select
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm"
                  disabled={saveLoading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Visual Customisation */}
          <Section id="visual" title="Visual Customisation" icon={Palette}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => handleChange('color', e.target.value)}
                  className="w-full h-9 border rounded cursor-pointer"
                  disabled={saveLoading}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Icon (auto‑assigned)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={e => handleChange('icon', e.target.value)}
                  placeholder="e.g. Umbrella"
                  className="w-full px-2.5 py-1.5 border rounded text-sm bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            {leaveType ? `Last updated: ${new Date(leaveType.updated_at).toLocaleDateString()}` : 'New leave type'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-50" disabled={saveLoading}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1"
              disabled={saveLoading}
            >
              <Save className="w-3 h-3" />
              {saveLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeaveTypeModal);