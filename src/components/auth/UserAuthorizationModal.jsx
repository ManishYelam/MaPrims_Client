import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  X,
  Save,
  Loader,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react'
import { userAPI } from '../../services/api'
import { rolePermissionAPI } from '../../services/api'

// ---------- Recursive Tree Node Component with Expand/Collapse ----------
const PermissionTreeNode = ({
  node,
  effectivePermissions,
  togglePermission,
  expandedNodes,
  toggleExpand,
  level = 0,
}) => {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.permission_id)

  const handleExpandClick = e => {
    e.stopPropagation()
    toggleExpand(node.permission_id)
  }

  const handleCheckboxChange = () => {
    togglePermission(node)
  }

  return (
    <li>
      <div
        className="flex items-center py-1 hover:bg-gray-50 cursor-pointer rounded px-2 group"
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
          className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={effectivePermissions.has(node.permission_id)}
          onChange={handleCheckboxChange}
          onClick={e => e.stopPropagation()}
        />
        <span className="text-xs font-medium text-gray-900">{node.name}</span>
      </div>

      {hasChildren && isExpanded && (
        <ul className="list-none">
          {node.children.map(child => (
            <PermissionTreeNode
              key={child.permission_id}
              node={child}
              effectivePermissions={effectivePermissions}
              togglePermission={togglePermission}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              level={level + 1}
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
        console.warn(`Parent ${perm.parent_permission_id} not found – treating as root.`)
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

// ---------- Main Modal Component ----------
const UserAuthorizationModal = ({ show, user, onClose, onSaved }) => {
  const [permissions, setPermissions] = useState([])
  const [explicitPermissions, setExplicitPermissions] = useState(new Set())
  const [roleId, setRoleId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Expand/collapse state
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  // Fetch user's role permissions when modal opens
  useEffect(() => {
    if (show && user) {
      fetchUserPermissions()
    }
  }, [show, user])

  const fetchUserPermissions = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const response = await rolePermissionAPI.getUserRolePermissions(user.user_id)
      const allPerms = response.data.role_all_permissions || []
      const fetchedRoleId = response.data.role_id
      const effRes = await rolePermissionAPI.getEffectivePermissionIds(user.user_id)
      setPermissions(allPerms)
      setExplicitPermissions(new Set(effRes.data.permission_ids.permission_ids))
      setRoleId(fetchedRoleId)
    } catch (err) {
      console.error('Failed to load user permissions', err)
      setError('Failed to load user permissions')
    } finally {
      setLoading(false)
    }
  }

  const { roots, parentMap } = useMemo(() => buildTree(permissions), [permissions])

  const effectivePermissions = useMemo(() => {
    const effective = new Set(explicitPermissions)
    explicitPermissions.forEach(id => {
      getAncestors(id, parentMap).forEach(ancestorId => effective.add(ancestorId))
    })
    return effective
  }, [explicitPermissions, parentMap])

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

  // Expand/collapse functions
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

  // Collect all parent IDs (nodes that have children)
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

  const expandAll = useCallback(() => {
    setExpandedNodes(parentIds)
  }, [parentIds])

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      collapseAll()
    } else {
      expandAll()
    }
  }, [allExpanded, expandAll, collapseAll])

  const handleSave = async () => {
    if (!roleId) {
      setError('Role ID not available. Please refresh and try again.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const permissionIds = Array.from(effectivePermissions)
      await rolePermissionAPI.assignUserRolePermissions(user.user_id, {
        role_id: roleId,
        permission_ids: permissionIds,
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  // Group root nodes by resource_type for display
  const groupedRoots = useMemo(() => {
    const groups = {}
    roots.forEach(root => {
      const type = root.resource_type || 'Other'
      if (!groups[type]) groups[type] = []
      groups[type].push(root)
    })
    return groups
  }, [roots])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Authorization for <span className="text-primary-600">{user?.full_name}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Email: {user?.email} • Role: {user?.role}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Expand/Collapse All Button */}
            <button
              onClick={toggleExpandAll}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={allExpanded ? 'Collapse All' : 'Expand All'}
            >
              {allExpanded ? (
                <ChevronsUp className="w-4 h-4" />
              ) : (
                <ChevronsDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content – four columns with expandable trees */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 max-h-full overflow-y-auto pr-1">
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
                            expandedNodes={expandedNodes}
                            toggleExpand={toggleExpand}
                            level={0}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with user ID and save/cancel */}
        <div className="border-t p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">User ID: {user?.user_id}</div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !roleId}
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserAuthorizationModal
