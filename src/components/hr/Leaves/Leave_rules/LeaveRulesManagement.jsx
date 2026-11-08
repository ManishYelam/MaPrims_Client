import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const LeaveRuleModal = lazy(() => import('./LeaveRuleModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const BooleanBadge = memo(({ value }) => (
  <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {value ? 'Yes' : 'No'}
  </span>
));
BooleanBadge.displayName = 'BooleanBadge';

const ColorSwatch = memo(({ color }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-full border border-gray-300" style={{ backgroundColor: color || '#ccc' }} />
));
ColorSwatch.displayName = 'ColorSwatch';

const formatArray = (arr, max = 3) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '—';
  if (arr.length <= max) return arr.join(', ');
  return arr.slice(0, max).join(', ') + ` +${arr.length - max}`;
};

const RuleRow = memo(({ rule, canBulk, selectedRules, toggleSelection, canUpdate, canDelete, openModal, handleDelete, accrualMethods }) => {
  const isSelected = selectedRules.includes(rule.leave_rule_id);
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(rule.leave_rule_id)}
            className="rounded border-gray-300 text-primary-600 w-2.5 h-2.5" />
        </td>
      )}
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500">{rule.leave_rule_id}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <span className={`inline-flex items-center px-0.5 py-0.5 rounded-full font-medium text-[8px] ${accrualMethods.find(m => m.value === rule.accrual_method)?.color || 'bg-gray-100 text-gray-800'}`}>
          {rule.accrual_method || 'N/A'}
        </span>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          <ColorSwatch color={rule.leave_type?.color} />
          <span>{rule.leave_type?.name || 'N/A'}</span>
        </div>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-700">{rule.leave_type?.code || 'N/A'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-700">{rule.leave_type?.leave_type_id || 'N/A'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.accrual_rate ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.accrual_frequency || 'N/A'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.accrual_start_from || 'N/A'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.fixed_accrual_date || '—'}</td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.pro_rata_for_new_hire} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.max_balance ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.min_service_days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.min_age ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.min_tenure_months ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap max-w-14 overflow-hidden text-ellipsis" title={rule.employment_types?.join(', ') || ''}>
        {formatArray(rule.employment_types)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap max-w-14 overflow-hidden text-ellipsis" title={rule.dept_ids?.join(', ') || ''}>
        {formatArray(rule.dept_ids)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap max-w-14 overflow-hidden text-ellipsis" title={rule.position_ids?.join(', ') || ''}>
        {formatArray(rule.position_ids)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.gender_restriction || 'both'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap max-w-14 overflow-hidden text-ellipsis" title={rule.work_location_ids?.join(', ') || ''}>
        {formatArray(rule.work_location_ids)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap max-w-14 overflow-hidden text-ellipsis" title={rule.employee_statuses?.join(', ') || ''}>
        {formatArray(rule.employee_statuses)}
      </td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.probation_only} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.exclude_terminated} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.carry_over_allowed} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.carry_over_max ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.carry_over_expiry_months ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.carry_over_priority || 'N/A'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.notice_period_days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.max_consecutive_days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.min_gap_days ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap max-w-14 overflow-hidden text-ellipsis" title={rule.blockout_periods?.join(', ') || ''}>
        {formatArray(rule.blockout_periods)}
      </td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.half_day_allowed} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.multiple_types_allowed} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.max_requests_per_month ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.auto_approve_threshold ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.escalation_hours ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.allow_reapply_after_days ?? 0}</td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.delegate_allowed} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.deduction_percentage ?? 0}</td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.encashment_allowed} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.encashment_cap ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.encashment_frequency || 'N/A'}</td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.exclude_weekends} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.exclude_holidays} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.working_days_only} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.requires_document} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap max-w-14 overflow-hidden text-ellipsis" title={rule.document_types?.join(', ') || ''}>
        {formatArray(rule.document_types)}
      </td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.notify_employee_on_submit} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.notify_approver_on_submit} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.notify_employee_on_approval} /></td>
      <td className="px-0.5 py-0.5"><BooleanBadge value={rule.notify_employee_on_rejection} /></td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.reminder_days_before ?? 0}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.inherited_from || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.created_by || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap">{rule.updated_by || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500 text-[8px]">{new Date(rule.createdAt).toLocaleDateString()}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500 text-[8px]">{new Date(rule.updatedAt).toLocaleDateString()}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-gray-500 text-[8px]">{rule.deletedAt ? new Date(rule.deletedAt).toLocaleDateString() : '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-0.5">
          {canUpdate && <button onClick={() => openModal(rule)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"><Edit className="w-2.5 h-2.5" /></button>}
          {canDelete && <button onClick={() => handleDelete(rule.leave_rule_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-2.5 h-2.5" /></button>}
        </div>
      </td>
    </tr>
  );
});
RuleRow.displayName = 'RuleRow';

const LeaveRuleManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'leaverule', 'A4') || canManage, [hasPermission, canManage]);

  const [rules, setRules] = useState([]);
  const [counts, setCounts] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRules, setSelectedRules] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    accrual_method: 'all',
    carry_over_allowed: 'all',
    exclude_weekends: 'all',
    page: 1,
    limit: 15,
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

  const accrualMethods = useMemo(() => [
    { value: 'monthly', label: 'Monthly', color: 'bg-blue-100 text-blue-800' },
    { value: 'yearly', label: 'Yearly', color: 'bg-purple-100 text-purple-800' },
    { value: 'quarterly', label: 'Quarterly', color: 'bg-green-100 text-green-800' },
    { value: 'per_project', label: 'Per Project', color: 'bg-orange-100 text-orange-800' },
    { value: 'none', label: 'None', color: 'bg-gray-100 text-gray-800' },
  ], []);

  const booleanOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ], []);

  const fetchRules = useCallback(async () => {
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
        payload.searchFields = ['accrual_method', 'leave_type_name'];
      }
      const filterConditions = {};
      if (filters.accrual_method !== 'all') filterConditions.accrual_method = filters.accrual_method;
      if (filters.carry_over_allowed !== 'all') filterConditions.carry_over_allowed = filters.carry_over_allowed === 'true';
      if (filters.exclude_weekends !== 'all') filterConditions.exclude_weekends = filters.exclude_weekends === 'true';
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;
      const response = await hrAPI.getLeaveRulesAll(payload);
      if (response.data?.success) {
        const { rows, counts, pagination } = response.data;
        setRules(rows || []);
        setCounts(counts || { total: 0 });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: pagination?.totalItems || 0,
          totalPages: pagination?.totalPages || 0,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch rules');
      }
    } catch (err) {
      setError('Failed to load leave rules. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRules(), 350);
    return () => clearTimeout(timer);
  }, [fetchRules]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    try {
      setExportLoading(true);
      const response = await hrAPI.getLeaveRulesAll({ limit: 10000, sortBy: 'created_at', sortOrder: 'DESC' });
      const data = response.data?.rows || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = [
        'ID', 'Method', 'Type Name', 'Type Code', 'Type ID', 'Rate', 'Frequency',
        'Start From', 'Fixed Date', 'Pro Rata', 'Max Balance', 'Min Service Days',
        'Min Age', 'Min Tenure Months', 'Employment Types', 'Dept IDs', 'Position IDs',
        'Gender', 'Work Location IDs', 'Employee Statuses', 'Probation Only',
        'Exclude Terminated', 'Carry Over', 'Carry Over Max', 'Carry Over Expiry',
        'Carry Over Priority', 'Notice Days', 'Max Consecutive Days', 'Min Gap Days',
        'Blockout Periods', 'Half Day', 'Multiple Types', 'Max Requests/Month',
        'Auto Approve Threshold', 'Escalation Hours', 'Allow Reapply Days',
        'Delegate', 'Deduction %', 'Encashment', 'Encashment Cap', 'Encashment Freq',
        'Exclude Weekends', 'Exclude Holidays', 'Working Days Only', 'Requires Document',
        'Document Types', 'Notify Employee Submit', 'Notify Approver Submit',
        'Notify Employee Approve', 'Notify Employee Reject', 'Reminder Days',
        'Inherited From', 'Created By', 'Updated By', 'Created At', 'Updated At', 'Deleted At'
      ];
      const rows = data.map(r => [
        r.leave_rule_id, r.accrual_method || 'N/A', r.leave_type?.name || 'N/A', r.leave_type?.code || 'N/A',
        r.leave_type?.leave_type_id || 'N/A', r.accrual_rate || 0, r.accrual_frequency || 'N/A',
        r.accrual_start_from || 'N/A', r.fixed_accrual_date || 'N/A',
        r.pro_rata_for_new_hire ? 'Yes' : 'No', r.max_balance || 0, r.min_service_days || 0,
        r.min_age || 0, r.min_tenure_months || 0, (r.employment_types || []).join(';'),
        (r.dept_ids || []).join(';'), (r.position_ids || []).join(';'), r.gender_restriction || 'N/A',
        (r.work_location_ids || []).join(';'), (r.employee_statuses || []).join(';'),
        r.probation_only ? 'Yes' : 'No', r.exclude_terminated ? 'Yes' : 'No',
        r.carry_over_allowed ? 'Yes' : 'No', r.carry_over_max || 0, r.carry_over_expiry_months || 0,
        r.carry_over_priority || 'N/A', r.notice_period_days || 0, r.max_consecutive_days || 0,
        r.min_gap_days || 0, (r.blockout_periods || []).join(';'), r.half_day_allowed ? 'Yes' : 'No',
        r.multiple_types_allowed ? 'Yes' : 'No', r.max_requests_per_month || 0,
        r.auto_approve_threshold || 0, r.escalation_hours || 0, r.allow_reapply_after_days || 0,
        r.delegate_allowed ? 'Yes' : 'No', r.deduction_percentage || 0, r.encashment_allowed ? 'Yes' : 'No',
        r.encashment_cap || 0, r.encashment_frequency || 'N/A', r.exclude_weekends ? 'Yes' : 'No',
        r.exclude_holidays ? 'Yes' : 'No', r.working_days_only ? 'Yes' : 'No',
        r.requires_document ? 'Yes' : 'No', (r.document_types || []).join(';'),
        r.notify_employee_on_submit ? 'Yes' : 'No', r.notify_approver_on_submit ? 'Yes' : 'No',
        r.notify_employee_on_approval ? 'Yes' : 'No', r.notify_employee_on_rejection ? 'Yes' : 'No',
        r.reminder_days_before || 0, r.inherited_from || 'N/A', r.created_by || 'N/A',
        r.updated_by || 'N/A', new Date(r.createdAt).toISOString(), new Date(r.updatedAt).toISOString(),
        r.deletedAt ? new Date(r.deletedAt).toISOString() : 'N/A'
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leave_rules_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleRules = [
    ['accrual_method', 'leave_type_id', 'carry_over_allowed', 'max_balance', 'accrual_rate', 'exclude_weekends'],
    ['monthly', '1', 'true', '20', '1.5', 'true'],
    ['yearly', '2', 'false', '15', '12', 'false'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const rulesToImport = parsedRows.map((row, i) => {
        if (!row.accrual_method) throw new Error(`Row ${i+1}: accrual_method required`);
        if (!row.leave_type_id) throw new Error(`Row ${i+1}: leave_type_id required`);
        return {
          accrual_method: row.accrual_method,
          leave_type_id: parseInt(row.leave_type_id),
          carry_over_allowed: row.carry_over_allowed === 'true',
          max_balance: parseFloat(row.max_balance) || 0,
          accrual_rate: parseFloat(row.accrual_rate) || 0,
          exclude_weekends: row.exclude_weekends === 'true',
        };
      });
      await Promise.all(rulesToImport.map(rule => hrAPI.createLeaveRule(rule)));
      showToast(`Imported ${rulesToImport.length} rules`, 'success');
      setShowImportModal(false);
      fetchRules();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  }, [canImport, showToast, fetchRules]);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedRules(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelectedRules(selectedRules.length === rules.length ? [] : rules.map(r => r.leave_rule_id));
  }, [canBulk, selectedRules, rules]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selectedRules.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Rules',
          `Are you sure you want to delete ${selectedRules.length} rule(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedRules.map(id => hrAPI.deleteLeaveRule(id)));
            setSelectedRules([]);
            setBulkAction('');
            fetchRules();
            showToast(`Deleted ${selectedRules.length} rules`, 'success');
          }
        );
      } else {
        await Promise.all(selectedRules.map(id => hrAPI.updateLeaveRule(id, { carry_over_allowed: bulkAction === 'enable_carry' })));
        setSelectedRules([]);
        setBulkAction('');
        fetchRules();
        showToast('Bulk update successful', 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selectedRules, fetchRules, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const rule = rules.find(r => r.leave_rule_id === id);
    showConfirmation(
      'Delete Rule',
      `Delete rule for "${rule?.leave_type?.name || 'Unknown'}"? This cannot be undone.`,
      'delete',
      async () => {
        await hrAPI.deleteLeaveRule(id);
        fetchRules();
        showToast('Rule deleted', 'success');
      }
    );
  }, [canDelete, rules, showToast, fetchRules]);

  const openModal = useCallback((rule = null) => {
    if (rule && !canUpdate) return showToast('No permission to edit', 'error');
    if (!rule && !canCreate) return showToast('No permission to create', 'error');
    setEditingRule(rule);
    setShowModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeModal = useCallback(() => { setShowModal(false); setEditingRule(null); }, []);

  const handleRuleSaved = useCallback(() => {
    closeModal();
    fetchRules();
    showToast('Rule saved successfully!', 'success');
  }, [closeModal, fetchRules, showToast]);

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
    setFilters({ search: '', accrual_method: 'all', carry_over_allowed: 'all', exclude_weekends: 'all', page: 1, limit: 15 });
    showToast('Filters cleared', 'info');
  }, [showToast]);

  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || filters.accrual_method !== 'all' || filters.carry_over_allowed !== 'all' || filters.exclude_weekends !== 'all';
  }, [filters]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    const methodCounts = {};
    accrualMethods.forEach(m => { methodCounts[m.value] = counts[m.value] || 0; });
    return [
      { id: 'all', name: 'All', count: allCount, icon: Filter },
      ...accrualMethods.map(m => ({ id: m.value, name: m.label, count: methodCounts[m.value] || 0, icon: Filter })),
    ];
  }, [counts, accrualMethods]);

  return (
    <div className="space-y-2 p-2">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
        <p className="text-[10px] text-gray-600">Manage leave accrual rules</p>
        <div className="flex gap-1">
          {canImport && (
            <div className="flex gap-0.5">
              <button
                onClick={() => {
                  const csvContent = sampleRules.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'leave_rules_import_template.csv';
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
              <Plus className="w-2.5 h-2.5" /> New Rule
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
                  <button
                    key={tab.id}
                    onClick={() => handleFilterChange('accrual_method', tab.id)}
                    className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${
                      (tab.id === 'all' && filters.accrual_method === 'all') || filters.accrual_method === tab.id
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-2.5 h-2.5 ${(tab.id === 'all' && filters.accrual_method === 'all') || filters.accrual_method === tab.id ? 'text-primary-600' : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-[8px] rounded-full min-w-3 flex items-center justify-center ${
                      (tab.id === 'all' && filters.accrual_method === 'all') || filters.accrual_method === tab.id
                        ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-1">
              {canBulk && selectedRules.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[9px] border border-primary-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk</option>
                    <option value="enable_carry">Enable Carry</option>
                    <option value="disable_carry">Disable Carry</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[9px] font-medium">Apply</button>
                  <span className="text-[9px] text-primary-700 font-medium">{selectedRules.length} sel</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-0.5 transition-all ${
                showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-2.5 h-2.5" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => handleSearch(e.target.value)} className="pl-5 pr-1.5 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-32 text-[9px]" />
              </div>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-1 pt-1.5 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Accrual Method</label>
                  <select value={filters.accrual_method} onChange={e => handleFilterChange('accrual_method', e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="all">All</option>
                    {accrualMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Carry Over</label>
                  <select value={filters.carry_over_allowed} onChange={e => handleFilterChange('carry_over_allowed', e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    {booleanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Exclude Weekends</label>
                  <select value={filters.exclude_weekends} onChange={e => handleFilterChange('exclude_weekends', e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    {booleanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Per Page</label>
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-full px-1.5 py-0.5 text-[9px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-1 bg-blue-50 rounded border border-blue-200 mt-1">
                  <div className="flex items-center gap-0.5 flex-wrap">
                    <span className="text-[9px] font-medium text-blue-800">Filters:</span>
                    {filters.search && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] rounded border border-blue-200">Search: "{filters.search}" <button onClick={() => handleSearch('')} className="ml-0.5 text-blue-600 hover:text-blue-800"><X className="w-2 h-2" /></button></span>}
                    {filters.accrual_method !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] rounded border border-blue-200">Method: {accrualMethods.find(m=>m.value===filters.accrual_method)?.label} <button onClick={() => handleFilterChange('accrual_method', 'all')}><X className="w-2 h-2" /></button></span>}
                    {filters.carry_over_allowed !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] rounded border border-blue-200">Carry: {filters.carry_over_allowed==='true'?'Yes':'No'} <button onClick={() => handleFilterChange('carry_over_allowed', 'all')}><X className="w-2 h-2" /></button></span>}
                    {filters.exclude_weekends !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] rounded border border-blue-200">Wknd: {filters.exclude_weekends==='true'?'Yes':'No'} <button onClick={() => handleFilterChange('exclude_weekends', 'all')}><X className="w-2 h-2" /></button></span>}
                  </div>
                  <button onClick={clearFilters} className="text-[9px] text-blue-600 hover:text-blue-800 font-medium">Clear</button>
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
              <div className="text-center"><p className="text-xs text-red-600">{error}</p><button onClick={fetchRules} className="mt-1 px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Retry</button></div>
            </div>
          ) : rules.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max text-[9px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && (
                      <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase tracking-wider w-5 sticky left-0 bg-gray-50 z-20">
                        <input type="checkbox" checked={selectedRules.length === rules.length && rules.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-2.5 h-2.5" />
                      </th>
                    )}
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">TID</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Freq</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Start</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Fixed</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Pro</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">MaxBal</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">MinSvc</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Age</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Tenure</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">EmpTypes</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Depts</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Positions</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Gender</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">WorkLoc</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Statuses</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Prob</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">ExclTerm</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Carry</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">CarryMax</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">CarryExp</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">CarryPrio</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Notice</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">MaxCon</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">MinGap</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Blockout</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Half</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Multi</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">MaxReq</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">AutoApp</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Escal</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Reapply</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Del</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Ded%</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Enc</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">EncCap</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">EncFreq</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">ExclW</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">ExclH</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">WorkD</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">DocReq</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">DocTypes</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">NEmpS</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">NAppS</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">NEmpA</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">NEmpR</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Rem</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Inh</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">CBy</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">UBy</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Updated</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase">Deleted</th>
                    <th className="px-0.5 py-0.5 text-left font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rules.map(rule => (
                    <RuleRow key={rule.leave_rule_id} rule={rule} canBulk={canBulk} selectedRules={selectedRules}
                      toggleSelection={toggleSelection} canUpdate={canUpdate} canDelete={canDelete}
                      openModal={openModal} handleDelete={handleDelete} accrualMethods={accrualMethods} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center"><p className="text-xs text-gray-600">No leave rules found.</p></div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-1.5 flex flex-col sm:flex-row items-center justify-between gap-1">
              <div className="text-[9px] text-gray-600">Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}</div>
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
                  return <button key={p} onClick={() => handlePageChange(p)} className={`w-5 h-5 text-[9px] rounded border transition-colors ${filters.page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{p}</button>
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-2.5 h-2.5" /></button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsRight className="w-2.5 h-2.5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {showModal && <LeaveRuleModal show={showModal} rule={editingRule} onClose={closeModal} onSaved={handleRuleSaved} />}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Leave Rules"
            requiredHeaders={['accrual_method', 'leave_type_id', 'carry_over_allowed', 'max_balance']}
            sampleRows={sampleRules}
            formatDescription="Required: accrual_method, leave_type_id, carry_over_allowed, max_balance. Optional: accrual_rate, exclude_weekends."
            validateRow={(row, i) => {
              if (!row.accrual_method) throw new Error(`Row ${i+1}: accrual_method required`);
              if (!row.leave_type_id) throw new Error(`Row ${i+1}: leave_type_id required`);
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

export default LeaveRuleManagement;