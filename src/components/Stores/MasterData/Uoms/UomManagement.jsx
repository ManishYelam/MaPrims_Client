// src/modules/Uoms/UomManagement.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  Search, Edit, Trash2, Plus, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle, AlertCircle, Ruler, Lock, Unlock, LockKeyhole, UnlockKeyhole,
  Scale, Boxes, Eye, Power, PowerOff, Loader,
} from 'lucide-react';
import { uomsAPI } from '../../../../services/api';
import { usePermissions } from '../../../../hooks/usePermissions';

const UomModal = lazy(() => import('./UomModal'));
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

const TYPE_COLOR = {
  WEIGHT: 'text-blue-700',
  VOLUME: 'text-cyan-700',
  LENGTH: 'text-indigo-700',
  AREA: 'text-violet-700',
  COUNT: 'text-emerald-700',
  TIME: 'text-amber-700',
  PACKAGING: 'text-orange-700',
  OTHER: 'text-slate-700',
};

const CATEGORY_COLOR = {
  BASE: 'text-gray-800',
  DERIVED: 'text-blue-700',
  PACKAGING: 'text-orange-700',
  CUSTOM: 'text-purple-700',
};

const UomRow = React.memo(({
  uom, canBulk, canUpdate, canDelete, selected, toggleSelection,
  openModal, handleDelete, handleToggleStatus, togglingStatusIds,
}) => {
  const isSel = selected.includes(uom.uom_id);
  const isToggling = togglingStatusIds.has(uom.uom_id);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5">
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => toggleSelection(uom.uom_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
          />
        </td>
      )}

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          {/* VIEW - Always available */}
          <button
            onClick={() => openModal(uom, true)}
            title="View Details"
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-3 h-3" />
          </button>

          {/* EDIT */}
          {canUpdate && (
            <button
              onClick={() => openModal(uom, false)}
              title="Edit"
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}

          {/* TOGGLE STATUS */}
          {canUpdate && (
            <button
              onClick={() => handleToggleStatus(uom.uom_id, uom.is_active)}
              disabled={isToggling}
              title={uom.is_active ? 'Deactivate' : 'Activate'}
              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                isToggling ? 'opacity-50 cursor-wait' :
                uom.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              {isToggling ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : uom.is_active ? (
                <Power className="w-3 h-3" />
              ) : (
                <PowerOff className="w-3 h-3" />
              )}
            </button>
          )}

          {/* DELETE — blocked for system default */}
          {canDelete && !uom.is_system_default && (
            <button
              onClick={() => handleDelete(uom)}
              title="Delete"
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{uom.uom_id}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{dash(uom.org_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-800 font-semibold">{dash(uom.uom_code)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-800 font-medium">{dash(uom.uom_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(uom.short_name)}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium ${TYPE_COLOR[uom.uom_type] || 'text-gray-700'}`}>
        {dash(uom.uom_type)}
      </td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium ${CATEGORY_COLOR[uom.uom_category] || 'text-gray-700'}`}>
        {dash(uom.uom_category)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(uom.base_uom_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700">
        {uom.conversion_factor === null || uom.conversion_factor === undefined
          ? '—'
          : Number(uom.conversion_factor).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(uom.decimal_places)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-center">
        {uom.allow_fractional_qty
          ? <CheckCircle className="w-3 h-3 text-green-600 inline" title="Fractional allowed" />
          : <AlertCircle className="w-3 h-3 text-gray-400 inline" title="Whole numbers only" />}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(uom.si_unit)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-center">
        {uom.is_si_base
          ? <CheckCircle className="w-3 h-3 text-blue-600 inline" title="SI base" />
          : '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-center">
        {uom.is_metric
          ? <CheckCircle className="w-3 h-3 text-emerald-600 inline" title="Metric" />
          : '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-center">
        {uom.is_system_default
          ? <LockKeyhole className="w-3 h-3 text-indigo-600 inline" title="System default" />
          : '—'}
      </td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium ${uom.is_active ? 'text-green-700' : 'text-gray-500'}`}>
        {uom.is_active ? 'Active' : 'Inactive'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(uom.sort_order)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(uom.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(uom.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(uom.created_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(uom.updated_at)}</td>
    </tr>
  );
});
UomRow.displayName = 'UomRow';

const UomManagement = () => {
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'uoms', 'A3') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'uoms', 'A3') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'uoms', 'A3') || canManage, [hasPermission, canManage]);
  const canBulk   = useMemo(() => hasPermission('bulk',   'uoms', 'A3') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [uoms, setUoms] = useState([]);
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
  const [editingUom, setEditingUom] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 25,
  });
  const debouncedSearch = useDebounce(filters.search, 300);

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const fetchUoms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (activeTab === 'active')         filterObj.status = 'active';
      if (activeTab === 'inactive')       filterObj.status = 'inactive';
      if (activeTab === 'system')         filterObj.is_system_default = true;
      if (activeTab === 'packaging')      filterObj.uom_category = 'PACKAGING';
      if (activeTab === 'base')           filterObj.uom_category = 'BASE';

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        searchFields: [
          'uom_code',
          'uom_name',
          'short_name',
          'description',
          'si_unit',
        ],
        filters: filterObj,
      };

      const res = await uomsAPI.getAllUoms(payload);
      const data = res.data;

      if (data?.success) {
        setUoms(data.uoms || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCounts(data.counts || {});
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load UoMs');
      setUoms([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, debouncedSearch, activeTab]);

  useEffect(() => {
    fetchUoms();
  }, [fetchUoms]);

  const tabs = useMemo(() => {
    const c = (k) => counts[k] ?? 0;
    return [
      { id: 'all',       name: 'All',       count: counts.total ?? totalItems, icon: Ruler,      color: 'text-gray-600' },
      { id: 'base',      name: 'Base',      count: c('base'),      icon: Scale,           color: 'text-blue-600' },
      { id: 'packaging', name: 'Packaging', count: c('packaging'), icon: Boxes,           color: 'text-orange-600' },
      { id: 'system',    name: 'System',    count: c('system'),    icon: LockKeyhole,     color: 'text-indigo-600' },
      { id: 'active',    name: 'Active',    count: c('active'),    icon: CheckCircle,     color: 'text-green-600' },
      { id: 'inactive',  name: 'Inactive',  count: c('inactive'),  icon: AlertCircle,     color: 'text-gray-500' },
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
    const ids = uoms.map(s => s.uom_id);
    setSelected(selected.length === ids.length ? [] : ids);
  }, [canBulk, uoms, selected]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleDelete = useCallback((uom) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    if (uom.is_system_default) { showToast('System default UoM cannot be deleted', 'error'); return; }
    showConfirmation(
      'Delete UoM',
      `Delete "${uom.uom_name}" (${uom.uom_code})?`,
      'delete',
      async () => {
        try {
          await uomsAPI.deleteUom(uom.uom_id);
          fetchUoms();
          showToast('UoM deleted', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete', 'error');
        }
      }
    );
  }, [canDelete, fetchUoms, showToast, showConfirmation]);

  // Toggle active/inactive status directly from the list (optimistic + rollback)
  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    if (!canUpdate) { showToast('No permission', 'error'); return; }
    const newStatus = !currentStatus;

    // Optimistic update
    setUoms(prev => prev.map(u =>
      u.uom_id === id ? { ...u, is_active: newStatus } : u
    ));
    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await uomsAPI.updateUom(id, { is_active: newStatus });
      showToast(`UoM ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      fetchUoms();
    } catch (err) {
      // Rollback on failure
      setUoms(prev => prev.map(u =>
        u.uom_id === id ? { ...u, is_active: currentStatus } : u
      ));
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [canUpdate, showToast, fetchUoms]);

  const openModal = useCallback((uom = null, readOnly = false) => {
    if (uom && !canUpdate && !readOnly) { showToast('No permission', 'error'); return; }
    if (!uom && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingUom(uom);
    setIsReadOnly(readOnly);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingUom(null);
    setIsReadOnly(false);
  }, []);

  const handleSaved = useCallback(() => {
    closeModal();
    fetchUoms();
    showToast('Saved', 'success');
  }, [closeModal, fetchUoms, showToast]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || selected.length === 0) return;
    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission', 'error'); return; }
      const deletable = uoms.filter(u => selected.includes(u.uom_id) && !u.is_system_default);
      if (deletable.length === 0) { showToast('No deletable UoMs in selection', 'error'); return; }
      showConfirmation(
        'Delete UoMs',
        `Delete ${deletable.length} UoM(s)? ${selected.length - deletable.length} system default(s) will be skipped.`,
        'bulkDelete',
        async () => {
          try {
            await Promise.all(deletable.map(u => uomsAPI.deleteUom(u.uom_id)));
            setSelected([]); setBulkAction(''); fetchUoms();
            showToast(`Deleted ${deletable.length}`, 'success');
          } catch {
            showToast('Bulk delete failed', 'error');
          }
        }
      );
    }
  }, [canBulk, bulkAction, selected, canDelete, uoms, fetchUoms, showToast, showConfirmation]);

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Manage units of measure (UoM)</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          <button
            onClick={fetchUoms}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium"
            >
              <Plus className="w-2.5 h-2.5" /> Add UoM
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
                  placeholder="Search UoMs..."
                  value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-48 text-xs"
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
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load UoMs</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchUoms} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : uoms.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selected.length === uoms.length && uoms.length > 0}
                        onChange={toggleSelectAll}
                        disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 w-3 h-3"
                      />
                    </th>
                  )}
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Org</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Short</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Base ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Conv. Factor</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Decimals</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Frac?</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">SI Unit</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">SI Base?</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Metric?</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">System?</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Sort</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uoms.map(u => (
                  <UomRow
                    key={u.uom_id}
                    uom={u}
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
                  <Ruler className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No UoMs found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {filters.search || activeTab !== 'all'
                    ? 'No UoMs match your filters.'
                    : 'Get started by adding your first UoM.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add UoM
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
          <UomModal
            show={showModal}
            uom={editingUom}
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

export default UomManagement;