// src/modules/Leave/Leave_rules/LeaveRuleManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense, useRef } from 'react';
import {
  Search, Edit, Trash2, Plus, Eye, Download, Upload, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle, AlertCircle, Ban, Users, Power, PowerOff, Loader,
  ArrowRight, X, SlidersHorizontal, FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveRuleModal    = lazy(() => import('./LeaveRuleModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal       = lazy(() => import('../../../../components/common/ImportModal'));
const Toast             = lazy(() => import('../../../../components/common/Toast'));

/* ──────────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────────── */
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const formatArray = (arr, max = 3) => {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  if (arr.length <= max) return arr.join(', ');
  return `${arr.slice(0, max).join(', ')} +${arr.length - max}`;
};

/* Normalize status from any server shape to 'active' | 'inactive' */
const normalizeStatus = (raw, row) => {
  const source = raw ?? row?.is_active ?? row?.isActive ?? row?.status_id ?? row?.statusId;
  if (source === undefined || source === null || source === '') return 'active';
  const v = String(source).toLowerCase().trim();
  if (['active', '1', 'true', 'yes', 'y', 'enabled', 'on'].includes(v)) return 'active';
  if (['inactive', '0', 'false', 'no', 'n', 'disabled', 'off'].includes(v)) return 'inactive';
  return 'active';
};

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

/* ──────────────────────────────────────────────────────────────────
   BADGES
────────────────────────────────────────────────────────────────── */
const StatusBadge = memo(({ status }) => {
  const normalized = normalizeStatus(status);
  const colors = {
    active:   'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
  };
  const Icon = normalized === 'active' ? CheckCircle : AlertCircle;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1 py-0 rounded-full text-[10px] font-medium ${colors[normalized]}`}>
      <Icon className="w-2.5 h-2.5" /> {normalized}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const YesNo = memo(({ value }) => (
  value
    ? <span className="inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-green-100 text-green-700">Yes</span>
    : <span className="inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-red-100 text-red-700">No</span>
));
YesNo.displayName = 'YesNo';

const ColorSwatch = memo(({ color }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0"
    style={{ backgroundColor: color || '#ccc' }} aria-hidden="true" />
));
ColorSwatch.displayName = 'ColorSwatch';

const getStatusColor = (status) => ({
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
}[normalizeStatus(status)] || 'bg-gray-100 text-gray-700');

const getAccrualColor = (method) => ({
  monthly:     'bg-blue-100 text-blue-700',
  yearly:      'bg-purple-100 text-purple-700',
  quarterly:   'bg-green-100 text-green-700',
  per_project: 'bg-orange-100 text-orange-700',
  none:        'bg-gray-100 text-gray-700',
}[method] || 'bg-gray-100 text-gray-700');

/* ──────────────────────────────────────────────────────────────────
   ROW
────────────────────────────────────────────────────────────────── */
const RuleRow = memo(({
  record, canBulk, selected, toggleSelection,
  canUpdate, canDelete, canUpdateStatus,
  openModal, handleDelete, handleStatusUpdate, handleToggleStatus, togglingStatusIds,
}) => {
  const isSelected = selected.includes(record.leave_rule_id);
  const normalizedStatus = normalizeStatus(record.status, record);
  const isActive = normalizedStatus === 'active';
  const isToggling = togglingStatusIds?.has(record.leave_rule_id);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5 whitespace-nowrap">
          <input type="checkbox" checked={isSelected}
            onChange={() => toggleSelection(record.leave_rule_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
            aria-label="Select rule" />
        </td>
      )}

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => openModal(record, true)}
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50"
            title="View" aria-label="View rule"><Eye className="w-3 h-3" /></button>

          {canUpdate && (
            <button type="button" onClick={() => openModal(record, false)}
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
              title="Edit" aria-label="Edit rule"><Edit className="w-3 h-3" /></button>
          )}

          {canUpdateStatus && (
            <button
              type="button"
              onClick={() => handleToggleStatus(record)}
              disabled={isToggling}
              title={isActive ? 'Deactivate' : 'Activate'}
              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${isToggling ? 'opacity-50 cursor-wait' :
                  isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
                }`}
            >
              {isToggling ? <Loader className="w-3 h-3 animate-spin" /> :
                isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
            </button>
          )}

          {canDelete && (
            <button type="button" onClick={() => handleDelete(record.leave_rule_id)}
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
              title="Delete" aria-label="Delete rule"><Trash2 className="w-3 h-3" /></button>
          )}
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{dash(record.leave_rule_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <span className={`inline-flex items-center px-1 py-0 rounded-full text-[10px] font-medium ${getAccrualColor(record.accrual_method)}`}>
          {record.accrual_method || '—'}
        </span>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700">
        <div className="flex items-center gap-1">
          <ColorSwatch color={record.leave_type?.color} />
          <span>{record.leave_type?.name || '—'}</span>
          {record.leave_type?.code && <span className="text-gray-400 text-[10px]">({record.leave_type.code})</span>}
        </div>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.accrual_rate ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.accrual_frequency || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.accrual_start_from || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.max_balance ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.min_service_days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.min_age ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.min_tenure_months ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[140px] truncate" title={record.employment_types?.join(', ') || ''}>
        {formatArray(record.employment_types)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[100px] truncate" title={record.dept_ids?.join(', ') || ''}>
        {formatArray(record.dept_ids)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[100px] truncate" title={record.position_ids?.join(', ') || ''}>
        {formatArray(record.position_ids)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.gender_restriction || 'both'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.probation_only} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.exclude_terminated} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.carry_over_allowed} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.carry_over_max ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.carry_over_expiry_months ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.carry_over_priority || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.notice_period_days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.max_consecutive_days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.min_gap_days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.half_day_allowed} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.max_requests_per_month ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.auto_approve_threshold ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.escalation_hours ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.delegate_allowed} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.deduction_percentage ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.encashment_allowed} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.encashment_cap ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.exclude_weekends} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.exclude_holidays} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.requires_document} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[140px] truncate" title={record.document_types?.join(', ') || ''}>
        {formatArray(record.document_types)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{record.inherited_from || '—'}</td>

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        {canUpdateStatus ? (
          <select
            value={normalizedStatus}
            onChange={(e) => handleStatusUpdate(record.leave_rule_id, e.target.value)}
            className={`text-[10px] font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1 py-0 ${getStatusColor(normalizedStatus)}`}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        ) : (
          <StatusBadge status={normalizedStatus} />
        )}
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.createdAt)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.updatedAt)}</td>
    </tr>
  );
});
RuleRow.displayName = 'RuleRow';

