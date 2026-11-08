// src/components/ui/ServiceSelectionModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Search, Package, Check } from 'lucide-react'
import { servicesAPI } from '../../services/api'

const ServiceSelectionModal = ({ show, onClose, onSelect, selectedServiceId = null }) => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState(selectedServiceId)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  useEffect(() => {
    if (show) {
      fetchServices(1)
      setSelectedId(selectedServiceId)
    }
  }, [show, selectedServiceId])

  const fetchServices = async (page = 1) => {
    try {
      setLoading(true)
      const response = await servicesAPI.getDropdownList({
        page: page,
        limit: 8,
        search: searchQuery || undefined,
      })

      // Response structure: { data: [], total, limit, hasMore }
      const resData = response.data.data
      if (resData && Array.isArray(resData.data)) {
        const servicesArray = resData.data
        const totalItems = resData.total || 0
        const limit = resData.limit || 8

        setServices(servicesArray)
        setPagination({
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit) || 1,
          totalItems: totalItems,
        })
      } else {
        setServices([])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = e => {
    setSearchQuery(e.target.value)
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      fetchServices(1)
    }, 300)
  }

  const handleSelect = service => {
    setSelectedId(service.id)
  }

  const handleConfirm = () => {
    if (selectedId) {
      const selectedService = services.find(s => s.id === selectedId)
      onSelect(selectedService)
    }
    onClose()
  }

  const handlePageChange = page => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchServices(page)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[60]">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Select Service</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search services..."
              className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <p className="text-xs text-gray-600">Loading...</p>
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 p-3">
              <Package className="w-6 h-6 text-gray-400 mb-1.5" />
              <h3 className="text-xs font-medium text-gray-900 mb-0.5">No services found</h3>
              <p className="text-xs text-gray-600 text-center max-w-xs">
                {searchQuery ? `No matches for "${searchQuery}"` : 'No services available'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(85vh-180px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b border-gray-200">
                  <tr>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">Service</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700">ID</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.map(service => (
                    <tr
                      key={service.id}
                      onClick={() => handleSelect(service)}
                      className={`cursor-pointer hover:bg-gray-50 ${selectedId === service.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Package className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-medium text-gray-900 truncate">
                              {service.name || service.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {service.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-xs text-gray-600">#{service.id}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedId === service.id
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedId === service.id && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {services.length > 0 && (
          <div className="p-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {services.length} of {pagination.totalItems}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-1.5 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-1.5 py-0.5 text-xs text-gray-700">
                  {pagination.currentPage}/{pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-1.5 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">{selectedId ? 'Selected' : 'None selected'}</div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onClose}
                className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedId}
                className={`px-2.5 py-1 text-xs font-medium text-white rounded ${
                  selectedId
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
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

export default ServiceSelectionModal