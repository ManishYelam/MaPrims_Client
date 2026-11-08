// src/modules/ItemCategories/ItemCategoryManagement.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  Search, Edit, Trash2, Plus, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle, AlertCircle, FolderTree, ListTree, Layers,
  Eye, Power, PowerOff, Loader,
} from 'lucide-react';
import { itemCategoriesAPI } from '../../../../services/api';
import { usePermissions } from '../../../../hooks/usePermissions';

const ItemCategoryModal = lazy(() => import('./ItemCategoryModal'));
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

const LEVEL_COLOR = {
  1: 'text-indigo-700',
  2: 'text-blue-700',
  3: 'text-cyan-700',
  4: 'text-emerald-700',
  5: 'text-amber-700',
};

const CategoryRow = React.memo(({
  cat, canBulk, canUpdate, canDelete, selected, toggleSelection,
  openModal, handleDelete, handleToggleStatus, togglingStatusIds,
}) => {
  const isSel = selected.includes(cat.category_id);
  const indent = Math.max(0, (cat.level || 1) - 1);
  const isToggling = togglingStatusIds.has(cat.category_id);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5">
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => toggleSelection(cat.category_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
          />
        </td>
      )}

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          {/* VIEW - Always available */}
          <button
            onClick={() => openModal(cat, true)}
            title="View Details"
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-3 h-3" />
          </button>

          {/* EDIT */}
          {canUpdate && (
            <button
              onClick={() => openModal(cat, false)}
              title="Edit"
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}

          {/* TOGGLE STATUS */}
          {canUpdate && (
            <button
              onClick={() => handleToggleStatus(cat.category_id, cat.is_active)}
              disabled={isToggling}
              title={cat.is_active ? 'Deactivate' : 'Activate'}
              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                isToggling ? 'opacity-50 cursor-wait' :
                cat.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              {isToggling ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : cat.is_active ? (
                <Power className="w-3 h-3" />
              ) : (
                <PowerOff className="w-3 h-3" />
              )}
            </button>
          )}

          {/* DELETE */}
          {canDelete && (
            <button
              onClick={() => handleDelete(cat)}
              title="Delete"
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{cat.category_id}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-600">{dash(cat.org_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-800 font-semibold">{dash(cat.category_code)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-800 font-medium">
        <span style={{ paddingLeft: `${indent * 12}px` }} className="inline-flex items-center gap-1">
          {cat.level > 1 && <ListTree className="w-3 h-3 text-gray-400" />}
          {dash(cat.category_name)}
        </span>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(cat.parent_category_id)}</td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium text-center ${LEVEL_COLOR[cat.level] || 'text-gray-700'}`}>
        {dash(cat.level)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{dash(cat.sort_order)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[200px] truncate">{dash(cat.description)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[140px] truncate">
        {cat.icon_url ? <a href={cat.icon_url} target="_blank" rel="noreferrer" className="text-primary-600 underline">view</a> : '—'}
      </td>
      <td className={`px-0.5 py-0.5 whitespace-nowrap text-[11px] font-medium ${cat.is_active ? 'text-green-700' : 'text-gray-500'}`}>
        {cat.is_active ? 'Active' : 'Inactive'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(cat.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(cat.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(cat.created_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(cat.updated_at)}</td>
    </tr>
  );
});
CategoryRow.displayName = 'CategoryRow';

const ItemCategoryManagement = () => {
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'item_categories', 'A3') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'item_categories', 'A3') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'item_categories', 'A3') || canManage, [hasPermission, canManage]);
  const canBulk   = useMemo(() => hasPermission('bulk',   'item_categories', 'A3') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);
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
  const [editingCategory, setEditingCategory] = useState(null);
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

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (activeTab === 'active')   filterObj.status = 'active';
      if (activeTab === 'inactive') filterObj.status = 'inactive';
      if (activeTab === 'roots')    filterObj.only_roots = true;

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        searchFields: ['category_code', 'category_name', 'description'],
        filters: filterObj,
      };

      const res = await itemCategoriesAPI.getAllItemCategories(payload);
      const data = res.data;

      if (data?.success) {
        setCategories(data.itemCategories || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCounts(data.counts || {});
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load item categories');
      setCategories([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, debouncedSearch, activeTab]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const tabs = useMemo(() => {
    const c = (k) => counts[k] ?? 0;
    return [
      { id: 'all',      name: 'All',      count: counts.total ?? totalItems, icon: FolderTree,   color: 'text-gray-600' },
      { id: 'roots',    name: 'Roots',    count: c('roots'),                 icon: Layers,       color: 'text-indigo-600' },
      { id: 'active',   name: 'Active',   count: c('active'),                icon: CheckCircle,  color: 'text-green-600' },
      { id: 'inactive', name: 'Inactive', count: c('inactive'),              icon: AlertCircle,  color: 'text-gray-500' },
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
    const ids = categories.map(c => c.category_id);
    setSelected(selected.length === ids.length ? [] : ids);
  }, [canBulk, categories, selected]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleDelete = useCallback((cat) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    showConfirmation(
      'Delete Item Category',
      `Delete "${cat.category_name}" (${cat.category_code})?`,
      'delete',
      async () => {
        try {
          await itemCategoriesAPI.deleteItemCategory(cat.category_id);
          fetchCategories();
          showToast('Item category deleted', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete', 'error');
        }
      }
    );
  }, [canDelete, fetchCategories, showToast, showConfirmation]);

  // Toggle active/inactive status directly from the list (optimistic + rollback)
  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    if (!canUpdate) { showToast('No permission', 'error'); return; }
    const newStatus = !currentStatus;

    // Optimistic update
    setCategories(prev => prev.map(cat =>
      cat.category_id === id ? { ...cat, is_active: newStatus } : cat
    ));
    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await itemCategoriesAPI.updateItemCategory(id, { is_active: newStatus });
      showToast(`Category ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      fetchCategories();
    } catch (err) {
      // Rollback on failure
      setCategories(prev => prev.map(cat =>
        cat.category_id === id ? { ...cat, is_active: currentStatus } : cat
      ));
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [canUpdate, showToast, fetchCategories]);

  const openModal = useCallback((cat = null, readOnly = false) => {
    if (cat && !canUpdate && !readOnly) { showToast('No permission', 'error'); return; }
    if (!cat && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingCategory(cat);
    setIsReadOnly(readOnly);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingCategory(null);
    setIsReadOnly(false);
  }, []);

  const handleSaved = useCallback(() => {
    closeModal();
    fetchCategories();
    showToast('Saved', 'success');
  }, [closeModal, fetchCategories, showToast]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || selected.length === 0) return;
    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission', 'error'); return; }
      showConfirmation(
        'Delete Categories',
        `Delete ${selected.length} categor${selected.length === 1 ? 'y' : 'ies'}?`,
        'bulkDelete',
        async () => {
          try {
            await Promise.all(selected.map(id => itemCategoriesAPI.deleteItemCategory(id)));
            setSelected([]); setBulkAction(''); fetchCategories();
            showToast(`Deleted ${selected.length}`, 'success');
          } catch (e) {
            showToast('Bulk delete failed — some categories have children', 'error');
          }
        }
      );
    }
  }, [canBulk, bulkAction, selected, canDelete, fetchCategories, showToast, showConfirmation]);

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Manage item categories</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          <button
            onClick={fetchCategories}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium"
            >
              <Plus className="w-2.5 h-2.5" /> Add Category
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
                  placeholder="Search categories..."
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
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Categories</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchCategories} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : categories.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selected.length === categories.length && categories.length > 0}
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
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Sort</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map(cat => (
                  <CategoryRow
                    key={cat.category_id}
                    cat={cat}
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
                  <FolderTree className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No item categories found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {filters.search || activeTab !== 'all'
                    ? 'No categories match your filters.'
                    : 'Get started by adding your first item category.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add Category
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
          <ItemCategoryModal
            show={showModal}
            itemCategory={editingCategory}
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

export default ItemCategoryManagement;