/* ──────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────── */
const LeaveRuleManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage       = useMemo(() => isAdmin, [isAdmin]);
  const canCreate       = useMemo(() => hasPermission('create', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate       = useMemo(() => hasPermission('update', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'leaverule', 'A4') || canUpdate, [hasPermission, canUpdate]);
  const canDelete       = useMemo(() => hasPermission('delete', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk         = useMemo(() => hasPermission('bulk', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canExport       = useMemo(() => hasPermission('export', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canImport       = useMemo(() => hasPermission('import', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);

  const [rules, setRules] = useState([]);
  const [counts, setCounts] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const togglingStatusIdsRef = useRef(new Set());
  useEffect(() => { togglingStatusIdsRef.current = togglingStatusIds; }, [togglingStatusIds]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    accrual_method: 'all',
    carry_over_allowed: 'all',
    exclude_weekends: 'all',
    page: 1,
    limit: 50,
  });
  const debouncedSearch = useDebounce(filters.search, 300);

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null, loading: false,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const accrualMethods = useMemo(() => [
    { value: 'monthly',     label: 'Monthly' },
    { value: 'yearly',      label: 'Yearly' },
    { value: 'quarterly',   label: 'Quarterly' },
    { value: 'per_project', label: 'Per Project' },
    { value: 'none',        label: 'None' },
  ], []);

  const booleanOptions = useMemo(() => [
    { value: 'all',   label: 'All' },
    { value: 'true',  label: 'Yes' },
    { value: 'false', label: 'No' },
  ], []);

  const buildFilterConditions = useCallback(() => {
    const fc = {};
    if (filters.accrual_method !== 'all') fc.accrual_method = filters.accrual_method;
    if (filters.carry_over_allowed !== 'all') fc.carry_over_allowed = filters.carry_over_allowed === 'true';
    if (filters.exclude_weekends !== 'all') fc.exclude_weekends = filters.exclude_weekends === 'true';
    return fc;
  }, [filters]);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        page: filters.page,
        limit: filters.limit,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };
      if (debouncedSearch.trim()) {
        payload.search = debouncedSearch.trim();
        payload.searchFields = 'accrual_method,leave_type_name';
      }
      const fc = buildFilterConditions();
      if (Object.keys(fc).length > 0) payload.filters = fc;

      const response = await hrAPI.getLeaveRulesAll(payload);
      const data = response.data;
      if (data?.success) {
        const incoming = (data.rows || []).map(r => ({
          ...r,
          status: normalizeStatus(r.status, r),
        }));

        setRules(prev => {
          const pendingStatus = new Map();
          prev.forEach(r => {
            if (togglingStatusIdsRef.current.has(r.leave_rule_id)) {
              pendingStatus.set(r.leave_rule_id, r.status);
            }
          });
          return incoming.map(r => {
            if (pendingStatus.has(r.leave_rule_id)) {
              return { ...r, status: pendingStatus.get(r.leave_rule_id) };
            }
            return r;
          });
        });

        setCounts(data.counts || { total: 0 });
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load leave rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, buildFilterConditions]);

  useEffect(() => { fetchRules(); /* eslint-disable-next-line */ }, [filters, debouncedSearch]);

  const filtered = useMemo(() => {
    let result = [...rules];
    if (activeTab !== 'all') result = result.filter(r => r.accrual_method === activeTab);
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(r =>
        r.accrual_method?.toLowerCase().includes(term) ||
        r.leave_type?.name?.toLowerCase().includes(term) ||
        r.leave_type?.code?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [rules, activeTab, debouncedSearch]);

  const pagination = useMemo(() => {
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / filters.limit));
    const page = Math.min(filters.page, totalPages) || 1;
    const start = (page - 1) * filters.limit;
    return {
      page, totalItems, totalPages,
      paginated: filtered.slice(start, start + filters.limit),
    };
  }, [filtered, filters.page, filters.limit]);

  const tabs = useMemo(() => {
    const all = rules.length;
    return [
      { id: 'all', name: 'All', count: all, icon: Users, color: 'text-gray-600' },
      ...accrualMethods.map(m => ({
        id: m.value, name: m.label,
        count: rules.filter(r => r.accrual_method === m.value).length,
        icon: Ban, color: 'text-gray-500',
      })),
    ];
  }, [rules, accrualMethods]);

  const handleStatusChange = useCallback((status) => {
    setActiveTab(status); setFilters(p => ({ ...p, page: 1 }));
  }, []);
  const handleSearchChange = useCallback((v) => setFilters(p => ({ ...p, search: v, page: 1 })), []);
  const handleLimitChange  = useCallback((v) => setFilters(p => ({ ...p, limit: parseInt(v), page: 1 })), []);
  const handlePageChange   = useCallback((n) => {
    if (n >= 1 && n <= Math.max(pagination.totalPages, 1)) setFilters(p => ({ ...p, page: n }));
  }, [pagination.totalPages]);

  const handleFilterChange = useCallback((key, val) => {
    setFilters(p => ({ ...p, [key]: val, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '', accrual_method: 'all', carry_over_allowed: 'all',
      exclude_weekends: 'all', page: 1, limit: 50,
    });
    setActiveTab('all');
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const handleRefresh = useCallback(() => fetchRules(), [fetchRules]);

  const hasActiveFilters = useMemo(() => (
    filters.search !== '' ||
    filters.accrual_method !== 'all' ||
    filters.carry_over_allowed !== 'all' ||
    filters.exclude_weekends !== 'all' ||
    activeTab !== 'all'
  ), [filters, activeTab]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = pagination.paginated.map(r => r.leave_rule_id);
    setSelectedIds(selectedIds.length === ids.length ? [] : ids);
  }, [canBulk, pagination.paginated, selectedIds]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm, loading: false });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(async () => {
    if (!confirmation.onConfirm) return;
    try {
      setConfirmation(p => ({ ...p, loading: true }));
      await confirmation.onConfirm();
    } finally { hideConfirmation(); }
  }, [confirmation, hideConfirmation]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || selectedIds.length === 0) return;

    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission', 'error'); return; }
      showConfirmation(
        'Delete Rules',
        `Delete ${selectedIds.length} rule(s)? This cannot be undone.`,
        'bulkDelete',
        async () => {
          const ids = [...selectedIds];
          const snapshot = rules;
          setRules(prev => prev.filter(r => !ids.includes(r.leave_rule_id)));
          setSelectedIds([]); setBulkAction('');
          try {
            await Promise.all(ids.map(id => hrAPI.deleteLeaveRule(id)));
            showToast(`Deleted ${ids.length} rule(s)`, 'success');
          } catch {
            setRules(snapshot);
            showToast('Bulk delete failed', 'error');
          }
        }
      );
      return;
    }

    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }
    const targetStatus = bulkAction;
    const ids = [...selectedIds];
    const snapshot = rules;
    setRules(prev => prev.map(r => ids.includes(r.leave_rule_id) ? { ...r, status: targetStatus } : r));
    setSelectedIds([]); setBulkAction('');
    try {
      await Promise.all(ids.map(id => hrAPI.updateLeaveRule(id, { status: targetStatus })));
      showToast(`Updated ${ids.length} rule(s) to "${targetStatus}"`, 'success');
    } catch {
      setRules(snapshot);
      showToast('Bulk update failed', 'error');
    }
  }, [canBulk, canDelete, canUpdateStatus, bulkAction, selectedIds, rules, showToast, showConfirmation]);

  const handleStatusUpdate = useCallback(async (id, nextStatus) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }

    const current = rules.find(r => r.leave_rule_id === id);
    const currentStatus = normalizeStatus(current?.status);
    if (currentStatus === nextStatus) return;

    setRules(prev =>
      prev.map(r => r.leave_rule_id === id ? { ...r, status: nextStatus } : r)
    );

    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await hrAPI.updateLeaveRule(id, { status: nextStatus });
      showToast('Status updated', 'success');
    } catch (err) {
      setRules(prev =>
        prev.map(r => r.leave_rule_id === id ? { ...r, status: currentStatus } : r)
      );
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }, [canUpdateStatus, rules, showToast]);

  const handleToggleStatus = useCallback(async (rule) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }

    const id = rule.leave_rule_id;
    const current = rules.find(r => r.leave_rule_id === id);
    const currentStatus = normalizeStatus(current?.status);
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    setRules(prev =>
      prev.map(x => x.leave_rule_id === id ? { ...x, status: nextStatus } : x)
    );

    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await hrAPI.updateLeaveRule(id, { status: nextStatus });
      showToast(`Rule ${nextStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      setRules(prev =>
        prev.map(x => x.leave_rule_id === id ? { ...x, status: currentStatus } : x)
      );
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }, [canUpdateStatus, rules, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const rule = rules.find(r => r.leave_rule_id === id);
    showConfirmation(
      'Delete Rule',
      `Delete rule for "${rule?.leave_type?.name || 'this rule'}"? This cannot be undone.`,
      'delete',
      async () => {
        const snapshot = rules;
        setRules(prev => prev.filter(r => r.leave_rule_id !== id));
        try {
          await hrAPI.deleteLeaveRule(id);
          showToast('Rule deleted', 'success');
        } catch {
          setRules(snapshot);
          showToast('Delete failed', 'error');
        }
      }
    );
  }, [canDelete, rules, showToast, showConfirmation]);

  const openModal = useCallback((rule = null, readOnlyMode = false) => {
    if (rule && !readOnlyMode && !canUpdate) { showToast('No permission', 'error'); return; }
    if (!rule && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingRule(rule);
    setIsReadOnly(readOnlyMode);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false); setEditingRule(null); setIsReadOnly(false);
  }, []);

  const handleSaved = useCallback(() => {
    closeModal(); fetchRules(); showToast('Rule saved', 'success');
  }, [closeModal, fetchRules, showToast]);

  const sampleRules = useMemo(() => ([
    ['accrual_method', 'leave_type_id', 'carry_over_allowed', 'max_balance', 'accrual_rate', 'exclude_weekends'],
    ['monthly', '1', 'true', '20', '1.5', 'true'],
    ['yearly',  '2', 'false', '15', '12',  'false'],
  ]), []);

  const downloadSampleCSV = useCallback(() => {
    const csv = sampleRules.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leave_rules_import_template.csv';
    link.click();
    showToast('Sample CSV downloaded', 'info');
  }, [sampleRules, showToast]);

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) { showToast('No permission to import', 'error'); return; }
    try {
      const rulesToImport = parsedRows.map((row, i) => {
        if (!row.accrual_method) throw new Error(`Row ${i + 1}: accrual_method required`);
        if (!row.leave_type_id) throw new Error(`Row ${i + 1}: leave_type_id required`);
        return {
          accrual_method: row.accrual_method,
          leave_type_id: parseInt(row.leave_type_id),
          carry_over_allowed: row.carry_over_allowed === 'true',
          max_balance: parseFloat(row.max_balance) || 0,
          accrual_rate: parseFloat(row.accrual_rate) || 0,
          exclude_weekends: row.exclude_weekends === 'true',
        };
      });
      await Promise.all(rulesToImport.map(rule => hrAPI.createLeaveRule(rule)));
      showToast(`Imported ${rulesToImport.length} rule(s)`, 'success');
      setShowImportModal(false);
      fetchRules();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [canImport, fetchRules, showToast]);

  const exportToExcel = useCallback(async () => {
    if (!canExport) { showToast('No permission to export', 'error'); return; }
    if (!filtered.length) { showToast('No data to export', 'error'); return; }
    try {
      setExportLoading(true);

      const data = filtered.map(r => ({
        'ID': r.leave_rule_id ?? '',
        'Method': r.accrual_method || '',
        'Leave Type': r.leave_type?.name || '',
        'Leave Code': r.leave_type?.code || '',
        'Rate': r.accrual_rate ?? 0,
        'Frequency': r.accrual_frequency || '',
        'Start From': r.accrual_start_from || '',
        'Fixed Date': r.fixed_accrual_date || '',
        'Pro Rata': r.pro_rata_for_new_hire ? 'Yes' : 'No',
        'Max Balance': r.max_balance ?? 0,
        'Min Service Days': r.min_service_days ?? 0,
        'Min Age': r.min_age ?? 0,
        'Min Tenure Months': r.min_tenure_months ?? 0,
        'Employment Types': formatArray(r.employment_types, 999),
        'Dept IDs': formatArray(r.dept_ids, 999),
        'Position IDs': formatArray(r.position_ids, 999),
        'Gender': r.gender_restriction || '',
        'Work Location IDs': formatArray(r.work_location_ids, 999),
        'Employee Statuses': formatArray(r.employee_statuses, 999),
        'Probation Only': r.probation_only ? 'Yes' : 'No',
        'Exclude Terminated': r.exclude_terminated ? 'Yes' : 'No',
        'Carry Over': r.carry_over_allowed ? 'Yes' : 'No',
        'Carry Over Max': r.carry_over_max ?? 0,
        'Carry Over Expiry Months': r.carry_over_expiry_months ?? 0,
        'Carry Over Priority': r.carry_over_priority || '',
        'Notice Period Days': r.notice_period_days ?? 0,
        'Max Consecutive Days': r.max_consecutive_days ?? 0,
        'Min Gap Days': r.min_gap_days ?? 0,
        'Half Day': r.half_day_allowed ? 'Yes' : 'No',
        'Max Requests/Month': r.max_requests_per_month ?? 0,
        'Auto Approve Threshold': r.auto_approve_threshold ?? 0,
        'Escalation Hours': r.escalation_hours ?? 0,
        'Delegate': r.delegate_allowed ? 'Yes' : 'No',
        'Deduction %': r.deduction_percentage ?? 0,
        'Encashment': r.encashment_allowed ? 'Yes' : 'No',
        'Encashment Cap': r.encashment_cap ?? 0,
        'Exclude Weekends': r.exclude_weekends ? 'Yes' : 'No',
        'Exclude Holidays': r.exclude_holidays ? 'Yes' : 'No',
        'Requires Document': r.requires_document ? 'Yes' : 'No',
        'Document Types': formatArray(r.document_types, 999),
        'Inherited From': r.inherited_from || '',
        'Status': normalizeStatus(r.status, r),
        'Created By': r.created_by ?? '',
        'Updated By': r.updated_by ?? '',
        'Created At': r.createdAt ? formatDateTime(r.createdAt) : '',
        'Updated At': r.updatedAt ? formatDateTime(r.updatedAt) : '',
      }));

      const rules = [
        { Section: 'Status',   Rule: 'active',   Meaning: 'Rule is applied to leave calculations' },
        { Section: 'Status',   Rule: 'inactive', Meaning: 'Rule is disabled' },
        { Section: 'Workflow', Rule: 'active → (Deactivate) → inactive', Meaning: 'Disables the rule' },
        { Section: 'Workflow', Rule: 'inactive → (Activate) → active',   Meaning: 'Re-enables the rule' },
        { Section: 'Workflow', Rule: 'New rules start as active',        Meaning: 'Create flow' },
      ];

      const wb = XLSX.utils.book_new();
      const wsData  = XLSX.utils.json_to_sheet(data);
      const wsRules = XLSX.utils.json_to_sheet(rules);
      wsData['!cols'] = [
        { wch: 8 },  { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 8 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
        { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 26 }, { wch: 14 },
        { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 14 },
        { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 18 },
        { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
        { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 20 },
        { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
        { wch: 20 },
      ];
      wsRules['!cols'] = [{ wch: 14 }, { wch: 44 }, { wch: 48 }];

      XLSX.utils.book_append_sheet(wb, wsData,  'Leave Rules');
      XLSX.utils.book_append_sheet(wb, wsRules, 'Rules & Legend');
      XLSX.writeFile(wb, `leave_rules_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast(`Exported ${data.length} rule(s) to Excel`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, filtered, showToast]);

  return (
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      {/* ── TOP TOOLBAR ── */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage leave accrual rules</p></div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          {canImport && (
            <>
              <button type="button" onClick={downloadSampleCSV}
                className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                title="Download sample CSV">
                <FileText className="w-2.5 h-2.5" /> Sample
              </button>
              <button type="button" onClick={() => setShowImportModal(true)}
                className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <Upload className="w-2.5 h-2.5" /> Import
              </button>
            </>
          )}
          {canExport && (
            <button type="button" onClick={exportToExcel} disabled={exportLoading}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Export current filtered data to Excel (.xlsx)">
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting…' : 'Export'}
            </button>
          )}
          <button type="button" onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          {canCreate && (
            <button type="button" onClick={() => openModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium">
              <Plus className="w-2.5 h-2.5" /> New Rule
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

              <button type="button" onClick={() => setShowAdvancedFilters(s => !s)}
                className={`px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-0.5 border transition-colors ${
                  showAdvancedFilters || hasActiveFilters
                    ? 'bg-primary-100 text-primary-700 border-primary-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                }`}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Filters {hasActiveFilters && '•'}
              </button>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search method, leave type..."
                  value={filters.search} onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-56 text-xs" />
              </div>

              {canBulk && selectedIds.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && <option value="active">Activate</option>}
                    {canUpdateStatus && <option value="inactive">Deactivate</option>}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium">
                    Apply
                  </button>
                  <span className="text-xs text-primary-700 font-medium">{selectedIds.length} selected</span>
                </div>
              )}
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Accrual Method</label>
                  <select value={filters.accrual_method} onChange={e => handleFilterChange('accrual_method', e.target.value)}
                    className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                    {accrualMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Carry Over</label>
                  <select value={filters.carry_over_allowed} onChange={e => handleFilterChange('carry_over_allowed', e.target.value)}
                    className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    {booleanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Exclude Weekends</label>
                  <select value={filters.exclude_weekends} onChange={e => handleFilterChange('exclude_weekends', e.target.value)}
                    className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    {booleanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Per Page</label>
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)}
                    className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option>
                    <option value="25">25</option><option value="50">50</option><option value="100">100</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-1 bg-blue-50 rounded border border-blue-200 mt-1.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-medium text-blue-800">Filters:</span>
                    {filters.search && <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Search: "{filters.search}" <button onClick={() => handleSearchChange('')} className="ml-0.5 text-blue-600 hover:text-blue-800"><X className="w-2.5 h-2.5" /></button></span>}
                    {filters.accrual_method !== 'all' && <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Method: {accrualMethods.find(m => m.value === filters.accrual_method)?.label} <button onClick={() => handleFilterChange('accrual_method', 'all')}><X className="w-2.5 h-2.5" /></button></span>}
                    {filters.carry_over_allowed !== 'all' && <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Carry: {filters.carry_over_allowed === 'true' ? 'Yes' : 'No'} <button onClick={() => handleFilterChange('carry_over_allowed', 'all')}><X className="w-2.5 h-2.5" /></button></span>}
                    {filters.exclude_weekends !== 'all' && <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Wknd: {filters.exclude_weekends === 'true' ? 'Yes' : 'No'} <button onClick={() => handleFilterChange('exclude_weekends', 'all')}><X className="w-2.5 h-2.5" /></button></span>}
                  </div>
                  <button onClick={clearFilters} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">Clear all</button>
                </div>
              )}
            </div>
          )}
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
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Leave Rules</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchRules} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : pagination.paginated.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input type="checkbox"
                        checked={selectedIds.length === pagination.paginated.length && pagination.paginated.length > 0}
                        onChange={toggleSelectAll} disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3" />
                    </th>
                  )}
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Rate</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Freq</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Max Bal</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Min Svc</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Age</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Tenure</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Emp Types</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Depts</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Positions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Gender</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Probation</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Excl. Term.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Carry Over</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Carry Max</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Carry Exp.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Notice</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Max Con.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Min Gap</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Half Day</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Max Req/Mo</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Auto Appr.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Esc. Hrs</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Delegate</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Ded %</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Encash</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Enc. Cap</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Excl. Wknd</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Excl. Hol.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Doc Req.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Doc Types</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Inherited</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">CBy</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">UBy</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagination.paginated.map(r => (
                  <RuleRow key={r.leave_rule_id} record={r}
                    canBulk={canBulk} selected={selectedIds} toggleSelection={toggleSelection}
                    canUpdate={canUpdate} canDelete={canDelete} canUpdateStatus={canUpdateStatus}
                    openModal={openModal} handleDelete={handleDelete}
                    handleStatusUpdate={handleStatusUpdate} handleToggleStatus={handleToggleStatus}
                    togglingStatusIds={togglingStatusIds} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No leave rules found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {hasActiveFilters ? 'No records match your filter criteria.' : 'Get started by adding your first rule.'}
                </p>
                {canCreate && (
                  <button onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto">
                    <Plus className="w-2.5 h-2.5" /> New Rule
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span>Showing</span>
                <span className="font-medium">{(pagination.page - 1) * filters.limit + 1}</span>
                <span>to</span>
                <span className="font-medium">{Math.min(pagination.page * filters.limit, pagination.totalItems)}</span>
                <span>of</span>
                <span className="font-medium">{pagination.totalItems}</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) pageNum = i + 1;
                  else if (pagination.page <= 3) pageNum = i + 1;
                  else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                  else pageNum = pagination.page - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                      className={`w-6 h-6 text-xs rounded border transition-colors ${pagination.page === pageNum ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{pageNum}</button>
                  );
                })}
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <Suspense fallback={null}>
        {showModal && (
          <LeaveRuleModal
            show={showModal}
            rule={editingRule}
            readOnly={isReadOnly}
            onClose={closeModal}
            onSaved={handleSaved}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Leave Rules"
            requiredHeaders={['accrual_method', 'leave_type_id', 'carry_over_allowed', 'max_balance']}
            sampleRows={sampleRules}
            formatDescription="Required: accrual_method, leave_type_id, carry_over_allowed, max_balance. Optional: accrual_rate, exclude_weekends."
            validateRow={(row, i) => {
              if (!row.accrual_method) throw new Error(`Row ${i + 1}: accrual_method required`);
              if (!row.leave_type_id) throw new Error(`Row ${i + 1}: leave_type_id required`);
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
            loading={confirmation.loading}
          />
        )}
      </Suspense>
    </div>
  );
};

export default LeaveRuleManagement;