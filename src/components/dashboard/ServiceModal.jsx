// src/pages/dashboard/components/ServiceModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Save,
  Send,
  FileArchive,
  Briefcase,
  DollarSign,
  Clock,
  Package,
  Plus,
  Trash2,
  Upload as UploadIcon,
  Eye,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  Heart,
  Star,
  MessageSquare,
  Gift,
  Truck,
  Settings,
} from 'lucide-react'
import { servicesAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Default metadata structure (constant, never changes)
const DEFAULT_METADATA = {
  pricing: {
    basic: {
      price: 0,
      delivery_days: 5,
      features: [],
      description: '',
      max_revisions: 0,
      support_level: 'email',
      popular: false,
      included_services: [],
      discount_percentage: 0,
    },
    standard: {
      price: 0,
      delivery_days: 3,
      features: [],
      description: '',
      max_revisions: 0,
      support_level: 'email',
      popular: false,
      included_services: [],
      discount_percentage: 0,
    },
    premium: {
      price: 0,
      delivery_days: 1,
      features: [],
      description: '',
      max_revisions: 0,
      support_level: 'email',
      popular: false,
      included_services: [],
      discount_percentage: 0,
    },
  },
  fast_delivery_options: {
    enabled: false,
    options: [
      { id: 'fast_basic', name: 'Fast Basic', extra_price: 0, delivery_days: 0, description: '' },
      {
        id: 'fast_express',
        name: 'Fast Express',
        extra_price: 0,
        delivery_days: 0,
        description: '',
      },
      {
        id: 'fast_premium',
        name: 'Fast Premium',
        extra_price: 0,
        delivery_days: 0,
        description: '',
      },
    ],
  },
  tip_payment: {
    enabled: false,
    percentages: [5, 10, 15],
  },
  extra_services: [],
  faqs: [],
}

const supportLevels = [
  { value: 'email', label: 'Email Only', icon: MessageSquare },
  { value: 'chat', label: 'Email + Chat', icon: MessageSquare },
  { value: 'priority', label: 'Priority Support', icon: Zap },
  { value: '24/7', label: '24/7 Priority', icon: Heart },
]

const ServiceModal = ({ show, service, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [expandedSection, setExpandedSection] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const galleryInputRef = useRef(null)

  // Form state – no `status` field because it's determined by the action button
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    is_active: true,
    thumbnail_image: '',
    gallery: [],
    metadata: JSON.stringify(DEFAULT_METADATA, null, 2),
  })

  // Helper: safely parse metadata
  const getParsedMetadata = useCallback(() => {
    try {
      return JSON.parse(formData.metadata)
    } catch {
      return DEFAULT_METADATA
    }
  }, [formData.metadata])

  // Generic metadata updater
  const updateMetadata = useCallback(updater => {
    setFormData(prev => {
      let metadata
      try {
        metadata = JSON.parse(prev.metadata)
      } catch {
        metadata = JSON.parse(JSON.stringify(DEFAULT_METADATA))
      }
      const newMetadata = updater(metadata)
      return { ...prev, metadata: JSON.stringify(newMetadata, null, 2) }
    })
  }, [])

  // --- Pricing validation helpers ---
  const validatePricing = useCallback((metadata, tier, field, newValue) => {
    const pricing = metadata.pricing
    if (!pricing) return true
    const basic = pricing.basic || DEFAULT_METADATA.pricing.basic
    const standard = pricing.standard || DEFAULT_METADATA.pricing.standard
    const premium = pricing.premium || DEFAULT_METADATA.pricing.premium

    if (field === 'price') {
      if (tier === 'basic' && newValue > standard.price) {
        toast.error('Basic price cannot exceed Standard price')
        return false
      }
      if (tier === 'standard') {
        if (newValue < basic.price) {
          toast.error('Standard price cannot be less than Basic price')
          return false
        }
        if (newValue > premium.price) {
          toast.error('Standard price cannot exceed Premium price')
          return false
        }
      }
      if (tier === 'premium' && newValue < standard.price) {
        toast.error('Premium price cannot be less than Standard price')
        return false
      }
    }
    if (field === 'delivery_days') {
      if (tier === 'basic' && newValue < standard.delivery_days) {
        toast.error('Basic delivery days cannot be less than Standard (faster)')
        return false
      }
      if (tier === 'standard') {
        if (newValue > basic.delivery_days) {
          toast.error('Standard delivery days cannot be more than Basic (slower)')
          return false
        }
        if (newValue < premium.delivery_days) {
          toast.error('Standard delivery days cannot be less than Premium (faster)')
          return false
        }
      }
      if (tier === 'premium' && newValue > standard.delivery_days) {
        toast.error('Premium delivery days cannot be more than Standard (slower)')
        return false
      }
    }
    return true
  }, [])

  // Update a field in a pricing tier (with validation)
  const updateTierField = useCallback(
    (tier, field, value) => {
      if (
        ['price', 'delivery_days', 'max_revisions', 'discount_percentage'].includes(field) &&
        value < 0
      ) {
        toast.error(`${field} cannot be negative`)
        return
      }
      updateMetadata(meta => {
        if (!validatePricing(meta, tier, field, value)) return meta
        if (!meta.pricing) meta.pricing = DEFAULT_METADATA.pricing
        if (!meta.pricing[tier]) meta.pricing[tier] = { ...DEFAULT_METADATA.pricing[tier] }
        meta.pricing[tier][field] = value
        return meta
      })
    },
    [updateMetadata, validatePricing]
  )

  // Helper to get current value from a tier
  const getTierField = useCallback(
    (tier, field) => {
      const meta = getParsedMetadata()
      return (
        meta.pricing?.[tier]?.[field] ??
        (field === 'features' || field === 'included_services' ? [] : '')
      )
    },
    [getParsedMetadata]
  )

  // Features & Included services helpers
  const addFeature = useCallback(
    tier => {
      updateMetadata(meta => {
        meta.pricing[tier].features.push('')
        return meta
      })
    },
    [updateMetadata]
  )

  const updateFeature = useCallback(
    (tier, idx, value) => {
      updateMetadata(meta => {
        meta.pricing[tier].features[idx] = value
        return meta
      })
    },
    [updateMetadata]
  )

  const removeFeature = useCallback(
    (tier, idx) => {
      updateMetadata(meta => {
        meta.pricing[tier].features.splice(idx, 1)
        return meta
      })
    },
    [updateMetadata]
  )

  const addIncludedService = useCallback(
    tier => {
      updateMetadata(meta => {
        meta.pricing[tier].included_services.push('')
        return meta
      })
    },
    [updateMetadata]
  )

  const updateIncludedService = useCallback(
    (tier, idx, value) => {
      updateMetadata(meta => {
        meta.pricing[tier].included_services[idx] = value
        return meta
      })
    },
    [updateMetadata]
  )

  const removeIncludedService = useCallback(
    (tier, idx) => {
      updateMetadata(meta => {
        meta.pricing[tier].included_services.splice(idx, 1)
        return meta
      })
    },
    [updateMetadata]
  )

  // Fast delivery helpers
  const getFastDeliveryOptions = useCallback(() => {
    const meta = getParsedMetadata()
    return meta.fast_delivery_options || DEFAULT_METADATA.fast_delivery_options
  }, [getParsedMetadata])

  const updateFastDeliveryOption = useCallback(
    (optionId, field, value) => {
      if (field === 'extra_price' && value < 0) {
        toast.error('Extra price cannot be negative')
        return
      }
      if (field === 'delivery_days' && value < 0) {
        toast.error('Delivery days cannot be negative')
        return
      }
      updateMetadata(meta => {
        const opt = meta.fast_delivery_options.options.find(o => o.id === optionId)
        if (opt) opt[field] = value
        return meta
      })
    },
    [updateMetadata]
  )

  const toggleFastDeliveryEnabled = useCallback(
    enabled => {
      updateMetadata(meta => {
        meta.fast_delivery_options.enabled = enabled
        return meta
      })
    },
    [updateMetadata]
  )

  // Tip payment helpers
  const getTipPayment = useCallback(() => {
    const meta = getParsedMetadata()
    return meta.tip_payment || DEFAULT_METADATA.tip_payment
  }, [getParsedMetadata])

  const toggleTipEnabled = useCallback(
    enabled => {
      updateMetadata(meta => {
        meta.tip_payment.enabled = enabled
        return meta
      })
    },
    [updateMetadata]
  )

  const updateTipPercentages = useCallback(
    percentages => {
      updateMetadata(meta => {
        meta.tip_payment.percentages = percentages
        return meta
      })
    },
    [updateMetadata]
  )

  // Extra services helpers
  const getExtraServices = useCallback(() => {
    const meta = getParsedMetadata()
    return meta.extra_services || []
  }, [getParsedMetadata])

  const addExtraService = useCallback(() => {
    updateMetadata(meta => {
      meta.extra_services.push({ name: '', price: 0, description: '' })
      return meta
    })
  }, [updateMetadata])

  const updateExtraService = useCallback(
    (idx, field, value) => {
      updateMetadata(meta => {
        meta.extra_services[idx][field] = value
        return meta
      })
    },
    [updateMetadata]
  )

  const removeExtraService = useCallback(
    idx => {
      updateMetadata(meta => {
        meta.extra_services.splice(idx, 1)
        return meta
      })
    },
    [updateMetadata]
  )

  // FAQ helpers
  const getFaqs = useCallback(() => {
    const meta = getParsedMetadata()
    return meta.faqs || []
  }, [getParsedMetadata])

  const addFaq = useCallback(() => {
    updateMetadata(meta => {
      meta.faqs.push({ question: '', answer: '', order: meta.faqs.length + 1 })
      return meta
    })
  }, [updateMetadata])

  const updateFaq = useCallback(
    (idx, field, value) => {
      updateMetadata(meta => {
        meta.faqs[idx][field] = value
        return meta
      })
    },
    [updateMetadata]
  )

  const removeFaq = useCallback(
    idx => {
      updateMetadata(meta => {
        meta.faqs.splice(idx, 1)
        return meta
      })
    },
    [updateMetadata]
  )

  // Load service data into form when modal opens or service changes
  useEffect(() => {
    if (!show) return

    if (service?.service_id) {
      setFormData({
        title: service.title || '',
        description: service.description || '',
        short_description: service.short_description || '',
        is_active: service.is_active ?? true,
        thumbnail_image: service.thumbnail_image || '',
        gallery: service.gallery || [],
        metadata: service.metadata
          ? (() => {
              try {
                const obj =
                  typeof service.metadata === 'string'
                    ? JSON.parse(service.metadata)
                    : service.metadata
                return JSON.stringify(obj, null, 2)
              } catch {
                return JSON.stringify(DEFAULT_METADATA, null, 2)
              }
            })()
          : JSON.stringify(DEFAULT_METADATA, null, 2),
      })
      if (service.gallery?.length) setGalleryPreviews(service.gallery)
      setGalleryFiles([])
    } else {
      setFormData({
        title: '',
        description: '',
        short_description: '',
        is_active: true,
        thumbnail_image: '',
        gallery: [],
        metadata: JSON.stringify(DEFAULT_METADATA, null, 2),
      })
      setGalleryFiles([])
      setGalleryPreviews([])
    }
    setValidationErrors({})
  }, [service?.service_id, show])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      galleryPreviews.forEach(url => {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [galleryPreviews])

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {}
    let isValid = true

    if (!formData.title?.trim()) {
      errors.title = 'Title is required'
      isValid = false
    }
    if (!formData.short_description?.trim()) {
      errors.short_description = 'Short description is required'
      isValid = false
    }
    if (!formData.description?.trim()) {
      errors.description = 'Description is required'
      isValid = false
    }
    if (!formData.thumbnail_image?.trim()) {
      errors.thumbnail_image = 'Thumbnail image URL is required'
      isValid = false
    }
    const hasGallery = formData.gallery.length > 0 || galleryFiles.length > 0
    if (!hasGallery) {
      errors.gallery = 'At least one gallery image is required'
      isValid = false
    }

    setValidationErrors(errors)
    if (!isValid) {
      const firstError = Object.values(errors)[0]
      if (firstError) toast.error(firstError)
      return false
    }
    return true
  }, [formData, galleryFiles])

  // Save handler – status is passed by the button
  const handleSaveService = useCallback(
    async actionStatus => {
      if (!validateForm()) return

      const savePromise = async () => {
        const apiFormData = new FormData()
        apiFormData.append('title', formData.title.trim())
        apiFormData.append('description', formData.description.trim())
        apiFormData.append('short_description', formData.short_description.trim())
        apiFormData.append('status', actionStatus)
        apiFormData.append('is_active', formData.is_active)
        apiFormData.append('thumbnail_image', formData.thumbnail_image.trim())

        let metadataObj
        try {
          metadataObj = JSON.parse(formData.metadata)
        } catch {
          metadataObj = DEFAULT_METADATA
        }
        apiFormData.append('metadata', JSON.stringify(metadataObj))

        if (galleryFiles.length) {
          galleryFiles.forEach(file => apiFormData.append('files', file))
        }

        const response = service
          ? await servicesAPI.update(service.service_id, apiFormData)
          : await servicesAPI.create(apiFormData)

        if (response.data?.success) {
          onSaved()
          return response.data
        }
        throw new Error(response.data?.error || 'Failed to save service')
      }

      try {
        setSaveLoading(true)
        await toast.promise(savePromise(), {
          loading:
            actionStatus === 'published'
              ? 'Publishing...'
              : actionStatus === 'draft'
                ? 'Saving...'
                : 'Archiving...',
          success: `Service ${
            actionStatus === 'published'
              ? 'published'
              : actionStatus === 'draft'
                ? 'saved as draft'
                : 'archived'
          } successfully!`,
          error: err => err.response?.data?.error || err.message || 'Failed to save service',
        })
      } catch (error) {
        // handled by toast
      } finally {
        setSaveLoading(false)
      }
    },
    [validateForm, formData, galleryFiles, service, onSaved]
  )

  // Gallery file handlers
  const handleGalleryUpload = useCallback(
    e => {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
      if (files.length === 0) {
        toast.error('Only image files are allowed')
        return
      }
      if (files.length + galleryFiles.length > 10) {
        toast.error('Maximum 10 gallery images allowed')
        return
      }
      const newPreviews = files.map(f => URL.createObjectURL(f))
      setGalleryFiles(prev => [...prev, ...files])
      setGalleryPreviews(prev => [...prev, ...newPreviews])
      toast.success(`${files.length} image(s) added`)
    },
    [galleryFiles]
  )

  const removeGalleryImage = useCallback(index => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index))
    setGalleryPreviews(prev => {
      const newPreviews = [...prev]
      if (newPreviews[index]?.startsWith('blob:')) URL.revokeObjectURL(newPreviews[index])
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }, [])

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }))
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    },
    [validationErrors]
  )

  const toggleSection = useCallback(section => {
    setExpandedSection(prev => (prev === section ? null : section))
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-5xl w-full h-[95vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b">
          <div>
            <h2 className="text-base font-semibold">
              {service ? 'Edit Service' : 'Create Service'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {service ? `Editing: ${service.title}` : 'Add service details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={saveLoading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Basic info row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                className={`w-full px-2.5 py-1.5 border rounded text-sm ${
                  validationErrors.title ? 'border-red-500' : ''
                }`}
                disabled={saveLoading}
              />
              {validationErrors.title && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.title}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Is Active</label>
              <div className="mt-1.5">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => handleInputChange('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="2"
                value={formData.short_description}
                onChange={e => handleInputChange('short_description', e.target.value)}
                className={`w-full px-2.5 py-1.5 border rounded text-sm resize-none ${
                  validationErrors.short_description ? 'border-red-500' : ''
                }`}
                disabled={saveLoading}
                maxLength={200}
              />
              {validationErrors.short_description && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.short_description}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Full Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className={`w-full px-2.5 py-1.5 border rounded text-sm resize-none ${
                  validationErrors.description ? 'border-red-500' : ''
                }`}
                disabled={saveLoading}
              />
              {validationErrors.description && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.description}</p>
              )}
            </div>
          </div>

          {/* Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Thumbnail as URL input */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Thumbnail Image URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.thumbnail_image}
                onChange={e => handleInputChange('thumbnail_image', e.target.value)}
                placeholder="https://example.com/thumbnail.jpg"
                className={`w-full px-2.5 py-1.5 border rounded text-sm ${
                  validationErrors.thumbnail_image ? 'border-red-500' : ''
                }`}
                disabled={saveLoading}
              />
              {validationErrors.thumbnail_image && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.thumbnail_image}</p>
              )}
              {formData.thumbnail_image && (
                <img
                  src={formData.thumbnail_image}
                  alt="Thumbnail preview"
                  className="mt-2 h-20 w-auto object-cover rounded border"
                  onError={e => (e.target.style.display = 'none')}
                />
              )}
            </div>

            {/* Gallery (file upload) */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Gallery Images <span className="text-red-500">*</span> (max 10)
              </label>
              <div
                className={`border-2 border-dashed rounded p-3 ${
                  validationErrors.gallery ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleGalleryUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="gallery-upload"
                  disabled={saveLoading}
                />
                {galleryPreviews.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {galleryPreviews.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{galleryPreviews.length} image(s)</span>
                      <label
                        htmlFor="gallery-upload"
                        className="cursor-pointer text-primary-600 hover:underline"
                      >
                        Add more
                      </label>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="gallery-upload" className="block text-center cursor-pointer">
                    <UploadIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">
                      Upload gallery images (JPEG, PNG, max 2MB each)
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-primary-600 text-white text-xs rounded">
                      Choose Files
                    </span>
                  </label>
                )}
                {validationErrors.gallery && (
                  <p className="text-xs text-red-600 mt-2">{validationErrors.gallery}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Tiers Section */}
          <div className="border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => toggleSection('pricing')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Pricing Tiers</span>
              </div>
              {expandedSection === 'pricing' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {expandedSection === 'pricing' && (
              <div className="p-3 space-y-4">
                {['basic', 'standard', 'premium'].map(tier => (
                  <div key={tier} className="border rounded p-3 bg-white">
                    <div className="flex items-center gap-2 mb-2 capitalize font-semibold text-sm">
                      {tier === 'basic' && <Package className="w-4 h-4 text-blue-500" />}
                      {tier === 'standard' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {tier === 'premium' && <Star className="w-4 h-4 text-yellow-500" />}
                      {tier}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={getTierField(tier, 'price')}
                          onChange={e =>
                            updateTierField(tier, 'price', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Delivery Days</label>
                        <input
                          type="number"
                          min="0"
                          value={getTierField(tier, 'delivery_days')}
                          onChange={e =>
                            updateTierField(tier, 'delivery_days', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Max Revisions</label>
                        <input
                          type="number"
                          min="0"
                          value={getTierField(tier, 'max_revisions')}
                          onChange={e =>
                            updateTierField(tier, 'max_revisions', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Support Level</label>
                        <select
                          value={getTierField(tier, 'support_level')}
                          onChange={e => updateTierField(tier, 'support_level', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          {supportLevels.map(s => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-600">Description</label>
                        <input
                          type="text"
                          value={getTierField(tier, 'description')}
                          onChange={e => updateTierField(tier, 'description', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-600 flex items-center justify-between">
                          Features
                          <button
                            type="button"
                            onClick={() => addFeature(tier)}
                            className="text-primary-600 text-xs flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </label>
                        {getTierField(tier, 'features').map((feat, idx) => (
                          <div key={idx} className="flex gap-1 mt-1">
                            <input
                              type="text"
                              value={feat}
                              onChange={e => updateFeature(tier, idx, e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                            <button
                              onClick={() => removeFeature(tier, idx)}
                              className="text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-600 flex items-center justify-between">
                          Included Services
                          <button
                            type="button"
                            onClick={() => addIncludedService(tier)}
                            className="text-primary-600 text-xs flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </label>
                        {getTierField(tier, 'included_services').map((serv, idx) => (
                          <div key={idx} className="flex gap-1 mt-1">
                            <input
                              type="text"
                              value={serv}
                              onChange={e => updateIncludedService(tier, idx, e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                            <button
                              onClick={() => removeIncludedService(tier, idx)}
                              className="text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={getTierField(tier, 'popular')}
                            onChange={e => updateTierField(tier, 'popular', e.target.checked)}
                          />{' '}
                          Popular
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          Discount %:{' '}
                          <input
                            type="number"
                            min="0"
                            value={getTierField(tier, 'discount_percentage')}
                            onChange={e =>
                              updateTierField(
                                tier,
                                'discount_percentage',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 px-1 py-0.5 border rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fast Delivery Options */}
          <div className="border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => toggleSection('fastDelivery')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span className="text-sm font-medium">Fast Delivery Options</span>
              </div>
              {expandedSection === 'fastDelivery' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {expandedSection === 'fastDelivery' && (
              <div className="p-3 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={getFastDeliveryOptions().enabled}
                    onChange={e => toggleFastDeliveryEnabled(e.target.checked)}
                  />{' '}
                  Enable Fast Delivery
                </label>
                {getFastDeliveryOptions().options.map(opt => (
                  <div key={opt.id} className="border rounded p-2 bg-gray-50">
                    <div className="font-medium text-sm capitalize mb-2">
                      {opt.id.replace('fast_', 'Fast ')}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs">Extra Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={opt.extra_price}
                          onChange={e =>
                            updateFastDeliveryOption(
                              opt.id,
                              'extra_price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs">Delivery Days</label>
                        <input
                          type="number"
                          min="0"
                          value={opt.delivery_days}
                          onChange={e =>
                            updateFastDeliveryOption(
                              opt.id,
                              'delivery_days',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs">Description</label>
                        <input
                          type="text"
                          value={opt.description}
                          onChange={e =>
                            updateFastDeliveryOption(opt.id, 'description', e.target.value)
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tip Payment Section */}
          <div className="border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => toggleSection('tipPayment')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="text-sm font-medium">Tip Payment</span>
              </div>
              {expandedSection === 'tipPayment' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {expandedSection === 'tipPayment' && (
              <div className="p-3 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={getTipPayment().enabled}
                    onChange={e => toggleTipEnabled(e.target.checked)}
                  />{' '}
                  Enable Tip Payment
                </label>
                <div>
                  <label className="text-xs block mb-1">Tip Percentages (comma separated)</label>
                  <input
                    type="text"
                    value={getTipPayment().percentages.join(',')}
                    onChange={e =>
                      updateTipPercentages(
                        e.target.value
                          .split(',')
                          .map(v => parseInt(v.trim()) || 0)
                          .filter(v => v > 0)
                      )
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="5,10,15"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Extra Services Section */}
          <div className="border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => toggleSection('extraServices')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Extra Services (Add-ons)</span>
              </div>
              {expandedSection === 'extraServices' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {expandedSection === 'extraServices' && (
              <div className="p-3 space-y-3">
                {getExtraServices().map((svc, idx) => (
                  <div key={idx} className="border rounded p-2 bg-gray-50">
                    <div className="flex gap-2 mb-2">
                      <input
                        placeholder="Name"
                        value={svc.name}
                        onChange={e => updateExtraService(idx, 'name', e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <input
                        placeholder="Price (₹)"
                        type="number"
                        min="0"
                        value={svc.price}
                        onChange={e =>
                          updateExtraService(idx, 'price', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-2 py-1 border rounded text-sm"
                      />
                      <button onClick={() => removeExtraService(idx)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      placeholder="Description"
                      value={svc.description}
                      onChange={e => updateExtraService(idx, 'description', e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm resize-none"
                      rows={1}
                    />
                  </div>
                ))}
                <button
                  onClick={addExtraService}
                  className="w-full border-dashed border-2 rounded p-2 text-primary-600 text-sm flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Extra Service
                </button>
              </div>
            )}
          </div>

          {/* FAQs Section */}
          <div className="border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() => toggleSection('faqs')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">FAQs</span>
              </div>
              {expandedSection === 'faqs' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {expandedSection === 'faqs' && (
              <div className="p-3 space-y-3">
                {getFaqs().map((faq, idx) => (
                  <div key={idx} className="border rounded p-2 bg-gray-50">
                    <div className="flex gap-2 mb-2">
                      <input
                        placeholder="Question"
                        value={faq.question}
                        onChange={e => updateFaq(idx, 'question', e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Order"
                        value={faq.order}
                        onChange={e => updateFaq(idx, 'order', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                      <button onClick={() => removeFaq(idx)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={e => updateFaq(idx, 'answer', e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm resize-none"
                      rows={2}
                    />
                  </div>
                ))}
                <button
                  onClick={addFaq}
                  className="w-full border-dashed border-2 rounded p-2 text-primary-600 text-sm flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add FAQ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer – only action buttons, no status dropdown */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            {service
              ? `Last updated: ${new Date(service.updated_at).toLocaleDateString()}`
              : 'New service'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-50"
              disabled={saveLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveService('archived')}
              className="px-3 py-1.5 text-xs border rounded bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center gap-1"
              disabled={saveLoading}
            >
              <FileArchive className="w-3 h-3" /> Archive
            </button>
            <button
              onClick={() => handleSaveService('draft')}
              className="px-3 py-1.5 text-xs border rounded bg-gray-200 hover:bg-gray-300 flex items-center gap-1"
              disabled={saveLoading}
            >
              <Save className="w-3 h-3" /> Draft
            </button>
            <button
              onClick={() => handleSaveService('published')}
              className="px-3 py-1.5 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1"
              disabled={saveLoading}
            >
              <Send className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ServiceModal)
