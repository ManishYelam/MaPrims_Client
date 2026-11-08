import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Briefcase, Building2, Users, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, Calendar, CheckCircle, AlertCircle, Archive, Clock,
  CheckCircle2, XCircle, FileText, Hash, TrendingUp, DollarSign, Layers,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const PositionModal = lazy(() => import('./PositionModal'));
const ConfirmationModal = lazy(() => import('../../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const StatusBadge = React.memo(({ status, statusOptions }) => {
  const statusObj = statusOptions.find(s => s.value === status) || statusOptions[0];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${statusObj.color}`}>
      {statusObj.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const PositionManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'position', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'position', 'A4') || canManage, [hasPermission, canManage]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'position', 'A4') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'position', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'position', 'A4') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'position', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'position', 'A4') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '', department: 'all', grade: 'all', status: 'all', page: 1, limit: 5,
  });

  const departmentOptions = useMemo(() => {
    const deptMap = new Map();
    allPositions.forEach(pos => {
      if (pos.department && !deptMap.has(pos.dept_id)) {
        deptMap.set(pos.dept_id, pos.department);
      }
    });
    return Array.from(deptMap.entries()).map(([id, dept]) => ({
      value: id, label: dept.name, code: dept.code, ...dept,
    }));
  }, [allPositions]);

  const positionOptions = useMemo(() => {
    return allPositions.map(p => ({ value: p.position_id, label: p.title }));
  }, [allPositions]);

  const gradeOptions = useMemo(() => [
    { value: 'entry', label: 'Entry Level', color: 'bg-blue-100 text-blue-800' },
    { value: 'junior', label: 'Junior', color: 'bg-green-100 text-green-800' },
    { value: 'senior', label: 'Senior', color: 'bg-purple-100 text-purple-800' },
    { value: 'lead', label: 'Lead', color: 'bg-orange-100 text-orange-800' },
    { value: 'manager', label: 'Manager', color: 'bg-red-100 text-red-800' },
    { value: 'director', label: 'Director', color: 'bg-indigo-100 text-indigo-800' },
  ], []);

  const statusOptions = useMemo(() => [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 border border-green-300' },
    { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700 border border-red-300' },
    { value: 'frozen', label: 'Frozen', color: 'bg-gray-100 text-gray-700 border border-gray-300' },
  ], []);

  const tabs = useMemo(() => {
    const total = allPositions.length;
    const active = allPositions.filter(p => p.status === 'active').length;
    const inactive = allPositions.filter(p => p.status === 'inactive' || p.status === 'frozen').length;
    return [
      { id: 'all', name: 'All Positions', count: total, icon: Briefcase, color: 'text-gray-600' },
      { id: 'active', name: 'Active', count: active, icon: CheckCircle, color: 'text-green-600' },
      { id: 'inactive', name: 'Inactive', count: inactive, icon: AlertCircle, color: 'text-red-600' },
    ];
  }, [allPositions]);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrAPI.getPositions();
      const data = response.data;
      if (Array.isArray(data)) {
        setAllPositions(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError('Failed to load positions. Please try again.');
      console.error('Error fetching positions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  const filteredAndPaginated = useMemo(() => {
    let result = [...allPositions];
    if (activeTab !== 'all') result = result.filter(p => p.status === activeTab);
    if (filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }
    if (filters.department !== 'all') result = result.filter(p => p.dept_id === parseInt(filters.department));
    if (filters.grade !== 'all') result = result.filter(p => p.grade === filters.grade);
    if (filters.status !== 'all') result = result.filter(p => p.status === filters.status);
    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / filters.limit);
    const page = Math.min(filters.page, totalPages) || 1;
    const start = (page - 1) * filters.limit;
    const end = start + filters.limit;
    return { items: result.slice(start, end), totalItems, totalPages, page };
  }, [allPositions, activeTab, filters]);

  const { items: positions, totalItems, totalPages, page } = filteredAndPaginated;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const handleStatusChange = status => {
    setActiveTab(status);
    setFilters(prev => ({ ...prev, status: status === 'all' ? 'all' : status, page: 1 }));
  };

  const handleSearchChange = value => setFilters(prev => ({ ...prev, search: value, page: 1 }));
  const handleDepartmentChange = dept => setFilters(prev => ({ ...prev, department: dept, page: 1 }));
  const handleGradeChange = grade => setFilters(prev => ({ ...prev, grade, page: 1 }));
  const handleLimitChange = newLimit => setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  const handlePageChange = newPage => { if (newPage >= 1 && newPage <= totalPages) setFilters(prev => ({ ...prev, page: newPage })); };

  const clearAllFilters = () => {
    setFilters({ search: '', department: 'all', grade: 'all', status: 'all', page: 1, limit: 5 });
    setActiveTab('all');
    showToast('All filters cleared', 'info');
  };

  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || filters.department !== 'all' || filters.grade !== 'all' || filters.status !== 'all';
  }, [filters]);

  const togglePositionSelection = posId => {
    if (!canBulk) return;
    setSelectedPositions(prev => prev.includes(posId) ? prev.filter(id => id !== posId) : [...prev, posId]);
  };

  const toggleSelectAll = () => {
    if (!canBulk) return;
    setSelectedPositions(selectedPositions.length === positions.length ? [] : positions.map(p => p.position_id));
  };

  const handleBulkAction = async () => {
    if (!canBulk) { showToast('No permission for bulk actions', 'error'); return; }
    if (!bulkAction || selectedPositions.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission to delete', 'error'); return; }
        showConfirmation(
          'Delete Positions',
          `Delete ${selectedPositions.length} position(s)?`,
          'bulkDelete',
          async () => {
            await Promise.all(selectedPositions.map(id => hrAPI.deletePosition(id)));
            setBulkAction(''); setSelectedPositions([]); fetchPositions();
            showToast(`Deleted ${selectedPositions.length} positions`, 'success');
          }
        );
      } else {
        if (!canUpdateStatus) { showToast('No permission to update status', 'error'); return; }
        await Promise.all(selectedPositions.map(id => hrAPI.updatePosition(id, { status: bulkAction })));
        setBulkAction(''); setSelectedPositions([]); fetchPositions();
        showToast(`Updated ${selectedPositions.length} positions`, 'success');
      }
    } catch (err) { console.error(err); showToast('Bulk action failed', 'error'); }
  };

  const handleStatusUpdate = async (posId, newStatus) => {
    if (!canUpdateStatus) { showToast('No permission to update status', 'error'); return; }
    try {
      await hrAPI.updatePosition(posId, { status: newStatus });
      fetchPositions();
      showToast('Status updated', 'success');
    } catch (err) { console.error(err); showToast('Update failed', 'error'); }
  };

  const handleDeletePosition = posId => {
    if (!canDelete) { showToast('No permission to delete', 'error'); return; }
    const pos = allPositions.find(p => p.position_id === posId);
    showConfirmation(
      'Delete Position',
      `Delete "${pos?.title}"?`,
      'delete',
      async () => {
        try {
          await hrAPI.deletePosition(posId);
          fetchPositions();
          showToast('Position deleted', 'success');
        } catch (err) { console.error(err); showToast('Delete failed', 'error'); }
      }
    );
  };

  const openPositionModal = (pos = null) => {
    if (pos && !canUpdate) { showToast('No permission to edit', 'error'); return; }
    if (!pos && !canCreate) { showToast('No permission to create', 'error'); return; }
    setEditingPosition(pos);
    setShowPositionModal(true);
  };

  const closePositionModal = () => { setShowPositionModal(false); setEditingPosition(null); };

  const handlePositionSaved = () => {
    closePositionModal();
    fetchPositions();
    showToast('Position saved!', 'success');
  };

  const [confirmation, setConfirmation] = useState({ show: false, title: '', message: '', type: '', onConfirm: null });

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);

  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);

  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const getStatusColor = status => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const getGradeColor = grade => {
    const gradeObj = gradeOptions.find(g => g.value === grade);
    return gradeObj ? gradeObj.color : 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const formatDate = dateString => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const exportToCSV = async () => {
    if (!canExport) { showToast('No permission to export', 'error'); return; }
    try {
      setExportLoading(true);
      if (allPositions.length === 0) { showToast('No positions to export', 'error'); return; }
      const headers = [
        'ID', 'Title', 'Code', 'Department', 'Department Code', 'Grade', 'Level', 'Status',
        'Employment Type', 'Min Salary', 'Max Salary', 'Vacancy', 'Position Status',
        'Current Headcount', 'Max Headcount', 'Job Family', 'Job Function',
        'Required Experience (Years)', 'Created At', 'Updated At'
      ];
      const rows = allPositions.map(p => [
        p.position_id || '', `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${(p.code || '').replace(/"/g, '""')}"`, `"${(p.department?.name || '').replace(/"/g, '""')}"`,
        `"${(p.department?.code || '').replace(/"/g, '""')}"`, p.grade || '', p.level || '',
        p.status || '', p.employment_type || '', p.min_salary || '', p.max_salary || '',
        p.vacancy_count || '', p.position_status || '', p.current_headcount || '',
        p.max_headcount || '', `"${(p.job_family || '').replace(/"/g, '""')}"`,
        `"${(p.job_function || '').replace(/"/g, '""')}"`, p.required_experience_years || '',
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
        p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `positions_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      showToast(`Exported ${allPositions.length} positions`, 'success');
    } catch (err) { console.error(err); showToast('Export failed', 'error'); }
    finally { setExportLoading(false); }
  };

  const samplePositions = [
    ['title', 'code', 'grade', 'status', 'dept_id'],
    ['Senior Engineer', 'SE', 'senior', 'active', '1'],
    ['Manager', 'MGR', 'manager', 'active', '2'],
  ];

  const handleImportUpload = useCallback(async (parsedRows) => {
    if (!canImport) { showToast('No permission to import', 'error'); return; }
    try {
      const recordsToImport = parsedRows.map((row, i) => {
        if (!row.title) throw new Error(`Row ${i+1}: title required`);
        if (!row.grade) throw new Error(`Row ${i+1}: grade required`);
        return {
          title: row.title,
          code: row.code || '',
          grade: row.grade,
          status: row.status || 'active',
          dept_id: row.dept_id ? parseInt(row.dept_id) : null,
          description: row.description || '',
          level: row.level || '',
          employment_type: row.employment_type || 'full_time',
          min_salary: row.min_salary ? parseFloat(row.min_salary) : null,
          max_salary: row.max_salary ? parseFloat(row.max_salary) : null,
          max_headcount: row.max_headcount ? parseInt(row.max_headcount) : null,
        };
      });
      await Promise.all(recordsToImport.map(record => hrAPI.createPosition(record)));
      showToast(`Imported ${recordsToImport.length} positions`, 'success');
      setShowImportModal(false);
      fetchPositions();
    } catch (err) { showToast(`Import failed: ${err.message}`, 'error'); }
  }, [canImport, showToast, fetchPositions]);

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage and monitor all job positions</p></div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          {canImport && (
            <div className="flex gap-1">
              <button onClick={() => {
                const csvContent = samplePositions.map(row => row.map(f => `"${f}"`).join(',')).join('\n');
                const blob = new Blob([csvContent], {type: 'text/csv'});
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'position_import_template.csv';
                link.click();
                showToast('Sample CSV downloaded', 'info');
              }} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <FileText className="w-2.5 h-2.5"/> Sample
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <Upload className="w-2.5 h-2.5"/> Import
              </button>
            </div>
          )}
          {canExport && <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"><Download className="w-2.5 h-2.5"/> {exportLoading?'Exporting...':'Export'}</button>}
          {canCreate && <button onClick={() => openPositionModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium"><Plus className="w-2.5 h-2.5"/> New Position</button>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => handleStatusChange(tab.id)}
                    className={`px-2 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 ${
                      activeTab === tab.id ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}>
                    <Icon className={`w-3 h-3 ${activeTab === tab.id ? tab.color : ''}`} />{tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${
                      activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5">
              {canBulk && selectedPositions.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (<><option value="active">Activate</option><option value="inactive">Deactivate</option><option value="frozen">Freeze</option></>)}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium">Apply</button>
                  <span className="text-xs text-primary-700 font-medium">{selectedPositions.length} selected</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}>
                <SlidersHorizontal className="w-3 h-3" /> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3"/>
                <input type="text" placeholder="Search positions..." value={filters.search} onChange={e => handleSearchChange(e.target.value)} className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-xs"/>
              </div>
            </div>
          </div>
          {showAdvancedFilters && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                  <select value={filters.department} onChange={e => handleDepartmentChange(e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                    <option value="all">All Departments</option>
                    {departmentOptions.map(dept => <option key={dept.value} value={dept.value}>{dept.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grade</label>
                  <select value={filters.grade} onChange={e => handleGradeChange(e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                    <option value="all">All Grades</option>
                    {gradeOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                    <option value="all">All Statuses</option>
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Per Page</label>
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200 mt-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs font-medium text-blue-800">Filters:</span>
                    {filters.search && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded border">Search: "{filters.search}" <button onClick={() => handleSearchChange('')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.department !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded border">Dept: {departmentOptions.find(d => d.value === parseInt(filters.department))?.label} <button onClick={() => handleDepartmentChange('all')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.grade !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded border">Grade: {gradeOptions.find(g => g.value === filters.grade)?.label} <button onClick={() => handleGradeChange('all')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.status !== 'all' && <span className="inline-flex items-center px-0.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded border">Status: {statusOptions.find(s => s.value === filters.status)?.label} <button onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}><X className="w-2.5 h-2.5"/></button></span>}
                  </div>
                  <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Clear All</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><AlertCircle className="w-4 h-4 text-red-500"/></div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Positions</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchPositions} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">Try Again</button>
              </div>
            </div>
          ) : positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {canBulk && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"><input type="checkbox" checked={selectedPositions.length === positions.length && positions.length > 0} onChange={toggleSelectAll} disabled={!canBulk} className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"/></th>}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary Range</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Headcount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {positions.map(pos => {
                    const dept = pos.department;
                    const reportingPos = allPositions.find(p => p.position_id === pos.reporting_position_id);
                    const skills = pos.required_skills || [];
                    return (
                      <tr key={pos.position_id} className="hover:bg-gray-50 transition-colors">
                        {canBulk && <td className="px-3 py-2 whitespace-nowrap"><input type="checkbox" checked={selectedPositions.includes(pos.position_id)} onChange={() => togglePositionSelection(pos.position_id)} className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"/></td>}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-6 w-6 bg-gray-100 rounded-md flex items-center justify-center mr-1.5 border border-gray-200"><Briefcase className="w-3 h-3 text-gray-500" /></div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">{pos.title}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5"><Hash className="w-2 h-2"/><span>{pos.code || 'N/A'}</span>{reportingPos && <><span className="mx-0.5">•</span><span>Reports to: {reportingPos.title}</span></>}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{dept ? <div className="text-xs"><div className="font-medium text-gray-900">{dept.name}</div>{dept.code && <div className="text-gray-500 text-[10px]">{dept.code}</div>}</div> : '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap"><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(pos.grade)}`}>{gradeOptions.find(g => g.value === pos.grade)?.label || pos.grade || '—'}</span></td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{pos.level || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{pos.employment_type || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{pos.min_salary && pos.max_salary ? <span>₹{Number(pos.min_salary).toLocaleString()} - ₹{Number(pos.max_salary).toLocaleString()}</span> : '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{pos.current_headcount !== undefined ? <span>{pos.current_headcount} / {pos.max_headcount || '∞'}</span> : '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{skills.length > 0 ? <div className="flex flex-wrap gap-0.5 max-w-[120px]">{skills.slice(0,2).map((skill, idx) => <span key={idx} className="inline-block px-1 py-0.5 bg-gray-100 rounded text-[10px] text-gray-700">{skill}</span>)}{skills.length > 2 && <span className="text-[10px] text-gray-400">+{skills.length-2}</span>}</div> : '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{canUpdateStatus ? <select value={pos.status || 'active'} onChange={e => handleStatusUpdate(pos.position_id, e.target.value)} className={`text-xs font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1.5 py-0.5 ${getStatusColor(pos.status)}`}><option value="active">Active</option><option value="inactive">Inactive</option><option value="frozen">Frozen</option></select> : <StatusBadge status={pos.status} statusOptions={statusOptions} />}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500"><div className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5"/>{formatDate(pos.createdAt)}</div></td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center gap-0.5">
                            {canUpdate && <button onClick={() => openPositionModal(pos)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50" title="Edit"><Edit className="w-3 h-3"/></button>}
                            {canDelete && <button onClick={() => handleDeletePosition(pos.position_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50" title="Delete"><Trash2 className="w-3 h-3"/></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><Briefcase className="w-4 h-4 text-gray-400"/></div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No positions found</h3>
                <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'Try adjusting your filters.' : 'Create your first position.'}</p>
                {canCreate && <button onClick={() => openPositionModal()} className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"><Plus className="w-2.5 h-2.5"/> Add Position</button>}
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span>Showing</span><span className="font-medium">{(page-1)*filters.limit+1}</span><span>to</span><span className="font-medium">{Math.min(page*filters.limit, totalItems)}</span><span>of</span><span className="font-medium">{totalItems}</span><span>results</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={page===1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsLeft className="w-3 h-3"/></button>
                <button onClick={() => handlePageChange(page-1)} disabled={page===1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronLeft className="w-3 h-3"/></button>
                {Array.from({length:Math.min(5, totalPages)}, (_, i) => {
                  let pageNum;
                  if (totalPages<=5) pageNum=i+1;
                  else if (page<=3) pageNum=i+1;
                  else if (page>=totalPages-2) pageNum=totalPages-4+i;
                  else pageNum=page-2+i;
                  return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-6 h-6 text-xs rounded border transition-colors ${page===pageNum?'bg-primary-600 text-white border-primary-600':'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{pageNum}</button>
                })}
                <button onClick={() => handlePageChange(page+1)} disabled={page===totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronRight className="w-3 h-3"/></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={page===totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsRight className="w-3 h-3"/></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showPositionModal && (
          <PositionModal show={showPositionModal} position={editingPosition} onClose={closePositionModal} onSaved={handlePositionSaved}
            departments={departmentOptions} positions={positionOptions}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleImportUpload}
            moduleName="Positions"
            requiredHeaders={['title', 'grade', 'status']}
            sampleRows={samplePositions}
            formatDescription="Required: title, grade, status. Optional: code, dept_id, description, etc."
            validateRow={(row, i) => {
              if (!row.title) throw new Error(`Row ${i+1}: title required`);
              if (!row.grade) throw new Error(`Row ${i+1}: grade required`);
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

export default PositionManagement;