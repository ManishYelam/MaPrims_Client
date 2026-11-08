import React, { memo, useCallback, useMemo, useState, } from 'react';
import { Navigate, Route, Routes, useLocation, } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getComponentByElement } from '../../context/dashboardComponents';
import { buildRoutesFromPermissions } from '../../context/permissionRBACRoutes';
import DashboardLayout, { ModuleGrid } from '../../layouts/DashboardLayout';
import { AsyncComponent } from '../../components/common/AsyncComponent';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { ErrorFallback } from '../../components/common/ErrorFallback';
import { NetworkStatus } from '../../components/common/NetworkStatus';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const componentCache = new Map();

const getCachedComponent = (componentName) => {
  if (!componentCache.has(componentName)) {
    componentCache.set(componentName, getComponentByElement(componentName));
  }
  return componentCache.get(componentName);
};

const roleDashboardMap = {
  super_admin: getCachedComponent('AdminDashboard'),
  admin: getCachedComponent('AdminDashboard'),
  hr: getCachedComponent('HRDashboard'),
  student: getCachedComponent('StudentDashboard'),
  instructor: getCachedComponent('InstructorDashboard'),
  default: getCachedComponent('DefaultDashboard'),
};

const Dashboard = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const { error, clearError } = useErrorHandler();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const userData = user?.user;
  const userRole = user?.user?.role;
  const permissions = useMemo(() => user?.hasPermission ?? [], [user?.hasPermission]);

  const redirectState = useMemo(() => ({
    from: location,
    message: 'Please login to access the dashboard',
    timestamp: Date.now(),
  }),
    [location]
  );

  const DashboardComponent = useMemo(() => roleDashboardMap[userRole] || roleDashboardMap.default, [userRole]);

  const dynamicRoutes = useMemo(() => {
    const routeDefs = buildRoutesFromPermissions(permissions);
    return routeDefs.map((route) => ({
      key: route.permissionId,
      path: route.path,
      Component: getCachedComponent(route.elementName),
    }));
  }, [permissions]);

  if (authLoading) return null;

  if (!isAuthenticated || !user) {
    return (<Navigate replace to="/login" state={redirectState} />);
  }

  if (!userRole) {
    return (
      <ErrorFallback
        error={{ message: 'Unable to determine user role. Please contact support.', }}
        resetError={() => window.location.reload()}
      />
    );
  }

  if (!DashboardComponent) return null;

  if (error) {
    return (
      <ErrorFallback error={error} resetError={clearError} showDetails={process.env.NODE_ENV === 'development'} />
    );
  }

  return (
    <>
      <NetworkStatus onReconnect={() => console.log('Network reconnected')} />
      <DashboardLayout userRole={userRole} userData={userData} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} >
        <AsyncComponent fallback={null}>
          <Routes>
            <Route index element={<DashboardComponent sidebarCollapsed={sidebarCollapsed} />} />
            <Route path="modules" element={<ModuleGrid permissions={permissions} />} />
            {dynamicRoutes.map(({ key, path, Component }) => (
              <Route key={key} path={path} element={<Component sidebarCollapsed={sidebarCollapsed} />} />
            ))}
            <Route path="*" element={<Navigate replace to="/dashboard" />} />
          </Routes>
        </AsyncComponent>
      </DashboardLayout>
    </>
  );
};

const DashboardWithErrorBoundary = (props) => (
  <ErrorBoundary>
    <Dashboard {...props} />
  </ErrorBoundary>
);

DashboardWithErrorBoundary.displayName = 'DashboardWithErrorBoundary';

export default memo(DashboardWithErrorBoundary);