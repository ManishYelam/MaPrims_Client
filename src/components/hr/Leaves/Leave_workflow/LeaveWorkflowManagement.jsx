// src/modules/Leave/Leave_workflows/LeaveWorkflowManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Plus, Edit, Trash2, Eye, Download, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle, AlertCircle, Ban, Users, Power, PowerOff, Loader, ArrowRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveWorkflowModal = lazy(() => import('./LeaveWorkflowModal'));
const ConfirmationModal  = lazy(() => import('../../../../components/common/ConfirmationModal'));
const Toast              = lazy(() => import('../../../../components/common/Toast'));

/* ──────────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────────── */
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const renderArray = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  return arr.join(', ');
};

/* ──────────────────────────────────────────────────────────────────
   BADGES — no border
────────────────────────────────────────────────────────────────── */
const StatusBadge = memo(({ status }) => {
  const colors = {
    active:   'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
  };
  const Icon = status === 'active' ? CheckCircle : Ban;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1 py-0 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      <Icon className="w-2.5 h-2.5" /> {status || 'unknown'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const YesNo = memo(({ value }) => (
  value
    ? <span className="inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-green-100 text-green-700">Yes</span>
    : <span className="inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-red-100 text-red-700">No</span>
));
YesNo.displayName = 'YesNo';

const getStatusColor = (status) => {
  const map = {
    active:   'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

/* ──────────────────────────────────────────────────────────────────
   ROW — Actions FIRST data column
────────────────────────────────────────────────────────────────── */
const WorkflowRow = memo(({
  record, canBulk, selected, toggleSelection,
  canUpdate, canDelete, canUpdateStatus,
  openModal, handleDelete, handleStatusUpdate, handleToggleStatus, togglingStatusIds,
}) => {
  const isSelected = selected.includes(record.leave_workflow_id);
  const isActive = record.status === 'active';
  const isToggling = togglingStatusIds?.has(record.leave_workflow_id);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5 whitespace-nowrap">
          <input type="checkbox" checked={isSelected}
            onChange={() => toggleSelection(record.leave_workflow_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
            aria-label="Select workflow" />
        </td>
      )}

      {/* ✅ ACTIONS — FIRST data column */}
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => openModal(record, true)}
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50"
            title="View" aria-label="View workflow"><Eye className="w-3 h-3" /></button>

          {canUpdate && (
            <button type="button" onClick={() => openModal(record, false)}
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
              title="Edit" aria-label="Edit workflow"><Edit className="w-3 h-3" /></button>
          )}

          {canUpdateStatus && (
            <button
              type="button"
              onClick={() => handleToggleStatus(record)}
              disabled={isToggling}
              title={isActive ? 'Deactivate' : 'Activate'}
              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${
                isToggling ? 'opacity-50 cursor-wait' :
                isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              {isToggling
                ? <Loader className="w-3 h-3 animate-spin" />
                : isActive
                  ? <Power className="w-3 h-3" />
                  : <PowerOff className="w-3 h-3" />}
            </button>
          )}

          {canDelete && (
            <button type="button" onClick={() => handleDelete(record.leave_workflow_id)}
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
              title="Delete" aria-label="Delete workflow"><Trash2 className="w-3 h-3" /></button>
          )}
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{dash(record.leave_workflow_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700">{record.leave_type?.name || dash(record.leave_type_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.level ?? 1}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700 max-w-[200px] truncate" title={record.workflow_name || ''}>
        {record.workflow_name || '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700 max-w-[150px] truncate" title={record.approver_role || ''}>
        {record.approver_role || '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.approver_position_id || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.approver_dept_id || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700 max-w-[200px] truncate" title={renderArray(record.custom_approvers)}>
        {renderArray(record.custom_approvers)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 capitalize text-center">{record.approval_type || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.auto_approve_if_no_action} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 text-center">{record.escalation_hours ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-700 max-w-[150px] truncate" title={record.escalate_to_role || ''}>
        {record.escalate_to_role || '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.is_mandatory} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.can_skip_level} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-center"><YesNo value={record.stop_on_rejection} /></td>

      {/* STATUS — no border, dropdown when editable */}
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        {canUpdateStatus ? (
          <select
            value={record.status || 'active'}
            onChange={(e) => handleStatusUpdate(record.leave_workflow_id, e.target.value)}
            className={`text-[10px] font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1 py-0 ${getStatusColor(record.status)}`}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        ) : (
          <StatusBadge status={record.status} />
        )}
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(record.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.createdAt)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(record.updatedAt)}</td>
    </tr>
  );
});
WorkflowRow.displayName = 'WorkflowRow';

/* ──────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────── */
const LeaveWorkflowManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage       = useMemo(() => isAdmin, [isAdmin]);
  const canCreate       = useMemo(() => hasPermission('create', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate       = useMemo(() => hasPermission('update', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'leave_workflow', 'A4') || canUpdate, [hasPermission, canUpdate]);
  const canDelete       = useMemo(() => hasPermission('delete', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk         = useMemo(() => hasPermission('bulk', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);
  const canExport       = useMemo(() => hasPermission('export', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const [filters, setFilters] = useState({ search: '', page: 1, limit: 50 });
  const debouncedSearch = useDebounce(filters.search, 300);

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null, loading: false,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  /* ── Fetch ── */
  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrAPI.getLeaveWorkflows({ page: 1, limit: 10000 });
      const data = response.data;
      if (data && data.success) setWorkflows(data.data || []);
      else throw new Error(data?.message || 'Invalid response');
    } catch (err) {
      setError(err.message || 'Failed to load workflows');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  /* ── Filtered + pagination ── */
  const filtered = useMemo(() => {
    let result = [...workflows];
    if (activeTab !== 'all') result = result.filter(wf => wf.status === activeTab);
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(wf =>
        wf.workflow_name?.toLowerCase().includes(term) ||
        wf.approver_role?.toLowerCase().includes(term) ||
        wf.leave_type?.name?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [workflows, activeTab, debouncedSearch]);

  const pagination = useMemo(() => {
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / filters.limit));
    const page = Math.min(filters.page, totalPages) || 1;
    const start = (page - 1) * filters.limit;
    return {
      page, totalItems, totalPages,
      paginated: filtered.slice(start, start + filters.limit),
    };
  }, [filtered, filters.page, filters.limit]);

  const tabs = useMemo(() => {
    const all = workflows.length;
    const active = workflows.filter(w => w.status === 'active').length;
    const inactive = workflows.filter(w => w.status === 'inactive').length;
    return [
      { id: 'all',      name: 'All',      count: all,      icon: Users,       color: 'text-gray-600' },
      { id: 'active',   name: 'Active',   count: active,   icon: CheckCircle, color: 'text-green-600' },
      { id: 'inactive', name: 'Inactive', count: inactive, icon: Ban,         color: 'text-gray-500' },
    ];
  }, [workflows]);

  const handleStatusChange = useCallback((status) => {
    setActiveTab(status); setFilters(p => ({ ...p, page: 1 }));
  }, []);
  const handleSearchChange = useCallback((v) => setFilters(p => ({ ...p, search: v, page: 1 })), []);
  const handleLimitChange  = useCallback((v) => setFilters(p => ({ ...p, limit: parseInt(v), page: 1 })), []);
  const handlePageChange   = useCallback((n) => {
    if (n >= 1 && n <= Math.max(pagination.totalPages, 1)) setFilters(p => ({ ...p, page: n }));
  }, [pagination.totalPages]);

  const handleRefresh = useCallback(() => fetchWorkflows(), [fetchWorkflows]);
  const handleGetData = useCallback(() => fetchWorkflows(), [fetchWorkflows]);

  const hasActiveFilters = useMemo(() => (
    filters.search !== '' || activeTab !== 'all'
  ), [filters, activeTab]);

  /* ── Selection ── */
  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = pagination.paginated.map(w => w.leave_workflow_id);
    setSelectedIds(selectedIds.length === ids.length ? [] : ids);
  }, [canBulk, pagination.paginated, selectedIds]);

  /* ── Confirmation (delete only) ── */
  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm, loading: false });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(async () => {
    if (!confirmation.onConfirm) return;
    try {
      setConfirmation(p => ({ ...p, loading: true }));
      await confirmation.onConfirm();
    } finally { hideConfirmation(); }
  }, [confirmation, hideConfirmation]);

  /* ── Bulk ── */
  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || selectedIds.length === 0) return;

    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission', 'error'); return; }
      showConfirmation(
        'Delete Workflows',
        `Delete ${selectedIds.length} workflow(s)? This cannot be undone.`,
        'bulkDelete',
        async () => {
          const ids = [...selectedIds];
          const snapshot = workflows;
          setWorkflows(prev => prev.filter(w => !ids.includes(w.leave_workflow_id)));
          setSelectedIds([]); setBulkAction('');
          try {
            await Promise.all(ids.map(id => hrAPI.deleteLeaveWorkflow(id)));
            showToast(`Deleted ${ids.length} workflow(s)`, 'success');
          } catch {
            setWorkflows(snapshot);
            showToast('Bulk delete failed', 'error');
          }
        }
      );
      return;
    }

    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }
    const targetStatus = bulkAction;
    const ids = [...selectedIds];
    const snapshot = workflows;
    setWorkflows(prev => prev.map(w => ids.includes(w.leave_workflow_id) ? { ...w, status: targetStatus } : w));
    setSelectedIds([]); setBulkAction('');
    try {
      await Promise.all(ids.map(id => hrAPI.updateLeaveWorkflow(id, { status: targetStatus })));
      showToast(`Updated ${ids.length} workflow(s) to "${targetStatus}"`, 'success');
    } catch {
      setWorkflows(snapshot);
      showToast('Bulk update failed', 'error');
    }
  }, [canBulk, canDelete, canUpdateStatus, bulkAction, selectedIds, workflows, showToast, showConfirmation]);

  /* ── Status update via inline select ── */
  const handleStatusUpdate = useCallback(async (id, nextStatus) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }
    const current = workflows.find(w => w.leave_workflow_id === id);
    const currentStatus = current?.status;
    if (currentStatus === nextStatus) return;

    setWorkflows(prev => prev.map(w => w.leave_workflow_id === id ? { ...w, status: nextStatus } : w));
    setTogglingStatusIds(prev => new Set(prev).add(id));
    try {
      await hrAPI.updateLeaveWorkflow(id, { status: nextStatus });
      showToast('Status updated', 'success');
    } catch {
      setWorkflows(prev => prev.map(w => w.leave_workflow_id === id ? { ...w, status: currentStatus } : w));
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingStatusIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [canUpdateStatus, workflows, showToast]);

  /* ── Power/PowerOff toggle ── */
  const handleToggleStatus = useCallback(async (wf) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }

    const id = wf.leave_workflow_id;
    const currentStatus = wf.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    setWorkflows(prev => prev.map(x => x.leave_workflow_id === id ? { ...x, status: nextStatus } : x));
    setTogglingStatusIds(prev => new Set(prev).add(id));
    try {
      await hrAPI.updateLeaveWorkflow(id, { status: nextStatus });
      showToast(`Workflow ${nextStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      setWorkflows(prev => prev.map(x => x.leave_workflow_id === id ? { ...x, status: currentStatus } : x));
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [canUpdateStatus, showToast]);

  /* ── Delete (single) ── */
  const handleDelete = useCallback((id) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const wf = workflows.find(w => w.leave_workflow_id === id);
    showConfirmation(
      'Delete Workflow',
      `Delete "${wf?.workflow_name || wf?.leave_workflow_id}"? This cannot be undone.`,
      'delete',
      async () => {
        const snapshot = workflows;
        setWorkflows(prev => prev.filter(w => w.leave_workflow_id !== id));
        try {
          await hrAPI.deleteLeaveWorkflow(id);
          showToast('Workflow deleted', 'success');
        } catch {
          setWorkflows(snapshot);
          showToast('Delete failed', 'error');
        }
      }
    );
  }, [canDelete, workflows, showToast, showConfirmation]);

  /* ── Modal ── */
  const openModal = useCallback((workflow = null, readOnlyMode = false) => {
    if (workflow && !readOnlyMode && !canUpdate) { showToast('No permission', 'error'); return; }
    if (!workflow && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingWorkflow(workflow);
    setIsReadOnly(readOnlyMode);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => {
    setShowModal(false); setEditingWorkflow(null); setIsReadOnly(false);
  }, []);

  const handleSaved = useCallback(() => {
    closeModal(); fetchWorkflows(); showToast('Workflow saved', 'success');
  }, [closeModal, fetchWorkflows, showToast]);

  /* ── Export to Excel ── */
  const exportToExcel = useCallback(async () => {
    if (!canExport) { showToast('No permission to export', 'error'); return; }
    if (!filtered.length) { showToast('No data to export', 'error'); return; }
    try {
      setExportLoading(true);

      const data = filtered.map(wf => ({
        'ID': wf.leave_workflow_id ?? '',
        'Leave Type': wf.leave_type?.name || '',
        'Level': wf.level ?? 1,
        'Workflow Name': wf.workflow_name || '',
        'Approver Role': wf.approver_role || '',
        'Approver Position ID': wf.approver_position_id ?? '',
        'Approver Dept ID': wf.approver_dept_id ?? '',
        'Custom Approvers': renderArray(wf.custom_approvers),
        'Approval Type': wf.approval_type || '',
        'Auto Approve': wf.auto_approve_if_no_action ? 'Yes' : 'No',
        'Escalation Hours': wf.escalation_hours ?? 0,
        'Escalate To Role': wf.escalate_to_role || '',
        'Mandatory': wf.is_mandatory ? 'Yes' : 'No',
        'Can Skip Level': wf.can_skip_level ? 'Yes' : 'No',
        'Stop on Rejection': wf.stop_on_rejection ? 'Yes' : 'No',
        'Status': wf.status || '',
        'Created By': wf.created_by ?? '',
        'Updated By': wf.updated_by ?? '',
        'Created At': wf.createdAt ? formatDateTime(wf.createdAt) : '',
        'Updated At': wf.updatedAt ? formatDateTime(wf.updatedAt) : '',
      }));

      const rules = [
        { Section: 'Status',   Rule: 'active',   Meaning: 'Workflow is used for approvals' },
        { Section: 'Status',   Rule: 'inactive', Meaning: 'Workflow is disabled' },
        { Section: 'Approval', Rule: 'single',        Meaning: 'One approver decides' },
        { Section: 'Approval', Rule: 'parallel',      Meaning: 'Approvers decide in parallel' },
        { Section: 'Approval', Rule: 'any_one',       Meaning: 'Any one approver is enough' },
        { Section: 'Approval', Rule: 'all_required',  Meaning: 'All approvers must approve' },
        { Section: 'Workflow', Rule: 'active → (Deactivate) → inactive', Meaning: 'Hides from new requests' },
        { Section: 'Workflow', Rule: 'inactive → (Activate) → active',   Meaning: 'Re-enables' },
        { Section: 'Workflow', Rule: 'New workflows start as active',    Meaning: 'Create flow' },
      ];

      const wb = XLSX.utils.book_new();
      const wsData  = XLSX.utils.json_to_sheet(data);
      const wsRules = XLSX.utils.json_to_sheet(rules);
      wsData['!cols'] = [
        { wch: 8 },  { wch: 22 }, { wch: 8 },  { wch: 28 }, { wch: 16 },
        { wch: 18 }, { wch: 18 }, { wch: 24 }, { wch: 14 }, { wch: 14 },
        { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
        { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
      ];
      wsRules['!cols'] = [{ wch: 14 }, { wch: 44 }, { wch: 44 }];

      XLSX.utils.book_append_sheet(wb, wsData,  'Leave Workflows');
      XLSX.utils.book_append_sheet(wb, wsRules, 'Rules & Legend');
      XLSX.writeFile(wb, `leave_workflows_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast(`Exported ${data.length} workflow(s) to Excel`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, filtered, showToast]);

  return (
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      {/* ── TOP TOOLBAR ── */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage approval workflows for leave types</p></div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          <button type="button" onClick={handleGetData}
            className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700">
            <RefreshCw className="w-3 h-3" /> Get Data
          </button>
          <button type="button" onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          {canExport && (
            <button type="button" onClick={exportToExcel} disabled={exportLoading}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Export current filtered data to Excel (.xlsx)">
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting…' : 'Export'}
            </button>
          )}
          {canCreate && (
            <button type="button" onClick={() => openModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium">
              <Plus className="w-2.5 h-2.5" /> New Workflow
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="flex-shrink-0 p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => handleStatusChange(tab.id)}
                    className={`px-1.5 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${active ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
                    <Icon className={`w-3 h-3 ${active ? tab.color : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${active ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white">
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="150">150 per page</option>
                <option value="200">200 per page</option>
                <option value="250">250 per page</option>
                <option value="300">300 per page</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search workflow, role, leave type..."
                  value={filters.search} onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-56 text-xs" />
              </div>

              {canBulk && selectedIds.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && <option value="active">Activate</option>}
                    {canUpdateStatus && <option value="inactive">Deactivate</option>}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium">
                    Apply
                  </button>
                  <span className="text-xs text-primary-700 font-medium">{selectedIds.length} selected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Workflows</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchWorkflows} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : pagination.paginated.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input type="checkbox"
                        checked={selectedIds.length === pagination.paginated.length && pagination.paginated.length > 0}
                        onChange={toggleSelectAll} disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3" />
                    </th>
                  )}
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Level</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Workflow Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Approver Role</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Approver Pos.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Approver Dept.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Custom Approvers</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Approval Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Auto Approve</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Esc. Hrs</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Escalate To</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Mandatory</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Can Skip</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Stop on Rej.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">CBy</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">UBy</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagination.paginated.map(wf => (
                  <WorkflowRow key={wf.leave_workflow_id} record={wf}
                    canBulk={canBulk} selected={selectedIds} toggleSelection={toggleSelection}
                    canUpdate={canUpdate} canDelete={canDelete} canUpdateStatus={canUpdateStatus}
                    openModal={openModal} handleDelete={handleDelete}
                    handleStatusUpdate={handleStatusUpdate} handleToggleStatus={handleToggleStatus}
                    togglingStatusIds={togglingStatusIds} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No workflows found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {hasActiveFilters ? 'No records match your filter criteria.' : 'Get started by adding your first workflow.'}
                </p>
                {canCreate && (
                  <button onClick={() => openModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto">
                    <Plus className="w-2.5 h-2.5" /> New Workflow
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {pagination.totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span>Showing</span>
                <span className="font-medium">{(pagination.page - 1) * filters.limit + 1}</span>
                <span>to</span>
                <span className="font-medium">{Math.min(pagination.page * filters.limit, pagination.totalItems)}</span>
                <span>of</span>
                <span className="font-medium">{pagination.totalItems}</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) pageNum = i + 1;
                  else if (pagination.page <= 3) pageNum = i + 1;
                  else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                  else pageNum = pagination.page - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                      className={`w-6 h-6 text-xs rounded border transition-colors ${pagination.page === pageNum ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{pageNum}</button>
                  );
                })}
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}
                  className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showModal && (
          <LeaveWorkflowModal
            show={showModal}
            workflow={editingWorkflow}
            readOnly={isReadOnly}
            onClose={closeModal}
            onSaved={handleSaved}
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
            loading={confirmation.loading}
          />
        )}
      </Suspense>
    </div>
  );
};

export default LeaveWorkflowManagement;