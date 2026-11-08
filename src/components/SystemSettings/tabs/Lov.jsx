import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  Search,
  Sliders,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tag,
  Save,
} from 'lucide-react'
import { genericAPI } from '../../../services/api'
import { lovSchema } from '../validations/sysSchemas'

const LOV = ({ showMessage, showConfirmation }) => {
  const [lovs, setLovs] = useState([])
  const [lovCategories, setLovCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingLov, setEditingLov] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    page: 1,
    limit: 10,
  })
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [showFilters, setShowFilters] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(lovSchema),
    defaultValues: {
      category: '',
      code: '',
      description: '',
      isActive: true,
    },
  })

  // Fetch all categories (without filters) on mount
  const loadAllCategories = useCallback(async () => {
    try {
      const payload = { page: 1, limit: 1000 }
      const response = await genericAPI.getAllLOVs(payload)
      if (response.data?.success) {
        const allData = response.data.data || []
        const categories = [...new Set(allData.map(lov => lov.category))].sort()
        setLovCategories(categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [])

  // Load table data with current filters
  const loadLOVs = useCallback(async () => {
    setLoading(true)
    try {
      const payload = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.category !== 'all' && { categories: [filters.category] }),
        ...(filters.status !== 'all' && { isActive: filters.status === 'active' }),
      }
      const response = await genericAPI.getAllLOVs(payload)
      if (response.data?.success) {
        setLovs(response.data.data || [])
        setPagination({
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
        })
      }
    } catch (error) {
      console.error('Error loading LOVs:', error)
      showMessage('error', 'Failed to load list of values')
    } finally {
      setLoading(false)
    }
  }, [filters, showMessage])

  // Load categories on mount
  useEffect(() => {
    loadAllCategories()
  }, [loadAllCategories])

  // Debounced load of LOVs when filters change
  const debounceTimer = useRef(null)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      loadLOVs()
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [loadLOVs])

  // Filter handlers
  const handleSearchChange = value => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }

  const handleCategoryChange = category => {
    setFilters(prev => ({ ...prev, category, page: 1 }))
  }

  const handleStatusChange = status => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }

  const handleLimitChange = newLimit => {
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }))
  }

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }))
    }
  }

  const clearAllFilters = () => {
    setFilters({ search: '', category: 'all', status: 'all', page: 1, limit: 10 })
  }

  const hasActiveFilters =
    filters.search !== '' || filters.category !== 'all' || filters.status !== 'all'

  // Modal functions
  const openLovModal = (lov = null) => {
    setEditingLov(lov)
    if (lov) {
      reset({
        category: lov.category,
        code: lov.code,
        description: lov.description,
        isActive: lov.isActive,
      })
    } else {
      reset({ category: '', code: '', description: '', isActive: true })
    }
    setShowModal(true)
  }

  const closeLovModal = () => {
    setShowModal(false)
    setEditingLov(null)
    reset()
  }

  const handleLovSubmit = async data => {
    try {
      const payload = { ...data, isActive: data.isActive !== false }
      if (editingLov) payload.lov_id = editingLov.lov_id
      const response = await genericAPI.createOrUpdateLOV(payload)
      if (response.data?.success) {
        showMessage(
          'success',
          editingLov ? 'LOV updated successfully!' : 'LOV created successfully!'
        )
        closeLovModal()
        await loadAllCategories()
        await loadLOVs()
      }
    } catch (error) {
      console.error('Error saving LOV:', error)
      showMessage('error', 'Failed to save LOV')
    }
  }

  const toggleLOVStatus = async lov => {
    try {
      const payload = {
        lov_id: lov.lov_id,
        category: lov.category,
        code: lov.code,
        description: lov.description,
        isActive: !lov.isActive,
      }
      const response = await genericAPI.createOrUpdateLOV(payload)
      if (response.data?.success) {
        showMessage('success', `LOV ${lov.isActive ? 'deactivated' : 'activated'} successfully!`)
        await loadLOVs()
      }
    } catch (error) {
      console.error('Error updating LOV status:', error)
      showMessage('error', 'Failed to update LOV status')
    }
  }

  const deleteLOV = lovId => {
    const lov = lovs.find(l => l.lov_id === lovId)
    showConfirmation(
      'Delete List of Value',
      `Are you sure you want to delete the LOV item "${lov?.code}"? This action cannot be undone.`,
      'lovDelete',
      async () => {
        try {
          const response = await genericAPI.deleteLOV(lovId)
          if (response.data?.success) {
            showMessage('success', 'LOV deleted successfully!')
            await loadAllCategories()
            await loadLOVs()
          }
        } catch (error) {
          console.error('Error deleting LOV:', error)
          showMessage('error', 'Failed to delete LOV')
        }
      }
    )
  }

  const lovFields = [
    {
      name: 'category',
      label: 'Category',
      required: true,
      type: 'text',
      placeholder: 'e.g., ASSESSMENT_TYPE, BADGE_TYPE',
    },
    {
      name: 'code',
      label: 'Code',
      required: true,
      type: 'text',
      placeholder: 'e.g., QUIZ, PROJECT_CHAMPION',
    },
    {
      name: 'description',
      label: 'Description',
      required: true,
      type: 'textarea',
      rows: 3,
      placeholder: 'Enter description for this value',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">List of Values</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Manage system constants and dropdown values ({pagination.total} total items)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>
            <button
              onClick={() => openLovModal()}
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add LOV</span>
            </button>
          </div>
        </div>

        {/* Filter Bar - hidden when showFilters is false */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search by category, code, or description..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={filters.category}
              onChange={e => handleCategoryChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Categories</option>
              {lovCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={e => handleStatusChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filters.limit}
              onChange={e => handleLimitChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        )}

        {/* Active Filters Summary - always visible when filters are active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-blue-800">Active Filters:</span>
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Search: "{filters.search}"
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.category !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Category: {filters.category}
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Status: {filters.status}
                  <button
                    onClick={() => handleStatusChange('all')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {/* LOV Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-24 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-xs text-gray-600">Loading LOVs...</span>
                    </div>
                  </td>
                </tr>
              ) : lovs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 py-8 text-center text-gray-500">
                    {hasActiveFilters
                      ? 'No LOVs match your filters.'
                      : 'No LOVs found. Click "Add LOV" to create one.'}
                  </td>
                </tr>
              ) : (
                lovs.map(lov => (
                  <tr key={lov.lov_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-gray-900 text-xs">{lov.category}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">
                        {lov.code}
                      </code>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-gray-700 text-xs">{lov.description}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => toggleLOVStatus(lov)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                          lov.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {lov.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-gray-500 text-xs">
                        {new Date(lov.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openLovModal(lov)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
                          title="Edit LOV"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteLOV(lov.lov_id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                          title="Delete LOV"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - compact size */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-2 border-t border-gray-200">
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <span>Showing</span>
              <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
              <span>to</span>
              <span className="font-medium">
                {Math.min(filters.page * filters.limit, pagination.total)}
              </span>
              <span>of</span>
              <span className="font-medium">{pagination.total}</span>
              <span>results</span>
            </div>
            <div className="flex items-center space-x-0.5">
              <button
                onClick={() => handlePageChange(1)}
                disabled={filters.page === 1}
                className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronsLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) pageNum = i + 1
                else if (filters.page <= 3) pageNum = i + 1
                else if (filters.page >= pagination.totalPages - 2)
                  pageNum = pagination.totalPages - 4 + i
                else pageNum = filters.page - 2 + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-6 h-6 text-xs rounded border ${
                      filters.page === pageNum
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages}
                className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={filters.page === pagination.totalPages}
                className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronsRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LOV Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingLov ? 'Edit List of Value' : 'New List of Value'}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {editingLov ? `Editing: ${editingLov.code}` : 'Create new list of value item'}
                </p>
              </div>
              <button onClick={closeLovModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit(handleLovSubmit)} className="space-y-4">
                {lovFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {field.label} {field.required && '*'}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        {...register(field.name)}
                        rows={field.rows}
                        className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                          errors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <input
                        type={field.type}
                        {...register(field.name)}
                        className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                          errors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={field.placeholder}
                      />
                    )}
                    {errors[field.name] && (
                      <p className="mt-1 text-xs text-red-600">{errors[field.name].message}</p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="text-xs text-gray-600">Set this item as active</p>
                  </div>
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div></div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={closeLovModal}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{loading ? 'Saving...' : editingLov ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LOV
