import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Save,
  Bell,
  Lock,
  User,
  Globe,
  HardDrive,
  Shield,
  Palette,
  Download,
  Upload,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Key,
  Mail,
  Smartphone,
  Database,
  Cloud,
  Users,
  Clock,
} from 'lucide-react'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    // General
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',

    // Account
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'Administrator',
    twoFactor: true,
    notifications: {
      email: true,
      push: true,
      weeklyReport: false,
    },

    // Security
    password: '',
    sessionTimeout: 30,
    loginAlerts: true,
    ipWhitelist: ['192.168.1.0/24'],

    // Storage
    defaultQuota: 10737418240, // 10GB
    maxFileSize: 104857600, // 100MB
    autoCleanup: true,
    cleanupDays: 30,

    // Appearance
    theme: 'light',
    sidebarCollapsed: false,
    compactMode: false,

    // Notifications
    emailNotifications: {
      upload: true,
      download: true,
      share: true,
      delete: true,
      backup: true,
    },
  })

  const [showPassword, setShowPassword] = useState(false)
  const [newIP, setNewIP] = useState('')

  const tabs = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'account', label: 'Account', icon: <User size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'storage', label: 'Storage', icon: <HardDrive size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'integrations', label: 'Integrations', icon: <Cloud size={18} /> },
  ]

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
  ]

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'EST', label: 'Eastern Time' },
    { value: 'PST', label: 'Pacific Time' },
    { value: 'GMT', label: 'GMT' },
    { value: 'CET', label: 'Central European Time' },
  ]

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto (System)' },
  ]

  const integrations = [
    { name: 'Google Drive', connected: true, icon: '🔵' },
    { name: 'Dropbox', connected: true, icon: '🔵' },
    { name: 'OneDrive', connected: false, icon: '⚫' },
    { name: 'AWS S3', connected: true, icon: '🔵' },
    { name: 'Slack', connected: false, icon: '⚫' },
  ]

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }))
  }

  const handleSaveSettings = () => {
    // console.log('Saving settings:', settings)
    // API call to save settings
  }

  const handleAddIP = () => {
    if (newIP && !settings.ipWhitelist.includes(newIP)) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIP],
      }))
      setNewIP('')
    }
  }

  const handleRemoveIP = ip => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(i => i !== ip),
    }))
  }

  const formatBytes = bytes => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Language & Region</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={settings.language}
              onChange={e => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={settings.timezone}
              onChange={e => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={e => setSettings({ ...settings, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
            <select
              value={settings.timeFormat}
              onChange={e => setSettings({ ...settings, timeFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={e => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Key className="text-blue-500 mr-3" size={24} />
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.twoFactor}
              onChange={e => setSettings({ ...settings, twoFactor: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Password</h4>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={settings.password}
            onChange={e => setSettings({ ...settings, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Session Settings</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={settings.sessionTimeout}
            onChange={e => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>5 min</span>
            <span className="font-medium">{settings.sessionTimeout} min</span>
            <span>120 min</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">IP Whitelist</h4>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newIP}
              onChange={e => setNewIP(e.target.value)}
              placeholder="Enter IP address or range (e.g., 192.168.1.0/24)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddIP}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {settings.ipWhitelist.map(ip => (
              <div key={ip} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-mono text-sm">{ip}</span>
                <button
                  onClick={() => handleRemoveIP(ip)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Storage Limits</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default User Quota
            </label>
            <select
              value={settings.defaultQuota}
              onChange={e => setSettings({ ...settings, defaultQuota: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5368709120}>5 GB</option>
              <option value={10737418240}>10 GB</option>
              <option value={21474836480}>20 GB</option>
              <option value={53687091200}>50 GB</option>
              <option value={107374182400}>100 GB</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum File Size
            </label>
            <select
              value={settings.maxFileSize}
              onChange={e => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10485760}>10 MB</option>
              <option value={52428800}>50 MB</option>
              <option value={104857600}>100 MB</option>
              <option value={524288000}>500 MB</option>
              <option value={1073741824}>1 GB</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Auto Cleanup</h4>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Automatically clean up old files</p>
            <p className="text-sm text-gray-600">
              Files older than {settings.cleanupDays} days will be moved to trash
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoCleanup}
              onChange={e => setSettings({ ...settings, autoCleanup: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Theme</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map(theme => (
            <label
              key={theme.value}
              className={`relative cursor-pointer rounded-lg border-2 p-4 ${
                settings.theme === theme.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={theme.value}
                checked={settings.theme === theme.value}
                onChange={e => setSettings({ ...settings, theme: e.target.value })}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-lg mb-2">
                  {theme.value === 'light' ? '☀️' : theme.value === 'dark' ? '🌙' : '🔄'}
                </div>
                <div className="font-medium">{theme.label}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Interface Preferences</h4>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.sidebarCollapsed}
              onChange={e => setSettings({ ...settings, sidebarCollapsed: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3">Collapse sidebar by default</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={e => setSettings({ ...settings, compactMode: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3">Use compact mode</span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderNotificationsSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h4>
        <div className="space-y-3">
          {Object.entries(settings.emailNotifications).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div>
                <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm text-gray-600">Receive email when {key} occurs</p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={e =>
                  setSettings({
                    ...settings,
                    emailNotifications: {
                      ...settings.emailNotifications,
                      [key]: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Connected Services</h4>
        <div className="space-y-3">
          {integrations.map(service => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">{service.icon}</span>
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-gray-600">
                    {service.connected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <button
                className={`px-4 py-2 rounded-lg ${
                  service.connected
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {service.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your application preferences</p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
        >
          <Save size={18} className="mr-2" />
          Save Changes
        </button>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'account' && renderAccountSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'storage' && renderStorageSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'notifications' && renderNotificationsSettings()}
          {activeTab === 'integrations' && renderIntegrationsSettings()}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm">
        <div className="px-6 py-4 border-b border-red-200">
          <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Export All Data</p>
                <p className="text-sm text-gray-600">
                  Download all your files and data as a backup
                </p>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center">
                <Download size={18} className="mr-2" />
                Export Data
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all data
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
