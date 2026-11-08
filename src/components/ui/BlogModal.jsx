// src/components/ui/BlogModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Tag, Clock, Eye, Heart, Calendar } from 'lucide-react'
import { blogAPI } from '../../services/api'

const BlogModal = ({ show, blog, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    tags: [],
    read_time: 5,
    status: 'draft',
    is_published: false,
    category_id: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: ''
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        excerpt: blog.excerpt || '',
        content: blog.content || '',
        featured_image: blog.featured_image || '',
        tags: blog.tags || [],
        read_time: blog.read_time || 5,
        status: blog.status || (blog.is_published ? 'published' : 'draft'),
        is_published: blog.is_published || false,
        category_id: blog.category_id || '',
        meta_title: blog.meta_title || '',
        meta_description: blog.meta_description || '',
        meta_keywords: blog.meta_keywords || ''
      })
      setTagInput((blog.tags || []).join(', '))
    } else {
      setFormData({
        title: '', slug: '', excerpt: '', content: '', featured_image: '', tags: [], read_time: 5,
        status: 'draft', is_published: false, category_id: '', meta_title: '', meta_description: '', meta_keywords: ''
      })
      setTagInput('')
    }
    setErrors({})
    setSaveError(null)
  }, [blog, show])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleTagsChange = (e) => {
    const raw = e.target.value
    setTagInput(raw)
    const tagsArray = raw.split(',').map(t => t.trim()).filter(t => t)
    setFormData(prev => ({ ...prev, tags: tagsArray }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.content.trim()) newErrors.content = 'Content is required'
    if (!formData.slug.trim()) {
      // Auto-generate slug from title if not provided
      const autoSlug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug: autoSlug }))
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
        slug: formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        featured_image: formData.featured_image,
        tags: formData.tags,
        read_time: parseInt(formData.read_time) || 5,
        status: formData.status,
        is_published: formData.status === 'published',
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        meta_keywords: formData.meta_keywords
      }

      if (blog?.blog_id) {
        await blogAPI.update(blog.blog_id, payload)
      } else {
        await blogAPI.create(payload)
      }
      onSaved()
    } catch (err) {
      console.error('Error saving blog:', err)
      setSaveError(err.response?.data?.message || err.message || 'Failed to save blog')
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">
            {blog ? 'Edit Blog' : 'Create New Blog'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
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
              placeholder="Blog post title"
              disabled={saving}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.title}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="auto-generated from title"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from title</p>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (short summary)</label>
            <textarea
              name="excerpt"
              rows="2"
              value={formData.excerpt}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="Brief description (max 500 chars)"
              disabled={saving}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              rows="8"
              value={formData.content}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Blog content in HTML or Markdown"
              disabled={saving}
            />
            {errors.content && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.content}</p>}
          </div>

          {/* Featured Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
            <input
              type="url"
              name="featured_image"
              value={formData.featured_image}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="https://example.com/image.jpg"
              disabled={saving}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagInput}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="react, javascript, web development"
              disabled={saving}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                  <Tag className="w-3 h-3 mr-1"/> {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Read Time & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Read Time (minutes)</label>
              <input
                type="number"
                name="read_time"
                value={formData.read_time}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
              <input
                type="number"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Optional"
                disabled={saving}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              disabled={saving}
            >
              <option value="draft">Draft</option>
              <option value="published">Published (visible to public)</option>
              <option value="scheduled">Scheduled (requires scheduled_publish_at)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* SEO Meta */}
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-800 mb-2">SEO & Meta</h4>
            <div className="space-y-3">
              <input type="text" name="meta_title" value={formData.meta_title} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Meta Title (leave empty to use title)"/>
              <textarea name="meta_description" rows="2" value={formData.meta_description} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Meta Description"/>
              <input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Meta Keywords (comma separated)"/>
            </div>
          </div>

          {/* Save Error */}
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {saveError}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {saving ? 'Saving...' : (blog ? 'Update Blog' : 'Create Blog')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BlogModal