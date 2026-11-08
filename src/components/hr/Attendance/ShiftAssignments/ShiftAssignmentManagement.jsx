import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const ShiftAssignmentModal = lazy(() => import('./ShiftAssignmentModal'));
const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));
const ShiftSelectionModal = lazy(() => import('../Shifts/ShiftSelectionModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const StatusBadge = memo(({ status }) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status || 'active'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const AssignmentTypeBadge = memo(({ type }) => {
  const colors = {
    regular: 'bg-blue-100 text-blue-800',
    temporary: 'bg-yellow-100 text-yellow-800',
    replacement: 'bg-purple-100 text-purple-800',
    rotational: 'bg-indigo-100 text-indigo-800',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
      {type || 'regular'}
    </span>
  );
});
AssignmentTypeBadge.displayName = 'AssignmentTypeBadge';

const AssignmentRow = memo(({ record, canBulk, selected, toggleSelection, canUpdate, canDelete, openModal, handleDelete }) => {
  const isSelected = selected.includes(record.shift_assign_id);
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '—';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-2 py-1 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(record.shift_assign_id)} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
        </td>
      )}
      <td className="px-2 py-1 whitespace-nowrap text-gray-500">{record.shift_assign_id}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-900">
        {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : 'N/A'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-900">
        {record.shift?.name || record.shift_id || 'N/A'}
        {record.shift?.code && <span className="text-gray-500 text-[9px] ml-1">({record.shift.code})</span>}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700">{formatDate(record.date)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700">{record.effective_from ? formatDate(record.effective_from) : '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700">{record.effective_to ? formatDate(record.effective_to) : '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap"><AssignmentTypeBadge type={record.assignment_type} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 max-w-20 truncate" title={record.reason || ''}>
        {record.reason || '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap"><StatusBadge status={record.status} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500">{record.approved_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{record.approved_at ? formatDate(record.approved_at) : '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500">{record.created_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500">{record.updated_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{new Date(record.createdAt).toLocaleDateString()}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{new Date(record.updatedAt).toLocaleDateString()}</td>
      <td className="px-2 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-1">
          {canUpdate && <button onClick={() => openModal(record)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"><Edit className="w-3 h-3" /></button>}
          {canDelete && <button onClick={() => handleDelete(record.shift_assign_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </td>
    </tr>
  );
});
AssignmentRow.displayName = 'AssignmentRow';

const ShiftAssignmentManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'shiftassignment', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'shiftassignment', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'shiftassignment', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'shiftassignment', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'shiftassignment', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'shiftassignment', 'A4') || canManage, [hasPermission, canManage]);

  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShiftFilterModal, setShowShiftFilterModal] = useState(false);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState(null);
  const [showEmployeeFilterModal, setShowEmployeeFilterModal] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    shift_id: 'all',
    emp_id: 'all',
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
    show: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
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
        payload.searchFields = ['reason', 'employee_name', 'shift_name'];
      }
      const filterConditions = {};
      if (filters.status !== 'all') filterConditions.status = filters.status;
      if (filters.shift_id !== 'all') filterConditions.shift_id = parseInt(filters.shift_id);
      if (filters.emp_id !== 'all') filterConditions.emp_id = parseInt(filters.emp_id);
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;
      const response = await hrAPI.getShiftAssignmentsAll(payload);
      if (response.data?.success) {
        const { rows, counts, pagination } = response.data;
        setRecords(rows || []);
        setCounts(counts || { total: 0, byStatus: {} });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: pagination?.totalItems || 0,
          totalPages: pagination?.totalPages || 0,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch shift assignments');
      }
    } catch (err) {
      setError('Failed to load shift assignments. Please try again.');
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
      const response = await hrAPI.getShiftAssignmentsAll({ limit: 10000, sortBy: 'created_at', sortOrder: 'DESC' });
      const data = response.data?.rows || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = [
        'ID', 'Employee', 'Shift', 'Date', 'Effective From', 'Effective To',
        'Assignment Type', 'Reason', 'Status', 'Approved By', 'Approved At',
        'Created By', 'Updated By', 'Created At', 'Updated At'
      ];
      const rows = data.map(r => [
        r.shift_assign_id,
        r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'N/A',
        r.shift?.name || r.shift_id || 'N/A',
        r.date || 'N/A',
        r.effective_from || 'N/A',
        r.effective_to || 'N/A',
        r.assignment_type || 'regular',
        r.reason || '',
        r.status || 'active',
        r.approved_by || 'N/A',
        r.approved_at || 'N/A',
        r.created_by || 'N/A',
        r.updated_by || 'N/A',
        new Date(r.createdAt).toISOString(),
        new Date(r.updatedAt).toISOString(),
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `shift_assignments_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleAssignments = [
    ['emp_id', 'shift_id', 'date', 'effective_from', 'effective_to', 'assignment_type', 'status', 'reason'],
    ['1', '2', '2025-03-15', '2025-03-15', '2025-03-16', 'regular', 'active', 'Normal shift'],
    ['3', '5', '2025-03-16', '2025-03-16', '2025-03-16', 'temporary', 'active', 'Cover shift'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
        if (!row.shift_id) throw new Error(`Row ${i+1}: shift_id required`);
        if (!row.date) throw new Error(`Row ${i+1}: date required`);
        return {
          emp_id: parseInt(row.emp_id),
          shift_id: parseInt(row.shift_id),
          date: row.date,
          effective_from: row.effective_from || null,
          effective_to: row.effective_to || null,
          assignment_type: row.assignment_type || 'regular',
          status: row.status || 'active',
          reason: row.reason || '',
        };
      });
      await Promise.all(recordsToImport.map(record => hrAPI.createShiftAssignment(record)));
      showToast(`Imported ${recordsToImport.length} assignments`, 'success');
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
    setSelected(selected.length === records.length ? [] : records.map(r => r.shift_assign_id));
  }, [canBulk, selected, records]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selected.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Assignments',
          `Are you sure you want to delete ${selected.length} assignment(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selected.map(id => hrAPI.deleteShiftAssignment(id)));
            setSelected([]);
            setBulkAction('');
            fetchRecords();
            showToast(`Deleted ${selected.length} assignments`, 'success');
          }
        );
      } else {
        await Promise.all(selected.map(id => hrAPI.updateShiftAssignment(id, { status: bulkAction })));
        setSelected([]);
        setBulkAction('');
        fetchRecords();
        showToast(`Updated ${selected.length} assignments to "${bulkAction}"`, 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selected, fetchRecords, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const record = records.find(r => r.shift_assign_id === id);
    showConfirmation(
      'Delete Assignment',
      `Delete assignment for ${record?.employee?.first_name || 'Unknown'}? This cannot be undone.`,
      'delete',
      async () => {
        await hrAPI.deleteShiftAssignment(id);
        fetchRecords();
        showToast('Assignment deleted', 'success');
      }
    );
  }, [canDelete, records, showToast, fetchRecords]);

  const openModal = useCallback((record = null) => {
    if (record && !canUpdate) return showToast('No permission to edit', 'error');
    if (!record && !canCreate) return showToast('No permission to create', 'error');
    setEditingRecord(record);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingRecord(null);
  }, []);

  const handleRecordSaved = useCallback(() => {
    closeModal();
    fetchRecords();
    showToast('Assignment saved successfully!', 'success');
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

  const handleShiftFilterSelect = useCallback((shift) => {
    const shiftId = shift.id || shift.shift_id;
    setSelectedShiftFilter(shift);
    setFilters(prev => ({ ...prev, shift_id: shiftId, page: 1 }));
    setShowShiftFilterModal(false);
  }, []);

  const handleClearShiftFilter = useCallback(() => {
    setSelectedShiftFilter(null);
    setFilters(prev => ({ ...prev, shift_id: 'all', page: 1 }));
  }, []);

  const handleEmployeeFilterSelect = useCallback((employee) => {
    const empId = employee.emp_id;
    setSelectedEmployeeFilter(employee);
    setFilters(prev => ({ ...prev, emp_id: empId, page: 1 }));
    setShowEmployeeFilterModal(false);
  }, []);

  const handleClearEmployeeFilter = useCallback(() => {
    setSelectedEmployeeFilter(null);
    setFilters(prev => ({ ...prev, emp_id: 'all', page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      shift_id: 'all',
      emp_id: 'all',
      page: 1,
      limit: 15,
    });
    setSelectedShiftFilter(null);
    setSelectedEmployeeFilter(null);
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.shift_id !== 'all' ||
      filters.emp_id !== 'all'
    );
  }, [filters]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    const statusCounts = counts.byStatus || {};
    return [
      { id: 'all', name: 'All', count: allCount, icon: Filter },
      { id: 'active', name: 'Active', count: statusCounts.active || 0, icon: CheckCircle2 },
      { id: 'inactive', name: 'Inactive', count: statusCounts.inactive || 0, icon: AlertCircle },
      { id: 'cancelled', name: 'Cancelled', count: statusCounts.cancelled || 0, icon: X },
    ];
  }, [counts]);

  const getVisiblePages = useCallback((currentPage, totalPages) => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, []);

  return (
    <div className="space-y-2.5 p-2.5">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
        <p className="text-[10px] text-gray-600">Manage shift assignments</p>
        <div className="flex gap-1.5">
          {canImport && (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const csvContent = sampleAssignments.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'shift_assignments_import_template.csv';
                  link.click();
                  showToast('Sample CSV downloaded', 'info');
                }}
                className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-3 h-3" /> Sample
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50">
                <Upload className="w-3 h-3" /> Import
              </button>
            </div>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-3 h-3" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded font-medium text-[10px] shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New Assignment
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-2 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleFilterChange('status', tab.id)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${
                      (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${(tab.id === 'all' && filters.status === 'all') || filters.status === tab.id ? 'text-primary-600' : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-[9px] rounded-full min-w-3 flex items-center justify-center ${
                      (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id
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
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[9px] border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk</option>
                    <option value="active">Set Active</option>
                    <option value="inactive">Set Inactive</option>
                    <option value="cancelled">Set Cancelled</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-2 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[9px] font-medium">Apply</button>
                  <span className="text-[9px] text-primary-700 font-medium">{selected.length} sel</span>
                </div>
              )}

              <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="all">-- All Status --</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowShiftFilterModal(true)}
                  className={`px-2 py-0.5 text-[10px] border rounded focus:ring-1 focus:ring-primary-500 ${
                    selectedShiftFilter ? 'text-gray-900 border-gray-300' : 'text-gray-500 border-gray-300'
                  } hover:bg-gray-50`}
                >
                  {selectedShiftFilter ? selectedShiftFilter.name : '-- All Shifts --'}
                </button>
                {selectedShiftFilter && (
                  <button
                    type="button"
                    onClick={handleClearShiftFilter}
                    className="p-0.5 text-gray-400 hover:text-red-600 rounded"
                    title="Clear shift filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowEmployeeFilterModal(true)}
                  className={`px-2 py-0.5 text-[10px] border rounded focus:ring-1 focus:ring-primary-500 ${
                    selectedEmployeeFilter ? 'text-gray-900 border-gray-300' : 'text-gray-500 border-gray-300'
                  } hover:bg-gray-50`}
                >
                  {selectedEmployeeFilter ? `${selectedEmployeeFilter.first_name} ${selectedEmployeeFilter.last_name}` : '-- All Employees --'}
                </button>
                {selectedEmployeeFilter && (
                  <button
                    type="button"
                    onClick={handleClearEmployeeFilter}
                    className="p-0.5 text-gray-400 hover:text-red-600 rounded"
                    title="Clear employee filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => handleSearch(e.target.value)} className="pl-6 pr-2 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-40 text-[10px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center"><p className="text-xs text-red-600">{error}</p><button onClick={fetchRecords} className="mt-1 px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Retry</button></div>
            </div>
          ) : records.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max text-[10px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && (
                      <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-6 sticky left-0 bg-gray-50 z-20">
                        <input type="checkbox" checked={selected.length === records.length && records.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
                      </th>
                    )}
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Effective To</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Approved At</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">CBy</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">UBy</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(record => (
                    <AssignmentRow
                      key={record.shift_assign_id}
                      record={record}
                      canBulk={canBulk}
                      selected={selected}
                      toggleSelection={toggleSelection}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      openModal={openModal}
                      handleDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center"><p className="text-xs text-gray-600">No shift assignments found.</p></div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-1.5 flex flex-col sm:flex-row items-center justify-between gap-1">
              <div className="text-[9px] text-gray-600">
                Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}
              </div>
              <div className="flex items-center space-x-0.5">
                <button type="button" onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button type="button" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {getVisiblePages(filters.page, pagination.totalPages).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`w-5 h-5 text-[9px] rounded border transition-colors ${filters.page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
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
      </div>

      <Suspense fallback={null}>
        {showShiftFilterModal && (
          <ShiftSelectionModal
            show={showShiftFilterModal}
            onClose={() => setShowShiftFilterModal(false)}
            onSelect={handleShiftFilterSelect}
            selectedShiftId={selectedShiftFilter?.id || selectedShiftFilter?.shift_id || null}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showEmployeeFilterModal && (
          <EmployeeSelectionModal
            show={showEmployeeFilterModal}
            onClose={() => setShowEmployeeFilterModal(false)}
            onSelect={handleEmployeeFilterSelect}
            selectedEmployeeId={selectedEmployeeFilter?.emp_id || null}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showModal && (
          <ShiftAssignmentModal
            show={showModal}
            record={editingRecord}
            onClose={closeModal}
            onSaved={handleRecordSaved}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Shift Assignments"
            requiredHeaders={['emp_id', 'shift_id', 'date']}
            sampleRows={sampleAssignments}
            formatDescription="Required: emp_id, shift_id, date. Optional: effective_from, effective_to, assignment_type, status, reason."
            validateRow={(row, i) => {
              if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
              if (!row.shift_id) throw new Error(`Row ${i+1}: shift_id required`);
              if (!row.date) throw new Error(`Row ${i+1}: date required`);
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

export default ShiftAssignmentManagement;
