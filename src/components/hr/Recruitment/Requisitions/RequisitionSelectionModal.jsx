import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Briefcase, Check } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const RequisitionSelectionModal = ({
  show,
  onClose,
  onSelect,
  selectedRequisitionId = null,
  excludeId = null,        // optional: exclude a requisition by ID
  onlyOpen = true,          // default: show only open requisitions
}) => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(selectedRequisitionId);

  // Client‑side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset when modal opens
  useEffect(() => {
    if (show) {
      setSelectedId(selectedRequisitionId);
      setSearchQuery('');
      setCurrentPage(1);
      fetchRequisitions();
    }
  }, [show, selectedRequisitionId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchRequisitions();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const params = {};
      // Use the lightweight dropdown endpoint
      if (onlyOpen) params.status = 'open'; // show only open/approved
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await hrAPI.getJobRequisitionsDropdown(params);
      if (response.data?.success) {
        let data = response.data.data || [];
        // Exclude a requisition if needed
        if (excludeId) {
          data = data.filter(r => r.job_requisition_id !== excludeId);
        }
        setRequisitions(data);
      } else {
        setRequisitions([]);
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  // Client‑side pagination
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return requisitions.slice(start, start + pageSize);
  }, [requisitions, currentPage]);

  const totalPages = Math.ceil(requisitions.length / pageSize);
  const totalItems = requisitions.length;

  const handleSelect = (req) => {
    setSelectedId(req.job_requisition_id);
  };

  const handleConfirm = () => {
    if (selectedId) {
      const selected = requisitions.find(r => r.job_requisition_id === selectedId);
      onSelect(selected);
    }
    onClose();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Select Requisition</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choose a job opening</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title or code..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-medium text-gray-700">Loading requisitions...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Briefcase className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1">No requisitions found</h3>
              <p className="text-xs text-gray-600 text-center max-w-xs">
                {searchQuery ? `No requisitions match "${searchQuery}"` : 'No open requisitions available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(90vh-160px)]">
              <div className="p-1">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-gray-200">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-700 w-8">Select</th>
                      <th className="text-left p-2 font-medium text-gray-700">Title</th>
                      <th className="text-left p-2 font-medium text-gray-700">Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map(req => (
                      <tr
                        key={req.job_requisition_id}
                        onClick={() => handleSelect(req)}
                        className={`cursor-pointer transition-colors ${selectedId === req.job_requisition_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="p-2">
                          <div className="flex items-center justify-center">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedId === req.job_requisition_id ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}
                            >
                              {selectedId === req.job_requisition_id && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="font-medium text-gray-900 truncate max-w-[250px]">
                            {req.title}
                          </div>
                        </td>
                        <td className="p-2 font-mono text-gray-700">
                          {req.requisition_code || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Page {currentPage} of {totalPages} • {totalItems} requisitions
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) pageNum = i + 1;
                  else if (currentPage === 1) pageNum = i + 1;
                  else if (currentPage === totalPages) pageNum = totalPages - 2 + i;
                  else pageNum = currentPage - 1 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-7 h-7 rounded text-xs ${currentPage === pageNum ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 3 && <span className="px-1 text-gray-500">...</span>}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {selectedId ? (
                <span>
                  Selected: <span className="font-medium">{requisitions.find(r => r.job_requisition_id === selectedId)?.title || ''}</span>
                </span>
              ) : (
                <span>No requisition selected</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedId}
                className={`px-3 py-1.5 text-xs font-medium text-white rounded ${selectedId ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Select
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RequisitionSelectionModal);