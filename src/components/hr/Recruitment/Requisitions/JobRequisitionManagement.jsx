import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const JobRequisitionModal = lazy(() => import('./JobRequisitionModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const StatusBadge = React.memo(({ status }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    open: 'bg-green-100 text-green-800',
    on_hold: 'bg-orange-100 text-orange-800',
    closed: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-200 text-red-900',
  };
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
});

const RequisitionRow = React.memo(({
  req, canBulk, selectedIds, toggleSelection,
  canUpdate, canDelete, openModal, handleDelete,
  onStatusChange, transitionRules
}) => {
  const isSelected = selectedIds.includes(req.job_requisition_id);
  const allowed = transitionRules[req.status] || [];
  const hasTransitions = allowed.length > 0;

  const salaryRange =
    req.min_salary || req.max_salary
      ? `₹${parseFloat(req.min_salary || 0).toLocaleString()} - ₹${parseFloat(req.max_salary || 0).toLocaleString()}`
      : '—';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-1 py-1 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(req.job_requisition_id)}
            className="rounded border-gray-300 text-primary-600 w-3 h-3" />
        </td>
      )}
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">{req.job_requisition_id}</td>
      <td className="px-1 py-1 whitespace-nowrap font-medium text-gray-900 text-[10px]">{req.title}</td>
      <td className="px-1 py-1 whitespace-nowrap text-gray-600 text-[10px]">{req.requisition_code}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{req.department?.name || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{req.position?.title || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{req.hiring_head_id || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{req.employment_type?.replace('_', ' ')}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{req.work_mode}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {req.experience_min || req.experience_max
          ? `${req.experience_min || 0} - ${req.experience_max || 0} yrs`
          : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] text-center">{req.filled_positions ?? 0} / {req.vacancy_count}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{salaryRange}</td>
      <td className="px-1 py-1 whitespace-nowrap">
        {canUpdate && hasTransitions ? (
          <select
            value={req.status}
            onChange={(e) => onStatusChange(req.job_requisition_id, e.target.value)}
            className={`text-[10px] font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1 py-0.5 ${
              {
                draft: 'bg-gray-100 text-gray-700',
                pending_approval: 'bg-yellow-100 text-yellow-800',
                approved: 'bg-blue-100 text-blue-800',
                open: 'bg-green-100 text-green-800',
                on_hold: 'bg-orange-100 text-orange-800',
                closed: 'bg-red-100 text-red-800',
                cancelled: 'bg-red-200 text-red-900',
              }[req.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            <option value={req.status} disabled>{req.status?.replace('_', ' ')} (current)</option>
            {allowed.map(st => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
          </select>
        ) : (
          <StatusBadge status={req.status} />
        )}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">{req.posted_date || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">{req.closing_date || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-1">
          {canUpdate && <button onClick={() => openModal(req)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"><Edit className="w-3 h-3" /></button>}
          {canDelete && <button onClick={() => handleDelete(req.job_requisition_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </td>
    </tr>
  );
});

const JobRequisitionManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { isAdmin, hasPermission } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'requisition', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'requisition', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'requisition', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'requisition', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'requisition', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'requisition', 'A4') || canManage, [hasPermission, canManage]);

  const [requisitions, setRequisitions] = useState([]);
  const [counts, setCounts] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '', status: 'all', dept_id: '', page: 1, limit: 15,
  });

  const [pagination, setPagination] = useState({
    page: 1, limit: 15, totalItems: 0, totalPages: 0,
  });

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'open', label: 'Open' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' },
  ], []);

  const transitionRules = useMemo(() => ({
    draft: ['pending_approval', 'cancelled'],
    pending_approval: ['approved', 'cancelled'],
    approved: ['open', 'cancelled'],
    open: ['on_hold', 'closed', 'cancelled'],
    on_hold: ['open', 'closed', 'cancelled'],
    closed: [],
    cancelled: [],
  }), []);

  const fetchRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search.trim(),
        searchFields: ['title', 'requisition_code', 'description'],
        filters: {},
      };
      if (filters.status !== 'all') payload.filters.status = filters.status;
      if (filters.dept_id) payload.filters.dept_id = filters.dept_id;

      const response = await hrAPI.getJobRequisitionsAll(payload);
      if (response.data?.success) {
        const { data, counts, pagination } = response.data;
        setRequisitions(data || []);
        setCounts(counts || { total: 0 });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: pagination?.totalItems || 0,
          totalPages: pagination?.totalPages || 0,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch requisitions');
      }
    } catch (err) {
      setError('Failed to load job requisitions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRequisitions(), 350);
    return () => clearTimeout(timer);
  }, [fetchRequisitions]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    if (!canUpdate) return;
    try {
      await hrAPI.changeRequisitionStatus(id, { status: newStatus });
      fetchRequisitions();
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast('Status change failed: ' + (err.message || 'Error'), 'error');
    }
  }, [canUpdate, fetchRequisitions, showToast]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    try {
      setExportLoading(true);
      const response = await hrAPI.getJobRequisitionsAll({ limit: 10000 });
      const data = response.data?.data || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = [
        'ID', 'Title', 'Code', 'Department', 'Position', 'Hiring Head', 'Employment Type', 'Work Mode',
        'Experience Min', 'Experience Max', 'Vacancy', 'Filled', 'Min Salary', 'Max Salary',
        'Status', 'Posted Date', 'Closing Date'
      ];
      const rows = data.map(r => [
        r.job_requisition_id, r.title, r.requisition_code, r.department?.name || '', r.position?.title || '',
        r.hiring_head_id || '', r.employment_type, r.work_mode,
        r.experience_min || '', r.experience_max || '', r.vacancy_count, r.filled_positions,
        r.min_salary || '', r.max_salary || '', r.status,
        r.posted_date || '', r.closing_date || ''
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `job_requisitions_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleRequisitions = [
    ['title', 'dept_id', 'position_id', 'vacancy_count'],
    ['Software Engineer', '1', '3', '2'],
    ['Manager', '2', '5', '1'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.title) throw new Error(`Row ${i+1}: title required`);
        if (!row.dept_id) throw new Error(`Row ${i+1}: dept_id required`);
        return {
          title: row.title,
          dept_id: parseInt(row.dept_id),
          position_id: parseInt(row.position_id) || null,
          vacancy_count: parseInt(row.vacancy_count) || 1,
          description: row.description || '',
        };
      });
      await Promise.all(recordsToImport.map(req => hrAPI.createJobRequisition(req)));
      showToast(`Imported ${recordsToImport.length} requisitions`, 'success');
      setShowImportModal(false);
      fetchRequisitions();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [canImport, showToast, fetchRequisitions]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelectedIds(selectedIds.length === requisitions.length ? [] : requisitions.map(r => r.job_requisition_id));
  }, [canBulk, selectedIds, requisitions]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selectedIds.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Requisitions',
          `Are you sure you want to delete ${selectedIds.length} requisition(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedIds.map(id => hrAPI.deleteJobRequisition(id)));
            setSelectedIds([]);
            setBulkAction('');
            fetchRequisitions();
            showToast(`Deleted ${selectedIds.length} requisitions`, 'success');
          }
        );
      } else if (bulkAction === 'close') {
        await Promise.all(selectedIds.map(id => hrAPI.changeRequisitionStatus(id, { status: 'closed' })));
        setSelectedIds([]);
        setBulkAction('');
        fetchRequisitions();
        showToast('Requisitions closed', 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selectedIds, fetchRequisitions, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const req = requisitions.find(r => r.job_requisition_id === id);
    showConfirmation(
      'Delete Requisition',
      `Delete "${req?.title || 'this'}"? This cannot be undone.`,
      'delete',
      async () => {
        await hrAPI.deleteJobRequisition(id);
        fetchRequisitions();
        showToast('Requisition deleted', 'success');
      }
    );
  }, [canDelete, requisitions, showToast, fetchRequisitions]);

  const openModal = useCallback((req = null) => {
    if (req && !canUpdate) return showToast('No permission to edit', 'error');
    if (!req && !canCreate) return showToast('No permission to create', 'error');
    setEditingRecord(req);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => { setShowModal(false); setEditingRecord(null); }, []);

  const handleSaved = useCallback(() => {
    closeModal();
    fetchRequisitions();
    showToast('Requisition saved!', 'success');
  }, [closeModal, fetchRequisitions, showToast]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);

  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);

  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleSearch = useCallback((val) => setFilters(prev => ({ ...prev, search: val, page: 1 })), []);
  const handleFilterChange = useCallback((field, val) => setFilters(prev => ({ ...prev, [field]: val, page: 1 })), []);
  const handleLimitChange = useCallback((val) => setFilters(prev => ({ ...prev, limit: parseInt(val), page: 1 })), []);
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) setFilters(prev => ({ ...prev, page: newPage }));
  }, [pagination.totalPages]);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', dept_id: '', page: 1, limit: 15 });
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || filters.status !== 'all' || filters.dept_id !== '';
  }, [filters]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    return statusOptions.map(s => ({
      id: s.value,
      name: s.label,
      count: s.value === 'all' ? allCount : (counts[s.value] || 0),
      icon: Filter,
    }));
  }, [counts, statusOptions]);

  return (
    <div className="space-y-2 p-2">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
        <p className="text-[10px] text-gray-600">Manage job requisitions</p>
        <div className="flex gap-1">
          {canImport && (
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  const csvContent = sampleRequisitions.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'job_requisitions_import_template.csv';
                  link.click();
                  showToast('Sample CSV downloaded', 'info');
                }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-2.5 h-2.5" /> Sample
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50">
                <Upload className="w-2.5 h-2.5" /> Import
              </button>
            </div>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded font-medium text-[10px] shadow-sm">
              <Plus className="w-2.5 h-2.5" /> New Requisition
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-1.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => handleFilterChange('status', tab.id)}
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${
                      filters.status === tab.id ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}>
                    <Icon className={`w-2.5 h-2.5 ${filters.status === tab.id ? 'text-primary-600' : ''}`} /> {tab.name}
                    <span className={`px-0.5 py-0.5 text-[9px] rounded-full min-w-3 flex items-center justify-center ${
                      filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-1">
              {canBulk && selectedIds.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[10px] border border-primary-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk</option>
                    <option value="close">Close</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[10px] font-medium">Apply</button>
                  <span className="text-[10px] text-primary-700 font-medium">{selectedIds.length} sel</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition-all ${
                showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-2.5 h-2.5" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => handleSearch(e.target.value)}
                  className="pl-5 pr-1.5 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-32 text-[10px]" />
              </div>
            </div>
          </div>
          {showAdvancedFilters && (
            <div className="mt-1 pt-1.5 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Status</label>
                  <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded">
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Department ID</label>
                  <input type="number" value={filters.dept_id} onChange={e => handleFilterChange('dept_id', e.target.value)}
                    className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded" placeholder="Filter by dept" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Per Page</label>
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-1 bg-blue-50 rounded border border-blue-200 mt-1">
                  <div className="flex items-center gap-0.5 flex-wrap">
                    <span className="text-[10px] font-medium text-blue-800">Filters:</span>
                    {filters.search && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Search: "{filters.search}" <button onClick={() => handleSearch('')} className="ml-0.5 text-blue-600 hover:text-blue-800"><X className="w-2 h-2" /></button></span>}
                    {filters.status !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Status: {statusOptions.find(s=>s.value===filters.status)?.label} <button onClick={() => handleFilterChange('status', 'all')}><X className="w-2 h-2" /></button></span>}
                    {filters.dept_id && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Dept: {filters.dept_id} <button onClick={() => handleFilterChange('dept_id', '')}><X className="w-2 h-2" /></button></span>}
                  </div>
                  <button onClick={clearFilters} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">Clear</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center"><p className="text-xs text-red-600">{error}</p><button onClick={fetchRequisitions} className="mt-1 px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Retry</button></div>
            </div>
          ) : requisitions.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max text-[10px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase w-5 sticky left-0 bg-gray-50 z-20"><input type="checkbox" checked={selectedIds.length === requisitions.length && requisitions.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-3 h-3" /></th>}
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Dept</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Hiring Head</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Employment</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Mode</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Experience</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Vacancy</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Salary</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Posted</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Closing</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requisitions.map(req => (
                    <RequisitionRow key={req.job_requisition_id} req={req} canBulk={canBulk} selectedIds={selectedIds}
                      toggleSelection={toggleSelection} canUpdate={canUpdate} canDelete={canDelete}
                      openModal={openModal} handleDelete={handleDelete} onStatusChange={handleStatusChange}
                      transitionRules={transitionRules} />
                  ))}
                </tbody>
              </table>
              <div className="px-2 py-1.5 bg-blue-50 border-t border-blue-100 text-[10px] text-blue-800">
                <span className="font-semibold">Status Transition Rules: </span>
                {Object.entries(transitionRules).filter(([_, toList]) => toList.length > 0).map(([from, toList], idx) => (
                  <span key={from}>
                    {idx > 0 && <span className="mx-1">|</span>}
                    <span className="font-medium capitalize">{from.replace('_', ' ')}</span> →{' '}
                    <span className="text-blue-700">{toList.map(s => s.replace('_', ' ')).join(', ')}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center"><p className="text-xs text-gray-600">No requisitions found.</p></div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-1.5 flex flex-col sm:flex-row items-center justify-between gap-1">
              <div className="text-[10px] text-gray-600">Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}</div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsLeft className="w-2.5 h-2.5" /></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-2.5 h-2.5" /></button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (pagination.totalPages > 5) {
                    if (filters.page <= 3) p = i + 1;
                    else if (filters.page >= pagination.totalPages - 2) p = pagination.totalPages - 4 + i;
                    else p = filters.page - 2 + i;
                  }
                  return <button key={p} onClick={() => handlePageChange(p)} className={`w-5 h-5 text-[10px] rounded border transition-colors ${filters.page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{p}</button>
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-2.5 h-2.5" /></button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsRight className="w-2.5 h-2.5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {showModal && <JobRequisitionModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleSaved} />}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Job Requisitions"
            requiredHeaders={['title', 'dept_id', 'position_id', 'vacancy_count']}
            sampleRows={sampleRequisitions}
            formatDescription="Required: title, dept_id, position_id, vacancy_count. Optional: description."
            validateRow={(row, i) => {
              if (!row.title) throw new Error(`Row ${i+1}: title required`);
              if (!row.dept_id) throw new Error(`Row ${i+1}: dept_id required`);
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

export default JobRequisitionManagement;