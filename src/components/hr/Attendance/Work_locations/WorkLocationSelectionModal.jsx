import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, MapPin, Check } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const WorkLocationSelectionModal = ({
  show,
  onClose,
  onSelect,
  selectedWorkLocationId = null,
  excludeId = null,
  statusFilter = 'active',
  locationTypeFilter = null, // optional: filter by location_type
}) => {
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(selectedWorkLocationId);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // items per page

  // Fetch all matching locations when the modal opens or filters change
  useEffect(() => {
    if (show) {
      setSelectedId(selectedWorkLocationId);
      setSearchQuery('');
      setCurrentPage(1);
      fetchAllLocations();
    }
  }, [show, selectedWorkLocationId, statusFilter, locationTypeFilter]);

  const fetchAllLocations = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (locationTypeFilter) filters.location_type = locationTypeFilter;

      // Fetch all matching locations (large limit to get everything)
      const payload = {
        page: 1,
        limit: 1000, // adjust if you have more locations; can be increased
        search: '',   // no search yet – we'll filter client‑side
        searchFields: 'name,code',
        sortBy: 'name',
        sortOrder: 'ASC',
        filters,
      };

      const response = await hrAPI.getAllWorklocations(payload);
      const data = response.data || response;
      setAllLocations(data.workLocations || []);
    } catch (error) {
      console.error('Error fetching work locations:', error);
      setAllLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Client‑side filtering: search + exclude
  const filteredLocations = useMemo(() => {
    let result = [...allLocations];

    if (excludeId) {
      result = result.filter(loc => loc.work_location_id !== excludeId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(loc =>
        (loc.name || '').toLowerCase().includes(q) ||
        (loc.code || '').toLowerCase().includes(q) ||
        (loc.city || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [allLocations, searchQuery, excludeId]);

  // Local pagination
  const totalItems = filteredLocations.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
  const paginatedLocations = filteredLocations.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const handleSelect = (location) => {
    setSelectedId(location.work_location_id);
  };

  const handleConfirm = () => {
    if (selectedId) {
      const selected = allLocations.find(l => l.work_location_id === selectedId);
      onSelect(selected);
    }
    onClose();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[60]">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Select Work Location</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {statusFilter === 'active' ? 'Active locations' : 'All locations'}
              {locationTypeFilter ? ` • ${locationTypeFilter.replace(/_/g, ' ')}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // reset to first page on search
              }}
              placeholder="Search by name, code, or city..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading locations...</p>
              </div>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-4">
              <MapPin className="w-10 h-10 text-gray-300 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No locations found</h3>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                {searchQuery
                  ? `No locations match "${searchQuery}"`
                  : 'No locations available'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(85vh-210px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      Select
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLocations.map(loc => (
                    <tr
                      key={loc.work_location_id}
                      onClick={() => handleSelect(loc)}
                      className={`cursor-pointer transition-colors ${
                        selectedId === loc.work_location_id
                          ? 'bg-primary-50 hover:bg-primary-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {loc.name}
                            </h4>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {loc.code || '—'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {loc.city || '—'}
                      </td>
                      <td className="p-3 text-sm text-gray-600 capitalize">
                        {(loc.location_type || '—').replace(/_/g, ' ')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selectedId === loc.work_location_id
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedId === loc.work_location_id && (
                              <Check className="w-3 h-3 text-white" />
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
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{paginatedLocations.length}</span> of{' '}
                <span className="font-medium">{totalItems}</span> locations
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2 py-1 text-sm text-gray-700">
                  {safeCurrentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedId
              ? `Selected: ${allLocations.find(l => l.work_location_id === selectedId)?.name || 'Unknown'}`
              : 'None selected'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className={`px-3 py-1.5 text-sm font-medium text-white rounded ${
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
  );
};

export default React.memo(WorkLocationSelectionModal);