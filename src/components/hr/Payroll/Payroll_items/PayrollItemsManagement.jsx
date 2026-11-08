import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle2, AlertCircle, FileText, DollarSign, Users, UserPlus
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const PayrollItemModal = lazy(() => import('./PayrollItemModal'));
const ConfirmationModal = lazy(() => import('../../../common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../common/ImportModal'));
const Toast = lazy(() => import('../../../common/Toast'));
const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

// ---------- Badge & Currency Components ----------
const PaymentStatusBadge = memo(({ status }) => {
  const colors = {
    pending: 'bg-gray-100 text-gray-800',
    processing: 'bg-blue-100 text-blue-800',
    processed: 'bg-indigo-100 text-indigo-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status || 'unknown'}
    </span>
  );
});
PaymentStatusBadge.displayName = 'PaymentStatusBadge';

const PayslipBadge = memo(({ value }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
    {value ? 'Yes' : 'No'}
  </span>
));
PayslipBadge.displayName = 'PayslipBadge';

// Currency with optional color prop
const Currency = memo(({ value, color = 'text-gray-700' }) => (
  <span className={`font-mono text-xs ${color}`}>
    {value ? Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '₹0.00'}
  </span>
));
Currency.displayName = 'Currency';

// Helper to format JSON object for display (compact, truncated)
const formatJson = (obj) => {
  if (!obj || Object.keys(obj).length === 0) return '—';
  try {
    const str = JSON.stringify(obj);
    return str.length > 30 ? str.substring(0, 27) + '...' : str;
  } catch {
    return '—';
  }
};

