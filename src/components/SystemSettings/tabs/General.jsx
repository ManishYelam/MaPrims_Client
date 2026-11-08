import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Save } from 'lucide-react'
import { applicationAPI } from '../../../services/api'
import { generalSettingsSchema } from '../validations/sysSchemas'

const General = ({ settings, showMessage }) => {
  const [saveLoading, setSaveLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(generalSettingsSchema),
    defaultValues: {
      siteName: settings.site_title || '',
      siteDescription: settings.site_description || '',
      contactEmail: settings.contact_email || '',
    },
  })

  const saveGeneralSettings = async data => {
    setSaveLoading(true)
    try {
      const propertiesToSave = [
        {
          property_name: 'site_title',
          property_value: data.siteName || '',
          desc: 'Website title and name',
        },
        {
          property_name: 'site_description',
          property_value: data.siteDescription || '',
          desc: 'Website description',
        },
        {
          property_name: 'contact_email',
          property_value: data.contactEmail || '',
          desc: 'Contact email address',
        },
      ]
      const savePromises = propertiesToSave.map(property =>
        applicationAPI.createOrUpdateProperty(property)
      )
      await Promise.all(savePromises)
      showMessage('success', 'General settings saved successfully!')
    } catch (error) {
      console.error('Error saving general settings:', error)
      showMessage('error', 'Failed to save general settings')
    } finally {
      setSaveLoading(false)
    }
  }

  const onSubmit = async data => {
    await saveGeneralSettings(data)
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h2 className="text-base font-semibold text-gray-900 mb-3">General Settings</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Site Name *</label>
          <input
            type="text"
            {...register('siteName')}
            className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              errors.siteName ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter site name"
          />
          {errors.siteName && (
            <p className="mt-1 text-xs text-red-600">{errors.siteName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Site Description *
          </label>
          <textarea
            {...register('siteDescription')}
            rows="2"
            className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              errors.siteDescription ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter site description"
          />
          {errors.siteDescription && (
            <p className="mt-1 text-xs text-red-600">{errors.siteDescription.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Email *</label>
          <input
            type="email"
            {...register('contactEmail')}
            className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              errors.contactEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter contact email"
          />
          {errors.contactEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saveLoading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saveLoading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default General
