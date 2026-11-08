import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStockPoint } from '../context/StockPointContext';
import logo from '../assets/MaPrimsTechLogo-M.png';
import {
  TbBellRinging2Filled,
  TbChartLine,
  TbClipboard,
  TbFileReport,
  TbFolder,
  TbInfoCircle,
  TbServer,
  TbBriefcase,
  TbFileDescription,
  TbAward,
  TbGridDots,
  TbChartBar,
  TbTrendingUp,
  TbUsersGroup,
  TbMail,
  TbPhoneCall,
  TbMenu2,
  TbX,
  TbHome,
  TbBook,
  TbUsers,
  TbCreditCard,
  TbMessageCircle,
  TbSettings,
  TbUser,
  TbLogout,
  TbSearch,
  TbChevronDown,
  TbHelp,
  TbLifebuoy,
  TbVideo,
  TbCertificate,
  TbExternalLink,
  TbCpu,
  TbBuildingStore,
} from 'react-icons/tb';
import { MessageCircle, Newspaper, FileUser } from 'lucide-react';
import { useNotificationHandler } from '../context/useNotificationHandler';
import { rolePermissionAPI } from '../services/api';

const FeedbackModal = lazy(() => import('../components/dashboard/FeedbackModal'));
const ChatWidget = lazy(() => import('../components/dashboard/ChatWidget'));
const SubHeader = lazy(() => import('./SubHeader'));

const resourceIconMap = {
  dashboard: TbHome,
  course: TbBook,
  user: TbUsers,
  payment: TbCreditCard,
  feedback: TbMessageCircle,
  report: TbFileReport,
  analytics: TbChartLine,
  certificate: TbCertificate,
  'demo-request': TbVideo,
  contact: TbPhoneCall,
  assignment: TbClipboard,
  'file-explorer': TbFolder,
  system_settings: TbServer,
  profile: TbUser,
  settings: TbSettings,
  'support-ticket': TbInfoCircle,
  help: TbHelp,
  communication: MessageCircle,
  services: TbBriefcase,
  proposals: TbFileDescription,
  blogs: Newspaper,
  testimonials: TbAward,
  hr_dashboard: TbChartBar,
  human_resources: TbUsersGroup,
  equipment: TbCpu,
  progress: TbTrendingUp,
  mail: TbMail,
  store: TbBuildingStore,
  default: TbFolder,
};

const formatDisplayName = (str) => {
  if (!str) return '';
  return str.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const getIconForPermission = (permission) => {
  const resourceType = permission.resource_type?.toLowerCase();
  const name = permission.name?.toLowerCase();
  return resourceIconMap[resourceType] || resourceIconMap[name] || resourceIconMap.default;
};

const buildNavigationItems = (permissions) => {
  if (!Array.isArray(permissions)) return [];
  return permissions
    .filter((p) => p.url && p.action_type === 'view')
    .map((p) => {
      const childCount = p.children?.filter(c => c.url && c.action_type === 'view').length || 0;
      return {
        name: formatDisplayName(p.name),
        href: p.url,
        icon: getIconForPermission(p),
        exact: p.url === '/dashboard' ? true : undefined,
        childCount,
        children: p.children ? buildNavigationItems(p.children) : undefined,
      };
    });
};

const getStockPointDisplay = (sp) => {
  if (!sp || typeof sp !== 'object') return { name: '', code: '' };
  const name = sp.name ?? sp.stock_point_name ?? sp.stockPointName ?? '';
  const code = sp.code ?? sp.stock_point_code ?? sp.stockPointCode ?? '';
  return { name, code };
};

const ModuleCard = React.memo(({ module }) => {
  const Icon = module.icon;
  const childCount = module.childCount || 0;
  return (
    <Link
      to={module.href}
      className="relative flex flex-col items-center justify-center p-1 sm:p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-300 hover:scale-105 transition-all duration-200 group"
    >
      {childCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-3 h-3 text-[7px] font-semibold text-white bg-primary-500 rounded-full shadow-sm">
          {childCount}
        </span>
      )}
      <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">
        <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
      </div>
      <span className="mt-0.5 text-[7px] sm:text-[8px] font-medium text-gray-700 text-center group-hover:text-primary-700 leading-tight truncate max-w-full">
        {module.name}
      </span>
    </Link>
  );
});
ModuleCard.displayName = 'ModuleCard';

