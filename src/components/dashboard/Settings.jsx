// src/pages/dashboard/Settings.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Eye, EyeOff, Lock, Shield, CheckCircle, XCircle, X,
  Code, Copy, Check, Save, RotateCcw
} from 'lucide-react';
import { authAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import WhatsAppAccounts from '../settings/WhatsAppAccounts';
import themes from '../../data/themes';

const changePasswordSchema = yup.object({
  old_password: yup.string().required('Current password is required'),
  new_password: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirm_password: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('new_password')], 'Passwords must match'),
});

// ---------- ChangePassword Modal ----------
const ChangePasswordModal = ({
  isOpen, onClose, onSubmit, isSubmitting, errors, register, watch,
  showOldPassword, setShowOldPassword, showNewPassword, setShowNewPassword,
  showConfirmPassword, setShowConfirmPassword, success, error
}) => {
  const newPasswordValue = watch('new_password');
  const confirmPasswordValue = watch('confirm_password');

  const getPasswordStrength = password => {
    if (!password) return { strength: 0, text: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    const strengthMap = {
      1: { text: 'Very Weak', color: 'bg-red-500' },
      2: { text: 'Weak', color: 'bg-orange-500' },
      3: { text: 'Fair', color: 'bg-yellow-500' },
      4: { text: 'Good', color: 'bg-blue-500' },
      5: { text: 'Strong', color: 'bg-green-500' },
    };
    return { strength, ...strengthMap[strength] };
  };
  const passwordStrength = getPasswordStrength(newPasswordValue);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" disabled={isSubmitting}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="p-6">
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fade-in">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 font-medium mb-1">Password Changed Successfully!</p>
                    <p className="text-green-600 text-sm">Your password has been updated.</p>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-fade-in">
                <div className="flex items-start">
                  <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-700 font-medium mb-1">Password Change Failed</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('old_password')}
                    type={showOldPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.old_password ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Enter current password"
                    disabled={isSubmitting}
                  />
                  <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.old_password && <p className="mt-1 text-xs text-red-600">{errors.old_password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('new_password')}
                    type={showNewPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.new_password ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Enter new password"
                    disabled={isSubmitting}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPasswordValue && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span className="text-xs font-medium text-gray-700">{passwordStrength.text}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.strength / 5) * 100}%` }} />
                    </div>
                  </div>
                )}
                {errors.new_password && <p className="mt-1 text-xs text-red-600">{errors.new_password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('confirm_password')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.confirm_password ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Confirm new password"
                    disabled={isSubmitting}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="mt-1 text-xs text-red-600">{errors.confirm_password.message}</p>}
                {confirmPasswordValue && newPasswordValue === confirmPasswordValue && (
                  <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
                )}
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg font-semibold shadow-sm hover:shadow transform transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-700 hover:-translate-y-0.5'}`}>
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Changing Password...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Update Password</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const JsonViewerModal = ({ isOpen, onClose, themeName, themeColors }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const jsonString = JSON.stringify({ type: 'custom', colors: themeColors }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg transform transition-all">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-primary-600" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Theme JSON: {themeName}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="p-4">
            <div className="relative bg-gray-900 text-gray-100 rounded-lg p-3 overflow-auto max-h-64">
              <pre className="text-xs font-mono whitespace-pre-wrap">{jsonString}</pre>
            </div>
            <div className="flex justify-end mt-3 space-x-2">
              <button onClick={handleCopy} className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user: authUser, updateUser } = useContext(AuthContext);
  const { themeId } = useTheme();
  const userId = authUser?.user?.user_id;

  const [activeTab, setActiveTab] = useState('security');

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const [previewThemeId, setPreviewThemeId] = useState(themeId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [selectedThemeName, setSelectedThemeName] = useState('');
  const [selectedThemeColors, setSelectedThemeColors] = useState(null);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    watch: watchPassword,
    reset: resetPasswordForm,
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { old_password: '', new_password: '', confirm_password: '' },
  });

  const applyThemeById = (id) => {
    const theme = themes[id];
    if (!theme) return;
    const root = document.documentElement;
    const setShades = (prefix, shades) => {
      for (let i = 50; i <= 900; i += 50) {
        root.style.setProperty(`--${prefix}-${i}`, shades[i] || shades[500]);
      }
    };
    setShades('primary', theme.primary);
    setShades('accent', theme.accent);
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--text', theme.text);
  };

  useEffect(() => {
    setPreviewThemeId(themeId);
  }, [themeId]);

  useEffect(() => {
    applyThemeById(previewThemeId);
  }, [previewThemeId]);

  const handleChangePassword = async (data) => {
    setIsChangingPassword(true);
    setPasswordChangeError('');
    setPasswordChangeSuccess(false);
    try {
      const response = await authAPI.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      });
      if (response.status === 200 || response.status === 201 || response.data) {
        setPasswordChangeSuccess(true);
        resetPasswordForm();
        setTimeout(() => {
          setIsChangePasswordModalOpen(false);
          setPasswordChangeSuccess(false);
        }, 2000);
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      let errorMessage = 'Failed to change password. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        if (error.response.status === 400) errorMessage = 'Invalid current password or new password does not meet requirements.';
        else if (error.response.status === 401) errorMessage = 'Current password is incorrect.';
        else if (error.response.status === 429) errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      setPasswordChangeError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true);
    setPasswordChangeSuccess(false);
    setPasswordChangeError('');
    resetPasswordForm();
  };

  const closeChangePasswordModal = () => {
    if (!isChangingPassword) {
      setIsChangePasswordModalOpen(false);
      setPasswordChangeSuccess(false);
      setPasswordChangeError('');
      resetPasswordForm();
    }
  };

  const handleSelectPreview = (themeId) => {
    setPreviewThemeId(themeId);
    setSaveError('');
  };

  const handleSaveTheme = async () => {
    if (previewThemeId === themeId) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const themeData = themes[previewThemeId];
      // Build full custom theme payload, whether predefined or custom
      const fullThemePayload = themeData
        ? {
            type: 'custom',
            colors: {
              primary: themeData.primary,
              accent: themeData.accent,
              bg: themeData.bg,
              surface: themeData.surface,
              text: themeData.text,
            },
          }
        : {
            type: 'custom',
            colors: previewThemeId, // fallback for truly custom themes
          };

      const payload = { theme: fullThemePayload };

      await authAPI.updateProfile(userId, payload);
      updateUser({ 
        user: { 
          ...authUser.user,           // Spread all existing user properties
          theme: fullThemePayload     // Override just the theme
          } 
      });
    } catch (error) {
      console.error('Failed to save theme:', error);
      setSaveError('Failed to save theme. Please try again.');
      setPreviewThemeId(themeId);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewThemeId(themeId);
    setSaveError('');
  };

  const handleViewJson = (themeId) => {
    const theme = themes[themeId];
    if (theme) {
      setSelectedThemeName(theme.name);
      setSelectedThemeColors({
        primary: theme.primary,
        accent: theme.accent,
        bg: theme.bg,
        surface: theme.surface,
        text: theme.text,
      });
      setIsJsonModalOpen(true);
    }
  };

  const tabs = [
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  ];

  const hasPreviewChanges = previewThemeId !== themeId;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-40">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Security Settings</h2>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">Password</h3>
                      <p className="text-xs text-gray-600 mt-0.5">Last changed 2 weeks ago</p>
                    </div>
                    <button onClick={openChangePasswordModal} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Active Sessions</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Current Session</p>
                      <p className="text-xs text-gray-600 mt-0.5">Chrome • Windows • Just now</p>
                    </div>
                    <span className="text-green-600 text-xs font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Mobile Device</p>
                      <p className="text-xs text-gray-600 mt-0.5">Safari • iOS • 2 hours ago</p>
                    </div>
                    <button className="text-red-600 text-xs font-medium hover:text-red-700">Revoke</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mt-1">
                      Select a color scheme to preview instantly. Save when ready.
                    </p>
                  </div>
                  {hasPreviewChanges && (
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                      <button
                        onClick={handleCancelPreview}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSaveTheme}
                        disabled={isSaving}
                        className={`flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg shadow-sm hover:shadow transition-all text-xs font-medium ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-700 hover:-translate-y-0.5'
                          }`}
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {saveError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1">
                  {Object.entries(themes).map(([id, theme]) => (
                    <div
                      key={id}
                      className={`relative flex flex-col items-center p-1.5 rounded-md border transition-all duration-200 hover:shadow-sm ${previewThemeId === id
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <button
                        onClick={() => handleSelectPreview(id)}
                        className="w-full flex flex-col items-center focus:outline-none"
                      >
                        <div className="w-full h-4 rounded mb-1 overflow-hidden flex">
                          <div className="flex-1" style={{ backgroundColor: theme.primary[500] }} />
                          <div className="flex-1" style={{ backgroundColor: theme.accent[500] }} />
                          <div className="flex-1" style={{ backgroundColor: theme.bg }} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-900 leading-tight text-center truncate w-full">
                          {theme.name}
                        </span>
                      </button>
                      {themeId === id && (
                        <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 text-white rounded-full flex items-center justify-center text-[7px]">
                          ✓
                        </span>
                      )}
                      <button
                        onClick={() => handleViewJson(id)}
                        className="mt-0.5 text-[8px] text-primary-600 hover:text-primary-800 focus:outline-none"
                      >
                        JSON
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && <WhatsAppAccounts userId={userId} />}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={closeChangePasswordModal}
        onSubmit={handleSubmitPassword(handleChangePassword)}
        isSubmitting={isChangingPassword}
        errors={passwordErrors}
        register={registerPassword}
        watch={watchPassword}
        showOldPassword={showOldPassword}
        setShowOldPassword={setShowOldPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        success={passwordChangeSuccess}
        error={passwordChangeError}
      />

      <JsonViewerModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        themeName={selectedThemeName}
        themeColors={selectedThemeColors}
      />
    </div>
  );
};

export default Settings;
