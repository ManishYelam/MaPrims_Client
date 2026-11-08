// src/components/SystemSettings/SystemMapping.jsx
import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Save,
  X,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  AlertCircle,
  Map,
} from 'lucide-react'
import BranchSelectionModal from '../modals/BranchSelectionModal'
import { mappingAPI } from '../../../services/api'
import CourseSelectionModal from '../../ui/CourseSelectionModal'
import UserSelectionModal from '../../ui/UserSelectionModal'

const mappingTypes = [
  { id: 'course_branch', label: 'Course - Branch', source: 'course', target: 'branch' },
  { id: 'batch_course', label: 'Batch - Course', source: 'batch', target: 'course' },
  { id: 'instructor_branch', label: 'Instructor - Branch', source: 'instructor', target: 'branch' },
  { id: 'instructor_batch', label: 'Instructor - Batch', source: 'instructor', target: 'batch' },
  { id: 'students_batch', label: 'Students - Batch', source: 'student', target: 'batch' },
]

const filterOptions = [{ id: 'all', label: '-- All Types --' }, ...mappingTypes]

const SystemMapping = () => {
  const [mappingType, setMappingType] = useState('all')
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const messageTimeoutRef = useRef(null)

  const [showModal, setShowModal] = useState(false)
  const [editingMapping, setEditingMapping] = useState(null)
  const [formData, setFormData] = useState({ sourceId: '', targetId: '' })
  const [modalMappingType, setModalMappingType] = useState(mappingTypes[0].id)

  const [showBranchModal, setShowBranchModal] = useState(false)
  const [branchSelectionMode, setBranchSelectionMode] = useState(null)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [courseSelectionMode, setCourseSelectionMode] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userSelectionMode, setUserSelectionMode] = useState(null)
  const [userAllowedRoles, setUserAllowedRoles] = useState([])

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    fetchMappings()
  }, [mappingType, page, search])

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    }
  }, [])

  const showMessage = (type, text) => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    setMessage({ type, text })
    messageTimeoutRef.current = setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const fetchMappings = async () => {
    setLoading(true)
    try {
      const payload = {
        page,
        limit,
        search,
        searchFields: ['source_id', 'target_id', 'mapping_type'],
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }
      if (mappingType !== 'all') {
        payload.filters = { mapping_type: mappingType }
      }
      const response = await mappingAPI.getMappings(payload)
      const result = response.data
      setMappings(result.mappings || [])
      setTotal(result.total || 0)
      setTotalPages(result.total_pages || 0)
    } catch (error) {
      showMessage('error', 'Failed to load mappings')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = e => {
    setSearch(e.target.value)
    setPage(1)
  }

  const clearSearch = () => {
    setSearch('')
    setPage(1)
  }

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage)
  }

  const openAddModal = () => {
    setEditingMapping(null)
    setFormData({ sourceId: '', targetId: '' })
    setModalMappingType(mappingTypes[0].id)
    setShowModal(true)
  }

  const openEditModal = mapping => {
    setEditingMapping(mapping)
    setFormData({
      sourceId: mapping.source_id,
      targetId: mapping.target_id,
    })
    setModalMappingType(mapping.mapping_type)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingMapping(null)
    setFormData({ sourceId: '', targetId: '' })
  }

  // Branch selection handlers
  const openBranchModalForSource = () => {
    setBranchSelectionMode('source')
    setShowBranchModal(true)
  }
  const openBranchModalForTarget = () => {
    setBranchSelectionMode('target')
    setShowBranchModal(true)
  }
  const handleBranchSelect = branch => {
    if (branchSelectionMode === 'source') {
      setFormData(prev => ({ ...prev, sourceId: branch?.id || '' }))
    } else if (branchSelectionMode === 'target') {
      setFormData(prev => ({ ...prev, targetId: branch?.id || '' }))
    }
    setShowBranchModal(false)
    setBranchSelectionMode(null)
  }

  // Course selection handlers
  const openCourseModalForSource = () => {
    setCourseSelectionMode('source')
    setShowCourseModal(true)
  }
  const openCourseModalForTarget = () => {
    setCourseSelectionMode('target')
    setShowCourseModal(true)
  }
  const handleCourseSelect = course => {
    if (courseSelectionMode === 'source') {
      setFormData(prev => ({ ...prev, sourceId: course?.id || '' }))
    } else if (courseSelectionMode === 'target') {
      setFormData(prev => ({ ...prev, targetId: course?.id || '' }))
    }
    setShowCourseModal(false)
    setCourseSelectionMode(null)
  }

  // User selection handlers
  const openUserModalForSource = allowedRoles => {
    setUserSelectionMode('source')
    setUserAllowedRoles(allowedRoles)
    setShowUserModal(true)
  }
  const openUserModalForTarget = allowedRoles => {
    setUserSelectionMode('target')
    setUserAllowedRoles(allowedRoles)
    setShowUserModal(true)
  }
  const handleUserSelect = user => {
    if (userSelectionMode === 'source') {
      setFormData(prev => ({ ...prev, sourceId: user?.id || '' }))
    } else if (userSelectionMode === 'target') {
      setFormData(prev => ({ ...prev, targetId: user?.id || '' }))
    }
    setShowUserModal(false)
    setUserSelectionMode(null)
    setUserAllowedRoles([])
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveMapping = async () => {
    if (!formData.sourceId || !formData.targetId) {
      showMessage('error', 'Please select both source and target')
      return
    }
    setSaving(true)
    try {
      const payload = {
        mapping_type: modalMappingType,
        source_id: formData.sourceId,
        target_id: formData.targetId,
      }
      let response
      if (editingMapping) {
        response = await mappingAPI.updateMapping(editingMapping.mapping_id, payload)
      } else {
        response = await mappingAPI.createMapping(payload)
      }
      if (response.data.success) {
        showMessage('success', editingMapping ? 'Mapping updated' : 'Mapping created')
        closeModal()
        fetchMappings()
      } else {
        showMessage('error', response.data.message || 'Operation failed')
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMapping = async id => {
    if (!window.confirm('Are you sure?')) return
    try {
      const response = await mappingAPI.deleteMapping(id)
      if (response.data.success) {
        showMessage('success', 'Mapping deleted')
        fetchMappings()
      } else {
        showMessage('error', response.data.message || 'Delete failed')
      }
    } catch (error) {
      showMessage('error', 'Failed to delete')
    }
  }

  const formatDate = dateString => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const getSourceDisplay = m => (m.sourceName ? `${m.sourceName} (${m.source_id})` : m.source_id)
  const getTargetDisplay = m => (m.targetName ? `${m.targetName} (${m.target_id})` : m.target_id)
  const modalCurrentType = mappingTypes.find(t => t.id === modalMappingType)

  return (
    <div className="space-y-2 text-xs">
      {/* Message */}
      {message.text && (
        <div
          className={`rounded p-1.5 flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : (
            <AlertCircle className="w-3 h-3 mr-1" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
        <div className="flex items-center space-x-2">
          <Map className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={mappingType}
            onChange={e => setMappingType(e.target.value)}
            className="px-1 py-0.5 text-xs border rounded"
          >
            {filterOptions.map(o => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full pl-7 pr-6 py-1 text-xs border rounded"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary-600 text-white px-2 py-1 rounded text-xs flex items-center"
        >
          <Plus className="w-3 h-3 mr-1" /> Add
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-gray-200 overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-600 w-8">ID</th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 w-45">Source</th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 w-40">Target</th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 w-20">Type</th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 w-24">Created By</th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 w-24">Updated By</th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 w-16">Created</th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 w-16">Updated</th>
              <th className="px-2 py-1 text-right font-medium text-gray-600 w-10">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="9" className="p-3 text-center">
                  Loading...
                </td>
              </tr>
            ) : mappings.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-3 text-center text-gray-500">
                  No mappings
                </td>
              </tr>
            ) : (
              mappings.map(m => (
                <tr key={m.mapping_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 truncate" title={m.mapping_id}>
                    {m.mapping_id}
                  </td>
                  <td className="px-2 py-1 truncate" title={getSourceDisplay(m)}>
                    {getSourceDisplay(m)}
                  </td>
                  <td className="px-2 py-1 truncate" title={getTargetDisplay(m)}>
                    {getTargetDisplay(m)}
                  </td>
                  <td className="px-2 py-1 truncate" title={m.mapping_type}>
                    {m.mapping_type}
                  </td>
                  <td
                    className="px-2 py-1 truncate"
                    title={m.createdByName ? `${m.createdByName} (${m.created_by})` : m.created_by}
                  >
                    {m.createdByName ? `${m.createdByName} (${m.created_by})` : m.created_by || '-'}
                  </td>
                  <td
                    className="px-2 py-1 truncate"
                    title={m.updatedByName ? `${m.updatedByName} (${m.updated_by})` : m.updated_by}
                  >
                    {m.updatedByName ? `${m.updatedByName} (${m.updated_by})` : m.updated_by || '-'}
                  </td>
                  <td className="px-2 py-1 truncate" title={formatDate(m.createdAt)}>
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-2 py-1 truncate" title={formatDate(m.updatedAt)}>
                    {formatDate(m.updatedAt)}
                  </td>
                  <td className="px-2 py-1 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(m)}
                      className="text-blue-600 p-0.5 rounded hover:bg-blue-100"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteMapping(m.mapping_id)}
                      className="text-red-600 p-0.5 rounded hover:bg-red-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 gap-2">
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <span>Showing</span>
              <span className="font-medium">{(page - 1) * limit + 1}</span>
              <span>to</span>
              <span className="font-medium">{Math.min(page * limit, total)}</span>
              <span>of</span>
              <span className="font-medium">{total}</span>
              <span>results</span>
            </div>
            <div className="flex items-center space-x-0.5">
              <button
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronsLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-6 h-6 text-xs rounded border transition-colors ${
                      page === pageNum
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={page === totalPages}
                className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronsRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Compact */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
          <div className="bg-white rounded-lg max-w-xs w-full">
            <div className="flex justify-between items-center p-2 border-b">
              <h3 className="text-xs font-semibold">
                {editingMapping ? 'Edit Mapping' : 'Add Mapping'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-2 space-y-2">
              {/* Mapping Type */}
              <div>
                <label className="block text-2xs text-gray-600 mb-0.5">Mapping Type</label>
                <select
                  value={modalMappingType}
                  onChange={e => setModalMappingType(e.target.value)}
                  className="w-full px-1.5 py-1 text-xs border rounded"
                >
                  {mappingTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-2xs text-gray-600 mb-0.5">
                  Source ({modalCurrentType?.source})
                </label>
                {modalCurrentType?.source === 'branch' ? (
                  <button
                    onClick={openBranchModalForSource}
                    className="w-full px-1.5 py-1 text-xs border rounded text-left bg-white hover:bg-gray-50"
                  >
                    {formData.sourceId || 'Select branch...'}
                  </button>
                ) : modalCurrentType?.source === 'course' ? (
                  <button
                    onClick={openCourseModalForSource}
                    className="w-full px-1.5 py-1 text-xs border rounded text-left bg-white hover:bg-gray-50"
                  >
                    {formData.sourceId || 'Select course...'}
                  </button>
                ) : modalCurrentType?.source === 'instructor' ? (
                  <button
                    onClick={() => openUserModalForSource(['instructor'])}
                    className="w-full px-1.5 py-1 text-xs border rounded text-left bg-white hover:bg-gray-50"
                  >
                    {formData.sourceId || 'Select instructor...'}
                  </button>
                ) : modalCurrentType?.source === 'student' ? (
                  <button
                    onClick={() => openUserModalForSource(['student'])}
                    className="w-full px-1.5 py-1 text-xs border rounded text-left bg-white hover:bg-gray-50"
                  >
                    {formData.sourceId || 'Select student...'}
                  </button>
                ) : (
                  <input
                    type="text"
                    value={formData.sourceId}
                    onChange={e => handleFormChange('sourceId', e.target.value)}
                    placeholder={`Enter ${modalCurrentType?.source} ID`}
                    className="w-full px-1.5 py-1 text-xs border rounded"
                  />
                )}
              </div>

              {/* Target */}
              <div>
                <label className="block text-2xs text-gray-600 mb-0.5">
                  Target ({modalCurrentType?.target})
                </label>
                {modalCurrentType?.target === 'branch' ? (
                  <button
                    onClick={openBranchModalForTarget}
                    className="w-full px-1.5 py-1 text-xs border rounded text-left bg-white hover:bg-gray-50"
                  >
                    {formData.targetId || 'Select branch...'}
                  </button>
                ) : modalCurrentType?.target === 'course' ? (
                  <button
                    onClick={openCourseModalForTarget}
                    className="w-full px-1.5 py-1 text-xs border rounded text-left bg-white hover:bg-gray-50"
                  >
                    {formData.targetId || 'Select course...'}
                  </button>
                ) : modalCurrentType?.target === 'instructor' ? (
                  <button
                    onClick={() => openUserModalForTarget(['instructor'])}
                    className="w-full px-1.5 py-1 text-xs border rounded text-left bg-white hover:bg-gray-50"
                  >
                    {formData.targetId || 'Select instructor...'}
                  </button>
                ) : modalCurrentType?.target === 'student' ? (
                  <button
                    onClick={() => openUserModalForTarget(['student'])}
                    className="w-full px-1.5 py-1 text-xs border rounded text-left bg-white hover:bg-gray-50"
                  >
                    {formData.targetId || 'Select student...'}
                  </button>
                ) : (
                  <input
                    type="text"
                    value={formData.targetId}
                    onChange={e => handleFormChange('targetId', e.target.value)}
                    placeholder={`Enter ${modalCurrentType?.target} ID`}
                    className="w-full px-1.5 py-1 text-xs border rounded"
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-2 border-t">
              <button
                onClick={closeModal}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMapping}
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 text-xs rounded flex items-center space-x-1 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-3 h-3" />
                )}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Modals */}
      {showBranchModal && (
        <BranchSelectionModal
          show={showBranchModal}
          onClose={() => {
            setShowBranchModal(false)
            setBranchSelectionMode(null)
          }}
          onSelect={handleBranchSelect}
          selectedBranchId={
            branchSelectionMode === 'source' ? formData.sourceId : formData.targetId
          }
        />
      )}
      {showCourseModal && (
        <CourseSelectionModal
          show={showCourseModal}
          onClose={() => {
            setShowCourseModal(false)
            setCourseSelectionMode(null)
          }}
          onSelect={handleCourseSelect}
          selectedCourseId={
            courseSelectionMode === 'source' ? formData.sourceId : formData.targetId
          }
        />
      )}
      {showUserModal && (
        <UserSelectionModal
          show={showUserModal}
          onClose={() => {
            setShowUserModal(false)
            setUserSelectionMode(null)
            setUserAllowedRoles([])
          }}
          onSelect={handleUserSelect}
          selectedUserId={userSelectionMode === 'source' ? formData.sourceId : formData.targetId}
          allowedRoles={userAllowedRoles}
        />
      )}
    </div>
  )
}

export default SystemMapping
