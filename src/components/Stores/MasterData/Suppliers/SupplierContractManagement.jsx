// src/modules/Suppliers/SupplierContractManagement.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  Search, Edit, Trash2, Plus, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle, AlertCircle, FileText, XCircle, Clock,
  Ban, RotateCcw, DollarSign,
} from 'lucide-react';
import { supplierContractsAPI } from '../../../../services/api';
import { usePermissions } from '../../../../hooks/usePermissions';

const SupplierContractModal = lazy(() => import('./SupplierContractModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`;
};

const formatDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatMoney = (v, currency = 'INR') => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
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
  EXPIRED: 'text-orange-700',
  TERMINATED: 'text-red-700',
  SUSPENDED: 'text-orange-600',
  RENEWED: 'text-blue-700',
  CLOSED: 'text-gray-500',
};

const TYPE_COLOR = {
  RATE_CONTRACT: 'text-blue-700',
  BLANKET_PO: 'text-indigo-700',
  ANNUAL_AGREEMENT: 'text-emerald-700',
  FRAMEWORK: 'text-purple-700',
  RETAINER: 'text-cyan-700',
  AMC: 'text-amber-700',
  ONE_TIME: 'text-slate-700',
};

const ContractRow = React.memo(({
  c, canBulk, canUpdate, canDelete, selected, toggleSelection,
  openModal, handleDelete,
}) => {
  const isSel = selected.includes(c.contract_id);
  const today = new Date();
  const isExpiringSoon = c.end_date &&
    new Date(c.end_date) >= today &&
    new Date(c.end_date) <= new Date(today.getTime() + 30 * 86400000);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5">
          <input type="checkbox" checked={isSel}
            onChange={() => toggleSelection(c.contract_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 w-3 h-3" />
        </td>
      )}

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          {canUpdate && (
            <button onClick={() => openModal(c)} title="Edit"
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors">
              <Edit className="w-3 h-3" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(c)} title="Delete"
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700">{c.contract_id}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono font-semibold text-gray-800">{dash(c.contract_no)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-800 font-medium max-w-[220px] truncate">{dash(c.contract_title)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-800 max-w-[180px] truncate">
        {c.supplier ? `${c.supplier.supplier_code} — ${c.supplier.legal_name}` : (c.supplier_id || '—')}
      </td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium ${TYPE_COLOR[c.contract_type] || 'text-gray-700'}`}>
        {dash(c.contract_type)}
      </td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium ${STATUS_COLOR[c.status] || 'text-gray-700'}`}>
        {dash(c.status)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDate(c.contract_date)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDate(c.start_date)}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] ${isExpiringSoon ? 'text-amber-700 font-medium' : 'text-gray-600'}`}>
        {formatDate(c.end_date)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(c.renewal_alert_days)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-center">
        {c.auto_renewal
          ? <RotateCcw className="w-3 h-3 text-blue-600 inline" title="Auto renewal" />
          : '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(c.currency)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-right">
        {formatMoney(c.total_commitment_value)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-right">
        {formatMoney(c.utilized_value)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-right">
        {formatMoney(c.remaining_value)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(c.payment_terms_days)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(c.line_count)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(c.notice_period_days)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-right">{formatMoney(c.security_deposit_amount)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-right">{formatMoney(c.performance_bank_guarantee_amount)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDate(c.pbg_expiry_date)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(c.approved_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(c.approved_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(c.terminated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(c.terminated_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(c.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(c.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(c.created_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(c.updated_at)}</td>
    </tr>
  );
});
ContractRow.displayName = 'ContractRow';

const SupplierContractManagement = () => {
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'supplier_contracts', 'A3') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'supplier_contracts', 'A3') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'supplier_contracts', 'A3') || canManage, [hasPermission, canManage]);
  const canBulk   = useMemo(() => hasPermission('bulk',   'supplier_contracts', 'A3') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [contracts, setContracts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [filters, setFilters] = useState({ search: '', page: 1, limit: 25 });
  const debouncedSearch = useDebounce(filters.search, 300);

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (activeTab === 'draft')       filterObj.status = 'DRAFT';
      if (activeTab === 'pending')     filterObj.status = 'PENDING_APPROVAL';
      if (activeTab === 'active')      filterObj.status = 'ACTIVE';
      if (activeTab === 'expired')     filterObj.expired = true;
      if (activeTab === 'terminated')  filterObj.status = 'TERMINATED';
      if (activeTab === 'renewed')     filterObj.status = 'RENEWED';
      if (activeTab === 'closed')      filterObj.status = 'CLOSED';

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        searchFields: ['contract_no', 'contract_title', 'remarks'],
        filters: filterObj,
      };

      const res = await supplierContractsAPI.getAllSupplierContracts(payload);
      const data = res.data;

      if (data?.success) {
        setContracts(data.supplierContracts || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCounts(data.counts || {});
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load contracts');
      setContracts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, debouncedSearch, activeTab]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const tabs = useMemo(() => {
    const c = (k) => counts[k] ?? 0;
    return [
      { id: 'all',        name: 'All',        count: counts.total ?? totalItems, icon: FileText,     color: 'text-gray-600' },
      { id: 'active',     name: 'Active',     count: c('active'),                icon: CheckCircle,  color: 'text-green-600' },
      { id: 'pending',    name: 'Pending',    count: c('pending'),               icon: Clock,        color: 'text-amber-600' },
      { id: 'draft',      name: 'Draft',      count: c('draft'),                 icon: AlertCircle,  color: 'text-gray-600' },
      { id: 'expired',    name: 'Expired',    count: c('expired'),               icon: XCircle,      color: 'text-orange-600' },
      { id: 'terminated', name: 'Terminated', count: c('terminated'),            icon: Ban,          color: 'text-red-600' },
      { id: 'renewed',    name: 'Renewed',    count: c('renewed'),               icon: RotateCcw,    color: 'text-blue-600' },
      { id: 'closed',     name: 'Closed',     count: c('closed'),                icon: Clock,        color: 'text-gray-500' },
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
    const ids = contracts.map(c => c.contract_id);
    setSelected(selected.length === ids.length ? [] : ids);
  }, [canBulk, contracts, selected]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleDelete = useCallback((c) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    showConfirmation(
      'Delete Contract',
      `Delete "${c.contract_title || c.contract_no}" (${c.contract_no})?`,
      'delete',
      async () => {
        try {
          await supplierContractsAPI.deleteSupplierContract(c.contract_id);
          fetchContracts();
          showToast('Contract deleted', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete', 'error');
        }
      }
    );
  }, [canDelete, fetchContracts, showToast, showConfirmation]);

  const openModal = useCallback((c = null) => {
    if (c && !canUpdate) { showToast('No permission', 'error'); return; }
    if (!c && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingContract(c);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingContract(null);
  }, []);

  const handleSaved = useCallback(() => {
    closeModal();
    fetchContracts();
    showToast('Saved', 'success');
  }, [closeModal, fetchContracts, showToast]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || selected.length === 0) return;
    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission', 'error'); return; }
      showConfirmation(
        'Delete Contracts',
        `Delete ${selected.length} contract(s)?`,
        'bulkDelete',
        async () => {
          try {
            await Promise.all(selected.map(id => supplierContractsAPI.deleteSupplierContract(id)));
            setSelected([]); setBulkAction(''); fetchContracts();
            showToast(`Deleted ${selected.length}`, 'success');
          } catch {
            showToast('Bulk delete failed — some contracts have utilized lines', 'error');
          }
        }
      );
    }
  }, [canBulk, bulkAction, selected, canDelete, fetchContracts, showToast, showConfirmation]);

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Manage supplier contracts &amp; rate agreements</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          <button
            onClick={fetchContracts}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium"
            >
              <Plus className="w-2.5 h-2.5" /> Add Contract
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
                  placeholder="Search contracts..."
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
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Contracts</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchContracts} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : contracts.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selected.length === contracts.length && contracts.length > 0}
                        onChange={toggleSelectAll}
                        disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 w-3 h-3"
                      />
                    </th>
                  )}
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Contract No</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Contract Date</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">End</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Alert (d)</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Auto Renew</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Commitment</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Utilized</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pay Terms</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Lines</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Notice (d)</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Security Dep</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">PBG</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">PBG Expiry</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Approved At</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Terminated By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Terminated At</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map(c => (
                  <ContractRow
                    key={c.contract_id}
                    c={c}
                    canBulk={canBulk}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    selected={selected}
                    toggleSelection={toggleSelection}
                    openModal={openModal}
                    handleDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No contracts found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {filters.search || activeTab !== 'all'
                    ? 'No contracts match your filters.'
                    : 'Get started by adding your first supplier contract.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add Contract
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
          <SupplierContractModal
            show={showModal}
            supplierContract={editingContract}
            onClose={closeModal}
            onSaved={handleSaved}
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

export default SupplierContractManagement;