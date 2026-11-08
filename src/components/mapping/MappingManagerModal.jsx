import React, { useState, useEffect, useMemo } from 'react'
import { X, Plus, Edit, Trash2, Save, Search, User, BookOpen } from 'lucide-react'
import { MANAGER_MAPPING_CONFIG } from './mappingConfig'
import { userAPI } from '../../services/api'
import { coursesAPI } from '../../services/api'
// Import other APIs as needed (branchesAPI, locationsAPI, etc.)
import CourseSelectionModal from '../ui/CourseSelectionModal' // adjust path
import UserSelectionModal from '../ui/UserSelectionModal'

const MappingManagerModal = ({ show, onClose }) => {
  const [selectedMappingKey, setSelectedMappingKey] = useState('course')
  const [mappings, setMappings] = useState([])
  const [users, setUsers] = useState([]) // only managers (filtered by role)
  const [entityItems, setEntityItems] = useState([]) // e.g., courses, branches, etc.
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [search, setSearch] = useState('') // search for mappings table

  // Modal states for selection
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEntityModal, setShowEntityModal] = useState(false)

  const config = MANAGER_MAPPING_CONFIG[selectedMappingKey]

  // Reset form and search when mapping type changes
  useEffect(() => {
    setShowForm(false)
    setSearch('')
  }, [selectedMappingKey])

  // Fetch only users with the role specified in config
  useEffect(() => {
    if (!show) return
    const loadUsers = async () => {
      try {
        const params = { limit: 1000 }
        if (config.userRole) {
          params.role = config.userRole
        }
        const res = await userAPI.getAllUsers(params)
        setUsers(res.data?.data || [])
      } catch (err) {
        console.error('Failed to load users', err)
      }
    }
    loadUsers()
  }, [show, config.userRole, selectedMappingKey])

  // Fetch entity items (courses, branches, etc.) based on selected mapping type
  useEffect(() => {
    if (!show || !selectedMappingKey) return
    const loadItems = async () => {
      try {
        let items = []
        if (selectedMappingKey === 'course') {
          const res = await coursesAPI.getAll({ limit: 1000 })
          items = res.data?.data || []
        } else if (selectedMappingKey === 'branch') {
          // const res = await branchesAPI.getAll({ limit: 1000 })
          // items = res.data?.data || []
        } else if (selectedMappingKey === 'location') {
          // const res = await locationsAPI.getAll({ limit: 1000 })
          // items = res.data?.data || []
        }
        setEntityItems(items)
      } catch (err) {
        console.error(`Failed to load ${selectedMappingKey} items`, err)
      }
    }
    loadItems()
  }, [selectedMappingKey, show])

  // Fetch mappings for the selected mapping type
  useEffect(() => {
    if (!show || !config) return
    const fetchMappings = async () => {
      setLoading(true)
      try {
        const response = await fetch(config.endpoints.list)
        const data = await response.json()
        setMappings(data.data || data)
      } catch (err) {
        console.error(`Failed to fetch mappings`, err)
      } finally {
        setLoading(false)
      }
    }
    fetchMappings()
  }, [selectedMappingKey, show, config])

  const handleAddNew = () => {
    setEditingItem(null)
    const initialData = {}
    config.formFields.forEach(field => {
      if (field.multi) {
        initialData[field.name] = []
      } else {
        initialData[field.name] = ''
      }
    })
    setFormData(initialData)
    setShowForm(true)
  }

  const handleEdit = item => {
    setEditingItem(item)
    const parsedData = { ...item }
    config.formFields.forEach(field => {
      if (field.multi && typeof parsedData[field.name] === 'string') {
        parsedData[field.name] = parsedData[field.name].split(',').map(s => s.trim())
      } else if (field.multi && !parsedData[field.name]) {
        parsedData[field.name] = []
      }
    })
    setFormData(parsedData)
    setShowForm(true)
  }

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this mapping?')) return
    try {
      await fetch(config.endpoints.delete.replace(':id', id), { method: 'DELETE' })
      setMappings(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      alert('Delete failed')
    }
  }

  const handleSave = async () => {
    try {
      const method = editingItem ? 'PUT' : 'POST'
      const url = editingItem
        ? config.endpoints.update.replace(':id', editingItem.id)
        : config.endpoints.create
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Save failed')
      const saved = await response.json()
      if (editingItem) {
        setMappings(prev => prev.map(m => (m.id === saved.id ? saved : m)))
      } else {
        setMappings(prev => [saved, ...prev])
      }
      setShowForm(false)
    } catch (err) {
      alert('Error saving mapping')
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Selection modal handlers
  const handleUserSelect = user => {
    setFormData(prev => ({ ...prev, manager_id: user?.user_id || '' }))
  }

  const handleEntitySelect = entity => {
    // Determine the correct field name for the entity (e.g., course_id, branch_id)
    const fieldName = config.formFields.find(f => f.options !== 'users')?.name
    if (fieldName) {
      setFormData(prev => ({ ...prev, [fieldName]: entity?.id || '' }))
    }
  }

  const filteredMappings = useMemo(() => {
    return mappings.filter(m => JSON.stringify(m).toLowerCase().includes(search.toLowerCase()))
  }, [mappings, search])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Manager Mapping</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mapping Type Dropdown */}
        <div className="p-4 border-b bg-gray-50">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select Mapping Type
          </label>
          <select
            value={selectedMappingKey}
            onChange={e => setSelectedMappingKey(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm bg-white"
          >
            {Object.entries(MANAGER_MAPPING_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${config.label} mappings...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm"
            />
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Add {config.label} Mapping
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-4">
          {showForm && (
            <div className="bg-gray-50 p-4 rounded-lg border mb-4">
              <h3 className="text-sm font-medium mb-3">
                {editingItem ? 'Edit' : 'New'} {config.label} Mapping
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {config.formFields.map(field => {
                  // Determine if this is the manager field (users) or entity field
                  if (field.options === 'users') {
                    return (
                      <div key={field.name}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowUserModal(true)}
                          className="w-full flex items-center justify-between border border-gray-300 rounded px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
                        >
                          <span>
                            {formData[field.name]
                              ? users.find(u => u.user_id === formData[field.name])?.full_name ||
                                'Selected'
                              : `Select ${field.label}`}
                          </span>
                          <User className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )
                  } else {
                    return (
                      <div key={field.name}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowEntityModal(true)}
                          className="w-full flex items-center justify-between border border-gray-300 rounded px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
                        >
                          <span>
                            {formData[field.name]
                              ? entityItems.find(e => e.id === formData[field.name])?.title ||
                                entityItems.find(e => e.id === formData[field.name])?.name ||
                                'Selected'
                              : `Select ${field.label}`}
                          </span>
                          <BookOpen className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )
                  }
                })}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 border rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {config.tableColumns.map(col => (
                    <th
                      key={col.key}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMappings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={config.tableColumns.length + 1}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No mappings found.
                    </td>
                  </tr>
                ) : (
                  filteredMappings.map(mapping => (
                    <tr key={mapping.id} className="hover:bg-gray-50">
                      {config.tableColumns.map(col => (
                        <td key={col.key} className="px-4 py-2 text-sm">
                          {Array.isArray(mapping[col.key])
                            ? mapping[col.key].join(', ')
                            : mapping[col.key]}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(mapping)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(mapping.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modals */}
        <UserSelectionModal
          show={showUserModal}
          onClose={() => setShowUserModal(false)}
          onSelect={handleUserSelect}
          users={users}
          selectedUserId={formData.manager_id}
        />

        {selectedMappingKey === 'course' && (
          <CourseSelectionModal
            show={showEntityModal}
            onClose={() => setShowEntityModal(false)}
            onSelect={handleEntitySelect}
            selectedCourseId={formData.course_id}
          />
        )}
        {/* Add similar conditionals for branch, location modals when they exist */}
      </div>
    </div>
  )
}

export default MappingManagerModal
