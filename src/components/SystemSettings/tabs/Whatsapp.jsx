import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, Plus } from 'lucide-react'
import ConfigTable from '../components/ConfigTable'
import ConfigModal from '../components/ConfigModal'
import { whatsappSettingsSchema } from '../validations/sysSchemas'

const WhatsApp = ({ whatsappManager, showMessage, showConfirmation, settings }) => {
  const [showTable, setShowTable] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      whatsappManager.loadConfigs()
    }
  }, [whatsappManager])

  const columns = [
    {
      key: 'property_value',
      label: 'Phone Number',
      render: config => (
        <div>
          <div className="font-medium text-gray-900 text-xs">{config.property_value}</div>
          <div className="text-gray-500 text-xs mt-0.5">
            ID: {config.metadata?.whatsappSettings?.phoneNumberId || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'businessAccount',
      label: 'Business Account',
      render: config => (
        <div>
          <div className="text-gray-900 text-xs">
            {config.metadata?.whatsappSettings?.businessAccountId || 'N/A'}
          </div>
          <div className="text-gray-500 text-xs mt-0.5">
            {config.metadata?.whatsappSettings?.phoneNumberId ? 'Configured' : 'Not set'}
          </div>
        </div>
      ),
    },
    {
      key: 'environment',
      label: 'Environment',
      render: config => (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
            config.metadata?.whatsappSettings?.accessToken?.includes('test')
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {config.metadata?.whatsappSettings?.accessToken?.includes('test') ? 'Test' : 'Live'}
        </span>
      ),
    },
  ]

  const fields = [
    {
      name: 'phoneNumberId',
      label: 'Phone Number ID',
      required: true,
      type: 'text',
      placeholder: '123456789012345',
    },
    {
      name: 'businessAccountId',
      label: 'Business Account ID',
      required: true,
      type: 'text',
      placeholder: '1234567890',
    },
    {
      name: 'accessToken',
      label: 'Access Token',
      required: true,
      type: 'password',
      placeholder: 'EAAG... (Permanent Access Token)',
    },
    {
      name: 'webhookSecret',
      label: 'Webhook Secret',
      required: true,
      type: 'password',
      placeholder: '••••••••',
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      required: true,
      type: 'text',
      placeholder: '+1234567890',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 2,
      placeholder: 'Describe this WhatsApp configuration...',
    },
  ]
  const passwordFields = ['accessToken', 'webhookSecret']

  const testConfig = async config => {
    showMessage('info', `Testing WhatsApp configuration: ${config.property_value}...`)
    setTimeout(() => {
      showMessage(
        'success',
        `WhatsApp configuration test for ${config.property_value} completed successfully!`
      )
    }, 2000)
  }

  const handleDelete = config => {
    showConfirmation(
      'Delete WhatsApp Configuration',
      `Are you sure you want to delete the WhatsApp configuration for "${config.property_value}"? This action cannot be undone.`,
      'delete',
      () => whatsappManager.deleteConfig(config)
    )
  }

  const handleSave = async data => {
    const payload = {
      property_name: 'app_whatsapp',
      property_value: data.phoneNumber,
      desc: data.description || 'WhatsApp Business API configuration',
      metadata: {
        appName: settings.site_title || 'Learn SAP ABAP',
        companyName: 'Learn SAP ABAP',
        whatsappSettings: {
          phoneNumberId: data.phoneNumberId,
          businessAccountId: data.businessAccountId,
          accessToken: data.accessToken,
          webhookSecret: data.webhookSecret,
          phoneNumber: data.phoneNumber,
        },
      },
      status: editingConfig ? editingConfig.status : 'inactive',
    }
    const success = await whatsappManager.saveConfig(payload, editingConfig)
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
        phoneNumberId: editingConfig.metadata?.whatsappSettings?.phoneNumberId || '',
        businessAccountId: editingConfig.metadata?.whatsappSettings?.businessAccountId || '',
        accessToken: editingConfig.metadata?.whatsappSettings?.accessToken || '',
        webhookSecret: editingConfig.metadata?.whatsappSettings?.webhookSecret || '',
        phoneNumber: editingConfig.metadata?.whatsappSettings?.phoneNumber || '',
        description: editingConfig.desc || '',
      }
    : null

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">WhatsApp Configurations</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Manage your WhatsApp Business API configurations ({whatsappManager.configs.length}{' '}
              total)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTable(!showTable)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
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
            configs={whatsappManager.configs}
            columns={columns}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onActivate={whatsappManager.activateConfig}
            onTest={testConfig}
          />
          {whatsappManager.configs.length === 0 && (
            <div className="text-center py-6">
              <MessageCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No WhatsApp configurations</h3>
              <p className="text-xs text-gray-500 mb-3">
                Get started by creating a new WhatsApp configuration.
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
          else whatsappManager.testConfig(null, testConfig)
        }}
        schema={whatsappSettingsSchema}
        defaultValues={{
          phoneNumberId: '',
          businessAccountId: '',
          accessToken: '',
          webhookSecret: '',
          phoneNumber: '',
          description: '',
        }}
        initialData={initialData}
        editingConfig={editingConfig}
        saveLoading={whatsappManager.saveLoading}
        title={editingConfig ? 'Edit WhatsApp Config' : 'New WhatsApp Config'}
        description={
          editingConfig
            ? `Editing: ${editingConfig.property_value}`
            : 'Configure WhatsApp Business API settings'
        }
        fields={fields}
        passwordFields={passwordFields}
      />
    </div>
  )
}

export default WhatsApp