// ---------- Row Component ----------
const PayrollItemRow = memo(({ record, canBulk, selected, toggleSelection, canUpdate, canDelete, openModal, handleDelete }) => {
  const isSelected = selected.includes(record.payroll_item_id);
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '—';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-2 py-1 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(record.payroll_item_id)} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
        </td>
      )}
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.payroll_item_id}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.payroll_run_id}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.emp_id}</td>
      <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 text-xs" title={record.employee_name || ''}>
        {record.employee_name || `#${record.emp_id}`}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.org_id}</td>

      {/* Color-coded amount fields */}
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.base_salary} color="text-blue-700" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.total_allowances} color="text-emerald-600" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.total_bonuses} color="text-purple-600" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.total_reimbursements} color="text-orange-600" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.overtime_pay} color="text-teal-600" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.commission} color="text-pink-600" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.other_earnings} color="text-indigo-600" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.gross_pay} color="text-slate-800 font-semibold" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.total_deductions} color="text-red-600" /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.net_pay} color="text-green-700 font-semibold" /></td>

      {/* JSON fields with tooltips */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700" title={record.allowances ? JSON.stringify(record.allowances, null, 2) : '—'}>
        {record.allowances ? formatJson(record.allowances) : '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700" title={record.deductions ? JSON.stringify(record.deductions, null, 2) : '—'}>
        {record.deductions ? formatJson(record.deductions) : '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700" title={record.bonuses ? JSON.stringify(record.bonuses, null, 2) : '—'}>
        {record.bonuses ? formatJson(record.bonuses) : '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700" title={record.reimbursements ? JSON.stringify(record.reimbursements, null, 2) : '—'}>
        {record.reimbursements ? formatJson(record.reimbursements) : '—'}
      </td>

      {/* Attendance numbers */}
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.payable_days}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.present_days}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.absent_days}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.leave_days}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.overtime_hours}</td>

      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs" title={record.bank_details ? JSON.stringify(record.bank_details, null, 2) : '—'}>
        {record.bank_details ? formatJson(record.bank_details) : '—'}
      </td>

      <td className="px-2 py-1 whitespace-nowrap"><PaymentStatusBadge status={record.payment_status} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{record.payment_mode || 'bank_transfer'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs" title={record.payment_reference || ''}>
        {record.payment_reference || '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">
        {record.paid_at ? formatDate(record.paid_at) : '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap"><PayslipBadge value={record.payslip_generated} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs" title={record.payslip_url || ''}>
        {record.payslip_url || '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs" title={record.remarks || ''}>
        {record.remarks || '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.created_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.updated_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs" title={record.custom_fields ? JSON.stringify(record.custom_fields, null, 2) : '—'}>
        {record.custom_fields ? formatJson(record.custom_fields) : '—'}
      </td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDate(record.createdAt)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDate(record.updatedAt)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{record.deletedAt ? formatDate(record.deletedAt) : '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-1">
          {canUpdate && <button onClick={() => openModal(record)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"><Edit className="w-3 h-3" /></button>}
          {canDelete && <button onClick={() => handleDelete(record.payroll_item_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </td>
    </tr>
  );
});
PayrollItemRow.displayName = 'PayrollItemRow';

// ---------- Helper functions ----------
const getEmployeeDisplayName = (emp) => {
  if (!emp) return '';
  return emp.display_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `#${emp.emp_id}`;
};

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatYMD = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const subDays = (date, days) => { const r = new Date(date); r.setDate(date.getDate() - days); return r; };
const subMonths = (date, months) => { const r = new Date(date); r.setMonth(date.getMonth() - months); if (r.getDate() !== date.getDate()) r.setDate(0); return r; };
const subYears = (date, years) => { const r = new Date(date); r.setFullYear(date.getFullYear() - years); return r; };
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

// ---------- Main Component ----------
const PayrollItemsManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'payroll_item', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'payroll_item', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'payroll_item', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'payroll_item', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'payroll_item', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'payroll_item', 'A4') || canManage, [hasPermission, canManage]);

  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byPaymentStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Employee filter states
  const [filterByEmployee, setFilterByEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    payment_status: 'all',
    payment_mode: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 15,
  });

  const [datePreset, setDatePreset] = useState('all');

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
        payload.searchFields = ['emp_id', 'payroll_run_id'];
      }
      const filterConditions = {};
      if (filters.payment_status !== 'all') filterConditions.payment_status = filters.payment_status;
      if (filters.payment_mode !== 'all') filterConditions.payment_mode = filters.payment_mode;
      if (filterByEmployee && selectedEmployee) {
        filterConditions.emp_id = selectedEmployee.emp_id;
      }
      if (filters.dateFrom) filterConditions.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterConditions.dateTo = filters.dateTo;
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;

      const response = await hrAPI.getPayrollItemsAll(payload);
      if (response.data?.success) {
        const { rows, counts, pagination } = response.data;
        setRecords(rows || []);
        setCounts(counts || { total: 0, byPaymentStatus: {} });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: pagination?.totalItems || 0,
          totalPages: pagination?.totalPages || 0,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch payroll items');
      }
    } catch (err) {
      setError('Failed to load payroll items. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, filterByEmployee, selectedEmployee]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRecords(), 350);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission to export', 'error');
    try {
      setExportLoading(true);
      const response = await hrAPI.getPayrollItemsAll({ limit: 10000, sortBy: 'created_at', sortOrder: 'DESC' });
      const data = response.data?.rows || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = [
        'ID', 'Payroll Run ID', 'Employee ID', 'Org ID',
        'Base Salary', 'Total Allowances', 'Total Bonuses', 'Total Reimbursements',
        'Overtime Pay', 'Commission', 'Other Earnings',
        'Gross Pay', 'Total Deductions', 'Net Pay',
        'Allowances JSON', 'Deductions JSON', 'Bonuses JSON', 'Reimbursements JSON',
        'Payable Days', 'Present Days', 'Absent Days', 'Leave Days', 'Overtime Hours',
        'Bank Details JSON', 'Payment Mode', 'Payment Status', 'Payment Reference',
        'Paid At', 'Payslip Generated', 'Payslip URL', 'Remarks',
        'Created By', 'Updated By', 'Custom Fields JSON',
        'Created At', 'Updated At'
      ];
      const rows = data.map(r => [
        r.payroll_item_id, r.payroll_run_id, r.emp_id, r.org_id,
        r.base_salary || 0, r.total_allowances || 0, r.total_bonuses || 0, r.total_reimbursements || 0,
        r.overtime_pay || 0, r.commission || 0, r.other_earnings || 0,
        r.gross_pay || 0, r.total_deductions || 0, r.net_pay || 0,
        JSON.stringify(r.allowances || {}), JSON.stringify(r.deductions || {}),
        JSON.stringify(r.bonuses || {}), JSON.stringify(r.reimbursements || {}),
        r.payable_days || 0, r.present_days || 0, r.absent_days || 0, r.leave_days || 0,
        r.overtime_hours || 0, JSON.stringify(r.bank_details || {}),
        r.payment_mode || 'bank_transfer', r.payment_status || 'pending',
        r.payment_reference || '', r.paid_at ? new Date(r.paid_at).toISOString() : '',
        r.payslip_generated ? 'Yes' : 'No', r.payslip_url || '', r.remarks || '',
        r.created_by || '', r.updated_by || '', JSON.stringify(r.custom_fields || {}),
        new Date(r.createdAt).toISOString(), new Date(r.updatedAt).toISOString(),
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `payroll_items_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const samplePayrollItems = [
    ['payroll_run_id', 'emp_id', 'base_salary', 'gross_pay', 'total_deductions', 'net_pay', 'payment_status'],
    ['1', '101', '50000', '55000', '12000', '43000', 'pending'],
    ['1', '102', '60000', '66000', '14000', '52000', 'processing'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.payroll_run_id) throw new Error(`Row ${i+1}: payroll_run_id required`);
        if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
        return {
          payroll_run_id: parseInt(row.payroll_run_id),
          emp_id: parseInt(row.emp_id),
          base_salary: parseFloat(row.base_salary) || 0,
          gross_pay: parseFloat(row.gross_pay) || 0,
          total_deductions: parseFloat(row.total_deductions) || 0,
          net_pay: parseFloat(row.net_pay) || 0,
          payment_status: row.payment_status || 'pending',
        };
      });
      await Promise.all(recordsToImport.map(record => hrAPI.createPayrollItem(record)));
      showToast(`Imported ${recordsToImport.length} payroll items`, 'success');
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
    setSelected(selected.length === records.length ? [] : records.map(r => r.payroll_item_id));
  }, [canBulk, selected, records]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selected.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Payroll Items',
          `Are you sure you want to delete ${selected.length} payroll item(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selected.map(id => hrAPI.deletePayrollItem(id)));
            setSelected([]);
            setBulkAction('');
            fetchRecords();
            showToast(`Deleted ${selected.length} payroll items`, 'success');
          }
        );
      } else {
        await Promise.all(selected.map(id => hrAPI.updatePayrollItem(id, { payment_status: bulkAction })));
        setSelected([]);
        setBulkAction('');
        fetchRecords();
        showToast(`Updated ${selected.length} payroll items to "${bulkAction}"`, 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selected, fetchRecords, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const record = records.find(r => r.payroll_item_id === id);
    showConfirmation(
      'Delete Payroll Item',
      `Delete payroll item for employee #${record?.emp_id || 'unknown'}? This cannot be undone.`,
      'delete',
      async () => {
        await hrAPI.deletePayrollItem(id);
        fetchRecords();
        showToast('Payroll item deleted', 'success');
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
    showToast('Payroll item saved successfully!', 'success');
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

  const handleDatePresetChange = useCallback((e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    const today = new Date();
    let start = '', end = '';
    switch (preset) {
      case 'all':
        start = '';
        end = '';
        break;
      case 'today':
        start = formatYMD(startOfDay(today));
        end = formatYMD(endOfDay(today));
        break;
      case 'yesterday':
        start = formatYMD(startOfDay(subDays(today, 1)));
        end = formatYMD(endOfDay(subDays(today, 1)));
        break;
      case 'last7days':
        start = formatYMD(startOfDay(subDays(today, 6)));
        end = formatYMD(endOfDay(today));
        break;
      case 'monthtodate':
        start = formatYMD(startOfMonth(today));
        end = formatYMD(endOfDay(today));
        break;
      case 'previous-month':
        start = formatYMD(startOfMonth(subMonths(today, 1)));
        end = formatYMD(endOfMonth(subMonths(today, 1)));
        break;
      case 'yeartodate':
        start = formatYMD(startOfYear(today));
        end = formatYMD(endOfDay(today));
        break;
      case 'previous-year':
        start = formatYMD(startOfYear(subYears(today, 1)));
        end = formatYMD(endOfYear(subYears(today, 1)));
        break;
      default:
        return;
    }
    setFilters(prev => ({ ...prev, dateFrom: start, dateTo: end, page: 1 }));
  }, []);

  const handleGetData = useCallback(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRefresh = useCallback(() => {
    setFilters({
      search: '',
      payment_status: 'all',
      payment_mode: 'all',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 15,
    });
    setDatePreset('all');
    setFilterByEmployee(false);
    setSelectedEmployee(null);
    setSelected([]);
    setBulkAction('');
    fetchRecords();
  }, [fetchRecords]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.payment_status !== 'all' ||
      filters.payment_mode !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filterByEmployee
    );
  }, [filters, filterByEmployee]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    const statusCounts = counts.byPaymentStatus || {};
    return [
      { id: 'all', name: 'All', count: allCount, icon: Filter },
      { id: 'pending', name: 'Pending', count: statusCounts.pending || 0, icon: AlertCircle },
      { id: 'processing', name: 'Processing', count: statusCounts.processing || 0, icon: FileText },
      { id: 'processed', name: 'Processed', count: statusCounts.processed || 0, icon: CheckCircle2 },
      { id: 'paid', name: 'Paid', count: statusCounts.paid || 0, icon: DollarSign },
      { id: 'failed', name: 'Failed', count: statusCounts.failed || 0, icon: X },
    ];
  }, [counts]);

  const getVisiblePages = useCallback((currentPage, totalPages) => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, []);

  const handleToggleFilterByEmployee = useCallback(() => {
    setFilterByEmployee(prev => {
      if (prev) {
        setSelectedEmployee(null);
      }
      return !prev;
    });
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleEmployeeSelect = useCallback((emp) => {
    setSelectedEmployee(emp);
    setShowEmployeeModal(false);
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
        <p className="text-xs text-gray-600">Manage payroll items</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {canImport && (
            <>
              <button
                onClick={() => {
                  const csvContent = samplePayrollItems.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'payroll_items_import_template.csv';
                  link.click();
                  showToast('Sample CSV downloaded', 'info');
                }}
                className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-3 h-3" /> Sample
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <Upload className="w-3 h-3" /> Import
              </button>
            </>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-3 h-3" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}
          <button
            onClick={handleToggleFilterByEmployee}
            className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${
              filterByEmployee
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-3 h-3" />
            {selectedEmployee ? getEmployeeDisplayName(selectedEmployee) : 'Employees'}
            {filterByEmployee && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
          </button>
          {filterByEmployee && (
            <button
              onClick={() => setShowEmployeeModal(true)}
              className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              {selectedEmployee ? 'Change' : 'Select Employee'}
            </button>
          )}
          <select value={datePreset} onChange={handleDatePresetChange}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="monthtodate">Month to date</option>
            <option value="previous-month">Previous month</option>
            <option value="yeartodate">Year to date</option>
            <option value="previous-year">Previous year</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />
          <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />
          <button onClick={handleGetData} className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors">
            <RefreshCw className="w-3 h-3" />
            Get Data
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded font-medium text-xs shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New Payroll Item
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
                  <button
                    key={tab.id}
                    onClick={() => handleFilterChange('payment_status', tab.id)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${
                      (tab.id === 'all' && filters.payment_status === 'all') || filters.payment_status === tab.id
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${(tab.id === 'all' && filters.payment_status === 'all') || filters.payment_status === tab.id ? 'text-primary-600' : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-[9px] rounded-full min-w-3 flex items-center justify-center ${
                      (tab.id === 'all' && filters.payment_status === 'all') || filters.payment_status === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {canBulk && selected.length > 0 && (
                <div className="flex items-center gap-1 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-[10px] border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk</option>
                    <option value="pending">Set Pending</option>
                    <option value="processing">Set Processing</option>
                    <option value="processed">Set Processed</option>
                    <option value="paid">Set Paid</option>
                    <option value="failed">Set Failed</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[10px] font-medium">Apply</button>
                  <span className="text-[10px] text-primary-700 font-medium">{selected.length} sel</span>
                </div>
              )}

              <select value={filters.payment_status} onChange={e => handleFilterChange('payment_status', e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="all">-- All Status --</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="processed">Processed</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>

              <select value={filters.payment_mode} onChange={e => handleFilterChange('payment_mode', e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="all">-- All Modes --</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>

              <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>

              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search items..." value={filters.search} onChange={e => handleSearch(e.target.value)} className="pl-6 pr-2 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-40 text-[10px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (null) : error ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center"><p className="text-sm text-red-600">{error}</p><button onClick={fetchRecords} className="mt-2 px-3 py-1 bg-primary-600 text-white rounded text-xs">Retry</button></div>
            </div>
          ) : records.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max text-[10px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && (
                      <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider w-6 sticky left-0 bg-gray-50 z-20">
                        <input type="checkbox" checked={selected.length === records.length && records.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
                      </th>
                    )}
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">ID</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Run ID</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Emp ID</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Employee</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Org ID</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Base</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Allow.</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Bonus</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Reimb.</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Overtime</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Commission</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Other Earn</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Gross</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Deductions</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Net</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Allowances JSON</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Deductions JSON</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Bonuses JSON</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Reimb. JSON</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Pay Days</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Present</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Absent</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Leave</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">OT Hours</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Bank JSON</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Mode</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Ref</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Paid At</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Payslip</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Payslip URL</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Remarks</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">CBy</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">UBy</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Custom JSON</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Created</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Updated</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Deleted</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20 text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(record => (
                    <PayrollItemRow
                      key={record.payroll_item_id}
                      record={record}
                      canBulk={canBulk}
                      selected={selected}
                      toggleSelection={toggleSelection}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      openModal={openModal}
                      handleDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center"><p className="text-sm text-gray-600">No payroll items found.</p></div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-2 flex flex-col sm:flex-row items-center justify-between gap-1.5">
              <div className="text-[10px] text-gray-600">Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalItems)} of {pagination.totalItems}</div>
              <div className="flex items-center space-x-0.5">
                <button type="button" onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button type="button" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {getVisiblePages(filters.page, pagination.totalPages).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`w-6 h-6 text-[10px] rounded border transition-colors ${filters.page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                  >
                    {p}
                  </button>
                ))}
                <button type="button" onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
                <button type="button" onClick={() => handlePageChange(pagination.totalPages)} disabled={filters.page === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {showModal && <PayrollItemModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleRecordSaved} />}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Payroll Items"
            requiredHeaders={['payroll_run_id', 'emp_id']}
            sampleRows={samplePayrollItems}
            formatDescription="Required: payroll_run_id, emp_id. Optional: base_salary, gross_pay, total_deductions, net_pay, payment_status."
            validateRow={(row, i) => {
              if (!row.payroll_run_id) throw new Error(`Row ${i+1}: payroll_run_id required`);
              if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
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

      <Suspense fallback={null}>
        {showEmployeeModal && (
          <EmployeeSelectionModal
            show={showEmployeeModal}
            onClose={() => setShowEmployeeModal(false)}
            onSelect={handleEmployeeSelect}
            selectedEmployeeId={selectedEmployee?.emp_id}
          />
        )}
      </Suspense>
    </div>
  );
};

export default PayrollItemsManagement;