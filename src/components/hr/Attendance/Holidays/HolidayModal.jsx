import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Code, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const HolidayModal = ({ show, holiday, onClose, onSaved, readOnly = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'national',
    location: '',
    employee_count: 0,
    description: '',
    custom_fields: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  const isDisabled = saving || readOnly;

  const holidayTypes = [
    { value: 'national', label: 'National' },
    { value: 'religious', label: 'Religious' },
    { value: 'company', label: 'Company' },
    { value: 'regional', label: 'Regional' },
  ];

  const defaultCustomFields = `{
  "holiday_message": "",
  "applicable_departments": [],
  "additional_notes": ""
}`;

  useEffect(() => {
    if (!show) {
      setSaveError(null);
      setErrors({});
      return;
    }

    if (holiday) {
      setFormData({
        name: holiday.name || '',
        date: holiday.date ? holiday.date.split('T')[0] : '',
        type: holiday.type || holiday.holiday_type || 'national',
        location: holiday.location || '',
        employee_count: holiday.employee_count || 0,
        description: holiday.description || '',
        custom_fields: holiday.custom_fields
          ? (() => {
              try {
                if (typeof holiday.custom_fields === 'string') {
                  const parsed = JSON.parse(holiday.custom_fields);
                  return JSON.stringify(parsed, null, 2);
                } else if (typeof holiday.custom_fields === 'object') {
                  return JSON.stringify(holiday.custom_fields, null, 2);
                }
              } catch (e) {}
              return '';
            })()
          : '',
      });
      setErrors({});
      setSaveError(null);
    } else {
      setFormData({
        name: '',
        date: '',
        type: 'national',
        location: '',
        employee_count: 0,
        description: '',
        custom_fields: defaultCustomFields,
      });
      setErrors({});
      setSaveError(null);
    }
  }, [holiday, show]);

  const handleChange = (e) => {
    if (readOnly) return;
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCustomFieldsChange = (e) => {
    if (readOnly) return;
    const value = e.target.value;
    setFormData(prev => ({ ...prev, custom_fields: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.type) newErrors.type = 'Type is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;

    setSaving(true);
    setSaveError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        date: formData.date,
        holiday_type: formData.type,
        location: formData.location.trim() || null,
        employee_count: parseInt(formData.employee_count) || 0,
        description: formData.description.trim() || null,
        custom_fields: formData.custom_fields && formData.custom_fields.trim()
          ? (() => {
              try {
                return JSON.parse(formData.custom_fields);
              } catch (e) {
                return null;
              }
            })()
          : null,
      };

      // Status is intentionally NOT included — the backend hook derives
      // active / upcoming / past from `date`, and preserves `inactive`
      // if the row was already inactive.

      if (holiday?.holiday_id || holiday?.id) {
        await hrAPI.updateHoliday(holiday.holiday_id || holiday.id, payload);
      } else {
        await hrAPI.createHoliday(payload);
      }
      onSaved();
    } catch (err) {
      console.error('Error saving holiday:', err);
      setSaveError(err.response?.data?.message || err.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const loadDefaultCustomFields = () => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, custom_fields: defaultCustomFields }));
  };

  const clearCustomFields = () => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, custom_fields: '' }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* HEADER — Save on top, X only (no Cancel) */}
        <div className="flex items-center justify-between p-2.5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              {readOnly
                ? <><Eye className="w-4 h-4 text-blue-600" /> View Holiday</>
                : (holiday ? 'Edit Holiday' : 'Create Holiday')}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {holiday ? `Editing: ${holiday.name}` : 'Add a company holiday'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={saving}
                className="px-2.5 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-60"
              >
                <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
              disabled={saving}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-2.5 space-y-2.5">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-2.5 py-1.5 border rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs disabled:bg-gray-50 disabled:text-gray-600 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Independence Day"
              disabled={isDisabled}
              autoFocus={!readOnly}
            />
            {errors.name && (
              <p className="mt-0.5 text-[9px] text-red-600 flex items-center gap-0.5">
                <AlertCircle className="w-2.5 h-2.5" /> {errors.name}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-2.5 py-1.5 border rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs disabled:bg-gray-50 disabled:text-gray-600 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isDisabled}
            />
            {errors.date && (
              <p className="mt-0.5 text-[9px] text-red-600 flex items-center gap-0.5">
                <AlertCircle className="w-2.5 h-2.5" /> {errors.date}
              </p>
            )}
          </div>

          {/* Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-2.5 py-1.5 border rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs disabled:bg-gray-50 disabled:text-gray-600 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isDisabled}
              >
                {holidayTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-0.5 text-[9px] text-red-600 flex items-center gap-0.5">
                  <AlertCircle className="w-2.5 h-2.5" /> {errors.type}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="e.g., All, HQ"
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Employee Count */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employee Count</label>
            <input
              type="number"
              name="employee_count"
              value={formData.employee_count}
              onChange={handleChange}
              min="0"
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs disabled:bg-gray-50 disabled:text-gray-600"
              placeholder="0"
              disabled={isDisabled}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Description</label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs disabled:bg-gray-50 disabled:text-gray-600"
              placeholder="Additional details"
              disabled={isDisabled}
            />
          </div>

          {/* Custom Fields */}
          <div className="border-t pt-2">
            <button
              type="button"
              onClick={() => toggleSection('custom_fields')}
              className="w-full flex items-center justify-between text-[10px] font-medium text-gray-700 hover:text-gray-900 transition-colors"
              disabled={saving}
            >
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                Custom Fields (JSON)
              </span>
              {expandedSection === 'custom_fields' ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {expandedSection === 'custom_fields' && (
              <div className="mt-2 space-y-1.5">
                {!readOnly && (
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={loadDefaultCustomFields}
                      className="px-2 py-0.5 text-[9px] bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                      disabled={isDisabled}
                    >
                      Load Default
                    </button>
                    <button
                      type="button"
                      onClick={clearCustomFields}
                      className="px-2 py-0.5 text-[9px] bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                      disabled={isDisabled}
                    >
                      Clear
                    </button>
                  </div>
                )}
                <textarea
                  name="custom_fields"
                  rows="3"
                  value={formData.custom_fields}
                  onChange={handleCustomFieldsChange}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-[10px] font-mono disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="{}"
                  disabled={isDisabled}
                  spellCheck="false"
                />
                <p className="text-[9px] text-gray-500">Optional JSON object for extra attributes.</p>
              </div>
            )}
          </div>

          {/* Save Error */}
          {saveError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-[10px] text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" /> {saveError}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default React.memo(HolidayModal);