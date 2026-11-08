import React, { useState } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { rolePermissionAPI } from '../../services/api';

const ChangeRoleModal = ({ isOpen, user, roles, onClose, onSaved }) => {
  const [selectedRoleId, setSelectedRoleId] = useState(user?.role_id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!selectedRoleId) {
      setError('Please select a role.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Send only role_id (no permission_ids)
      await rolePermissionAPI.assignUserRolePermissions(user.user_id, {
        role_id: parseInt(selectedRoleId),
        // permission_ids omitted → backend keeps existing permissions
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Change Role for {user.full_name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Choose a role</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name} ({role.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Only the role will be changed. Existing permissions remain unchanged.
            </p>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedRoleId}
            className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeRoleModal;