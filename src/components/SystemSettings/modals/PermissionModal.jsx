import React, { useState } from 'react'
import { Check, Loader, ChevronDown } from 'lucide-react'
import PermissionSelectionModal from './PermissionSelectionModal'

const PermissionModal = ({
  isOpen,
  mode,
  formData,
  onInputChange,
  onSubmit,
  onClose,
  saving,
  permissions,
  editingPermissionId,
}) => {
  const [showParentModal, setShowParentModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)

  if (!isOpen) return null

  const title = mode === 'create' ? 'Create Permission' : 'Edit Permission'

  // Find the selected parent permission name for display
  const selectedParent = permissions.find(p => p.permission_id === formData.parent_permission_id)
  const parentDisplay = selectedParent ? selectedParent.name : 'None (Root)'

  const handleParentSelect = parentPerm => {
    const parentId = parentPerm ? parentPerm.permission_id : null
    onInputChange({
      target: {
        name: 'parent_permission_id',
        value: parentId,
      },
    })
    setShowParentModal(false)
  }

  // Handle select change for is_leaf (ensures boolean)
  const handleIsLeafChange = e => {
    const value = e.target.value === 'true'
    onInputChange({
      target: {
        name: 'is_leaf',
        value: value,
      },
    })
  }

  const handleCopySelect = perm => {
    onInputChange({ target: { name: 'name', value: perm.name } })
    onInputChange({ target: { name: 'action_type', value: perm.action_type } })
    onInputChange({ target: { name: 'resource_type', value: perm.resource_type } })
    onInputChange({ target: { name: 'description', value: perm.description } })
    onInputChange({ target: { name: 'url', value: perm.url || '' } })
    onInputChange({ target: { name: 'is_leaf', value: perm.is_leaf === true } })
    onInputChange({ target: { name: 'parent_permission_id', value: perm.parent_permission_id || null } })
    setShowCopyModal(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-4">
          <h3 className="text-base font-semibold mb-3">{title}</h3>
          <div className="space-y-3">
            {/* Three‑column grid for Name, Action Type, Resource Type */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onInputChange}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Action Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="action_type"
                  value={formData.action_type}
                  onChange={onInputChange}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Resource Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="resource_type"
                  value={formData.resource_type}
                  onChange={onInputChange}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Description – full width */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={onInputChange}
                rows="2"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* URL and Is Leaf - both controls identical in size */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  URL (optional)
                </label>
                <input
                  type="text"
                  name="url"
                  value={formData.url || ''}
                  onChange={onInputChange}
                  placeholder="/dashboard/users"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Is Leaf</label>
                <select
                  name="is_leaf"
                  value={formData.is_leaf === true ? 'true' : 'false'}
                  onChange={handleIsLeafChange}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="false">No (Can have children)</option>
                  <option value="true">Yes (Leaf node)</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-0.5">Cannot have sub‑permissions</p>
              </div>
            </div>

            {/* Parent Permission – button to open modal */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parent Permission
              </label>
              <button
                type="button"
                onClick={() => setShowParentModal(true)}
                className="w-full flex items-center justify-between border border-gray-300 rounded px-2 py-1.5 text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <span className={formData.parent_permission_id ? 'text-gray-900' : 'text-gray-500'}>
                  {parentDisplay}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            {/* Copy from existing permission – only in create mode */}
            {mode === 'create' && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowCopyModal(true)}
                  className="text-xs text-primary-600 hover:text-primary-800 underline"
                >
                  Copy details from existing permission
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 text-xs rounded flex items-center space-x-1 disabled:opacity-50"
            >
              {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              <span>{saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Parent Permission Selection Modal */}
      <PermissionSelectionModal
        show={showParentModal}
        onClose={() => setShowParentModal(false)}
        onSelect={handleParentSelect}
        permissions={permissions}
        selectedParentId={formData.parent_permission_id}
      />

      <PermissionSelectionModal
        show={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onSelect={handleCopySelect}
        permissions={permissions}
        selectedParentId={null}
      />
    </>
  )
}

export default PermissionModal
