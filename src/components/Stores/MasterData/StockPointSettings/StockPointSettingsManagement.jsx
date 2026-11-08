// src/modules/StockPoints/StockPointSettingsManagement.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  Search, RefreshCw, Settings, CheckCircle, AlertCircle,
  Warehouse, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Power, PowerOff, Loader
} from 'lucide-react';
import { stockPointSettingsAPI, stockPointsAPI } from '../../../../services/api';
import { usePermissions } from '../../../../hooks/usePermissions';

const StockPointSettingsModal = lazy(() => import('./StockPointSettingsModal'));
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

const SettingsBadge = React.memo(({ hasSettings }) => (
  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
    hasSettings
      ? 'bg-green-100 text-green-700 border border-green-300'
      : 'bg-gray-100 text-gray-600 border border-gray-300'
  }`}>
    {hasSettings ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
    {hasSettings ? 'Configured' : 'Not Configured'}
  </span>
));
SettingsBadge.displayName = 'SettingsBadge';

const Row = React.memo(({
  item, canUpdate, onOpenSettings, onToggleStatus, togglingStatusIds,
}) => {
  const sp = item.stock_point;
  const st = item.settings;
  const isToggling = togglingStatusIds.has(sp.stock_po_id);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onOpenSettings(sp)}
            title={item.has_settings ? 'Edit Settings' : 'Configure Settings'}
            disabled={!canUpdate}
            className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
              canUpdate
                ? 'text-primary-600 hover:text-primary-800 hover:bg-primary-50'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <Settings className="w-3 h-3" />
          </button>
          
          {canUpdate && (
            <button
              onClick={() => onToggleStatus(sp.stock_po_id, sp.is_active)}
              disabled={isToggling}
              title={sp.is_active ? 'Deactivate' : 'Activate'}
              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                isToggling ? 'opacity-50 cursor-wait' : 
                sp.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              {isToggling ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : sp.is_active ? (
                <Power className="w-3 h-3" />
              ) : (
                <PowerOff className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{sp.stock_po_id}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{dash(sp.stock_point_code)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-800 font-medium">{dash(sp.stock_point_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(sp.stock_point_type)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(sp.stock_point_category)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <span className={`inline-flex items-center px-1 py-0 rounded-full text-[10px] font-medium ${
          sp.is_active
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-gray-100 text-gray-600 border border-gray-300'
        }`}>
          {sp.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap"><SettingsBadge hasSettings={item.has_settings} /></td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">
        {dash(st?.settings_version)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(st?.stock_count_frequency)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(st?.valuation_method)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(st?.replenishment_source)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(st?.approval_sla_hours)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(st?.updated_at)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(st?.last_modified_by)}</td>
    </tr>
  );
});
Row.displayName = 'Row';

const StockPointSettingsManagement = () => {
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canUpdate = useMemo(
    () => hasPermission('update', 'stock_point_settings', 'A3') || canManage,
    [hasPermission, canManage]
  );

  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    stock_point_type: '',
    page: 1,
    limit: 20,
  });
  const debouncedSearch = useDebounce(filters.search, 300);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingStockPoint, setEditingStockPoint] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (filters.status !== 'all') filterObj.status = filters.status;
      if (filters.stock_point_type) filterObj.stock_point_type = filters.stock_point_type;

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        searchFields: ['stock_point_code', 'stock_point_name', 'short_name', 'alias_code'],
        filters: filterObj,
      };

      const res = await stockPointSettingsAPI.getAll(payload);
      const data = res.data;

      if (data?.success) {
        setItems(data.items || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load stock point settings');
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.status, filters.stock_point_type, debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearchChange = useCallback(v => setFilters(p => ({ ...p, search: v, page: 1 })), []);
  const handleLimitChange = useCallback(v => setFilters(p => ({ ...p, limit: parseInt(v), page: 1 })), []);
  const handleStatusChange = useCallback(v => setFilters(p => ({ ...p, status: v, page: 1 })), []);
  const handleTypeChange = useCallback(v => setFilters(p => ({ ...p, stock_point_type: v, page: 1 })), []);
  const handlePageChange = useCallback(p => {
    if (p >= 1 && p <= totalPages) setFilters(prev => ({ ...prev, page: p }));
  }, [totalPages]);

  const openSettings = useCallback((sp) => {
    if (!canUpdate) { showToast('No permission', 'error'); return; }
    setEditingStockPoint(sp);
    setShowSettingsModal(true);
  }, [canUpdate, showToast]);

  const closeSettings = useCallback(() => {
    setShowSettingsModal(false);
    setEditingStockPoint(null);
  }, []);

  const handleSaved = useCallback(() => {
    closeSettings();
    fetchItems();
    showToast('Settings saved', 'success');
  }, [closeSettings, fetchItems, showToast]);

  // Toggle active/inactive status of the Stock Point directly from this screen
  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    if (!canUpdate) { showToast('No permission', 'error'); return; }
    const newStatus = !currentStatus;
    
    // Optimistic UI update
    setItems(prev => prev.map(item => 
      item.stock_point.stock_po_id === id 
        ? { ...item, stock_point: { ...item.stock_point, is_active: newStatus } } 
        : item
    ));
    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await stockPointsAPI.updateStockPoint(id, { is_active: newStatus });
      showToast(`Stock point ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      fetchItems(); // Refresh to sync any filters
    } catch (err) {
      // Revert on failure
      setItems(prev => prev.map(item => 
        item.stock_point.stock_po_id === id 
          ? { ...item, stock_point: { ...item.stock_point, is_active: currentStatus } } 
          : item
      ));
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [canUpdate, showToast, fetchItems]);

  const configuredCount = useMemo(
    () => items.filter(i => i.has_settings).length,
    [items]
  );

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Configure behavior for each stock point</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          <button
            onClick={fetchItems}
            className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex items-center gap-1 flex-wrap text-xs">
              <span className="text-gray-500">Filters:</span>

              <select
                value={filters.status}
                onChange={e => handleStatusChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
              >
                <option value="all">All Stores</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={filters.stock_point_type}
                onChange={e => handleTypeChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
              >
                <option value="">All Types</option>
                <option value="PURCHASE">Purchase</option>
                <option value="CENTRAL">Central</option>
                <option value="MEDICAL">Medical</option>
                <option value="GENERAL">General</option>
                <option value="DEPARTMENTAL">Departmental</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="SCRAP">Scrap</option>
                <option value="RETURN">Return</option>
              </select>

              <span className="ml-2 text-[11px] text-gray-500">
                Configured on this page: <span className="font-medium text-gray-700">{configuredCount}</span> / {items.length}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <select
                value={filters.limit}
                onChange={e => handleLimitChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search stock points..."
                  value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-48 text-xs"
                />
              </div>
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
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Settings</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchItems} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : items.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Settings</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Count Freq.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Valuation</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Replenishment</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">SLA (hrs)</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(item => (
                  <Row
                    key={item.stock_point.stock_po_id}
                    item={item}
                    canUpdate={canUpdate}
                    onOpenSettings={openSettings}
                    onToggleStatus={handleToggleStatus}
                    togglingStatusIds={togglingStatusIds}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Warehouse className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No stock points found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {filters.search || filters.status !== 'all' || filters.stock_point_type
                    ? 'No stock points match your filters.'
                    : 'Create a stock point first, then configure its settings here.'}
                </p>
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
        {showSettingsModal && editingStockPoint && (
          <StockPointSettingsModal
            show={showSettingsModal}
            stockPoint={editingStockPoint}
            onClose={closeSettings}
            onSaved={handleSaved}
          />
        )}
      </Suspense>
    </div>
  );
};

export default StockPointSettingsManagement;