import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, Calendar, CheckCircle2, AlertCircle, FileText,
  Clock, Check, XCircle, Ban, RefreshCw, Link
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveRequestModal = lazy(() => import('./LeaveRequestModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const BooleanBadge = memo(({ value }) => (
  <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {value ? 'Yes' : 'No'}
  </span>
));
BooleanBadge.displayName = 'BooleanBadge';

const StatusBadge = memo(({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    partially_approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    withdrawn: 'bg-purple-100 text-purple-800',
  };
  const icons = {
    pending: Clock,
    approved: Check,
    partially_approved: RefreshCw,
    rejected: XCircle,
    cancelled: Ban,
    withdrawn: X,
  };
  const Icon = icons[status] || AlertCircle;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      <Icon className="w-3 h-3" />
      {status || 'unknown'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const ColorSwatch = memo(({ color }) => (
  <span className="inline-block w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color || '#ccc' }} />
));
ColorSwatch.displayName = 'ColorSwatch';

const RequestRow = memo(({ record, canBulk, selected, toggleSelection, canUpdate, canDelete, openModal, handleDelete, handleApprove, handleReject, handleCancel }) => {
  const isSelected = selected.includes(record.leave_req_id);
  const isPending = record.status === 'pending';
  const isApproved = record.status === 'approved';
  const canAction = !['cancelled', 'rejected', 'withdrawn'].includes(record.status);
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '—';
  const formatDateTime = (date) => date ? new Date(date).toLocaleString() : '—';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-2 py-1 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(record.leave_req_id)} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
        </td>
      )}
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.leave_req_id}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-xs">
        {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : 'N/A'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-xs">
        <div className="flex items-center gap-1">
          <ColorSwatch color={record.leave_type?.color} />
          <span>{record.leave_type?.name || 'N/A'}</span>
          <span className="text-gray-500 text-[9px]">({record.leave_type?.code || ''})</span>
        </div>
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{formatDate(record.start_date)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{formatDate(record.end_date)}</td>
      <td className="px-2 py-1 whitespace-nowrap font-medium text-xs">{record.days}</td>
      <td className="px-2 py-1 whitespace-nowrap text-xs"><BooleanBadge value={record.is_half_day} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.half_day_on ? formatDate(record.half_day_on) : '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.half_day_session || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap max-w-24 truncate text-xs" title={record.reason || ''}>{record.reason || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-xs"><BooleanBadge value={record.emergency_leave} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.contact_during_leave || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-xs"><StatusBadge status={record.status} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.current_approval_level ?? 0}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.approved_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDateTime(record.approved_at)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.rejected_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDateTime(record.rejected_at)}</td>
      <td className="px-2 py-1 whitespace-nowrap max-w-24 truncate text-xs" title={record.rejection_reason || ''}>{record.rejection_reason || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.cancelled_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDateTime(record.cancelled_at)}</td>
      <td className="px-2 py-1 whitespace-nowrap max-w-24 truncate text-xs" title={record.cancellation_reason || ''}>{record.cancellation_reason || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-xs">
        {record.attachment_url ? (
          <a href={record.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800"><Link className="w-3 h-3" /></a>
        ) : '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.attachments?.length || 0}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.balance_before ?? '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.balance_after ?? '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-xs"><BooleanBadge value={record.notified_employee} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-xs"><BooleanBadge value={record.notified_manager} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.created_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.updated_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDateTime(record.createdAt)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDateTime(record.updatedAt)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{record.deletedAt ? formatDateTime(record.deletedAt) : '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-0.5">
          {canAction && canUpdate && <button onClick={() => openModal(record)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"><Edit className="w-3 h-3" /></button>}
          {canAction && isPending && (
            <>
              <button onClick={() => handleApprove(record.leave_req_id)} className="text-green-600 hover:text-green-900 p-0.5 rounded hover:bg-green-50" title="Approve"><Check className="w-3 h-3" /></button>
              <button onClick={() => handleReject(record.leave_req_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50" title="Reject"><XCircle className="w-3 h-3" /></button>
            </>
          )}
          {isApproved && (
            <button onClick={() => handleCancel(record.leave_req_id)} className="text-orange-600 hover:text-orange-900 p-0.5 rounded hover:bg-orange-50" title="Cancel"><Ban className="w-3 h-3" /></button>
          )}
          {canDelete && <button onClick={() => handleDelete(record.leave_req_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </td>
    </tr>
  );
});
RequestRow.displayName = 'RequestRow';

const LeaveRequestManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canApprove = useMemo(() => hasPermission('approve', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);
  const canCancel = useMemo(() => hasPermission('cancel', 'leaverequest', 'A4') || canManage, [hasPermission, canManage]);

  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    leave_type_id: 'all',
    emp_id: 'all',
    page: 1,
    limit: 15,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalItems: 0,
    totalPages: 0,
  });

  const [confirmation, setConfirmation] = useState({
    show: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        page: filters.page,
        limit: filters.limit,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };
      if (filters.search.trim()) {
        payload.search = filters.search.trim();
        payload.searchFields = ['employee_name', 'status', 'reason'];
      }
      const filterConditions = {};
      if (filters.status !== 'all') filterConditions.status = filters.status;
      if (filters.leave_type_id !== 'all') filterConditions.leave_type_id = parseInt(filters.leave_type_id);
      if (filters.emp_id !== 'all') filterConditions.emp_id = parseInt(filters.emp_id);
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;
      const response = await hrAPI.getLeaveRequestsAll(payload);
      if (response.data?.success) {
        const { rows, counts, pagination } = response.data;
        setRecords(rows || []);
        setCounts(counts || { total: 0, byStatus: {} });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: pagination?.totalItems || 0,
          totalPages: pagination?.totalPages || 0,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch leave requests');
      }
    } catch (err) {
      setError('Failed to load leave requests. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRecords(), 350);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    try {
      setExportLoading(true);
      const response = await hrAPI.getLeaveRequestsAll({ limit: 10000, sortBy: 'created_at', sortOrder: 'DESC' });
      const data = response.data?.rows || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = [
        'ID', 'Employee', 'Leave Type', 'Start Date', 'End Date', 'Days',
        'Is Half Day', 'Half Day On', 'Half Day Session', 'Reason', 'Emergency',
        'Contact', 'Status', 'Approval Level', 'Approved By', 'Approved At',
        'Rejected By', 'Rejected At', 'Rejection Reason', 'Cancelled By',
        'Cancelled At', 'Cancel Reason', 'Attachment URL', 'Attachments Count',
        'Balance Before', 'Balance After', 'Notified Employee', 'Notified Manager',
        'Created By', 'Updated By', 'Created At', 'Updated At', 'Deleted At'
      ];
      const rows = data.map(r => [
        r.leave_req_id,
        r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'N/A',
        r.leave_type?.name || 'N/A',
        r.start_date || 'N/A',
        r.end_date || 'N/A',
        r.days || 0,
        r.is_half_day ? 'Yes' : 'No',
        r.half_day_on || 'N/A',
        r.half_day_session || 'N/A',
        r.reason || '',
        r.emergency_leave ? 'Yes' : 'No',
        r.contact_during_leave || 'N/A',
        r.status || 'pending',
        r.current_approval_level || 0,
        r.approved_by || 'N/A',
        r.approved_at || 'N/A',
        r.rejected_by || 'N/A',
        r.rejected_at || 'N/A',
        r.rejection_reason || '',
        r.cancelled_by || 'N/A',
        r.cancelled_at || 'N/A',
        r.cancellation_reason || '',
        r.attachment_url || 'N/A',
        r.attachments?.length || 0,
        r.balance_before ?? 'N/A',
        r.balance_after ?? 'N/A',
        r.notified_employee ? 'Yes' : 'No',
        r.notified_manager ? 'Yes' : 'No',
        r.created_by || 'N/A',
        r.updated_by || 'N/A',
        new Date(r.createdAt).toISOString(),
        new Date(r.updatedAt).toISOString(),
        r.deletedAt ? new Date(r.deletedAt).toISOString() : 'N/A'
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleRequests = [
    ['emp_id', 'leave_type_id', 'start_date', 'end_date', 'days', 'reason', 'status'],
    ['1', '1', '2025-05-01', '2025-05-03', '3', 'Vacation', 'pending'],
    ['2', '2', '2025-05-05', '2025-05-05', '1', 'Personal', 'pending'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
        if (!row.leave_type_id) throw new Error(`Row ${i+1}: leave_type_id required`);
        if (!row.start_date || !row.end_date) throw new Error(`Row ${i+1}: start_date and end_date required`);
        return {
          emp_id: parseInt(row.emp_id),
          leave_type_id: parseInt(row.leave_type_id),
          start_date: row.start_date,
          end_date: row.end_date,
          days: parseFloat(row.days) || 0,
          reason: row.reason || '',
          status: row.status || 'pending',
          emergency_leave: row.emergency_leave === 'true',
          is_half_day: row.is_half_day === 'true',
        };
      });
      await Promise.all(recordsToImport.map(record => hrAPI.createLeaveRequest(record)));
      showToast(`Imported ${recordsToImport.length} records`, 'success');
      setShowImportModal(false);
      fetchRecords();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [canImport, showToast, fetchRecords]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelected(selected.length === records.length ? [] : records.map(r => r.leave_req_id));
  }, [canBulk, selected, records]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selected.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Requests',
          `Are you sure you want to delete ${selected.length} request(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selected.map(id => hrAPI.deleteLeaveRequest(id)));
            setSelected([]);
            setBulkAction('');
            fetchRecords();
            showToast(`Deleted ${selected.length} requests`, 'success');
          }
        );
      } else if (bulkAction === 'approve' || bulkAction === 'reject') {
        const actionLabel = bulkAction === 'approve' ? 'approve' : 'reject';
        showConfirmation(
          `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} Requests`,
          `Are you sure you want to ${actionLabel} ${selected.length} request(s)?`,
          'action',
          async () => {
            const promises = selected.map(id =>
              bulkAction === 'approve' ? hrAPI.approveLeaveRequest(id) : hrAPI.rejectLeaveRequest(id, 'Bulk action')
            );
            await Promise.all(promises);
            setSelected([]);
            setBulkAction('');
            fetchRecords();
            showToast(`${selected.length} requests ${actionLabel}d`, 'success');
          }
        );
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selected, fetchRecords, showToast]);

  const handleApprove = useCallback(async (id) => {
    if (!canApprove) return showToast('No permission to approve', 'error');
    setActionLoading(true);
    try {
      await hrAPI.approveLeaveRequest(id);
      fetchRecords();
      showToast('Leave request approved', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [canApprove, fetchRecords, showToast]);

  const handleReject = useCallback(async (id) => {
    if (!canApprove) return showToast('No permission to reject', 'error');
    const reason = prompt('Enter rejection reason (optional):');
    setActionLoading(true);
    try {
      await hrAPI.rejectLeaveRequest(id, reason || undefined);
      fetchRecords();
      showToast('Leave request rejected', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [canApprove, fetchRecords, showToast]);

  const handleCancel = useCallback(async (id) => {
    if (!canCancel) return showToast('No permission to cancel', 'error');
    const reason = prompt('Enter cancellation reason (optional):');
    setActionLoading(true);
    try {
      await hrAPI.cancelLeaveRequest(id, reason || undefined);
      fetchRecords();
      showToast('Leave request cancelled and balance restored', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Cancellation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [canCancel, fetchRecords, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const record = records.find(r => r.leave_req_id === id);
    showConfirmation(
      'Delete Request',
      `Delete leave request for ${record?.employee?.first_name || 'Unknown'}? This cannot be undone.`,
      'delete',
      async () => {
        await hrAPI.deleteLeaveRequest(id);
        fetchRecords();
        showToast('Request deleted', 'success');
      }
    );
  }, [canDelete, records, showToast, fetchRecords]);

  const openModal = useCallback((record = null) => {
    if (record && !canUpdate) return showToast('No permission to edit', 'error');
    if (!record && !canCreate) return showToast('No permission to create', 'error');
    setEditingRecord(record);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => { setShowModal(false); setEditingRecord(null); }, []);

  const handleRecordSaved = useCallback(() => {
    closeModal();
    fetchRecords();
    showToast('Request saved successfully!', 'success');
  }, [closeModal, fetchRecords, showToast]);

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
    setFilters({ search: '', status: 'all', leave_type_id: 'all', emp_id: 'all', page: 1, limit: 15 });
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => filters.search !== '' || filters.status !== 'all' || filters.leave_type_id !== 'all' || filters.emp_id !== 'all', [filters]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    const statusCounts = counts.byStatus || {};
    return [
      { id: 'all', name: 'All', count: allCount, icon: Filter },
      { id: 'pending', name: 'Pending', count: statusCounts.pending || 0, icon: Clock },
      { id: 'approved', name: 'Approved', count: statusCounts.approved || 0, icon: Check },
      { id: 'rejected', name: 'Rejected', count: statusCounts.rejected || 0, icon: XCircle },
    ];
  }, [counts]);

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
        <p className="text-xs text-gray-600">Manage leave requests</p>
        <div className="flex gap-1.5">
          {canImport && (
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  const csvContent = sampleRequests.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'leave_requests_import_template.csv';
                  link.click();
                  showToast('Sample CSV downloaded', 'info');
                }}
                className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-3 h-3" /> Sample
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <Upload className="w-3 h-3" /> Import
              </button>
            </div>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-3 h-3" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium">
              <Plus className="w-3 h-3" /> New Request
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-2 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => handleFilterChange('status', tab.id)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${
                      (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}>
                    <Icon className={`w-3 h-3 ${(tab.id === 'all' && filters.status === 'all') || filters.status === tab.id ? 'text-primary-600' : ''}`} /> {tab.name}
                    <span className={`px-0.5 py-0.5 text-[9px] rounded-full min-w-3 flex items-center justify-center ${
                      (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5">
              {canBulk && selected.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[10px] border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk</option>
                    {canApprove && <option value="approve">Approve</option>}
                    {canApprove && <option value="reject">Reject</option>}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[10px] font-medium">Apply</button>
                  <span className="text-[10px] text-primary-700 font-medium">{selected.length} sel</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition-all ${
                  showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                }`}>
                <SlidersHorizontal className="w-3 h-3" /> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => handleSearch(e.target.value)}
                  className="pl-6 pr-2 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-36 text-[10px]" />
              </div>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-1.5 pt-1.5 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Status</label>
                  <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="partially_approved">Partially Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Leave Type</label>
                  <select value={filters.leave_type_id} onChange={e => handleFilterChange('leave_type_id', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employee</label>
                  <select value={filters.emp_id} onChange={e => handleFilterChange('emp_id', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Per Page</label>
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-1.5 bg-blue-50 rounded border border-blue-200 mt-1.5">
                  <div className="flex items-center gap-0.5 flex-wrap">
                    <span className="text-[10px] font-medium text-blue-800">Filters:</span>
                    {filters.search && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Search: "{filters.search}" <button onClick={() => handleSearch('')} className="ml-0.5 text-blue-600 hover:text-blue-800"><X className="w-2.5 h-2.5" /></button></span>}
                    {filters.status !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded border border-blue-200">Status: {filters.status} <button onClick={() => handleFilterChange('status', 'all')}><X className="w-2.5 h-2.5" /></button></span>}
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
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center"><p className="text-sm text-red-600">{error}</p><button onClick={fetchRecords} className="mt-2 px-3 py-1 bg-primary-600 text-white rounded text-xs">Retry</button></div>
            </div>
          ) : records.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[2200px] text-[10px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-6 sticky left-0 bg-gray-50 z-20"><input type="checkbox" checked={selected.length === records.length && records.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-3 h-3" /></th>}
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">ID</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Employee</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Leave Type</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Start</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">End</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Days</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Half Day</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">HD On</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">HD Session</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Reason</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Emergency</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Contact</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Approval Lvl</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Approved By</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Approved At</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Rejected By</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Rejected At</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Reject Reason</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Cancelled By</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Cancelled At</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Cancel Reason</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Attachment</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Attachments</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Bal Before</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Bal After</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Notif Emp</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Notif Mgr</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Created By</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Updated By</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Created</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Updated</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Deleted</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20 text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(record => (
                    <RequestRow
                      key={record.leave_req_id}
                      record={record}
                      canBulk={canBulk}
                      selected={selected}
                      toggleSelection={toggleSelection}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      openModal={openModal}
                      handleDelete={handleDelete}
                      handleApprove={handleApprove}
                      handleReject={handleReject}
                      handleCancel={handleCancel}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center"><p className="text-sm text-gray-600">No leave requests found.</p></div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-2 flex flex-col sm:flex-row items-center justify-between gap-1.5">
              <div className="text-[10px] text-gray-600">Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}</div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (pagination.totalPages > 5) {
                    if (filters.page <= 3) p = i + 1;
                    else if (filters.page >= pagination.totalPages - 2) p = pagination.totalPages - 4 + i;
                    else p = filters.page - 2 + i;
                  }
                  return <button key={p} onClick={() => handlePageChange(p)} className={`w-6 h-6 text-[10px] rounded border transition-colors ${filters.page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{p}</button>
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {showModal && (
          <LeaveRequestModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleRecordSaved} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Leave Requests"
            requiredHeaders={['emp_id', 'leave_type_id', 'start_date', 'end_date', 'days']}
            sampleRows={sampleRequests}
            formatDescription="Required: emp_id, leave_type_id, start_date, end_date, days. Optional: reason, status."
            validateRow={(row, i) => {
              if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
              if (!row.leave_type_id) throw new Error(`Row ${i+1}: leave_type_id required`);
              if (!row.start_date || !row.end_date) throw new Error(`Row ${i+1}: start_date and end_date required`);
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

export default LeaveRequestManagement;