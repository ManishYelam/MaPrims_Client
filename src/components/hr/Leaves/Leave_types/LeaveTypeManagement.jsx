import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle2, XCircle, AlertCircle, X, Edit, Trash2, Circle,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveTypeModal = lazy(() => import('./LeaveTypeModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const LeaveTypeManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'leave_type', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'leave_type', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'leave_type', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'leave_type', 'A4') || canManage, [hasPermission, canManage]);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState({ show: false, title: '', message: '', type: '', onConfirm: null });

  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1, limit: 10 });
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

  const fetchLeaveTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrAPI.getLeaveTypes({ page: 1, limit: 10000 });
      const data = response.data;
      if (data && data.success) {
        setLeaveTypes(data.data || []);
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load leave types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const filtered = useMemo(() => {
    let result = [...leaveTypes];
    if (filters.status !== 'all') result = result.filter(lt => lt.status === filters.status);
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(lt =>
        lt.name?.toLowerCase().includes(term) ||
        lt.code?.toLowerCase().includes(term) ||
        lt.description?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [leaveTypes, filters.status, debouncedSearch]);

  const pagination = useMemo(() => {
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / filters.limit);
    const page = Math.min(filters.page, totalPages) || 1;
    const start = (page - 1) * filters.limit;
    const end = start + filters.limit;
    return { page, totalItems, totalPages, paginated: filtered.slice(start, end) };
  }, [filtered, filters.page, filters.limit]);

  const tabs = useMemo(() => {
    const all = leaveTypes.length;
    const active = leaveTypes.filter(l => l.status === 'active').length;
    const inactive = leaveTypes.filter(l => l.status === 'inactive').length;
    return [
      { id: 'all', name: 'All', count: all },
      { id: 'active', name: 'Active', count: active },
      { id: 'inactive', name: 'Inactive', count: inactive },
    ];
  }, [leaveTypes]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(p => ({
      ...p,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  }, []);

  const handlePageChange = useCallback(page => {
    if (page >= 1 && page <= pagination.totalPages) {
      handleFilterChange('page', page);
    }
  }, [pagination.totalPages, handleFilterChange]);

  const toggleSelection = useCallback(id => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = pagination.paginated.map(l => l.leave_type_id);
    setSelectedIds(selectedIds.length === ids.length ? [] : ids);
  }, [canBulk, pagination.paginated, selectedIds]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || selectedIds.length === 0) return;

    if (bulkAction === 'delete') {
      if (!canDelete) { showToast('No permission', 'error'); return; }
      showConfirmation(
        'Delete Leave Types',
        `Are you sure you want to delete ${selectedIds.length} leave type(s)?`,
        'bulkDelete',
        async () => {
          try {
            await Promise.all(selectedIds.map(id => hrAPI.deleteLeaveType(id)));
            setSelectedIds([]);
            setBulkAction('');
            fetchLeaveTypes();
            showToast(`Deleted ${selectedIds.length} leave types`, 'success');
          } catch (err) {
            showToast('Bulk action failed', 'error');
          }
        }
      );
    } else {
      try {
        await Promise.all(selectedIds.map(id => hrAPI.updateLeaveType(id, { status: bulkAction })));
        setSelectedIds([]);
        setBulkAction('');
        fetchLeaveTypes();
        showToast(`Updated ${selectedIds.length} leave types`, 'success');
      } catch (err) {
        showToast('Bulk action failed', 'error');
      }
    }
  }, [canBulk, bulkAction, selectedIds, canDelete, fetchLeaveTypes, showToast, showConfirmation]);

  const handleDelete = useCallback(id => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const lt = leaveTypes.find(l => l.leave_type_id === id);
    showConfirmation(
      'Delete Leave Type',
      `Are you sure you want to delete "${lt?.name}"?`,
      'delete',
      async () => {
        try {
          await hrAPI.deleteLeaveType(id);
          fetchLeaveTypes();
          showToast('Deleted', 'success');
        } catch (err) {
          showToast('Delete failed', 'error');
        }
      }
    );
  }, [canDelete, leaveTypes, fetchLeaveTypes, showToast, showConfirmation]);

  const openModal = useCallback((leaveType = null) => {
    if (leaveType && !canUpdate) { showToast('No permission', 'error'); return; }
    if (!leaveType && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingLeaveType(leaveType);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const handleSaved = useCallback(() => {
    setShowModal(false);
    fetchLeaveTypes();
    showToast('Leave type saved!', 'success');
  }, [fetchLeaveTypes, showToast]);

  const YesNo = ({ value }) => (value ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>);

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-2 p-2">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] text-gray-600">Manage leave types and policies</p>
        </div>
        <div className="flex gap-1.5 mt-1.5 lg:mt-0">
          {canCreate && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-1 px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-[10px] font-medium"
            >
              <Plus className="w-3 h-3" /> Add Leave Type
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-2 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-1.5 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleFilterChange('status', tab.id)}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${
                    filters.status === tab.id
                      ? 'bg-white text-primary-600 shadow-sm border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tab.name}
                  <span className={`ml-1 px-1 py-0.5 text-[9px] rounded-full ${
                    filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {canBulk && selectedIds.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md p-0.5">
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value)}
                    className="text-[10px] border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="active">Set Active</option>
                    <option value="inactive">Set Inactive</option>
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[10px] font-medium"
                  >
                    Apply
                  </button>
                  <span className="text-[10px] text-primary-700 font-medium">{selectedIds.length} selected</span>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search leave types..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="pl-6 pr-1.5 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-[10px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-6 text-center text-[10px] text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center text-[10px] text-red-600">{error}</div>
          ) : pagination.paginated.length > 0 ? (
            <table className="w-full min-w-[2200px]">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-1.5 py-0.5 w-6">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === pagination.paginated.length && pagination.paginated.length > 0}
                        onChange={toggleSelectAll}
                        disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3.5 h-3.5"
                      />
                    </th>
                  )}
                  <th className="px-1.5 py-0.5 text-left text-[9px] font-medium text-gray-600 uppercase">ID</th>
                  <th className="px-1.5 py-0.5 text-left text-[9px] font-medium text-gray-600 uppercase">Name</th>
                  <th className="px-1.5 py-0.5 text-left text-[9px] font-medium text-gray-600 uppercase">Code</th>
                  <th className="px-1.5 py-0.5 text-left text-[9px] font-medium text-gray-600 uppercase w-36">Description</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Annual Quota</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Is Paid</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Max Consec.</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Carry Fwd</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Encash</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Approval</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Doc.</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Half Day</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Gender</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Probation</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Color</th>
                  <th className="px-1.5 py-0.5 text-left text-[9px] font-medium text-gray-600 uppercase">Icon</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Created By</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Updated By</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Created At</th>
                  <th className="px-1.5 py-0.5 text-center text-[9px] font-medium text-gray-600 uppercase">Updated At</th>
                  <th className="px-1.5 py-0.5 text-left text-[9px] font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagination.paginated.map(lt => (
                  <tr key={lt.leave_type_id} className="hover:bg-gray-50">
                    {canBulk && (
                      <td className="px-1.5 py-0.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(lt.leave_type_id)}
                          onChange={() => toggleSelection(lt.leave_type_id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3.5 h-3.5"
                        />
                      </td>
                    )}
                    <td className="px-1.5 py-0.5 text-[10px] font-mono text-gray-600">{lt.leave_type_id}</td>
                    <td className="px-1.5 py-0.5 text-[10px] font-medium">{lt.name}</td>
                    <td className="px-1.5 py-0.5 text-[10px] text-gray-700">{lt.code}</td>
                    <td className="px-1.5 py-0.5 text-[10px] text-gray-700 max-w-xs truncate" title={lt.description}>
                      {lt.description || '—'}
                    </td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center">{lt.annual_quota}</td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center"><YesNo value={lt.is_paid} /></td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center">{lt.max_consecutive_days ?? '—'}</td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center"><YesNo value={lt.carry_forward_allowed} /></td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center"><YesNo value={lt.encashment_allowed} /></td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center"><YesNo value={lt.approval_required} /></td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center"><YesNo value={lt.document_required} /></td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center"><YesNo value={lt.half_day_allowed} /></td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center capitalize">{lt.applicable_gender}</td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center"><YesNo value={lt.available_during_probation} /></td>
                    <td className="px-1.5 py-0.5 text-center">
                      {lt.color ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Circle className="w-3 h-3 fill-current" style={{ color: lt.color }} />
                          <span className="text-[9px] text-gray-500">{lt.color}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-1.5 py-0.5 text-[10px] text-gray-700">{lt.icon || '—'}</td>
                    <td className="px-1.5 py-0.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                        lt.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lt.status}
                      </span>
                    </td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center">{lt.created_by || '—'}</td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center">{lt.updated_by || '—'}</td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center whitespace-nowrap">{formatDateTime(lt.createdAt)}</td>
                    <td className="px-1.5 py-0.5 text-[10px] text-center whitespace-nowrap">{formatDateTime(lt.updatedAt)}</td>
                    <td className="px-1.5 py-0.5">
                      <div className="flex items-center gap-0.5">
                        {canUpdate && (
                          <button
                            onClick={() => openModal(lt)}
                            className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(lt.leave_type_id)}
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
            <div className="p-6 text-center text-[10px] text-gray-500">
              No leave types found.
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] text-gray-600">
                Showing {(pagination.page - 1) * filters.limit + 1} to {Math.min(pagination.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}
              </div>
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className="p-0.5 rounded border disabled:opacity-50"
                >
                  <ChevronsLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-0.5 rounded border disabled:opacity-50"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) pageNum = i + 1;
                  else if (pagination.page <= 3) pageNum = i + 1;
                  else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                  else pageNum = pagination.page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-5 h-5 text-[9px] rounded border ${
                        pagination.page === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-0.5 rounded border disabled:opacity-50"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-0.5 rounded border disabled:opacity-50"
                >
                  <ChevronsRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showModal && (
          <LeaveTypeModal
            show={showModal}
            leaveType={editingLeaveType}
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

export default LeaveTypeManagement;