import React from 'react'
import { X, Save, Loader, Power, PowerOff } from 'lucide-react'

const RoleModal = ({ isOpen, mode, formData, onInputChange, onSubmit, onClose, saving }) => {
  if (!isOpen) return null

  const handleToggleStatus = () => {
    const newStatus = formData.status === 'active' ? 'inactive' : 'active'
    onInputChange({ target: { name: 'status', value: newStatus } })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                {mode === 'create' ? 'Create Role' : 'Edit Role'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={onInputChange}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  placeholder="e.g., admin, manager"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="role_name"
                  value={formData.role_name}
                  onChange={onInputChange}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  placeholder="e.g., Administrator"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={onInputChange}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  placeholder="Optional description"
                />
              </div>

              {/* Status Toggle Button (replaces dropdown) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    formData.status === 'active'
                      ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
                  }`}
                >
                  {formData.status === 'active' ? (
                    <Power className="w-3 h-3" />
                  ) : (
                    <PowerOff className="w-3 h-3" />
                  )}
                  {formData.status === 'active' ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button
              onClick={onSubmit}
              disabled={saving || !formData.code || !formData.role_name}
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-3 py-2 bg-primary-600 text-xs font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="mt-3 sm:mt-0 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleModal
