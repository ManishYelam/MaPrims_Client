import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  Search, Edit, Trash2, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, CheckCircle2, AlertCircle, FileText, Eye
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import ExpenseModal from './ExpenseModal';
import ExpenseItemManagement from '../Expense_items/ExpenseItemManagement';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

// Status badge
const ExpenseStatusBadge = React.memo(({ status }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-700',
    partially_approved: 'bg-teal-100 text-teal-700',
    rejected: 'bg-red-100 text-red-700',
    reimbursed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-gray-200 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-gray-100'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
});

// Row
const ExpenseRow = React.memo(({ expense, canBulk, selectedIds, toggleSelection, canUpdate, canDelete, openModal, handleDelete, openItems }) => {
  const isSelected = selectedIds.includes(expense.expense_id);
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-1 py-1 sticky left-0 bg-white z-10">
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(expense.expense_id)} className="rounded border-gray-300 text-primary-600 w-3 h-3" />
        </td>
      )}
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">{expense.expense_id}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{expense.expense_number}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">
        {expense.employee?.first_name} {expense.employee?.last_name}
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{expense.title}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">{expense.category?.replace('_',' ')}</td>
      <td className="px-1 py-1 whitespace-nowrap text-[10px]">₹{parseFloat(expense.total_amount || 0).toLocaleString()}</td>
      <td className="px-1 py-1 whitespace-nowrap">
        <ExpenseStatusBadge status={expense.status} />
      </td>
      <td className="px-1 py-1 whitespace-nowrap text-gray-500 text-[10px]">
        {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '—'}
      </td>
      <td className="px-1 py-1 whitespace-nowrap sticky right-0 bg-white z-10">
        <div className="flex items-center gap-1">
          <button onClick={() => openItems(expense)} className="text-blue-600 hover:text-blue-900 p-0.5" title="View Items">
            <Eye className="w-3 h-3" />
          </button>
          {canUpdate && (
            <button onClick={() => openModal(expense)} className="text-gray-600 hover:text-gray-900 p-0.5">
              <Edit className="w-3 h-3" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(expense.expense_id)} className="text-red-600 hover:text-red-900 p-0.5">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

const Expenses = () => {
  const { user: authUser } = useContext(AuthContext);
  const { isAdmin, hasPermission } = usePermissions();
  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'expense', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'expense', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'expense', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'expense', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'expense', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'expense', 'A4') || canManage, [hasPermission, canManage]);

  const [expenses, setExpenses] = useState([]);
  const [counts, setCounts] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmation, setConfirmation] = useState({ show: false, title: '', message: '', type: '', onConfirm: null });

  const [filters, setFilters] = useState({
    search: '', status: 'all', emp_id: '', category: '',
    sortBy: 'created_at', sortOrder: 'DESC', page: 1, limit: 15
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalItems: 0, totalPages: 0 });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
    { value: 'pending_approval', label: 'Pending Approval' }, { value: 'approved', label: 'Approved' },
    { value: 'partially_approved', label: 'Partially Approved' }, { value: 'rejected', label: 'Rejected' },
    { value: 'reimbursed', label: 'Reimbursed' }, { value: 'cancelled', label: 'Cancelled' },
  ], []);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const payload = {
        page: filters.page, limit: filters.limit,
        sortBy: filters.sortBy, sortOrder: filters.sortOrder,
        search: filters.search.trim(), searchFields: ['title', 'expense_number', 'description'],
        filters: {}
      };
      if (filters.status !== 'all') payload.filters.status = filters.status;
      if (filters.emp_id) payload.filters.emp_id = parseInt(filters.emp_id);
      if (filters.category) payload.filters.category = filters.category;

      const res = await hrAPI.getExpensesAll(payload);
      if (res.data?.success) {
        setExpenses(res.data.data || []);
        setCounts(res.data.counts || { total: 0 });
        setPagination({
          page: filters.page, limit: filters.limit,
          totalItems: res.data.pagination.totalItems,
          totalPages: res.data.pagination.totalPages
        });
      }
    } catch (err) {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { const t = setTimeout(fetchExpenses, 350); return () => clearTimeout(t); }, [fetchExpenses]);

  // Export CSV
  const exportToCSV = useCallback(async () => {
    if (!canExport) return showToast('No permission', 'error');
    setExportLoading(true);
    try {
      const res = await hrAPI.getExpensesAll({ limit: 10000, sortBy: 'created_at', sortOrder: 'DESC' });
      const data = res.data?.data || [];
      if (!data.length) return showToast('No data', 'error');
      const headers = ['ID', 'Number', 'Employee', 'Title', 'Category', 'Total', 'Status', 'Date'];
      const rows = data.map(e => [
        e.expense_id, e.expense_number, e.employee?.first_name + ' ' + e.employee?.last_name,
        e.title, e.category, e.total_amount, e.status, e.expense_date
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast('Export successful');
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  // Import CSV
  const handleFileUpload = useCallback(async (e) => {
    if (!canImport) return showToast('No permission', 'error');
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.csv')) return showToast('Select CSV', 'error');
    setImportLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('Empty file');
      const headers = lines[0].split(',').map(h => h.trim());
      const required = ['emp_id', 'title', 'total_amount', 'expense_date'];
      const missing = required.filter(h => !headers.includes(h));
      if (missing.length) throw new Error(`Missing: ${missing.join(',')}`);
      const expensesToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, idx) => (obj[h] = vals[idx]));
        expensesToImport.push({
          emp_id: parseInt(obj.emp_id), title: obj.title,
          total_amount: parseFloat(obj.total_amount), expense_date: obj.expense_date,
          category: obj.category || 'other', description: obj.description || ''
        });
      }
      await Promise.all(expensesToImport.map(exp => hrAPI.createExpense(exp)));
      showToast(`Imported ${expensesToImport.length} expenses`);
      setShowImportModal(false);
      fetchExpenses();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  }, [canImport, showToast, fetchExpenses]);

  // Bulk actions
  const toggleSelection = (id) => { if (!canBulk) return; setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === expenses.length ? [] : expenses.map(e => e.expense_id));
  const handleBulkAction = async () => {
    if (!canBulk || !bulkAction || !selectedIds.length) return;
    if (bulkAction === 'delete') {
      setConfirmation({
        show: true, title: 'Delete Expenses', message: `Delete ${selectedIds.length} expense(s)?`, type: 'delete',
        onConfirm: async () => {
          await Promise.all(selectedIds.map(id => hrAPI.deleteExpense(id)));
          setSelectedIds([]); setBulkAction(''); fetchExpenses(); showToast('Deleted');
        }
      });
    } else {
      await Promise.all(selectedIds.map(id => hrAPI.changeExpenseStatus(id, { status: bulkAction })));
      setSelectedIds([]); setBulkAction(''); fetchExpenses(); showToast('Status updated');
    }
  };

  const handleDelete = (id) => {
    if (!canDelete) return showToast('No permission', 'error');
    const exp = expenses.find(e => e.expense_id === id);
    setConfirmation({
      show: true, title: 'Delete Expense', message: `Delete "${exp?.title}"?`, type: 'delete',
      onConfirm: async () => { await hrAPI.deleteExpense(id); fetchExpenses(); showToast('Deleted'); }
    });
  };

  const openModal = (expense = null) => {
    if (expense && !canUpdate) return showToast('No permission', 'error');
    if (!expense && !canCreate) return showToast('No permission', 'error');
    setEditingRecord(expense); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingRecord(null); };
  const handleSaved = () => { closeModal(); fetchExpenses(); showToast('Saved'); };

  const openItems = (expense) => { setSelectedExpense(expense); setShowItemsModal(true); };
  const closeItems = () => { setShowItemsModal(false); setSelectedExpense(null); };

  const handleSearch = (val) => setFilters(prev => ({ ...prev, search: val, page: 1 }));
  const handleFilterChange = (field, val) => setFilters(prev => ({ ...prev, [field]: val, page: 1 }));
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.totalPages) setFilters(prev => ({ ...prev, page: newPage })); };
  const clearFilters = () => { setFilters({ search: '', status: 'all', emp_id: '', category: '', sortBy: 'created_at', sortOrder: 'DESC', page: 1, limit: 15 }); showToast('Filters cleared', 'info'); };

  const tabs = useMemo(() => statusOptions.map(s => ({
    id: s.value, name: s.label,
    count: s.value === 'all' ? (counts.total || 0) : (counts[s.value] || 0)
  })), [counts, statusOptions]);

  return (
    <div className="space-y-2 p-2">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span className="text-xs font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
        <p className="text-[10px] text-gray-600">Manage expense reports</p>
        <div className="flex gap-1">
          {canImport && (
            <div className="flex gap-0.5">
              <button className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50"><FileText className="w-2.5 h-2.5" /> Sample</button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50"><Upload className="w-2.5 h-2.5" /> Import</button>
            </div>
          )}
          {canExport && <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"><Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting...' : 'Export'}</button>}
          {canCreate && <button onClick={() => openModal()} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded font-medium text-[10px] shadow-sm"><Plus className="w-2.5 h-2.5" /> New Expense</button>}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && canImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-base font-semibold">Import Expenses</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3">
              <p className="text-[10px] text-gray-600 mb-3">Upload CSV with columns: emp_id, title, total_amount, expense_date, etc.</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="import-csv-expense" />
                <label htmlFor="import-csv-expense" className="cursor-pointer block"><Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" /><p className="text-xs font-medium">Choose CSV file</p></label>
              </div>
              {importLoading && <div className="mt-3 text-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div><p className="text-[10px] mt-1">Importing...</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-1.5 border-b border-gray-200">
          {/* Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
            <div className="flex flex-wrap gap-0.5 bg-gray-100 p-0.5 rounded">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => handleFilterChange('status', tab.id)} className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all duration-200 flex items-center gap-0.5 ${filters.status === tab.id ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
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
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-[10px] font-medium">Apply</button>
                  <span className="text-[10px] text-primary-700 font-medium">{selectedIds.length} sel</span>
                </div>
              )}
              <button onClick={() => setShowFilters(!showFilters)} className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 ${showFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'}`}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Filters {filters.search || filters.status !== 'all' || filters.emp_id || filters.category ? '•' : ''}
              </button>
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 w-2.5 h-2.5" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => handleSearch(e.target.value)} className="pl-5 pr-1.5 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-[10px]" />
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-1 pt-1.5 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Status</label>
                  <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded">
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employee ID</label>
                  <input type="number" value={filters.emp_id} onChange={e => handleFilterChange('emp_id', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded" placeholder="Filter by employee" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Category</label>
                  <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded">
                    <option value="">All</option>
                    <option value="travel">Travel</option>
                    <option value="food">Food</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="transport">Transport</option>
                    <option value="medical">Medical</option>
                    <option value="training">Training</option>
                    <option value="office_supplies">Office Supplies</option>
                    <option value="client_meeting">Client Meeting</option>
                    <option value="internet">Internet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Per Page</label>
                  <select value={filters.limit} onChange={e => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))} className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="animate-pulse p-2 space-y-1">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-6 bg-gray-200 rounded"></div>)}</div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-4"><div className="text-center"><p className="text-xs text-red-600">{error}</p><button onClick={fetchExpenses} className="mt-1 px-2 py-0.5 bg-primary-600 text-white rounded text-[10px]">Retry</button></div></div>
          ) : expenses.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-max text-[10px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && <th className="px-1 py-1 sticky left-0 bg-gray-50"><input type="checkbox" checked={selectedIds.length === expenses.length && expenses.length > 0} onChange={toggleSelectAll} /></th>}
                    <th className="px-1 py-1">ID</th><th className="px-1 py-1">Number</th><th className="px-1 py-1">Employee</th><th className="px-1 py-1">Title</th><th className="px-1 py-1">Category</th><th className="px-1 py-1">Total</th><th className="px-1 py-1">Status</th><th className="px-1 py-1">Date</th><th className="px-1 py-1 sticky right-0 bg-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map(exp => (
                    <ExpenseRow key={exp.expense_id} expense={exp} canBulk={canBulk} selectedIds={selectedIds} toggleSelection={toggleSelection} canUpdate={canUpdate} canDelete={canDelete} openModal={openModal} handleDelete={handleDelete} openItems={openItems} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4"><p className="text-xs text-gray-600">No expenses found.</p></div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 border-t p-1.5 flex justify-between text-[10px]">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-0.5">
                <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1}><ChevronsLeft className="w-2.5 h-2.5"/></button>
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}><ChevronLeft className="w-2.5 h-2.5"/></button>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}><ChevronRight className="w-2.5 h-2.5"/></button>
                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}><ChevronsRight className="w-2.5 h-2.5"/></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ExpenseModal show={showModal} record={editingRecord} onClose={closeModal} onSaved={handleSaved} />
      {showItemsModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-sm font-semibold">Items for {selectedExpense.title}</h2>
              <button onClick={closeItems} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ExpenseItemManagement expenseId={selectedExpense.expense_id} />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation */}
      {confirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-4">
            <h3 className="font-semibold">{confirmation.title}</h3>
            <p className="text-xs my-2">{confirmation.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmation({ show: false })} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={() => { confirmation.onConfirm(); setConfirmation({ show: false }); }} className="px-3 py-1 bg-red-600 text-white rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;