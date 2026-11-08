import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Eye } from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const ShiftModal = ({ show, record, onClose, onSaved, readOnly = false }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    start_time: '09:00',
    end_time: '17:00',
    break_duration: 60,
    late_grace_minutes: 10,
    early_exit_grace_minutes: 10,
    standard_work_hours: 8.0,
    minimum_half_day_hours: 4.0,
    minimum_full_day_hours: 8.0,
    overtime_allowed: true,
    overtime_after_hours: 8.0,
    shift_type: 'general',
    is_night_shift: false,
    weekly_offs: ['Sunday'],
    status: 'active',
  });

  const isEdit = !!record;
  const isDisabled = saveLoading || readOnly;

  const calculateWorkingHours = useCallback((start, end, breakMin) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal < startTotal) endTotal += 24 * 60;
    const totalMinutes = endTotal - startTotal - breakMin;
    return Math.max(0, totalMinutes / 60);
  }, []);

  useEffect(() => {
    if (record) {
      setFormData({
        name: record.name || '',
        code: record.code || '',
        description: record.description || '',
        start_time: record.start_time || '09:00',
        end_time: record.end_time || '17:00',
        break_duration: record.break_duration || 60,
        late_grace_minutes: record.late_grace_minutes || 10,
        early_exit_grace_minutes: record.early_exit_grace_minutes || 10,
        standard_work_hours: record.standard_work_hours || 8.0,
        minimum_half_day_hours: record.minimum_half_day_hours || 4.0,
        minimum_full_day_hours: record.minimum_full_day_hours || 8.0,
        overtime_allowed: record.overtime_allowed !== undefined ? record.overtime_allowed : true,
        overtime_after_hours: record.overtime_after_hours || 8.0,
        shift_type: record.shift_type || 'general',
        is_night_shift: record.is_night_shift || false,
        weekly_offs: record.weekly_offs || ['Sunday'],
        status: record.status || 'active', // preserved on edit; not editable in UI
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        start_time: '09:00',
        end_time: '17:00',
        break_duration: 60,
        late_grace_minutes: 10,
        early_exit_grace_minutes: 10,
        standard_work_hours: 8.0,
        minimum_half_day_hours: 4.0,
        minimum_full_day_hours: 8.0,
        overtime_allowed: true,
        overtime_after_hours: 8.0,
        shift_type: 'general',
        is_night_shift: false,
        weekly_offs: ['Sunday'],
        status: 'active', // default for new shifts
      });
    }
    setValidationErrors({});
  }, [record, show]);

  useEffect(() => {
    const calculatedHours = calculateWorkingHours(formData.start_time, formData.end_time, formData.break_duration);
    setFormData(prev => {
      if (Math.abs(prev.standard_work_hours - calculatedHours) > 0.001) {
        return { ...prev, standard_work_hours: calculatedHours };
      }
      return prev;
    });
  }, [formData.start_time, formData.end_time, formData.break_duration, calculateWorkingHours]);

  useEffect(() => {
    const calculatedHalfDay = formData.standard_work_hours / 2;
    const calculatedFullDay = formData.standard_work_hours;
    setFormData(prev => {
      if (
        Math.abs(prev.minimum_half_day_hours - calculatedHalfDay) > 0.001 ||
        Math.abs(prev.minimum_full_day_hours - calculatedFullDay) > 0.001
      ) {
        return { ...prev, minimum_half_day_hours: calculatedHalfDay, minimum_full_day_hours: calculatedFullDay };
      }
      return prev;
    });
  }, [formData.standard_work_hours]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const n = { ...prev }; delete n[field]; return n;
      });
    }
  };

  const handleWeeklyOffsChange = (value) => {
    const days = value.split(',').map(d => d.trim()).filter(Boolean);
    handleChange('weekly_offs', days);
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Shift name is required';
    if (!formData.start_time) errors.start_time = 'Start time is required';
    if (!formData.end_time) errors.end_time = 'End time is required';
    if (formData.break_duration < 0) errors.break_duration = 'Break duration must be >= 0';
    if (formData.standard_work_hours <= 0) errors.standard_work_hours = 'Standard work hours must be > 0';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.code) delete payload.code;
      if (!payload.description) delete payload.description;

      const response = record
        ? await hrAPI.updateShift(record.shift_id, payload)
        : await hrAPI.createShift(payload);
      if (response.data?.success) {
        toast.success(`Shift ${record ? 'updated' : 'created'} successfully!`);
        onSaved();
      } else {
        throw new Error(response.data?.message || 'Save failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save shift');
    } finally {
      setSaveLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-2xl w-full max-h-[95vh] flex flex-col shadow-xl">
        {/* HEADER — Save + X */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {readOnly
                ? <><Eye className="w-4 h-4 text-blue-600" /> View Shift</>
                : (record ? 'Edit Shift' : 'Create Shift')}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {record ? `Shift #${record.shift_id}` : 'Enter shift details'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!readOnly && (
              <button
                onClick={handleSave}
                className="px-2.5 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-60"
                disabled={saveLoading}
              >
                <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
              disabled={saveLoading}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Shift Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${validationErrors.name ? 'border-red-500' : ''}`}
                placeholder="Morning Shift"
                disabled={isDisabled || (isEdit && !readOnly)}
              />
              {validationErrors.name && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.name}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Shift Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={e => handleChange('code', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="MS1"
                disabled={isDisabled || (isEdit && !readOnly)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 resize-none disabled:bg-gray-50 disabled:text-gray-600"
              placeholder="Shift description"
              disabled={isDisabled}
            />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={e => handleChange('start_time', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${validationErrors.start_time ? 'border-red-500' : ''}`}
                disabled={isDisabled || (isEdit && !readOnly)}
              />
              {validationErrors.start_time && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.start_time}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={e => handleChange('end_time', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${validationErrors.end_time ? 'border-red-500' : ''}`}
                disabled={isDisabled || (isEdit && !readOnly)}
              />
              {validationErrors.end_time && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.end_time}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Break Duration (min)</label>
              <input
                type="number"
                value={formData.break_duration}
                onChange={e => handleChange('break_duration', parseInt(e.target.value) || 0)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600 ${validationErrors.break_duration ? 'border-red-500' : ''}`}
                min="0"
                step="5"
                disabled={isDisabled || (isEdit && !readOnly)}
              />
              {validationErrors.break_duration && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.break_duration}</p>}
            </div>
          </div>

          {/* Shift Type & Night */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Shift Type</label>
              <select
                value={formData.shift_type}
                onChange={e => handleChange('shift_type', e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                disabled={isDisabled || (isEdit && !readOnly)}
              >
                <option value="general">General</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="rotational">Rotational</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <label className="flex items-center gap-1 text-[10px] text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.is_night_shift}
                  onChange={e => handleChange('is_night_shift', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 w-3 h-3"
                  disabled={isDisabled || (isEdit && !readOnly)}
                />
                Night Shift
              </label>
            </div>
          </div>

          {/* Working Hours */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Working Hours</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Standard Work Hours</label>
                <input
                  type="number"
                  value={formData.standard_work_hours}
                  className={`w-full px-2 py-1 border rounded text-xs bg-gray-50 text-gray-600 ${validationErrors.standard_work_hours ? 'border-red-500' : ''}`}
                  step="0.5"
                  min="0"
                  disabled
                />
                {validationErrors.standard_work_hours && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.standard_work_hours}</p>}
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Min Half Day Hours</label>
                <input
                  type="number"
                  value={formData.minimum_half_day_hours}
                  onChange={e => handleChange('minimum_half_day_hours', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  step="0.5"
                  min="0"
                  disabled={isDisabled || (isEdit && !readOnly)}
                />
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Min Full Day Hours</label>
                <input
                  type="number"
                  value={formData.minimum_full_day_hours}
                  onChange={e => handleChange('minimum_full_day_hours', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  step="0.5"
                  min="0"
                  disabled={isDisabled || (isEdit && !readOnly)}
                />
              </div>
            </div>
          </div>

          {/* Overtime */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Overtime Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 pt-4">
                <label className="flex items-center gap-1 text-[10px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.overtime_allowed}
                    onChange={e => handleChange('overtime_allowed', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 w-3 h-3"
                    disabled={isDisabled}
                  />
                  Overtime Allowed
                </label>
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Overtime After (hours)</label>
                <input
                  type="number"
                  value={formData.overtime_after_hours}
                  onChange={e => handleChange('overtime_after_hours', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  step="0.5"
                  min="0"
                  disabled={isDisabled || (isEdit && !readOnly)}
                />
              </div>
            </div>
          </div>

          {/* Grace */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Grace Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Late Grace (minutes)</label>
                <input
                  type="number"
                  value={formData.late_grace_minutes}
                  onChange={e => handleChange('late_grace_minutes', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  min="0"
                  step="1"
                  disabled={isDisabled || (isEdit && !readOnly)}
                />
              </div>
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Early Exit Grace (minutes)</label>
                <input
                  type="number"
                  value={formData.early_exit_grace_minutes}
                  onChange={e => handleChange('early_exit_grace_minutes', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
                  min="0"
                  step="1"
                  disabled={isDisabled || (isEdit && !readOnly)}
                />
              </div>
            </div>
          </div>

          {/* Weekly Offs */}
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Weekly Offs</label>
            <input
              type="text"
              value={formData.weekly_offs.join(', ')}
              onChange={e => handleWeeklyOffsChange(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
              placeholder="Sunday, Saturday"
              disabled={isDisabled || (isEdit && !readOnly)}
            />
            <p className="text-[8px] text-gray-500 mt-0.5">Comma-separated days (e.g., Sunday, Saturday)</p>
          </div>

          {/* Status field — intentionally removed.
              - New shifts: status = 'active' (sent to backend).
              - Edited shifts: existing status is preserved in payload.
              - Change status from the list page (Power/PowerOff icon). */}
        </form>

        {/* FOOTER — only last-updated hint */}
        <div className="flex-shrink-0 flex items-center justify-end px-3 py-1.5 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {record ? `Last updated: ${new Date(record.updatedAt).toLocaleDateString()}` : 'New shift'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;