export const ModuleGrid = ({ permissions }) => {
  const modules = useMemo(() => buildNavigationItems(permissions || []), [permissions]);

  if (modules.length === 0) {
    return <p className="text-gray-500 text-center py-6 text-xs">No modules available.</p>;
  }

  return (
    <div className="w-full px-1 sm:px-2">
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 3xl:grid-cols-14 gap-0.5 sm:gap-1">
        {modules.map((module) => (
          <ModuleCard key={module.name} module={module} />
        ))}
      </div>
    </div>
  );
};

class LayoutErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Layout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Layout Error</h3>
            <p className="text-gray-600 text-sm mb-3">Something went wrong with the layout. Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors text-sm">Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MobileSidebar = React.memo(({ isOpen, onClose, navigationItems, userRole, userData, currentPath, onLogout, onOpenFeedback }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex z-50 lg:hidden">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-in-out duration-300" onClick={onClose} aria-hidden="true" />
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl transform transition ease-in-out duration-300 translate-x-0">
        <div className="absolute top-0 right-0 -mr-10 pt-1">
          <button type="button" className="ml-1 flex items-center justify-center h-7 w-7 rounded-full focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white" onClick={onClose} aria-label="Close sidebar">
            <TbX className="h-3.5 w-3.5 text-white" />
          </button>
        </div>

        <div className="flex-1 h-0 pt-3 pb-3 overflow-y-auto">
          <div className="flex-shrink-0 px-2 py-3 bg-white border-b border-gray-100">
            <Link to="/dashboard" aria-label="MaPrims - Return to dashboard" className="flex items-center space-x-3 p-1 group" onClick={onClose}>
              <div className="flex items-center justify-center overflow-hidden">
                <img src={logo} alt="MaPrims Logo" className="h-8 w-auto object-contain" />
              </div>
              <div className="flex flex-col leading-tight">
                <h1 className="text-sm font-bold text-[#0077C8] md:text-base">
                  MaPrims
                </h1>
                <p className="text-[9px] text-[#002B5C] font-semibold tracking-wider">
                  innovate ★ build ★ grow
                </p>
                <p className="text-[8px] font-medium text-[#0077C8] mt-0.5 flex items-center">
                  <svg className="w-2 h-2 mr-1 text-[#0077C8]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span className="capitalize">{userRole}</span> Portal
                </p>
              </div>
            </Link>
          </div>

          <div className="py-3">
            <nav className="px-2 space-y-0.5" aria-label="Sidebar navigation">
              {navigationItems.map((item) => {
                const isActive = item.exact ? currentPath === item.href : currentPath.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-1.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className={`mr-1.5 flex-shrink-0 h-3.5 w-3.5 transition-colors ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 px-2">
              <button onClick={() => { onOpenFeedback(); onClose(); }} className="w-full flex items-center justify-center px-2 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm">
                <TbMessageCircle className="w-3.5 h-3.5 mr-1.5" /> Submit Feedback
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex border-t border-gray-200 p-2 bg-white">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0">
              <div className="w-7 h-7 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px]">
                {userData?.full_name?.charAt(0) || userData?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-1.5 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{userData?.full_name || userData?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 truncate capitalize">{userRole} • {userData?.email}</p>
            </div>
            <button onClick={onLogout} className="ml-1 flex-shrink-0 p-1 text-gray-400 hover:text-gray-500 transition-colors rounded hover:bg-gray-100" title="Logout" aria-label="Logout">
              <TbLogout className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
MobileSidebar.displayName = 'MobileSidebar';

const DesktopSidebar = React.memo(({ navigationItems, userRole, userData, currentPath, onLogout, onOpenFeedback, collapsed }) => {
  return (
    <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-14' : 'w-56'}`}>
      <div className="flex flex-col w-full border-r border-gray-200 bg-white">
        <div className="flex-shrink-0 px-3 py-4 bg-white border-b border-gray-100">
          <Link to="/dashboard" aria-label="MaPrims - Return to dashboard" className={`flex items-center space-x-3 p-1 group ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center justify-center overflow-hidden">
              <img src={logo} alt="MaPrims Logo" className="h-10 w-auto object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <h1 className="text-sm font-bold text-[#0077C8] md:text-base">
                  MaPrims
                </h1>
                <p className="text-[9px] text-[#002B5C] font-semibold tracking-wider">
                  innovate ★ build ★ grow
                </p>
                <p className="text-[8px] font-medium text-[#0077C8] mt-0.5 flex items-center">
                  <svg className="w-2 h-2 mr-1 text-[#0077C8]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span className="capitalize">{userRole}</span> Portal
                </p>
              </div>
            )}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="py-3">
            <nav className="px-2 space-y-0.5" aria-label="Sidebar navigation">
              {navigationItems.map((item) => {
                const isActive = item.exact ? currentPath === item.href : currentPath.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-1.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500 shadow-xs' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-xs'} ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.name : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className={`flex-shrink-0 h-3.5 w-3.5 transition-colors ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {!collapsed && (
                      <>
                        <span className="ml-1.5">{item.name}</span>
                        {isActive && <div className="ml-auto w-1 h-1 bg-primary-500 rounded-full animate-pulse" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>

            {!collapsed ? (
              <div className="mt-3 px-2">
                <button onClick={onOpenFeedback} className="w-full flex items-center justify-center px-2 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm">
                  <TbMessageCircle className="w-3.5 h-3.5 mr-1.5" /> Submit Feedback
                </button>
              </div>
            ) : (
              <div className="mt-3 px-2 flex justify-center">
                <button onClick={onOpenFeedback} className="p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 shadow-sm" title="Submit Feedback">
                  <TbMessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={`flex-shrink-0 flex border-t border-gray-200 p-2 bg-white ${collapsed ? 'justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'w-full'}`}>
            <div className="flex-shrink-0">
              <div className="w-7 h-7 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px]">
                {userData?.full_name?.charAt(0) || userData?.name?.charAt(0) || 'U'}
              </div>
            </div>
            {!collapsed && (
              <>
                <div className="ml-1.5 flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{userData?.full_name || userData?.name || 'User'}</p>
                  <p className="text-[10px] text-gray-500 truncate capitalize">{userRole}</p>
                </div>
                <button onClick={onLogout} className="ml-1 flex-shrink-0 p-1 text-gray-400 hover:text-gray-500 transition-colors rounded hover:bg-gray-100" title="Logout" aria-label="Logout">
                  <TbLogout className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {collapsed && (
              <button onClick={onLogout} className="ml-0 mt-1 flex-shrink-0 p-1 text-gray-400 hover:text-gray-500 transition-colors rounded hover:bg-gray-100" title="Logout" aria-label="Logout">
                <TbLogout className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
DesktopSidebar.displayName = 'DesktopSidebar';

const NotificationItem = React.memo(({ notification, markAsRead, formatNotificationTime }) => {
  return (
    <div className={`p-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-900">{notification.title}</p>
          <p className="text-[11px] text-gray-600 mt-0.5">{notification.message}</p>
          <p className="text-[9px] text-gray-400 mt-0.5">{formatNotificationTime(notification.created_at)}</p>
        </div>
        {!notification.is_read && (
          <button onClick={() => markAsRead(notification.notification_id)} className="ml-1.5 text-[11px] text-primary-600 hover:text-primary-800">Mark read</button>
        )}
      </div>
      {notification.meta?.link && (
        <Link to={notification.meta.link} className="text-[11px] text-primary-600 hover:underline mt-0.5 inline-block">View details →</Link>
      )}
    </div>
  );
});

function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Header = React.memo(({
  onMenuClick,
  userData,
  userRole,
  onLogout,
  onOpenFeedback,
  onToggleSidebar,
  sidebarCollapsed,
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  clearAll,
  stockPoint,
  onChangeStockPoint,
  showStockPoint,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown-container')) setShowUserDropdown(false);
      if (showNotifications && !event.target.closest('.notifications-container')) setShowNotifications(false);
      if (showSearchResults &&
        !searchRef.current?.contains(event.target) &&
        !resultsRef.current?.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown, showNotifications, showSearchResults]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const res = await rolePermissionAPI.getPermissionList(debouncedSearch);
        if (res.data?.success) {
          setSearchResults(res.data.data || []);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Module search failed:', err);
        setSearchResults([]);
        setShowSearchResults(true);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedSearch]);

  const handleResultClick = useCallback((url) => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigate(url);
  }, [navigate]);

  const handleOpenInNewTab = useCallback((url) => {
    window.open(url, '_blank');
    setShowSearchResults(false);
    setSearchQuery('');
  }, []);

  const getCurrentPageTitle = useCallback(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1) : 'Dashboard';
  }, [location.pathname]);

  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const currentPageTitle = getCurrentPageTitle();

  const stockPointDisplay = useMemo(
    () => getStockPointDisplay(stockPoint),
    [stockPoint]
  );

  const handleDashboardClick = () => navigate('/dashboard');
  const handleFeedbackClick = () => {
    setShowUserDropdown(false);
    onOpenFeedback();
  };

  const formatNotificationTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }, []);

  if (isSearchVisible) {
    return (
      <div className="relative z-10 flex-shrink-0 flex h-14 bg-white border-b border-gray-100">
        <div className="flex-1 flex items-center px-4 sm:px-6">
          <div className="flex-1 flex items-center" ref={searchRef}>
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Search modules..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:outline-none"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition" aria-label="Search">
                <TbSearch className="w-4 h-4 text-gray-500" />
              </button>
              {showSearchResults && (
                <div ref={resultsRef} className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No modules found</div>
                  ) : (
                    searchResults.map((mod) => (
                      <div key={mod.name + mod.url} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                        <button
                          onClick={() => handleResultClick(mod.url)}
                          className="flex-1 text-left text-sm text-gray-700"
                        >
                          {mod.name}
                        </button>
                        <button
                          onClick={() => handleOpenInNewTab(mod.url)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Open in new tab"
                        >
                          <TbExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => { setIsSearchVisible(false); setSearchQuery(''); setShowSearchResults(false); }} className="ml-3 text-sm font-medium text-primary-600 hover:text-primary-700">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex-shrink-0 flex h-14 bg-white border-b border-gray-100">
      <button type="button" className="px-3 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-500 lg:hidden" onClick={onMenuClick} aria-label="Open sidebar">
        <TbMenu2 className="h-5 w-5" />
      </button>

      <button type="button" className="hidden lg:flex px-2 text-gray-500 items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
        onClick={() => navigate('/dashboard/modules')}
        aria-label="View all modules"
        title="All Modules"
      >
        <TbGridDots className="w-5 h-5" />
      </button>

      <button
        type="button"
        className="hidden lg:flex px-2 text-gray-500 items-center justify-center" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 px-3 flex justify-between sm:px-4 lg:px-6">
        {/* Title + stock point (side by side) */}
        <div className="flex-1 flex items-center min-w-0 gap-3">
          <h1 className="text-base font-bold text-gray-900 truncate">
            {currentPageTitle}
          </h1>

          {showStockPoint && stockPoint && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100 shrink-0">
              <TbBuildingStore className="w-4 h-4 shrink-0" />
              <span
                className="truncate max-w-[120px] md:max-w-[160px] lg:max-w-[200px]"
                title={stockPointDisplay.name || stockPointDisplay.code || 'Stock Point'}
              >
                {stockPointDisplay.name || stockPointDisplay.code || 'Stock Point'}
              </span>
              {stockPointDisplay.code && (
                <span className="text-primary-500/70">({stockPointDisplay.code})</span>
              )}
              <button
                type="button"
                onClick={onChangeStockPoint}
                className="ml-1 p-0.5 rounded hover:bg-primary-100 text-primary-500 hover:text-primary-700 transition-colors"
                title="Change stock point"
                aria-label="Change stock point"
              >
                <TbX className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="flex items-center space-x-1.5 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium tabular-nums">{formattedTime}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5 hidden lg:block">{formattedDate}</div>
          </div>

          <button onClick={onOpenFeedback} className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-md font-medium transition text-sm">
            <TbMessageCircle className="w-4 h-4" />
          </button>

          <button onClick={handleDashboardClick} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Go to dashboard">
            <TbHome className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center">
            <div className="hidden md:block relative" ref={searchRef}>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 lg:w-40 xl:w-56 px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:outline-none"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition" aria-label="Search">
                  <TbSearch className="w-4 h-4 text-gray-500" />
                </button>
                {showSearchResults && (
                  <div ref={resultsRef} className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
                    {isSearching ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No modules found</div>
                    ) : (
                      searchResults.map((mod) => (
                        <div key={mod.name + mod.url} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                          <button
                            onClick={() => handleResultClick(mod.url)}
                            className="flex-1 text-left text-sm text-gray-700"
                          >
                            {mod.name}
                          </button>
                          <button
                            onClick={() => handleOpenInNewTab(mod.url)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Open in new tab"
                          >
                            <TbExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setIsSearchVisible(true)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Search">
              <TbSearch className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="relative notifications-container">
            <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
              <TbBellRinging2Filled className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <div className="flex gap-2">
                      <button onClick={() => { markAllAsRead(); setShowNotifications(false); }} className="text-xs text-primary-600 hover:text-primary-800">Mark all read</button>
                      <button onClick={() => { clearAll(); setShowNotifications(false); }} className="text-xs text-red-600 hover:text-red-800">Clear all</button>
                    </div>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <NotificationItem key={notification.notification_id} notification={notification} markAsRead={markAsRead} formatNotificationTime={formatNotificationTime} />
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-100 text-center">
                    <Link to="/dashboard/notifications" className="text-xs text-primary-600 hover:text-primary-800" onClick={() => setShowNotifications(false)}>View all notifications</Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative user-dropdown-container">
            <button className="flex items-center space-x-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1 rounded-lg p-1.5 hover:bg-gray-100 transition-colors" onClick={() => setShowUserDropdown(!showUserDropdown)} aria-expanded={showUserDropdown} aria-haspopup="true">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                  {userData?.full_name?.charAt(0) || userData?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="font-medium text-gray-900 text-xs sm:text-sm">{userData?.full_name || userData?.name || 'User'}</p>
                  <p className="text-[11px] text-gray-500 capitalize">{userRole}</p>
                </div>
              </div>
              <TbChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showUserDropdown && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-scale-in">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{userData?.full_name || userData?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
                  </div>

                  <Link to="/dashboard/profile" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowUserDropdown(false)} role="menuitem">
                    <TbUser className="w-4 h-4 mr-2" /> Your Profile
                  </Link>

                  <Link to="/dashboard/settings" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowUserDropdown(false)} role="menuitem">
                    <TbSettings className="w-4 h-4 mr-2" /> Settings
                  </Link>

                  <button onClick={handleFeedbackClick} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
                    <TbMessageCircle className="w-4 h-4 mr-2" /> Submit Feedback
                  </button>

                  <Link to="/dashboard/support" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowUserDropdown(false)} role="menuitem">
                    <TbLifebuoy className="w-4 h-4 mr-2" /> Help & Support
                  </Link>

                  <div className="border-t border-gray-100"></div>

                  <button onClick={() => { setShowUserDropdown(false); onLogout(); }} className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors" role="menuitem">
                    <TbLogout className="w-4 h-4 mr-2" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
Header.displayName = 'Header';

const DashboardLayout = ({ children, userRole: propUserRole, userData: propUserData, sidebarCollapsed, onToggleSidebar }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationHandler();

  const { stockPoint, clearStockPoint } = useStockPoint();

  const isStoreRoute = /(^|\/)store(\/|$)/.test(location.pathname);

  const userData = useMemo(() => propUserData || authUser.user, [propUserData, authUser]);
  const userRole = useMemo(() => propUserRole || authUser.user?.role || 'student', [propUserRole, authUser.user]);
  const userPermissions = useMemo(() => authUser?.hasPermission || [], [authUser]);

  const navigationItems = useMemo(() => buildNavigationItems(userPermissions), [userPermissions]);

  const getBreadcrumbItems = useCallback((navItems, pathname) => {
    const findPath = (items, currentPath, ancestors = []) => {
      for (const item of items) {
        if (pathname.startsWith(item.href) && item.href !== '/dashboard') {
          const newAncestors = [...ancestors, { name: item.name, href: item.href }];
          if (item.children && item.children.length > 0) {
            const childMatch = findPath(item.children, pathname, newAncestors);
            if (childMatch) return childMatch;
          }
          return newAncestors;
        }
      }
      return null;
    };
    return findPath(navItems, pathname) || [];
  }, []);

  const breadcrumbItems = useMemo(
    () => getBreadcrumbItems(navigationItems, location.pathname),
    [navigationItems, location.pathname, getBreadcrumbItems]
  );

  const activeModule = useMemo(() => {
    if (!navigationItems || !location.pathname) return null;
    return navigationItems.find(
      (item) =>
        item.href !== '/dashboard' &&
        location.pathname.startsWith(item.href)
    );
  }, [navigationItems, location.pathname]);

  const subHeaderItems = activeModule?.children || [];

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login', { replace: true, state: { message: 'You have been successfully logged out.', timestamp: Date.now() } });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const handleOpenFeedback = useCallback(() => setFeedbackModalOpen(true), []);
  const handleCloseFeedback = useCallback(() => setFeedbackModalOpen(false), []);
  const handleFeedbackSaved = useCallback(() => setFeedbackModalOpen(false), []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <LayoutErrorBoundary>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        <MobileSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          navigationItems={navigationItems}
          userRole={userRole}
          userData={userData}
          currentPath={location.pathname}
          onLogout={handleLogout}
          onOpenFeedback={handleOpenFeedback}
        />

        <DesktopSidebar
          navigationItems={navigationItems}
          userRole={userRole}
          userData={userData}
          currentPath={location.pathname}
          onLogout={handleLogout}
          onOpenFeedback={handleOpenFeedback}
          collapsed={sidebarCollapsed}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            userData={userData}
            userRole={userRole}
            onLogout={handleLogout}
            onOpenFeedback={handleOpenFeedback}
            onToggleSidebar={onToggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            notifications={notifications}
            unreadCount={unreadCount}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            clearAll={clearAll}
            stockPoint={stockPoint}
            onChangeStockPoint={clearStockPoint}
            showStockPoint={isStoreRoute && Boolean(stockPoint)}
          />

          <main className="flex-1 min-h-0 flex flex-col bg-gray-50 focus:outline-none" id="main-content">
            {subHeaderItems.length > 0 && breadcrumbItems.length > 1 && (
              <Suspense fallback={null}>
                <SubHeader
                  items={subHeaderItems}
                  currentPath={location.pathname}
                  breadcrumbItems={breadcrumbItems}
                />
              </Suspense>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="py-4 h-full">
                <div className="max-w-10xl mx-auto px-4 sm:px-6 h-full">
                  {children}
                </div>
              </div>
            </div>
          </main>

          <footer className="flex-shrink-0 bg-white border-t border-gray-200 py-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
                <div className="text-xs text-gray-600">© {new Date().getFullYear()} MaPrims — Powered by Innovation & Excellence.</div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
                  <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>System Online</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>

        <Suspense fallback={null}>
          <FeedbackModal show={feedbackModalOpen} feedback={null} onClose={handleCloseFeedback} onSaved={handleFeedbackSaved} isAdmin={userRole === 'admin'} />
        </Suspense>

        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>

        {sidebarOpen && <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      </div>
    </LayoutErrorBoundary>
  );
};

export default React.memo(DashboardLayout);