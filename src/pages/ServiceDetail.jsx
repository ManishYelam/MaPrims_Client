// ServiceDetail.jsx
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { servicesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ServiceHero from '../components/ui/ServiceDetails/ServiceHero'
import ServiceFeatures from '../components/ui/ServiceDetails/ServiceFeatures'
import ServiceDeliveryInfo from '../components/ui/ServiceDetails/ServiceDeliveryInfo'
import ServiceFAQ from '../components/ui/ServiceDetails/ServiceFAQ'
import ServiceSidebar from '../components/ui/ServiceDetails/ServiceSidebar'
import MobileAccordion from '../components/ui/ServiceDetails/MobileAccordion'
import LoadingSkeleton from '../components/ui/ServiceDetails/LoadingSkeleton'
import ErrorState from '../components/ui/ServiceDetails/ErrorState'
import ServiceOverview from '../components/ui/ServiceDetails/ServiceOverview'

const ServiceOrderFlow = lazy(() => import('../components/serviceOrder/ServiceOrderFlow'))

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919373200525'
const WHATSAPP_MESSAGE = `Hi, I'm interested in the service: `

const ServiceDetail = () => {
  const { service_id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showOrderFlow, setShowOrderFlow] = useState(false)
  const [expandedFaqs, setExpandedFaqs] = useState(new Set())
  const [isPurchased, setIsPurchased] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const basicPlan = useMemo(() => service?.metadata?.pricing?.basic, [service])
  const premiumPlan = useMemo(() => service?.metadata?.pricing?.premium, [service])
  const standardPlan = useMemo(() => service?.metadata?.pricing?.standard, [service])

  const formatPrice = useCallback(price => {
    if (!price && price !== 0) return 'Contact Us'
    const numPrice = parseFloat(price)
    if (isNaN(numPrice)) return 'Contact Us'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numPrice)
  }, [])

  const checkPurchaseStatus = useCallback(async () => {
    if (!isAuthenticated || !service_id || !user?.user?.user_id) return
    try {
      const response = await servicesAPI.getPurchased({
        user_id: user?.user?.user_id,
        page: 1,
        limit: 100,
        filters: { service_id: parseInt(service_id) }
      })
      
      const purchased = response.data?.services?.[0]
      if (purchased) {
        setIsPurchased(true)
        setOrderId(purchased.service_orders?.[0]?.service_order_id || null)
      } else {
        setIsPurchased(false)
        setOrderId(null)
      }
    } catch (err) {
      console.error('Error checking purchase status:', err)
    }
  }, [isAuthenticated, service_id, user?.user_id])

  const handleOrderNow = useCallback(() => {
    if (isPurchased && orderId) {
      navigate(`/services/orders/${orderId}`)
    } else if (!isAuthenticated) {
      navigate('/login', { state: { from: `/services/${service_id}` } })
    } else {
      setShowOrderFlow(true)
    }
  }, [isPurchased, orderId, isAuthenticated, navigate, service_id])

  const toggleWishlist = useCallback(() => setIsWishlisted(prev => !prev), [])
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: service?.title || 'Service',
        text: service?.short_description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }, [service])

  const handleWhatsAppClick = useCallback(() => {
    const message = encodeURIComponent(`${WHATSAPP_MESSAGE}${service?.title || ''}`)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
  }, [service?.title])

  const toggleFaq = useCallback(index => {
    setExpandedFaqs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) newSet.delete(index)
      else newSet.add(index)
      return newSet
    })
  }, [])

  useEffect(() => {
    let mounted = true
    const fetchService = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await servicesAPI.getById(service_id)
        if (!mounted) return
        if (response.data?.success && response.data.data) {
          setService(response.data.data)
        } else if (response.data?.service_id || response.data?.title) {
          setService(response.data)
        } else {
          setError('Service not found or data format unexpected.')
        }
      } catch (err) {
        if (!mounted) return
        console.error('Error fetching service:', err)
        setError(
          err.response?.status === 404
            ? 'Service not found. Please check the URL.'
            : 'Failed to load service. Please try again later.'
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchService()
    return () => { mounted = false }
  }, [service_id, location.state])

  useEffect(() => {
    if (service && isAuthenticated) {
      checkPurchaseStatus()
    }
  }, [service, isAuthenticated, checkPurchaseStatus])

  if (loading) return <LoadingSkeleton type="service-detail" />
  if (error && !service) {
    return (
      <ErrorState
        title="Service Not Found"
        message={error}
        actions={[
          { label: 'Browse Services', onClick: () => navigate('/services'), variant: 'primary' },
          { label: 'Try Again', onClick: () => window.location.reload(), variant: 'secondary' },
        ]}
      />
    )
  }
  if (!service) return null

  const tabConfig = [
    { id: 'overview', label: 'Overview', icon: '📋', content: <ServiceOverview service={service} /> },
    { id: 'features', label: 'Features', icon: '⚙️', content: <ServiceFeatures basicPlan={basicPlan} premiumPlan={premiumPlan} standardPlan={standardPlan} /> },
    { id: 'delivery', label: 'Delivery', icon: '🚚', content: <ServiceDeliveryInfo service={service} /> },
    { id: 'faq', label: 'FAQ', icon: '❓', content: <ServiceFAQ faqs={service.metadata?.faqs || []} expandedFaqs={expandedFaqs} onToggle={toggleFaq} /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <ServiceHero
        service={service}
        onNavigateBack={() => isAuthenticated ? navigate('/dashboard/services') : navigate('/services')}
        onOrderNow={handleOrderNow}
        onToggleWishlist={toggleWishlist}
        onShare={handleShare}
        isWishlisted={isWishlisted}
        isAuthenticated={isAuthenticated}
        isPurchased={isPurchased}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="hidden lg:block">
              <div className="flex overflow-x-auto border-b border-gray-200 mb-6 scrollbar-hide">
                {tabConfig.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-fadeIn">
                {tabConfig.find(tab => tab.id === activeTab)?.content}
              </div>
            </div>
            <div className="lg:hidden"><MobileAccordion tabs={tabConfig} /></div>
          </div>

          <ServiceSidebar
            service={service}
            basicPlan={basicPlan}
            formatPrice={formatPrice}
            onOrderNow={handleOrderNow}
            onWhatsAppClick={handleWhatsAppClick}
            isAuthenticated={isAuthenticated}
            isPurchased={isPurchased}
          />
        </div>
      </div>

      {showOrderFlow && isAuthenticated && !isPurchased && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>}>
          <ServiceOrderFlow service={service} onClose={() => setShowOrderFlow(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default React.memo(ServiceDetail)