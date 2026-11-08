// src/modules/Suppliers/SupplierManagement.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  Search, Edit, Trash2, Plus, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle, AlertCircle, Truck, ShieldAlert, Ban, Clock,
  Eye, Power, PowerOff, Loader,
  Send, PlayCircle, ShieldCheck, RotateCcw, XCircle, AlertTriangle, Archive,
} from 'lucide-react';
import { suppliersAPI } from '../../../../services/api';
import { usePermissions } from '../../../../hooks/usePermissions';

const SupplierModal = lazy(() => import('./SupplierModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const formatDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

function useDebounce(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const STATUS_COLOR = {
  DRAFT: 'text-gray-600',
  PENDING_APPROVAL: 'text-amber-700',
  ACTIVE: 'text-green-700',
  INACTIVE: 'text-gray-500',
  SUSPENDED: 'text-orange-700',
  BLACKLISTED: 'text-red-700',
  PROBATION: 'text-yellow-700',
  ARCHIVED: 'text-gray-500',
};

const RISK_COLOR = {
  LOW: 'text-green-700',
  MEDIUM: 'text-amber-700',
  HIGH: 'text-orange-700',
  CRITICAL: 'text-red-700',
};

/* ---------- Context-aware quick actions per status ---------- */
const QUICK_ACTIONS = {
  DRAFT: [
    { Icon: Send,        color: 'text-blue-600 hover:bg-blue-50',        title: 'Submit for Approval',        nextStatus: 'PENDING_APPROVAL' },
    { Icon: Ban,         color: 'text-red-600 hover:bg-red-50',          title: 'Blacklist',                  nextStatus: 'BLACKLISTED' },
  ],
  PENDING_APPROVAL: [
    { Icon: CheckCircle, color: 'text-green-600 hover:bg-green-50',     title: 'Approve → Probation',        nextStatus: 'PROBATION' },
    { Icon: XCircle,     color: 'text-red-600 hover:bg-red-50',          title: 'Reject → Draft',             nextStatus: 'DRAFT' },
    { Icon: Ban,         color: 'text-red-600 hover:bg-red-50',          title: 'Blacklist',                  nextStatus: 'BLACKLISTED' },
  ],
  PROBATION: [
    { Icon: CheckCircle, color: 'text-emerald-600 hover:bg-emerald-50', title: 'Clear Probation → Active',   nextStatus: 'ACTIVE' },
    { Icon: AlertTriangle, color: 'text-amber-600 hover:bg-amber-50',   title: 'Fail Probation → Suspended', nextStatus: 'SUSPENDED' },
    { Icon: Ban,         color: 'text-red-600 hover:bg-red-50',          title: 'Blacklist',                  nextStatus: 'BLACKLISTED' },
  ],
  ACTIVE: [
    { Icon: Power,       color: 'text-green-600 hover:bg-green-50',     title: 'Deactivate',                 nextStatus: 'INACTIVE' },
    { Icon: ShieldAlert, color: 'text-orange-600 hover:bg-orange-50',   title: 'Suspend',                    nextStatus: 'SUSPENDED' },
    { Icon: Ban,         color: 'text-red-600 hover:bg-red-50',          title: 'Blacklist',                  nextStatus: 'BLACKLISTED' },
    { Icon: Archive,     color: 'text-gray-600 hover:bg-gray-100',      title: 'Archive',                    nextStatus: 'ARCHIVED' },
  ],
  INACTIVE: [
    { Icon: PowerOff,    color: 'text-red-600 hover:bg-red-50',          title: 'Activate',                   nextStatus: 'ACTIVE' },
    { Icon: Ban,         color: 'text-red-600 hover:bg-red-50',          title: 'Blacklist',                  nextStatus: 'BLACKLISTED' },
    { Icon: Archive,     color: 'text-gray-600 hover:bg-gray-100',      title: 'Archive',                    nextStatus: 'ARCHIVED' },
  ],
  SUSPENDED: [
    { Icon: PlayCircle,  color: 'text-green-600 hover:bg-green-50',     title: 'Reinstate → Active',         nextStatus: 'ACTIVE' },
    { Icon: Ban,         color: 'text-red-600 hover:bg-red-50',          title: 'Blacklist',                  nextStatus: 'BLACKLISTED' },
    { Icon: Archive,     color: 'text-gray-600 hover:bg-gray-100',      title: 'Archive',                    nextStatus: 'ARCHIVED' },
  ],
  BLACKLISTED: [
    { Icon: ShieldCheck, color: 'text-indigo-600 hover:bg-indigo-50',   title: 'Lift Blacklist → Inactive',  nextStatus: 'INACTIVE' },
  ],
  ARCHIVED: [
    { Icon: RotateCcw,   color: 'text-gray-600 hover:bg-gray-100',      title: 'Restore → Inactive',         nextStatus: 'INACTIVE' },
  ],
};

const SupplierRow = React.memo(({
  s, canBulk, canUpdate, canDelete, selected, toggleSelection,
  openModal, handleDelete, handleToggleStatus, togglingStatusIds,
}) => {
  const isSel = selected.includes(s.supplier_id);
  const isToggling = togglingStatusIds.has(s.supplier_id);
  const actions = QUICK_ACTIONS[s.status] || [];

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5">
          <input type="checkbox" checked={isSel}
            onChange={() => toggleSelection(s.supplier_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 w-3 h-3" />
        </td>
      )}

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          {/* VIEW — always available */}
          <button onClick={() => openModal(s, true)} title="View Details"
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors">
            <Eye className="w-3 h-3" />
          </button>

          {/* EDIT */}
          {canUpdate && (
            <button onClick={() => openModal(s, false)} title="Edit"
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors">
              <Edit className="w-3 h-3" />
            </button>
          )}

          {/* QUICK STATUS ACTIONS — derived from current status */}
          {canUpdate && actions.map(act => (
            <button
              key={`${act.title}-${act.nextStatus}`}
              onClick={() => handleToggleStatus(s, act.nextStatus, act.title)}
              disabled={isToggling}
              title={act.title}
              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                isToggling ? 'opacity-50 cursor-wait' : act.color
              }`}
            >
              {isToggling
                ? <Loader className="w-3 h-3 animate-spin" />
                : <act.Icon className="w-3 h-3" />}
            </button>
          ))}

          {/* DELETE */}
          {canDelete && (
            <button onClick={() => handleDelete(s)} title="Delete"
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700">{s.supplier_id}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono font-semibold text-gray-800">{dash(s.supplier_code)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-800 font-medium max-w-[220px] truncate">{dash(s.legal_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[180px] truncate">{dash(s.trade_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.short_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.supplier_type)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.supplier_category)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.business_classification)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.ownership_type)}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium ${STATUS_COLOR[s.status] || 'text-gray-700'}`}>{dash(s.status)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.onboarding_stage)}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium ${RISK_COLOR[s.risk_rating] || 'text-gray-700'}`}>{dash(s.risk_rating)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700">{dash(s.gstin)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700">{dash(s.pan)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.primary_email)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.primary_phone)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(s.payment_terms_days)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.payment_method)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-right">{dash(s.credit_limit)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-right">{dash(s.outstanding_payable)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(s.overall_rating)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-center">
        {s.compliance_hold ? <ShieldAlert className="w-3 h-3 text-red-600 inline" title="Compliance hold" /> : '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-center">
        {s.po_hold ? <Ban className="w-3 h-3 text-orange-600 inline" title="PO hold" /> : '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-center">
        {s.portal_access_enabled ? <CheckCircle className="w-3 h-3 text-green-600 inline" title="Portal enabled" /> : '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(s.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(s.created_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(s.updated_at)}</td>
    </tr>
  );
});
SupplierRow.displayName = 'SupplierRow';

const SupplierManagement = () => {
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'suppliers', 'A3') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'suppliers', 'A3') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'suppliers', 'A3') || canManage, [hasPermission, canManage]);
  const canBulk   = useMemo(() => hasPermission('bulk',   'suppliers', 'A3') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [suppliers, setSuppliers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [toast, setToast] = useState(null);
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [filters, setFilters] = useState({ search: '', page: 1, limit: 25 });
  const debouncedSearch = useDebounce(filters.search, 300);

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (activeTab === 'active')      filterObj.status = 'ACTIVE';
      if (activeTab === 'inactive')    filterObj.status = 'INACTIVE';
      if (activeTab === 'draft')       filterObj.status = 'DRAFT';
      if (activeTab === 'pending')     filterObj.status = 'PENDING_APPROVAL';
      if (activeTab === 'suspended')   filterObj.status = 'SUSPENDED';
      if (activeTab === 'blacklisted') filterObj.status = 'BLACKLISTED';
      if (activeTab === 'msme')        filterObj.is_msme = true;
      if (activeTab === 'hold')        filterObj.compliance_hold = true;

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        searchFields: [
          'supplier_code', 'legal_name', 'trade_name', 'short_name',
          'gstin', 'pan', 'primary_email', 'primary_phone',
        ],
        filters: filterObj,
      };

      const res = await suppliersAPI.getAllSuppliers(payload);
      const data = res.data;

      if (data?.success) {
        setSuppliers(data.suppliers || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCounts(data.counts || {});
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load suppliers');
      setSuppliers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, debouncedSearch, activeTab]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const tabs = useMemo(() => {
    const c = (k) => counts[k] ?? 0;
    return [
      { id: 'all',         name: 'All',         count: counts.total ?? totalItems, icon: Truck,        color: 'text-gray-600' },
      { id: 'active',      name: 'Active',      count: c('active'),                 icon: CheckCircle,  color: 'text-green-600' },
      { id: 'pending',     name: 'Pending',     count: c('pending'),                icon: Clock,        color: 'text-amber-600' },
      { id: 'draft',       name: 'Draft',       count: c('draft'),                  icon: AlertCircle,  color: 'text-gray-600' },
      { id: 'suspended',   name: 'Suspended',   count: c('suspended'),              icon: ShieldAlert,  color: 'text-orange-600' },
      { id: 'blacklisted', name: 'Blacklisted', count: c('blacklisted'),            icon: Ban,          color: 'text-red-600' },
    ];
  }, [counts, totalItems]);

  const handleSearchChange = useCallback(v => setFilters(p => ({ ...p, search: v, page: 1 })), []);
  const handleLimitChange  = useCallback(v => setFilters(p => ({ ...p, limit: parseInt(v), page: 1 })), []);
  const handlePageChange   = useCallback(p => {
    if (p >= 1 && p <= totalPages) setFilters(prev => ({ ...prev, page: p }));
  }, [totalPages]);

  const toggleSelection = useCallback(id => {
    if (!canBulk) return;
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = suppliers.map(s => s.supplier_id);
    setSelected(selected.length === ids.length ? [] : ids);
  }, [canBulk, suppliers, selected]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleDelete = useCallback((s) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    showConfirmation(
      'Delete Supplier',
      `Delete "${s.legal_name}" (${s.supplier_code})?`,
      'delete',
      async () => {
        try {
          await suppliersAPI.deleteSupplier(s.supplier_id);
          fetchSuppliers();
          showToast('Supplier deleted', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete', 'error');
        }
      }
    );
  }, [canDelete, fetchSuppliers, showToast, showConfirmation]);

  // Generic status setter — same function used by all quick actions
  const handleToggleStatus = useCallback(async (s, nextStatus, actionLabel) => {
    if (!canUpdate) { showToast('No permission', 'error'); return; }
    if (!nextStatus || nextStatus === s.status) return;

    const id = s.supplier_id;
    const prevStatus = s.status;

    setSuppliers(prev => prev.map(row =>
      row.supplier_id === id ? { ...row, status: nextStatus } : row
    ));
    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await suppliersAPI.updateSupplier(id, { status: nextStatus });
      showToast(`${actionLabel || 'Status changed'}: ${prevStatus} → ${nextStatus}`, 'success');
      fetchSuppliers();
    } catch (err) {
      setSuppliers(prev => prev.map(row =>
        row.supplier_id === id ? { ...row, status: prevStatus } : row
      ));
      showToast(err.response?.data?.message || 'Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }, [canUpdate, showToast, fetchSuppliers]);

  const openModal = useCallback((s = null, readOnlyMode = false) => {
    if (s && !canUpdate && !readOnlyMode) { showToast('No permission', 'error'); return; }
    if (!s && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingSupplier(s);
    setIsReadOnly(readOnlyMode);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingSupplier(null);
    setIsReadOnly(false);
  }, []);

  const handleSaved = useCallback(() => {
    closeModal();
    fetchSuppliers();
    showToast('Saved', 'success');
  }, [closeModal, fetchSuppliers, showToast]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || selected.length === 0) return;
    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission', 'error'); return; }
      showConfirmation(
        'Delete Suppliers',
        `Delete ${selected.length} supplier(s)?`,
        'bulkDelete',
        async () => {
          try {
            await Promise.all(selected.map(id => suppliersAPI.deleteSupplier(id)));
            setSelected([]); setBulkAction(''); fetchSuppliers();
            showToast(`Deleted ${selected.length}`, 'success');
          } catch {
            showToast('Bulk delete failed — some suppliers are in use', 'error');
          }
        }
      );
    }
  }, [canBulk, bulkAction, selected, canDelete, fetchSuppliers, showToast, showConfirmation]);

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Manage suppliers / vendors</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          <button
            onClick={fetchSuppliers}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium"
            >
              <Plus className="w-2.5 h-2.5" /> Add Supplier
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setFilters(p => ({ ...p, page: 1 })); }}
                    className={`px-1.5 py-1 text-xs font-medium rounded-sm transition-all flex items-center gap-1 ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                  >
                    <Icon className={`w-3 h-3 ${activeTab === tab.id ? tab.color : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <select
                value={filters.limit}
                onChange={e => handleLimitChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-56 text-xs"
                />
              </div>

              {canBulk && selected.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 bg-white"
                  >
                    <option value="">Bulk Actions</option>
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium"
                  >
                    Apply
                  </button>
                  <span className="text-xs text-primary-700 font-medium">{selected.length} selected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Suppliers</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchSuppliers} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : suppliers.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selected.length === suppliers.length && suppliers.length > 0}
                        onChange={toggleSelectAll}
                        disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 w-3 h-3"
                      />
                    </th>
                  )}
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Legal Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Trade Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Short</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Biz Class</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Ownership</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Onboarding</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">GSTIN</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">PAN</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Terms</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pay Method</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Comp Hold</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Comp Hold</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">PO Hold</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map(s => (
                  <SupplierRow
                    key={s.supplier_id}
                    s={s}
                    canBulk={canBulk}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    selected={selected}
                    toggleSelection={toggleSelection}
                    openModal={openModal}
                    handleDelete={handleDelete}
                    handleToggleStatus={handleToggleStatus}
                    togglingStatusIds={togglingStatusIds}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No suppliers found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {filters.search || activeTab !== 'all'
                    ? 'No suppliers match your filters.'
                    : 'Get started by adding your first supplier.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add Supplier
                  </button>
                )}
              </div>
            </div>
          )}
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
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronsLeft className="w-3 h-3" />
                </button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (filters.page <= 3) pageNum = i + 1;
                  else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = filters.page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-6 h-6 text-xs rounded border transition-colors ${filters.page === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronsRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showModal && (
          <SupplierModal
            show={showModal}
            supplier={editingSupplier}
            onClose={closeModal}
            onSaved={handleSaved}
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

export default SupplierManagement;