import React, { useState, useEffect, useCallback, useMemo, useContext, useRef, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, FileText, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal,
  Calendar, CheckCircle, AlertCircle, Clock, CheckCircle2,
  XCircle, RefreshCw, Users, Mail, Phone, Globe, Link as LinkIcon,
  MapPin, Building2, Hash, Layers, Eye, Power, PowerOff, Loader,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const WorkLocationModal = lazy(() => import('./WorkLocationModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const StatusBadge = React.memo(({ status }) => {
  const colorMap = {
    active:   'bg-green-100 text-green-800 border border-green-300',
    inactive: 'bg-gray-100 text-gray-800 border border-gray-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'active'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const LocationTypeBadge = ({ type }) => {
  const colorMap = {
    head_office:    'bg-indigo-100 text-indigo-800',
    branch:         'bg-blue-100 text-blue-800',
    regional_office:'bg-purple-100 text-purple-800',
    warehouse:      'bg-amber-100 text-amber-800',
    factory:        'bg-red-100 text-red-800',
    store:          'bg-emerald-100 text-emerald-800',
    remote:         'bg-cyan-100 text-cyan-800',
  };
  const labelMap = {
    head_office:    'Head Office',
    branch:         'Branch',
    regional_office:'Regional Office',
    warehouse:      'Warehouse',
    factory:        'Factory',
    store:          'Store',
    remote:         'Remote',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${colorMap[type] || 'bg-gray-100'}`}>
      {labelMap[type] || type || 'branch'}
    </span>
  );
};

const WorkLocationManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'worklocations', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'worklocations', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'worklocations', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'worklocations', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'worklocations', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'worklocations', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'worklocations', 'A4') || canManage, [hasPermission, canManage]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [allLocationsCount, setAllLocationsCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    location_type: 'all',
    city: '',
    country: '',
    state: '',
    page: 1,
    limit: 50,   // ✅ default raised to 50 (matches your limit options)
  });

  const fetchingRef = useRef(false);
  const abortControllerRef = useRef(null);

  const locationTypeOptions = useMemo(
    () => [
      { value: 'all', label: 'All Types' },
      { value: 'head_office',    label: 'Head Office' },
      { value: 'branch',         label: 'Branch' },
      { value: 'regional_office',label: 'Regional Office' },
      { value: 'warehouse',      label: 'Warehouse' },
      { value: 'factory',        label: 'Factory' },
      { value: 'store',          label: 'Store' },
      { value: 'remote',         label: 'Remote' },
    ],
    []
  );

  const tabs = useMemo(() => {
    const allCount = allLocationsCount;
    const activeCount   = statusCounts.active || 0;
    const inactiveCount = statusCounts.inactive || 0;
    return [
      { id: 'all', name: 'All Locations', count: allCount, icon: MapPin, color: 'text-gray-600' },
      { id: 'active',   name: 'Active',   count: activeCount,   icon: CheckCircle2, color: 'text-green-600' },
      { id: 'inactive', name: 'Inactive', count: inactiveCount, icon: XCircle,      color: 'text-red-600' },
    ];
  }, [allLocationsCount, statusCounts]);

  const fetchLocations = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const backendFilters = {};
      if (filters.status !== 'all') backendFilters.status = filters.status;
      if (filters.location_type && filters.location_type !== 'all') backendFilters.location_type = filters.location_type;
      if (filters.city) backendFilters.city = filters.city;
      if (filters.state) backendFilters.state = filters.state;
      if (filters.country) backendFilters.country = filters.country;

      const searchFieldsString = ['name', 'code', 'city', 'state', 'country', 'address'].join(',');
      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields: searchFieldsString,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        filters: backendFilters,
      };

      const response = await hrAPI.getAllWorklocations(payload);

      if (!controller.signal.aborted) {
        const data = response.data || response;
        setLocations(data.workLocations || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.counts) {
          setAllLocationsCount(data.counts.total || 0);
          setStatusCounts({
            active: data.counts.active || 0,
            inactive: data.counts.inactive || 0,
          });
        } else {
          const total = data.workLocations?.length || 0;
          setAllLocationsCount(total);
          const counts = { active: 0, inactive: 0 };
          (data.workLocations || []).forEach(loc => {
            if (loc.status === 'active') counts.active++;
            else if (loc.status === 'inactive') counts.inactive++;
          });
          setStatusCounts(counts);
        }
        setError(null);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load locations');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
      fetchingRef.current = false;
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
    }
  }, [filters]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchLocations();
    showToast('Data refreshed', 'success');
  }, [fetchLocations]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);
  useEffect(() => { setFilters(prev => ({ ...prev, page: 1 })); }, [filters.search, filters.status, filters.location_type, filters.city, filters.state, filters.country, filters.limit]);

  const displayedLocations = locations;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });
  const showConfirmation = (title, message, type, onConfirm) =>
    setConfirmation({ show: true, title, message, type, onConfirm });
  const hideConfirmation = () => setConfirmation({ show: false, title: '', message: '', type: '', onConfirm: null });
  const handleConfirm = () => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  };

  const openLocationModal = (location = null, readOnlyMode = false) => {
    if (location && !canUpdate && !readOnlyMode) { showToast('No permission to edit', 'error'); return; }
    if (!location && !canCreate) { showToast('No permission to create', 'error'); return; }
    setEditingLocation(location);
    setIsReadOnly(readOnlyMode);
    setShowLocationModal(true);
  };
  const closeLocationModal = () => { setShowLocationModal(false); setEditingLocation(null); setIsReadOnly(false); };
  const handleLocationSaved = () => { closeLocationModal(); refreshData(); showToast('Location saved!', 'success'); };

  const handleStatusChange = status => setFilters(prev => ({ ...prev, status, page: 1 }));
  const handleLocationTypeChange = type => setFilters(prev => ({ ...prev, location_type: type, page: 1 }));
  const handleSearchChange = value => setFilters(prev => ({ ...prev, search: value, page: 1 }));
  const handleCityChange = value => setFilters(prev => ({ ...prev, city: value, page: 1 }));
  const handleStateChange = value => setFilters(prev => ({ ...prev, state: value, page: 1 }));
  const handleCountryChange = value => setFilters(prev => ({ ...prev, country: value, page: 1 }));
  const handleLimitChange = newLimit => setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  const handlePageChange = newPage => { if (newPage >= 1 && newPage <= totalPages) setFilters(prev => ({ ...prev, page: newPage })); };
  const clearAllFilters = () => {
    setFilters({ search: '', status: 'all', location_type: 'all', city: '', state: '', country: '', page: 1, limit: 50 });
    showToast('Filters cleared', 'info');
  };
  const hasActiveFilters = useMemo(() =>
    filters.search !== '' || filters.status !== 'all' || filters.location_type !== 'all' ||
    filters.city !== '' || filters.state !== '' || filters.country !== '',
    [filters]);

  const toggleLocationSelection = id => {
    if (!canBulk) return;
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    if (!canBulk) return;
    setSelectedLocations(selectedLocations.length === displayedLocations.length ? [] : displayedLocations.map(l => l.work_location_id));
  };

  /* ✅ OPTIMISTIC bulk action — no full refresh unless delete requested */
  const handleBulkAction = async () => {
    if (!canBulk) { showToast('No permission for bulk actions', 'error'); return; }
    if (!bulkAction || selectedLocations.length === 0) return;

    const ids = [...selectedLocations];
    const previousStatusMap = new Map(
      locations.filter(l => ids.includes(l.work_location_id)).map(l => [l.work_location_id, l.status])
    );

    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission to delete', 'error'); return; }
        showConfirmation('Delete Locations', `Delete ${ids.length} location(s)?`, 'bulkDelete', async () => {
          try {
            await Promise.all(ids.map(id => hrAPI.deleteWorklocation(id)));
            // Optimistic remove
            setLocations(prev => prev.filter(l => !ids.includes(l.work_location_id)));
            setTotalItems(prev => Math.max(0, prev - ids.length));
            setAllLocationsCount(prev => Math.max(0, prev - ids.length));
            setBulkAction(''); setSelectedLocations([]);
            showToast(`Deleted ${ids.length} locations`, 'success');
          } catch (err) {
            console.error(err);
            showToast('Bulk delete failed', 'error');
            refreshData();
          }
        });
      } else {
        // bulk status update — optimistic
        if (!canUpdateStatus) { showToast('No permission to update status', 'error'); return; }
        setLocations(prev => prev.map(l =>
          ids.includes(l.work_location_id) ? { ...l, status: bulkAction } : l
        ));
        setStatusCounts(prev => {
          const next = { ...prev };
          let newActive = next.active || 0;
          let newInactive = next.inactive || 0;
          ids.forEach(id => {
            const old = previousStatusMap.get(id);
            if (old === 'active' && bulkAction === 'inactive') { newActive = Math.max(0, newActive - 1); newInactive++; }
            else if (old === 'inactive' && bulkAction === 'active') { newInactive = Math.max(0, newInactive - 1); newActive++; }
          });
          return { active: newActive, inactive: newInactive };
        });
        setBulkAction(''); setSelectedLocations([]);
        try {
          await Promise.all(ids.map(id => hrAPI.updateWorklocation(id, { status: bulkAction })));
          showToast(`Updated ${ids.length} locations to ${bulkAction}`, 'success');
        } catch (err) {
          console.error(err);
          // rollback
          setLocations(prev => prev.map(l => {
            const old = previousStatusMap.get(l.work_location_id);
            return old ? { ...l, status: old } : l;
          }));
          refreshData();
          showToast('Bulk status update failed', 'error');
        }
      }
    } catch (err) { console.error(err); showToast('Bulk action failed', 'error'); }
  };

  /* ✅ OPTIMISTIC inline status update (via <select>) — no full refresh */
  const handleStatusUpdate = async (id, newStatus) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }

    const target = locations.find(l => l.work_location_id === id);
    const currentStatus = target?.status || 'active';
    if (currentStatus === newStatus) return;

    // Optimistic row update
    setLocations(prev => prev.map(l =>
      l.work_location_id === id ? { ...l, status: newStatus } : l
    ));

    // Optimistic counter update
    setStatusCounts(prev => {
      const next = { active: prev.active || 0, inactive: prev.inactive || 0 };
      if (currentStatus === 'active' && newStatus === 'inactive') { next.active = Math.max(0, next.active - 1); next.inactive++; }
      else if (currentStatus === 'inactive' && newStatus === 'active') { next.inactive = Math.max(0, next.inactive - 1); next.active++; }
      return next;
    });

    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await hrAPI.updateWorklocation(id, { status: newStatus });
      showToast('Status updated', 'success');
    } catch (err) {
      console.error(err);
      // rollback row + counters
      setLocations(prev => prev.map(l =>
        l.work_location_id === id ? { ...l, status: currentStatus } : l
      ));
      setStatusCounts(prev => {
        const next = { active: prev.active || 0, inactive: prev.inactive || 0 };
        if (currentStatus === 'active' && newStatus === 'inactive') { next.active++; next.inactive = Math.max(0, next.inactive - 1); }
        else if (currentStatus === 'inactive' && newStatus === 'active') { next.inactive++; next.active = Math.max(0, next.active - 1); }
        return next;
      });
      showToast('Update failed', 'error');
    } finally {
      setTogglingStatusIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  /* ✅ OPTIMISTIC Active / Inactive toggle — no full refresh */
  const handleToggleStatus = async (location) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }
    const id = location.work_location_id;
    const currentStatus = location.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    // Optimistic row update
    setLocations(prev => prev.map(l =>
      l.work_location_id === id ? { ...l, status: nextStatus } : l
    ));

    // Optimistic counters
    setStatusCounts(prev => {
      const next = { active: prev.active || 0, inactive: prev.inactive || 0 };
      if (currentStatus === 'active') { next.active = Math.max(0, next.active - 1); next.inactive++; }
      else { next.inactive = Math.max(0, next.inactive - 1); next.active++; }
      return next;
    });

    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await hrAPI.updateWorklocation(id, { status: nextStatus });
      showToast(`Location ${nextStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      console.error(err);
      // rollback
      setLocations(prev => prev.map(l =>
        l.work_location_id === id ? { ...l, status: currentStatus } : l
      ));
      setStatusCounts(prev => {
        const next = { active: prev.active || 0, inactive: prev.inactive || 0 };
        if (currentStatus === 'active') { next.active++; next.inactive = Math.max(0, next.inactive - 1); }
        else { next.inactive++; next.active = Math.max(0, next.active - 1); }
        return next;
      });
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  /* ✅ OPTIMISTIC delete — no full refresh */
  const handleDeleteLocation = (id) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const target = locations.find(l => l.work_location_id === id);
    showConfirmation('Delete Location', `Delete "${target?.name}"?`, 'delete', async () => {
      const snapshot = locations;
      const snapshotTotal = totalItems;
      const snapshotAll = allLocationsCount;
      const snapshotCounts = statusCounts;

      // Optimistic remove
      setLocations(prev => prev.filter(l => l.work_location_id !== id));
      setTotalItems(prev => Math.max(0, prev - 1));
      setAllLocationsCount(prev => Math.max(0, prev - 1));
      setStatusCounts(prev => {
        const next = { active: prev.active || 0, inactive: prev.inactive || 0 };
        if (target?.status === 'active') next.active = Math.max(0, next.active - 1);
        else if (target?.status === 'inactive') next.inactive = Math.max(0, next.inactive - 1);
        return next;
      });

      try {
        await hrAPI.deleteWorklocation(id);
        showToast('Deleted', 'success');
      } catch (err) {
        console.error(err);
        // rollback
        setLocations(snapshot);
        setTotalItems(snapshotTotal);
        setAllLocationsCount(snapshotAll);
        setStatusCounts(snapshotCounts);
        showToast('Delete failed', 'error');
      }
    });
  };

  const exportToCSV = async () => {
    if (!canExport) { showToast('No permission', 'error'); return; }
    if (displayedLocations.length === 0) { showToast('No data to export', 'error'); return; }
    setExportLoading(true);
    try {
      const headers = [
        'ID', 'Organization', 'Name', 'Code', 'Description', 'Address', 'City', 'State', 'Country',
        'Postal Code', 'Phone', 'Email', 'Location Type', 'Capacity', 'Employee Count',
        'Status', 'Created At', 'Updated At'
      ];
      const csvRows = displayedLocations.map(l => [
        l.work_location_id || '',
        `"${(l.organization?.name || '').replace(/"/g, '""')}"`,
        `"${(l.name || '').replace(/"/g, '""')}"`,
        l.code || '',
        `"${(l.description || '').replace(/"/g, '""')}"`,
        `"${(l.address ? JSON.stringify(l.address) : '').replace(/"/g, '""')}"`,
        l.city || '',
        l.state || '',
        l.country || '',
        l.postal_code || '',
        l.phone || '',
        l.email || '',
        l.location_type || '',
        l.capacity || '',
        l.employeeCount || 0,
        l.status || '',
        l.createdAt ? new Date(l.createdAt).toISOString() : '',
        l.updatedAt ? new Date(l.updatedAt).toISOString() : '',
      ]);
      const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `locations_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      showToast(`Exported ${displayedLocations.length} locations`, 'success');
    } catch (err) { console.error(err); showToast('Export failed', 'error'); }
    finally { setExportLoading(false); }
  };

  const locationSampleRows = [
    ['name', 'code', 'city', 'state', 'country', 'location_type', 'capacity', 'status'],
    ['Mumbai Branch', 'MBR001', 'Mumbai', 'Maharashtra', 'India', 'branch', '50', 'active'],
    ['Delhi Head Office', 'DHO001', 'Delhi', 'Delhi', 'India', 'head_office', '200', 'active'],
  ];

  const handleLocationImport = useCallback(async (parsedRows) => {
    try {
      const validTypes = ['head_office','branch','regional_office','warehouse','factory','store','remote'];
      const validStatuses = ['active', 'inactive'];
      const locationsToImport = parsedRows.map((row, i) => {
        if (!row.name) throw new Error(`Row ${i+1}: Name required`);
        if (!validTypes.includes(row.location_type || 'branch')) throw new Error(`Row ${i+1}: Invalid location_type`);
        if (row.status && !validStatuses.includes(row.status)) throw new Error(`Row ${i+1}: Invalid status`);
        return {
          name: row.name,
          code: row.code || '',
          city: row.city || '',
          state: row.state || '',
          country: row.country || '',
          postal_code: row.postal_code || '',
          phone: row.phone || '',
          email: row.email || '',
          location_type: row.location_type || 'branch',
          capacity: parseInt(row.capacity) || null,
          status: row.status || 'active',
          address: {},
        };
      });
      for (const loc of locationsToImport) {
        await hrAPI.createWorklocation(loc);
      }
      showToast(`Imported ${locationsToImport.length} locations`, 'success');
      setShowImportModal(false);
      refreshData(); // ✅ import creates many rows — keep full refresh here
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [refreshData, showToast]);

  const formatDate = dateString => dateString ? new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : 'Unknown';
  const getStatusColor = status => status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700';
  const truncateText = (text, maxLength = 60) => {
    if (!text) return '-';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  };

  return (
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      {/* Toolbar */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage work locations across your organization</p></div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          {canImport && (<>
            <button onClick={() => {
              const csvContent = locationSampleRows.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
              const blob = new Blob([csvContent], {type: 'text/csv'});
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = 'location_import_template.csv';
              link.click();
              showToast('Sample CSV downloaded', 'info');
            }} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs"><FileText className="w-2.5 h-2.5"/> Sample</button>
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs"><Upload className="w-2.5 h-2.5"/> Import</button>
          </>)}
          {canExport && (<button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs"><Download className="w-2.5 h-2.5"/> {exportLoading ? 'Exporting...' : 'Export All'}</button>)}
          <button onClick={refreshData} disabled={refreshing} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs"><RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`}/> {refreshing ? 'Refreshing...' : 'Refresh'}</button>
          {canCreate && (<button onClick={() => openLocationModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded text-xs shadow-sm"><Plus className="w-2.5 h-2.5"/> New Location</button>)}
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Card header */}
        <div className="flex-shrink-0 p-3 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => { const Icon = tab.icon; return (
                <button key={tab.id} onClick={() => handleStatusChange(tab.id)}
                  className={`px-2 py-1 text-xs font-medium rounded-sm flex items-center gap-1 ${filters.status === tab.id ? 'bg-white text-primary-600 shadow-xs' : 'text-gray-600 hover:bg-gray-200'}`}>
                  <Icon className={`w-3 h-3 ${filters.status === tab.id ? tab.color : ''}`}/> {tab.name}
                  <span className={`px-0.5 py-0.5 text-xs rounded-full ${filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>{tab.count}</span>
                </button>
              )})}
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5">
              {canBulk && selectedLocations.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs border rounded px-1.5 py-0.5">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="active">Set Active</option>
                        <option value="inactive">Set Inactive</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded text-xs">Apply</button>
                  <span className="text-xs text-primary-700">{selectedLocations.length} selected</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <SlidersHorizontal className="w-3 h-3"/> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3"/>
                <input type="text" placeholder="Search locations..." value={filters.search} onChange={e => handleSearchChange(e.target.value)} className="pl-7 pr-2 py-1 border rounded text-xs w-full sm:w-40"/>
              </div>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-2 pt-2 border-t">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Location Type</label>
                  <select value={filters.location_type} onChange={e => handleLocationTypeChange(e.target.value)} className="w-full px-2 py-1 text-xs border rounded">
                    {locationTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">City</label>
                  <input type="text" value={filters.city} onChange={e => handleCityChange(e.target.value)} placeholder="e.g., Mumbai" className="w-full px-2 py-1 text-xs border rounded"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">State</label>
                  <input type="text" value={filters.state} onChange={e => handleStateChange(e.target.value)} placeholder="e.g., Maharashtra" className="w-full px-2 py-1 text-xs border rounded"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Country</label>
                  <input type="text" value={filters.country} onChange={e => handleCountryChange(e.target.value)} placeholder="e.g., India" className="w-full px-2 py-1 text-xs border rounded"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Per Page</label>
                  {/* ✅ NEW LIMIT OPTIONS */}
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-full px-2 py-1 text-xs border rounded">
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                    <option value="150">150 per page</option>
                    <option value="200">200 per page</option>
                    <option value="250">250 per page</option>
                    <option value="300">300 per page</option>
                  </select>
                </div>
              </div>

                            {hasActiveFilters && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded mt-2">
                  <div className="flex flex-wrap gap-1 text-xs">
                    Active Filters:
                    {filters.search && <span className="bg-blue-100 px-1 rounded">Search: {filters.search} <button onClick={() => handleSearchChange('')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.status !== 'all' && <span className="bg-blue-100 px-1 rounded">Status: {filters.status} <button onClick={()=>handleStatusChange('all')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.location_type !== 'all' && <span className="bg-blue-100 px-1 rounded">Type: {locationTypeOptions.find(o=>o.value===filters.location_type)?.label} <button onClick={()=>handleLocationTypeChange('all')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.city && <span className="bg-blue-100 px-1 rounded">City: {filters.city} <button onClick={()=>handleCityChange('')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.state && <span className="bg-blue-100 px-1 rounded">State: {filters.state} <button onClick={()=>handleStateChange('')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.country && <span className="bg-blue-100 px-1 rounded">Country: {filters.country} <button onClick={()=>handleCountryChange('')}><X className="w-2.5 h-2.5"/></button></span>}
                  </div>
                  <button onClick={clearAllFilters} className="text-xs text-blue-600">Clear All</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table body — the ONLY scroll area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading || refreshing ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><Filter className="w-4 h-4 text-red-500"/></div>
                <h3 className="text-sm font-bold">Unable to Load Locations</h3><p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={refreshData} className="px-2 py-1 bg-primary-500 text-white rounded text-xs">Try Again</button>
              </div>
            </div>
          ) : displayedLocations.length > 0 ? (
            <table className="w-full min-w-[1500px]">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  {canBulk && <th className="px-3 py-2 w-8"><input type="checkbox" checked={selectedLocations.length === displayedLocations.length && displayedLocations.length > 0} onChange={toggleSelectAll} className="rounded w-3 h-3" disabled={!canBulk}/></th>}
                  {/* ✅ ACTIONS COLUMN — FIRST */}
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Actions</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Organization</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Name / Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Location</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Postal Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Contact</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Capacity</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Employees</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Created</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">Updated</th>
                </tr>
              </thead>
              <tbody>
                {displayedLocations.map(location => {
                  const isActive = location.status === 'active';
                  const isToggling = togglingStatusIds.has(location.work_location_id);
                  return (
                    <tr key={location.work_location_id} className="hover:bg-gray-50">
                      {canBulk && <td className="px-3 py-2"><input type="checkbox" checked={selectedLocations.includes(location.work_location_id)} onChange={() => toggleLocationSelection(location.work_location_id)} className="rounded w-3 h-3"/></td>}

                      {/* ✅ ACTIONS CELL — FIRST: View | Edit | Active/Inactive | Delete */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          {/* VIEW */}
                          <button
                            onClick={() => openLocationModal(location, true)}
                            title="View Details"
                            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                          </button>

                          {/* EDIT */}
                          {canUpdate && (
                            <button
                              onClick={() => openLocationModal(location, false)}
                              title="Edit"
                              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}

                          {/* ACTIVE / INACTIVE TOGGLE */}
                          {canUpdateStatus && (
                            <button
                              onClick={() => handleToggleStatus(location)}
                              disabled={isToggling}
                              title={isActive ? 'Deactivate' : 'Activate'}
                              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                                isToggling ? 'opacity-50 cursor-wait' :
                                isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              {isToggling ? <Loader className="w-3 h-3 animate-spin" /> :
                               isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                            </button>
                          )}

                          {/* DELETE */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteLocation(location.work_location_id)}
                              title="Delete"
                              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-xs">{location.work_location_id}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{location.organization?.name || location.org_id || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 bg-gray-100 rounded-md flex items-center justify-center"><MapPin className="w-3 h-3 text-gray-500"/></div>
                          <div className="text-xs">
                            <div className="font-medium">{location.name}</div>
                            {location.code && <div className="text-gray-500 text-[10px]"><Hash className="w-2.5 h-2.5 inline"/> {location.code}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs max-w-xs truncate">{truncateText(location.description)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs">
                          {location.city && <div>{location.city}</div>}
                          {location.state && <div className="text-gray-500 text-[10px]">{location.state}, {location.country || ''}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{location.postal_code || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs">
                          {location.phone && <div className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5"/>{location.phone}</div>}
                          {location.email && <div className="flex items-center gap-0.5 text-gray-600"><Mail className="w-2.5 h-2.5"/>{location.email}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap"><LocationTypeBadge type={location.location_type} /></td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{location.capacity ?? '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-center">{location.employeeCount ?? 0}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {canUpdateStatus ? (
                          <select
                            value={location.status}
                            onChange={(e) => handleStatusUpdate(location.work_location_id, e.target.value)}
                            disabled={isToggling}
                            className={`text-xs rounded-full border-0 focus:ring-1 px-1.5 py-0.5 ${getStatusColor(location.status)} ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <StatusBadge status={location.status} />
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{formatDate(location.createdAt || location.created_at)}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{formatDate(location.updatedAt || location.updated_at)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><MapPin className="w-4 h-4 text-gray-400"/></div>
                <h3 className="text-sm font-medium">No locations found</h3>
                <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No matches. Adjust filters.' : 'Create your first work location.'}</p>
                {canCreate && <button onClick={() => openLocationModal()} className="bg-primary-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto"><Plus className="w-2.5 h-2.5"/> New Location</button>}
              </div>
            </div>
          )}
        </div>

        {/* Pagination footer — pinned */}
        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-2 gap-2">
              <div className="text-xs text-gray-600">
                Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, totalItems)} of {totalItems}
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 border rounded disabled:opacity-50"><ChevronsLeft className="w-3 h-3"/></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 border rounded disabled:opacity-50"><ChevronLeft className="w-3 h-3"/></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = totalPages <= 5 ? i + 1 : (filters.page <= 3 ? i + 1 : (filters.page >= totalPages - 2 ? totalPages - 4 + i : filters.page - 2 + i));
                  return (
                    <button key={p} onClick={() => handlePageChange(p)} className={`w-6 h-6 text-xs rounded border ${filters.page === p ? 'bg-primary-600 text-white' : 'hover:bg-gray-50'}`}>{p}</button>
                  );
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 border rounded disabled:opacity-50"><ChevronRight className="w-3 h-3"/></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 border rounded disabled:opacity-50"><ChevronsRight className="w-3 h-3"/></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showLocationModal && (
          <WorkLocationModal
            show={showLocationModal}
            location={editingLocation}
            onClose={closeLocationModal}
            onSaved={handleLocationSaved}
            readOnly={isReadOnly}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleLocationImport}
            moduleName="Work Locations"
            requiredHeaders={['name', 'location_type']}
            sampleRows={locationSampleRows}
            formatDescription={`Required: name, location_type (head_office, branch, regional_office, warehouse, factory, store, remote).\nOptional: code, city, state, country, postal_code, phone, email, capacity, status (active/inactive).`}
            validateRow={(row, i) => {
              if (!row.name) throw new Error(`Row ${i+1}: Name required`);
              const validTypes = ['head_office','branch','regional_office','warehouse','factory','store','remote'];
              if (row.location_type && !validTypes.includes(row.location_type)) throw new Error(`Row ${i+1}: Invalid location_type`);
              if (row.status && !['active','inactive'].includes(row.status)) throw new Error(`Row ${i+1}: Invalid status`);
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

export default WorkLocationManagement;