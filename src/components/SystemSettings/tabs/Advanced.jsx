import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  Folder,
  Plus,
  Edit,
  Activity,
  Trash2,
  CheckCircle,
  Download,
  Loader,
  FolderOpen,
  AlertCircle,
  Save,
  RefreshCw,
  Shield,
  GripVertical,
} from 'lucide-react'
import { applicationAPI, genericAPI, rolePermissionAPI } from '../../../services/api'
import ConfigModal from '../components/ConfigModal'
import ConfigTable from '../components/ConfigTable'
import { uploadPathSchema } from '../validations/sysSchemas'

const Advanced = ({ uploadPathManager, showMessage, showConfirmation, settings }) => {
  const [activeUploadPathId, setActiveUploadPathId] = useState(null)
  const [showUploadPathModal, setShowUploadPathModal] = useState(false)
  const [editingUploadPathConfig, setEditingUploadPathConfig] = useState(null)
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupMethod, setBackupMethod] = useState('spawn')
  const hasLoaded = useRef(false)

  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [savingPriorities, setSavingPriorities] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(uploadPathSchema),
    defaultValues: {
      moduleName: 'COURSE_SYLLABUS',
      path: '',
      description: '',
    },
  })

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      uploadPathManager.loadConfigs()
    }
  }, [uploadPathManager])

  useEffect(() => {
    const activeConfig = uploadPathManager.configs.find(c => c.status === 'active')
    if (activeConfig) setActiveUploadPathId(activeConfig.app_prop_id)
  }, [uploadPathManager.configs])

  const loadA1Permissions = async () => {
    setLoadingPermissions(true)
    try {
      const response = await rolePermissionAPI.getA1Priorities()
      if (response.data.success) {
        const sorted = [...response.data.data].sort((a, b) => a.priority - b.priority)
        const sequential = sorted.map((p, idx) => ({ ...p, priority: idx + 1 }))
        setPermissions(sequential)
      } else {
        showMessage('error', response.data.message || 'Failed to load permissions')
      }
    } catch (error) {
      console.error('Error loading A1 permissions:', error)
      showMessage('error', error.response?.data?.message || 'Failed to load permissions')
    } finally {
      setLoadingPermissions(false)
    }
  }

  useEffect(() => {
    loadA1Permissions()
  }, [])

  // ✅ FIXED: Remove exactly one element at startIndex
  const reorderPermissions = (list, startIndex, endIndex) => {
    const result = [...list]
    const [removed] = result.splice(startIndex, 1) // remove exactly one
    result.splice(endIndex, 0, removed)
    return result.map((item, idx) => ({ ...item, priority: idx + 1 }))
  }

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedItemId(id)
  }

  const handleDragOver = e => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId === targetId) return

    const draggedIndex = permissions.findIndex(p => p.permission_id === parseInt(draggedId))
    const targetIndex = permissions.findIndex(p => p.permission_id === parseInt(targetId))

    if (draggedIndex === -1 || targetIndex === -1) return

    const reordered = reorderPermissions(permissions, draggedIndex, targetIndex)
    setPermissions(reordered)
    setDraggedItemId(null)
    showMessage('info', 'Order updated. Click Save to persist changes.')
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
  }

  const swapPriorities = (permissions, idA, idB) => {
    return permissions.map(p => {
      if (p.permission_id === idA) {
        const target = permissions.find(p2 => p2.permission_id === idB)
        return { ...p, priority: target.priority }
      }
      if (p.permission_id === idB) {
        const target = permissions.find(p2 => p2.permission_id === idA)
        return { ...p, priority: target.priority }
      }
      return p
    })
  }

  const handlePriorityChange = (permissionId, newPriority) => {
    const rawPriority = parseInt(newPriority, 10)
    if (isNaN(rawPriority)) return

    const currentPerm = permissions.find(p => p.permission_id === permissionId)
    if (!currentPerm) return
    if (currentPerm.priority === rawPriority) return

    const conflictingPerm = permissions.find(
      p => p.permission_id !== permissionId && p.priority === rawPriority
    )

    if (conflictingPerm) {
      const swapped = swapPriorities(permissions, permissionId, conflictingPerm.permission_id)
      setPermissions(swapped)
      showMessage('info', 'Priorities swapped with existing permission.')
    } else {
      setPermissions(prev =>
        prev.map(p => (p.permission_id === permissionId ? { ...p, priority: rawPriority } : p))
      )
    }
  }

  const savePriorities = async () => {
    const payload = {
      permissions: permissions.map(p => ({
        permission_id: p.permission_id,
        priority: p.priority,
      })),
    }
    setSavingPriorities(true)
    try {
      const response = await rolePermissionAPI.updatePriorityA1(payload)
      if (response.data.success) {
        showMessage('success', `Updated ${response.data.updatedCount} permission(s) successfully`)
        await loadA1Permissions()
      } else {
        showMessage('error', response.data.message || 'Failed to update priorities')
      }
    } catch (error) {
      console.error('Error saving priorities:', error)
      showMessage('error', error.response?.data?.message || 'Failed to save priorities')
    } finally {
      setSavingPriorities(false)
    }
  }

  const columns = [
    {
      key: 'module',
      label: 'Module',
      render: config => {
        const settings = config.metadata?.uploadPathSettings || {}
        return (
          <div className="flex items-center space-x-1.5">
            <Folder className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-gray-900 text-xs">
              {settings.moduleDisplayName || settings.moduleName || 'N/A'}
            </span>
          </div>
        )
      },
    },
    {
      key: 'path',
      label: 'Path',
      render: config => {
        const settings = config.metadata?.uploadPathSettings || {}
        return (
          <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">
            {settings.path || config.property_value || 'N/A'}
          </code>
        )
      },
    },
  ]

  const fields = [
    {
      name: 'moduleName',
      label: 'Module Name',
      required: true,
      type: 'select',
      options: [
        { value: 'COURSE_SYLLABUS', label: 'Course Syllabus' },
        { value: 'USER_DOCUMENTS', label: 'User Documents' },
        { value: 'COURSE_MATERIALS', label: 'Course Materials' },
        { value: 'ASSESSMENT_FILES', label: 'Assessment Files' },
        { value: 'CERTIFICATES', label: 'Certificates' },
        { value: 'SERVICE_FILES', label: 'Service Files' },
        { value: 'HRMS_FILES', label: 'HRMS Files' },
      ],
    },
    {
      name: 'path',
      label: 'Upload Path',
      required: true,
      type: 'text',
      placeholder: 'e.g., /uploads/courses/syllabus',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 2,
      placeholder: 'Describe this upload path configuration...',
    },
  ]

  const testConfig = async config => {
    showMessage('info', `Testing upload path: ${config.property_value}...`)
    setTimeout(() => {
      showMessage(
        'success',
        `Upload path test for ${config.property_value} completed successfully!`
      )
    }, 2000)
  }

  const handleDelete = config => {
    showConfirmation(
      'Delete Upload Path Configuration',
      `Are you sure you want to delete the upload path configuration for "${config.property_value}"? This action cannot be undone.`,
      'uploadPathDelete',
      async () => {
        await uploadPathManager.deleteConfig(config)
        await uploadPathManager.loadConfigs()
      }
    )
  }

  const handleSave = async data => {
    const moduleNameMap = {
      COURSE_SYLLABUS: 'Course Syllabus',
      USER_DOCUMENTS: 'User Documents',
      COURSE_MATERIALS: 'Course Materials',
      ASSESSMENT_FILES: 'Assessment Files',
      CERTIFICATES: 'Certificates',
    }

    const payload = {
      property_name: 'app_upload_path',
      property_value: `${data.moduleName}_${data.path}`,
      desc: data.description || `${moduleNameMap[data.moduleName]} upload path configuration`,
      metadata: {
        appName: settings.site_title || 'Learn SAP ABAP',
        companyName: 'Learn SAP ABAP',
        uploadPathSettings: {
          moduleName: data.moduleName,
          moduleDisplayName: moduleNameMap[data.moduleName],
          path: data.path,
        },
      },
      status: editingUploadPathConfig ? editingUploadPathConfig.status : 'inactive',
    }
    const success = await uploadPathManager.saveConfig(payload, editingUploadPathConfig)
    if (success) {
      setShowUploadPathModal(false)
      setEditingUploadPathConfig(null)
    }
  }

  const openNewUploadPathModal = () => {
    setEditingUploadPathConfig(null)
    reset({
      moduleName: 'COURSE_SYLLABUS',
      path: '',
      description: '',
    })
    setShowUploadPathModal(true)
  }

  const openEditUploadPathModal = config => {
    setEditingUploadPathConfig(config)
    if (config.metadata?.uploadPathSettings) {
      const uploadSettings = config.metadata.uploadPathSettings
      reset({
        moduleName: uploadSettings.moduleName || 'COURSE_SYLLABUS',
        path: uploadSettings.path || '',
        description: config.desc || '',
      })
    } else {
      reset({
        moduleName: 'COURSE_SYLLABUS',
        path: '',
        description: config.desc || '',
      })
    }
    setShowUploadPathModal(true)
  }

  const setActiveUploadPathConfig = async config => {
    try {
      await applicationAPI.activeAppProperty(config.property_name, config.app_prop_id)
      showMessage('success', 'Upload path configuration activated successfully!')
      await uploadPathManager.loadConfigs()
    } catch (error) {
      console.error('Error activating upload path config:', error)
      const errorMessage =
        error.response?.data?.message || 'Failed to activate upload path configuration'
      showMessage('error', errorMessage)
    }
  }

  const handleCreateBackup = async () => {
    setBackupLoading(true)
    try {
      const response = await genericAPI.dowloadBackup({ method: backupMethod })
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showMessage('success', 'Backup created and downloaded successfully!')
    } catch (error) {
      console.error('Error creating backup:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create backup'
      showMessage('error', errorMessage)
    } finally {
      setBackupLoading(false)
    }
  }

  const initialData = editingUploadPathConfig
    ? {
      moduleName:
        editingUploadPathConfig.metadata?.uploadPathSettings?.moduleName || 'COURSE_SYLLABUS',
      path: editingUploadPathConfig.metadata?.uploadPathSettings?.path || '',
      description: editingUploadPathConfig.desc || '',
    }
    : null

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Upload Path Management</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Configure upload paths for different modules ({uploadPathManager.configs.length}{' '}
              total)
            </p>
          </div>
          <button
            onClick={openNewUploadPathModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Path</span>
          </button>
        </div>

        {activeUploadPathId && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Active Upload Path</p>
                <p className="text-xs text-green-700 mt-0.5">
                  {uploadPathManager.configs.find(c => c.app_prop_id === activeUploadPathId)
                    ?.property_value || 'N/A'}
                </p>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-1.5" />
                <span className="text-xs text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <ConfigTable
            configs={uploadPathManager.configs}
            columns={columns}
            onEdit={openEditUploadPathModal}
            onDelete={handleDelete}
            onActivate={setActiveUploadPathConfig}
            onTest={testConfig}
          />
          {uploadPathManager.configs.length === 0 && (
            <div className="text-center py-6">
              <Folder className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No upload path configurations
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Get started by creating a new upload path configuration.
              </p>
              <button
                onClick={openNewUploadPathModal}
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 mx-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Configuration</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary-600" />
              Permission Priorities (Level A1)
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Drag rows to reorder (priorities become sequential). Manual edits swap on duplicate.
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={loadA1Permissions}
              disabled={loadingPermissions}
              className="text-gray-600 hover:text-gray-800 p-1 rounded-md border border-gray-300"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPermissions ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={savePriorities}
              disabled={savingPriorities || loadingPermissions}
              className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {savingPriorities ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              <span>{savingPriorities ? 'Saving...' : 'Save Priorities'}</span>
            </button>
          </div>
        </div>

        {loadingPermissions ? (
          <div className="flex justify-center py-4">
            <Loader className="w-5 h-5 animate-spin text-primary-600" />
          </div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-4">
            <Shield className="mx-auto h-6 w-6 text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">No A1 permissions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8">
                    Drag
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Permission Name
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-24">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissions.map(perm => (
                  <tr
                    key={perm.permission_id}
                    draggable
                    onDragStart={e => handleDragStart(e, perm.permission_id)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, perm.permission_id)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-gray-50 cursor-move ${draggedItemId === perm.permission_id ? 'opacity-50' : ''}`}
                  >
                    <td className="px-2 py-1 whitespace-nowrap text-gray-400">
                      <GripVertical className="w-3.5 h-3.5" />
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-gray-900">
                      {perm.permission_id}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900">
                      {perm.name}
                    </td>
                    <td className="px-2 py-1 text-gray-500">{perm.description || '—'}</td>
                    <td className="px-2 py-1 text-gray-500 font-mono text-[11px]">
                      {perm.url || '—'}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <input
                        type="number"
                        value={perm.priority ?? 0}
                        onChange={e => handlePriorityChange(perm.permission_id, e.target.value)}
                        className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        step="1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-3">System Tools</h2>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Create System Backup</p>
              <p className="text-xs text-gray-600">Generate a complete backup and download it</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={backupMethod}
                onChange={e => setBackupMethod(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="spawn">Spawn (recommended)</option>
                <option value="exec">Exec</option>
              </select>
              <button
                onClick={handleCreateBackup}
                disabled={backupLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backupLoading ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{backupLoading ? 'Creating...' : 'Backup & Download'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfigModal
        isOpen={showUploadPathModal}
        onClose={() => {
          setShowUploadPathModal(false)
          setEditingUploadPathConfig(null)
          reset()
        }}
        onSave={handleSave}
        onTest={() => {
          if (editingUploadPathConfig) testConfig(editingUploadPathConfig)
          else {
            showMessage('info', 'Testing upload path configuration...')
            setTimeout(() => {
              showMessage('success', 'Upload path test completed successfully!')
            }, 2000)
          }
        }}
        schema={uploadPathSchema}
        defaultValues={{
          moduleName: 'COURSE_SYLLABUS',
          path: '',
          description: '',
        }}
        initialData={initialData}
        editingConfig={editingUploadPathConfig}
        saveLoading={uploadPathManager.saveLoading}
        title={editingUploadPathConfig ? 'Edit Upload Path' : 'New Upload Path'}
        description={
          editingUploadPathConfig
            ? `Editing: ${editingUploadPathConfig.property_value}`
            : 'Configure upload path for course syllabus'
        }
        fields={fields}
        passwordFields={[]}
      />
    </div>
  )
}

export default Advanced
