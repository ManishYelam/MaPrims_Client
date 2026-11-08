import React, {
  useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense,
} from 'react';
import {
  Search, Edit, Trash2, Plus, Download, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Calendar as CalendarIcon, List, X, RefreshCw, ChevronDown, AlertCircle,
  Power, PowerOff, Loader,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const HolidayCalendar = lazy(() => import('./HolidayCalendar'));
const HolidayModal = lazy(() => import('./HolidayModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const availableSearchFields = ['name', 'description', 'holiday_type'];

const holidayTypes = [
  { value: 'national', label: 'National' },
  { value: 'company', label: 'Company' },
  { value: 'regional', label: 'Regional' },
  { value: 'religious', label: 'Religious' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getTypeColor = (type) => {
  const map = {
    national: 'bg-blue-100 text-blue-800',
    company: 'bg-purple-100 text-purple-800',
    regional: 'bg-green-100 text-green-800',
    religious: 'bg-orange-100 text-orange-800',
  };
  return map[type] || 'bg-gray-100 text-gray-800';
};

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const transformHoliday = (apiHoliday) => ({
  id: apiHoliday.holiday_id,
  org_id: apiHoliday.org_id,
  name: apiHoliday.name,
  date: apiHoliday.date,
  type: apiHoliday.holiday_type,
  description: apiHoliday.description,
  location: apiHoliday.work_location?.name || null,
  work_location_id: apiHoliday.work_location_id,
  status: String(apiHoliday.status || 'active').toLowerCase().trim(),
  is_paid: apiHoliday.is_paid,
  is_recurring: apiHoliday.is_recurring,
  recurrence_type: apiHoliday.recurrence_type,
  created_by: apiHoliday.created_by,
  updated_by: apiHoliday.updated_by,
  created_at: apiHoliday.created_at,
  updated_at: apiHoliday.updated_at,
  employee_count: 0,
});

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const StatusBadge = memo(({ status }) => {
  const statusMap = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-300' },
    inactive: { label: 'Inactive', color: 'bg-red-100 text-red-700 border-red-300' },
    upcoming: { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    past: { label: 'Past', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  };
  const s = statusMap[status] || statusMap.inactive;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
      {s.label}
    </span>
  );
});

const MultiSelectSearchFields = memo(({ selectedFields, onFieldChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleField = useCallback(
    (field) => {
      onFieldChange(
        selectedFields.includes(field)
          ? selectedFields.filter((f) => f !== field)
          : [...selectedFields, field]
      );
    },
    [selectedFields, onFieldChange]
  );
  const selectAllFields = useCallback(() => onFieldChange([...availableSearchFields]), [onFieldChange]);
  const clearAllFields = useCallback(() => onFieldChange([]), [onFieldChange]);
  const getFieldLabel = (field) => {
    const labels = { name: 'Name', description: 'Description', holiday_type: 'Type' };
    return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };
  return (
    <div className="relative w-44">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white flex items-center justify-between"
      >
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {selectedFields.length === 0 ? (
              <span className="text-gray-400 whitespace-nowrap">Select fields</span>
            ) : (
              selectedFields.map((field) => (
                <span key={field} className="inline-flex flex-shrink-0 items-center px-1.5 py-0.5 bg-primary-100 text-primary-800 text-[10px] rounded border border-primary-200 whitespace-nowrap">
                  {getFieldLabel(field)}
                </span>
              ))
            )}
          </div>
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Search Fields</span>
              <div className="flex gap-1 text-xs">
                <button type="button" onClick={selectAllFields} className="text-primary-600 hover:text-primary-800">All</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={clearAllFields} className="text-red-600 hover:text-red-800">Clear</button>
              </div>
            </div>
            <p className="text-[10px] text-gray-500">Choose fields to search in</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {availableSearchFields.map((field) => (
              <label key={field} className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500"
                />
                <span className="ml-2 text-xs text-gray-700">{getFieldLabel(field)}</span>
              </label>
            ))}
          </div>
          <div className="p-1.5 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const HolidaysManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'holiday', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'holiday', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'holiday', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'holiday', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'holiday', 'A4') || canManage, [hasPermission, canManage]);

  const [view, setView] = useState('calendar');
  const [holidays, setHolidays] = useState([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0, upcoming: 0, past: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFields, setSearchFields] = useState(['name', 'description']);
  const [selectedHolidays, setSelectedHolidays] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const tabs = useMemo(() => {
    const { total, active, inactive, upcoming, past } = counts;
    return [
      { id: 'all', name: 'All', count: total },
      { id: 'active', name: 'Active', count: active },
      { id: 'inactive', name: 'Inactive', count: inactive },
      { id: 'upcoming', name: 'Upcoming', count: upcoming },
      { id: 'past', name: 'Past', count: past },
    ];
  }, [counts]);

  const fetchHolidays = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const {
        page = pagination.page,
        limit = pagination.limit,
        search = debouncedSearch,
        status = statusFilter,
        type = typeFilter,
      } = params;
      const filters = {};
      if (status !== 'all') filters.status = status;
      if (type !== 'all') filters.holiday_type = type;
      const payload = { page, limit, search: search.trim() || '', searchFields, filters };
      const response = await hrAPI.getHolidays(payload);
      const data = response.data;
      if (data?.success) {
        setHolidays((data.holidays || []).map(transformHoliday));
        setCounts({
          total: data.counts?.total || 0,
          active: data.counts?.active || 0,
          inactive: data.counts?.inactive || 0,
          upcoming: data.counts?.upcoming || 0,
          past: data.counts?.past || 0,
        });
        setPagination({
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 50,
          totalItems: data.pagination?.totalItems || 0,
          totalPages: data.pagination?.totalPages || 1,
        });
      } else throw new Error(data?.message || 'Invalid response');
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setError(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, typeFilter, searchFields]);

  useEffect(() => {
    if (view === 'table') fetchHolidays();
  }, [view, fetchHolidays]);

  const refreshData = useCallback(async () => {
    if (view === 'table') {
      setRefreshing(true);
      await fetchHolidays();
      showToast('Data refreshed', 'success');
    } else {
      setCalendarRefreshKey((prev) => prev + 1);
      showToast('Calendar refreshed', 'success');
    }
  }, [view, fetchHolidays]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const handleStatusChange = useCallback((status) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleTypeChange = useCallback((type) => {
    setTypeFilter(type);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setPagination((prev) => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  }, [pagination.totalPages]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchFields([...availableSearchFields]);
    setPagination((prev) => ({ ...prev, page: 1 }));
    showToast('All filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() =>
    searchTerm !== '' || statusFilter !== 'all' || typeFilter !== 'all' || searchFields.length < availableSearchFields.length,
    [searchTerm, statusFilter, typeFilter, searchFields]
  );

  /* ✅ View / Edit support: readOnly flag */
  const openHolidayModal = useCallback((holiday = null, readOnlyMode = false) => {
    if (holiday && !canUpdate && !readOnlyMode) return showToast('No permission to edit', 'error');
    if (!holiday && !canCreate) return showToast('No permission to create', 'error');
    setEditingHoliday(holiday);
    setIsReadOnly(readOnlyMode);
    setShowHolidayModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeHolidayModal = useCallback(() => {
    setShowHolidayModal(false);
    setEditingHoliday(null);
    setIsReadOnly(false);
  }, []);

  const handleHolidaySaved = useCallback(() => {
    closeHolidayModal();
    if (view === 'table') refreshData();
    else setCalendarRefreshKey((prev) => prev + 1);
    showToast('Holiday saved!', 'success');
  }, [view, refreshData, closeHolidayModal, showToast]);

  const toggleHolidaySelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedHolidays((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelectedHolidays((prev) => (prev.length === holidays.length ? [] : holidays.map((h) => h.id)));
  }, [canBulk, holidays]);

  /* ✅ OPTIMISTIC bulk action — no full refresh */
  const handleBulkAction = useCallback(async () => {
    if (!canBulk) return showToast('No permission for bulk actions', 'error');
    if (!bulkAction || selectedHolidays.length === 0) return;

    const ids = [...selectedHolidays];
    const snapshot = holidays;
    const snapshotCounts = counts;
    const snapshotTotal = pagination.totalItems;

    try {
      if (bulkAction === 'delete') {
        if (!canDelete) return showToast('No permission to delete', 'error');
        showConfirmation('Delete Holidays', `Delete ${ids.length} holiday(s)?`, 'bulkDelete', async () => {
          // Optimistic remove
          setHolidays(prev => prev.filter(h => !ids.includes(h.id)));
          setPagination(prev => ({ ...prev, totalItems: Math.max(0, prev.totalItems - ids.length) }));
          setCounts(prev => ({ ...prev, total: Math.max(0, (prev.total || 0) - ids.length) }));
          setBulkAction(''); setSelectedHolidays([]);

          try {
            await Promise.all(ids.map((id) => hrAPI.deleteHoliday(id)));
            showToast(`Deleted ${ids.length} holidays`, 'success');
          } catch (err) {
            // Rollback
            setHolidays(snapshot);
            setCounts(snapshotCounts);
            setPagination(prev => ({ ...prev, totalItems: snapshotTotal }));
            showToast('Bulk delete failed', 'error');
          }
        });
      } else {
        // Optimistic status update
        setHolidays(prev => prev.map(h => ids.includes(h.id) ? { ...h, status: bulkAction } : h));
        setCounts(prev => {
          const next = { ...prev };
          ids.forEach(id => {
            const old = snapshot.find(h => h.id === id);
            if (old?.status === 'active' && bulkAction === 'inactive') {
              next.active = Math.max(0, (next.active || 0) - 1);
              next.inactive = (next.inactive || 0) + 1;
            } else if (old?.status === 'inactive' && bulkAction === 'active') {
              next.inactive = Math.max(0, (next.inactive || 0) - 1);
              next.active = (next.active || 0) + 1;
            }
          });
          return next;
        });
        setBulkAction(''); setSelectedHolidays([]);

        try {
          await Promise.all(ids.map((id) => hrAPI.updateHoliday(id, { status: bulkAction })));
          showToast(`Updated ${ids.length} holidays`, 'success');
        } catch (err) {
          setHolidays(snapshot);
          setCounts(snapshotCounts);
          showToast('Bulk update failed', 'error');
        }
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      showToast('Bulk action failed.', 'error');
    }
  }, [canBulk, canDelete, bulkAction, selectedHolidays, holidays, counts, pagination.totalItems, showToast]);

  /* ✅ OPTIMISTIC inline status update — no full refresh */
  const handleStatusUpdate = useCallback(async (id, newStatus) => {
    if (!canUpdate) return showToast('No permission to update status', 'error');

    const target = holidays.find(h => h.id === id);
    const currentStatus = target?.status || 'active';
    if (currentStatus === newStatus) return;

    setHolidays(prev => prev.map(h => h.id === id ? { ...h, status: newStatus } : h));
    setCounts(prev => {
      const next = { ...prev };
      if (currentStatus === 'active' && newStatus === 'inactive') {
        next.active = Math.max(0, (next.active || 0) - 1);
        next.inactive = (next.inactive || 0) + 1;
      } else if (currentStatus === 'inactive' && newStatus === 'active') {
        next.inactive = Math.max(0, (next.inactive || 0) - 1);
        next.active = (next.active || 0) + 1;
      }
      return next;
    });

    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await hrAPI.updateHoliday(id, { status: newStatus });
      showToast('Status updated', 'success');
    } catch (err) {
      setHolidays(prev => prev.map(h => h.id === id ? { ...h, status: currentStatus } : h));
      setCounts(prev => {
        const next = { ...prev };
        if (currentStatus === 'active' && newStatus === 'inactive') {
          next.active = (next.active || 0) + 1;
          next.inactive = Math.max(0, (next.inactive || 0) - 1);
        } else if (currentStatus === 'inactive' && newStatus === 'active') {
          next.inactive = (next.inactive || 0) + 1;
          next.active = Math.max(0, (next.active || 0) - 1);
        }
        return next;
      });
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingStatusIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [canUpdate, holidays, showToast]);

  /* ✅ OPTIMISTIC Power toggle — no full refresh */
  const handleQuickStatusToggle = useCallback(async (holiday) => {
    if (!canUpdate) return showToast('No permission to update status', 'error');
    const id = holiday.id;
    const currentStatus = holiday.status || 'active';
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';

    setHolidays(prev => prev.map(h => h.id === id ? { ...h, status: nextStatus } : h));
    setCounts(prev => {
      const next = { ...prev };
      if (nextStatus === 'active') {
        next.active = (next.active || 0) + 1;
        next.inactive = Math.max(0, (next.inactive || 0) - 1);
      } else {
        next.inactive = (next.inactive || 0) + 1;
        next.active = Math.max(0, (next.active || 0) - 1);
      }
      return next;
    });

    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await hrAPI.updateHoliday(id, { status: nextStatus });
      showToast(`Holiday ${nextStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      setHolidays(prev => prev.map(h => h.id === id ? { ...h, status: currentStatus } : h));
      setCounts(prev => {
        const next = { ...prev };
        if (currentStatus === 'active') {
          next.active = (next.active || 0) + 1;
          next.inactive = Math.max(0, (next.inactive || 0) - 1);
        } else {
          next.inactive = (next.inactive || 0) + 1;
          next.active = Math.max(0, (next.active || 0) - 1);
        }
        return next;
      });
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [canUpdate, showToast]);

  /* ✅ OPTIMISTIC delete — no full refresh */
  const handleDeleteHoliday = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const holiday = holidays.find((h) => h.id === id);
    showConfirmation('Delete Holiday', `Delete "${holiday?.name}"?`, 'delete', async () => {
      const snapshot = holidays;
      const snapshotCounts = counts;
      const snapshotTotal = pagination.totalItems;

      setHolidays(prev => prev.filter(h => h.id !== id));
      setPagination(prev => ({ ...prev, totalItems: Math.max(0, prev.totalItems - 1) }));
      setCounts(prev => {
        const next = { ...prev };
        next.total = Math.max(0, (next.total || 0) - 1);
        if (holiday?.status === 'active') next.active = Math.max(0, (next.active || 0) - 1);
        if (holiday?.status === 'inactive') next.inactive = Math.max(0, (next.inactive || 0) - 1);
        return next;
      });

      try {
        await hrAPI.deleteHoliday(id);
        showToast('Holiday deleted', 'success');
      } catch (err) {
        setHolidays(snapshot);
        setCounts(snapshotCounts);
        setPagination(prev => ({ ...prev, totalItems: snapshotTotal }));
        showToast('Failed to delete', 'error');
      }
    });
  }, [canDelete, holidays, counts, pagination.totalItems, showToast]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation({ show: false, title: '', message: '', type: '', onConfirm: null });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    if (holidays.length === 0 && pagination.totalItems === 0) return showToast('No holidays to export', 'error');
    setExportLoading(true);
    try {
      const response = await hrAPI.getHolidays({
        page: 1, limit: 99999, search: debouncedSearch, searchFields,
        filters: { ...(statusFilter !== 'all' && { status: statusFilter }), ...(typeFilter !== 'all' && { holiday_type: typeFilter }) },
      });
      const allData = response.data?.holidays || [];
      const headers = [
        'ID', 'Org ID', 'Name', 'Date', 'Type', 'Work Location', 'Status',
        'Is Paid', 'Is Recurring', 'Recurrence Type', 'Description',
        'Created By', 'Updated By', 'Created At', 'Updated At',
      ];
      const csvRows = allData.map((h) => [
        h.holiday_id || '', h.org_id || '', `"${(h.name || '').replace(/"/g, '""')}"`, h.date || '',
        h.holiday_type || '', h.work_location?.name || '', h.status || '',
        h.is_paid ? 'Yes' : 'No', h.is_recurring ? 'Yes' : 'No', h.recurrence_type || '',
        `"${(h.description || '').replace(/"/g, '""')}"`,
        h.created_by || '', h.updated_by || '',
        h.created_at ? new Date(h.created_at).toISOString() : '',
        h.updated_at ? new Date(h.updated_at).toISOString() : '',
      ]);
      const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `holidays_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${allData.length} holidays`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, holidays, pagination.totalItems, debouncedSearch, searchFields, statusFilter, typeFilter, showToast]);

  const fetchCalendarHolidays = useCallback(async (year, month) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const response = await hrAPI.getHolidays({
      page: 1,
      limit: 1000,
      search: '',
      searchFields: [],
      filters: {
        from: start.toISOString().split('T')[0],
        to: end.toISOString().split('T')[0],
      },
    });
    return response.data?.holidays || [];
  }, []);

  return (
    /* ✅ FIXED: h-full fits exactly inside <main>'s scroll container — no footer overlap */
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      {/* Toolbar — pinned */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage company holidays and observances</p></div>
        <div className="flex gap-1 mt-1 lg:mt-0">
          <button
            onClick={() => setView(view === 'calendar' ? 'table' : 'calendar')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${view === 'calendar' ? 'bg-primary-50 text-primary-700 border-primary-300' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
          >
            {view === 'calendar' ? <List className="w-3 h-3" /> : <CalendarIcon className="w-3 h-3" />}
            {view === 'calendar' ? 'Table View' : 'Calendar View'}
          </button>
          {canExport && view === 'table' && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}
          <button onClick={refreshData} disabled={refreshing} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {canCreate && (
            <button onClick={() => openHolidayModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium">
              <Plus className="w-2.5 h-2.5" /> New Holiday
            </button>
          )}
        </div>
      </div>

      {/* Card — fills remaining height */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {view === 'calendar' ? (
          <div className="flex-1 min-h-0 overflow-auto p-4">
            <Suspense fallback={<div className="text-sm text-gray-500">Loading calendar…</div>}>
              <HolidayCalendar
                refreshKey={calendarRefreshKey}
                showReminders={true}
                showDateDetails={true}
                onHolidayClick={(holidays) => showToast(`${holidays.length} holiday(s) on this date`, 'info')}
                fetchHolidays={fetchCalendarHolidays}
              />
            </Suspense>
          </div>
        ) : (
          <>
            {/* Card header — pinned */}
            <div className="flex-shrink-0 p-3 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleStatusChange(tab.id)}
                      className={`px-2 py-1 text-xs font-medium rounded-sm flex items-center gap-1 ${statusFilter === tab.id ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                    >
                      {tab.name}
                      <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${statusFilter === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                        }`}>{tab.count}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {canBulk && selectedHolidays.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                      <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="text-xs border border-primary-300 rounded px-1.5 py-0.5 bg-white">
                        <option value="">Bulk Actions</option>
                        {canUpdate && (
                          <>
                            <option value="active">Activate</option>
                            <option value="inactive">Deactivate</option>
                          </>
                        )}
                        {canDelete && <option value="delete">Delete</option>}
                      </select>
                      <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded text-xs disabled:opacity-50">Apply</button>
                      <span className="text-xs text-primary-700">{selectedHolidays.length} selected</span>
                    </div>
                  )}
                  <MultiSelectSearchFields selectedFields={searchFields} onFieldChange={setSearchFields} />
                  <select value={typeFilter} onChange={(e) => handleTypeChange(e.target.value)} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white">
                    <option value="all">All Types</option>
                    {holidayTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <select value={pagination.limit} onChange={(e) => handleLimitChange(e.target.value)} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white">
                    <option value="8">8 per page</option>
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <input type="text" placeholder="Search holidays..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-7 pr-2 py-1 border border-gray-300 rounded text-xs w-40" />
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="text-xs text-primary-600 hover:text-primary-800">Clear</button>
                  )}
                </div>
              </div>
            </div>

            {/* Table body — the ONLY scroll area */}
            <div className="flex-1 min-h-0 overflow-auto">
              {loading || refreshing ? (
                <div className="flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
              ) : error ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                    <h3 className="text-sm font-bold">Unable to Load</h3>
                    <p className="text-xs text-gray-600 mb-3">{error}</p>
                    <button onClick={refreshData} className="px-2 py-1 bg-primary-500 text-white rounded text-xs">Try Again</button>
                  </div>
                </div>
              ) : holidays.length > 0 ? (
                <table className="w-full min-w-max border-collapse">
                  <thead className="bg-indigo-50 border-b border-indigo-200 sticky top-0 z-10">
                    <tr>
                      {canBulk && (
                        <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase w-10">
                          <input type="checkbox" checked={selectedHolidays.length === holidays.length && holidays.length > 0} onChange={toggleSelectAll} className="rounded w-3 h-3" disabled={!canBulk} />
                        </th>
                      )}

                      {/* ✅ ACTIONS COLUMN — FIRST: View | Edit | Active/Inactive | Delete */}
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Actions</th>

                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">ID</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Org ID</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Name</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Date</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Type</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Work Location</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Status</th>
                      <th className="px-2 py-1 text-center text-xs font-medium text-indigo-700 uppercase">Paid</th>
                      <th className="px-2 py-1 text-center text-xs font-medium text-indigo-700 uppercase">Recurring</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Recurrence</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Description</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Created By</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Updated By</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Created At</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-indigo-700 uppercase">Updated At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {holidays.map((holiday, index) => {
                      const isCurrentlyInactive = holiday.status === 'inactive';
                      const isToggling = togglingStatusIds.has(holiday.id);

                      return (
                        <tr key={holiday.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {canBulk && (
                            <td className="px-2 py-1">
                              <input type="checkbox" checked={selectedHolidays.includes(holiday.id)} onChange={() => toggleHolidaySelection(holiday.id)} className="rounded w-3 h-3" />
                            </td>
                          )}

                          {/* ✅ ACTIONS: View | Edit | Active/Inactive | Delete */}
                          <td className="px-2 py-1 whitespace-nowrap">
                            <div className="flex items-center gap-0.5">
                              {/* VIEW */}
                              <button
                                onClick={() => openHolidayModal(holiday, true)}
                                title="View Details"
                                className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                              </button>

                              {/* EDIT */}
                              {canUpdate && (
                                <button
                                  onClick={() => openHolidayModal(holiday, false)}
                                  title="Edit"
                                  className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}

                              {/* ACTIVE / INACTIVE TOGGLE */}
                              {canUpdate && (
                                <button
                                  onClick={() => handleQuickStatusToggle(holiday)}
                                  disabled={isToggling}
                                  title={isCurrentlyInactive ? 'Activate' : 'Deactivate'}
                                  className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                                    isToggling ? 'opacity-50 cursor-wait' :
                                    isCurrentlyInactive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                                  }`}
                                >
                                  {isToggling ? <Loader className="w-3 h-3 animate-spin" /> :
                                   isCurrentlyInactive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                                </button>
                              )}

                              {/* DELETE */}
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteHoliday(holiday.id)}
                                  title="Delete"
                                  className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500">#{holiday.id}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-gray-600">{dash(holiday.org_id)}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900 max-w-[220px] truncate" title={holiday.name}>{dash(holiday.name)}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">{formatDate(holiday.date)}</td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(holiday.type)}`}>
                              {holidayTypes.find((t) => t.value === holiday.type)?.label || holiday.type}
                            </span>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700 max-w-[160px] truncate" title={holiday.location || 'All'}>
                            {holiday.location || 'All'}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            {canUpdate ? (
                              <select
                                value={holiday.status || 'active'}
                                onChange={(e) => handleStatusUpdate(holiday.id, e.target.value)}
                                disabled={isToggling}
                                className={`text-xs font-medium rounded-full border-0 focus:ring-1 px-1.5 py-0.5 bg-gray-50 ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                              >
                                {statusOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <StatusBadge status={holiday.status} />
                            )}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700 text-center">{holiday.is_paid ? 'Yes' : 'No'}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700 text-center">{holiday.is_recurring ? 'Yes' : 'No'}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">{dash(holiday.recurrence_type)}</td>
                          <td className="px-2 py-1 text-xs text-gray-600 max-w-[260px] truncate" title={holiday.description || ''}>
                            {dash(holiday.description)}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-600">{dash(holiday.created_by)}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-600">{dash(holiday.updated_by)}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-600">{formatDateTime(holiday.created_at)}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-600">{formatDateTime(holiday.updated_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-sm font-medium">No holidays found</h3>
                    <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No matches. Adjust filters.' : 'Create your first holiday.'}</p>
                    {canCreate && (
                      <button onClick={() => openHolidayModal()} className="bg-primary-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto">
                        <Plus className="w-2.5 h-2.5" /> Create Holiday
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pagination footer — pinned */}
            {pagination.totalPages > 1 && (
              <div className="flex-shrink-0 border-t bg-white px-3 py-2">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of{' '}
                    {pagination.totalItems}
                  </span>
                  <div className="flex items-center space-x-0.5">
                    <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="p-0.5 border rounded disabled:opacity-50"><ChevronsLeft className="w-3 h-3" /></button>
                    <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-0.5 border rounded disabled:opacity-50"><ChevronLeft className="w-3 h-3" /></button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let p = pagination.totalPages <= 5
                        ? i + 1
                        : (pagination.page <= 3
                          ? i + 1
                          : (pagination.page >= pagination.totalPages - 2
                            ? pagination.totalPages - 4 + i
                            : pagination.page - 2 + i));
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-6 h-6 text-xs rounded border transition-colors ${pagination.page === p
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="p-0.5 border rounded disabled:opacity-50"><ChevronRight className="w-3 h-3" /></button>
                    <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="p-0.5 border rounded disabled:opacity-50"><ChevronsRight className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Suspense fallback={null}>
        {showHolidayModal && (
          <HolidayModal
            show={showHolidayModal}
            holiday={editingHoliday}
            onClose={closeHolidayModal}
            onSaved={handleHolidaySaved}
            readOnly={isReadOnly}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {confirmation.show && (
          <ConfirmationModal
            show={confirmation.show}
            title={confirmation.title}
            message={confirmation.message}
            type={confirmation.type}
            onConfirm={handleConfirm}
            onCancel={hideConfirmation}
          />
        )}
      </Suspense>
    </div>
  );
};

export default HolidaysManagement;                   