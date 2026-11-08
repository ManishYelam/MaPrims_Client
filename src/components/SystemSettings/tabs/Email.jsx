import React, { useState, useEffect, useRef } from 'react'
import { Mail, Plus } from 'lucide-react'
import ConfigTable from '../components/ConfigTable'
import ConfigModal from '../components/ConfigModal'
import { emailSettingsSchema } from '../validations/sysSchemas'

const Email = ({ emailManager, showMessage, showConfirmation, settings }) => {
  const [showTable, setShowTable] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      emailManager.loadConfigs()
    }
  }, [emailManager])

  const columns = [
    {
      key: 'property_value',
      label: 'Email',
      render: config => (
        <div>
          <div className="font-medium text-gray-900 text-xs">{config.property_value}</div>
          <div className="text-gray-500 text-xs mt-0.5">
            {config.metadata?.emailSettings?.username}
          </div>
        </div>
      ),
    },
    {
      key: 'smtpServer',
      label: 'Server',
      render: config => (
        <div>
          <div className="text-gray-900 text-xs">
            {config.metadata?.emailSettings?.smtpServer || 'N/A'}
          </div>
          <div className="text-gray-500 text-xs mt-0.5">
            Port: {config.metadata?.emailSettings?.port || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'service',
      label: 'Service',
      render: config => (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium capitalize ${
            config.metadata?.emailSettings?.service === 'gmail'
              ? 'bg-red-100 text-red-800'
              : config.metadata?.emailSettings?.service === 'outlook'
                ? 'bg-blue-100 text-blue-800'
                : config.metadata?.emailSettings?.service === 'yahoo'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-700'
          }`}
        >
          {config.metadata?.emailSettings?.service || 'custom'}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: config => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {config.category || 'default'}
        </span>
      ),
    },
  ]

  const fields = [
    {
      name: 'smtpServer',
      label: 'SMTP Host',
      required: true,
      type: 'text',
      placeholder: 'smtp.gmail.com',
    },
    { name: 'port', label: 'SMTP Port', required: true, type: 'number', placeholder: '587' },
    {
      name: 'service',
      label: 'Service Type',
      required: true,
      type: 'select',
      options: [
        { value: 'gmail', label: 'Gmail' },
        { value: 'outlook', label: 'Outlook' },
        { value: 'yahoo', label: 'Yahoo' },
        { value: 'custom', label: 'Custom SMTP' },
      ],
    },
    {
      name: 'username',
      label: 'SMTP Username',
      required: true,
      type: 'email',
      placeholder: 'your-email@gmail.com',
    },
    {
      name: 'password',
      label: 'SMTP Password',
      required: true,
      type: 'password',
      placeholder: '••••••••',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 2,
      placeholder: 'Describe this email configuration...',
    },
    {
      name: 'category',
      label: 'Category',
      required: true,
      type: 'text',
      placeholder: 'e.g., email, notification, support',
      helpText: 'All configurations with the same category will be mutually exclusive (only one active at a time).',
    },
  ]

  const passwordFields = ['password']

  const testConfig = async config => {
    showMessage('info', `Testing email configuration: ${config.property_value}...`)
    setTimeout(() => {
      showMessage(
        'success',
        `Email configuration test for ${config.property_value} completed successfully!`
      )
    }, 2000)
  }

  const handleDelete = config => {
    showConfirmation(
      'Delete Email Configuration',
      `Are you sure you want to delete the email configuration for "${config.property_value}"? This action cannot be undone.`,
      'delete',
      () => emailManager.deleteConfig(config)
    )
  }

  const handleSave = async data => {
    const payload = {
      property_name: 'app_email',
      property_value: data.username,
      category: data.category,
      desc: data.description || 'SMTP email server configuration',
      metadata: {
        appName: settings.site_title || 'Learn SAP ABAP',
        companyName: 'Learn SAP ABAP',
        contactNumber: '+91 000-000-0000',
        emailSettings: {
          smtpServer: data.smtpServer,
          port: parseInt(data.port),
          service: data.service,
          username: data.username,
          password: data.password,
          useTLS: data.useTLS,
        },
      },
      status: editingConfig ? editingConfig.status : 'inactive',
    }
    const success = await emailManager.saveConfig(payload, editingConfig)
    if (success) setShowModal(false)
  }

  const openNewModal = () => {
    setEditingConfig(null)
    setShowModal(true)
  }

  const openEditModal = config => {
    setEditingConfig(config)
    setShowModal(true)
  }

  const initialData = editingConfig
    ? {
        smtpServer: editingConfig.metadata?.emailSettings?.smtpServer || '',
        port: editingConfig.metadata?.emailSettings?.port || 587,
        service: editingConfig.metadata?.emailSettings?.service || '',
        username: editingConfig.metadata?.emailSettings?.username || '',
        password: editingConfig.metadata?.emailSettings?.password || '',
        useTLS: editingConfig.metadata?.emailSettings?.useTLS !== false,
        description: editingConfig.desc || '',
        category: editingConfig.category || 'email',
      }
    : null

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Email Configurations</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Manage your email service configurations ({emailManager.configs.length} total)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTable(!showTable)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{showTable ? 'Hide' : 'Show'} Table</span>
            </button>
            <button
              onClick={openNewModal}
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Config</span>
            </button>
          </div>
        </div>
      </div>

      {showTable && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ConfigTable
            configs={emailManager.configs}
            columns={columns}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onActivate={emailManager.activateConfig}
            onTest={testConfig}
          />
          {emailManager.configs.length === 0 && (
            <div className="text-center py-6">
              <Mail className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No email configurations</h3>
              <p className="text-xs text-gray-500 mb-3">
                Get started by creating a new email configuration.
              </p>
              <button
                onClick={openNewModal}
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 mx-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Configuration</span>
              </button>
            </div>
          )}
        </div>
      )}

      <ConfigModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        onTest={() => {
          if (editingConfig) testConfig(editingConfig)
          else emailManager.testConfig(null, testConfig)
        }}
        schema={emailSettingsSchema}
        defaultValues={{
          smtpServer: '',
          port: 587,
          service: '',
          username: '',
          password: '',
          useTLS: true,
          description: '',
          category: 'email',
        }}
        initialData={initialData}
        editingConfig={editingConfig}
        saveLoading={emailManager.saveLoading}
        title={editingConfig ? 'Edit Email Config' : 'New Email Config'}
        description={
          editingConfig
            ? `Editing: ${editingConfig.property_value}`
            : 'Configure SMTP email settings'
        }
        fields={fields}
        passwordFields={passwordFields}
      />
    </div>
  )
}

export default Email
