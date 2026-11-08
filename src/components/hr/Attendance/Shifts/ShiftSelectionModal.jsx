import React, { useState, useEffect } from 'react';
import { X, Search, Clock, Tag, Check } from 'lucide-react';
import { hrAPI } from '../../../../services/api'; 

const ShiftSelectionModal = ({
  show,
  onClose,
  onSelect,
  selectedShiftId = null,
}) => {
  const [allShifts, setAllShifts] = useState([]);   // full list fetched once
  const [filteredShifts, setFilteredShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(selectedShiftId);

  // Fetch all active shifts when modal opens
  useEffect(() => {
    if (show) {
      setLoading(true);
      fetchShifts();
      setSelectedId(selectedShiftId);
    }
  }, [show, selectedShiftId]);

  const fetchShifts = async () => {
    try {
      // Using the exact API method you provided, fetching all active shifts
      const response = await hrAPI.getShiftDropdown({
        limit: 1000,   // high limit to get everything (or omit if backend returns all)
        status: 'active',
      });

      if (response.data?.success) {
        const shifts = response.data.data || response.data; // handle both shapes
        setAllShifts(shifts);
        setFilteredShifts(shifts);
      } else {
        setAllShifts([]);
        setFilteredShifts([]);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setAllShifts([]);
      setFilteredShifts([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter on name or code
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredShifts(allShifts);
      return;
    }
    const lower = searchQuery.toLowerCase();
    const filtered = allShifts.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(lower)) ||
        (s.code && s.code.toLowerCase().includes(lower))
    );
    setFilteredShifts(filtered);
  }, [searchQuery, allShifts]);

  const handleSelect = (shift) => {
    setSelectedId(shift.id || shift.shift_id);  // normalise ID
  };

  const handleConfirm = () => {
    if (selectedId) {
      const selectedShift = filteredShifts.find(
        (s) => (s.id || s.shift_id) === selectedId
      );
      onSelect(selectedShift);
    }
    onClose();
  };

  // Format time helpers
  const formatTime = (time) => {
    if (!time) return '—';
    return time.substring(0, 5);   // "HH:mm"
  };

  const getShiftTypeBadge = (type) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800 border border-blue-200',
      morning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      evening: 'bg-orange-100 text-orange-800 border border-orange-200',
      night: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      rotational: 'bg-purple-100 text-purple-800 border border-purple-200',
      flexible: 'bg-green-100 text-green-800 border border-green-200',
    };
    return colors[type] || colors.general;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Select Shift</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose a shift to assign
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by shift name or code..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-medium text-gray-700">Loading shifts...</p>
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1">
                {searchQuery ? 'No shifts found' : 'No shifts available'}
              </h3>
              <p className="text-xs text-gray-600 text-center max-w-xs">
                {searchQuery
                  ? `No shifts match "${searchQuery}"`
                  : 'No active shifts found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(90vh-160px)]">
              <div className="p-1">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-gray-200">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-700">Select</th>
                      <th className="text-left p-2 font-medium text-gray-700">Shift Name</th>
                      <th className="text-left p-2 font-medium text-gray-700">Code</th>
                      <th className="text-left p-2 font-medium text-gray-700">Type</th>
                      <th className="text-left p-2 font-medium text-gray-700">Timing</th>
                      <th className="text-left p-2 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredShifts.map((shift) => {
                      const id = shift.id || shift.shift_id;
                      return (
                        <tr
                          key={id}
                          onClick={() => handleSelect(shift)}
                          className={`cursor-pointer transition-colors ${
                            selectedId === id ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Radio */}
                          <td className="p-2">
                            <div className="flex items-center justify-center">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  selectedId === id
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-gray-300'
                                }`}
                              >
                                {selectedId === id && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Name */}
                          <td className="p-2">
                            <div className="font-medium text-gray-900 truncate max-w-[200px]">
                              {shift.name}
                            </div>
                            {shift.description && (
                              <div className="text-gray-500 truncate max-w-[200px] text-xs">
                                {shift.description}
                              </div>
                            )}
                          </td>
                          {/* Code */}
                          <td className="p-2">
                            <span className="font-mono text-gray-700">
                              {shift.code || '—'}
                            </span>
                          </td>
                          {/* Type */}
                          <td className="p-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getShiftTypeBadge(shift.shift_type)}`}
                            >
                              {shift.shift_type}
                            </span>
                          </td>
                          {/* Timing */}
                          <td className="p-2">
                            <div className="flex items-center gap-1 text-gray-700">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>
                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                              </span>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="p-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                shift.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {shift.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer (no pagination needed) */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {selectedId ? (
                <span>
                  Selected:{' '}
                  <span className="font-medium">
                    {filteredShifts.find((s) => (s.id || s.shift_id) === selectedId)?.name || ''}
                  </span>
                </span>
              ) : (
                <span>No shift selected</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedId}
                className={`px-3 py-1.5 text-xs font-medium text-white rounded ${
                  selectedId
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Select Shift
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftSelectionModal;