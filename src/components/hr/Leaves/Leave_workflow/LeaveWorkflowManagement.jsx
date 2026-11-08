import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle2, XCircle, AlertCircle, X, Edit, Trash2,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveWorkflowModal = lazy(() => import('./LeaveWorkflowModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const LeaveWorkflowManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'leave_workflow', 'A4') || canManage, [hasPermission, canManage]);

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState({ show: false, title: '', message: '', type: '', onConfirm: null });

  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1, limit: 15 });
  const debouncedSearch = useDebounce(filters.search, 300);

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

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrAPI.getLeaveWorkflows({ page: 1, limit: 10000 });
      const data = response.data;
      if (data && data.success) {
        setWorkflows(data.data || []);
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load leave workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const filtered = useMemo(() => {
    let result = [...workflows];
    if (filters.status !== 'all') result = result.filter(wf => wf.status === filters.status);
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(wf =>
        wf.workflow_name?.toLowerCase().includes(term) ||
        wf.approver_role?.toLowerCase().includes(term) ||
        wf.leave_type?.name?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [workflows, filters.status, debouncedSearch]);

  const pagination = useMemo(() => {
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / filters.limit);
    const page = Math.min(filters.page, totalPages) || 1;
    const start = (page - 1) * filters.limit;
    const end = start + filters.limit;
    return { page, totalItems, totalPages, paginated: filtered.slice(start, end) };
  }, [filtered, filters.page, filters.limit]);

  const tabs = useMemo(() => {
    const all = workflows.length;
    const active = workflows.filter(w => w.status === 'active').length;
    const inactive = workflows.filter(w => w.status === 'inactive').length;
    return [
      { id: 'all', name: 'All', count: all },
      { id: 'active', name: 'Active', count: active },
      { id: 'inactive', name: 'Inactive', count: inactive },
    ];
  }, [workflows]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(p => ({
      ...p,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  }, []);

  const handlePageChange = useCallback(page => {
    if (page >= 1 && page <= pagination.totalPages) handleFilterChange('page', page);
  }, [pagination.totalPages, handleFilterChange]);

  const toggleSelection = useCallback(id => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = pagination.paginated.map(w => w.leave_workflow_id);
    setSelectedIds(selectedIds.length === ids.length ? [] : ids);
  }, [canBulk, pagination.paginated, selectedIds]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || selectedIds.length === 0) return;

    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission', 'error'); return; }
      showConfirmation(
        'Delete Workflows',
        `Delete ${selectedIds.length} workflow(s)?`,
        'bulkDelete',
        async () => {
          try {
            await Promise.all(selectedIds.map(id => hrAPI.deleteLeaveWorkflow(id)));
            setSelectedIds([]);
            setBulkAction('');
            fetchWorkflows();
            showToast(`Deleted ${selectedIds.length} workflows`, 'success');
          } catch (err) { showToast('Bulk action failed', 'error'); }
        }
      );
    } else {
      try {
        await Promise.all(selectedIds.map(id => hrAPI.updateLeaveWorkflow(id, { status: bulkAction })));
        setSelectedIds([]);
        setBulkAction('');
        fetchWorkflows();
        showToast(`Updated ${selectedIds.length} workflows`, 'success');
      } catch (err) { showToast('Bulk action failed', 'error'); }
    }
  }, [canBulk, bulkAction, selectedIds, canDelete, fetchWorkflows, showToast, showConfirmation]);

  const handleDelete = useCallback(id => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const wf = workflows.find(w => w.leave_workflow_id === id);
    showConfirmation(
      'Delete Workflow',
      `Delete "${wf?.workflow_name || wf?.leave_workflow_id}"?`,
      'delete',
      async () => {
        try {
          await hrAPI.deleteLeaveWorkflow(id);
          fetchWorkflows();
          showToast('Deleted', 'success');
        } catch (err) { showToast('Delete failed', 'error'); }
      }
    );
  }, [canDelete, workflows, fetchWorkflows, showToast, showConfirmation]);

  const openModal = useCallback((workflow = null) => {
    if (workflow && !canUpdate) { showToast('No permission', 'error'); return; }
    if (!workflow && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingWorkflow(workflow);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const handleSaved = useCallback(() => {
    setShowModal(false);
    fetchWorkflows();
    showToast('Workflow saved!', 'success');
  }, [fetchWorkflows, showToast]);

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
  };

  const renderJSONArray = (arr) => {
    if (!arr || arr.length === 0) return '—';
    return arr.join(', ');
  };

  const YesNo = ({ value }) => (
    value ? (
      <span className="text-green-600 font-medium text-[9px]">Yes</span>
    ) : (
      <span className="text-gray-400 text-[9px]">No</span>
    )
  );

  return (
    <div className="space-y-2 p-2">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
        <p className="text-[10px] text-gray-600">Manage approval workflows for leave types</p>
        <div className="flex gap-1.5 mt-1 lg:mt-0">
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-1 px-2.5 py-1 bg-primary-600 text-white rounded text-[10px] font-medium hover:bg-primary-700">
              <Plus className="w-3.5 h-3.5" /> Add Workflow
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-1.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded overflow-x-auto">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => handleFilterChange('status', tab.id)}
                  className={`px-2 py-0.5 text-[9px] font-medium rounded-sm transition-all ${filters.status === tab.id ? 'bg-white text-primary-600 shadow-sm border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}>
                  {tab.name} <span className={`ml-0.5 px-1 py-0.5 text-[8px] rounded-full ${filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {canBulk && selectedIds.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md p-1">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
                    className="text-[8px] border border-primary-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk</option>
                    <option value="active">Set Active</option>
                    <option value="inactive">Set Inactive</option>
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[8px] font-medium">
                    Apply
                  </button>
                  <span className="text-[8px] text-primary-700 font-medium">{selectedIds.length} sel</span>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-2.5 h-2.5" />
                <input type="text" placeholder="Search..." value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="pl-5 pr-1.5 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-36 text-[9px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[10px] text-gray-500">
              Loading...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-[10px] text-red-600">
              {error}
            </div>
          ) : pagination.paginated.length > 0 ? (
            <table className="w-max min-w-full text-[9px] border-collapse">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-1 py-1 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === pagination.paginated.length &&
                          pagination.paginated.length > 0
                        }
                        onChange={toggleSelectAll}
                        disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 w-2.5 h-2.5"
                      />
                    </th>
                  )}

                  <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">
                    ID
                  </th>

                  <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">
                    Leave Type
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Level
                  </th>

                  <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">
                    Workflow Name
                  </th>

                  <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">
                    Approver Role
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Approver Pos. ID
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Approver Dept. ID
                  </th>

                  <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">
                    Custom Approvers
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Approval Type
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Auto Approve
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Escalation Hrs
                  </th>

                  <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">
                    Escalate To Role
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Mandatory
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Can Skip
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Stop on Reject
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Status
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Created By
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Updated By
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Created At
                  </th>

                  <th className="px-1 py-1 text-center font-medium text-gray-500 uppercase whitespace-nowrap">
                    Updated At
                  </th>

                  <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {pagination.paginated.map(wf => (
                  <tr
                    key={wf.leave_workflow_id}
                    className="hover:bg-gray-50"
                  >
                    {canBulk && (
                      <td className="px-1 py-1 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(wf.leave_workflow_id)}
                          onChange={() =>
                            toggleSelection(wf.leave_workflow_id)
                          }
                          className="rounded border-gray-300 text-primary-600 w-2.5 h-2.5"
                        />
                      </td>
                    )}

                    <td className="px-1 py-1 font-mono text-gray-600 whitespace-nowrap">
                      {wf.leave_workflow_id}
                    </td>

                    <td className="px-1 py-1 font-medium whitespace-nowrap">
                      {wf.leave_type?.name || wf.leave_type_id}
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      {wf.level}
                    </td>

                    <td
                      className="px-1 py-1 text-gray-700 max-w-[250px] truncate"
                      title={wf.workflow_name || ''}
                    >
                      {wf.workflow_name || '—'}
                    </td>

                    <td
                      className="px-1 py-1 text-gray-700 max-w-[180px] truncate"
                      title={wf.approver_role || ''}
                    >
                      {wf.approver_role || '—'}
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      {wf.approver_position_id || '—'}
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      {wf.approver_dept_id || '—'}
                    </td>

                    <td
                      className="px-1 py-1 text-gray-700 max-w-[250px] truncate"
                      title={renderJSONArray(wf.custom_approvers)}
                    >
                      {renderJSONArray(wf.custom_approvers)}
                    </td>

                    <td className="px-1 py-1 text-center capitalize whitespace-nowrap">
                      {wf.approval_type}
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      <YesNo value={wf.auto_approve_if_no_action} />
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      {wf.escalation_hours}
                    </td>

                    <td
                      className="px-1 py-1 text-gray-700 max-w-[180px] truncate"
                      title={wf.escalate_to_role || ''}
                    >
                      {wf.escalate_to_role || '—'}
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      <YesNo value={wf.is_mandatory} />
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      <YesNo value={wf.can_skip_level} />
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      <YesNo value={wf.stop_on_rejection} />
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      <span
                        className={`px-1 py-0.5 rounded-full text-[8px] font-medium ${wf.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {wf.status}
                      </span>
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      {wf.created_by || '—'}
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      {wf.updated_by || '—'}
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      {formatDateTime(wf.createdAt)}
                    </td>

                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      {formatDateTime(wf.updatedAt)}
                    </td>

                    <td className="px-1 py-1 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {canUpdate && (
                          <button
                            onClick={() => openModal(wf)}
                            className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() =>
                              handleDelete(wf.leave_workflow_id)
                            }
                            className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-[10px] text-gray-500">
              No leave workflows found.
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[9px] text-gray-600">
                Showing {(pagination.page - 1) * filters.limit + 1} to {Math.min(pagination.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1}
                  className="p-0.5 rounded border disabled:opacity-50">
                  <ChevronsLeft className="w-3 h-3" />
                </button>
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}
                  className="p-0.5 rounded border disabled:opacity-50">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) pageNum = i + 1;
                  else if (pagination.page <= 3) pageNum = i + 1;
                  else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                  else pageNum = pagination.page - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                      className={`w-5 h-5 text-[8px] rounded border ${pagination.page === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                  className="p-0.5 rounded border disabled:opacity-50">
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}
                  className="p-0.5 rounded border disabled:opacity-50">
                  <ChevronsRight className="w-3 h-3" />
                </button>
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
            onClose={() => setShowModal(false)}
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
          />
        )}
      </Suspense>
    </div>
  );
};

export default LeaveWorkflowManagement;