import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, CheckCircle2, AlertCircle, FileText,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const InterviewModal = lazy(() => import('./InterviewModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const InterviewStatusBadge = React.memo(({ status }) => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    rescheduled: 'bg-yellow-100 text-yellow-800',
    no_show: 'bg-gray-200 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
});

const InterviewRow = React.memo(({
  interview, canBulk, selectedIds, toggleSelection,
  canUpdate, canDelete, openModal, handleDelete,
  onStatusChange, transitionRules
}) => {
  const isSelected = selectedIds.includes(interview.interview_id);
  const allowed = transitionRules[interview.status] || [];
  const hasTransitions = allowed.length > 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-1 py-1 sticky left-0 bg-white z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(interview.interview_id)}
            className="rounded border-gray-300 text-primary-600 w-3 h-3"
          />
        </td>
      )}
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">{interview.interview_id}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {interview.application?.candidate_first_name} {interview.application?.candidate_last_name}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {interview.interview_round || `Round ${interview.round_number}`}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{interview.type?.replace(/_/g, ' ')}</td>
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">
        {interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleString() : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{interview.duration_minutes} min</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {interview.interviewer?.first_name} {interview.interviewer?.last_name}
      </td>
      <td className="px-1 py-1 whitespace-nowrap">
        {canUpdate && hasTransitions ? (
          <select
            value={interview.status}
            onChange={(e) => onStatusChange(interview.interview_id, e.target.value)}
            className={`text-[10px] font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1 py-0.5 ${
              {
                scheduled: 'bg-blue-100 text-blue-700',
                completed: 'bg-green-100 text-green-700',
                cancelled: 'bg-red-100 text-red-700',
                rescheduled: 'bg-yellow-100 text-yellow-800',
                no_show: 'bg-gray-200 text-gray-600',
              }[interview.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            <option value={interview.status} disabled>
              {interview.status?.replace(/_/g, ' ')} (current)
            </option>
            {allowed.map(st => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        ) : (
          <InterviewStatusBadge status={interview.status} />
        )}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {interview.overall_rating ? `${interview.overall_rating}/10` : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-1">
          {canUpdate && (
            <button onClick={() => openModal(interview)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50">
              <Edit className="w-3 h-3" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(interview.interview_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

const InterviewManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { isAdmin, hasPermission } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'interview', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'interview', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'interview', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'interview', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'interview', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'interview', 'A4') || canManage, [hasPermission, canManage]);

  const [interviews, setInterviews] = useState([]);
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
    job_application_id: '',
    interviewer_id: '',
    type: '',
    date_from: '',
    date_to: '',
    sortBy: 'scheduled_at',
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
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'no_show', label: 'No Show' },
  ], []);

  const transitionRules = useMemo(() => ({
    scheduled: ['completed', 'cancelled', 'rescheduled', 'no_show'],
    rescheduled: ['scheduled', 'completed', 'cancelled', 'no_show'],
    completed: [],
    cancelled: ['scheduled'],
    no_show: ['scheduled', 'cancelled']
  }), []);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search.trim(),
        searchFields: ['interview_round', 'type', 'location', 'feedback'],
        filters: {},
      };
      if (filters.status !== 'all') payload.filters.status = filters.status;
      if (filters.job_application_id) payload.filters.job_application_id = parseInt(filters.job_application_id, 10);
      if (filters.interviewer_id) payload.filters.interviewer_id = parseInt(filters.interviewer_id, 10);
      if (filters.type) payload.filters.type = filters.type;
      if (filters.date_from || filters.date_to) {
        payload.filters.date_from = filters.date_from;
        payload.filters.date_to = filters.date_to;
      }

      const res = await hrAPI.getInterviewsAll(payload);
      if (res.data?.success) {
        setInterviews(res.data.data || []);
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
      setError('Failed to load interviews. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchInterviews(), 350);
    return () => clearTimeout(timer);
  }, [fetchInterviews]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    if (!canUpdate) return;
    try {
      await hrAPI.changeInterviewStatus(id, { status: newStatus });
      fetchInterviews();
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast('Status change failed: ' + (err.message || 'Error'), 'error');
    }
  }, [canUpdate, fetchInterviews, showToast]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    setExportLoading(true);
    try {
      const res = await hrAPI.getInterviewsAll({ limit: 10000, sortBy: 'scheduled_at', sortOrder: 'DESC' });
      const data = res.data?.data || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = ['ID', 'Candidate', 'Round', 'Type', 'Scheduled At', 'Duration', 'Interviewer', 'Status', 'Rating'];
      const rows = data.map(i => [
        i.interview_id,
        i.application?.candidate_first_name + ' ' + i.application?.candidate_last_name,
        i.interview_round,
        i.type,
        i.scheduled_at,
        i.duration_minutes,
        i.interviewer?.first_name + ' ' + i.interviewer?.last_name,
        i.status,
        i.overall_rating || ''
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `interviews_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful');
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleInterviews = [
    ['job_application_id', 'interviewer_id', 'scheduled_at', 'type', 'interview_round', 'duration_minutes'],
    ['1', '5', '2025-05-20T10:00:00Z', 'phone', 'Screening', '30'],
    ['2', '3', '2025-05-21T14:00:00Z', 'video', 'Technical', '60'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.job_application_id) throw new Error(`Row ${i+1}: job_application_id required`);
        if (!row.interviewer_id) throw new Error(`Row ${i+1}: interviewer_id required`);
        if (!row.scheduled_at) throw new Error(`Row ${i+1}: scheduled_at required`);
        return {
          job_application_id: parseInt(row.job_application_id),
          interviewer_id: parseInt(row.interviewer_id),
          scheduled_at: row.scheduled_at,
          type: row.type || 'phone',
          interview_round: row.interview_round || 'Screening',
          duration_minutes: parseInt(row.duration_minutes) || 30,
        };
      });
      await Promise.all(recordsToImport.map(iv => hrAPI.createInterview(iv)));
      showToast(`Imported ${recordsToImport.length} interviews`, 'success');
      setShowImportModal(false);
      fetchInterviews();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [canImport, showToast, fetchInterviews]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelectedIds(selectedIds.length === interviews.length ? [] : interviews.map(i => i.interview_id));
  }, [canBulk, selectedIds, interviews]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selectedIds.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Interviews',
          `Delete ${selectedIds.length} interview(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedIds.map(id => hrAPI.deleteInterview(id)));
            setSelectedIds([]);
            setBulkAction('');
            fetchInterviews();
            showToast(`Deleted ${selectedIds.length} interviews`, 'success');
          }
        );
      } else if (['cancel', 'reschedule', 'complete'].includes(bulkAction)) {
        const statusMap = { cancel: 'cancelled', reschedule: 'rescheduled', complete: 'completed' };
        await Promise.all(selectedIds.map(id => hrAPI.changeInterviewStatus(id, { status: statusMap[bulkAction] })));
        setSelectedIds([]);
        setBulkAction('');
        fetchInterviews();
        showToast('Status updated', 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selectedIds, fetchInterviews, showToast, showConfirmation]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const interview = interviews.find(i => i.interview_id === id);
    showConfirmation(
      'Delete Interview',
      `Delete interview for ${interview?.application?.candidate_first_name || 'this candidate'}?`,
      'delete',
      async () => {
        await hrAPI.deleteInterview(id);
        fetchInterviews();
        showToast('Interview deleted', 'success');
      }
    );
  }, [canDelete, interviews, showToast, fetchInterviews, showConfirmation]);

  const openModal = useCallback((interview = null) => {
    if (interview && !canUpdate) return showToast('No permission to edit', 'error');
    if (!interview && !canCreate) return showToast('No permission to create', 'error');
    setEditingRecord(interview);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => { setShowModal(false); setEditingRecord(null); }, []);

  const handleSaved = useCallback(() => {
    closeModal();
    fetchInterviews();
    showToast('Interview saved successfully!', 'success');
  }, [closeModal, fetchInterviews, showToast]);

  const handleSearch = useCallback((val) => setFilters(prev => ({ ...prev, search: val, page: 1 })), []);
  const handleFilterChange = useCallback((field, val) => setFilters(prev => ({ ...prev, [field]: val, page: 1 })), []);
  const handleLimitChange = useCallback((val) => setFilters(prev => ({ ...prev, limit: parseInt(val), page: 1 })), []);
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) setFilters(prev => ({ ...prev, page: newPage }));
  }, [pagination.totalPages]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '', status: 'all', job_application_id: '', interviewer_id: '',
      type: '', date_from: '', date_to: '', sortBy: 'scheduled_at', sortOrder: 'DESC', page: 1, limit: 15,
    });
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.status !== 'all' || filters.job_application_id || filters.interviewer_id || filters.type || filters.date_from || filters.date_to;
  }, [filters]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    return statusOptions.map(s => ({
      id: s.value,
      name: s.label,
      count: s.value === 'all' ? allCount : (counts[s.value] || 0),
    }));
  }, [counts, statusOptions]);

  return (
    <div className="space-y-2 p-2">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
        <p className="text-[10px] text-gray-600">Manage interviews</p>
        <div className="flex gap-1">
          {canImport && (
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  const csvContent = sampleInterviews.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'interviews_import_template.csv';
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
              <Plus className="w-2.5 h-2.5" /> New Interview
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
                  {tab.name}
                  <span className={`px-0.5 py-0.5 text-[9px] rounded-full min-w-3 flex items-center justify-center ${
                    filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-1">
              {canBulk && selectedIds.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[10px] border border-primary-300 rounded px-1 py-0.5 bg-white">
                    <option value="">Bulk</option>
                    <option value="cancel">Cancel</option>
                    <option value="reschedule">Reschedule</option>
                    <option value="complete">Complete</option>
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
                  className="pl-5 pr-1.5 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-[10px]" />
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
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Application ID</label>
                  <input type="number" value={filters.job_application_id} onChange={e => handleFilterChange('job_application_id', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded" placeholder="Filter by application" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Interviewer ID</label>
                  <input type="number" value={filters.interviewer_id} onChange={e => handleFilterChange('interviewer_id', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded" placeholder="Filter by interviewer" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Type</label>
                  <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded">
                    <option value="">All</option>
                    <option value="phone">Phone</option>
                    <option value="video">Video</option>
                    <option value="onsite">Onsite</option>
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="managerial">Managerial</option>
                    <option value="panel">Panel</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">From Date</label>
                  <input type="date" value={filters.date_from} onChange={e => handleFilterChange('date_from', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">To Date</label>
                  <input type="date" value={filters.date_to} onChange={e => handleFilterChange('date_to', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded" />
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
                    {filters.status !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Status: {statusOptions.find(s => s.value === filters.status)?.label} <button onClick={() => handleFilterChange('status', 'all')}><X className="w-2 h-2" /></button></span>}
                    {filters.job_application_id && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">App: {filters.job_application_id} <button onClick={() => handleFilterChange('job_application_id', '')}><X className="w-2 h-2" /></button></span>}
                    {filters.interviewer_id && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Int: {filters.interviewer_id} <button onClick={() => handleFilterChange('interviewer_id', '')}><X className="w-2 h-2" /></button></span>}
                    {filters.type && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Type: {filters.type} <button onClick={() => handleFilterChange('type', '')}><X className="w-2 h-2" /></button></span>}
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
              <div className="text-center"><p className="text-xs text-red-600">{error}</p><button onClick={fetchInterviews} className="mt-1 px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Retry</button></div>
            </div>
          ) : interviews.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max text-[10px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && (
                      <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase w-5 sticky left-0 bg-gray-50 z-20">
                        <input type="checkbox" checked={selectedIds.length === interviews.length && interviews.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
                      </th>
                    )}
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Candidate</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Round</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Scheduled At</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Interviewer</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interviews.map(interview => (
                    <InterviewRow
                      key={interview.interview_id}
                      interview={interview}
                      canBulk={canBulk}
                      selectedIds={selectedIds}
                      toggleSelection={toggleSelection}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      openModal={openModal}
                      handleDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      transitionRules={transitionRules}
                    />
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
              <div className="text-center"><p className="text-xs text-gray-600">No interviews found.</p></div>
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
        {showModal && <InterviewModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleSaved} />}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Interviews"
            requiredHeaders={['job_application_id', 'interviewer_id', 'scheduled_at']}
            sampleRows={sampleInterviews}
            formatDescription="Required: job_application_id, interviewer_id, scheduled_at. Optional: type, interview_round, duration_minutes."
            validateRow={(row, i) => {
              if (!row.job_application_id) throw new Error(`Row ${i+1}: job_application_id required`);
              if (!row.interviewer_id) throw new Error(`Row ${i+1}: interviewer_id required`);
              if (!row.scheduled_at) throw new Error(`Row ${i+1}: scheduled_at required`);
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

export default InterviewManagement;