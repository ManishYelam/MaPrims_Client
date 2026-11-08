import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  AlertCircle,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

// Helper: format date to 'yyyy-MM-ddTHH:mm' for datetime-local input
const formatDateTimeLocal = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper: format date for display (e.g., '15 Jan 2025')
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const AttendanceModal = ({ show, attendance, onClose, onSaved, employees = [] }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: 'present',
    check_in: '',
    check_out: '',
    worked_hours: 0,
    notes: '',
    is_regularized: false,
  });
  const [validationErrors, setValidationErrors] = useState({});

  const statusOptions = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half_day', label: 'Half Day' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'weekend', label: 'Weekend' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'work_from_home', label: 'Work From Home' },
  ];

  useEffect(() => {
    if (attendance) {
      setFormData({
        status: attendance.status || 'present',
        check_in: formatDateTimeLocal(attendance.check_in),
        check_out: formatDateTimeLocal(attendance.check_out),
        worked_hours: attendance.worked_hours || 0,
        notes: attendance.notes || '',
        is_regularized: attendance.is_regularized || false,
      });
      setValidationErrors({});
    } else {
      setFormData({
        status: 'present',
        check_in: '',
        check_out: '',
        worked_hours: 0,
        notes: '',
        is_regularized: false,
      });
    }
  }, [attendance]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Auto-calculate worked hours when both check-in and check-out are set
    if (field === 'check_in' || field === 'check_out') {
      const checkIn = field === 'check_in' ? value : formData.check_in;
      const checkOut = field === 'check_out' ? value : formData.check_out;
      if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const diff = (checkOutDate - checkInDate) / (1000 * 60 * 60);
        if (diff > 0) {
          setFormData(prev => ({ ...prev, worked_hours: parseFloat(diff.toFixed(1)) }));
        }
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.status) {
      errors.status = 'Status is required';
      isValid = false;
    }

    if (formData.check_in && formData.check_out) {
      const checkIn = new Date(formData.check_in);
      const checkOut = new Date(formData.check_out);
      if (checkOut <= checkIn) {
        errors.check_out = 'Check-out time must be after check-in';
        isValid = false;
      }
    }

    setValidationErrors(errors);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      if (firstError) toast.error(firstError);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const savePromise = async () => {
      try {
        const payload = {
          status: formData.status,
          check_in: formData.check_in || null,
          check_out: formData.check_out || null,
          worked_hours: formData.worked_hours || 0,
          notes: formData.notes || null,
          is_regularized: formData.is_regularized,
        };

        // Assume update endpoint exists; adjust if needed
        const response = await hrAPI.updateAttendance(attendance.attendance_id, payload);
        onSaved();
        return response.data;
      } catch (err) {
        console.error('Save attendance error:', err.response?.data || err);
        throw err;
      }
    };

    try {
      setSaveLoading(true);
      await toast.promise(savePromise(), {
        loading: 'Saving...',
        success: 'Attendance updated successfully!',
        error: err => err.response?.data?.message || 'Failed to save attendance',
      });
    } catch (error) {
      // handled by toast
    } finally {
      setSaveLoading(false);
    }
  };

  if (!show) return null;

  const employee = employees.find(e => e.value === attendance?.emp_id);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b">
          <div>
            <h2 className="text-base font-semibold">
              {attendance ? 'Edit Attendance' : 'Attendance Details'}
            </h2>
            {attendance && (
              <p className="text-xs text-gray-500 mt-0.5">
                {employee ? employee.label : `Employee ID: ${attendance.emp_id}`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Employee Info */}
          {attendance && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{employee ? employee.label : 'Unknown Employee'}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">Date: {formatDisplayDate(attendance.date)}</span>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={e => handleInputChange('status', e.target.value)}
              className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${
                validationErrors.status ? 'border-red-500' : ''
              }`}
              disabled={saveLoading}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {validationErrors.status && <p className="text-xs text-red-600 mt-1">{validationErrors.status}</p>}
          </div>

          {/* Check In / Out */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Check In</label>
              <input
                type="datetime-local"
                value={formData.check_in}
                onChange={e => handleInputChange('check_in', e.target.value)}
                className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Check Out</label>
              <input
                type="datetime-local"
                value={formData.check_out}
                onChange={e => handleInputChange('check_out', e.target.value)}
                className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${
                  validationErrors.check_out ? 'border-red-500' : ''
                }`}
                disabled={saveLoading}
              />
              {validationErrors.check_out && <p className="text-xs text-red-600 mt-1">{validationErrors.check_out}</p>}
            </div>
          </div>

          {/* Worked Hours */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Worked Hours</label>
            <input
              type="number"
              step="0.1"
              value={formData.worked_hours}
              onChange={e => handleInputChange('worked_hours', parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
              disabled={saveLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated from check‑in/out times if set.</p>
          </div>

          {/* Regularized */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_regularized}
              onChange={e => handleInputChange('is_regularized', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-4 h-4"
              disabled={saveLoading}
            />
            <label className="text-xs font-medium text-gray-700">Regularized (approved)</label>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Notes</label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none"
              placeholder="Add notes or remarks..."
              disabled={saveLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 p-3 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled={saveLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveLoading || Object.keys(validationErrors).length > 0}
            className="px-3 py-1.5 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AttendanceModal);