import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { X, Eye, EyeOff, Save, Activity } from 'lucide-react'

const ConfigModal = ({
  isOpen,
  onClose,
  onSave,
  onTest,
  schema,
  defaultValues,
  initialData,
  editingConfig,
  saveLoading,
  title,
  description,
  fields,
  passwordFields = [],
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  })

  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData)
      } else {
        reset(defaultValues)
      }
    }
  }, [isOpen, initialData, reset, defaultValues])

  if (!isOpen) return null

  const togglePassword = field => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const renderField = field => {
    const isPassword = passwordFields.includes(field.name)
    const hasError = errors[field.name]

    return (
      <div key={field.name}>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          {field.label} {field.required && '*'}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            {...register(field.name)}
            rows={field.rows || 2}
            className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder={field.placeholder}
          />
        ) : field.type === 'select' ? (
          <select
            {...register(field.name)}
            className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : isPassword ? (
          <div className="relative">
            <input
              type={showPasswords[field.name] ? 'text' : 'password'}
              {...register(field.name)}
              className={`w-full pl-2.5 pr-8 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={field.placeholder}
            />
            <button
              type="button"
              onClick={() => togglePassword(field.name)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              {showPasswords[field.name] ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <input
            type={field.type || 'text'}
            {...register(field.name)}
            className={`w-full px-2.5 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder={field.placeholder}
          />
        )}
        {hasError && <p className="mt-1 text-xs text-red-600">{errors[field.name]?.message}</p>}
      </div>
    )
  }

  const onSubmit = async data => {
    await onSave(data)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map(renderField)}

            {/* Status Toggle for Editing */}
            {editingConfig && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p className="text-xs text-gray-600">Set as active</p>
                </div>
                <button
                  type="button"
                  onClick={() => {}}
                  // We'll handle status via separate logic in parent if needed
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-gray-300"
                >
                  <span className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform translate-x-1" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {onTest && (
                <button
                  type="button"
                  onClick={onTest}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Test</span>
                </button>
              )}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveLoading ? 'Saving...' : editingConfig ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ConfigModal
