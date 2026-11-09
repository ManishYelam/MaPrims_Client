// src/modules/Leave/Leave_balances/LeaveBalanceManagement.jsx
import React, {
  useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense,
} from 'react';
import {
  Search, Edit, Trash2, Plus, RefreshCw, Eye, Download,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, CheckCircle, AlertCircle, Clock, Archive,
  User, Users, Ban, ArrowRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveBalanceModal        = lazy(() => import('./LeaveBalanceModal'));
const ConfirmationModal        = lazy(() => import('../../../../components/common/ConfirmationModal'));
const Toast                    = lazy(() => import('../../../../components/common/Toast'));
const EmployeeSelectionModal   = lazy(() => import('../../Employees/EmployeeSelectionModal'));

/* ──────────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────────── */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const formatYMD    = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const startOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay     = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const subDays      = (d, n) => { const r = new Date(d); r.setDate(d.getDate() - n); return r; };
const subMonths    = (d, n) => { const r = new Date(d); r.setMonth(d.getMonth() - n); if (r.getDate() !== d.getDate()) r.setDate(0); return r; };
const subYears     = (d, n) => { const r = new Date(d); r.setFullYear(d.getFullYear() - n); return r; };
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth   = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear  = (d) => new Date(d.getFullYear(), 0, 1);
const endOfYear    = (d) => new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);

/* ──────────────────────────────────────────────────────────────────
   QUICK ACTIONS
────────────────────────────────────────────────────────────────── */
const LEAVE_QUICK_ACTIONS = {
  pending: [
    { Icon: CheckCircle, color: 'text-green-600 hover:bg-green-50', title: 'Approve (Active)', nextStatus: 'active' },
    { Icon: Ban, color: 'text-gray-600 hover:bg-gray-100', title: 'Cancel Leave', nextStatus: 'cancelled' },
  ],
  active: [
    { Icon: Ban, color: 'text-gray-600 hover:bg-gray-100', title: 'Cancel Leave', nextStatus: 'cancelled' },
  ],
  expired: [],
  cancelled: [],
};

