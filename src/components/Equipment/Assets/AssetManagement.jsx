import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  useRef,
  memo,
  lazy,
  Suspense,
} from 'react';
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Hash,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { TbTool } from 'react-icons/tb';
import { assetAPI } from '../../../services/api'; // Ensure this exists
import { AuthContext } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';

const AssetModal = lazy(() => import('./AssetModal'));
const ConfirmationModal = lazy(() => import('../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../components/common/Toast'));
const AssetSelectionModal = lazy(() => import('./AssetSelectionModal'));

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Popover = ({ children, content, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 320),
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className="inline-block"
    >
      {children}
      {isOpen && content && (
        <div
          className={`fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg p-3 max-w-xs max-h-72 overflow-auto ${className}`}
          style={{ top: position.top, left: position.left }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

const StatusBadge = memo(({ status, statusOptions }) => {
  const statusObj = statusOptions.find((s) => s.value === status) || statusOptions[0];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${statusObj.color}`}>
      {statusObj.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const AssetRow = memo(
  ({
    asset,
    index,
    canBulk,
    canUpdate,
    canDelete,
    canUpdateStatus,
    selectedAssets,
    toggleAssetSelection,
    openAssetModal,
    handleStatusUpdate,
    handleDeleteAsset,
    categoryOptions,
    criticalityOptions,
    statusOptions,
    getCriticalityColor,
    getStatusColor,
    formatDate,
  }) => {
    const childrenCount = asset.children?.length || 0;
    const rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

    const parentPopoverContent = (
      <div className="py-1">
        <div className="font-medium text-xs text-gray-700 border-b pb-1 mb-1">Parent Asset</div>
        {asset.parent ? (
          <div className="flex items-center gap-1 text-[11px] text-gray-600">
            <TbTool className="w-3 h-3 text-gray-400" />
            <span className="font-mono">#{asset.parent.id}</span>
            <span>{asset.parent.name}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">No parent</span>
        )}
      </div>
    );

    const childrenPopoverContent = (
      <div className="py-1">
        <div className="font-medium text-xs text-gray-700 border-b pb-1 mb-1">Children ({childrenCount})</div>
        {childrenCount > 0 ? (
          <div className="max-h-52 overflow-y-auto">
            <ul className="space-y-0.5 text-[11px] text-gray-600">
              {asset.children.map((child) => (
                <li key={child.id} className="flex items-center gap-1">
                  <TbTool className="w-3 h-3 text-gray-400" />
                  <span className="font-mono">#{child.code}</span>
                  <span>{child.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">No children</span>
        )}
      </div>
    );

    return (
      <tr className={`${rowBgClass} hover:bg-gray-50 transition-colors`}>
        {canBulk && (
          <td className={`px-0.5 py-1 whitespace-nowrap sticky left-0 z-10 ${rowBgClass}`}>
            <input
              type="checkbox"
              checked={selectedAssets.includes(asset.id)}
              onChange={() => toggleAssetSelection(asset.id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
            />
          </td>
        )}
        <td className={`px-0.5 py-1 whitespace-nowrap sticky left-6 z-10 ${rowBgClass} min-w-[60px]`}>
          <span className="text-[11px] font-mono text-gray-500">#{asset.code}</span>
        </td>
        <td className={`px-0.5 py-1 whitespace-nowrap sticky left-[70px] z-10 ${rowBgClass} min-w-[160px]`}>
          <div className="flex items-center">
            <div className="h-5 w-5 bg-gray-100 rounded-md flex items-center justify-center mr-1 border border-gray-200">
              <TbTool className="w-2.5 h-2.5 text-gray-500" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-gray-900 line-clamp-1">{asset.name}</div>
              <div className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                <Hash className="w-2 h-2" />
                <span>{asset.code}</span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-0.5 py-1 text-[11px] text-gray-600 max-w-[120px] truncate">{asset.description || '—'}</td>
        <td className="px-0.5 py-1 whitespace-nowrap">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
            {asset.category || 'General'}
          </span>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {asset.parent ? (
            <Popover content={parentPopoverContent}>
              <span className="cursor-default hover:text-primary-600 transition-colors">{asset.parent.name}</span>
            </Popover>
          ) : (
            '—'
          )}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700 text-center">
          <Popover content={childrenPopoverContent}>
            <span className="cursor-default hover:text-primary-600 transition-colors">{childrenCount}</span>
          </Popover>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {asset.warranty_expiry_date ? formatDate(asset.warranty_expiry_date) : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {asset.installation_date ? formatDate(asset.installation_date) : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap">
          {canUpdateStatus ? (
            <select
              value={asset.status}
              onChange={(e) => handleStatusUpdate(asset.id, e.target.value)}
              className={`text-[10px] font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1 py-0 ${getStatusColor(asset.status)}`}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          ) : (
            <StatusBadge status={asset.status} statusOptions={statusOptions} />
          )}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getCriticalityColor(asset.criticality)}`}>
            {asset.criticality}
          </span>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[10px] text-gray-500">
          <div className="flex items-center gap-0.5">
            <Calendar className="w-2 h-2" />
            {formatDate(asset.createdAt)}
          </div>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[10px] text-gray-500">
          <div className="flex items-center gap-0.5">
            <Calendar className="w-2 h-2" />
            {formatDate(asset.updatedAt)}
          </div>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] font-medium">
          <div className="flex items-center gap-0.5">
            {canUpdate && (
              <button
                onClick={() => openAssetModal(asset)}
                className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50 transition-colors"
                title="Edit Asset"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDeleteAsset(asset.id)}
                className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 transition-colors"
                title="Delete Asset"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }
);
AssetRow.displayName = 'AssetRow';

// Date helpers (same as department)
const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatYMD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const subDays = (date, days) => { const r = new Date(date); r.setDate(date.getDate() - days); return r; };
const subMonths = (date, months) => { const r = new Date(date); r.setMonth(date.getMonth() - months); if (r.getDate() !== date.getDate()) r.setDate(0); return r; };
const subYears = (date, years) => { const r = new Date(date); r.setFullYear(date.getFullYear() - years); return r; };
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

const AssetManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'asset', 'A2') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'asset', 'A2') || canManage, [hasPermission, canManage]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'asset', 'A2') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'asset', 'A2') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'asset', 'A2') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'asset', 'A2') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'asset', 'A2') || canManage, [hasPermission, canManage]);

  // State
  const [activeTab, setActiveTab] = useState('all');
  const [assets, setAssets] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);

  // Asset filter by parent
  const [filterByParent, setFilterByParent] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    criticality: 'all',
    parent: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10,
  });
  const [datePreset, setDatePreset] = useState('all');
  const debouncedSearch = useDebounce(filters.search, 300);

  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  // Criticality options
  const criticalityOptions = useMemo(
    () => [
      { value: 'Low', label: 'Low', color: 'bg-green-100 text-green-800' },
      { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-800' },
      { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: 'Operational', label: 'Operational', color: 'bg-green-100 text-green-700 border border-green-300' },
      { value: 'UnderMaintenance', label: 'Under Maintenance', color: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
      { value: 'BrokenDown', label: 'Broken Down', color: 'bg-red-100 text-red-700 border border-red-300' },
      { value: 'Decommissioned', label: 'Decommissioned', color: 'bg-gray-100 text-gray-700 border border-gray-300' },
    ],
    []
  );

  const tabs = useMemo(() => {
    const countFromServer = (status) => counts[status] ?? 0;
    return [
      { id: 'all', name: 'All Assets', count: counts.total ?? totalItems, icon: TbTool, color: 'text-gray-600' },
      { id: 'Operational', name: 'Operational', count: countFromServer('Operational'), icon: CheckCircle, color: 'text-green-600' },
      { id: 'UnderMaintenance', name: 'Under Maintenance', count: countFromServer('UnderMaintenance'), icon: AlertCircle, color: 'text-yellow-600' },
      { id: 'BrokenDown', name: 'Broken Down', count: countFromServer('BrokenDown'), icon: AlertCircle, color: 'text-red-600' },
      { id: 'Decommissioned', name: 'Decommissioned', count: countFromServer('Decommissioned'), icon: CheckCircle2, color: 'text-gray-600' },
    ];
  }, [counts, totalItems]);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (activeTab !== 'all') filterObj.status = activeTab;
      if (filters.category !== 'all') filterObj.category = filters.category;
      if (filters.criticality !== 'all') filterObj.criticality = filters.criticality;
      if (filters.parent !== 'all') filterObj.parent_id = filters.parent;
      if (filterByParent && selectedParent) {
        filterObj.parent_id = selectedParent.id;
      }
      if (filters.dateFrom) filterObj.created_at_from = filters.dateFrom;
      if (filters.dateTo) filterObj.created_at_to = filters.dateTo;

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        searchFields: ['name', 'code', 'description'],
        filters: filterObj,
      };

      const response = await assetAPI.getAssets(payload);
      const data = response.data;

      if (data?.success) {
        setAssets(data.assets || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCounts(data.counts || {});
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err.message || 'Failed to load assets');
      setAssets([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, activeTab, filterByParent, selectedParent]);

  const fetchCategoryOptions = useCallback(async () => {
    try {
      // Replace with actual endpoint to fetch distinct categories, or hardcode
      // For now, you can fetch all assets and extract categories (not efficient) or have a dedicated API
      const response = await assetAPI.getAssetCategories();
      if (response.data?.success) {
        setCategoryOptions(response.data.categories || []);
      }
    } catch (err) {
      console.warn('Could not fetch asset categories:', err);
      // Fallback common categories
      setCategoryOptions(['Pump', 'Motor', 'Conveyor', 'HVAC', 'Compressor', 'Generator', 'Other']);
    }
  }, []);

  const fetchParentOptions = useCallback(async () => {
    try {
      const response = await assetAPI.getAssets({
        page: 1,
        limit: 1000,
        search: '',
        searchFields: [],
        filters: {},
      });
      if (response.data?.success) {
        const assets = response.data.assets || [];
        setParentOptions(assets.map((a) => ({ id: a.id, name: a.name, code: a.code })));
      }
    } catch (err) {
      console.warn('Could not fetch parent options for filter:', err);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchCategoryOptions();
    fetchParentOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevPageRef = useRef(filters.page);
  const prevLimitRef = useRef(filters.limit);
  useEffect(() => {
    if (prevPageRef.current !== filters.page || prevLimitRef.current !== filters.limit) {
      prevPageRef.current = filters.page;
      prevLimitRef.current = filters.limit;
      fetchAssets();
    }
  }, [filters.page, filters.limit, fetchAssets]);

  const handleStatusChange = useCallback((status) => {
    setActiveTab(status);
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  }, []);

  const handleCriticalityChange = useCallback((criticality) => {
    setFilters(prev => ({ ...prev, criticality, page: 1 }));
  }, []);

  const handleParentChange = useCallback((parent) => {
    setFilters(prev => ({ ...prev, parent, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  }, [totalPages]);

  const handleToggleFilterByParent = useCallback(() => {
    setFilterByParent(prev => {
      if (prev) {
        setSelectedParent(null);
        setFilters(prevFilters => ({ ...prevFilters, parent: 'all', page: 1 }));
      }
      return !prev;
    });
  }, []);

  const handleParentSelected = useCallback((parent) => {
    setSelectedParent(parent);
    setFilters(prev => ({ ...prev, parent: parent ? parent.id : 'all', page: 1 }));
    setFilterByParent(true);
    setShowParentModal(false);
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
    setFilters(prev => ({ ...prev, dateFrom: start, dateTo: end, page: 1 }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ search: '', category: 'all', criticality: 'all', parent: 'all', dateFrom: '', dateTo: '', page: 1, limit: 10 });
    setActiveTab('all');
    setDatePreset('all');
    setSelectedParent(null);
    setFilterByParent(false);
    showToast('All filters cleared', 'info');
  }, [showToast]);

  const handleRefresh = useCallback(() => {
    clearAllFilters();
    fetchAssets();
  }, [clearAllFilters, fetchAssets]);

  const handleGetData = useCallback(() => {
    fetchAssets();
  }, [fetchAssets]);

  const hasActiveFilters = useMemo(() =>
    filters.search !== '' || activeTab !== 'all' || filters.category !== 'all' ||
    filters.criticality !== 'all' || filters.parent !== 'all' ||
    filters.dateFrom !== '' || filters.dateTo !== '',
    [filters, activeTab]);

  const getCriticalityColor = useCallback((criticality) => (criticalityOptions.find(c => c.value === criticality) || criticalityOptions[0]).color, [criticalityOptions]);
  const getStatusColor = useCallback((status) => (statusOptions.find(s => s.value === status) || statusOptions[0]).color, [statusOptions]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  // Selection and bulk actions
  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = assets.map(a => a.id);
    setSelectedAssets(selectedAssets.length === ids.length ? [] : ids);
  }, [canBulk, assets, selectedAssets]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk) { showToast('No permission', 'error'); return; }
    if (!bulkAction || selectedAssets.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission', 'error'); return; }
        showConfirmation('Delete Assets', `Delete ${selectedAssets.length} asset(s)?`, 'bulkDelete', async () => {
          await Promise.all(selectedAssets.map(id => assetAPI.deleteAsset(id)));
          setBulkAction(''); setSelectedAssets([]); fetchAssets();
          showToast(`Deleted ${selectedAssets.length} assets`, 'success');
        });
      } else {
        if (!canUpdateStatus) { showToast('No permission', 'error'); return; }
        await Promise.all(selectedAssets.map(id => assetAPI.updateAsset(id, { status: bulkAction })));
        setBulkAction(''); setSelectedAssets([]); fetchAssets();
        showToast(`Updated ${selectedAssets.length} assets`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Bulk action failed', 'error');
    }
  }, [canBulk, bulkAction, selectedAssets, canDelete, canUpdateStatus, fetchAssets, showToast]);

  const handleStatusUpdate = useCallback(async (assetId, newStatus) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }
    try {
      await assetAPI.updateAsset(assetId, { status: newStatus });
      fetchAssets();
      showToast('Status updated', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  }, [canUpdateStatus, fetchAssets, showToast]);

  const handleDeleteAsset = useCallback((assetId) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const asset = assets.find(a => a.id === assetId);
    showConfirmation('Delete Asset', `Delete "${asset?.name}"?`, 'delete', async () => {
      try {
        await assetAPI.deleteAsset(assetId);
        fetchAssets();
        showToast('Asset deleted', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete', 'error');
      }
    });
  }, [canDelete, assets, fetchAssets, showToast]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const openAssetModal = useCallback((asset = null) => {
    if (asset && !canUpdate) { showToast('No permission to edit', 'error'); return; }
    if (!asset && !canCreate) { showToast('No permission to create', 'error'); return; }
    setEditingAsset(asset);
    setShowAssetModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeAssetModal = useCallback(() => {
    setShowAssetModal(false);
    setEditingAsset(null);
  }, []);

  const handleAssetSaved = useCallback(() => {
    closeAssetModal();
    fetchAssets();
    showToast('Asset saved!', 'success');
  }, [closeAssetModal, fetchAssets, showToast]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) { showToast('No permission', 'error'); return; }
    if (assets.length === 0) { showToast('No assets to export', 'error'); return; }
    setExportLoading(true);
    try {
      const headers = [
        'Asset ID', 'Code', 'Name', 'Description', 'Category',
        'Parent ID', 'Location ID', 'Status', 'Criticality',
        'Warranty Expiry', 'Installation Date', 'Created At', 'Updated At',
      ];
      const csvRows = assets.map((asset) => [
        asset.id || '',
        `"${(asset.code || '').replace(/"/g, '""')}"`,
        `"${(asset.name || '').replace(/"/g, '""')}"`,
        `"${(asset.description || '').replace(/"/g, '""')}"`,
        asset.category || '',
        asset.parent_id || '',
        asset.location_id || '',
        asset.status || '',
        asset.criticality || '',
        asset.warranty_expiry_date || '',
        asset.installation_date || '',
        asset.createdAt ? new Date(asset.createdAt).toISOString() : '',
        asset.updatedAt ? new Date(asset.updatedAt).toISOString() : '',
      ]);
      const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `assets_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      showToast(`Exported ${assets.length} assets`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, assets, showToast]);

  const handleAssetImport = useCallback(async (parsedRows) => {
    try {
      const response = await assetAPI.bulkImportAssets({ data: parsedRows });
      const data = response.data;
      if (data.success) {
        showToast(`✅ Import successful: ${data.created} created, ${data.skipped} skipped (duplicates)`, 'success');
      } else if (data.created + data.skipped > 0) {
        showToast(`⚠️ Partial success: ${data.created} created, ${data.skipped} skipped, ${data.failed} failed.`, 'warning');
      } else {
        showToast(`❌ Import failed: ${data.failed} rows.${data.errors ? ' Check logs.' : ''}`, 'error');
        if (data.errors) console.warn('Import errors:', data.errors);
      }
      fetchAssets();
      return data;
    } catch (err) {
      showToast('Bulk import failed: ' + (err.response?.data?.message || err.message), 'error');
      console.error(err);
      return { success: false, message: err.message, failed: parsedRows.length, errors: [] };
    }
  }, [fetchAssets, showToast]);

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Manage and monitor all equipment</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          {canImport && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-2.5 h-2.5" /> Import
            </button>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}

          <button
            onClick={handleToggleFilterByParent}
            className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${filterByParent
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <TbTool className="w-3 h-3" />
            {selectedParent ? selectedParent.name : 'Parent Asset'}
            {filterByParent && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
          </button>

          {filterByParent && (
            <button
              onClick={() => setShowParentModal(true)}
              className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <TbTool className="w-3 h-3" />
              {selectedParent ? 'Change' : 'Select Parent'}
            </button>
          )}

          <button onClick={handleGetData} className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors">
            <RefreshCw className="w-3 h-3" /> Get Data
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>

          {/* Date & per‑page filters moved here */}
          <select value={datePreset} onChange={handleDatePresetChange} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="monthtodate">Month to date</option>
            <option value="previous-month">Previous month</option>
            <option value="yeartodate">Year to date</option>
            <option value="previous-year">Previous year</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />
          <input type="date" value={filters.dateTo} onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />
          <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="5">5 </option>
            <option value="10">10 </option>
            <option value="15">15 </option>
            <option value="25">25</option>
            <option value="50">50 </option>
          </select>

          {canCreate && (
            <button onClick={() => openAssetModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium">
              <Plus className="w-2.5 h-2.5" /> Add Asset
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleStatusChange(tab.id)}
                    className={`px-1.5 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                  >
                    <Icon className={`w-3 h-3 ${activeTab === tab.id ? tab.color : ''}`} /> {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                      }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <select value={filters.category} onChange={(e) => handleCategoryChange(e.target.value)} className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white">
                <option value="all">All Categories</option>
                {categoryOptions.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
              <select value={filters.criticality} onChange={(e) => handleCriticalityChange(e.target.value)} className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white">
                <option value="all">All Criticality</option>
                {criticalityOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={filters.parent} onChange={(e) => handleParentChange(e.target.value)} className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white">
                <option value="all">All Parents</option>
                {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search assets..." value={filters.search} onChange={e => handleSearchChange(e.target.value)} className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-xs" />
              </div>

              {canBulk && selectedAssets.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="Operational">Set Operational</option>
                        <option value="UnderMaintenance">Set Under Maintenance</option>
                        <option value="BrokenDown">Set Broken Down</option>
                        <option value="Decommissioned">Set Decommissioned</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium">Apply</button>
                  <span className="text-xs text-primary-700 font-medium">{selectedAssets.length} selected</span>
                </div>
              )}
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800">Clear all filters</button>
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
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                <h3 className="text-sm font-bold">Unable to Load Assets</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchAssets} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">Try Again</button>
              </div>
            </div>
          ) : assets.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8"><input type="checkbox" checked={selectedAssets.length === assets.length && assets.length > 0} onChange={toggleSelectAll} disabled={!canBulk} className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3" /></th>}
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Children</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Warranty Expiry</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Installation Date</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Criticality</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset, index) => (
                  <AssetRow
                    key={asset.id}
                    asset={asset}
                    index={index}
                    canBulk={canBulk}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    canUpdateStatus={canUpdateStatus}
                    selectedAssets={selectedAssets}
                    toggleAssetSelection={toggleSelection}
                    openAssetModal={openAssetModal}
                    handleStatusUpdate={handleStatusUpdate}
                    handleDeleteAsset={handleDeleteAsset}
                    categoryOptions={categoryOptions}
                    criticalityOptions={criticalityOptions}
                    statusOptions={statusOptions}
                    getCriticalityColor={getCriticalityColor}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><TbTool className="w-4 h-4 text-gray-400" /></div>
                <h3 className="text-sm font-medium">No assets found</h3>
                <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No assets match your search criteria.' : 'Get started by adding your first asset.'}</p>
                {canCreate && <button onClick={() => openAssetModal()} className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"><Plus className="w-2.5 h-2.5" /> Add Asset</button>}
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span>Showing</span><span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                <span>to</span><span className="font-medium">{Math.min(filters.page * filters.limit, totalItems)}</span>
                <span>of</span><span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (filters.page <= 3) pageNum = i + 1;
                  else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = filters.page - 2 + i;
                  return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-6 h-6 text-xs rounded border transition-colors ${filters.page === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{pageNum}</button>
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showAssetModal && (
          <AssetModal
            show={showAssetModal}
            asset={editingAsset}
            onClose={closeAssetModal}
            onSaved={handleAssetSaved}
            assets={assets}
            parentOptions={parentOptions}
            categoryOptions={categoryOptions}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleAssetImport}
            moduleName="assets"
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showParentModal && (
          <AssetSelectionModal
            show={showParentModal}
            onClose={() => setShowParentModal(false)}
            onSelect={handleParentSelected}
            selectedAssetId={selectedParent?.id}
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

export default AssetManagement;