import React, { useState, useEffect, useCallback } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { proposalAPI } from '../../services/api'

const ProposalsModal = ({ show, proposal, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    description: '',
    status: 'draft',
    total_amount: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Populate form when editing
  useEffect(() => {
    if (proposal) {
      setFormData({
        title: proposal.title || '',
        client_name: proposal.client_name || '',
        description: proposal.description || '',
        status: proposal.status || 'draft',
        total_amount: proposal.total_amount?.toString() || '',
      })
    } else {
      setFormData({
        title: '',
        client_name: '',
        description: '',
        status: 'draft',
        total_amount: '',
      })
    }
    setErrors({})
    setSaveError(null)
  }, [proposal, show])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.client_name.trim()) newErrors.client_name = 'Client name is required'
    if (formData.total_amount && isNaN(parseFloat(formData.total_amount))) {
      newErrors.total_amount = 'Total amount must be a number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setSaveError(null)

    try {
      const payload = {
        title: formData.title.trim(),
        client_name: formData.client_name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : 0,
      }

      if (proposal?.proposal_id) {
        // Update existing
        await proposalAPI.update(proposal.proposal_id, payload)
      } else {
        // Create new
        await proposalAPI.create(payload)
      }
      onSaved()
    } catch (err) {
      console.error('Error saving proposal:', err)
      setSaveError(err.response?.data?.message || err.message || 'Failed to save proposal')
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {proposal ? 'Edit Proposal' : 'Create New Proposal'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Website Redesign Proposal"
              disabled={saving}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${
                errors.client_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., ABC Corporation"
              disabled={saving}
            />
            {errors.client_name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.client_name}
              </p>
            )}
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount (₹)
            </label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${
                errors.total_amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 25000"
              min="0"
              step="0.01"
              disabled={saving}
            />
            {errors.total_amount && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.total_amount}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              disabled={saving}
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="Detailed description of the proposal..."
              disabled={saving}
            />
          </div>

          {/* Save Error */}
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {saveError}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {saving ? 'Saving...' : (proposal ? 'Update Proposal' : 'Create Proposal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProposalsModal