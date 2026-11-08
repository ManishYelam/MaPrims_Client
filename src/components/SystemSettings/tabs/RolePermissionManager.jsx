import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Check,
  Save,
  Loader,
  AlertCircle,
  Pencil,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Power,
  PowerOff,
  PlusCircle,
  Trash2,
} from 'lucide-react'
import { rolePermissionAPI } from '../../../services/api'
import PermissionModal from '../modals/PermissionModal'
import RoleModal from '../modals/RoleModal'

// ---------- Recursive Tree Node Component ----------
const PermissionTreeNode = ({
  node,
  effectivePermissions,
  togglePermission,
  onEdit,
  onToggleStatus,
  onCreateChild,
  expandedNodes,
  toggleExpand,
  level = 0,
  togglingIds,
  inheritedInactive = false,
}) => {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.permission_id)
  const isSelfInactive = node.status === 'inactive'
  const isEffectivelyInactive = inheritedInactive || isSelfInactive
  const isToggling = togglingIds.has(node.permission_id)

  const handleEditClick = (e, perm) => {
    e.stopPropagation()
    onEdit(perm)
  }

  const handleToggleClick = (e, perm) => {
    e.stopPropagation()
    onToggleStatus(perm)
  }

  const handleCreateChildClick = (e, perm) => {
    e.stopPropagation()
    onCreateChild(perm)
  }

  const handleCheckboxChange = () => {
    togglePermission(node)
  }

  const handleExpandClick = e => {
    e.stopPropagation()
    toggleExpand(node.permission_id)
  }

  return (
    <li>
      <div
        className={`flex items-center py-1 hover:bg-gray-50 cursor-pointer rounded px-2 group ${
          isEffectivelyInactive ? 'bg-red-50' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 6}px` }}
        onClick={() => togglePermission(node)}
      >
        {hasChildren && (
          <button
            onClick={handleExpandClick}
            className="mr-1 p-0.5 rounded hover:bg-gray-200 focus:outline-none"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5 mr-1" />}

        <input
          type="checkbox"
          className={`mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
            isEffectivelyInactive ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          checked={effectivePermissions.has(node.permission_id)}
          onChange={handleCheckboxChange}
          onClick={e => e.stopPropagation()}
          disabled={isEffectivelyInactive}
        />
        <span
          className={`text-xs font-medium ${isEffectivelyInactive ? 'text-gray-500' : 'text-gray-900'}`}
        >
          {node.name}
        </span>

        {/* Action buttons */}
        <div className="ml-auto flex items-center space-x-1">
          <button
            onClick={e => handleCreateChildClick(e, node)}
            className="p-0.5 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add child permission"
          >
            <PlusCircle className="w-3 h-3 text-blue-600" />
          </button>

          <button
            onClick={e => handleToggleClick(e, node)}
            disabled={isToggling || inheritedInactive}
            className={`p-0.5 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity ${
              isToggling ? 'opacity-100 cursor-wait' : ''
            } ${inheritedInactive ? 'cursor-not-allowed opacity-30' : ''}`}
            title={
              inheritedInactive
                ? 'Cannot activate: parent is inactive'
                : node.status === 'active'
                  ? 'Deactivate'
                  : 'Activate'
            }
          >
            {isToggling ? (
              <Loader className="w-3 h-3 text-gray-600 animate-spin" />
            ) : node.status === 'active' ? (
              <Power className="w-3 h-3 text-green-600" />
            ) : (
              <PowerOff className="w-3 h-3 text-red-600" />
            )}
          </button>

          <button
            onClick={e => handleEditClick(e, node)}
            className="p-0.5 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit permission"
          >
            <Pencil className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul className="list-none">
          {node.children.map(child => (
            <PermissionTreeNode
              key={child.permission_id}
              node={child}
              effectivePermissions={effectivePermissions}
              togglePermission={togglePermission}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onCreateChild={onCreateChild}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              level={level + 1}
              togglingIds={togglingIds}
              inheritedInactive={isEffectivelyInactive}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

// ---------- Tree Builder ----------
const buildTree = permissions => {
  const map = {}
  const roots = []
  const parentMap = {}

  permissions.forEach(perm => {
    map[perm.permission_id] = { ...perm, children: [] }
    parentMap[perm.permission_id] = null
  })

  permissions.forEach(perm => {
    const node = map[perm.permission_id]
    if (perm.parent_permission_id) {
      const parent = map[perm.parent_permission_id]
      if (parent) {
        parent.children.push(node)
        parentMap[perm.permission_id] = perm.parent_permission_id
      } else {
        console.warn(
          `Parent ${perm.parent_permission_id} not found for permission ${perm.permission_id} – treating as root.`
        )
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return { roots, parentMap }
}

// ---------- Helper: get ancestors ----------
const getAncestors = (id, parentMap) => {
  const ancestors = []
  let current = parentMap[id]
  while (current) {
    ancestors.push(current)
    current = parentMap[current]
  }
  return ancestors
}

// ---------- Main Component ----------
const RolePermissionManager = () => {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [explicitPermissions, setExplicitPermissions] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // UI states
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [togglingIds, setTogglingIds] = useState(new Set())

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingPermission, setEditingPermission] = useState(null)
  const [modalFormData, setModalFormData] = useState({
    name: '',
    description: '',
    action_type: '',
    resource_type: '',
    parent_permission_id: null,
    url: '',
    is_leaf: false,
  })
  const [modalSaving, setModalSaving] = useState(false)

  // ---------- NEW: Role modal state ----------
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleModalMode, setRoleModalMode] = useState('create')
  const [editingRole, setEditingRole] = useState(null)
  const [roleFormData, setRoleFormData] = useState({
    code: '',
    role_name: '',
    description: '',
    status: 'active',
  })
  const [roleSaving, setRoleSaving] = useState(false)

  // ---------- NEW: Confirmation modal for role delete ----------
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
    data: null,
  })

  // ---------- Helper functions ----------
  const showConfirmation = (title, message, type, onConfirm, data = null) => {
    setConfirmationModal({ show: true, title, message, type, onConfirm, data })
  }
  const hideConfirmation = () => {
    setConfirmationModal({ show: false, title: '', message: '', type: '', onConfirm: null, data: null })
  }
  const handleConfirm = () => {
    if (confirmationModal.onConfirm) confirmationModal.onConfirm(confirmationModal.data)
    hideConfirmation()
  }

  // ---------- Data fetching (existing + role CRUD) ----------
  const fetchRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await rolePermissionAPI.getAllRoles()
      setRoles(response.data || [])
    } catch (err) {
      setError('Failed to load roles. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllPermissions = async () => {
    try {
      const response = await rolePermissionAPI.getAllPermissions()
      setPermissions(response.data || [])
    } catch (err) {
      setError('Failed to load permissions.')
      console.error(err)
    }
  }

  const fetchRolePermissions = async roleId => {
    setLoadingPermissions(true)
    try {
      const response = await rolePermissionAPI.getRolePermissions(roleId)
      const permIds = response.data.permission_ids || []
      setExplicitPermissions(new Set(permIds))
    } catch (err) {
      setError('Failed to load permissions for this role.')
      console.error(err)
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handleRoleSelect = role => {
    setSelectedRole(role)
    setExplicitPermissions(new Set())
    setError(null)
    setSuccess(null)
    setExpandedNodes(new Set())
    fetchRolePermissions(role.role_id)
  }

  const collectDescendantIds = useCallback(node => {
    let ids = [node.permission_id]
    if (node.children) {
      node.children.forEach(child => {
        ids = ids.concat(collectDescendantIds(child))
      })
    }
    return ids
  }, [])

  const togglePermission = useCallback(
    node => {
      const descendantIds = collectDescendantIds(node)
      setExplicitPermissions(prev => {
        const newSet = new Set(prev)
        const isChecked = prev.has(node.permission_id)

        if (isChecked) {
          descendantIds.forEach(id => newSet.delete(id))
        } else {
          descendantIds.forEach(id => newSet.add(id))
        }
        return newSet
      })
    },
    [collectDescendantIds]
  )

  const toggleExpand = useCallback(nodeId => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  const { roots, parentMap } = useMemo(() => buildTree(permissions), [permissions])

  // All parent IDs (nodes with children)
  const parentIds = useMemo(() => {
    const set = new Set()
    const collectParents = nodes => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          set.add(node.permission_id)
          collectParents(node.children)
        }
      })
    }
    collectParents(roots)
    return set
  }, [roots])

  const allExpanded = useMemo(() => {
    if (parentIds.size === 0) return false
    return Array.from(parentIds).every(id => expandedNodes.has(id))
  }, [parentIds, expandedNodes])

  const expandAll = useCallback(() => setExpandedNodes(parentIds), [parentIds])
  const collapseAll = useCallback(() => setExpandedNodes(new Set()), [])
  const toggleExpandAll = useCallback(() => {
    if (allExpanded) collapseAll()
    else expandAll()
  }, [allExpanded, expandAll, collapseAll])

  const effectivePermissions = useMemo(() => {
    const effective = new Set(explicitPermissions)
    explicitPermissions.forEach(id => {
      getAncestors(id, parentMap).forEach(ancestorId => effective.add(ancestorId))
    })
    return effective
  }, [explicitPermissions, parentMap])

  const groupedRoots = useMemo(() => {
    const groups = {}
    roots.forEach(root => {
      const type = root.resource_type || 'Other'
      if (!groups[type]) groups[type] = []
      groups[type].push(root)
    })
    return groups
  }, [roots])

  const handleSave = async () => {
    if (!selectedRole) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const permission_ids = Array.from(effectivePermissions)
      await rolePermissionAPI.assignPermissionsToRole(selectedRole.role_id, permission_ids)
      setSuccess('Permissions updated successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save permissions')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ----- Toggle Status Handler -----
  const handleToggleStatus = async permission => {
    // Guard: if any ancestor is inactive, prevent toggling and show error
    let currentParent = parentMap[permission.permission_id]
    while (currentParent) {
      const parentPerm = permissions.find(p => p.permission_id === currentParent)
      if (parentPerm && parentPerm.status === 'inactive') {
        setError('Cannot change status because a parent permission is inactive.')
        return
      }
      currentParent = parentMap[currentParent]
    }

    const newStatus = permission.status === 'active' ? 'inactive' : 'active'
    const permissionId = permission.permission_id

    // Optimistically update UI
    setPermissions(prev =>
      prev.map(p => (p.permission_id === permissionId ? { ...p, status: newStatus } : p))
    )
    setTogglingIds(prev => new Set(prev).add(permissionId))

    try {
      const payload = {
        name: permission.name,
        description: permission.description,
        action_type: permission.action_type,
        resource_type: permission.resource_type,
        parent_permission_id: permission.parent_permission_id,
        level: permission.level,
        status: newStatus,
        url: permission.url,
        is_leaf: permission.is_leaf,
      }
      await rolePermissionAPI.updatePermission(permissionId, payload)
      await fetchAllPermissions()
      setSuccess('Permission status updated successfully!')
    } catch (err) {
      // Revert optimistic update on error
      setPermissions(prev =>
        prev.map(p => (p.permission_id === permissionId ? { ...p, status: permission.status } : p))
      )
      setError(`Failed to update permission status: ${err.response?.data?.message || err.message}`)
      console.error(err)
    } finally {
      setTogglingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(permissionId)
        return newSet
      })
    }
  }

  // ----- Create Child Handler -----
  const handleCreateChild = parentPerm => {
    setModalMode('create')
    setEditingPermission(null)
    setModalFormData({
      name: '',
      description: '',
      action_type: '',
      resource_type: parentPerm.resource_type || '',
      parent_permission_id: parentPerm.permission_id,
      url: '',
      is_leaf: false,
    })
    setShowModal(true)
  }

  // ----- Modal Handlers -----
  const openCreateModal = () => {
    setModalMode('create')
    setEditingPermission(null)
    setModalFormData({
      name: '',
      description: '',
      action_type: '',
      resource_type: '',
      parent_permission_id: null,
      url: '',
      is_leaf: false,
    })
    setShowModal(true)
  }

  const openEditModal = perm => {
    setModalMode('edit')
    setEditingPermission(perm)
    setModalFormData({
      name: perm.name || '',
      description: perm.description || '',
      action_type: perm.action_type || '',
      resource_type: perm.resource_type || '',
      parent_permission_id: perm.parent_permission_id || null,
      url: perm.url || '',
      is_leaf: perm.is_leaf === true,
    })
    setShowModal(true)
  }

  const handleModalInputChange = e => {
    const { name, value } = e.target
    setModalFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleModalSubmit = async () => {
    setModalSaving(true)
    setError(null)
    try {
      let level = 'A1'
      const parentId = modalFormData.parent_permission_id
      if (parentId) {
        const parent = permissions.find(p => p.permission_id === parentId)
        if (parent && parent.level) {
          const match = parent.level.match(/A(\d+)/i)
          if (match) {
            const num = parseInt(match[1], 10) + 1
            level = `A${num}`
          }
        }
      }

      const payload = {
        ...modalFormData,
        level,
      }

      if (modalMode === 'create') {
        await rolePermissionAPI.createPermission(payload)
        setSuccess('Permission created successfully!')
      } else {
        await rolePermissionAPI.updatePermission(editingPermission.permission_id, payload)
        setSuccess('Permission updated successfully!')
      }
      await fetchAllPermissions()
      setShowModal(false)
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${modalMode} permission`)
      console.error(err)
    } finally {
      setModalSaving(false)
    }
  }

  // ---------- NEW: Role CRUD handlers ----------
  const handleCreateRole = () => {
    setRoleModalMode('create')
    setEditingRole(null)
    setRoleFormData({
      code: '',
      role_name: '',
      description: '',
      status: 'active',
    })
    setShowRoleModal(true)
  }

  const handleEditRole = () => {
    if (!selectedRole) {
      setError('Please select a role first.')
      return
    }
    setRoleModalMode('edit')
    setEditingRole(selectedRole)
    setRoleFormData({
      code: selectedRole.code || '',
      role_name: selectedRole.role_name || '',
      description: selectedRole.description || '',
      status: selectedRole.status || 'active',
    })
    setShowRoleModal(true)
  }

  const handleDeleteRole = () => {
    if (!selectedRole) {
      setError('Please select a role to delete.')
      return
    }
    showConfirmation(
      'Delete Role',
      `Are you sure you want to delete role "${selectedRole.role_name}"? This action cannot be undone.`,
      'delete',
      async () => {
        setSaving(true)
        setError(null)
        try {
          await rolePermissionAPI.deleteRole(selectedRole.role_id)
          setSuccess(`Role "${selectedRole.role_name}" deleted successfully.`)
          await fetchRoles()
          if (selectedRole.role_id === selectedRole?.role_id) {
            setSelectedRole(null)
            setExplicitPermissions(new Set())
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to delete role.')
        } finally {
          setSaving(false)
        }
      }
    )
  }

  const handleRoleModalInputChange = (e) => {
    const { name, value } = e.target
    setRoleFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoleModalSubmit = async () => {
    setRoleSaving(true)
    setError(null)
    try {
      const payload = {
        ...roleFormData,
        created_by: 'system',
        updated_by: 'system',
      }
      if (roleModalMode === 'create') {
        await rolePermissionAPI.createRole(payload)
        setSuccess('Role created successfully.')
      } else {
        await rolePermissionAPI.updateRole(editingRole.role_id, payload)
        setSuccess('Role updated successfully.')
      }
      await fetchRoles()
      setShowRoleModal(false)
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${roleModalMode} role.`)
    } finally {
      setRoleSaving(false)
    }
  }

  // ---------- Initial fetch ----------
  useEffect(() => {
    fetchRoles()
    fetchAllPermissions()
  }, [])

  // ---------- Render ----------
  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start">
          <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-start">
          <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-green-700">{success}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="min-w-[140px]">
                <select
                  value={selectedRole?.role_id || ''}
                  onChange={e => {
                    const role = roles.find(r => r.role_id === parseInt(e.target.value))
                    if (role) handleRoleSelect(role)
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">-- Select Role --</option>    
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                     #{role.role_id} {role.role_name} ({role.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* NEW: Role CRUD buttons */}
              <button
                onClick={handleCreateRole}
                className="px-2 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                title="Create new role"
              >
                <Plus className="w-3 h-3" />
                <span>New Role</span>
              </button>
              <button
                onClick={handleEditRole}
                disabled={!selectedRole}
                className="px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 disabled:opacity-50"
                title="Edit selected role"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={!selectedRole}
                className="px-2 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1 disabled:opacity-50"
                title="Delete selected role"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleExpandAll}
                className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
              >
                {allExpanded ? <ChevronsUp className="w-3 h-3" /> : <ChevronsDown className="w-3 h-3" />}
                <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
              </button>

              {/* New Permission */}
              <button
                onClick={openCreateModal}
                className="px-2 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Permission</span>
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving || loadingPermissions || !selectedRole}
                className="px-2 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white rounded flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Permissions Panel (existing) */}
        <div className="p-4">
          {!selectedRole ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              Select a role to manage permissions
            </div>
          ) : (
            <>
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-900">
                  Permissions for{' '}
                  <span className="text-primary-600 capitalize">{selectedRole.role_name}</span>
                </h3>
              </div>

              {loadingPermissions ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 text-primary-600 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {Object.entries(groupedRoots).map(([group, roots]) => (
                    <div key={group} className="break-inside-avoid">
                      <h4 className="text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-t border-b-0">
                        {group}
                      </h4>
                      <div className="rounded-b p-1">
                        {roots.length === 0 ? (
                          <p className="text-[0.65rem] text-gray-400 italic py-1">No permissions</p>
                        ) : (
                          <ul className="space-y-0.5">
                            {roots.map(rootNode => (
                              <PermissionTreeNode
                                key={rootNode.permission_id}
                                node={rootNode}
                                effectivePermissions={effectivePermissions}
                                togglePermission={togglePermission}
                                onEdit={openEditModal}
                                onToggleStatus={handleToggleStatus}
                                onCreateChild={handleCreateChild}
                                expandedNodes={expandedNodes}
                                toggleExpand={toggleExpand}
                                level={0}
                                togglingIds={togglingIds}
                                inheritedInactive={false}
                              />
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Permission Modal (existing) */}
      <PermissionModal
        isOpen={showModal}
        mode={modalMode}
        formData={modalFormData}
        onInputChange={handleModalInputChange}
        onSubmit={handleModalSubmit}
        onClose={() => setShowModal(false)}
        saving={modalSaving}
        permissions={permissions}
        editingPermissionId={editingPermission?.permission_id}
      />

      {/* NEW: Role Modal */}
      <RoleModal
        isOpen={showRoleModal}
        mode={roleModalMode}
        formData={roleFormData}
        onInputChange={handleRoleModalInputChange}
        onSubmit={handleRoleModalSubmit}
        onClose={() => setShowRoleModal(false)}
        saving={roleSaving}
      />

      {/* NEW: Confirmation Modal for delete */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-2 p-3 border-b border-gray-200">
              <div
                className={`p-1.5 rounded-full ${
                  confirmationModal.type === 'delete'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{confirmationModal.title}</h3>
                <p className="text-xs text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-700">{confirmationModal.message}</p>
            </div>
            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200">
              <button
                onClick={hideConfirmation}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-2 py-1 text-xs font-medium text-white rounded focus:outline-none focus:ring-1 focus:ring-offset-1 ${
                  confirmationModal.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RolePermissionManager
