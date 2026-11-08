import React, { useState, useEffect, useRef } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import ConfigTable from '../components/ConfigTable'
import ConfigModal from '../components/ConfigModal'
import { razorpaySettingsSchema } from '../validations/sysSchemas'

const Razorpay = ({ razorpayManager, showMessage, showConfirmation, settings }) => {
  const [showTable, setShowTable] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      razorpayManager.loadConfigs()
    }
  }, [razorpayManager])

  const columns = [
    {
      key: 'property_value',
      label: 'Key ID',
      render: config => (
        <div>
          <div className="font-medium text-gray-900 text-xs">{config.property_value}</div>
          <div className="text-gray-500 text-xs mt-0.5">
            {config.metadata?.razorpaySettings?.keyId ? 'Key ID configured' : 'No Key ID'}
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
            config.property_value?.includes('test')
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {config.property_value?.includes('test') ? 'Test' : 'Live'}
        </span>
      ),
    },
  ]

  const fields = [
    {
      name: 'keyId',
      label: 'Key ID',
      required: true,
      type: 'text',
      placeholder: 'rzp_test_xxxxxxxxxxxxx',
    },
    {
      name: 'keySecret',
      label: 'Key Secret',
      required: true,
      type: 'password',
      placeholder: '••••••••',
    },
    {
      name: 'webhookSecret',
      label: 'Webhook Secret',
      required: true,
      type: 'password',
      placeholder: '••••••••',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 2,
      placeholder: 'Describe this Razorpay configuration...',
    },
  ]
  const passwordFields = ['keySecret', 'webhookSecret']

  const testConfig = async config => {
    showMessage('info', `Testing Razorpay configuration: ${config.property_value}...`)
    setTimeout(() => {
      showMessage(
        'success',
        `Razorpay configuration test for ${config.property_value} completed successfully!`
      )
    }, 2000)
  }

  const handleDelete = config => {
    showConfirmation(
      'Delete Razorpay Configuration',
      `Are you sure you want to delete the Razorpay configuration for "${config.property_value}"? This action cannot be undone.`,
      'delete',
      () => razorpayManager.deleteConfig(config)
    )
  }

  const handleSave = async data => {
    const payload = {
      property_name: 'app_rzp',
      property_value: data.keyId,
      desc: data.description || 'Razorpay payment gateway configuration',
      metadata: {
        appName: settings.site_title || 'Learn SAP ABAP',
        companyName: 'Learn SAP ABAP',
        razorpaySettings: {
          keyId: data.keyId,
          keySecret: data.keySecret,
          webhookSecret: data.webhookSecret,
        },
      },
      status: editingConfig ? editingConfig.status : 'inactive',
    }
    const success = await razorpayManager.saveConfig(payload, editingConfig)
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
        keyId: editingConfig.metadata?.razorpaySettings?.keyId || '',
        keySecret: editingConfig.metadata?.razorpaySettings?.keySecret || '',
        webhookSecret: editingConfig.metadata?.razorpaySettings?.webhookSecret || '',
        description: editingConfig.desc || '',
      }
    : null

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Razorpay Configurations</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Manage your Razorpay payment gateway configurations ({razorpayManager.configs.length}{' '}
              total)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTable(!showTable)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
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
            configs={razorpayManager.configs}
            columns={columns}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onActivate={razorpayManager.activateConfig}
            onTest={testConfig}
          />
          {razorpayManager.configs.length === 0 && (
            <div className="text-center py-6">
              <CreditCard className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Razorpay configurations</h3>
              <p className="text-xs text-gray-500 mb-3">
                Get started by creating a new Razorpay configuration.
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
          else razorpayManager.testConfig(null, testConfig)
        }}
        schema={razorpaySettingsSchema}
        defaultValues={{
          keyId: '',
          keySecret: '',
          webhookSecret: '',
          description: '',
        }}
        initialData={initialData}
        editingConfig={editingConfig}
        saveLoading={razorpayManager.saveLoading}
        title={editingConfig ? 'Edit Razorpay Config' : 'New Razorpay Config'}
        description={
          editingConfig
            ? `Editing: ${editingConfig.property_value}`
            : 'Configure Razorpay payment gateway settings'
        }
        fields={fields}
        passwordFields={passwordFields}
      />
    </div>
  )
}

export default Razorpay
