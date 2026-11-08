import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  useRef,
  memo,
  lazy,
  Suspense,
} from 'react';
import {
  Search,
  Edit,
  Trash2,
  User,
  Users,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Filter,
  Plus,
  MapPin,
  BookOpen,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Send,
  Phone,
  Shield,
  UserCog,
  UserPlus,
  RefreshCw,
  Power,
  PowerOff,
  Loader,
  Briefcase,
  Building2,
  Fingerprint,
  Wifi,
  WifiOff,
  Link,
  Unlink,
  Clock,
  Ban,
} from 'lucide-react';
import { userAPI, rolePermissionAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

const UserModal = lazy(() => import('./UserModal'));
const UserAuthorizationModal = lazy(() => import('../auth/UserAuthorizationModal'));
const ChangeRoleModal = lazy(() => import('../auth/ChangeRoleModal'));
const ConfirmationModal = lazy(() => import('../common/ConfirmationModal'));
const ImportModal = lazy(() => import('../common/ImportModal'));
const Toast = lazy(() => import('../common/Toast'));
const UserSelectionModal = lazy(() => import('../ui/UserSelectionModal'));

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

const StatusBadge = memo(({ status }) => {
  const statusMap = {
    active: 'bg-green-100 text-green-800 border border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
  };
  const color = statusMap[status] || statusMap.active;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

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

const UserRow = memo(
  ({
    user,
    index,
    canBulk,
    canUpdate,
    canDelete,
    canUpdateRole,
    isAdmin,
    selectedUsers,
    toggleUserSelection,
    openUserModal,
    handleDeleteUser,
    openAuthModal,
    openChangeRoleModal,
    getVerificationBadge,
    formatDateTime,
    formatDate,
    handleToggleUserStatus,
    togglingStatusIds,
  }) => {
    const rowBgClass = user.status === 'inactive'
      ? 'bg-red-50'
      : user.reg_link_status === 'inactive'
        ? 'bg-amber-50'
        : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
    const themeColor =
      user.theme?.colors?.primary?.['500'] ||
      user.theme?.colors?.accent?.['500'] ||
      '#cbd5e1';
    const isTogglingStatus = togglingStatusIds?.has(user.user_id) ?? false;

    return (
      <tr className={`${rowBgClass} hover:bg-gray-50 transition-colors`}>
        {canBulk && (
          <td className="px-2 py-1 whitespace-nowrap">
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.user_id)}
              onChange={() => toggleUserSelection(user.user_id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
            />
          </td>
        )}
        {/* Actions column (first visible after bulk checkbox) */}
        <td className="px-2 py-1 whitespace-nowrap text-[11px] font-medium">
          <div className="flex items-center gap-0.5">
            {/* Theme color dot */}
            <span
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: themeColor }}
              title={`Theme color: ${themeColor}`}
            />
            {/* Login status */}
            {user.logged_in_status ? (
              <Wifi className="w-3 h-3 text-green-600" />
            ) : (
              <WifiOff className="w-3 h-3 text-gray-500" />
            )}
            {user.reg_link_status === 'active' ? (
              <Link className="w-3 h-3 text-green-600" />
            ) : user.reg_link_status === 'expired' ? (
              <Ban className="w-3 h-3 text-red-500" />
            ) : user.reg_link_status === 'pending' ? (
              <Clock className="w-3 h-3 text-yellow-500" />
            ) : (
              <span className="text-[10px] text-gray-500">—</span>
            )}
            {/* Verification status */}
            {user.isVerified ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <XCircle className="w-3 h-3 text-red-500" />
            )}

            {/* Toggle user status */}
            {canUpdate && (
              <button
                onClick={() => handleToggleUserStatus(user.user_id, user.status)}
                disabled={isTogglingStatus}
                className={`p-0.5 rounded hover:bg-gray-100 transition-colors ${
                  isTogglingStatus ? 'opacity-50 cursor-wait' : ''
                }`}
                title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
              >
                {isTogglingStatus ? (
                  <Loader className="w-3 h-3 animate-spin text-gray-500" />
                ) : user.status === 'active' ? (
                  <Power className="w-3 h-3 text-green-600" />
                ) : (
                  <PowerOff className="w-3 h-3 text-red-600" />
                )}
              </button>
            )}

            {/* View */}
            <button
              onClick={() => openUserModal(user)}
              className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-100 transition-colors"
              title="View"
            >
              <Eye className="w-3 h-3" />
            </button>
            {/* Edit */}
            {canUpdate && (
              <button
                onClick={() => openUserModal(user)}
                className="text-blue-600 hover:text-blue-900 p-0.5 rounded hover:bg-blue-100 transition-colors"
                title="Edit"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
            {/* Email */}
            <button
              onClick={() => window.location.href = `mailto:${user.email}`}
              className="text-green-600 hover:text-green-900 p-0.5 rounded hover:bg-green-100 transition-colors"
              title="Email"
            >
              <Send className="w-3 h-3" />
            </button>
            {/* Admin actions */}
            {isAdmin && (
              <>
                <button
                  onClick={() => openAuthModal(user)}
                  className="text-purple-600 hover:text-purple-900 p-0.5 rounded hover:bg-purple-100 transition-colors"
                  title="Authorization"
                >
                  <Shield className="w-3 h-3" />
                </button>
                {canUpdateRole && (
                  <button
                    onClick={() => openChangeRoleModal(user)}
                    className="text-indigo-600 hover:text-indigo-900 p-0.5 rounded hover:bg-indigo-100 transition-colors"
                    title="Change Role Only"
                  >
                    <UserCog className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
            {/* Delete */}
            {canDelete && (
              <button
                onClick={() => handleDeleteUser(user.user_id)}
                className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-100 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </td>

        {/* ID */}
        <td className="px-2 py-1 whitespace-nowrap text-[11px] font-mono text-gray-500">
          #{user.user_id}
        </td>
        {/* User */}
        <td className="px-2 py-1 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-6 w-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-[9px] mr-1">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-[11px] font-medium text-gray-900">{user.full_name || 'Unknown'}</div>
              <div className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-2.5 h-2.5" />
                <span>{user.address || 'No address'}</span>
              </div>
            </div>
          </div>
        </td>
        {/* Contact */}
        <td className="px-2 py-1 whitespace-nowrap">
          <div className="text-[11px]">
            <div className="flex items-center gap-0.5">
              <Mail className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-gray-700">{user.email}</span>
            </div>
            {user.phone_number && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <Phone className="w-2.5 h-2.5 text-green-500" />
                <span className="text-green-700">{user.phone_number}</span>
              </div>
            )}
          </div>
        </td>
        {/* Details */}
        <td className="px-2 py-1 whitespace-nowrap">
          <div className="text-[11px] space-y-0.5">
            <div className="flex items-center gap-1.5">
              <User className="w-2.5 h-2.5 text-pink-500" />
              <span className="text-pink-600">Gender:</span>
              <span className="text-pink-800 font-medium">{user.gender || '—'}</span>
              <span className="text-gray-400">•</span>
              <span className="text-green-600">Age:</span>
              <span className="text-green-800 font-medium">{user.age || '—'}</span>
              <span className="text-gray-400">•</span>
              <Calendar className="w-2.5 h-2.5 text-cyan-500" />
              <span className="text-cyan-600">DOB:</span>
              <span className="text-cyan-800 font-medium">{formatDate(user.date_of_birth)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-2.5 h-2.5 text-orange-500" />
              <span className="text-orange-600">Emp:</span>
              <span className="text-orange-800 font-medium">{user.emp_id || '—'}</span>
              <span className="text-gray-400">•</span>
              <Building2 className="w-2.5 h-2.5 text-teal-500" />
              <span className="text-teal-600">Company:</span>
              <span className="text-teal-800 font-medium">{user.company || '—'}</span>
              <span className="text-gray-400">•</span>
              <Fingerprint className="w-2.5 h-2.5 text-red-500" />
              <span className="text-red-600">Adhar:</span>
              <span className="text-red-800 font-medium">{user.adhar_number || '—'}</span>
              <span className="text-gray-400">•</span>
              <BookOpen className="w-2.5 h-2.5 text-gray-500" />
              <span className="text-gray-600">Occupation:</span>
              <span className="text-gray-800 font-medium">{user.occupation || 'No occupation'}</span>
            </div>
          </div>
        </td>
        {/* Reg Type */}
        <td className="px-2 py-1 whitespace-nowrap">
          <span className="inline-flex items-center gap-0.5 text-[11px]">
            <FileText className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-gray-700">{user.reg_type || '—'}</span>
          </span>
        </td>
        {/* Role */}
        <td className="px-2 py-1 whitespace-nowrap">
          <span className="inline-flex items-center gap-0.5 text-[11px]">
            <Shield className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-gray-700">{user.role || '—'}</span>
          </span>
        </td>
        {/* Last Active */}
        <td className="px-2 py-1 whitespace-nowrap text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-gray-700">{formatDateTime(user.last_login_at || user.updatedAt)}</span>
          </div>
        </td>
        {/* Created At */}
        <td className="px-2 py-1 whitespace-nowrap text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-green-500" />
            <span className="text-green-700">{formatDateTime(user.createdAt)}</span>
          </div>
        </td>
        {/* Updated At */}
        <td className="px-2 py-1 whitespace-nowrap text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-orange-500" />
            <span className="text-orange-700">{formatDateTime(user.updatedAt)}</span>
          </div>
        </td>
        {/* Created By */}
        <td className="px-2 py-1 whitespace-nowrap text-[11px] text-gray-600">
          {user.created_by || '—'}
        </td>
        {/* Updated By */}
        <td className="px-2 py-1 whitespace-nowrap text-[11px] text-gray-600">
          {user.updated_by || '—'}
        </td>
      </tr>
    );
  }
);
UserRow.displayName = 'UserRow';

const UsersManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'user', 'A2') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'user', 'A2') || canManage, [hasPermission, canManage]);
  const canUpdateRole = useMemo(() => hasPermission('update_role', 'user', 'A2') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'user', 'A2') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'user', 'A2') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'user', 'A2') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'user', 'A2') || canManage, [hasPermission, canManage]);

  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedAuthUser, setSelectedAuthUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedRoleUser, setSelectedRoleUser] = useState(null);

  const [filterByUser, setFilterByUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    gender: 'all',
    verified: 'all',
    role: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10,
  });
  const [datePreset, setDatePreset] = useState('all');
  const debouncedSearch = useDebounce(filters.search, 300);

  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 border border-green-300' },
      { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700 border border-red-300' },
    ],
    []
  );
  const genderOptions = useMemo(
    () => [
      { value: 'all', label: 'All Genders' },
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
    []
  );
  const verifiedOptions = useMemo(
    () => [
      { value: 'all', label: 'All Verification' },
      { value: 'verified', label: 'Verified' },
      { value: 'unverified', label: 'Unverified' },
    ],
    []
  );
  const roleOptions = useMemo(
    () => [
      { value: 'all', label: 'All Roles' },
      { value: 'student', label: 'Student' },
      { value: 'instructor', label: 'Instructor' },
      { value: 'admin', label: 'Admin' },
    ],
    []
  );

  const tabs = useMemo(() => {
    const countFromServer = (status) => counts[status] ?? 0;
    return [
      { id: 'all', name: 'All Users', count: counts.total ?? totalItems, icon: Users, color: 'text-gray-600' },
      { id: 'active', name: 'Active', count: countFromServer('active'), icon: CheckCircle, color: 'text-green-600' },
      { id: 'inactive', name: 'Inactive', count: countFromServer('inactive'), icon: AlertCircle, color: 'text-red-600' },
      { id: 'verified', name: 'Verified', count: countFromServer('verified'), icon: CheckCircle2, color: 'text-blue-600' },
    ];
  }, [counts, totalItems]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (activeTab !== 'all' && activeTab !== 'verified') filterObj.status = activeTab;
      if (activeTab === 'verified') filterObj.isVerified = true;
      if (filters.gender !== 'all') filterObj.gender = filters.gender;
      if (filters.verified !== 'all') filterObj.isVerified = filters.verified === 'verified';
      if (!isAdmin) filterObj.role = 'student';
      else if (filters.role !== 'all') filterObj.role = filters.role;
      if (filterByUser && selectedUser) {
        filterObj.filterByUser = true;
        filterObj.userId = selectedUser.user_id;
      }
      if (filters.dateFrom) filterObj.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterObj.dateTo = filters.dateTo;

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        searchFields: ['full_name', 'email', 'address', 'occupation'],
        filters: filterObj,
      };

      const response = await userAPI.getAllUsers(payload);
      const data = response.data;

      if (data && data.data) {
        setUsers(data.data || []);
        setTotalItems(data.totalRecords || data.data.length);
        setTotalPages(data.totalPages || 1);
        setCounts(data.counts || {});
      } else {
        setUsers([]);
        setTotalItems(0);
        setTotalPages(1);
        setCounts({});
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
      setUsers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, activeTab, isAdmin, filterByUser, selectedUser]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const payload = { limit: 1000, sortBy: 'createdAt', sortOrder: 'DESC' };
      const filterConditions = {};
      if (!isAdmin) filterConditions.role = 'student';
      if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;
      const response = await userAPI.getAllUsers(payload);
      setAllUsers(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching all users:', err);
      setAllUsers([]);
    }
  }, [isAdmin]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await rolePermissionAPI.getAllRoles();
      setRoles(response.data || []);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchAllUsers();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevPageRef = useRef(filters.page);
  const prevLimitRef = useRef(filters.limit);
  useEffect(() => {
    if (prevPageRef.current !== filters.page || prevLimitRef.current !== filters.limit) {
      prevPageRef.current = filters.page;
      prevLimitRef.current = filters.limit;
      fetchUsers();
    }
  }, [filters.page, filters.limit, fetchUsers]);

  const handleStatusChange = useCallback((status) => {
    setActiveTab(status);
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  }, []);

  const handleGenderChange = useCallback((gender) => {
    setFilters(prev => ({ ...prev, gender, page: 1 }));
  }, []);

  const handleVerifiedChange = useCallback((verified) => {
    setFilters(prev => ({ ...prev, verified, page: 1 }));
  }, []);

  const handleRoleChange = useCallback((role) => {
    setFilters(prev => ({ ...prev, role, page: 1 }));
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  }, [totalPages]);

  const handleToggleFilterByUser = useCallback(() => {
    setFilterByUser(prev => {
      if (prev) {
        setSelectedUser(null);
        setFilters(prevFilters => ({ ...prevFilters, page: 1 }));
      }
      return !prev;
    });
  }, []);

  const handleUserSelected = useCallback((user) => {
    setSelectedUser(user);
    setFilters(prev => ({ ...prev, page: 1 }));
    setFilterByUser(true);
    setShowUserSelectionModal(false);
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
    setFilters({
      search: '', status: 'all', gender: 'all', verified: 'all', role: 'all',
      dateFrom: '', dateTo: '', page: 1, limit: 10,
    });
    setActiveTab('all');
    setDatePreset('all');
    setSelectedUser(null);
    setFilterByUser(false);
    showToast('All filters cleared', 'info');
  }, [showToast]);

  const handleRefresh = useCallback(() => {
    clearAllFilters();
    fetchUsers();
  }, [clearAllFilters, fetchUsers]);

  const handleGetData = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const hasActiveFilters = useMemo(() =>
    filters.search !== '' || activeTab !== 'all' || filters.gender !== 'all' ||
    filters.verified !== 'all' || (isAdmin && filters.role !== 'all') ||
    filters.dateFrom !== '' || filters.dateTo !== '' || filterByUser,
  [filters, activeTab, isAdmin, filterByUser]);

  const getStatusColor = useCallback((status) => {
    const found = statusOptions.find(s => s.value === status);
    return found ? found.color : statusOptions[0].color;
  }, [statusOptions]);

  const getVerificationBadge = useCallback((isVerified) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }, []);

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }, []);

  const toggleUserSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    const ids = users.map(u => u.user_id);
    setSelectedUsers(selectedUsers.length === ids.length ? [] : ids);
  }, [canBulk, users, selectedUsers]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk) { showToast('No permission', 'error'); return; }
    if (!bulkAction || selectedUsers.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission', 'error'); return; }
        showConfirmation('Delete Users', `Delete ${selectedUsers.length} user(s)?`, 'bulkDelete', async () => {
          await Promise.all(selectedUsers.map(id => userAPI.deleteUser(id)));
          setBulkAction(''); setSelectedUsers([]); fetchUsers(); fetchAllUsers();
          showToast(`Deleted ${selectedUsers.length} users`, 'success');
        });
      } else {
        if (!canUpdate) { showToast('No permission', 'error'); return; }
        await Promise.all(selectedUsers.map(id => userAPI.updateUser(id, { status: bulkAction })));
        setBulkAction(''); setSelectedUsers([]); fetchUsers(); fetchAllUsers();
        showToast(`Updated ${selectedUsers.length} users`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Bulk action failed', 'error');
    }
  }, [canBulk, bulkAction, selectedUsers, canDelete, canUpdate, fetchUsers, fetchAllUsers, showToast]);

  const handleToggleUserStatus = useCallback(async (userId, currentStatus) => {
    if (!canUpdate) { showToast('No permission', 'error'); return; }
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const userIndex = users.findIndex(u => u.user_id === userId);
    if (userIndex === -1) return;

    setUsers(prev =>
      prev.map(u => (u.user_id === userId ? { ...u, status: newStatus } : u))
    );
    setTogglingStatusIds(prev => new Set(prev).add(userId));

    try {
      await userAPI.updateUser(userId, { status: newStatus });
      showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchAllUsers();
    } catch (err) {
      setUsers(prev =>
        prev.map(u => (u.user_id === userId ? { ...u, status: currentStatus } : u))
      );
      showToast('Failed to toggle status', 'error');
      console.error(err);
    } finally {
      setTogglingStatusIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [canUpdate, users, fetchAllUsers, showToast]);

  const handleDeleteUser = useCallback((userId) => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const user = users.find(u => u.user_id === userId);
    showConfirmation('Delete User', `Delete "${user?.full_name}"?`, 'delete', async () => {
      try {
        await userAPI.deleteUser(userId);
        fetchUsers(); fetchAllUsers();
        showToast('User deleted', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete', 'error');
      }
    });
  }, [canDelete, users, fetchUsers, fetchAllUsers, showToast]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(prev => ({ ...prev, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const openUserModal = useCallback((user = null) => {
    if (user && !canUpdate) { showToast('No permission to edit', 'error'); return; }
    if (!user && !canCreate) { showToast('No permission to create', 'error'); return; }
    setEditingUser(user);
    setShowUserModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeUserModal = useCallback(() => {
    setShowUserModal(false);
    setEditingUser(null);
  }, []);

  const handleUserSaved = useCallback(() => {
    closeUserModal();
    fetchUsers();
    fetchAllUsers();
    showToast('User saved!', 'success');
  }, [closeUserModal, fetchUsers, fetchAllUsers, showToast]);

  const openAuthModal = useCallback((user) => {
    setSelectedAuthUser(user);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setSelectedAuthUser(null);
  }, []);

  const openChangeRoleModal = useCallback((user) => {
    setSelectedRoleUser(user);
    setShowChangeRoleModal(true);
  }, []);

  const handleRoleOnlySaved = useCallback(() => {
    setShowChangeRoleModal(false);
    fetchUsers();
    fetchAllUsers();
    showToast('Role updated', 'success');
  }, [fetchUsers, fetchAllUsers, showToast]);

  const generateSampleCSV = () => {
    const sampleData = [
      ['full_name', 'email', 'phone_number', 'date_of_birth', 'age', 'gender', 'occupation', 'address', 'status', 'role'],
      ['Rahul Sharma', 'rahul.sharma@example.com', '9876543210', '1995-05-15', '29', 'male', 'Software Engineer', 'Mumbai, Maharashtra', 'active', 'student'],
      ['Priya Patel', 'priya.patel@example.com', '9876543211', '1998-08-20', '26', 'female', 'Designer', 'Delhi, India', 'active', 'instructor'],
    ];
    const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_import_template.csv');
    link.click();
    URL.revokeObjectURL(url);
    showToast('Sample CSV template downloaded', 'info');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please upload a CSV file', 'error');
      return;
    }
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) throw new Error('CSV file must contain header and at least one data row');
      const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
      const requiredHeaders = ['full_name', 'email', 'phone_number', 'date_of_birth', 'age', 'gender', 'occupation', 'address', 'status', 'role'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);

      const usersToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.replace(/"/g, '').trim());
        if (values.length !== headers.length) throw new Error(`Row ${i + 1} has incorrect number of columns`);
        const userData = {};
        headers.forEach((header, index) => { userData[header] = values[index]; });
        const validatedUser = {
          full_name: userData.full_name,
          email: userData.email,
          phone_number: userData.phone_number,
          date_of_birth: userData.date_of_birth,
          age: parseInt(userData.age) || 0,
          gender: userData.gender,
          occupation: userData.occupation,
          address: userData.address,
          status: userData.status || 'active',
          role: userData.role || 'user',
          isVerified: false,
        };
        if (!validatedUser.full_name) throw new Error(`Row ${i + 1}: Full name is required`);
        if (!validatedUser.email) throw new Error(`Row ${i + 1}: Email is required`);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validatedUser.email)) throw new Error(`Row ${i + 1}: Valid email required`);
        if (!['active', 'inactive'].includes(validatedUser.status)) throw new Error(`Row ${i + 1}: Status must be active or inactive`);
        if (!['male', 'female'].includes(validatedUser.gender)) throw new Error(`Row ${i + 1}: Gender must be male or female`);
        usersToImport.push(validatedUser);
      }
      const importPromises = usersToImport.map(user => userAPI.createUser(user));
      await Promise.all(importPromises);
      showToast(`Successfully imported ${usersToImport.length} users`, 'success');
      setShowImportModal(false);
      fetchUsers();
      fetchAllUsers();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      event.target.value = '';
    }
  };

  const exportToCSV = async () => {
    if (!canExport) { showToast('No permission', 'error'); return; }
    try {
      setExportLoading(true);
      const allUsers = await fetchAllUsersForExport();
      if (!allUsers.length) { showToast('No users to export', 'error'); return; }
      const headers = [
        'User ID', 'Full Name', 'Email', 'Phone Number', 'Date of Birth', 'Age', 'Gender',
        'Occupation', 'Address', 'Status', 'Verified', 'Role', 'Registration Type', 'Created At', 'Last Login'
      ];
      const csvRows = allUsers.map(user => [
        user.user_id || '',
        `"${(user.full_name || '').replace(/"/g, '""')}"`,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        user.phone_number || '',
        user.date_of_birth || '',
        user.age || '',
        user.gender || '',
        `"${(user.occupation || '').replace(/"/g, '""')}"`,
        `"${(user.address || '').replace(/"/g, '""')}"`,
        user.status || '',
        user.isVerified ? 'Yes' : 'No',
        user.role || '',
        user.reg_type || '',
        user.createdAt ? new Date(user.createdAt).toISOString() : '',
        user.last_login_at ? new Date(user.last_login_at).toISOString() : '',
      ]);
      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = `users_export_${timestamp}`;
      if (hasActiveFilters) {
        const filterParts = [];
        if (filters.search) filterParts.push('search');
        if (filters.status !== 'all') filterParts.push(filters.status);
        if (filters.gender !== 'all') filterParts.push(filters.gender);
        if (filters.verified !== 'all') filterParts.push(filters.verified);
        if (isAdmin && filters.role !== 'all') filterParts.push(filters.role);
        if (filters.dateFrom) filterParts.push('from-' + filters.dateFrom);
        if (filters.dateTo) filterParts.push('to-' + filters.dateTo);
        if (filterByUser && selectedUser) filterParts.push('user-' + selectedUser.user_id);
        if (filterParts.length > 0) filename += `_${filterParts.join('_')}`;
      }
      filename += '.csv';
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${allUsers.length} users`, 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const fetchAllUsersForExport = useCallback(async () => {
    const payload = { limit: 1000, sortBy: 'createdAt', sortOrder: 'DESC' };
    if (debouncedSearch) {
      payload.search = debouncedSearch;
      payload.searchFields = ['full_name', 'email', 'address', 'occupation'];
    }
    const filterConditions = {};
    if (activeTab !== 'all' && activeTab !== 'verified') filterConditions.status = activeTab;
    if (activeTab === 'verified') filterConditions.isVerified = true;
    if (filters.gender !== 'all') filterConditions.gender = filters.gender;
    if (filters.verified !== 'all') filterConditions.isVerified = filters.verified === 'verified';
    if (!isAdmin) filterConditions.role = 'student';
    else if (filters.role !== 'all') filterConditions.role = filters.role;
    if (filterByUser && selectedUser) {
      filterConditions.filterByUser = true;
      filterConditions.userId = selectedUser.user_id;
    }
    if (filters.dateFrom) filterConditions.dateFrom = filters.dateFrom;
    if (filters.dateTo) filterConditions.dateTo = filters.dateTo;
    if (Object.keys(filterConditions).length > 0) payload.filters = filterConditions;
    const response = await userAPI.getAllUsers(payload);
    return response.data?.data || [];
  }, [filters, debouncedSearch, activeTab, isAdmin, filterByUser, selectedUser]);

  if (!hasPermission('view', 'user', 'A1')) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-sm text-gray-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 pt-0">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-gray-600">Manage and monitor all registered users</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          {canImport && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-2.5 h-2.5" /> Import
            </button>
          )}
          {canExport && (
            <button
              onClick={exportToCSV}
              disabled={exportLoading}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          )}

          <button
            onClick={handleToggleFilterByUser}
            className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${
              filterByUser
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-3 h-3" />
            {selectedUser ? selectedUser.full_name : 'User'}
            {filterByUser && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
          </button>
          {filterByUser && (
            <button
              onClick={() => setShowUserSelectionModal(true)}
              className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
            >
              <UserPlus className="w-3 h-3" />
              {selectedUser ? 'Change' : 'Select User'}
            </button>
          )}

          <button
            onClick={handleGetData}
            className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Get Data
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>

          <select
            value={datePreset}
            onChange={handleDatePresetChange}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="monthtodate">Month to date</option>
            <option value="previous-month">Previous month</option>
            <option value="yeartodate">Year to date</option>
            <option value="previous-year">Previous year</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28"
          />
          <select
            value={filters.limit}
            onChange={(e) => handleLimitChange(e.target.value)}
            className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>

          {canCreate && (
            <button
              onClick={() => openUserModal()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium"
            >
              <Plus className="w-2.5 h-2.5" /> Add User
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleStatusChange(tab.id)}
                    className={`px-1.5 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 ${
                      activeTab === tab.id
                        ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${activeTab === tab.id ? tab.color : ''}`} /> {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${
                      activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <select
                value={filters.gender}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
              >
                {genderOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select
                value={filters.verified}
                onChange={(e) => handleVerifiedChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
              >
                {verifiedOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              {isAdmin && (
                <select
                  value={filters.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white"
                >
                  {roleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-xs"
                />
              </div>

              {canBulk && selectedUsers.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white"
                  >
                    <option value="">Bulk Actions</option>
                    {canUpdate && (
                      <>
                        <option value="active">Activate</option>
                        <option value="inactive">Deactivate</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium"
                  >
                    Apply
                  </button>
                  <span className="text-xs text-primary-700 font-medium">{selectedUsers.length} selected</span>
                </div>
              )}
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (null) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold">Unable to Load Users</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchUsers} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">
                  Try Again
                </button>
              </div>
            </div>
          ) : users.length > 0 ? (
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && (
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                        disabled={!canBulk}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                      />
                    </th>
                  )}
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ID</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">User</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Details</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Reg Type</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Last Active</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Created At</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Updated At</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Created By</th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Updated By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, index) => (
                  <UserRow
                    key={user.user_id}
                    user={user}
                    index={index}
                    canBulk={canBulk}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    canUpdateRole={canUpdateRole}
                    isAdmin={isAdmin}
                    selectedUsers={selectedUsers}
                    toggleUserSelection={toggleUserSelection}
                    openUserModal={openUserModal}
                    handleDeleteUser={handleDeleteUser}
                    openAuthModal={openAuthModal}
                    openChangeRoleModal={openChangeRoleModal}
                    getVerificationBadge={getVerificationBadge}
                    formatDateTime={formatDateTime}
                    formatDate={formatDate}
                    handleToggleUserStatus={handleToggleUserStatus}
                    togglingStatusIds={togglingStatusIds}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium">No users found</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {hasActiveFilters ? 'No users match your search criteria.' : 'Create your first user.'}
                </p>
                {canCreate && (
                  <button
                    onClick={() => openUserModal()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add User
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span>Showing</span>
                <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                <span>to</span>
                <span className="font-medium">{Math.min(filters.page * filters.limit, totalItems)}</span>
                <span>of</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronsLeft className="w-3 h-3" />
                </button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (filters.page <= 3) pageNum = i + 1;
                  else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = filters.page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-6 h-6 text-xs rounded border transition-colors ${
                        filters.page === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronsRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showUserModal && (
          <UserModal
            show={showUserModal}
            user={editingUser}
            onClose={closeUserModal}
            onSaved={handleUserSaved}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleFileUpload}
            moduleName="users"
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showUserSelectionModal && (
          <UserSelectionModal
            show={showUserSelectionModal}
            onClose={() => setShowUserSelectionModal(false)}
            onSelect={handleUserSelected}
            selectedUserId={selectedUser?.user_id}
          />
        )}
      </Suspense>

      {isAdmin && (
        <>
          <Suspense fallback={null}>
            {showAuthModal && (
              <UserAuthorizationModal
                show={showAuthModal}
                user={selectedAuthUser}
                onClose={closeAuthModal}
                onSaved={() => showToast('User permissions updated', 'success')}
              />
            )}
          </Suspense>
          {canUpdateRole && (
            <Suspense fallback={null}>
              {showChangeRoleModal && (
                <ChangeRoleModal
                  isOpen={showChangeRoleModal}
                  user={selectedRoleUser}
                  roles={roles}
                  onClose={() => setShowChangeRoleModal(false)}
                  onSaved={handleRoleOnlySaved}
                />
              )}
            </Suspense>
          )}
        </>
      )}

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

export default UsersManagement;