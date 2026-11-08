import React, {
  useState, useEffect, useCallback, useMemo, useContext, useRef, memo, lazy, Suspense,
} from 'react';
import {
  Search, Edit, Trash2, Building2, Users, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Calendar, CheckCircle, AlertCircle, RefreshCw, Hash, Mail, Phone, CheckCircle2,
  Eye, Power, PowerOff, Loader,
} from 'lucide-react';
import { hrAPI } from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';

const DepartmentModal = lazy(() => import('./DepartmentModal'));
const ConfirmationModal = lazy(() => import('../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../components/common/Toast'));
const DepartmentSelectionModal = lazy(() => import('./DepartmentSelectionModal'));

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Popover = ({ children, content, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 320),
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className="inline-block"
    >
      {children}
      {isOpen && content && (
        <div
          className={`fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg p-3 max-w-xs max-h-72 overflow-auto ${className}`}
          style={{ top: position.top, left: position.left }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

const StatusBadge = memo(({ status, statusOptions }) => {
  const statusObj = statusOptions.find((s) => s.value === status) || statusOptions[0];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${statusObj.color}`}>
      {statusObj.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const DepartmentRow = memo(
  ({
    dept, index, canBulk, canUpdate, canDelete, canUpdateStatus,
    selectedDepartments, toggleDepartmentSelection, openDepartmentModal,
    handleStatusUpdate, handleDeleteDepartment, handleToggleStatus, togglingStatusIds,
    departmentTypes, statusOptions, getTypeColor, getStatusColor, formatDate, formatCurrency,
  }) => {
    const employeeCount = dept.employees?.length || 0;
    const childrenCount = dept.children?.length || 0;
    const rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    const isActive = dept.status === 'active';
    const isToggling = togglingStatusIds?.has(dept.dept_id);

    const employeePopoverContent = (
      <div className="py-1">
        <div className="font-medium text-xs text-gray-700 border-b pb-1 mb-1">Employees ({employeeCount})</div>
        {employeeCount > 0 ? (
          <div className="max-h-52 overflow-y-auto">
            <ul className="space-y-1 text-[11px] text-gray-600">
              {dept.employees.map((emp) => (
                <li key={emp.emp_id} className="flex flex-col border-b border-gray-100 last:border-0 pb-1">
                  <div className="flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3 text-gray-400" />
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div className="flex flex-wrap gap-1 ml-4 text-gray-500">
                    <span>Code: {emp.employee_code}</span>
                    <span>•</span>
                    <span>Email: {emp.email || 'N/A'}</span>
                    <span>•</span>
                    <span>Status: {emp.status || 'N/A'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">No employees</span>
        )}
      </div>
    );

    const childrenPopoverContent = (
      <div className="py-1">
        <div className="font-medium text-xs text-gray-700 border-b pb-1 mb-1">Children ({childrenCount})</div>
        {childrenCount > 0 ? (
          <div className="max-h-52 overflow-y-auto">
            <ul className="space-y-0.5 text-[11px] text-gray-600">
              {dept.children.map((child) => (
                <li key={child.dept_id} className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  <span className="font-mono text-xs">#{child.dept_id}</span>
                  <span>{child.name}</span>
                  <span className="text-gray-400">({child.code})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">No children</span>
        )}
      </div>
    );

    const parentPopoverContent = childrenPopoverContent;

    return (
      <tr className={`${rowBgClass} hover:bg-gray-50 transition-colors`}>
        {canBulk && (
          <td className={`px-0.5 py-1 whitespace-nowrap ${rowBgClass}`}>
            <input
              type="checkbox"
              checked={selectedDepartments.includes(dept.dept_id)}
              onChange={() => toggleDepartmentSelection(dept.dept_id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
            />
          </td>
        )}

        {/* ACTIONS COLUMN — FIRST (View | Edit | Active/Inactive | Delete) */}
        <td className={`px-0.5 py-1 whitespace-nowrap ${rowBgClass} min-w-[80px]`}>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => openDepartmentModal(dept, true)}
              title="View Details"
              className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors"
            >
              <Eye className="w-3 h-3" />
            </button>

            {canUpdate && (
              <button
                onClick={() => openDepartmentModal(dept, false)}
                title="Edit"
                className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}

            {canUpdateStatus && (
              <button
                onClick={() => handleToggleStatus(dept)}
                disabled={isToggling}
                title={isActive ? 'Deactivate' : 'Activate'}
                className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${isToggling ? 'opacity-50 cursor-wait' :
                    isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
                  }`}
              >
                {isToggling ? <Loader className="w-3 h-3 animate-spin" /> :
                  isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => handleDeleteDepartment(dept.dept_id)}
                title="Delete"
                className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </td>

        <td className={`px-0.5 py-1 whitespace-nowrap ${rowBgClass} min-w-[60px]`}>
          <span className="text-[11px] font-mono text-gray-500">#{dept.dept_id}</span>
        </td>
        <td className={`px-0.5 py-1 whitespace-nowrap ${rowBgClass} min-w-[160px]`}>
          <div className="flex items-center">
            <div className="h-5 w-5 bg-gray-100 rounded-md flex items-center justify-center mr-1 border border-gray-200">
              <Building2 className="w-2.5 h-2.5 text-gray-500" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-gray-900 line-clamp-1">{dept.name}</div>
              <div className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                <Hash className="w-2 h-2" />
                <span>{dept.code || 'N/A'}</span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-0.5 py-1 text-[11px] text-gray-600 max-w-[120px] truncate">{dept.description || '—'}</td>
        <td className="px-0.5 py-1 whitespace-nowrap">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTypeColor(dept.department_type)}`}>
            {departmentTypes.find((t) => t.value === dept.department_type)?.label || dept.department_type}
          </span>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {dept.parent ? (
            <Popover content={parentPopoverContent}>
              <span className="cursor-default hover:text-primary-600 transition-colors">{dept.parent.name}</span>
            </Popover>
          ) : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700 text-center">
          <Popover content={childrenPopoverContent}>
            <span className="cursor-default hover:text-primary-600 transition-colors">{childrenCount}</span>
          </Popover>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">{dept.cost_centre || '—'}</td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] font-medium text-gray-900">{formatCurrency(dept.budget)}</td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {dept.email ? <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5 text-gray-400" />{dept.email}</span> : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {dept.phone ? <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5 text-gray-400" />{dept.phone}</span> : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {dept.established_date ? formatDate(dept.established_date) : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap">
          {canUpdateStatus ? (
            <select
              value={dept.status || 'active'}
              onChange={(e) => handleStatusUpdate(dept.dept_id, e.target.value)}
              className={`text-[10px] font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1 py-0 ${getStatusColor(dept.status)}`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          ) : (
            <StatusBadge status={dept.status} statusOptions={statusOptions} />
          )}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {employeeCount > 0 ? (
            <Popover content={employeePopoverContent}>
              <span className="cursor-default flex items-center gap-0.5 hover:text-primary-600 transition-colors">
                <Users className="w-2.5 h-2.5 text-gray-400" />
                {employeeCount}
              </span>
            </Popover>
          ) : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[10px] text-gray-500">
          <div className="flex items-center gap-0.5"><Calendar className="w-2 h-2" />{formatDate(dept.createdAt)}</div>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[10px] text-gray-500">
          <div className="flex items-center gap-0.5"><Calendar className="w-2 h-2" />{formatDate(dept.updatedAt)}</div>
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {dept.created_by ? `#${dept.created_by}` : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap text-[11px] text-gray-700">
          {dept.updated_by ? `#${dept.updated_by}` : '—'}
        </td>
        <td className="px-0.5 py-1 whitespace-nowrap">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
            {dept.reg_type || '—'}
          </span>
        </td>
      </tr>
    );
  }
);
DepartmentRow.displayName = 'DepartmentRow';

/* Date helpers */
const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatYMD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const subDays = (date, days) => { const r = new Date(date); r.setDate(date.getDate() - days); return r; };
const subMonths = (date, months) => { const r = new Date(date); r.setMonth(date.getMonth() - months); if (r.getDate() !== date.getDate()) r.setDate(0); return r; };
const subYears = (date, years) => { const r = new Date(date); r.setFullYear(date.getFullYear() - years); return r; };
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

const DepartmentManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'department', 'A3') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'department', 'A3') || canManage, [hasPermission, canManage]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'department', 'A3') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'department', 'A3') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'department', 'A3') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'department', 'A3') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'department', 'A3') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const [filterByDepartment, setFilterByDepartment] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '', type: 'all', parent: 'all', department: 'all',
    dateFrom: '', dateTo: '', page: 1, limit: 50,
  });
  const [datePreset, setDatePreset] = useState('all');
  const debouncedSearch = useDebounce(filters.search, 300);

  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const departmentTypes = useMemo(() => [
    { value: 'business', label: 'Business', color: 'bg-blue-100 text-blue-800' },
    { value: 'support', label: 'Support', color: 'bg-green-100 text-green-800' },
    { value: 'operations', label: 'Operations', color: 'bg-purple-100 text-purple-800' },
    { value: 'administration', label: 'Administration', color: 'bg-orange-100 text-orange-800' },
  ], []);

  const statusOptions = useMemo(() => [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 border border-green-300' },
    { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700 border border-red-300' },
  ], []);

  const tabs = useMemo(() => {
    const countFromServer = (status) => counts[status] ?? 0;
    return [
      { id: 'all', name: 'All Departments', count: counts.total ?? totalItems, icon: Building2, color: 'text-gray-600' },
      { id: 'active', name: 'Active', count: countFromServer('active'), icon: CheckCircle, color: 'text-green-600' },
      { id: 'inactive', name: 'Inactive', count: countFromServer('inactive'), icon: AlertCircle, color: 'text-red-600' },
    ];
  }, [counts, totalItems]);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (activeTab !== 'all') filterObj.status = activeTab;
      if (filters.type !== 'all') filterObj.department_type = filters.type;
      if (filters.parent !== 'all') filterObj.parent_id = filters.parent;
      if (filterByDepartment && selectedDepartment) filterObj.dept_id = selectedDepartment.dept_id;
      if (filters.dateFrom) filterObj.created_at_from = filters.dateFrom;
      if (filters.dateTo) filterObj.created_at_to = filters.dateTo;

      const payload = {
        page: filters.page, limit: filters.limit, search: debouncedSearch,
        searchFields: ['name', 'code', 'description'], filters: filterObj,
      };

      const response = await hrAPI.getDepartments(payload);
      const data = response.data;

      if (data?.success) {
        setDepartments(data.departments || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCounts(data.counts || {});
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError(err.message || 'Failed to load departments');
      setDepartments([]); setTotalItems(0); setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, activeTab, filterByDepartment, selectedDepartment]);

  const fetchParentOptions = useCallback(async () => {
    try {
      const response = await hrAPI.getDepartments({ page: 1, limit: 1000, search: '', searchFields: [], filters: {} });
      if (response.data?.success) {
        const depts = response.data.departments || [];
        setParentOptions(depts.map((d) => ({ value: d.dept_id, label: d.name })));
      }
    } catch (err) { console.warn('Could not fetch parent options:', err); }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await hrAPI.getEmployees({ page: 1, limit: 1000 });
      if (response.data?.success) {
        const emps = response.data.employees || [];
        setEmployeeOptions(emps.map((emp) => ({
          value: emp.emp_id,
          label: `${emp.first_name} ${emp.last_name} (${emp.employee_code})`,
        })));
      }
    } catch (err) { console.warn('Could not fetch employees:', err); }
  }, []);

  useEffect(() => {
    fetchDepartments(); fetchParentOptions(); fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevPageRef = useRef(filters.page);
  const prevLimitRef = useRef(filters.limit);
  useEffect(() => {
    if (prevPageRef.current !== filters.page || prevLimitRef.current !== filters.limit) {
      prevPageRef.current = filters.page;
      prevLimitRef.current = filters.limit;
      fetchDepartments();
    }
  }, [filters.page, filters.limit, fetchDepartments]);

  const handleStatusChange = useCallback((status) => {
    setActiveTab(status); setFilters(prev => ({ ...prev, page: 1 }));
  }, []);
  const handleTypeChange = useCallback((type) => setFilters(prev => ({ ...prev, type, page: 1 })), []);
  const handleParentChange = useCallback((parent) => setFilters(prev => ({ ...prev, parent, page: 1 })), []);
  const handleSearchChange = useCallback((value) => setFilters(prev => ({ ...prev, search: value, page: 1 })), []);
  const handleLimitChange = useCallback((newLimit) => setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 })), []);
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setFilters(prev => ({ ...prev, page: newPage }));
  }, [totalPages]);

  const handleToggleFilterByDepartment = useCallback(() => {
    setFilterByDepartment(prev => {
      if (prev) {
        setSelectedDepartment(null);
        setFilters(prevFilters => ({ ...prevFilters, department: 'all', page: 1 }));
      }
      return !prev;
    });
  }, []);

  const handleDepartmentSelected = useCallback((dept) => {
    setSelectedDepartment(dept);
    setFilters(prev => ({ ...prev, department: dept ? dept.dept_id : 'all', page: 1 }));
    setFilterByDepartment(true);
    setShowDeptModal(false);
  }, []);

  const handleDatePresetChange = useCallback((e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    const today = new Date();
    let start = '', end = '';
    switch (preset) {
      case 'all': start = ''; end = ''; break;
      case 'today': start = formatYMD(startOfDay(today)); end = formatYMD(endOfDay(today)); break;
      case 'yesterday': start = formatYMD(startOfDay(subDays(today, 1))); end = formatYMD(endOfDay(subDays(today, 1))); break;
      case 'last7days': start = formatYMD(startOfDay(subDays(today, 6))); end = formatYMD(endOfDay(today)); break;
      case 'monthtodate': start = formatYMD(startOfMonth(today)); end = formatYMD(endOfDay(today)); break;
      case 'previous-month': start = formatYMD(startOfMonth(subMonths(today, 1))); end = formatYMD(endOfMonth(subMonths(today, 1))); break;
      case 'yeartodate': start = formatYMD(startOfYear(today)); end = formatYMD(endOfDay(today)); break;
      case 'previous-year': start = formatYMD(startOfYear(subYears(today, 1))); end = formatYMD(endOfYear(subYears(today, 1))); break;
      default: return;
    }
    setFilters(prev => ({ ...prev, dateFrom: start, dateTo: end, page: 1 }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ search: '', type: 'all', parent: 'all', department: 'all', dateFrom: '', dateTo: '', page: 1, limit: 50 });
    setActiveTab('all'); setDatePreset('all'); setSelectedDepartment(null); setFilterByDepartment(false);
    showToast('All filters cleared', 'info');
  }, [showToast]);

  const handleRefresh = useCallback(() => { clearAllFilters(); fetchDepartments(); }, [clearAllFilters, fetchDepartments]);
  const handleGetData = useCallback(() => { fetchDepartments(); }, [fetchDepartments]);

  const hasActiveFilters = useMemo(() =>
    filters.search !== '' || activeTab !== 'all' || filters.type !== 'all' ||
    filters.parent !== 'all' || filters.department !== 'all' ||
    filters.dateFrom !== '' || filters.dateTo !== '',
    [filters, activeTab]);

  const getStatusColor = useCallback((status) => (statusOptions.find(s => s.value === status) || statusOptions[0]).color, [statusOptions]);
  const getTypeColor = useCallback((type) => (departmentTypes.find(t => t.value === type) || departmentTypes[0]).color, [departmentTypes]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  const formatCurrency = useCallback((value) => {
    const num = Number(value);
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }, []);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedDepartments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = departments.map(d => d.dept_id);
    setSelectedDepartments(selectedDepartments.length === ids.length ? [] : ids);
  }, [canBulk, departments, selectedDepartments]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk) { showToast('No permission', 'error'); return; }
    if (!bulkAction || selectedDepartments.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission', 'error'); return; }
        showConfirmation('Delete Departments', `Delete ${selectedDepartments.length} department(s)?`, 'bulkDelete', async () => {
          await Promise.all(selectedDepartments.map(id => hrAPI.deleteDepartment(id)));
          setBulkAction(''); setSelectedDepartments([]); fetchDepartments();
          showToast(`Deleted ${selectedDepartments.length} departments`, 'success');
        });
      } else {
        if (!canUpdateStatus) { showToast('No permission', 'error'); return; }
        await Promise.all(selectedDepartments.map(id => hrAPI.updateDepartment(id, { status: bulkAction })));
        setBulkAction(''); setSelectedDepartments([]); fetchDepartments();
        showToast(`Updated ${selectedDepartments.length} departments`, 'success');
      }
    } catch (err) { console.error(err); showToast('Bulk action failed', 'error'); }
  }, [canBulk, bulkAction, selectedDepartments, canDelete, canUpdateStatus, fetchDepartments, showToast]);

  /* OPTIMISTIC status update via inline <select> */
  const handleStatusUpdate = useCallback(async (deptId, newStatus) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }

    const dept = departments.find(d => d.dept_id === deptId);
    const currentStatus = dept?.status || 'active';
    if (currentStatus === newStatus) return;

    setDepartments(prev =>
      prev.map(d => d.dept_id === deptId ? { ...d, status: newStatus } : d)
    );

    setCounts(prev => {
      const next = { ...prev };
      if (currentStatus === 'active' && newStatus === 'inactive') {
        next.active = Math.max(0, (next.active ?? 0) - 1);
        next.inactive = (next.inactive ?? 0) + 1;
      } else if (currentStatus === 'inactive' && newStatus === 'active') {
        next.inactive = Math.max(0, (next.inactive ?? 0) - 1);
        next.active = (next.active ?? 0) + 1;
      }
      return next;
    });

    setTogglingStatusIds(prev => new Set(prev).add(deptId));

    try {
      await hrAPI.updateDepartment(deptId, { status: newStatus });
      showToast('Status updated', 'success');
    } catch (err) {
      setDepartments(prev =>
        prev.map(d => d.dept_id === deptId ? { ...d, status: currentStatus } : d)
      );
      setCounts(prev => {
        const next = { ...prev };
        if (currentStatus === 'active' && newStatus === 'inactive') {
          next.active = (next.active ?? 0) + 1;
          next.inactive = Math.max(0, (next.inactive ?? 0) - 1);
        } else if (currentStatus === 'inactive' && newStatus === 'active') {
          next.inactive = (next.inactive ?? 0) + 1;
          next.active = Math.max(0, (next.active ?? 0) - 1);
        }
        return next;
      });
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const n = new Set(prev);
        n.delete(deptId);
        return n;
      });
    }
  }, [canUpdateStatus, departments, showToast]);

  /* OPTIMISTIC toggle status via Power/PowerOff icon */
  const handleToggleStatus = useCallback(async (dept) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }

    const id = dept.dept_id;
    const currentStatus = dept.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    setDepartments(prev =>
      prev.map(d => d.dept_id === id ? { ...d, status: nextStatus } : d)
    );

    setCounts(prev => {
      const next = { ...prev };
      if (currentStatus === 'active') {
        next.active = Math.max(0, (next.active ?? 0) - 1);
        next.inactive = (next.inactive ?? 0) + 1;
      } else {
        next.inactive = Math.max(0, (next.inactive ?? 0) - 1);
        next.active = (next.active ?? 0) + 1;
      }
      return next;
    });

    setTogglingStatusIds(prev => new Set(prev).add(id));

    try {
      await hrAPI.updateDepartment(id, { status: nextStatus });
      showToast(`Department ${nextStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      setDepartments(prev =>
        prev.map(d => d.dept_id === id ? { ...d, status: currentStatus } : d)
      );
      setCounts(prev => {
        const next = { ...prev };
        if (currentStatus === 'active') {
          next.active = (next.active ?? 0) + 1;
          next.inactive = Math.max(0, (next.inactive ?? 0) - 1);
        } else {
          next.inactive = (next.inactive ?? 0) + 1;
          next.active = Math.max(0, (next.active ?? 0) - 1);
        }
        return next;
      });
      showToast('Failed to change status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }, [canUpdateStatus, showToast]);

  /* OPTIMISTIC delete */
  const handleDeleteDepartment = useCallback((deptId) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const dept = departments.find(d => d.dept_id === deptId);
    showConfirmation('Delete Department', `Delete "${dept?.name}"?`, 'delete', async () => {
      const snapshotDepartments = departments;
      const snapshotCounts = counts;
      const snapshotTotal = totalItems;

      setDepartments(prev => prev.filter(d => d.dept_id !== deptId));
      setTotalItems(prev => Math.max(0, prev - 1));
      setCounts(prev => {
        const next = { ...prev };
        if (dept?.status === 'active') next.active = Math.max(0, (next.active ?? 0) - 1);
        if (dept?.status === 'inactive') next.inactive = Math.max(0, (next.inactive ?? 0) - 1);
        next.total = Math.max(0, (next.total ?? 0) - 1);
        return next;
      });

      try {
        await hrAPI.deleteDepartment(deptId);
        showToast('Department deleted', 'success');
      } catch (err) {
        setDepartments(snapshotDepartments);
        setCounts(snapshotCounts);
        setTotalItems(snapshotTotal);
        console.error(err);
        showToast('Failed to delete', 'error');
      }
    });
  }, [canDelete, departments, counts, totalItems, showToast]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const openDepartmentModal = useCallback((dept = null, readOnlyMode = false) => {
    if (dept && !canUpdate && !readOnlyMode) { showToast('No permission to edit', 'error'); return; }
    if (!dept && !canCreate) { showToast('No permission to create', 'error'); return; }
    setEditingDepartment(dept);
    setIsReadOnly(readOnlyMode);
    setShowDepartmentModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeDepartmentModal = useCallback(() => {
    setShowDepartmentModal(false);
    setEditingDepartment(null);
    setIsReadOnly(false);
  }, []);

  const handleDepartmentSaved = useCallback(() => {
    closeDepartmentModal();
    fetchDepartments();
    showToast('Department saved!', 'success');
  }, [closeDepartmentModal, fetchDepartments, showToast]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) { showToast('No permission', 'error'); return; }
    if (departments.length === 0) { showToast('No departments to export', 'error'); return; }
    setExportLoading(true);
    try {
      const allData = departments;
      const headers = [
        'Dept ID', 'Name', 'Code', 'Description', 'Type', 'Status',
        'Parent ID', 'Parent Name', 'Head ID', 'Cost Centre', 'Budget',
        'Location ID', 'Email', 'Phone', 'Established Date', 'Employee Count',
        'Created By', 'Updated By', 'Reg Type', 'Created At', 'Updated At',
      ];
      const csvRows = allData.map((dept) => [
        dept.dept_id || '',
        `"${(dept.name || '').replace(/"/g, '""')}"`,
        `"${(dept.code || '').replace(/"/g, '""')}"`,
        `"${(dept.description || '').replace(/"/g, '""')}"`,
        dept.department_type || '',
        dept.status || '',
        dept.parent_id || '',
        `"${(dept.parent?.name || '').replace(/"/g, '""')}"`,
        dept.head_id || '',
        dept.cost_centre || '',
        dept.budget || '0',
        dept.location_id || '',
        dept.email || '',
        dept.phone || '',
        dept.established_date || '',
        dept.employees?.length || 0,
        dept.created_by || '',
        dept.updated_by || '',
        dept.reg_type || '',
        dept.createdAt ? new Date(dept.createdAt).toISOString() : '',
        dept.updatedAt ? new Date(dept.updatedAt).toISOString() : '',
      ]);
      const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `departments_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      showToast(`Exported ${allData.length} departments`, 'success');
    } catch (err) { console.error(err); showToast('Export failed', 'error'); }
    finally { setExportLoading(false); }
  }, [canExport, departments, showToast]);

  const handleDepartmentImport = useCallback(async (parsedRows) => {
    try {
      const response = await hrAPI.bulkImportDepartments({ data: parsedRows });
      const data = response.data;
      if (data.success) {
        showToast(`✅ Import successful: ${data.created} created, ${data.skipped} skipped (duplicates)`, 'success');
      } else if (data.created + data.skipped > 0) {
        showToast(`⚠️ Partial success: ${data.created} created, ${data.skipped} skipped, ${data.failed} failed.`, 'warning');
      } else {
        showToast(`❌ Import failed: ${data.failed} rows.${data.errors ? ' Check logs.' : ''}`, 'error');
        if (data.errors) console.warn('Import errors:', data.errors);
      }
      fetchDepartments();
      return data;
    } catch (err) {
      showToast('Bulk import failed: ' + (err.response?.data?.message || err.message), 'error');
      console.error(err);
      return { success: false, message: err.message, failed: parsedRows.length, errors: [] };
    }
  }, [fetchDepartments, showToast]);

  return (
    /* ✅ FIXED: h-full fits exactly inside <main>'s scroll container — no overlap under dashboard footer */
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      {/* Toolbar — pinned, never shrinks */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage and monitor all departments</p></div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          {canImport && (
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
              <Upload className="w-2.5 h-2.5" /> Import
            </button>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}

          <button
            onClick={handleToggleFilterByDepartment}
            className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${filterByDepartment
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Building2 className="w-3 h-3" />
            {selectedDepartment ? selectedDepartment.name : 'Departments'}
            {filterByDepartment && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
          </button>

          {filterByDepartment && (
            <button onClick={() => setShowDeptModal(true)} className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors">
              <Building2 className="w-3 h-3" />
              {selectedDepartment ? 'Change' : 'Select Department'}
            </button>
          )}

          <button onClick={handleGetData} className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors">
            <RefreshCw className="w-3 h-3" /> Get Data
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>

          <select value={datePreset} onChange={handleDatePresetChange} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="monthtodate">Month to date</option>
            <option value="previous-month">Previous month</option>
            <option value="yeartodate">Year to date</option>
            <option value="previous-year">Previous year</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />
          <input type="date" value={filters.dateTo} onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />
          <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
            <option value="150">150 per page</option>
            <option value="200">200 per page</option>
            <option value="250">250 per page</option>
            <option value="300">300 per page</option>
          </select>

          {canCreate && (
            <button onClick={() => openDepartmentModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium">
              <Plus className="w-2.5 h-2.5" /> Add Department
            </button>
          )}
        </div>
      </div>

      {/* Card — fills remaining height */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Card header (tabs + filters) — pinned */}
        <div className="flex-shrink-0 p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleStatusChange(tab.id)}
                    className={`px-1.5 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                  >
                    <Icon className={`w-3 h-3 ${activeTab === tab.id ? tab.color : ''}`} /> {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                      }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <select value={filters.type} onChange={(e) => handleTypeChange(e.target.value)} className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white">
                <option value="all">All Types</option>
                {departmentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              <select value={filters.parent} onChange={(e) => handleParentChange(e.target.value)} className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white">
                <option value="all">All Parents</option>
                {parentOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search departments..." value={filters.search} onChange={e => handleSearchChange(e.target.value)} className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-xs" />
              </div>

              {canBulk && selectedDepartments.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (<><option value="active">Activate</option><option value="inactive">Deactivate</option></>)}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium">Apply</button>
                  <span className="text-xs text-primary-700 font-medium">{selectedDepartments.length} selected</span>
                </div>
              )}
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800">Clear all filters</button>
              )}
            </div>
          </div>
        </div>

        {/* Table body — the ONLY scroll area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                <h3 className="text-sm font-bold">Unable to Load Departments</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchDepartments} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">Try Again</button>
              </div>
            </div>
          ) : departments.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8"><input type="checkbox" checked={selectedDepartments.length === departments.length && departments.length > 0} onChange={toggleSelectAll} disabled={!canBulk} className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3" /></th>}
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Children</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Cost Centre</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Established</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Reg Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept, index) => (
                  <DepartmentRow
                    key={dept.dept_id}
                    dept={dept}
                    index={index}
                    canBulk={canBulk}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    canUpdateStatus={canUpdateStatus}
                    selectedDepartments={selectedDepartments}
                    toggleDepartmentSelection={toggleSelection}
                    openDepartmentModal={openDepartmentModal}
                    handleStatusUpdate={handleStatusUpdate}
                    handleDeleteDepartment={handleDeleteDepartment}
                    handleToggleStatus={handleToggleStatus}
                    togglingStatusIds={togglingStatusIds}
                    departmentTypes={departmentTypes}
                    statusOptions={statusOptions}
                    getTypeColor={getTypeColor}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><Building2 className="w-4 h-4 text-gray-400" /></div>
                <h3 className="text-sm font-medium">No departments found</h3>
                <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No departments match your search criteria.' : 'Get started by adding your first department.'}</p>
                {canCreate && <button onClick={() => openDepartmentModal()} className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"><Plus className="w-2.5 h-2.5" /> Add Department</button>}
              </div>
            </div>
          )}
        </div>

        {/* Pagination footer — pinned, never shrinks */}
        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span>Showing</span><span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                <span>to</span><span className="font-medium">{Math.min(filters.page * filters.limit, totalItems)}</span>
                <span>of</span><span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (filters.page <= 3) pageNum = i + 1;
                  else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = filters.page - 2 + i;
                  return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-6 h-6 text-xs rounded border transition-colors ${filters.page === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{pageNum}</button>
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showDepartmentModal && (
          <DepartmentModal
            show={showDepartmentModal}
            department={editingDepartment}
            onClose={closeDepartmentModal}
            onSaved={handleDepartmentSaved}
            departments={departments}
            employees={employeeOptions}
            readOnly={isReadOnly}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal show={showImportModal} onClose={() => setShowImportModal(false)} onUpload={handleDepartmentImport} moduleName="departments" />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showDeptModal && (
          <DepartmentSelectionModal show={showDeptModal} onClose={() => setShowDeptModal(false)} onSelect={handleDepartmentSelected} selectedDepartmentId={selectedDepartment?.dept_id} />
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

export default DepartmentManagement;