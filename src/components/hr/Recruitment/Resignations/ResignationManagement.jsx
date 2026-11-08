import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, CheckCircle2, AlertCircle, FileText,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const ResignationModal = lazy(() => import('./ResignationModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const ResignationStatusBadge = React.memo(({ status }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-200 text-gray-600',
    revoked: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
});

const ResignationRow = React.memo(({ res, canBulk, selectedIds, toggleSelection, canUpdate, canDelete, openModal, handleDelete }) => {
  const isSelected = selectedIds.includes(res.resignation_id);
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-1 py-1 sticky left-0 bg-white z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(res.resignation_id)}
            className="rounded border-gray-300 text-primary-600 w-3 h-3"
          />
        </td>
      )}
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">{res.resignation_id}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {res.employee?.first_name} {res.employee?.last_name}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] max-w-[150px] truncate" title={res.reason}>
        {res.reason || '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{res.reason_category || 'personal'}</td>
      <td className="px-1 py-1 whitespace-nowrap">
        <ResignationStatusBadge status={res.status} />
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">
        {res.submission_date ? new Date(res.submission_date).toLocaleDateString() : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {res.approved_last_working_day || res.requested_last_working_day || '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-1">
          {canUpdate && (
            <button onClick={() => openModal(res)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50">
              <Edit className="w-3 h-3" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(res.resignation_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

const ResignationManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { isAdmin, hasPermission } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'resignation', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'resignation', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'resignation', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'resignation', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'resignation', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'resignation', 'A4') || canManage, [hasPermission, canManage]);

  const [resignations, setResignations] = useState([]);
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
    search: '',
    status: 'all',
    emp_id: '',
    reason_category: '',
    sortBy: 'submission_date',
    sortOrder: 'DESC',
    page: 1,
    limit: 15,
  });

  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalItems: 0, totalPages: 0 });
  const [confirmation, setConfirmation] = useState({ show: false, title: '', message: '', type: '', onConfirm: null });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);

  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);

  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'revoked', label: 'Revoked' },
  ], []);

  const fetchResignations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search.trim(),
        searchFields: ['first_name', 'last_name'],
        filters: {},
      };
      if (filters.status !== 'all') payload.filters.status = filters.status;
      if (filters.emp_id) payload.filters.emp_id = parseInt(filters.emp_id, 10);
      if (filters.reason_category) payload.filters.reason_category = filters.reason_category;

      const res = await hrAPI.getResignationsAll(payload);
      if (res.data?.success) {
        setResignations(res.data.data || []);
        setCounts(res.data.counts || { total: 0 });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: res.data.pagination?.totalItems || 0,
          totalPages: res.data.pagination?.totalPages || 0,
        });
      } else {
        throw new Error(res.data?.message || 'Failed to fetch');
      }
    } catch (err) {
      setError('Failed to load resignations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchResignations(), 350);
    return () => clearTimeout(timer);
  }, [fetchResignations]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    setExportLoading(true);
    try {
      const res = await hrAPI.getResignationsAll({ limit: 10000, sortBy: 'submission_date', sortOrder: 'DESC' });
      const data = res.data?.data || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = ['ID', 'Employee', 'Reason', 'Category', 'Status', 'Submission Date', 'Last Working Day'];
      const rows = data.map(r => [
        r.resignation_id,
        r.employee?.first_name + ' ' + r.employee?.last_name,
        r.reason || '',
        r.reason_category,
        r.status,
        r.submission_date,
        r.approved_last_working_day || r.requested_last_working_day || ''
      ]);
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `resignations_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful');
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleResignations = [
    ['emp_id', 'reason', 'reason_category', 'notice_period_days', 'requested_last_working_day'],
    ['1', 'Better opportunity', 'career_growth', '30', '2025-06-15'],
    ['2', 'Personal reasons', 'personal', '15', ''],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
        if (!row.reason) throw new Error(`Row ${i+1}: reason required`);
        return {
          emp_id: parseInt(row.emp_id),
          reason: row.reason,
          reason_category: row.reason_category || 'personal',
          notice_period_days: parseInt(row.notice_period_days) || 30,
          requested_last_working_day: row.requested_last_working_day || null,
        };
      });
      await Promise.all(recordsToImport.map(item => hrAPI.createResignation(item)));
      showToast(`Imported ${recordsToImport.length} resignations`, 'success');
      setShowImportModal(false);
      fetchResignations();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [canImport, showToast, fetchResignations]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelectedIds(selectedIds.length === resignations.length ? [] : resignations.map(r => r.resignation_id));
  }, [canBulk, selectedIds, resignations]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selectedIds.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Resignations',
          `Delete ${selectedIds.length} resignation(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedIds.map(id => hrAPI.deleteResignation(id)));
            setSelectedIds([]);
            setBulkAction('');
            fetchResignations();
            showToast(`Deleted ${selectedIds.length} resignations`, 'success');
          }
        );
      } else {
        await Promise.all(selectedIds.map(id => hrAPI.changeResignationStatus(id, { status: bulkAction })));
        setSelectedIds([]);
        setBulkAction('');
        fetchResignations();
        showToast('Status updated', 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
    }
  }, [canBulk, bulkAction, selectedIds, fetchResignations, showToast, showConfirmation]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission', 'error');
    const res = resignations.find(r => r.resignation_id === id);
    showConfirmation(
      'Delete Resignation',
      `Delete resignation for ${res?.employee?.first_name || 'this employee'}?`,
      'delete',
      async () => {
        await hrAPI.deleteResignation(id);
        fetchResignations();
        showToast('Resignation deleted', 'success');
      }
    );
  }, [canDelete, resignations, showToast, fetchResignations, showConfirmation]);

  const openModal = useCallback((res = null) => {
    if (res && !canUpdate) return showToast('No permission to edit', 'error');
    if (!res && !canCreate) return showToast('No permission to create', 'error');
    setEditingRecord(res);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => { setShowModal(false); setEditingRecord(null); }, []);
  const handleSaved = useCallback(() => { closeModal(); fetchResignations(); showToast('Saved!', 'success'); }, [closeModal, fetchResignations, showToast]);

  const handleSearch = useCallback((val) => setFilters(prev => ({ ...prev, search: val, page: 1 })), []);
  const handleFilterChange = useCallback((field, val) => setFilters(prev => ({ ...prev, [field]: val, page: 1 })), []);
  const handleLimitChange = useCallback((val) => setFilters(prev => ({ ...prev, limit: parseInt(val), page: 1 })), []);
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) setFilters(prev => ({ ...prev, page: newPage }));
  }, [pagination.totalPages]);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', emp_id: '', reason_category: '', sortBy: 'submission_date', sortOrder: 'DESC', page: 1, limit: 15 });
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => filters.search || filters.status !== 'all' || filters.emp_id || filters.reason_category, [filters]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    return statusOptions.map(s => ({ id: s.value, name: s.label, count: s.value === 'all' ? allCount : (counts[s.value] || 0) }));
  }, [counts, statusOptions]);

  return (
    <div className="space-y-2 p-2">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
        <p className="text-[10px] text-gray-600">Manage employee resignations</p>
        <div className="flex gap-1">
          {canImport && (
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  const csvContent = sampleResignations.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'resignations_import_template.csv';
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
            <button onClick={() => openModal()} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-[10px] font-medium">
              <Plus className="w-2.5 h-2.5" /> New Resignation
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-1.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
            <div className="flex flex-wrap gap-0.5 bg-gray-100 p-0.5 rounded">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleFilterChange('status', tab.id)}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${
                    filters.status === tab.id
                      ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tab.name} <span className={`px-0.5 py-0.5 text-[9px] rounded-full min-w-3 flex items-center justify-center ${filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-1">
              {canBulk && selectedIds.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[10px] border border-primary-300 rounded px-1 py-0.5 bg-white">
                    <option value="">Bulk</option>
                    <option value="submitted">Submit</option>
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                    <option value="withdrawn">Withdraw</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[10px] font-medium">Apply</button>
                  <span className="text-[10px] text-primary-700 font-medium">{selectedIds.length} sel</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 ${showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'}`}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 w-2.5 h-2.5" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => handleSearch(e.target.value)}
                  className="pl-5 pr-1.5 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-[10px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center"><p className="text-xs text-red-600">{error}</p><button onClick={fetchResignations} className="mt-1 px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Retry</button></div>
            </div>
          ) : resignations.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max text-[10px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && <th className="px-1 py-1 sticky left-0 bg-gray-50"><input type="checkbox" checked={selectedIds.length === resignations.length && resignations.length > 0} onChange={toggleSelectAll} /></th>}
                    <th className="px-1 py-1">ID</th>
                    <th className="px-1 py-1">Employee</th>
                    <th className="px-1 py-1">Reason</th>
                    <th className="px-1 py-1">Category</th>
                    <th className="px-1 py-1">Status</th>
                    <th className="px-1 py-1">Submission</th>
                    <th className="px-1 py-1">Last Day</th>
                    <th className="px-1 py-1 sticky right-0 bg-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resignations.map(r => (
                    <ResignationRow key={r.resignation_id} res={r} canBulk={canBulk} selectedIds={selectedIds}
                      toggleSelection={toggleSelection} canUpdate={canUpdate} canDelete={canDelete}
                      openModal={openModal} handleDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-xs text-gray-600">No resignations found.</p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-1.5 flex flex-col sm:flex-row items-center justify-between gap-1">
              <div className="text-[10px] text-gray-600">
                Showing {(pagination.page - 1) * filters.limit + 1} to {Math.min(pagination.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsLeft className="w-2.5 h-2.5" /></button>
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-2.5 h-2.5" /></button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (pagination.totalPages > 5) {
                    if (pagination.page <= 3) p = i + 1;
                    else if (pagination.page >= pagination.totalPages - 2) p = pagination.totalPages - 4 + i;
                    else p = pagination.page - 2 + i;
                  }
                  return <button key={p} onClick={() => handlePageChange(p)} className={`w-5 h-5 text-[10px] rounded border transition-colors ${pagination.page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{p}</button>
                })}
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-2.5 h-2.5" /></button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsRight className="w-2.5 h-2.5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {showModal && <ResignationModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleSaved} />}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Resignations"
            requiredHeaders={['emp_id', 'reason']}
            sampleRows={sampleResignations}
            formatDescription="Required: emp_id, reason. Optional: reason_category, notice_period_days, requested_last_working_day."
            validateRow={(row, i) => {
              if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
              if (!row.reason) throw new Error(`Row ${i+1}: reason required`);
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

export default ResignationManagement;