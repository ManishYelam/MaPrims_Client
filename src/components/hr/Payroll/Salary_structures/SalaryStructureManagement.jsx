import React, { useState, useEffect, useCallback, useMemo, useContext, memo, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle2, AlertCircle, FileText, DollarSign, Users, UserPlus, Calendar
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const SalaryStructureModal = lazy(() => import('./SalaryStructureModal'));
const ConfirmationModal = lazy(() => import('../../../common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../common/ImportModal'));
const Toast = lazy(() => import('../../../common/Toast'));
const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

const StatusBadge = memo(({ status }) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    draft: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    archived: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status || 'unknown'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const Currency = memo(({ value }) => (
  <span className="font-mono text-xs text-gray-700">
    {value ? Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '₹0.00'}
  </span>
));
Currency.displayName = 'Currency';

const EffectiveDateBadge = memo(({ date }) => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700">
    {date ? new Date(date).toLocaleDateString() : '—'}
  </span>
));
EffectiveDateBadge.displayName = 'EffectiveDateBadge';

const SalaryStructureRow = memo(({ record, canBulk, selected, toggleSelection, canUpdate, canDelete, openModal, handleDelete }) => {
  const isSelected = selected.includes(record.salary_structure_id);
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '—';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-2 py-1 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(record.salary_structure_id)} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
        </td>
      )}
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.salary_structure_id}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{record.emp_id}</td>
      <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 text-xs">{record.employee_name || `#${record.emp_id}`}</td>
      <td className="px-2 py-1 whitespace-nowrap"><EffectiveDateBadge date={record.effective_date} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{formatDate(record.end_date) || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.base_salary} /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.monthly_gross_salary} /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.monthly_net_salary} /></td>
      <td className="px-2 py-1 whitespace-nowrap"><Currency value={record.annual_ctc} /></td>
      <td className="px-2 py-1 whitespace-nowrap"><StatusBadge status={record.status} /></td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-700 text-xs">{record.revision_number || 1}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.created_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-xs">{record.updated_by || '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDate(record.createdAt)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{formatDate(record.updatedAt)}</td>
      <td className="px-2 py-1 whitespace-nowrap text-gray-500 text-[9px]">{record.deletedAt ? formatDate(record.deletedAt) : '—'}</td>
      <td className="px-2 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-1">
          {canUpdate && <button onClick={() => openModal(record)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50"><Edit className="w-3 h-3" /></button>}
          {canDelete && <button onClick={() => handleDelete(record.salary_structure_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>}
        </div>
      </td>
    </tr>
  );
});
SalaryStructureRow.displayName = 'SalaryStructureRow';

// Helper to extract a display name from an employee object
const getEmployeeDisplayName = (emp) => {
  if (!emp) return '';
  return emp.display_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `#${emp.emp_id}`;
};

// Date helpers
const getToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatYMD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const SalaryStructureManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'salary_structure', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'salary_structure', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'salary_structure', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'salary_structure', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'salary_structure', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'salary_structure', 'A4') || canManage, [hasPermission, canManage]);

  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Employee filter states (Attendance-style)
  const [filterByEmployee, setFilterByEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    effective_year: 'all',
    page: 1,
    limit: 15,
    dateFrom: '',
    dateTo: '',
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
        payload.searchFields = ['emp_id', 'employee_name'];
      }
      const filterConditions = {};
      if (filters.status !== 'all') filterConditions.status = filters.status;
      if (filters.effective_year !== 'all') {
        filterConditions.effective_date_year = parseInt(filters.effective_year);
      }
      if (filterByEmployee && selectedEmployee) {
        filterConditions.emp_id = selectedEmployee.emp_id;
      }
      if (filters.dateFrom) filterConditions.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterConditions.dateTo = filters.dateTo;
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;

      const response = await hrAPI.getSalaryStructuresAll(payload);
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
        throw new Error(response.data?.message || 'Failed to fetch salary structures');
      }
    } catch (err) {
      setError('Failed to load salary structures. Please try again.');
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
      const response = await hrAPI.getSalaryStructuresAll({ limit: 10000, sortBy: 'created_at', sortOrder: 'DESC' });
      const data = response.data?.rows || [];
      if (!data.length) return showToast('No data to export', 'error');
      const headers = [
        'ID', 'Employee ID', 'Effective Date', 'End Date', 'Base Salary',
        'Monthly Gross Salary', 'Monthly Net Salary', 'Annual CTC', 'Total CTC',
        'Revision Number', 'Revision Reason', 'Status', 'Approved By', 'Approved At',
        'Created By', 'Updated By', 'Created At', 'Updated At'
      ];
      const rows = data.map(r => [
        r.salary_structure_id, r.emp_id, r.effective_date || 'N/A', r.end_date || 'N/A',
        r.base_salary || 0, r.monthly_gross_salary || 0, r.monthly_net_salary || 0,
        r.annual_ctc || 0, r.total_ctc || 0, r.revision_number || 1,
        r.revision_reason || '', r.status || 'active', r.approved_by || 'N/A',
        r.approved_at || 'N/A', r.created_by || 'N/A', r.updated_by || 'N/A',
        new Date(r.createdAt).toISOString(), new Date(r.updatedAt).toISOString(),
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `salary_structures_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const sampleSalaryStructures = [
    ['emp_id', 'effective_date', 'base_salary', 'allowances', 'deductions', 'bonuses', 'reimbursements', 'status'],
    ['101', '2025-01-01', '50000', '{"HRA":10000,"DA":5000}', '{"PF":5000}', '{"Annual":50000}', '{"Medical":2000}', 'active'],
    ['102', '2025-01-01', '60000', '{"HRA":12000,"DA":6000}', '{"PF":6000}', '{"Annual":60000}', '{"Medical":2500}', 'active'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) return showToast('No permission to import', 'error');
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
        if (!row.effective_date) throw new Error(`Row ${i+1}: effective_date required`);
        if (!row.base_salary) throw new Error(`Row ${i+1}: base_salary required`);
        return {
          emp_id: parseInt(row.emp_id),
          effective_date: row.effective_date,
          end_date: row.end_date || null,
          base_salary: parseFloat(row.base_salary),
          allowances: JSON.parse(row.allowances || '{}'),
          deductions: JSON.parse(row.deductions || '{}'),
          bonuses: JSON.parse(row.bonuses || '{}'),
          reimbursements: JSON.parse(row.reimbursements || '{}'),
          status: row.status || 'active',
          revision_reason: row.revision_reason || '',
        };
      });
      await Promise.all(recordsToImport.map(record => hrAPI.createSalaryStructure(record)));
      showToast(`Imported ${recordsToImport.length} salary structures`, 'success');
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
    setSelected(selected.length === records.length ? [] : records.map(r => r.salary_structure_id));
  }, [canBulk, selected, records]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk || !bulkAction || !selected.length) return;
    try {
      if (bulkAction === 'delete') {
        showConfirmation(
          'Delete Salary Structures',
          `Are you sure you want to delete ${selected.length} salary structure(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selected.map(id => hrAPI.deleteSalaryStructure(id)));
            setSelected([]);
            setBulkAction('');
            fetchRecords();
            showToast(`Deleted ${selected.length} salary structures`, 'success');
          }
        );
      } else {
        await Promise.all(selected.map(id => hrAPI.updateSalaryStructure(id, { status: bulkAction })));
        setSelected([]);
        setBulkAction('');
        fetchRecords();
        showToast(`Updated ${selected.length} salary structures to "${bulkAction}"`, 'success');
      }
    } catch (err) {
      showToast('Bulk action failed', 'error');
      console.error(err);
    }
  }, [canBulk, bulkAction, selected, fetchRecords, showToast]);

  const handleDelete = useCallback((id) => {
    if (!canDelete) return showToast('No permission to delete', 'error');
    const record = records.find(r => r.salary_structure_id === id);
    showConfirmation(
      'Delete Salary Structure',
      `Delete salary structure for employee #${record?.emp_id || 'unknown'}? This cannot be undone.`,
      'delete',
      async () => {
        await hrAPI.deleteSalaryStructure(id);
        fetchRecords();
        showToast('Salary structure deleted', 'success');
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
    showToast('Salary structure saved successfully!', 'success');
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
      status: 'all',
      effective_year: 'all',
      page: 1,
      limit: 15,
      dateFrom: '',
      dateTo: '',
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
      filters.status !== 'all' ||
      filters.effective_year !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filterByEmployee
    );
  }, [filters, filterByEmployee]);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    const statusCounts = counts.byStatus || {};
    return [
      { id: 'all', name: 'All', count: allCount, icon: Filter },
      { id: 'active', name: 'Active', count: statusCounts.active || 0, icon: CheckCircle2 },
      { id: 'inactive', name: 'Inactive', count: statusCounts.inactive || 0, icon: AlertCircle },
      { id: 'draft', name: 'Draft', count: statusCounts.draft || 0, icon: FileText },
      { id: 'approved', name: 'Approved', count: statusCounts.approved || 0, icon: DollarSign },
      { id: 'archived', name: 'Archived', count: statusCounts.archived || 0, icon: X },
    ];
  }, [counts]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

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
        <p className="text-xs text-gray-600">Manage salary structures</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {canImport && (
            <>
              <button
                onClick={() => {
                  const csvContent = sampleSalaryStructures.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'salary_structures_import_template.csv';
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

          {/* Export button – moved next to Import */}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-3 h-3" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}

          {/* Employee filter toggle */}
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

          {/* Date preset dropdown */}
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

          {/* Get Data button */}
          <button onClick={handleGetData} className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors">
            <RefreshCw className="w-3 h-3" />
            Get Data
          </button>

          {/* Refresh button */}
          <button onClick={handleRefresh} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>

          {/* New button */}
          {canCreate && (
            <button onClick={() => openModal()} className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded font-medium text-xs shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New Salary Structure
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
                    onClick={() => handleFilterChange('status', tab.id)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${
                      (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${(tab.id === 'all' && filters.status === 'all') || filters.status === tab.id ? 'text-primary-600' : ''}`} />
                    {tab.name}
                    <span className={`px-0.5 py-0.5 text-[9px] rounded-full min-w-3 flex items-center justify-center ${
                      (tab.id === 'all' && filters.status === 'all') || filters.status === tab.id
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
                    <option value="active">Set Active</option>
                    <option value="inactive">Set Inactive</option>
                    <option value="draft">Set Draft</option>
                    <option value="approved">Set Approved</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[10px] font-medium">Apply</button>
                  <span className="text-[10px] text-primary-700 font-medium">{selected.length} sel</span>
                </div>
              )}

              <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="all">-- All Status --</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="archived">Archived</option>
              </select>

              <select value={filters.effective_year} onChange={e => handleFilterChange('effective_year', e.target.value)} className="px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500">
                <option value="all">-- All Years --</option>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
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
                <input type="text" placeholder="Search by emp ID..." value={filters.search} onChange={e => handleSearch(e.target.value)} className="pl-6 pr-2 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-40 text-[10px]" />
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
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Emp ID</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Employee</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Effective</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">End Date</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Base</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Gross</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Net</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Annual CTC</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Rev</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">CBy</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">UBy</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Created</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Updated</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-[10px]">Deleted</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20 text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(record => (
                    <SalaryStructureRow
                      key={record.salary_structure_id}
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
              <div className="text-center"><p className="text-sm text-gray-600">No salary structures found.</p></div>
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
        {showModal && <SalaryStructureModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleRecordSaved} />}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Salary Structures"
            requiredHeaders={['emp_id', 'effective_date', 'base_salary']}
            sampleRows={sampleSalaryStructures}
            formatDescription="Required: emp_id, effective_date, base_salary. Optional: allowances, deductions, bonuses, reimbursements, status."
            validateRow={(row, i) => {
              if (!row.emp_id) throw new Error(`Row ${i+1}: emp_id required`);
              if (!row.effective_date) throw new Error(`Row ${i+1}: effective_date required`);
              if (!row.base_salary) throw new Error(`Row ${i+1}: base_salary required`);
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

export default SalaryStructureManagement;