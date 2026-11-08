import React, { useState, useMemo } from 'react'
import { X, Search, Check } from 'lucide-react'

const PermissionSelectionModal = ({
  show,
  onClose,
  onSelect,
  permissions,
  selectedParentId = null,
}) => {
  // Hooks must be called unconditionally – before any conditional returns
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState(selectedParentId)

  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions
    const query = searchQuery.toLowerCase()
    return permissions.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    )
  }, [permissions, searchQuery])

  // After all hooks, conditionally return null if modal is not shown
  if (!show) return null

  const handleSearchChange = e => {
    setSearchQuery(e.target.value)
  }

  const handleSelect = perm => {
    setSelectedId(perm.permission_id)
  }

  const handleSelectNone = () => {
    setSelectedId(null)
  }

  const handleConfirm = () => {
    const selectedPerm = permissions.find(p => p.permission_id === selectedId)
    onSelect(selectedPerm || null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Select Parent Permission</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose a parent permission for this permission
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search permissions..."
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b border-gray-200">
                <tr>
                  <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Resource Type
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Action Type
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Select
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* "None (Root)" option */}
                <tr
                  onClick={handleSelectNone}
                  className={`cursor-pointer hover:bg-gray-50 ${selectedId === null ? 'bg-blue-50' : ''}`}
                >
                  <td className="p-2">
                    <span className="text-xs font-medium text-gray-900">None (Root)</span>
                  </td>
                  <td className="p-2">
                    <span className="text-xs text-gray-500">—</span>
                  </td>
                  <td className="p-2">
                    <span className="text-xs text-gray-500">—</span>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedId === null
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedId === null && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                  </td>
                </tr>

                {filteredPermissions.map(perm => {
                  const isSelected = selectedId === perm.permission_id
                  return (
                    <tr
                      key={perm.permission_id}
                      onClick={() => handleSelect(perm)}
                      className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900">{perm.name}</span>
                          {perm.description && (
                            <span className="text-[10px] text-gray-500 truncate max-w-xs">
                              {perm.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="text-xs text-gray-700">{perm.resource_type || '—'}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs text-gray-700">{perm.action_type || '—'}</span>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {selectedId ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-green-500" />
                  Parent selected
                </span>
              ) : (
                'No parent selected (root)'
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 text-xs font-medium text-white rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-primary-600 hover:bg-primary-700"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionSelectionModal
