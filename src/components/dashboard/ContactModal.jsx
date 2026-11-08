// src/components/dashboard/ContactModal.jsx
import React, { useState, useEffect } from 'react'
import {
  X,
  Mail,
  User,
  Calendar,
  MessageCircle,
  Flag,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { contactAPI } from '../../services/api'

const ContactModal = ({ show, contact, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: '',
    admin_remarks: '',
    is_read: false,
  })

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        status: contact.status || 'Pending',
        admin_remarks: contact.admin_remarks || '',
        is_read: contact.is_read || false,
      })
    }
  }, [contact])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!contact) return

    setLoading(true)
    try {
      // Update status if changed
      if (formData.status !== contact.status) {
        await contactAPI.updateStatus(contact.contact_id, {
          status: formData.status,
          is_read: formData.is_read,
        })
      }

      // Update remarks if changed
      if (formData.admin_remarks !== contact.admin_remarks) {
        await contactAPI.updateRemarks(contact.contact_id, {
          admin_remarks: formData.admin_remarks,
        })
      }

      onSaved()
    } catch (error) {
      console.error('Error updating contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const getStatusColor = status => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = priority => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Medium':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = status => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />
      case 'Reviewed':
        return <AlertCircle className="w-4 h-4" />
      case 'Resolved':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Contact Message Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {contact ? (
            <div className="space-y-4">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {contact.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-500">Contact Person</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {contact.email}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Submitted: {new Date(contact.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(contact.status)}`}
                    >
                      {getStatusIcon(contact.status)}
                      {contact.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Priority:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(contact.priority)}`}
                    >
                      <Flag className="w-3 h-3" />
                      {contact.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Read Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        contact.is_read
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {contact.is_read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject */}
              {contact.subject && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Subject</h4>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {contact.subject}
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {contact.message}
                </div>
              </div>

              {/* Admin Remarks */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Remarks</h4>
                <textarea
                  value={formData.admin_remarks}
                  onChange={e => handleInputChange('admin_remarks', e.target.value)}
                  placeholder="Add your remarks or notes about this contact..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows="3"
                />
              </div>

              {/* Response Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="markAsRead"
                    checked={formData.is_read}
                    onChange={e => handleInputChange('is_read', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500"
                  />
                  <label htmlFor="markAsRead" className="text-sm text-gray-700">
                    Mark as read
                  </label>
                </div>
              </div>

              {/* Responded At */}
              {contact.responded_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Responded: {new Date(contact.responded_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No contact data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          >
            Cancel
          </button>

          {contact && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContactModal
