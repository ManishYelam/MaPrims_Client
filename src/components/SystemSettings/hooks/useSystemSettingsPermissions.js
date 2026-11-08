import { useMemo } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';

export const useSystemSettingsPermissions = () => {
  const { hasPermission, isAdmin } = usePermissions();

  const check = (action, resource, level) =>
    isAdmin || hasPermission(action, resource, level);

  return useMemo(() => {
    // ----------------------------------------------------------------------
    // VIEW PERMISSIONS (A2)
    // ----------------------------------------------------------------------
    const canViewGeneral = check('view', 'general_settings', 'A2');
    const canViewEmail = check('view', 'email_settings', 'A2');
    const canViewRazorpay = check('view', 'razorpay_settings', 'A2');
    const canViewWhatsApp = check('view', 'whatsapp_settings', 'A2');
    const canViewGoogleMeet = check('view', 'google_meet_settings', 'A2');
    const canViewBranches = check('view', 'branches', 'A2');
    const canViewLOV = check('view', 'list_of_values', 'A2');
    const canViewRoles = check('view', 'roles_permissions', 'A2');
    const canViewMapping = check('view', 'system_mapping', 'A2');
    const canViewOrg = check('view', 'organization_management', 'A2');
    const canViewAdvanced = check('view', 'advanced_settings', 'A2');

    return {
      // View flags
      canViewGeneral,
      canViewEmail,
      canViewRazorpay,
      canViewWhatsApp,
      canViewGoogleMeet,
      canViewBranches,
      canViewLOV,
      canViewRoles,
      canViewMapping,
      canViewOrg,
      canViewAdvanced,

      general: {
        canUpdate: check('update', 'general_settings', 'A3'),
      },

      email: {
        canCreate: check('create', 'email_settings', 'A3'),
        canEdit: check('edit', 'email_settings', 'A3'),
        canDelete: check('delete', 'email_settings', 'A3'),
        canActivate: check('activate', 'email_settings', 'A3'),
        canTest: check('test', 'email_settings', 'A3'),
      },

      razorpay: {
        canCreate: check('create', 'razorpay_settings', 'A3'),
        canEdit: check('edit', 'razorpay_settings', 'A3'),
        canDelete: check('delete', 'razorpay_settings', 'A3'),
        canActivate: check('activate', 'razorpay_settings', 'A3'),
        canTest: check('test', 'razorpay_settings', 'A3'),
      },

      whatsapp: {
        canCreate: check('create', 'whatsapp_settings', 'A3'),
        canEdit: check('edit', 'whatsapp_settings', 'A3'),
        canDelete: check('delete', 'whatsapp_settings', 'A3'),
        canActivate: check('activate', 'whatsapp_settings', 'A3'),
        canTest: check('test', 'whatsapp_settings', 'A3'),
      },

      googleMeet: {
        canCreate: check('create', 'google_meet_settings', 'A3'),
        canEdit: check('edit', 'google_meet_settings', 'A3'),
        canDelete: check('delete', 'google_meet_settings', 'A3'),
        canActivate: check('activate', 'google_meet_settings', 'A3'),
        canTest: check('test', 'google_meet_settings', 'A3'),
      },

      lov: {
        canCreate: check('create', 'list_of_values', 'A3'),
        canEdit: check('edit', 'list_of_values', 'A3'),
        canDelete: check('delete', 'list_of_values', 'A3'),
      },

      roles: {
        canSelectRole: check('select_role', 'roles_permissions', 'A3'),
        canNewRole: check('new_role', 'roles_permissions', 'A3'),
        canEditRole: check('edit_role', 'roles_permissions', 'A3'),
        canDeleteRole: check('delete_role', 'roles_permissions', 'A3'),
        canNewPermission: check('new_permission', 'roles_permissions', 'A3'),
        canSavePermission: check('save_permission', 'roles_permissions', 'A3'),
        canAddChildPermission: check('add_child_permission', 'roles_permissions', 'A3'),
        canActivateDeactivatePermission: check('activate_deactivate', 'roles_permissions', 'A3'),
        canEditPermission: check('edit_permission', 'roles_permissions', 'A3'),
      },

      mapping: {
        canCreate: check('create', 'system_mapping', 'A3'),
        canUpdate: check('update', 'system_mapping', 'A3'),
        canDelete: check('delete', 'system_mapping', 'A3'),
      },

      organization: {
        canNew: check('new_organization', 'organization_management', 'A3'),
        canEdit: check('edit_organization', 'organization_management', 'A3'),
        canSave: check('save_organization', 'organization_management', 'A3'),
        canEditDatabaseSettings: check(
          'edit_database_settings',
          'organization_management',
          'A3'
        ),
        canSaveDatabaseSettings: check(
          'save_database_settings',
          'organization_management',
          'A3'
        ),
        canEditCompanyPolicy: check(
          'edit_company_policy',
          'organization_management',
          'A3'
        ),
        canSaveCompanyPolicy: check(
          'save_company_policy',
          'organization_management',
          'A3'
        ),
      },

      advanced: {
        canManagePermissionPriorities: check(
          'manage',
          'advanced_settings',
          'A3'
        ),
        canManageUploadPath: check(
          'manage',
          'advanced_settings',
          'A3'
        ),
        canManageSystemTools: check(
          'manage',
          'advanced_settings',
          'A3'
        ),
      },
    };
  }, [hasPermission, isAdmin]);
};