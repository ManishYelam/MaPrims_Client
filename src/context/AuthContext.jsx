import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const clearAuthStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('hasPermission');
};

const isTokenExpired = (token) => {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const ACTIVE_TABS_KEY = 'activeTabs';
const LOGOUT_EVENT_KEY = 'logoutEvent';

const getActiveTabs = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_TABS_KEY)) || [];
  } catch {
    return [];
  }
};

const addActiveTab = (tabId) => {
  const tabs = getActiveTabs();
  if (!tabs.includes(tabId)) {
    tabs.push(tabId);
    localStorage.setItem(ACTIVE_TABS_KEY, JSON.stringify(tabs));
  }
};

const removeActiveTab = (tabId) => {
  const tabs = getActiveTabs().filter(id => id !== tabId);
  localStorage.setItem(ACTIVE_TABS_KEY, JSON.stringify(tabs));
  return tabs;
};

const getTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

let logoutChannel = null;
if ('BroadcastChannel' in window) {
  logoutChannel = new BroadcastChannel('auth_logout');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isManualLogoutRef = useRef(false);
  const tabIdRef = useRef(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);

        if (!isTokenExpired(token)) {
          setUser({
            ...parsedUser,
            token,
          });
        } else {
          clearAuthStorage();
        }
      }
    } catch {
      clearAuthStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleLogoutMessage = () => {
      setUser(null);
      clearAuthStorage();

      window.close();

      setTimeout(() => {
        if (!window.closed) {
          window.location.href = '/login';
        }
      }, 100);
    };

    if (logoutChannel) {
      logoutChannel.onmessage = handleLogoutMessage;
    } else {
      window.addEventListener('storage', (e) => {
        if (e.key === LOGOUT_EVENT_KEY && e.newValue) {
          handleLogoutMessage();
        }
      });
    }

    return () => {
      if (logoutChannel) {
        logoutChannel.onmessage = null;
      } else {
        window.removeEventListener('storage', handleLogoutMessage);
      }
    };
  }, []);

  useEffect(() => {
    const tabId = getTabId();
    tabIdRef.current = tabId;
    addActiveTab(tabId);

    const handleBeforeUnload = () => {
      if (isManualLogoutRef.current) return;

      removeActiveTab(tabId);
      const remainingTabs = getActiveTabs();

      if (remainingTabs.length === 0) {
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
          setTimeout(async () => {
            if (getActiveTabs().length === 0) {
              try {
                await authAPI.logout();
              } catch (error) {
                // silently ignore
              }
            }
          }, 500);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removeActiveTab(tabId);
    };
  }, []);

  const logout = useCallback(async () => {
    isManualLogoutRef.current = true;

    try {
      await authAPI.logout();
    } catch (error) {
      if (error.response?.status !== 401) {
        console.warn('Logout API call failed:', error.response?.status || error.message);
      }
    } finally {
      setUser(null);
      clearAuthStorage();

      if (logoutChannel) {
        logoutChannel.postMessage('logout');
      } else {
        localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
        localStorage.removeItem(LOGOUT_EVENT_KEY);
      }
    }
  }, []);

  const login = useCallback((success, userData, token, permissions) => {
    const userWithToken = { success, user: userData, token, hasPermission: permissions };
    setUser(userWithToken);
    localStorage.setItem('user', JSON.stringify(userWithToken));
    localStorage.setItem('token', token);
    localStorage.setItem('hasPermission', JSON.stringify(permissions));
    isManualLogoutRef.current = false;
  }, []);

  const updateUser = useCallback(
    (updatedUserData) => {
      setUser((prevUser) => {
        const updatedUser = { ...prevUser, ...updatedUserData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      });
    },
    []
  );

  const permissionSet = useMemo(() => {
    return new Set(user?.user?.permissions || []);
  }, [user]);

  const hasPermission = useCallback(
    (permission) => permissionSet.has(permission),
    [permissionSet]
  );

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      updateUser,
      loading,
      hasPermission,
      isAuthenticated: !!user,
    }),
    [
      user,
      login,
      logout,
      updateUser,
      loading,
      hasPermission,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};