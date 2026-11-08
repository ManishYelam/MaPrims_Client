import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Briefcase, Check } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const PositionSelectionModal = ({
  show,
  onClose,
  onSelect,
  selectedPositionId = null,
  excludeId = null,
  departmentId = null,
  statusFilter = 'active',
  positionStatusFilter = null,
}) => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(selectedPositionId);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const pageSize = 5;

  useEffect(() => {
    if (show) {
      setSelectedId(selectedPositionId);
      setSearchQuery('');
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchPositions();
    }
  }, [show, selectedPositionId, departmentId, statusFilter, positionStatusFilter]);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (departmentId) params.dept_id = departmentId;
      if (statusFilter) params.status = statusFilter;
      if (positionStatusFilter) params.position_status = positionStatusFilter;

      // FIXED: pass params directly, not nested inside another object
      const response = await hrAPI.getPositionDropdown(params);
      const data = response.data;
      if (Array.isArray(data)) {
        setPositions(data);
        setPagination(prev => ({
          ...prev,
          totalItems: data.length,
          totalPages: Math.ceil(data.length / pageSize),
        }));
      } else {
        setPositions([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  // The rest of the modal remains identical ...
  // (filtering, pagination, select handlers, JSX – unchanged)

  const filteredPositions = useMemo(() => {
    let result = [...positions];
    if (excludeId) {
      result = result.filter(p => p.position_id !== excludeId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [positions, searchQuery, excludeId]);

  const totalItems = filteredPositions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.min(pagination.currentPage, totalPages) || 1;
  const paginated = filteredPositions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelect = (pos) => {
    setSelectedId(pos.position_id);
  };

  const handleConfirm = () => {
    if (selectedId) {
      const selected = positions.find(p => p.position_id === selectedId);
      onSelect(selected);
    }
    onClose();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[60]">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Select Position</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {statusFilter === 'active' ? 'Active positions' : 'All positions'}
              {positionStatusFilter ? ` • ${positionStatusFilter.replace('_', ' ')}` : ''}
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
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title or code..."
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
                <p className="text-sm text-gray-600">Loading positions...</p>
              </div>
            </div>
          ) : filteredPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-4">
              <Briefcase className="w-10 h-10 text-gray-300 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No positions found</h3>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                {searchQuery
                  ? `No positions match "${searchQuery}"`
                  : 'No positions available'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(85vh-210px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      Select
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map(pos => (
                    <tr
                      key={pos.position_id}
                      onClick={() => handleSelect(pos)}
                      className={`cursor-pointer transition-colors ${
                        selectedId === pos.position_id
                          ? 'bg-primary-50 hover:bg-primary-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {pos.title}
                            </h4>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {pos.code || '—'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {pos.department?.name || '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selectedId === pos.position_id
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedId === pos.position_id && (
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
                Showing <span className="font-medium">{paginated.length}</span> of{' '}
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2 py-1 text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
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
              ? `Selected: ${positions.find(p => p.position_id === selectedId)?.title || 'Unknown'}`
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

export default React.memo(PositionSelectionModal);