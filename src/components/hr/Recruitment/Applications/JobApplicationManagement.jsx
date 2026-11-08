import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const JobApplicationModal = lazy(() => import('./JobApplicationModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const AppStatusBadge = React.memo(({ status }) => {
  const colors = {
    applied: 'bg-blue-100 text-blue-700',
    screening: 'bg-purple-100 text-purple-700',
    shortlisted: 'bg-indigo-100 text-indigo-700',
    interview_scheduled: 'bg-yellow-100 text-yellow-800',
    interview_completed: 'bg-orange-100 text-orange-700',
    offered: 'bg-green-100 text-green-700',
    offer_accepted: 'bg-emerald-100 text-emerald-700',
    offer_declined: 'bg-red-100 text-red-700',
    hired: 'bg-teal-100 text-teal-700',
    rejected: 'bg-gray-100 text-gray-700',
    withdrawn: 'bg-gray-200 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
});

const ApplicationRow = React.memo(({
  app, canBulk, selectedIds, toggleSelection,
  canUpdate, canDelete, openModal, handleDelete,
  onStatusChange, transitionRules
}) => {
  const isSelected = selectedIds.includes(app.job_app_id);
  const allowed = transitionRules[app.status] || [];
  const hasTransitions = allowed.length > 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-1 py-1 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(app.job_app_id)}
            className="rounded border-gray-300 text-primary-600 w-3 h-3" />
        </td>
      )}
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">{app.job_app_id}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.job_id}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.org_id}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.candidate_id || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.candidate_first_name}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.candidate_last_name || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.email}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.phone || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.current_company || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.current_position || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.years_experience ?? 0}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.current_ctc ? `₹${parseFloat(app.current_ctc).toLocaleString()}` : '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.expected_ctc ? `₹${parseFloat(app.expected_ctc).toLocaleString()}` : '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.notice_period_days || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.current_location || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.preferred_location || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {app.resume_url ? <a href={app.resume_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a> : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] max-w-[120px] truncate" title={app.cover_letter}>
        {app.cover_letter || '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {app.portfolio_url ? <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a> : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {app.linkedin_url ? <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a> : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {app.github_url ? <a href={app.github_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a> : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] max-w-[100px] truncate" title={app.skills?.join(', ')}>
        {app.skills?.length ? app.skills.join(', ') : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] max-w-[120px] truncate" title={JSON.stringify(app.education)}>
        {app.education?.length ? app.education.map(e => e.degree || e).join(', ') : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] max-w-[100px] truncate" title={app.certifications?.join(', ')}>
        {app.certifications?.length ? app.certifications.join(', ') : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap">
        {canUpdate && hasTransitions ? (
          <select
            value={app.status}
            onChange={(e) => onStatusChange(app.job_app_id, e.target.value)}
            className={`text-[10px] font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1 py-0.5 ${
              {
                applied: 'bg-blue-100 text-blue-700',
                screening: 'bg-purple-100 text-purple-700',
                shortlisted: 'bg-indigo-100 text-indigo-700',
                interview_scheduled: 'bg-yellow-100 text-yellow-800',
                interview_completed: 'bg-orange-100 text-orange-700',
                offered: 'bg-green-100 text-green-700',
                offer_accepted: 'bg-emerald-100 text-emerald-700',
                offer_declined: 'bg-red-100 text-red-700',
                hired: 'bg-teal-100 text-teal-700',
                rejected: 'bg-gray-100 text-gray-700',
                withdrawn: 'bg-gray-200 text-gray-600',
              }[app.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            <option value={app.status} disabled>{app.status?.replace(/_/g, ' ')} (current)</option>
            {allowed.map(st => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
          </select>
        ) : (
          <AppStatusBadge status={app.status} />
        )}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.current_round || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.application_date ? new Date(app.application_date).toLocaleDateString() : '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.source?.replace(/_/g, ' ') || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.referral_emp_id || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.rating ? `${app.rating}/5` : '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] max-w-[120px] truncate" title={app.recruiter_notes}>{app.recruiter_notes || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] max-w-[120px] truncate" title={app.hiring_manager_notes}>{app.hiring_manager_notes || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] max-w-[120px] truncate" title={app.rejection_reason}>{app.rejection_reason || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.recruiter_id || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.hiring_head_id || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.created_by || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{app.updated_by || '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] text-gray-500">{app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] text-gray-500">{app.updated_at ? new Date(app.updated_at).toLocaleDateString() : '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px] text-gray-500">{app.deleted_at ? new Date(app.deleted_at).toLocaleDateString() : '—'}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{JSON.stringify(app.custom_fields || {})}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {app.job?.title || '—'} ({app.job?.requisition_code || '—'})
      </td>
      <td className="px-1 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-1">
          {canUpdate && <button onClick={() => openModal(app)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"><Edit className="w-3 h-3" /></button>}
          {canDelete && <button onClick={() => handleDelete(app.job_app_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </td>
    </tr>
  );
});

const JobApplicationManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { isAdmin, hasPermission } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'application', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'application', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'application', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'application', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'application', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'application', 'A4') || canManage, [hasPermission, canManage]);

  const [applications, setApplications] = useState([]);
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
    search: '', status: 'all', job_id: '', source: '', date_from: '', date_to: '',
    sortBy: 'application_date', sortOrder: 'DESC', page: 1, limit: 15,
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
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview_scheduled', label: 'Interview Scheduled' },
    { value: 'interview_completed', label: 'Interview Completed' },
    { value: 'offered', label: 'Offered' },
    { value: 'offer_accepted', label: 'Offer Accepted' },
    { value: 'offer_declined', label: 'Offer Declined' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ], []);

  const transitionRules = useMemo(() => ({
    applied: ['screening', 'shortlisted', 'rejected', 'withdrawn'],
    screening: ['shortlisted', 'rejected', 'withdrawn'],
    shortlisted: ['interview_scheduled', 'rejected', 'withdrawn'],
    interview_scheduled: ['interview_completed', 'rejected', 'withdrawn'],
    interview_completed: ['offered', 'rejected', 'withdrawn'],
    offered: ['offer_accepted', 'offer_declined', 'withdrawn'],
    offer_accepted: ['hired'],
    offer_declined: [],
    hired: [],
    rejected: [],
    withdrawn: [],
  }), []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search.trim(),
        searchFields: ['candidate_first_name', 'candidate_last_name', 'email'],
        filters: {},
      };
      if (filters.status !== 'all') payload.filters.status = filters.status;
      if (filters.job_id) payload.filters.job_id = parseInt(filters.job_id, 10);
      if (filters.source) payload.filters.source = filters.source;
      if (filters.date_from || filters.date_to) {
        payload.filters.date_from = filters.date_from;
        payload.filters.date_to = filters.date_to;
      }

      const res = await hrAPI.getJobApplicationsAll(payload);
      if (res.data?.success) {
        setApplications(res.data.data || []);
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
      setError('Failed to load applications. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchApplications(), 350);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    if (!canUpdate) return;
    try {
      await hrAPI.changeApplicationStatus(id, { status: newStatus });
      fetchApplications();
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast('Status change failed: ' + (err.message || 'Error'), 'error');
    }
  }, [canUpdate, fetchApplications, showToast]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    setExportLoading(true);
    try {
      const res = await hrAPI.getJobApplicationsAll({ limit: 10000, sortBy: 'application_date', sortOrder: 'DESC' });
      const data = res.data?.data || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = ['App ID','Job ID','Org ID','Candidate ID','First Name','Last Name','Email','Phone','Company','Position','Exp','Curr CTC','Exp CTC','Notice','Location','Pref Loc','Resume','Cover Letter','Portfolio','LinkedIn','GitHub','Skills','Education','Certifications','Status','Round','App Date','Source','Referral','Rating','Rec Notes','Mgr Notes','Rej Reason','Rec ID','Hiring Head','Created By','Updated By','Created','Updated','Deleted','Custom Fields','Job Title','Job Code'];
      const rows = data.map(app => [
        app.job_app_id, app.job_id, app.org_id, app.candidate_id, app.candidate_first_name, app.candidate_last_name, app.email, app.phone,
        app.current_company, app.current_position, app.years_experience, app.current_ctc, app.expected_ctc, app.notice_period_days,
        app.current_location, app.preferred_location, app.resume_url, app.cover_letter?.replace(/,/g, ';'), app.portfolio_url,
        app.linkedin_url, app.github_url, (app.skills||[]).join(';'), JSON.stringify(app.education||[]), (app.certifications||[]).join(';'),
        app.status, app.current_round, app.application_date ? new Date(app.application_date).toISOString() : '', app.source,
        app.referral_emp_id, app.rating, app.recruiter_notes?.replace(/,/g, ';'), app.hiring_manager_notes?.replace(/,/g, ';'),
        app.rejection_reason?.replace(/,/g, ';'), app.recruiter_id, app.hiring_head_id, app.created_by, app.updated_by,
        app.created_at ? new Date(app.created_at).toISOString() : '', app.updated_at ? new Date(app.updated_at).toISOString() : '',
        app.deleted_at ? new Date(app.deleted_at).toISOString() : '', JSON.stringify(app.custom_fields||{}),
        app.job?.title, app.job?.requisition_code
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful');
    } catch (err) { showToast('Export failed', 'error'); }
    finally { setExportLoading(false); }
  }, [canExport, showToast]);

  const sampleApplications = [
    ['job_id', 'candidate_first_name', 'candidate_last_name', 'email', 'phone', 'source'],
    ['1', 'John', 'Doe', 'john@example.com', '9876543210', 'career_portal'],
    ['2', 'Jane', 'Smith', 'jane@example.com', '9876543211', 'linkedin'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.job_id) throw new Error(`Row ${i+1}: job_id required`);
        if (!row.candidate_first_name) throw new Error(`Row ${i+1}: candidate_first_name required`);
        if (!row.email) throw new Error(`Row ${i+1}: email required`);
        return {
          job_id: parseInt(row.job_id),
          candidate_first_name: row.candidate_first_name,
          candidate_last_name: row.candidate_last_name || '',
          email: row.email,
          phone: row.phone || '',
          source: row.source || 'career_portal',
        };
      });
      await Promise.all(recordsToImport.map(a => hrAPI.createJobApplication(a)));
      showToast(`Imported ${recordsToImport.length} applications`, 'success');
      setShowImportModal(false);
      fetchApplications();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [canImport, showToast, fetchApplications]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelectedIds(selectedIds.length === applications.length ? [] : applications.map(a => a.job_app_id));
  }, [canBulk, selectedIds, applications]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selectedIds.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Applications',
          `Delete ${selectedIds.length} application(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedIds.map(id => hrAPI.deleteJobApplication(id)));
            setSelectedIds([]);
            setBulkAction('');
            fetchApplications();
            showToast('Deleted', 'success');
          }
        );
      } else if (['reject', 'shortlist', 'withdraw'].includes(bulkAction)) {
        const statusMap = { reject: 'rejected', shortlist: 'shortlisted', withdraw: 'withdrawn' };
        await Promise.all(selectedIds.map(id => hrAPI.changeApplicationStatus(id, { status: statusMap[bulkAction] })));
        setSelectedIds([]);
        setBulkAction('');
        fetchApplications();
        showToast('Status updated', 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selectedIds, fetchApplications, showToast, showConfirmation]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const app = applications.find(a => a.job_app_id === id);
    showConfirmation(
      'Delete Application',
      `Delete application for ${app?.candidate_first_name}?`,
      'delete',
      async () => {
        await hrAPI.deleteJobApplication(id);
        fetchApplications();
        showToast('Deleted', 'success');
      }
    );
  }, [canDelete, applications, fetchApplications, showToast, showConfirmation]);

  const openModal = useCallback((app = null) => {
    if (app && !canUpdate) return showToast('No permission to edit', 'error');
    if (!app && !canCreate) return showToast('No permission to create', 'error');
    setEditingRecord(app);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => { setShowModal(false); setEditingRecord(null); }, []);

  const handleSaved = useCallback(() => {
    closeModal();
    fetchApplications();
    showToast('Saved', 'success');
  }, [closeModal, fetchApplications, showToast]);

  const handleSearch = useCallback((val) => setFilters(prev => ({ ...prev, search: val, page: 1 })), []);
  const handleFilterChange = useCallback((field, val) => setFilters(prev => ({ ...prev, [field]: val, page: 1 })), []);
  const handleLimitChange = useCallback((val) => setFilters(prev => ({ ...prev, limit: parseInt(val), page: 1 })), []);
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) setFilters(prev => ({ ...prev, page: newPage }));
  }, [pagination.totalPages]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '', status: 'all', job_id: '', source: '', date_from: '', date_to: '',
      sortBy: 'application_date', sortOrder: 'DESC', page: 1, limit: 15
    });
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.status !== 'all' || filters.job_id || filters.source || filters.date_from || filters.date_to;
  }, [filters]);

  const tabs = useMemo(() => {
    const total = counts.total || 0;
    return statusOptions.map(s => ({
      id: s.value,
      name: s.label,
      count: s.value === 'all' ? total : (counts[s.value] || 0),
    }));
  }, [counts, statusOptions]);

  return (
    <div className="space-y-2 p-2">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
        <p className="text-[10px] text-gray-600">Manage job applications</p>
        <div className="flex gap-1">
          {canImport && (
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  const csvContent = sampleApplications.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'job_applications_import_template.csv';
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
              <Plus className="w-2.5 h-2.5" /> New Application
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
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all duration-200 ${
                    filters.status === tab.id
                      ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tab.name} ({tab.count})
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-1">
              {canBulk && selectedIds.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[10px] border border-primary-300 rounded px-1 py-0.5 bg-white">
                    <option value="">Bulk</option>
                    <option value="shortlist">Shortlist</option>
                    <option value="reject">Reject</option>
                    <option value="withdraw">Withdraw</option>
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
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Job ID</label>
                  <input type="number" value={filters.job_id} onChange={e => handleFilterChange('job_id', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded" placeholder="Filter by requisition" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Source</label>
                  <select value={filters.source} onChange={e => handleFilterChange('source', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded">
                    <option value="">All</option>
                    <option value="career_portal">Career Portal</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="naukri">Naukri</option>
                    <option value="indeed">Indeed</option>
                    <option value="employee_referral">Employee Referral</option>
                    <option value="consultancy">Consultancy</option>
                    <option value="campus">Campus</option>
                    <option value="direct">Direct</option>
                    <option value="other">Other</option>
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
                    {filters.job_id && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Job: {filters.job_id} <button onClick={() => handleFilterChange('job_id', '')}><X className="w-2 h-2" /></button></span>}
                    {filters.source && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Source: {filters.source} <button onClick={() => handleFilterChange('source', '')}><X className="w-2 h-2" /></button></span>}
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
              <div className="text-center"><p className="text-xs text-red-600">{error}</p><button onClick={fetchApplications} className="mt-1 px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Retry</button></div>
            </div>
          ) : applications.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max text-[10px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && (
                      <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase w-5 sticky left-0 bg-gray-50 z-20">
                        <input type="checkbox" checked={selectedIds.length === applications.length && applications.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
                      </th>
                    )}
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">App ID</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Job ID</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Org ID</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Cand ID</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">First Name</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Last Name</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Exp</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Curr CTC</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Exp CTC</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Notice</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Pref Loc</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Resume</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Cover Letter</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Portfolio</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">LinkedIn</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">GitHub</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Skills</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Education</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Certifications</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Round</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">App Date</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Referral</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Rec Notes</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Mgr Notes</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Rej Reason</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Rec ID</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Hiring Head</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Created By</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Updated By</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Updated</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Deleted</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Custom Fields</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Job (Title / Code)</th>
                    <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map(app => (
                    <ApplicationRow
                      key={app.job_app_id}
                      app={app}
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
              <div className="text-center"><p className="text-xs text-gray-600">No applications found.</p></div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-1.5 flex flex-col sm:flex-row items-center justify-between gap-1">
              <div className="text-[10px] text-gray-600">
                Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}
              </div>
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
        {showModal && <JobApplicationModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleSaved} />}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Job Applications"
            requiredHeaders={['job_id', 'candidate_first_name', 'email']}
            sampleRows={sampleApplications}
            formatDescription="Required: job_id, candidate_first_name, email. Optional: candidate_last_name, phone, source."
            validateRow={(row, i) => {
              if (!row.job_id) throw new Error(`Row ${i+1}: job_id required`);
              if (!row.candidate_first_name) throw new Error(`Row ${i+1}: candidate_first_name required`);
              if (!row.email) throw new Error(`Row ${i+1}: email required`);
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

export default JobApplicationManagement;