/* ──────────────────────────────────────────────────────────────────
   BADGES
────────────────────────────────────────────────────────────────── */
const StatusBadge = memo(({ status }) => {
  const colors = {
    active: 'bg-green-100 text-green-700 border border-green-300',
    expired: 'bg-red-100 text-red-700 border border-red-300',
    pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    cancelled: 'bg-gray-100 text-gray-700 border border-gray-300',
  };
  return (
    <span className={`inline-flex items-center px-1 py-0 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
      {status || 'unknown'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const ColorSwatch = memo(({ color }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0"
    style={{ backgroundColor: color || '#ccc' }} aria-hidden="true" />
));
ColorSwatch.displayName = 'ColorSwatch';

/* ──────────────────────────────────────────────────────────────────
   ROW
────────────────────────────────────────────────────────────────── */
const BalanceRow = memo(({
  record, canBulk, selected, toggleSelection,
  canUpdate, canDelete, canUpdateStatus,
  openModal, handleDelete, handleStatusUpdate,
}) => {
  const isSelected = selected.includes(record.leave_balance_id);

  const balance = record.balance ?? 0;
  const balanceColor = balance > 0 ? 'text-green-700' : balance < 0 ? 'text-red-700' : 'text-yellow-700';

  let expiryColor = 'text-gray-500';
  const expiryLabel = record.expiry_date ? formatDate(record.expiry_date) : '—';
  if (record.expiry_date) {
    const diffDays = Math.ceil((new Date(record.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) expiryColor = 'text-red-600 font-medium';
    else if (diffDays <= 7) expiryColor = 'text-orange-600 font-medium';
    else expiryColor = 'text-green-600';
  }

  const taken = record.taken ?? 0;
  const accrued = record.accrued ?? 0;
  const usageColor = taken > accrued ? 'text-red-600' : 'text-green-600';

  const employeeName = record.employee
    ? [record.employee.first_name, record.employee.last_name].filter(Boolean).join(' ')
    : '—';

  const quickActions = LEAVE_QUICK_ACTIONS[record.status] || [];

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5 whitespace-nowrap">
          <input type="checkbox" checked={isSelected}
            onChange={() => toggleSelection(record.leave_balance_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
            aria-label="Select record" />
        </td>
      )}

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => openModal(record, true)}
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50"
            title="View" aria-label="View leave balance">
            <Eye className="w-3 h-3" />
          </button>

          {canUpdate && (
            <button type="button" onClick={() => openModal(record, false)}
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
              title="Edit" aria-label="Edit leave balance">
              <Edit className="w-3 h-3" />
            </button>
          )}

          {canUpdateStatus && quickActions.map(act => (
            <button key={act.title} type="button"
              onClick={() => handleStatusUpdate(record.leave_balance_id, act.nextStatus, act.title)}
              className={`inline-flex items-center justify-center w-5 h-5 rounded ${act.color}`}
              title={act.title} aria-label={act.title}>
              <act.Icon className="w-3 h-3" />
            </button>
          ))}

          {canDelete && (
            <button type="button" onClick={() => handleDelete(record.leave_balance_id)}
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
              title="Delete" aria-label="Delete leave balance">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">
        {dash(record.leave_balance_id)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700">
        {employeeName}
        {record.employee?.employee_code && (
          <span className="text-gray-400 text-[10px] ml-1">({record.employee.employee_code})</span>
        )}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700">
        <div className="flex items-center gap-1">
          <ColorSwatch color={record.leave_type?.color} />
          <span>{record.leave_type?.name || '—'}</span>
          {record.leave_type?.code && <span className="text-gray-400 text-[10px]">({record.leave_type.code})</span>}
        </div>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.year)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.opening_balance ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.accrued ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.manual_credit ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.carried_over ?? 0}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] ${usageColor}`}>{taken}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.pending ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.cancelled ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.adjustment ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[120px] truncate" title={record.adjustment_reason || ''}>
        {record.adjustment_reason || '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.encashed ?? 0}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-semibold ${balanceColor}`}>{balance}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.expired ?? 0}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] ${expiryColor}`}>{expiryLabel}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <StatusBadge status={record.status} />
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.createdAt)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.updatedAt)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">
        {record.deletedAt ? formatDateTime(record.deletedAt) : '—'}
      </td>
    </tr>
  );
});
BalanceRow.displayName = 'BalanceRow';

