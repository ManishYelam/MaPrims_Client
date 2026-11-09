// src/modules/Leave/Leave_requests/LeaveRequestManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Plus, Download, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, CheckCircle, AlertCircle, Clock, Archive,
  User, Users, Ban, ArrowRight, Check, XCircle, Link as LinkIcon, RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveRequestModal   = lazy(() => import('./LeaveRequestModal'));
const ConfirmationModal   = lazy(() => import('../../../../components/common/ConfirmationModal'));
const Toast               = lazy(() => import('../../../../components/common/Toast'));
const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

/* ──────────────────────────────────────────────────────────────────
   INLINE REASON CONFIRMATION MODAL  (used only for Reject / Cancel)
   - Reason field is ALWAYS rendered
   - Confirm button is DISABLED until reason.trim() is non-empty
   - onConfirm receives the trimmed reason string
   - onCancel closes without calling anything
────────────────────────────────────────────────────────────────── */
const ReasonConfirmationModal = ({
  show,
  title,
  message,
  tone = 'blue',              // 'blue' | 'red'
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Enter a reason…',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (show) { setReason(''); setTouched(false); }
  }, [show]);

  if (!show) return null;

  const trimmed = reason.trim();
  const invalid = trimmed.length === 0;

  const toneMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600',  btn: 'bg-blue-600 hover:bg-blue-700' },
    red:  { bg: 'bg-red-50',  border: 'border-red-200',  icon: 'text-red-600',   btn: 'bg-red-600 hover:bg-red-700' },
  };
  const t = toneMap[tone] || toneMap.blue;

  const handleConfirmClick = () => {
    setTouched(true);
    if (invalid) return;                 // hard stop
    onConfirm?.(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-md max-w-md w-full shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start gap-2 p-3 border-b">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${t.bg} ${t.border} border`}>
            <AlertTriangle className={`w-4 h-4 ${t.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {message && <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{message}</p>}
          </div>
          <button onClick={onCancel} disabled={loading}
            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason field — ALWAYS rendered */}
        <div className="p-3 border-b">
          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
            {reasonLabel} <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 resize-none ${
              touched && invalid ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={reasonPlaceholder}
            disabled={loading}
            autoFocus
          />
          {touched && invalid && (
            <p className="text-[9px] text-red-600 mt-0.5">Reason is required</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-1.5 p-2.5 border-t bg-gray-50">
          <button onClick={onCancel} disabled={loading}
            className="px-2.5 py-1 text-[11px] border rounded bg-white hover:bg-gray-50 disabled:opacity-50">
            {cancelText}
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={loading || invalid}
            title={invalid ? 'Enter a reason to continue' : undefined}
            className={`px-2.5 py-1 text-[11px] rounded text-white flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${t.btn}`}
          >
            {loading ? 'Working…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

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

/* ──────────────────────────────────────────────────────────────────
   QUICK ACTIONS
────────────────────────────────────────────────────────────────── */
const REQUEST_QUICK_ACTIONS = {
  pending: [
    { Icon: Check,   color: 'text-green-600 hover:bg-green-50',   title: 'Approve', nextStatus: 'approved' },
    { Icon: XCircle, color: 'text-red-600 hover:bg-red-50',       title: 'Reject',  nextStatus: 'rejected' },
  ],
  approved: [
    { Icon: Ban,     color: 'text-orange-600 hover:bg-orange-50', title: 'Cancel',  nextStatus: 'cancelled' },
  ],
  partially_approved: [
    { Icon: Check,   color: 'text-green-600 hover:bg-green-50',   title: 'Approve', nextStatus: 'approved' },
    { Icon: XCircle, color: 'text-red-600 hover:bg-red-50',       title: 'Reject',  nextStatus: 'rejected' },
    { Icon: Ban,     color: 'text-orange-600 hover:bg-orange-50', title: 'Cancel',  nextStatus: 'cancelled' },
  ],
  rejected:  [],
  cancelled: [],
  withdrawn: [],
};

/* ──────────────────────────────────────────────────────────────────
   BADGES
────────────────────────────────────────────────────────────────── */
const StatusBadge = memo(({ status }) => {
  const colors = {
    pending:            'bg-yellow-100 text-yellow-700 border border-yellow-300',
    approved:           'bg-green-100 text-green-700 border border-green-300',
    partially_approved: 'bg-blue-100 text-blue-700 border border-blue-300',
    rejected:           'bg-red-100 text-red-700 border border-red-300',
    cancelled:          'bg-gray-100 text-gray-700 border border-gray-300',
    withdrawn:          'bg-purple-100 text-purple-700 border border-purple-300',
  };
  const icons = {
    pending: Clock, approved: Check, partially_approved: RefreshCw,
    rejected: XCircle, cancelled: Ban, withdrawn: X,
  };
  const Icon = icons[status] || AlertCircle;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1 py-0 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
      <Icon className="w-2.5 h-2.5" /> {status || 'unknown'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const ColorSwatch = memo(({ color }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0"
    style={{ backgroundColor: color || '#ccc' }} aria-hidden="true" />
));
ColorSwatch.displayName = 'ColorSwatch';

const BooleanBadge = memo(({ value, yes = 'Yes', no = 'No' }) => (
  <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
    {value ? yes : no}
  </span>
));
BooleanBadge.displayName = 'BooleanBadge';

/* ──────────────────────────────────────────────────────────────────
   ROW
────────────────────────────────────────────────────────────────── */
const RequestRow = memo(({
  record, canBulk, selected, toggleSelection,
  canUpdate, canDelete, canApprove, canCancel,
  openModal, handleDelete, handleApprove, handleReject, handleCancel,
}) => {
  const isSelected = selected.includes(record.leave_req_id);
  const quickActions = REQUEST_QUICK_ACTIONS[record.status] || [];
  const employeeName = record.employee
    ? [record.employee.first_name, record.employee.last_name].filter(Boolean).join(' ')
    : '—';

  const onQuickAction = (nextStatus) => {
    if (nextStatus === 'approved') return handleApprove(record.leave_req_id);
    if (nextStatus === 'rejected') return handleReject(record.leave_req_id);
    if (nextStatus === 'cancelled') return handleCancel(record.leave_req_id);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5 whitespace-nowrap">
          <input type="checkbox" checked={isSelected}
            onChange={() => toggleSelection(record.leave_req_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
            aria-label="Select request" />
        </td>
      )}

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => openModal(record, true)}
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50"
            title="View" aria-label="View request"><Eye className="w-3 h-3" /></button>

          {canUpdate && ['pending', 'partially_approved'].includes(record.status) && (
            <button type="button" onClick={() => openModal(record, false)}
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
              title="Edit" aria-label="Edit request"><Edit className="w-3 h-3" /></button>
          )}

          {quickActions.map(act => {
            const gate = act.nextStatus === 'approved' || act.nextStatus === 'rejected' ? canApprove
                       : act.nextStatus === 'cancelled' ? canCancel : true;
            if (!gate) return null;
            return (
              <button key={act.title} type="button" onClick={() => onQuickAction(act.nextStatus)}
                className={`inline-flex items-center justify-center w-5 h-5 rounded ${act.color}`}
                title={act.title} aria-label={act.title}>
                <act.Icon className="w-3 h-3" />
              </button>
            );
          })}

          {canDelete && (
            <button type="button" onClick={() => handleDelete(record.leave_req_id)}
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
              title="Delete" aria-label="Delete request"><Trash2 className="w-3 h-3" /></button>
          )}
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{dash(record.leave_req_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700">
        {employeeName}
        {record.employee?.employee_code && <span className="text-gray-400 text-[10px] ml-1">({record.employee.employee_code})</span>}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700">
        <div className="flex items-center gap-1">
          <ColorSwatch color={record.leave_type?.color} />
          <span>{record.leave_type?.name || '—'}</span>
          {record.leave_type?.code && <span className="text-gray-400 text-[10px]">({record.leave_type.code})</span>}
        </div>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDate(record.start_date)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDate(record.end_date)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-semibold text-gray-700">{record.days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap"><BooleanBadge value={record.is_half_day} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.half_day_on ? formatDate(record.half_day_on) : '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.half_day_session || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[160px] truncate" title={record.reason || ''}>{record.reason || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap"><BooleanBadge value={record.emergency_leave} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.contact_during_leave || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap"><StatusBadge status={record.status} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.current_approval_level ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.approved_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.approved_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.rejected_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.rejected_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[140px] truncate" title={record.rejection_reason || ''}>{record.rejection_reason || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.cancelled_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.cancelled_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[140px] truncate" title={record.cancellation_reason || ''}>{record.cancellation_reason || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        {record.attachment_url ? (
          <a href={record.attachment_url} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50"
             title="Open attachment" aria-label="Open attachment"><LinkIcon className="w-3 h-3" /></a>
        ) : '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.attachments?.length || 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.balance_before ?? '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.balance_after ?? '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap"><BooleanBadge value={record.notified_employee} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap"><BooleanBadge value={record.notified_manager} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.createdAt)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.updatedAt)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.deletedAt ? formatDateTime(record.deletedAt) : '—'}</td>
    </tr>
  );
});
RequestRow.displayName = 'RequestRow';

/* ──────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────── */
const LeaveRequestManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage  = useMemo(() => isAdmin, [isAdmin]);
  const canCreate  = useMemo(() => hasPermission('create', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate  = useMemo(() => hasPermission('update', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete  = useMemo(() => hasPermission('delete', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canExport  = useMemo(() => hasPermission('export', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk    = useMemo(() => hasPermission('bulk', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canApprove = useMemo(() => hasPermission('approve', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canCancel  = useMemo(() => hasPermission('cancel', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byStatus: {} });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [showEmployeeFilterModal, setShowEmployeeFilterModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState(null);

  const [leaveTypes, setLeaveTypes] = useState([]);

  const [filters, setFilters] = useState({
    search: '', leave_type_id: 'all', emp_id: 'all', page: 1, limit: 50,
  });
  const debouncedSearch = useDebounce(filters.search, 300);

  // Generic confirmation (DELETE only)
  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null, loading: false,
  });

  // Dedicated reason confirmation (REJECT / CANCEL)
  const [reasonDialog, setReasonDialog] = useState({
    show: false,
    title: '',
    message: '',
    tone: 'blue',
    confirmText: 'Confirm',
    reasonLabel: 'Reason',
    reasonPlaceholder: 'Enter a reason…',
    onConfirm: null,   // receives trimmed reason string
    loading: false,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res = await hrAPI.getLeaveTypes();
      if (res.data?.success) setLeaveTypes(res.data.data || []);
    } catch {}
  }, []);
  useEffect(() => { fetchLeaveTypes(); }, [fetchLeaveTypes]);

  const buildFilterConditions = useCallback(() => {
    const fc = {};
    if (activeTab !== 'all') fc.status = activeTab;
    if (filters.leave_type_id !== 'all') fc.leave_type_id = parseInt(filters.leave_type_id);
    if (filters.emp_id !== 'all') fc.emp_id = parseInt(filters.emp_id);
    return fc;
  }, [activeTab, filters]);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = { page: filters.page, limit: filters.limit, sortBy: 'created_at', sortOrder: 'DESC' };
      if (debouncedSearch.trim()) {
        payload.search = debouncedSearch.trim();
        payload.searchFields = 'employee_name,status,reason';
      }
      const fc = buildFilterConditions();
      if (Object.keys(fc).length > 0) payload.filters = fc;

      const response = await hrAPI.getLeaveRequestsAll(payload);
      const data = response.data;
      if (data?.success) {
        setRecords(data.rows || []);
        setCounts(data.counts || { total: 0, byStatus: {} });
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 0);
      } else throw new Error(data?.message || 'Invalid response');
    } catch (err) {
      setError(err.message || 'Failed to load leave requests');
      setRecords([]); setTotalItems(0); setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, buildFilterConditions, debouncedSearch]);

  useEffect(() => { fetchRecords(); /* eslint-disable-next-line */ }, [activeTab, filters, debouncedSearch]);

  const tabs = useMemo(() => {
    const sc = counts.byStatus || {};
    return [
      { id: 'all',       name: 'All',       count: counts.total ?? totalItems, icon: Users,       color: 'text-gray-600' },
      { id: 'pending',   name: 'Pending',   count: sc.pending   ?? 0,          icon: Clock,       color: 'text-yellow-600' },
      { id: 'approved',  name: 'Approved',  count: sc.approved  ?? 0,          icon: CheckCircle, color: 'text-green-600' },
      { id: 'rejected',  name: 'Rejected',  count: sc.rejected  ?? 0,          icon: XCircle,     color: 'text-red-600' },
      { id: 'cancelled', name: 'Cancelled', count: sc.cancelled ?? 0,          icon: Archive,     color: 'text-gray-500' },
    ];
  }, [counts, totalItems]);

  const handleStatusChange = useCallback((status) => {
    setActiveTab(status); setFilters(p => ({ ...p, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((v) => setFilters(p => ({ ...p, search: v, page: 1 })), []);
  const handleLimitChange  = useCallback((v) => setFilters(p => ({ ...p, limit: parseInt(v), page: 1 })), []);
  const handlePageChange   = useCallback((n) => {
    if (n >= 1 && n <= Math.max(totalPages, 1)) setFilters(p => ({ ...p, page: n }));
  }, [totalPages]);

  const handleEmployeeFilterSelect = useCallback((emp) => {
    if (emp) { setFilterEmployee(emp); setFilters(p => ({ ...p, emp_id: emp.emp_id, page: 1 })); }
    else     { setFilterEmployee(null); setFilters(p => ({ ...p, emp_id: 'all', page: 1 })); }
    setShowEmployeeFilterModal(false);
  }, []);

  const clearEmployeeFilter = useCallback(() => {
    setFilterEmployee(null); setFilters(p => ({ ...p, emp_id: 'all', page: 1 }));
  }, []);

  const handleRefresh = useCallback(() => fetchRecords(), [fetchRecords]);
  const handleGetData = useCallback(() => fetchRecords(), [fetchRecords]);

  const hasActiveFilters = useMemo(() => (
    filters.search !== '' || activeTab !== 'all' ||
    filters.leave_type_id !== 'all' || filters.emp_id !== 'all'
  ), [filters, activeTab]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = records.map(r => r.leave_req_id);
    setSelected(selected.length === ids.length ? [] : ids);
  }, [canBulk, selected, records]);

  /* ── Generic confirmation (delete) ── */
  const showDeleteConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm, loading: false });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(async () => {
    if (!confirmation.onConfirm) return;
    try {
      setConfirmation(p => ({ ...p, loading: true }));
      await confirmation.onConfirm();
    } finally {
      hideConfirmation();
    }
  }, [confirmation, hideConfirmation]);

  /* ── Reason dialog helpers (reject / cancel) ── */
  const openReasonDialog = useCallback((opts) => {
    setReasonDialog({
      show: true,
      title: opts.title,
      message: opts.message,
      tone: opts.tone || 'blue',
      confirmText: opts.confirmText || 'Confirm',
      reasonLabel: opts.reasonLabel || 'Reason',
      reasonPlaceholder: opts.reasonPlaceholder || 'Enter a reason…',
      onConfirm: opts.onConfirm,
      loading: false,
    });
  }, []);
  const closeReasonDialog = useCallback(() => setReasonDialog(p => ({ ...p, show: false })), []);
  const handleReasonConfirm = useCallback(async (reason) => {
    if (!reasonDialog.onConfirm) return;
    try {
      setReasonDialog(p => ({ ...p, loading: true }));
      await reasonDialog.onConfirm(reason);
    } finally {
      closeReasonDialog();
    }
  }, [reasonDialog, closeReasonDialog]);

  /* ── Optimistic row patch ── */
  const patchRow = useCallback((id, changes, previousStatus) => {
    setRecords(prev => prev.map(r => r.leave_req_id === id ? { ...r, ...changes } : r));
    if (previousStatus && changes.status && previousStatus !== changes.status) {
      setCounts(prev => {
        const next = { ...prev, byStatus: { ...(prev.byStatus || {}) } };
        if (next.byStatus[previousStatus] != null) {
          next.byStatus[previousStatus] = Math.max(0, next.byStatus[previousStatus] - 1);
        }
        next.byStatus[changes.status] = (next.byStatus[changes.status] || 0) + 1;
        return next;
      });
    }
  }, []);

  /* ── Bulk ── */
  const handleBulkAction = useCallback(async () => {
    if (!canBulk) { showToast('No permission for bulk actions', 'error'); return; }
    if (!bulkAction || selected.length === 0) return;

    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission to delete', 'error'); return; }
      showDeleteConfirmation('Delete Requests',
        `Delete ${selected.length} request(s)? This cannot be undone.`, 'bulkDelete',
        async () => {
          const ids = [...selected];
          setRecords(prev => prev.filter(r => !ids.includes(r.leave_req_id)));
          setTotalItems(prev => Math.max(0, prev - ids.length));
          setSelected([]); setBulkAction('');
          try {
            await Promise.all(ids.map(id => hrAPI.deleteLeaveRequest(id)));
            showToast(`Deleted ${ids.length} request(s)`, 'success');
          } catch {
            showToast('Bulk delete failed — reloading', 'error');
            fetchRecords();
          }
        });
      return;
    }

    if (bulkAction === 'approve') {
      if (!canApprove) { showToast('No permission', 'error'); return; }
      showDeleteConfirmation(
        'Approve Requests',
        `Approve ${selected.length} request(s)?`,
        'action',
        async () => {
          const ids = [...selected];
          setSelected([]); setBulkAction('');
          const results = await Promise.allSettled(ids.map(id => hrAPI.approveLeaveRequest(id)));
          let ok = 0;
          results.forEach((r, i) => {
            if (r.status === 'fulfilled') {
              ok++;
              const prev = records.find(x => x.leave_req_id === ids[i])?.status;
              patchRow(ids[i], { status: 'approved', approved_at: new Date().toISOString() }, prev);
            }
          });
          showToast(`${ok} of ${ids.length} approved`, ok === ids.length ? 'success' : 'warning');
        });
      return;
    }

    if (bulkAction === 'reject') {
      if (!canApprove) { showToast('No permission', 'error'); return; }
      openReasonDialog({
        title: 'Reject Requests',
        message: `Reject ${selected.length} request(s)? A reason is required.`,
        tone: 'red',
        confirmText: 'Reject',
        reasonLabel: 'Rejection Reason',
        reasonPlaceholder: 'Enter rejection reason…',
        onConfirm: async (reason) => {
          const ids = [...selected];
          setSelected([]); setBulkAction('');
          const results = await Promise.allSettled(
            ids.map(id => hrAPI.rejectLeaveRequest(id, reason))
          );
          let ok = 0;
          results.forEach((r, i) => {
            if (r.status === 'fulfilled') {
              ok++;
              const prev = records.find(x => x.leave_req_id === ids[i])?.status;
              patchRow(ids[i], {
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejection_reason: reason,
              }, prev);
            }
          });
          showToast(`${ok} of ${ids.length} rejected`, ok === ids.length ? 'success' : 'warning');
        },
      });
    }
  }, [canBulk, canDelete, canApprove, bulkAction, selected, records, fetchRecords, showToast,
      showDeleteConfirmation, openReasonDialog, patchRow]);

  /* ── Approve (single) ── */
  const handleApprove = useCallback((id) => {
    if (!canApprove) { showToast('No permission to approve', 'error'); return; }
    const rec = records.find(r => r.leave_req_id === id);
    showDeleteConfirmation(
      'Approve Request',
      `Approve leave request for ${rec?.employee?.first_name || 'this employee'}?`,
      'action',
      async () => {
        const prevStatus = rec?.status;
        patchRow(id, { status: 'approved', approved_at: new Date().toISOString() }, prevStatus);
        try {
          await hrAPI.approveLeaveRequest(id);
          showToast('Request approved', 'success');
        } catch (err) {
          patchRow(id, { status: prevStatus, approved_at: rec?.approved_at ?? null }, 'approved');
          showToast(err.response?.data?.message || 'Approval failed', 'error');
        }
      });
  }, [canApprove, records, showToast, showDeleteConfirmation, patchRow]);

  /* ── Reject (single) — uses ReasonConfirmationModal ── */
  const handleReject = useCallback((id) => {
    if (!canApprove) { showToast('No permission to reject', 'error'); return; }
    const rec = records.find(r => r.leave_req_id === id);
    openReasonDialog({
      title: 'Reject Request',
      message: `Reject leave request for ${rec?.employee?.first_name || 'this employee'}? A reason is required.`,
      tone: 'red',
      confirmText: 'Reject',
      reasonLabel: 'Rejection Reason',
      reasonPlaceholder: 'Enter rejection reason…',
      onConfirm: async (reason) => {
        if (!reason || !reason.trim()) return;   // defensive guard
        const prevStatus = rec?.status;
        patchRow(id, {
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        }, prevStatus);
        try {
          await hrAPI.rejectLeaveRequest(id, reason);
          showToast('Request rejected', 'success');
        } catch (err) {
          patchRow(id, {
            status: prevStatus,
            rejected_at: rec?.rejected_at ?? null,
            rejection_reason: rec?.rejection_reason ?? null,
          }, 'rejected');
          showToast(err.response?.data?.message || 'Rejection failed', 'error');
        }
      },
    });
  }, [canApprove, records, showToast, openReasonDialog, patchRow]);

  /* ── Cancel (single) — uses ReasonConfirmationModal ── */
  const handleCancel = useCallback((id) => {
    if (!canCancel) { showToast('No permission to cancel', 'error'); return; }
    const rec = records.find(r => r.leave_req_id === id);
    openReasonDialog({
      title: 'Cancel Leave',
      message: `Cancel leave request for ${rec?.employee?.first_name || 'this employee'}? Balance will be restored. A reason is required.`,
      tone: 'red',
      confirmText: 'Cancel Leave',
      reasonLabel: 'Cancellation Reason',
      reasonPlaceholder: 'Enter cancellation reason…',
      onConfirm: async (reason) => {
        if (!reason || !reason.trim()) return;   // defensive guard
        const prevStatus = rec?.status;
        patchRow(id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        }, prevStatus);
        try {
          await hrAPI.cancelLeaveRequest(id, reason);
          showToast('Request cancelled and balance restored', 'success');
        } catch (err) {
          patchRow(id, {
            status: prevStatus,
            cancelled_at: rec?.cancelled_at ?? null,
            cancellation_reason: rec?.cancellation_reason ?? null,
          }, 'cancelled');
          showToast(err.response?.data?.message || 'Cancellation failed', 'error');
        }
      },
    });
  }, [canCancel, records, showToast, openReasonDialog, patchRow]);

  /* ── Delete ── */
  const handleDelete = useCallback((id) => {
    if (!canDelete) { showToast('No permission to delete', 'error'); return; }
    const rec = records.find(r => r.leave_req_id === id);
    const name = rec?.employee ? `${rec.employee.first_name} ${rec.employee.last_name}` : 'this request';
    showDeleteConfirmation('Delete Request',
      `Delete request for ${name}? This cannot be undone.`, 'delete',
      async () => {
        const snapshot = records;
        const snapTotal = totalItems;
        setRecords(prev => prev.filter(r => r.leave_req_id !== id));
        setTotalItems(prev => Math.max(0, prev - 1));
        try {
          await hrAPI.deleteLeaveRequest(id);
          showToast('Request deleted', 'success');
        } catch {
          setRecords(snapshot); setTotalItems(snapTotal);
          showToast('Failed to delete', 'error');
        }
      });
  }, [canDelete, records, totalItems, showToast, showDeleteConfirmation]);

  const openModal = useCallback((record = null, readOnlyMode = false) => {
    if (record && !readOnlyMode && !canUpdate) { showToast('No permission to edit', 'error'); return; }
    if (!record && !canCreate) { showToast('No permission to create', 'error'); return; }
    setEditingRecord(record); setIsReadOnly(readOnlyMode); setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => { setShowModal(false); setEditingRecord(null); setIsReadOnly(false); }, []);
  const handleRecordSaved = useCallback(() => {
    closeModal(); fetchRecords(); showToast('Request saved successfully', 'success');
  }, [closeModal, fetchRecords, showToast]);

  const filterEmployeeLabel = useMemo(() => {
    if (!filterEmployee) return 'All Employees';
    const name = filterEmployee.display_name
      || [filterEmployee.first_name, filterEmployee.last_name].filter(Boolean).join(' ')
      || filterEmployee.email || `ID: ${filterEmployee.emp_id}`;
    return filterEmployee.employee_code ? `${name} (${filterEmployee.employee_code})` : name;
  }, [filterEmployee]);

  /* ── Export (unchanged) ── */
  const exportToExcel = useCallback(async () => {
    if (!canExport) { showToast('No permission to export', 'error'); return; }
    try {
      setExportLoading(true);
      const fetchLimit = Math.min(Math.max(totalItems, 100), 10000);
      const payload = { page: 1, limit: fetchLimit, sortBy: 'created_at', sortOrder: 'DESC' };
      if (debouncedSearch.trim()) {
        payload.search = debouncedSearch.trim();
        payload.searchFields = 'employee_name,status,reason';
      }
      const fc = buildFilterConditions();
      if (Object.keys(fc).length > 0) payload.filters = fc;

      const response = await hrAPI.getLeaveRequestsAll(payload);
      const rows = response.data?.rows || [];
      if (!rows.length) { showToast('No data to export', 'error'); return; }

      const data = rows.map(r => ({
        'ID': r.leave_req_id ?? '',
        'Employee': r.employee ? `${r.employee.first_name || ''} ${r.employee.last_name || ''}`.trim() : '',
        'Employee Code': r.employee?.employee_code || '',
        'Leave Type': r.leave_type?.name || '',
        'Leave Code': r.leave_type?.code || '',
        'Start Date': r.start_date ? formatDate(r.start_date) : '',
        'End Date': r.end_date ? formatDate(r.end_date) : '',
        'Days': r.days ?? 0,
        'Is Half Day': r.is_half_day ? 'Yes' : 'No',
        'Half Day On': r.half_day_on ? formatDate(r.half_day_on) : '',
        'Half Day Session': r.half_day_session || '',
        'Reason': r.reason || '',
        'Emergency': r.emergency_leave ? 'Yes' : 'No',
        'Contact During Leave': r.contact_during_leave || '',
        'Status': r.status || '',
        'Approval Level': r.current_approval_level ?? 0,
        'Approved By': r.approved_by ?? '',
        'Approved At': r.approved_at ? formatDateTime(r.approved_at) : '',
        'Rejected By': r.rejected_by ?? '',
        'Rejected At': r.rejected_at ? formatDateTime(r.rejected_at) : '',
        'Rejection Reason': r.rejection_reason || '',
        'Cancelled By': r.cancelled_by ?? '',
        'Cancelled At': r.cancelled_at ? formatDateTime(r.cancelled_at) : '',
        'Cancellation Reason': r.cancellation_reason || '',
        'Attachment URL': r.attachment_url || '',
        'Attachments': r.attachments?.length || 0,
        'Balance Before': r.balance_before ?? '',
        'Balance After': r.balance_after ?? '',
        'Notified Employee': r.notified_employee ? 'Yes' : 'No',
        'Notified Manager': r.notified_manager ? 'Yes' : 'No',
        'Created By': r.created_by ?? '',
        'Updated By': r.updated_by ?? '',
        'Created At': r.createdAt ? formatDateTime(r.createdAt) : '',
        'Updated At': r.updatedAt ? formatDateTime(r.updatedAt) : '',
        'Deleted At': r.deletedAt ? formatDateTime(r.deletedAt) : '',
      }));

      const rules = [
        { Section: 'Status', Rule: 'pending', Meaning: 'Awaiting manager approval' },
        { Section: 'Status', Rule: 'approved', Meaning: 'Approved — leave balance deducted' },
        { Section: 'Status', Rule: 'partially_approved', Meaning: 'Approved for some dates only' },
        { Section: 'Status', Rule: 'rejected', Meaning: 'Rejected by approver' },
        { Section: 'Status', Rule: 'cancelled', Meaning: 'Cancelled — balance restored' },
        { Section: 'Status', Rule: 'withdrawn', Meaning: 'Withdrawn by employee' },
        { Section: 'Workflow', Rule: 'pending → (Approve) → approved', Meaning: 'Manager approval' },
        { Section: 'Workflow', Rule: 'pending → (Reject) → rejected', Meaning: 'Manager rejection (reason required)' },
        { Section: 'Workflow', Rule: 'approved → (Cancel) → cancelled', Meaning: 'Cancellation restores balance (reason required)' },
        { Section: 'Workflow', Rule: 'New requests always start as Pending', Meaning: 'Create flow' },
      ];

      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(data);
      const wsRules = XLSX.utils.json_to_sheet(rules);
      wsData['!cols'] = [
        { wch: 8 }, { wch: 26 }, { wch: 14 }, { wch: 18 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
        { wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 16 },
        { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
        { wch: 30 }, { wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 30 },
        { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
        { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      ];
      wsRules['!cols'] = [{ wch: 14 }, { wch: 52 }, { wch: 52 }];

      XLSX.utils.book_append_sheet(wb, wsData, 'Leave Requests');
      XLSX.utils.book_append_sheet(wb, wsRules, 'Rules & Legend');

      XLSX.writeFile(wb, `leave_requests_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast(`Exported ${data.length} request(s) to Excel`, 'success');
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
        <div><p className="text-xs text-gray-600">Manage leave requests</p></div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          <button type="button" onClick={() => setShowEmployeeFilterModal(true)}
            className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${filterEmployee ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            title="Filter by employee">
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
              <Plus className="w-2.5 h-2.5" /> New Request
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
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
                    <Icon className={`w-3 h-3 ${active ? tab.color : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${active ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>{tab.count}</span>
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
                <input type="text" placeholder="Search employees, status, reason..."
                  value={filters.search} onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-56 text-xs" />
              </div>

              {canBulk && selected.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk Actions</option>
                    {canApprove && <option value="approve">Approve</option>}
                    {canApprove && <option value="reject">Reject</option>}
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
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Requests</h3>
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
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">End</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Half Day</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">HD On</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Emergency</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Lvl</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Approved At</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Rejected By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Rejected At</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Reject Reason</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Cancelled By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Cancelled At</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Cancel Reason</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Attachment</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Att. Cnt</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Bal Before</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Bal After</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Notif Emp</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Notif Mgr</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">CBy</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">UBy</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Deleted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map(rec => (
                  <RequestRow key={rec.leave_req_id} record={rec}
                    canBulk={canBulk} selected={selected} toggleSelection={toggleSelection}
                    canUpdate={canUpdate} canDelete={canDelete}
                    canApprove={canApprove} canCancel={canCancel}
                    openModal={openModal} handleDelete={handleDelete}
                    handleApprove={handleApprove} handleReject={handleReject} handleCancel={handleCancel} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No leave requests found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {hasActiveFilters ? 'No records match your filter criteria.' : 'Get started by creating your first leave request.'}
                </p>
                {canCreate && (
                  <button onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto">
                    <Plus className="w-2.5 h-2.5" /> New Request
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-3 text-[9px] text-gray-700">
            <span className="font-medium text-gray-600">Status Legend:</span>
            <div className="flex items-center gap-1"><StatusBadge status="pending" /><span>Awaiting approval</span></div>
            <div className="flex items-center gap-1"><StatusBadge status="approved" /><span>Approved (balance deducted)</span></div>
            <div className="flex items-center gap-1"><StatusBadge status="partially_approved" /><span>Partially approved</span></div>
            <div className="flex items-center gap-1"><StatusBadge status="rejected" /><span>Rejected</span></div>
            <div className="flex items-center gap-1"><StatusBadge status="cancelled" /><span>Cancelled (balance restored)</span></div>
            <div className="flex items-center gap-1"><StatusBadge status="withdrawn" /><span>Withdrawn</span></div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[9px] text-gray-600 mt-1">
            <span className="font-medium text-gray-600">Workflow:</span>
            <span className="inline-flex items-center gap-1">
              <StatusBadge status="pending" />
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-gray-700">(Approve)</span>
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <StatusBadge status="approved" />
            </span>
            <span className="text-gray-400">|</span>
            <span className="inline-flex items-center gap-1">
              <StatusBadge status="pending" />
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-gray-700">(Reject — reason required)</span>
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <StatusBadge status="rejected" />
            </span>
            <span className="text-gray-400">|</span>
            <span className="inline-flex items-center gap-1">
              <StatusBadge status="approved" />
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-gray-700">(Cancel — reason required)</span>
              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
              <StatusBadge status="cancelled" />
            </span>
            <span className="text-gray-400">|</span>
            <span className="italic text-gray-500">
              New requests always start as <span className="font-medium">Pending</span>.
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
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{pageNum}</button>
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

      {/* ── MODALS ── */}
      <Suspense fallback={null}>
        {showModal && (
          <LeaveRequestModal show={showModal} record={editingRecord} readOnly={isReadOnly}
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

      {/* Generic confirmation — DELETE only */}
      <Suspense fallback={null}>
        {confirmation.show && (
          <ConfirmationModal
            show={confirmation.show}
            title={confirmation.title}
            message={confirmation.message}
            type={confirmation.type}
            onConfirm={handleConfirm}
            onCancel={hideConfirmation}
            loading={confirmation.loading}
          />
        )}
      </Suspense>

      {/* Reason confirmation — REJECT / CANCEL only */}
      <ReasonConfirmationModal
        show={reasonDialog.show}
        title={reasonDialog.title}
        message={reasonDialog.message}
        tone={reasonDialog.tone}
        confirmText={reasonDialog.confirmText}
        reasonLabel={reasonDialog.reasonLabel}
        reasonPlaceholder={reasonDialog.reasonPlaceholder}
        onConfirm={handleReasonConfirm}
        onCancel={closeReasonDialog}
        loading={reasonDialog.loading}
      />
    </div>
  );
};

export default LeaveRequestManagement;