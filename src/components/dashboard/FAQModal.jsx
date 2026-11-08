// src/components/HelpSupport/FAQModal.jsx
import React, { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { supportAPI } from '../../services/api'

const FAQModal = ({ show, faq, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        category: faq.category || 'general',
        is_active: faq.is_active !== undefined ? faq.is_active : true,
      })
    } else {
      setFormData({
        question: '',
        answer: '',
        category: 'general',
        is_active: true,
      })
    }
    setErrors({})
  }, [faq, show])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.question.trim()) newErrors.question = 'Question is required'
    if (!formData.answer.trim()) newErrors.answer = 'Answer is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (faq) {
        await supportAPI.updateFAQ(faq.faq_id, formData)
      } else {
        await supportAPI.createFAQ(formData)
      }
      onSaved()
      onClose()
    } catch (error) {
      console.error('Error saving FAQ:', error)
      setErrors({ submit: 'Failed to save FAQ. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {faq ? 'Edit FAQ' : 'Create New FAQ'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-3 space-y-3 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          {errors.submit && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Question *</label>
            <input
              type="text"
              name="question"
              value={formData.question}
              onChange={handleChange}
              className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${
                errors.question ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter the question"
            />
            {errors.question && <p className="text-red-600 text-xs mt-1">{errors.question}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="account">Account</option>
              <option value="course">Course</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Answer *</label>
            <textarea
              name="answer"
              rows={4}
              value={formData.answer}
              onChange={handleChange}
              className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${
                errors.answer ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter the answer"
            />
            {errors.answer && <p className="text-red-600 text-xs mt-1">{errors.answer}</p>}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3.5 h-3.5"
            />
            <label className="ml-2 text-xs text-gray-700">Active (visible to users)</label>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 border border-transparent rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : faq ? (
              'Update FAQ'
            ) : (
              'Create FAQ'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FAQModal
