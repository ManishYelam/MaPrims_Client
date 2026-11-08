import React, { useState, useEffect, useCallback, useRef, useContext, useMemo } from 'react';
import { ChevronLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { applicationAPI } from '../../services/api';
import General from '../SystemSettings/tabs/General';
import Email from '../SystemSettings/tabs/Email';
import Razorpay from '../SystemSettings/tabs/Razorpay';
import WhatsApp from '../SystemSettings/tabs/Whatsapp';
import GoogleMeet from '../SystemSettings/tabs/GoogleMeet';
import ConfirmationModal from '../SystemSettings/components/ConfirmationModal';
import useConfigManagement from '../SystemSettings/hooks/useConfigManagement';
import BranchManagement from '../SystemSettings/tabs/BranchManagement';
import RolePermissionManager from '../SystemSettings/tabs/RolePermissionManager';
import SystemMapping from '../SystemSettings/tabs/SystemMapping';
import LOV from '../SystemSettings/tabs/Lov';
import Advanced from '../SystemSettings/tabs/Advanced';
import OrganizationManagement from '../SystemSettings/tabs/OrganizationManagement';
import { AuthContext } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

const SystemSettings = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState({
    site_title: 'Learn SAP ABAP',
    site_description: 'Master SAP ABAP programming with expert-led courses',
    contact_email: 'support@shirsattechhub.cloud',
  });

  const canViewGeneral = useMemo(
    () => hasPermission('view:genral', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewEmail = useMemo(
    () => hasPermission('view:email', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewRazorpay = useMemo(
    () => hasPermission('view:razorpay', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewWhatsApp = useMemo(
    () => hasPermission('view:whatsapp', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewGoogleMeet = useMemo(
    () => hasPermission('view:meet', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewBranches = useMemo(
    () => hasPermission('view:branches', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewLOV = useMemo(
    () => hasPermission('view:lovs', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewRoles = useMemo(
    () => hasPermission('view:role_permissions', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewMapping = useMemo(
    () => hasPermission('view:sys_map', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewOrganization = useMemo(
    () => hasPermission('view:org', 'system_settings', 'A2'),
    [hasPermission]
  );
  const canViewAdvanced = useMemo(
    () => hasPermission('view:adv', 'system_settings', 'A2'),
    [hasPermission]
  );

  const allTabs = [
    { id: 'general', name: 'General', icon: '⚙️', canView: canViewGeneral },
    { id: 'email', name: 'Email', icon: '📧', canView: canViewEmail },
    { id: 'razorpay', name: 'Razorpay', icon: '💳', canView: canViewRazorpay },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', canView: canViewWhatsApp },
    { id: 'googlemeet', name: 'Google Meet', icon: '🎥', canView: canViewGoogleMeet },
    { id: 'branches', name: 'Branches', icon: '🏪', canView: canViewBranches },
    { id: 'lovs', name: 'List of Values', icon: '📋', canView: canViewLOV },
    { id: 'roles', name: 'Access Control', icon: '👥', canView: canViewRoles },
    { id: 'mapping', name: 'Sys. Mapping', icon: '🔗', canView: canViewMapping },
    { id: 'organization', name: 'Organization Management', icon: '🏢', canView: canViewOrganization },
    { id: 'advanced', name: 'Advanced', icon: '🔧', canView: canViewAdvanced },
  ];

  // Filter only the tabs the user can see
  const visibleTabs = useMemo(() => allTabs.filter(tab => tab.canView), [allTabs]);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  const showConfirmation = useCallback((title, message, type, onConfirm, data = null) => {
    setConfirmationModal({ show: true, title, message, type, onConfirm, data });
  }, []);

  // Configuration managers (lazy load)
  const emailManager = useConfigManagement('app_email', [], { autoLoad: false, showMessage });
  const razorpayManager = useConfigManagement('app_rzp', [], { autoLoad: false, showMessage });
  const whatsappManager = useConfigManagement('app_whatsapp', [], { autoLoad: false, showMessage });
  const googleMeetManager = useConfigManagement('app_google_meet', [], { autoLoad: false, showMessage });
  const uploadPathManager = useConfigManagement('app_upload_path', [], { autoLoad: false, showMessage });

  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    title: '',
    message: '',
    type: '',
    onConfirm: null,
    data: null,
  });

  const hideConfirmation = useCallback(() => {
    setConfirmationModal({
      show: false,
      title: '',
      message: '',
      type: '',
      onConfirm: null,
      data: null,
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmationModal.onConfirm) {
      confirmationModal.onConfirm(confirmationModal.data);
    }
    hideConfirmation();
  }, [confirmationModal.onConfirm, confirmationModal.data, hideConfirmation]);

  const settingsLoaded = useRef(false);
  const loadSettings = useCallback(async () => {
    if (settingsLoaded.current) return;
    settingsLoaded.current = true;
    setIsLoading(true);
    try {
      const response = await applicationAPI.getAllProperties({ page: 1, limit: 100 });
      if (response.data && response.data.data) {
        const properties = response.data.data;
        const loadedSettings = {};
        properties.forEach(property => {
          loadedSettings[property.property_name] = property.property_value;
          if (property.metadata) {
            Object.keys(property.metadata).forEach(key => {
              loadedSettings[key] = property.metadata[key];
            });
          }
        });
        setSettings(prev => ({ ...prev, ...loadedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-gray-600 text-sm mt-1">
            Configure platform-wide settings and preferences
          </p>
        </div>
        <button
          onClick={() => setSidebarCollapsed(prev => !prev)}
          className="hidden lg:flex items-center text-gray-500 hover:text-gray-700 mt-2 lg:mt-0"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Global Message Display */}
      {message.text && (
        <div
          className={`rounded-lg p-3 ${message.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : message.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
            }`}
        >
          <div className="flex items-start">
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            ) : message.type === 'error' ? (
              <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <p
              className={`text-sm ${message.type === 'success'
                ? 'text-green-700'
                : message.type === 'error'
                  ? 'text-red-700'
                  : 'text-blue-700'
                }`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-32'}`}>
          <nav className="space-y-1">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2'
                  } px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                title={sidebarCollapsed ? tab.name : undefined}
              >
                <span className="text-base">{tab.icon}</span>
                {!sidebarCollapsed && <span>{tab.name}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'general' && canViewGeneral && (
            <General settings={settings} showMessage={showMessage} />
          )}
          {activeTab === 'email' && canViewEmail && (
            <Email
              emailManager={emailManager}
              showMessage={showMessage}
              showConfirmation={showConfirmation}
              settings={settings}
            />
          )}
          {activeTab === 'razorpay' && canViewRazorpay && (
            <Razorpay
              razorpayManager={razorpayManager}
              showMessage={showMessage}
              showConfirmation={showConfirmation}
              settings={settings}
            />
          )}
          {activeTab === 'whatsapp' && canViewWhatsApp && (
            <WhatsApp
              whatsappManager={whatsappManager}
              showMessage={showMessage}
              showConfirmation={showConfirmation}
              settings={settings}
            />
          )}
          {activeTab === 'googlemeet' && canViewGoogleMeet && (
            <GoogleMeet
              googleMeetManager={googleMeetManager}
              showMessage={showMessage}
              showConfirmation={showConfirmation}
              settings={settings}
            />
          )}
          {activeTab === 'branches' && canViewBranches && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Branch Management</h2>
              <p className="text-xs text-gray-600 mb-4">
                Manage your branch locations and contact details.
              </p>
              <BranchManagement />
            </div>
          )}
          {activeTab === 'lovs' && canViewLOV && (
            <LOV showMessage={showMessage} showConfirmation={showConfirmation} />
          )}
          {activeTab === 'roles' && canViewRoles && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Role & Permission Management
              </h2>
              <p className="text-xs text-gray-600 mb-4">
                Assign permissions to roles and manage access control.
              </p>
              <RolePermissionManager />
            </div>
          )}
          {activeTab === 'mapping' && canViewMapping && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-3">User Mapping</h2>
              <p className="text-xs text-gray-600 mb-4">
                Manage associations between branches, systems, courses, batches, instructors,
                students, and webinars.
              </p>
              <SystemMapping />
            </div>
          )}
          {activeTab === 'organization' && canViewOrganization && (
            <OrganizationManagement
              showMessage={showMessage}
              showConfirmation={showConfirmation}
            />
          )}
          {activeTab === 'advanced' && canViewAdvanced && (
            <Advanced
              uploadPathManager={uploadPathManager}
              showMessage={showMessage}
              showConfirmation={showConfirmation}
              settings={settings}
            />
          )}
        </div>
      </div>

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.show}
        onClose={hideConfirmation}
        onConfirm={handleConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
      />
    </div>
  );
};

export default SystemSettings;