/* ──────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────── */
const LeaveBalanceManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage       = useMemo(() => isAdmin, [isAdmin]);
  const canCreate       = useMemo(() => hasPermission('create', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate       = useMemo(() => hasPermission('update', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'leavebalance', 'A4') || canUpdate, [hasPermission, canUpdate]);
  const canDelete       = useMemo(() => hasPermission('delete', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk         = useMemo(() => hasPermission('bulk', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);
  const canExport       = useMemo(() => hasPermission('export', 'leavebalance', 'A4') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byYear: {}, byStatus: {} });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [toast, setToast] = useState(null);

  const [showEmployeeFilterModal, setShowEmployeeFilterModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState(null);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '', dateFrom: '', dateTo: '',
    year: 'all', leave_type_id: 'all', emp_id: 'all',
    page: 1, limit: 50,
  });
  const [datePreset, setDatePreset] = useState('all');
  const debouncedSearch = useDebounce(filters.search, 300);

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res = await hrAPI.getLeaveTypes();
      if (res.data?.success) setLeaveTypes(res.data.data || []);
    } catch { }
  }, []);
  useEffect(() => { fetchLeaveTypes(); }, [fetchLeaveTypes]);

  const buildFilterConditions = useCallback(() => {
    const filterConditions = {};
    if (activeTab !== 'all') filterConditions.status = activeTab;
    if (filters.year !== 'all') filterConditions.year = parseInt(filters.year);
    if (filters.leave_type_id !== 'all') filterConditions.leave_type_id = parseInt(filters.leave_type_id);
    if (filters.emp_id !== 'all') filterConditions.emp_id = parseInt(filters.emp_id);
    if (filters.dateFrom) filterConditions.expiry_date_from = filters.dateFrom;
    if (filters.dateTo) filterConditions.expiry_date_to = filters.dateTo;
    return filterConditions;
  }, [activeTab, filters]);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = { page: filters.page, limit: filters.limit, sortBy: 'created_at', sortOrder: 'DESC' };
      if (debouncedSearch.trim()) {
        payload.search = debouncedSearch.trim();
        payload.searchFields = 'employee_name,year,leave_type_name';
      }
      const filterConditions = buildFilterConditions();
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;

      const response = await hrAPI.getLeaveBalancesAll(payload);
      const data = response.data;
      if (data && data.success) {
        setRecords(data.rows || []);
        setCounts(data.counts || { total: 0, byYear: {}, byStatus: {} });
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 0);
      } else throw new Error(data?.message || 'Invalid response');
    } catch (err) {
      setError(err.message || 'Failed to load leave balances');
      setRecords([]); setTotalItems(0); setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, buildFilterConditions, debouncedSearch]);

  useEffect(() => { fetchRecords(); /* eslint-disable-next-line */ }, [activeTab, filters, debouncedSearch]);

  const tabs = useMemo(() => {
    const sc = counts.byStatus || {};
    return [
      { id: 'all', name: 'All', count: counts.total ?? totalItems, icon: Users, color: 'text-gray-600' },
      { id: 'pending', name: 'Pending', count: sc.pending ?? 0, icon: Clock, color: 'text-yellow-600' },
      { id: 'active', name: 'Active', count: sc.active ?? 0, icon: CheckCircle, color: 'text-green-600' },
      { id: 'expired', name: 'Expired', count: sc.expired ?? 0, icon: AlertCircle, color: 'text-red-600' },
      { id: 'cancelled', name: 'Cancelled', count: sc.cancelled ?? 0, icon: Archive, color: 'text-gray-500' },
    ];
  }, [counts, totalItems]);

  const handleStatusChange = useCallback((status) => {
    setActiveTab(status);
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((v) => setFilters(p => ({ ...p, search: v, page: 1 })), []);
  const handleLimitChange = useCallback((v) => setFilters(p => ({ ...p, limit: parseInt(v), page: 1 })), []);
  const handlePageChange = useCallback((n) => {
    if (n >= 1 && n <= Math.max(totalPages, 1)) setFilters(p => ({ ...p, page: n }));
  }, [totalPages]);

  const handleEmployeeFilterSelect = useCallback((emp) => {
    if (emp) { setFilterEmployee(emp); setFilters(p => ({ ...p, emp_id: emp.emp_id, page: 1 })); }
    else { setFilterEmployee(null); setFilters(p => ({ ...p, emp_id: 'all', page: 1 })); }
    setShowEmployeeFilterModal(false);
  }, []);

  const clearEmployeeFilter = useCallback(() => {
    setFilterEmployee(null);
    setFilters(p => ({ ...p, emp_id: 'all', page: 1 }));
  }, []);

  const handleDatePresetChange = useCallback((e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    const today = new Date();
    let start = '', end = '';
    switch (preset) {
      case 'all': start = ''; end = ''; break;
      case 'today': start = formatYMD(startOfDay(today)); end = formatYMD(endOfDay(today)); break;
      case 'yesterday': start = formatYMD(startOfDay(subDays(today, 1))); end = formatYMD(endOfDay(subDays(today, 1))); break;
      case 'last7days': start = formatYMD(startOfDay(subDays(today, 6))); end = formatYMD(endOfDay(today)); break;
      case 'monthtodate': start = formatYMD(startOfMonth(today)); end = formatYMD(endOfDay(today)); break;
      case 'previous-month': start = formatYMD(startOfMonth(subMonths(today, 1))); end = formatYMD(endOfMonth(subMonths(today, 1))); break;
      case 'yeartodate': start = formatYMD(startOfYear(today)); end = formatYMD(endOfDay(today)); break;
      case 'previous-year': start = formatYMD(startOfYear(subYears(today, 1))); end = formatYMD(endOfYear(subYears(today, 1))); break;
      default: return;
    }
    setFilters(p => ({ ...p, dateFrom: start, dateTo: end, page: 1 }));
  }, []);

  const handleRefresh = useCallback(() => fetchRecords(), [fetchRecords]);
  const handleGetData = useCallback(() => fetchRecords(), [fetchRecords]);

  const hasActiveFilters = useMemo(() => (
    filters.search !== '' || activeTab !== 'all' ||
    filters.dateFrom !== '' || filters.dateTo !== '' ||
    filters.year !== 'all' || filters.leave_type_id !== 'all' || filters.emp_id !== 'all'
  ), [filters, activeTab]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = records.map(r => r.leave_balance_id);
    setSelected(selected.length === ids.length ? [] : ids);
  }, [canBulk, selected, records]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk) { showToast('No permission for bulk actions', 'error'); return; }
    if (!bulkAction || selected.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission to delete', 'error'); return; }
        showConfirmation(
          'Delete Records',
          `Delete ${selected.length} record(s)? This cannot be undone.`,
          'bulkDelete',
          async () => {
            await Promise.all(selected.map(id => hrAPI.deleteLeaveBalance(id)));
            setSelected([]); setBulkAction(''); fetchRecords();
            showToast(`Deleted ${selected.length} record(s)`, 'success');
          },
        );
      } else {
        if (!canUpdateStatus) { showToast('No permission to update status', 'error'); return; }
        await Promise.all(selected.map(id => hrAPI.updateLeaveBalance(id, { status: bulkAction })));
        setSelected([]); setBulkAction(''); fetchRecords();
        showToast(`Updated ${selected.length} record(s) to "${bulkAction}"`, 'success');
      }
    } catch { showToast('Bulk action failed', 'error'); }
  }, [canBulk, canDelete, canUpdateStatus, bulkAction, selected, fetchRecords, showToast, showConfirmation]);

  const handleStatusUpdate = useCallback(async (id, nextStatus, label) => {
    if (!canUpdateStatus) { showToast('No permission to update status', 'error'); return; }
    const rec = records.find(r => r.leave_balance_id === id);
    const currentStatus = rec?.status || 'pending';
    if (currentStatus === nextStatus) return;

    setRecords(prev => prev.map(r => r.leave_balance_id === id ? { ...r, status: nextStatus } : r));
    setCounts(prev => {
      const next = { ...prev, byStatus: { ...(prev.byStatus || {}) } };
      if (currentStatus && next.byStatus[currentStatus] != null) {
        next.byStatus[currentStatus] = Math.max(0, next.byStatus[currentStatus] - 1);
      }
      next.byStatus[nextStatus] = (next.byStatus[nextStatus] || 0) + 1;
      return next;
    });

    try {
      await hrAPI.updateLeaveBalance(id, { status: nextStatus });
      showToast(label || `Status → ${nextStatus}`, 'success');
    } catch {
      setRecords(prev => prev.map(r => r.leave_balance_id === id ? { ...r, status: currentStatus } : r));
      setCounts(prev => {
        const next = { ...prev, byStatus: { ...(prev.byStatus || {}) } };
        if (nextStatus && next.byStatus[nextStatus] != null) {
          next.byStatus[nextStatus] = Math.max(0, next.byStatus[nextStatus] - 1);
        }
        next.byStatus[currentStatus] = (next.byStatus[currentStatus] || 0) + 1;
        return next;
      });
      showToast('Failed to update status', 'error');
    }
  }, [canUpdateStatus, records, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) { showToast('No permission to delete', 'error'); return; }
    const rec = records.find(r => r.leave_balance_id === id);
    const name = rec?.employee
      ? [rec.employee.first_name, rec.employee.last_name].filter(Boolean).join(' ')
      : 'this record';
    showConfirmation(
      'Delete Record',
      `Delete leave balance for ${name}? This cannot be undone.`,
      'delete',
      async () => {
        const snapshot = records;
        const snapshotTotal = totalItems;
        setRecords(prev => prev.filter(r => r.leave_balance_id !== id));
        setTotalItems(prev => Math.max(0, prev - 1));
        try {
          await hrAPI.deleteLeaveBalance(id);
          showToast('Record deleted', 'success');
        } catch {
          setRecords(snapshot); setTotalItems(snapshotTotal);
          showToast('Failed to delete', 'error');
        }
      },
    );
  }, [canDelete, records, totalItems, showToast, showConfirmation]);

  const openModal = useCallback((record = null, readOnlyMode = false) => {
    if (record && !readOnlyMode && !canUpdate) { showToast('No permission to edit', 'error'); return; }
    if (!record && !canCreate) { showToast('No permission to create', 'error'); return; }
    setEditingRecord(record);
    setIsReadOnly(readOnlyMode);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false); setEditingRecord(null); setIsReadOnly(false);
  }, []);

  const handleRecordSaved = useCallback(() => {
    closeModal(); fetchRecords(); showToast('Record saved successfully', 'success');
  }, [closeModal, fetchRecords, showToast]);

  const filterEmployeeLabel = useMemo(() => {
    if (!filterEmployee) return 'All Employees';
    const name = filterEmployee.display_name
      || [filterEmployee.first_name, filterEmployee.last_name].filter(Boolean).join(' ')
      || filterEmployee.email || `ID: ${filterEmployee.emp_id}`;
    return filterEmployee.employee_code ? `${name} (${filterEmployee.employee_code})` : name;
  }, [filterEmployee]);

  /* ──────────────────────────────────────────────────────────────────
     EXPORT TO EXCEL (.xlsx) — respects active filters
  ────────────────────────────────────────────────────────────────── */
  const exportToExcel = useCallback(async () => {
    if (!canExport) { showToast('No permission to export', 'error'); return; }
    try {
      setExportLoading(true);

      // Fetch ALL matching rows (not just current page)
      const fetchLimit = Math.min(Math.max(totalItems, 100), 10000);
      const payload = {
        page: 1,
        limit: fetchLimit,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };
      if (debouncedSearch.trim()) {
        payload.search = debouncedSearch.trim();
        payload.searchFields = 'employee_name,year,leave_type_name';
      }
      const filterConditions = buildFilterConditions();
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;

      const response = await hrAPI.getLeaveBalancesAll(payload);
      const rows = response.data?.rows || [];
      if (rows.length === 0) {
        showToast('No data to export', 'error');
        return;
      }

      // Build data sheet
      const data = rows.map(r => ({
        'ID': r.leave_balance_id ?? '',
        'Employee': r.employee ? `${r.employee.first_name || ''} ${r.employee.last_name || ''}`.trim() : '',
        'Employee Code': r.employee?.employee_code || '',
        'Leave Type': r.leave_type?.name || '',
        'Leave Code': r.leave_type?.code || '',
        'Year': r.year ?? '',
        'Opening Balance': r.opening_balance ?? 0,
        'Accrued': r.accrued ?? 0,
        'Manual Credit': r.manual_credit ?? 0,
        'Carried Over': r.carried_over ?? 0,
        'Taken': r.taken ?? 0,
        'Pending': r.pending ?? 0,
        'Cancelled': r.cancelled ?? 0,
        'Adjustment': r.adjustment ?? 0,
        'Adjustment Reason': r.adjustment_reason || '',
        'Encashed': r.encashed ?? 0,
        'Balance': r.balance ?? 0,
        'Expired': r.expired ?? 0,
        'Expiry Date': r.expiry_date ? formatDate(r.expiry_date) : '',
        'Status': r.status || '',
        'Created By': r.created_by ?? '',
        'Updated By': r.updated_by ?? '',
        'Created At': r.createdAt ? formatDateTime(r.createdAt) : '',
        'Updated At': r.updatedAt ? formatDateTime(r.updatedAt) : '',
        'Deleted At': r.deletedAt ? formatDateTime(r.deletedAt) : '',
      }));

      // Build rules sheet (mirror of the on-screen legend)
      const rules = [
        { Section: 'Color Legend — Balance', Rule: 'Balance > 0', Meaning: 'Positive balance (available)' },
        { Section: 'Color Legend — Balance', Rule: 'Balance = 0', Meaning: 'Zero balance' },
        { Section: 'Color Legend — Balance', Rule: 'Balance < 0', Meaning: 'Negative balance (overdrawn)' },
        { Section: 'Color Legend — Expiry', Rule: 'Expiry > 7 days', Meaning: 'Safe' },
        { Section: 'Color Legend — Expiry', Rule: 'Expiry ≤ 7 days', Meaning: 'Expiring soon' },
        { Section: 'Color Legend — Expiry', Rule: 'Expired (past)', Meaning: 'Past expiry date' },
        { Section: 'Color Legend — Usage', Rule: 'Taken ≤ Accrued', Meaning: 'Within limits' },
        { Section: 'Color Legend — Usage', Rule: 'Taken > Accrued', Meaning: 'Overused' },
        { Section: 'Workflow', Rule: 'Pending → (Approve) → Active', Meaning: 'Manager approves a new record' },
        { Section: 'Workflow', Rule: 'Active → (auto on expiry date) → Expired', Meaning: 'Server cron flips status when expiry_date < today' },
        { Section: 'Workflow', Rule: 'Pending or Active → (Cancel Leave) → Cancelled', Meaning: 'Manual cancel action' },
        { Section: 'Workflow', Rule: 'New records always start as Pending', Meaning: 'Create flow' },
      ];

      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(data);
      const wsRules = XLSX.utils.json_to_sheet(rules);

      // Column widths for readability
      wsData['!cols'] = [
        { wch: 8 },  { wch: 26 }, { wch: 14 }, { wch: 18 }, { wch: 12 },
        { wch: 8 },  { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
        { wch: 8 },  { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 26 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      ];
      wsRules['!cols'] = [{ wch: 24 }, { wch: 48 }, { wch: 48 }];

      XLSX.utils.book_append_sheet(wb, wsData, 'Leave Balances');
      XLSX.utils.book_append_sheet(wb, wsRules, 'Rules & Legend');

      const filename = `leave_balances_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast(`Exported ${data.length} record(s) to Excel`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, totalItems, debouncedSearch, buildFilterConditions, showToast]);

  return (
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      {/* ── TOP TOOLBAR ── */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage leave balances</p></div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          <button type="button" onClick={() => setShowEmployeeFilterModal(true)}
            className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${filterEmployee ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`} title="Filter by employee">
            <User className="w-3 h-3" />
            <span className="max-w-[140px] truncate">{filterEmployeeLabel}</span>
            {filterEmployee && (
              <span role="button" tabIndex={0}
                onClick={(e) => { e.stopPropagation(); clearEmployeeFilter(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); clearEmployeeFilter(); } }}
                className="ml-0.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded hover:bg-primary-100 cursor-pointer"
                title="Clear employee filter">
                <X className="w-2.5 h-2.5" />
              </span>
            )}
          </button>

          <select value={filters.leave_type_id}
            onChange={e => setFilters(p => ({ ...p, leave_type_id: e.target.value, page: 1 }))}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="all">All Leave Types</option>
            {leaveTypes.map(lt => (
              <option key={lt.leave_type_id} value={lt.leave_type_id}>
                {lt.name}{lt.code ? ` (${lt.code})` : ''}
              </option>
            ))}
          </select>

          <select value={filters.year}
            onChange={e => setFilters(p => ({ ...p, year: e.target.value, page: 1 }))}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="all">All Years</option>
            {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select value={datePreset} onChange={handleDatePresetChange}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="monthtodate">Month to date</option>
            <option value="previous-month">Previous month</option>
            <option value="yeartodate">Year to date</option>
            <option value="previous-year">Previous year</option>
          </select>

          <input type="date" value={filters.dateFrom}
            onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value, page: 1 }))}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" title="Expiry from" />
          <input type="date" value={filters.dateTo}
            onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value, page: 1 }))}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" title="Expiry to" />

          <button type="button" onClick={handleGetData}
            className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700">
            <RefreshCw className="w-3 h-3" /> Get Data
          </button>
          <button type="button" onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>

          {canExport && (
            <button type="button" onClick={exportToExcel} disabled={exportLoading}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Export current filtered data to Excel (.xlsx)">
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting…' : 'Export'}
            </button>
          )}

          {canCreate && (
            <button type="button" onClick={() => openModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium">
              <Plus className="w-2.5 h-2.5" /> New Record
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="flex-shrink-0 p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => handleStatusChange(tab.id)}
                    className={`px-1.5 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${active ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}>
                    <Icon className={`w-3 h-3 ${active ? tab.color : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${active ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                      }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white">
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="150">150 per page</option>
                <option value="200">200 per page</option>
                <option value="250">250 per page</option>
                <option value="300">300 per page</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search employees, leave types..."
                  value={filters.search} onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-48 text-xs" />
              </div>

              {canBulk && selected.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="active">Approve (Active)</option>
                        <option value="cancelled">Cancel Leave</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium">
                    Apply
                  </button>
                  <span className="text-xs text-primary-700 font-medium">{selected.length} selected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Leave Balances</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchRecords} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : records.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input type="checkbox"
                        checked={selected.length === records.length && records.length > 0}
                        onChange={toggleSelectAll} disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3" />
                    </th>
                  )}
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Opening</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Accrued</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Manual</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Carry</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Taken</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Adj</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Adj Reason</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Encash</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Expired</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">CBy</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">UBy</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Deleted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map(rec => (
                  <BalanceRow key={rec.leave_balance_id} record={rec}
                    canBulk={canBulk} selected={selected} toggleSelection={toggleSelection}
                    canUpdate={canUpdate} canDelete={canDelete} canUpdateStatus={canUpdateStatus}
                    openModal={openModal} handleDelete={handleDelete} handleStatusUpdate={handleStatusUpdate} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No leave balances found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {hasActiveFilters ? 'No records match your filter criteria.' : 'Get started by adding your first leave balance record.'}
                </p>
                {canCreate && (
                  <button onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto">
                    <Plus className="w-2.5 h-2.5" /> Add Record
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RULES / COLOR LEGEND ── */}
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
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[9px] text-gray-600 mt-1">
            <span className="font-medium text-gray-600">Workflow:</span>
            <span className="inline-flex items-center gap-1">
              <StatusBadge status="pending" />
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-gray-700">(Approve)</span>
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <StatusBadge status="active" />
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-gray-500 italic">(auto on expiry date)</span>
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <StatusBadge status="expired" />
            </span>
            <span className="text-gray-400">|</span>
            <span className="inline-flex items-center gap-1">
              <StatusBadge status="pending" />
              <span className="text-gray-500">or</span>
              <StatusBadge status="active" />
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-gray-700">(Cancel Leave)</span>
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <StatusBadge status="cancelled" />
            </span>
            <span className="text-gray-400">|</span>
            <span className="italic text-gray-500">
              New records always start as <span className="font-medium">Pending</span>.
            </span>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span>Showing</span>
                <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                <span>to</span>
                <span className="font-medium">{Math.min(filters.page * filters.limit, totalItems)}</span>
                <span>of</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (filters.page <= 3) pageNum = i + 1;
                  else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = filters.page - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                      className={`w-6 h-6 text-xs rounded border transition-colors ${filters.page === pageNum ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}>{pageNum}</button>
                  );
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showModal && (
          <LeaveBalanceModal show={showModal} record={editingRecord} readOnly={isReadOnly}
            onClose={closeModal} onSaved={handleRecordSaved} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showEmployeeFilterModal && (
          <EmployeeSelectionModal show={showEmployeeFilterModal}
            onClose={() => setShowEmployeeFilterModal(false)}
            onSelect={handleEmployeeFilterSelect}
            selectedEmployeeId={filterEmployee?.emp_id || null} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {confirmation.show && (
          <ConfirmationModal show={confirmation.show}
            title={confirmation.title} message={confirmation.message}
            type={confirmation.type} onConfirm={handleConfirm} onCancel={hideConfirmation} />
        )}
      </Suspense>
    </div>
  );
};

export default LeaveBalanceManagement;