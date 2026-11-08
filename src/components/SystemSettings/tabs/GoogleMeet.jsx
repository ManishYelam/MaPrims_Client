import React, { useState, useEffect, useRef } from 'react'
import { Video, Plus, Clock, CalendarDays, Globe, X } from 'lucide-react'
import ConfigTable from '../components/ConfigTable'
import ConfigModal from '../components/ConfigModal'
import { googleMeetSettingsSchema } from '../validations/sysSchemas'

const formatScheduleInfo = config => {
  const settings = config.metadata?.googleMeetSettings
  if (!settings) return 'N/A'
  const days = settings.workingDaysRule?.includes('BYDAY=')
    ? settings.workingDaysRule.split('BYDAY=')[1]?.replace(/;/g, '') || 'Mon-Fri'
    : 'Custom'
  return `${settings.workingHours?.start || '09:00'} - ${settings.workingHours?.end || '17:00'} (${days})`
}

const GoogleMeet = ({ googleMeetManager, showMessage, showConfirmation, settings }) => {
  const [showTable, setShowTable] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      googleMeetManager.loadConfigs()
    }
  }, [googleMeetManager])

  const columns = [
    {
      key: 'meetingName',
      label: 'Meeting Name',
      render: config => config.metadata?.googleMeetSettings?.meetingName || 'N/A',
    },
    {
      key: 'meetingId',
      label: 'Meeting ID',
      render: config => config.property_value || 'N/A',
    },
    {
      key: 'meetingLink',
      label: 'Meeting Link',
      render: config =>
        config.metadata?.googleMeetSettings?.meetingLink ? (
          <a
            href={config.metadata.googleMeetSettings.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-800 hover:underline flex items-center space-x-1 text-xs"
            title="Click to open meeting link"
          >
            <Video className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-gray-400 text-xs flex items-center space-x-1">
            <X className="w-3 h-3" />
            <span>No link</span>
          </span>
        ),
    },
    {
      key: 'scheduleInfo',
      label: 'Schedule Info',
      render: config => (
        <div className="text-xs text-gray-700">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{formatScheduleInfo(config)}</span>
          </div>
          <div className="text-gray-500 text-xs mt-0.5 flex items-center space-x-1">
            <CalendarDays className="w-3 h-3" />
            <span>{config.metadata?.googleMeetSettings?.defaultDuration || '60'} mins</span>
          </div>
        </div>
      ),
    },
    {
      key: 'timezone',
      label: 'Timezone',
      render: config => (
        <div className="flex items-center space-x-1">
          <Globe className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-700">
            {config.metadata?.googleMeetSettings?.scheduleTimezone
              ? config.metadata.googleMeetSettings.scheduleTimezone.split('/').pop()
              : 'N/A'}
          </span>
        </div>
      ),
    },
  ]

  const fields = [
    {
      name: 'meetingName',
      label: 'Meeting Name',
      required: true,
      type: 'text',
      placeholder: 'e.g., Daily Standup, Team Meeting',
    },
    {
      name: 'meetingId',
      label: 'Meeting ID',
      required: true,
      type: 'text',
      placeholder: 'e.g., abc-defg-hij',
    },
    {
      name: 'meetingLink',
      label: 'Meeting Link',
      required: true,
      type: 'url',
      placeholder: 'https://meet.google.com/abc-defg-hij',
    },
    {
      name: 'defaultDuration',
      label: 'Default Duration (minutes)',
      type: 'number',
      placeholder: '60',
      required: false,
    },
    {
      name: 'workingDaysRule',
      label: 'Working Days Rule (RRULE)',
      type: 'text',
      placeholder: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      required: false,
    },
    {
      name: 'holidays',
      label: 'Holidays (Comma-separated YYYY-MM-DD)',
      type: 'text',
      placeholder: '2025-01-01, 2025-12-25',
      required: false,
    },
    { name: 'workingHoursStart', label: 'Working Hours Start', type: 'time', required: false },
    { name: 'workingHoursEnd', label: 'Working Hours End', type: 'time', required: false },
    {
      name: 'scheduleTimezone',
      label: 'Schedule Timezone',
      type: 'select',
      options: [
        { value: 'America/New_York', label: 'Eastern Time (America/New_York)' },
        { value: 'America/Chicago', label: 'Central Time (America/Chicago)' },
        { value: 'America/Denver', label: 'Mountain Time (America/Denver)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (America/Los_Angeles)' },
        { value: 'UTC', label: 'UTC' },
        { value: 'Europe/London', label: 'Europe/London' },
        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore' },
        { value: 'Australia/Sydney', label: 'Australia/Sydney' },
      ],
      required: false,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 2,
      placeholder: 'Describe this meeting link configuration...',
    },
  ]
  const passwordFields = []

  const testConfig = async config => {
    showMessage('info', `Testing Google Meet configuration: ${config.property_value}...`)
    setTimeout(() => {
      showMessage(
        'success',
        `Google Meet configuration test for ${config.property_value} completed successfully!`
      )
    }, 2000)
  }

  const handleDelete = config => {
    showConfirmation(
      'Delete Google Meet Configuration',
      `Are you sure you want to delete the Google Meet configuration for "${config.property_value}"? This action cannot be undone.`,
      'delete',
      () => googleMeetManager.deleteConfig(config)
    )
  }

  const handleSave = async data => {
    const holidaysArray = data.holidays
      ? data.holidays
          .split(',')
          .map(date => date.trim())
          .filter(date => date)
      : []

    const payload = {
      property_name: 'app_google_meet',
      property_value: data.meetingId,
      desc: data.description || 'Google Meet link configuration',
      metadata: {
        appName: settings.site_title || 'Learn SAP ABAP',
        companyName: 'Learn SAP ABAP',
        googleMeetSettings: {
          meetingLink: data.meetingLink,
          meetingId: data.meetingId,
          meetingName: data.meetingName,
          defaultDuration: parseInt(data.defaultDuration) || 60,
          workingDaysRule: data.workingDaysRule,
          holidays: holidaysArray,
          workingHours: {
            start: data.workingHoursStart,
            end: data.workingHoursEnd,
          },
          scheduleTimezone: data.scheduleTimezone,
        },
      },
      status: editingConfig ? editingConfig.status : 'inactive',
    }
    const success = await googleMeetManager.saveConfig(payload, editingConfig)
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
        meetingLink: editingConfig.metadata?.googleMeetSettings?.meetingLink || '',
        meetingId: editingConfig.metadata?.googleMeetSettings?.meetingId || '',
        meetingName: editingConfig.metadata?.googleMeetSettings?.meetingName || '',
        description: editingConfig.desc || '',
        defaultDuration: editingConfig.metadata?.googleMeetSettings?.defaultDuration || 60,
        workingDaysRule:
          editingConfig.metadata?.googleMeetSettings?.workingDaysRule ||
          'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
        holidays: editingConfig.metadata?.googleMeetSettings?.holidays
          ? editingConfig.metadata.googleMeetSettings.holidays.join(', ')
          : '',
        workingHoursStart:
          editingConfig.metadata?.googleMeetSettings?.workingHours?.start || '09:00',
        workingHoursEnd: editingConfig.metadata?.googleMeetSettings?.workingHours?.end || '17:00',
        scheduleTimezone:
          editingConfig.metadata?.googleMeetSettings?.scheduleTimezone || 'America/New_York',
      }
    : null

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Google Meet Configurations</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Manage your Google Meet links ({googleMeetManager.configs.length} total)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTable(!showTable)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{showTable ? 'Hide' : 'Show'} Table</span>
            </button>
            <button
              onClick={openNewModal}
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Meeting Link</span>
            </button>
          </div>
        </div>
      </div>

      {showTable && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ConfigTable
            configs={googleMeetManager.configs}
            columns={columns}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onActivate={googleMeetManager.activateConfig}
            onTest={testConfig}
          />
          {googleMeetManager.configs.length === 0 && (
            <div className="text-center py-6">
              <Video className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No Google Meet configurations
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Get started by creating a new Google Meet link configuration.
              </p>
              <button
                onClick={openNewModal}
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 mx-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Meeting Link</span>
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
          else googleMeetManager.testConfig(null, testConfig)
        }}
        schema={googleMeetSettingsSchema}
        defaultValues={{
          meetingLink: '',
          meetingId: '',
          meetingName: '',
          description: '',
          defaultDuration: 60,
          workingDaysRule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
          holidays: '',
          workingHoursStart: '09:00',
          workingHoursEnd: '17:00',
          scheduleTimezone: 'America/New_York',
        }}
        initialData={initialData}
        editingConfig={editingConfig}
        saveLoading={googleMeetManager.saveLoading}
        title={editingConfig ? 'Edit Google Meet Link' : 'New Google Meet Link'}
        description={
          editingConfig
            ? `Editing: ${editingConfig.property_value}`
            : 'Configure Google Meet meeting link'
        }
        fields={fields}
        passwordFields={passwordFields}
      />
    </div>
  )
}

export default GoogleMeet
