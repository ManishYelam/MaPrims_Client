import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const WorkLocationModal = ({ show, location, onClose, onSaved, readOnly = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: {},
    city: '',
    state: '',
    country: '',
    postal_code: '',
    phone: '',
    email: '',
    location_type: 'branch',
    capacity: '',
    custom_fields: {},
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const isDisabled = saving || readOnly;

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        code: location.code || '',
        description: location.description || '',
        address: location.address || {},
        city: location.city || '',
        state: location.state || '',
        country: location.country || '',
        postal_code: location.postal_code || '',
        phone: location.phone || '',
        email: location.email || '',
        location_type: location.location_type || 'branch',
        capacity: location.capacity?.toString() || '',
        custom_fields: location.custom_fields || {},
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        address: {},
        city: '',
        state: '',
        country: '',
        postal_code: '',
        phone: '',
        email: '',
        location_type: 'branch',
        capacity: '',
        custom_fields: {},
      });
    }
    setErrors({});
    setSaveError(null);
  }, [location, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (saveError) setSaveError(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.capacity && isNaN(parseInt(formData.capacity))) {
      newErrors.capacity = 'Capacity must be a number';
    }
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
        code: formData.code.trim() || undefined,
        description: formData.description.trim(),
        address: formData.address || {},
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postal_code: formData.postal_code.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        location_type: formData.location_type,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        custom_fields: formData.custom_fields || {},
      };

      if (location?.work_location_id) {
        await hrAPI.updateWorklocation(location.work_location_id, payload);
      } else {
        await hrAPI.createWorklocation(payload);
      }
      toast.success(`Location ${location ? 'updated' : 'created'} successfully!`);
      onSaved();
    } catch (err) {
      console.error('Error saving location:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save location';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl flex flex-col max-h-[95vh]">
        {/* HEADER — Save button + X, matches EmployeeModal */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {readOnly ? 'View Work Location' : (location ? 'Edit Work Location' : 'Create New Work Location')}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {location ? location.name : 'Enter location details'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!readOnly && (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-2.5 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-60"
              >
                <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
              disabled={saving}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* COLUMN 1 */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-2 py-1.5 border rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Mumbai Branch"
                  disabled={isDisabled}
                />
                {errors.name && (
                  <p className="mt-0.5 text-[10px] text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="e.g., MUM-001"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="Brief description"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Location Type</label>
                <select
                  name="location_type"
                  value={formData.location_type}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  disabled={isDisabled}
                >
                  <option value="head_office">Head Office</option>
                  <option value="branch">Branch</option>
                  <option value="regional_office">Regional Office</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="factory">Factory</option>
                  <option value="store">Store</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>

            {/* COLUMN 2 — Location */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="Mumbai"
                  disabled={isDisabled}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="Maharashtra"
                  disabled={isDisabled}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="India"
                  disabled={isDisabled}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="400001"
                  disabled={isDisabled}
                />
              </div>
            </div>

            {/* COLUMN 3 — Contact / capacity */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="+91 22 1234 5678"
                  disabled={isDisabled}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="branch@company.com"
                  disabled={isDisabled}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={`w-full px-2 py-1.5 border rounded text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${
                    errors.capacity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 50"
                  min="0"
                  disabled={isDisabled}
                />
                {errors.capacity && (
                  <p className="mt-0.5 text-[10px] text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.capacity}
                  </p>
                )}
              </div>
            </div>
          </div>

          {saveError && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {saveError}
              </p>
            </div>
          )}
        </form>

        {/* FOOTER — only last-updated hint, no buttons */}
        <div className="flex-shrink-0 flex items-center justify-end px-4 py-1.5 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {location
              ? `Last updated: ${new Date(location.updatedAt || location.updated_at || Date.now()).toLocaleDateString()}`
              : 'New location'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkLocationModal;