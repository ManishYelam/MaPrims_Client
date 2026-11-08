import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, User, Check, Mail, Briefcase } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-700',
  screening: 'bg-purple-100 text-purple-700',
  shortlisted: 'bg-indigo-100 text-indigo-700',
  interview_scheduled: 'bg-yellow-100 text-yellow-800',
  interview_completed: 'bg-orange-100 text-orange-700',
  offered: 'bg-green-100 text-green-700',
  offer_accepted: 'bg-emerald-100 text-emerald-700',
  offer_declined: 'bg-red-100 text-red-700',
  hired: 'bg-teal-100 text-teal-700',
  rejected: 'bg-gray-100 text-gray-700',
  withdrawn: 'bg-gray-200 text-gray-600',
};

const JobApplicationSelectionModal = ({
  show,
  onClose,
  onSelect,
  selectedApplicationId = null,
  excludeId = null,          // optional: exclude an application by ID
  statusFilter = null,       // optional: filter by status (e.g., 'interview_scheduled')
}) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(selectedApplicationId);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset when modal opens
  useEffect(() => {
    if (show) {
      setSelectedId(selectedApplicationId);
      setSearchQuery('');
      setCurrentPage(1);
      fetchApplications();
    }
  }, [show, selectedApplicationId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchApplications();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await hrAPI.getJobApplicationsDropdown(params);
      if (response.data?.success) {
        let data = response.data.data || [];
        if (excludeId) {
          data = data.filter(app => app.job_app_id !== excludeId);
        }
        setApplications(data);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Client‑side pagination
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return applications.slice(start, start + pageSize);
  }, [applications, currentPage]);

  const totalPages = Math.ceil(applications.length / pageSize);
  const totalItems = applications.length;

  const handleSelect = (app) => {
    setSelectedId(app.job_app_id);
  };

  const handleConfirm = () => {
    if (selectedId) {
      const selected = applications.find(a => a.job_app_id === selectedId);
      onSelect(selected);
    }
    onClose();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getDisplayName = (app) => {
    return [app.candidate_first_name, app.candidate_last_name].filter(Boolean).join(' ') || app.email || `App #${app.job_app_id}`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Select Application</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choose a job application</p>
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
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-medium text-gray-700">Loading applications...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1">No applications found</h3>
              <p className="text-xs text-gray-600 text-center max-w-xs">
                {searchQuery ? `No applications match "${searchQuery}"` : 'No applications available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(90vh-160px)]">
              <div className="p-1">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-gray-200">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-700 w-8">Select</th>
                      <th className="text-left p-2 font-medium text-gray-700">Candidate</th>
                      <th className="text-left p-2 font-medium text-gray-700">Email</th>
                      <th className="text-left p-2 font-medium text-gray-700">Status</th>
                      <th className="text-left p-2 font-medium text-gray-700">App ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map(app => (
                      <tr
                        key={app.job_app_id}
                        onClick={() => handleSelect(app)}
                        className={`cursor-pointer transition-colors ${selectedId === app.job_app_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="p-2">
                          <div className="flex items-center justify-center">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedId === app.job_app_id ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}
                            >
                              {selectedId === app.job_app_id && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-gray-600" />
                            </div>
                            <div className="font-medium text-gray-900 truncate max-w-[180px]">
                              {getDisplayName(app)}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[200px]">{app.email}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-700'}`}>
                            {app.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-gray-700">
                          #{app.job_app_id}
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
                Page {currentPage} of {totalPages} • {totalItems} applications
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
                  Selected: <span className="font-medium">{getDisplayName(applications.find(a => a.job_app_id === selectedId) || {})}</span>
                </span>
              ) : (
                <span>No application selected</span>
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

export default React.memo(JobApplicationSelectionModal);