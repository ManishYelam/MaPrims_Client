import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, Calendar, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveBalanceModal = lazy(() => import('./LeaveBalanceModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const BooleanBadge = memo(({ value }) => (
  <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {value ? 'Yes' : 'No'}
  </span>
));
BooleanBadge.displayName = 'BooleanBadge';

const StatusBadge = memo(({ status }) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status || 'unknown'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const ColorSwatch = memo(({ color }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-full border border-gray-300" style={{ backgroundColor: color || '#ccc' }} />
));
ColorSwatch.displayName = 'ColorSwatch';

const BalanceRow = memo(({ record, canBulk, selected, toggleSelection, canUpdate, canDelete, openModal, handleDelete }) => {
  const isSelected = selected.includes(record.leave_balance_id);

  const balance = record.balance ?? 0;
  const balanceColor = balance > 0 ? 'text-green-700' : balance < 0 ? 'text-red-700' : 'text-yellow-700';

  const expiryDate = record.expiry_date;
  let expiryColor = 'text-gray-500';
  let expiryLabel = expiryDate || '—';
  if (expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) expiryColor = 'text-red-600 font-medium';
    else if (diffDays <= 7) expiryColor = 'text-orange-600 font-medium';
    else expiryColor = 'text-green-600';
  }

  const taken = record.taken ?? 0;
  const accrued = record.accrued ?? 0;
  const usageColor = taken > accrued ? 'text-red-600' : 'text-green-600';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5 sticky left-0 bg-white z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(record.leave_balance_id)}
            className="rounded border-gray-300 text-primary-600 w-2.5 h-2.5"
          />
        </td>
      )}
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500">{record.leave_balance_id}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-900">
        {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : 'N/A'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-900">
        <div className="flex items-center gap-0.5">
          <ColorSwatch color={record.leave_type?.color} />
          <span>{record.leave_type?.name || 'N/A'}</span>
          <span className="text-gray-500 text-[8px]">({record.leave_type?.code || ''})</span>
        </div>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-700">{record.year}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.opening_balance ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.accrued ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.manual_credit ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.carried_over ?? 0}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap ${usageColor}`}>{taken}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.pending ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.cancelled ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.adjustment ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap max-w-20 truncate" title={record.adjustment_reason || ''}>
        {record.adjustment_reason || '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.encashed ?? 0}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap font-medium ${balanceColor}`}>{balance}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{record.expired ?? 0}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap ${expiryColor}`}>{expiryLabel}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap"><StatusBadge status={record.status} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500">{record.created_by || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500">{record.updated_by || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500 text-[8px]">{new Date(record.createdAt).toLocaleDateString()}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500 text-[8px]">{new Date(record.updatedAt).toLocaleDateString()}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500 text-[8px]">{record.deletedAt ? new Date(record.deletedAt).toLocaleDateString() : '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-0.5">
          {canUpdate && <button onClick={() => openModal(record)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"><Edit className="w-2.5 h-2.5" /></button>}
          {canDelete && <button onClick={() => handleDelete(record.leave_balance_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-2.5 h-2.5" /></button>}
        </div>
      </td>
    </tr>
  );
});
BalanceRow.displayName = 'BalanceRow';

const LeaveBalanceManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);

  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byYear: {}, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    year: 'all',
    status: 'all',
    leave_type_id: 'all',
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
        payload.searchFields = ['employee_name', 'year', 'leave_type_name'];
      }
      const filterConditions = {};
      if (filters.year !== 'all') filterConditions.year = parseInt(filters.year);
      if (filters.status !== 'all') filterConditions.status = filters.status;
      if (filters.leave_type_id !== 'all') filterConditions.leave_type_id = parseInt(filters.leave_type_id);
      if (filters.emp_id !== 'all') filterConditions.emp_id = parseInt(filters.emp_id);
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;
      const response = await hrAPI.getLeaveBalancesAll(payload);
      if (response.data?.success) {
        const { rows, counts, pagination } = response.data;
        setRecords(rows || []);
        setCounts(counts || { total: 0, byYear: {}, byStatus: {} });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: pagination?.totalItems || 0,
          totalPages: pagination?.totalPages || 0,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch leave balances');
      }
    } catch (err) {
      setError('Failed to load leave balances. Please try again.');
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
      const response = await hrAPI.getLeaveBalancesAll({ limit: 10000, sortBy: 'created_at', sortOrder: 'DESC' });
      const data = response.data?.rows || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = [
        'ID', 'Employee', 'Leave Type', 'Leave Code', 'Year', 'Opening Balance',
        'Accrued', 'Manual Credit', 'Carried Over', 'Taken', 'Pending',
        'Cancelled', 'Adjustment', 'Adjustment Reason', 'Encashed', 'Balance',
        'Expired', 'Expiry Date', 'Status', 'Created By', 'Updated By',
        'Created At', 'Updated At', 'Deleted At'
      ];
      const rows = data.map(r => [
        r.leave_balance_id,
        r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'N/A',
        r.leave_type?.name || 'N/A',
        r.leave_type?.code || 'N/A',
        r.year,
        r.opening_balance || 0,
        r.accrued || 0,
        r.manual_credit || 0,
        r.carried_over || 0,
        r.taken || 0,
        r.pending || 0,
        r.cancelled || 0,
        r.adjustment || 0,
        r.adjustment_reason || '',
        r.encashed || 0,
        r.balance || 0,
        r.expired || 0,
        r.expiry_date || 'N/A',
        r.status || 'active',
        r.created_by || 'N/A',
        r.updated_by || 'N/A',
        new Date(r.createdAt).toISOString(),
        new Date(r.updatedAt).toISOString(),
        r.deletedAt ? new Date(r.deletedAt).toISOString() : 'N/A'
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leave_balances_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleBalances = [
    ['emp_id', 'leave_type_id', 'year', 'opening_balance', 'accrued', 'taken', 'balance', 'status'],
    ['1', '1', '2025', '20', '5', '3', '22', 'active'],
    ['2', '2', '2025', '15', '3', '5', '13', 'active'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
        if (!row.leave_type_id) throw new Error(`Row ${i+1}: leave_type_id required`);
        if (!row.year) throw new Error(`Row ${i+1}: year required`);
        return {
          emp_id: parseInt(row.emp_id),
          leave_type_id: parseInt(row.leave_type_id),
          year: parseInt(row.year),
          opening_balance: parseFloat(row.opening_balance) || 0,
          accrued: parseFloat(row.accrued) || 0,
          taken: parseFloat(row.taken) || 0,
          balance: parseFloat(row.balance) || 0,
          status: row.status || 'active',
        };
      });
      await Promise.all(recordsToImport.map(record => hrAPI.createLeaveBalance(record)));
      showToast(`Imported ${recordsToImport.length} records`, 'success');
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
    setSelected(selected.length === records.length ? [] : records.map(r => r.leave_balance_id));
  }, [canBulk, selected, records]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selected.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Records',
          `Are you sure you want to delete ${selected.length} record(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selected.map(id => hrAPI.deleteLeaveBalance(id)));
            setSelected([]);
            setBulkAction('');
            fetchRecords();
            showToast(`Deleted ${selected.length} records`, 'success');
          }
        );
      } else {
        await Promise.all(selected.map(id => hrAPI.updateLeaveBalance(id, { status: bulkAction })));
        setSelected([]);
        setBulkAction('');
        fetchRecords();
        showToast(`Updated ${selected.length} records to "${bulkAction}"`, 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selected, fetchRecords, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const record = records.find(r => r.leave_balance_id === id);
    showConfirmation(
      'Delete Record',
      `Delete leave balance for ${record?.employee?.first_name || 'Unknown'}? This cannot be undone.`,
      'delete',
      async () => {
        await hrAPI.deleteLeaveBalance(id);
        fetchRecords();
        showToast('Record deleted', 'success');
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
    showToast('Record saved successfully!', 'success');
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
    setFilters({
      search: '',
      year: 'all',
      status: 'all',
      leave_type_id: 'all',
      emp_id: 'all',
      page: 1,
      limit: 15,
    });
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.year !== 'all' ||
      filters.status !== 'all' ||
      filters.leave_type_id !== 'all' ||
      filters.emp_id !== 'all'
    );
  }, [filters]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    const statusCounts = counts.byStatus || {};
    return [
      { id: 'all', name: 'All', count: allCount, icon: Filter },
      { id: 'active', name: 'Active', count: statusCounts.active || 0, icon: CheckCircle2 },
      { id: 'expired', name: 'Expired', count: statusCounts.expired || 0, icon: AlertCircle },
      { id: 'pending', name: 'Pending', count: statusCounts.pending || 0, icon: Calendar },
    ];
  }, [counts]);

  return (
    <div className="space-y-2 p-2">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
        <p className="text-[10px] text-gray-600">Manage leave balances</p>
        <div className="flex gap-1">
          {canImport && (
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  const csvContent = sampleBalances.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'leave_balances_import_template.csv';
                  link.click();
                  showToast('Sample CSV downloaded', 'info');
                }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-2.5 h-2.5" /> Sample
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50">
                <Upload className="w-2.5 h-2.5" /> Import
              </button>
            </div>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded font-medium text-[10px] shadow-sm">
              <Plus className="w-2.5 h-2.5" /> New Record
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-1.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleFilterChange('status', tab.id)}
                    className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${
                      (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-2.5 h-2.5 ${(tab.id === 'all' && filters.status === 'all') || filters.status === tab.id ? 'text-primary-600' : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-[8px] rounded-full min-w-3 flex items-center justify-center ${
                      (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-1">
              {canBulk && selected.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[9px] border border-primary-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk</option>
                    <option value="active">Set Active</option>
                    <option value="expired">Set Expired</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[9px] font-medium">Apply</button>
                  <span className="text-[9px] text-primary-700 font-medium">{selected.length} sel</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-0.5 transition-all ${
                showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-2.5 h-2.5" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => handleSearch(e.target.value)} className="pl-5 pr-1.5 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-32 text-[9px]" />
              </div>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-1 pt-1.5 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Year</label>
                  <select value={filters.year} onChange={e => handleFilterChange('year', e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Status</label>
                  <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Leave Type</label>
                  <select value={filters.leave_type_id} onChange={e => handleFilterChange('leave_type_id', e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Employee</label>
                  <select value={filters.emp_id} onChange={e => handleFilterChange('emp_id', e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Per Page</label>
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-1 bg-blue-50 rounded border border-blue-200 mt-1">
                  <div className="flex items-center gap-0.5 flex-wrap">
                    <span className="text-[9px] font-medium text-blue-800">Filters:</span>
                    {filters.search && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] rounded border border-blue-200">Search: "{filters.search}" <button onClick={() => handleSearch('')} className="ml-0.5 text-blue-600 hover:text-blue-800"><X className="w-2 h-2" /></button></span>}
                    {filters.year !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] rounded border border-blue-200">Year: {filters.year} <button onClick={() => handleFilterChange('year', 'all')}><X className="w-2 h-2" /></button></span>}
                    {filters.status !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] rounded border border-blue-200">Status: {filters.status} <button onClick={() => handleFilterChange('status', 'all')}><X className="w-2 h-2" /></button></span>}
                  </div>
                  <button onClick={clearFilters} className="text-[9px] text-blue-600 hover:text-blue-800 font-medium">Clear</button>
                </div>
              )}
            </div>
          )}
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
              <table className="w-full min-w-max text-[9px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && (
                      <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider w-5 sticky left-0 bg-gray-50 z-20">
                        <input type="checkbox" checked={selected.length === records.length && records.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-2.5 h-2.5" />
                      </th>
                    )}
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Opening</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Accrued</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Manual</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Carry</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Taken</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Adj</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Adj Reason</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Encash</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Expired</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">CBy</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">UBy</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider">Deleted</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(record => (
                    <BalanceRow
                      key={record.leave_balance_id}
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
              <div className="text-center"><p className="text-xs text-gray-600">No leave balances found.</p></div>
            </div>
          )}

          <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-3 text-[9px] text-gray-700">
              <span className="font-medium text-gray-600">Color Legend:</span>
              
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600 border border-green-700" />
                <span>Balance &gt; 0</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500 border border-yellow-600" />
                <span>Balance = 0</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 border border-red-700" />
                <span>Balance &lt; 0</span>
              </div>

              <span className="text-gray-400">|</span>

              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600 border border-green-700" />
                <span>Expiry &gt; 7 days</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-600" />
                <span>Expiry ≤ 7 days</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 border border-red-700" />
                <span>Expired (past)</span>
              </div>

              <span className="text-gray-400">|</span>

              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600 border border-green-700" />
                <span>Taken ≤ Accrued</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 border border-red-700" />
                <span>Taken &gt; Accrued (Overused)</span>
              </div>

              <span className="text-gray-400">|</span>

              <div className="flex items-center gap-1">
                <StatusBadge status="active" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status="expired" />
                <span>Expired</span>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status="pending" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status="cancelled" />
                <span>Cancelled</span>
              </div>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-1.5 flex flex-col sm:flex-row items-center justify-between gap-1">
              <div className="text-[9px] text-gray-600">Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}</div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsLeft className="w-2.5 h-2.5" /></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-2.5 h-2.5" /></button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (pagination.totalPages > 5) {
                    if (filters.page <= 3) p = i + 1;
                    else if (filters.page >= pagination.totalPages - 2) p = pagination.totalPages - 4 + i;
                    else p = filters.page - 2 + i;
                  }
                  return <button key={p} onClick={() => handlePageChange(p)} className={`w-5 h-5 text-[9px] rounded border transition-colors ${filters.page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{p}</button>
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-2.5 h-2.5" /></button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsRight className="w-2.5 h-2.5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {showModal && (
          <LeaveBalanceModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleRecordSaved} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Leave Balances"
            requiredHeaders={['emp_id', 'leave_type_id', 'year', 'opening_balance']}
            sampleRows={sampleBalances}
            formatDescription="Required: emp_id, leave_type_id, year, opening_balance. Optional: accrued, taken, balance, status."
            validateRow={(row, i) => {
              if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
              if (!row.leave_type_id) throw new Error(`Row ${i+1}: leave_type_id required`);
              if (!row.year) throw new Error(`Row ${i+1}: year required`);
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

export default LeaveBalanceManagement;