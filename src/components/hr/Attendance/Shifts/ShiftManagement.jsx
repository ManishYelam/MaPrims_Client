import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle2, AlertCircle, FileText, Power, PowerOff, Loader,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const ShiftModal = lazy(() => import('./ShiftModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const BooleanBadge = memo(({ value }) => (
  <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {value ? 'Yes' : 'No'}
  </span>
));
BooleanBadge.displayName = 'BooleanBadge';

const StatusBadge = memo(({ status }) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    archived: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status || 'unknown'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const ShiftTypeBadge = memo(({ type }) => {
  const colors = {
    general: 'bg-blue-100 text-blue-800',
    morning: 'bg-yellow-100 text-yellow-800',
    evening: 'bg-orange-100 text-orange-800',
    night: 'bg-purple-100 text-purple-800',
    rotational: 'bg-indigo-100 text-indigo-800',
    flexible: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
      {type || 'general'}
    </span>
  );
});
ShiftTypeBadge.displayName = 'ShiftTypeBadge';

const ShiftRow = memo(({
  record, canBulk, selected, toggleSelection,
  canUpdate, canDelete, openModal, handleDelete,
  handleQuickStatusToggle, togglingStatusIds,
}) => {
  const isSelected = selected.includes(record.shift_id);
  const formatTime = (time) => time ? time.slice(0, 5) : '—';
  const isActive = record.status === 'active';
  const isToggling = togglingStatusIds?.has(record.shift_id);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-2 py-1 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(record.shift_id)} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
        </td>
      )}

      {/* ✅ ACTIONS COLUMN — FIRST: View | Edit | Active/Inactive | Delete */}
      <td className="px-2 py-1 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          {/* VIEW */}
          <button
            onClick={() => openModal(record, true)}
            title="View Details"
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-3 h-3" />
          </button>

          {/* EDIT */}
          {canUpdate && (
            <button
              onClick={() => openModal(record, false)}
              title="Edit"
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}

          {/* ACTIVE / INACTIVE TOGGLE */}
          {canUpdate && (
            <button
              onClick={() => handleQuickStatusToggle(record)}
              disabled={isToggling}
              title={isActive ? 'Deactivate' : 'Activate'}
              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                isToggling ? 'opacity-50 cursor-wait' :
                isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              {isToggling ? <Loader className="w-3 h-3 animate-spin" /> :
               isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
            </button>
          )}

          {/* DELETE */}
          {canDelete && (
            <button
              onClick={() => handleDelete(record.shift_id)}
              title="Delete"
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.shift_id}</td>
      <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 text-xs">{record.name}</td>
      <td className="px-2 py-1 whitespace-nowrap font-mono text-gray-700 text-xs">{record.code || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{formatTime(record.start_time)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{formatTime(record.end_time)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{record.break_duration || 0}m</td>
      <td className="px-2 py-1 whitespace-nowrap"><ShiftTypeBadge type={record.shift_type} /></td>
      <td className="px-2 py-1 whitespace-nowrap"><BooleanBadge value={record.is_night_shift} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-xs">{record.standard_work_hours ?? 8.0}h</td>
      <td className="px-2 py-1 whitespace-nowrap"><BooleanBadge value={record.overtime_allowed} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-xs">{record.overtime_after_hours ?? 8.0}h</td>
      <td className="px-2 py-1 whitespace-nowrap text-xs">{record.late_grace_minutes || 10}m</td>
      <td className="px-2 py-1 whitespace-nowrap text-xs">{record.minimum_half_day_hours ?? 4.0}h</td>
      <td className="px-2 py-1 whitespace-nowrap text-xs">{record.minimum_full_day_hours ?? 8.0}h</td>
      <td className="px-2 py-1 whitespace-nowrap max-w-24 truncate text-xs" title={record.weekly_offs?.join(', ') || ''}>{record.weekly_offs?.join(', ') || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap"><StatusBadge status={record.status} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.created_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.updated_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{new Date(record.createdAt).toLocaleDateString()}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{new Date(record.updatedAt).toLocaleDateString()}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{record.deletedAt ? new Date(record.deletedAt).toLocaleDateString() : '—'}</td>
    </tr>
  );
});
ShiftRow.displayName = 'ShiftRow';

const ShiftManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'shift', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'shift', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'shift', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'shift', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'shift', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'shift', 'A4') || canManage, [hasPermission, canManage]);

  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byStatus: {}, byType: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    shift_type: 'all',
    is_night_shift: 'all',
    page: 1,
    limit: 15,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalItems: 0,
    totalPages: 0,
  });

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        page: filters.page,
        limit: filters.limit,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };
      if (filters.search.trim()) {
        payload.search = filters.search.trim();
        payload.searchFields = ['name', 'code', 'description'];
      }
      const filterConditions = {};
      if (filters.status !== 'all') filterConditions.status = filters.status;
      if (filters.shift_type !== 'all') filterConditions.shift_type = filters.shift_type;
      if (filters.is_night_shift !== 'all') filterConditions.is_night_shift = filters.is_night_shift === 'true';
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;
      const response = await hrAPI.getShiftsAll(payload);
      if (response.data?.success) {
        const { rows, counts, pagination } = response.data;
        setRecords(rows || []);
        setCounts(counts || { total: 0, byStatus: {}, byType: {} });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: pagination?.totalItems || 0,
          totalPages: pagination?.totalPages || 0,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch shifts');
      }
    } catch (err) {
      setError('Failed to load shifts. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRecords(), 350);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    try {
      setExportLoading(true);
      const response = await hrAPI.getShiftsAll({ limit: 10000, sortBy: 'created_at', sortOrder: 'DESC' });
      const data = response.data?.rows || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = [
        'ID', 'Name', 'Code', 'Description', 'Start Time', 'End Time',
        'Break Duration', 'Shift Type', 'Night Shift', 'Standard Hours',
        'Overtime Allowed', 'Overtime After Hours', 'Late Grace (min)',
        'Early Exit Grace (min)', 'Min Half Day Hours', 'Min Full Day Hours',
        'Weekly Offs', 'Status', 'Created By', 'Updated By', 'Created At', 'Updated At'
      ];
      const rows = data.map(r => [
        r.shift_id, r.name || 'N/A', r.code || 'N/A', r.description || '',
        r.start_time || 'N/A', r.end_time || 'N/A', r.break_duration || 0,
        r.shift_type || 'general', r.is_night_shift ? 'Yes' : 'No',
        r.standard_work_hours || 0, r.overtime_allowed ? 'Yes' : 'No',
        r.overtime_after_hours || 0, r.late_grace_minutes || 0,
        r.early_exit_grace_minutes || 0, r.minimum_half_day_hours || 0,
        r.minimum_full_day_hours || 0, (r.weekly_offs || []).join(';'),
        r.status || 'active', r.created_by || 'N/A', r.updated_by || 'N/A',
        new Date(r.createdAt).toISOString(), new Date(r.updatedAt).toISOString(),
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `shifts_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleShifts = [
    ['name', 'code', 'start_time', 'end_time', 'shift_type', 'is_night_shift', 'standard_work_hours', 'status', 'weekly_offs'],
    ['Morning', 'MOR', '06:00', '14:00', 'morning', 'false', '8', 'active', 'Sunday'],
    ['Night', 'NIG', '22:00', '06:00', 'night', 'true', '8', 'active', 'Saturday;Sunday'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.name) throw new Error(`Row ${i + 1}: name required`);
        if (!row.start_time) throw new Error(`Row ${i + 1}: start_time required`);
        if (!row.end_time) throw new Error(`Row ${i + 1}: end_time required`);
        return {
          name: row.name,
          code: row.code || null,
          description: row.description || '',
          start_time: row.start_time,
          end_time: row.end_time,
          break_duration: parseInt(row.break_duration) || 60,
          shift_type: row.shift_type || 'general',
          is_night_shift: row.is_night_shift === 'true',
          standard_work_hours: parseFloat(row.standard_work_hours) || 8.0,
          overtime_allowed: row.overtime_allowed !== 'false',
          status: row.status || 'active',
          weekly_offs: row.weekly_offs ? row.weekly_offs.split(';') : ['Sunday'],
        };
      });
      await Promise.all(recordsToImport.map(record => hrAPI.createShift(record)));
      showToast(`Imported ${recordsToImport.length} shifts`, 'success');
      setShowImportModal(false);
      fetchRecords();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [canImport, showToast, fetchRecords]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelected(selected.length === records.length ? [] : records.map(r => r.shift_id));
  }, [canBulk, selected, records]);

  /* ✅ OPTIMISTIC bulk action — no full refresh */
  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selected.length) return;
    const ids = [...selected];
    const snapshot = records;
    const snapshotCounts = counts;

    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Shifts',
          `Are you sure you want to delete ${ids.length} shift(s)?`,
          'bulkDelete',
          async () => {
            // Optimistic remove
            setRecords(prev => prev.filter(r => !ids.includes(r.shift_id)));
            setCounts(prev => ({
              ...prev,
              total: Math.max(0, (prev.total || 0) - ids.length),
            }));
            setSelected([]);
            setBulkAction('');
            try {
              await Promise.all(ids.map(id => hrAPI.deleteShift(id)));
              showToast(`Deleted ${ids.length} shifts`, 'success');
            } catch (err) {
              setRecords(snapshot);
              setCounts(snapshotCounts);
              showToast('Bulk delete failed', 'error');
            }
          }
        );
      } else {
        // Optimistic status change
        setRecords(prev => prev.map(r => ids.includes(r.shift_id) ? { ...r, status: bulkAction } : r));
        setCounts(prev => {
          const next = { ...prev, byStatus: { ...(prev.byStatus || {}) } };
          ids.forEach(id => {
            const old = snapshot.find(r => r.shift_id === id);
            if (old?.status && next.byStatus[old.status] != null) {
              next.byStatus[old.status] = Math.max(0, next.byStatus[old.status] - 1);
            }
            next.byStatus[bulkAction] = (next.byStatus[bulkAction] || 0) + 1;
          });
          return next;
        });
        setSelected([]);
        setBulkAction('');
        try {
          await Promise.all(ids.map(id => hrAPI.updateShift(id, { status: bulkAction })));
          showToast(`Updated ${ids.length} shifts to "${bulkAction}"`, 'success');
        } catch (err) {
          setRecords(snapshot);
          setCounts(snapshotCounts);
          showToast('Bulk update failed', 'error');
        }
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selected, records, counts, showToast]);

  /* ✅ OPTIMISTIC delete — no full refresh */
  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const record = records.find(r => r.shift_id === id);
    showConfirmation(
      'Delete Shift',
      `Delete shift "${record?.name}"? This cannot be undone.`,
      'delete',
      async () => {
        const snapshot = records;
        const snapshotCounts = counts;

        // Optimistic remove
        setRecords(prev => prev.filter(r => r.shift_id !== id));
        setCounts(prev => {
          const next = { ...prev, byStatus: { ...(prev.byStatus || {}) } };
          next.total = Math.max(0, (next.total || 0) - 1);
          if (record?.status && next.byStatus[record.status] != null) {
            next.byStatus[record.status] = Math.max(0, next.byStatus[record.status] - 1);
          }
          return next;
        });

        try {
          await hrAPI.deleteShift(id);
          showToast('Shift deleted', 'success');
        } catch (err) {
          setRecords(snapshot);
          setCounts(snapshotCounts);
          showToast('Failed to delete', 'error');
        }
      }
    );
  }, [canDelete, records, counts, showToast]);

  /* ✅ OPTIMISTIC quick status toggle — no full refresh */
  const handleQuickStatusToggle = useCallback(async (record) => {
    if (!canUpdate) return showToast('No permission to update status', 'error');
    const id = record.shift_id;
    const currentStatus = record.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    setRecords(prev => prev.map(r => r.shift_id === id ? { ...r, status: nextStatus } : r));
    setCounts(prev => {
      const next = { ...prev, byStatus: { ...(prev.byStatus || {}) } };
      if (next.byStatus[currentStatus] != null) next.byStatus[currentStatus] = Math.max(0, next.byStatus[currentStatus] - 1);
      next.byStatus[nextStatus] = (next.byStatus[nextStatus] || 0) + 1;
      return next;
    });

    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await hrAPI.updateShift(id, { status: nextStatus });
      showToast(`Shift ${nextStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      setRecords(prev => prev.map(r => r.shift_id === id ? { ...r, status: currentStatus } : r));
      setCounts(prev => {
        const next = { ...prev, byStatus: { ...(prev.byStatus || {}) } };
        if (next.byStatus[nextStatus] != null) next.byStatus[nextStatus] = Math.max(0, next.byStatus[nextStatus] - 1);
        next.byStatus[currentStatus] = (next.byStatus[currentStatus] || 0) + 1;
        return next;
      });
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [canUpdate, showToast]);

  /* ✅ View / Edit support */
  const openModal = useCallback((record = null, readOnlyMode = false) => {
    if (record && !canUpdate && !readOnlyMode) return showToast('No permission to edit', 'error');
    if (!record && !canCreate) return showToast('No permission to create', 'error');
    setEditingRecord(record);
    setIsReadOnly(readOnlyMode);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingRecord(null);
    setIsReadOnly(false);
  }, []);

  const handleRecordSaved = useCallback(() => {
    closeModal();
    fetchRecords();
    showToast('Shift saved successfully!', 'success');
  }, [closeModal, fetchRecords, showToast]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);

  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);

  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleSearch = useCallback((val) => setFilters(prev => ({ ...prev, search: val, page: 1 })), []);
  const handleFilterChange = useCallback((field, val) => setFilters(prev => ({ ...prev, [field]: val, page: 1 })), []);
  const handleLimitChange = useCallback((val) => setFilters(prev => ({ ...prev, limit: parseInt(val), page: 1 })), []);
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) setFilters(prev => ({ ...prev, page: newPage }));
  }, [pagination.totalPages]);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', shift_type: 'all', is_night_shift: 'all', page: 1, limit: 15 });
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => (
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.shift_type !== 'all' ||
    filters.is_night_shift !== 'all'
  ), [filters]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    const statusCounts = counts.byStatus || {};
    return [
      { id: 'all', name: 'All', count: allCount, icon: Filter },
      { id: 'active', name: 'Active', count: statusCounts.active || 0, icon: CheckCircle2 },
      { id: 'inactive', name: 'Inactive', count: statusCounts.inactive || 0, icon: AlertCircle },
    ];
  }, [counts]);

  const getVisiblePages = useCallback((currentPage, totalPages) => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, []);

  return (
    /* ✅ FIXED: h-full fits inside <main>'s scroll container — no footer overlap */
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      {/* Toolbar — pinned */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
        <p className="text-xs text-gray-600">Manage work shifts</p>
        <div className="flex gap-1.5">
          {canImport && (
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  const csvContent = sampleShifts.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'shifts_import_template.csv';
                  link.click();
                  showToast('Sample CSV downloaded', 'info');
                }}
                className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-3 h-3" /> Sample
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <Upload className="w-3 h-3" /> Import
              </button>
            </div>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-3 h-3" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded font-medium text-xs shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New Shift
            </button>
          )}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Card header — pinned */}
        <div className="flex-shrink-0 p-2 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleFilterChange('status', tab.id)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${active
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                  >
                    <Icon className={`w-3 h-3 ${active ? 'text-primary-600' : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-[9px] rounded-full min-w-3 flex items-center justify-center ${active
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-200 text-gray-700'
                      }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {canBulk && selected.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[10px] border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk</option>
                    <option value="active">Set Active</option>
                    <option value="inactive">Set Inactive</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[10px] font-medium">Apply</button>
                  <span className="text-[10px] text-primary-700 font-medium">{selected.length} sel</span>
                </div>
              )}

              <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="all">-- All Status --</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>

              <select value={filters.shift_type} onChange={e => handleFilterChange('shift_type', e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="all">-- All Types --</option>
                <option value="general">General</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="rotational">Rotational</option>
                <option value="flexible">Flexible</option>
              </select>

                            <select value={filters.is_night_shift} onChange={e => handleFilterChange('is_night_shift', e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="all">-- Night (Yes/No) --</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>

              <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>

              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search shifts..." value={filters.search} onChange={e => handleSearch(e.target.value)} className="pl-6 pr-2 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-40 text-[10px]" />
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[10px] text-primary-600 hover:text-primary-800">Clear</button>
              )}
            </div>
          </div>
        </div>

        {/* Table body — the ONLY scroll area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center p-6">
              <div className="text-center"><p className="text-sm text-red-600">{error}</p><button onClick={fetchRecords} className="mt-2 px-3 py-1 bg-primary-600 text-white rounded text-xs">Retry</button></div>
            </div>
          ) : records.length > 0 ? (
            <table className="w-full min-w-max text-[10px]">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-6 sticky left-0 bg-gray-50 z-20">
                      <input type="checkbox" checked={selected.length === records.length && records.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
                    </th>
                  )}

                  {/* ✅ ACTIONS COLUMN — FIRST */}
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Actions</th>

                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">ID</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Name</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Code</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Start</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">End</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Break</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Type</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Night</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Std Hrs</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Overtime</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">OT After</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Grace</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Min Half</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Min Full</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Weekly Offs</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">CBy</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">UBy</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Created</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Updated</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Deleted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map(record => (
                  <ShiftRow
                    key={record.shift_id}
                    record={record}
                    canBulk={canBulk}
                    selected={selected}
                    toggleSelection={toggleSelection}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    openModal={openModal}
                    handleDelete={handleDelete}
                    handleQuickStatusToggle={handleQuickStatusToggle}
                    togglingStatusIds={togglingStatusIds}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center"><p className="text-sm text-gray-600">No shifts found.</p></div>
            </div>
          )}
        </div>

        {/* Pagination footer — pinned */}
        {pagination.totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-2 flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <div className="text-[10px] text-gray-600">Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}</div>
            <div className="flex items-center space-x-0.5">
              <button type="button" onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
              <button type="button" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
              {getVisiblePages(filters.page, pagination.totalPages).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  className={`w-6 h-6 text-[10px] rounded border transition-colors ${filters.page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                >
                  {p}
                </button>
              ))}
              <button type="button" onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
              <button type="button" onClick={() => handlePageChange(pagination.totalPages)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showModal && (
          <ShiftModal
            show={showModal}
            record={editingRecord}
            onClose={closeModal}
            onSaved={handleRecordSaved}
            readOnly={isReadOnly}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Shifts"
            requiredHeaders={['name', 'start_time', 'end_time']}
            sampleRows={sampleShifts}
            formatDescription="Required: name, start_time, end_time. Optional: shift_type, code, break_duration, etc."
            validateRow={(row, i) => {
              if (!row.name) throw new Error(`Row ${i + 1}: name required`);
              if (!row.start_time) throw new Error(`Row ${i + 1}: start_time required`);
              if (!row.end_time) throw new Error(`Row ${i + 1}: end_time required`);
            }}
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

export default ShiftManagement;