// ServiceCard.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Eye,
  Heart,
  Share2,
  Star,
  CheckCircle,
  Briefcase,
  PlayCircle,
  ExternalLink,
  Download,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ServiceOrderFlow from '../serviceOrder/ServiceOrderFlow'

const AuthModal = React.lazy(() => import('./AuthModal'))

const getBasicPrice = service => {
  const price = service?.metadata?.pricing?.basic?.price
  return price ? `₹${price.toLocaleString('en-IN')}` : 'Contact Us'
}
const getDeliveryDays = service => {
  const days = service?.metadata?.pricing?.basic?.delivery_days
  return days ? `${days} days` : 'Custom'
}
const getSupportLevel = service => service?.metadata?.pricing?.basic?.support_level || 'Standard'

const fallbackImage = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=200&fit=crop'

const ServiceCard = ({
  service,
  viewMode = 'grid',
  showActions = true,
  className = '',
  isPurchased = false,
  orderId = null,
}) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOrderFlow, setShowOrderFlow] = useState(false)

  if (!service) return null

  const handleImageLoad = () => setImageLoaded(true)
  const handleImageError = e => { e.target.src = fallbackImage; setImageLoaded(true) }

  const toggleWishlist = e => { e.preventDefault(); e.stopPropagation(); setIsWishlisted(!isWishlisted) }
  const handleShare = e => {
    e.preventDefault(); e.stopPropagation()
    if (navigator.share) navigator.share({ title: service.title, text: service.short_description, url: `/services/${service.service_id}` })
  }
  const handleViewDetails = e => { e.preventDefault(); e.stopPropagation(); navigate(`/services/${service.service_id}`, { state: { service } }) }
  const handleContinue = e => { e.preventDefault(); e.stopPropagation(); if (orderId) navigate(`/services/orders/${orderId}`); else navigate('/services/my-services') }
  const handleInquire = e => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) { setShowAuthModal(true); return }
    setShowOrderFlow(true)
  }
  const handleAuthSuccess = () => { setShowAuthModal(false); setShowOrderFlow(true) }
  const handleOrderFlowClose = () => setShowOrderFlow(false)

  const thumbnail = service.thumbnail_image || service.gallery?.[0] || fallbackImage
  const isPopular = service.metadata?.pricing?.basic?.popular || false

  const handleDownloadSyllabus = e => {
    e.preventDefault(); e.stopPropagation()
    const syllabusUrl = service.syllabus_pdf || service.metadata?.syllabus_pdf
    if (syllabusUrl) { const link = document.createElement('a'); link.href = syllabusUrl; link.download = syllabusUrl.split('/').pop() || 'syllabus.pdf'; document.body.appendChild(link); link.click(); document.body.removeChild(link) }
    else alert('Syllabus not available for this service.')
  }

  if (viewMode === 'grid') {
    return (
      <>
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:-translate-y-0.5 ${className}`}>
          {/* Image Section */}
          <div className="relative overflow-hidden">
            <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-gray-300 w-full h-full" />}
              <img src={thumbnail} alt={service.title} onLoad={handleImageLoad} onError={handleImageError} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/10" />

              <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                {isPopular && <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" />Popular</div>}
                {service.status === 'archived' && <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm">Archived</div>}
              </div>

              <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={toggleWishlist} className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 ${isWishlisted ? 'bg-red-500 text-white shadow-sm' : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'}`}><Heart className={`w-3 h-3 ${isWishlisted ? 'fill-current' : ''}`} /></button>
                <button onClick={handleShare} className="p-1.5 rounded-full bg-white/90 text-gray-600 backdrop-blur-sm hover:bg-white hover:text-blue-600"><Share2 className="w-3 h-3" /></button>
                <button onClick={handleDownloadSyllabus} className="p-1.5 rounded-full bg-white/90 text-gray-600 backdrop-blur-sm hover:bg-white hover:text-green-600"><Download className="w-3 h-3" /></button>
              </div>

              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-white text-xs"><Eye className="w-3 h-3" /><span>{service.view_count || 0}</span></div>
                <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-black/40 text-white">{getDeliveryDays(service)}</div>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-primary-600 flex items-center gap-1"><Briefcase className="w-3 h-3" />{getSupportLevel(service)}</span></div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">{service.title}</h3>
            <p className="text-gray-600 text-xs mb-3 line-clamp-2 flex-1 leading-relaxed">{service.short_description || service.description}</p>
            <div className="flex items-center justify-between mb-3">
              <div><span className="text-base font-bold text-gray-900">{getBasicPrice(service)}</span><span className="text-[10px] text-gray-500 ml-1">/ basic</span></div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500"><Clock className="w-3 h-3" />{getDeliveryDays(service)}</div>
            </div>

            {showActions && (
              <div className="flex gap-1.5 mt-auto">
                <button onClick={handleViewDetails} className="flex-1 text-center bg-primary-600 hover:bg-primary-700 text-white text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Details
                </button>
                <button onClick={isPurchased ? handleContinue : handleInquire} className="flex-1 text-center border border-primary-600 text-primary-600 hover:bg-primary-50 text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                  {isPurchased ? <PlayCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {isPurchased ? 'Continue' : 'Inquire'}
                </button>
              </div>
            )}
          </div>
        </div>

        {showAuthModal && <React.Suspense fallback={<div>Loading...</div>}><AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} /></React.Suspense>}
        {showOrderFlow && isAuthenticated && !isPurchased && <React.Suspense fallback={<div>Loading...</div>}><ServiceOrderFlow service={service} onClose={handleOrderFlowClose} /></React.Suspense>}
      </>
    )
  }

  // List view
  return (
    <>
      <div className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-48 flex-shrink-0">
            <div className="relative w-full h-32 md:h-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-gray-300 w-full h-full" />}
              <img src={thumbnail} alt={service.title} onLoad={handleImageLoad} onError={handleImageError} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} />
              {isPopular && <div className="absolute top-2 left-2 bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">Popular</div>}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{service.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{service.short_description || service.description}</p>
              </div>
              <div className="mt-2 lg:mt-0 lg:text-right">
                <div className="text-lg font-bold text-gray-900">{getBasicPrice(service)}</div>
                <div className="text-xs text-gray-500 flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> {getDeliveryDays(service)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4">
              <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> {service.view_count || 0} views</div>
              {service.metadata?.pricing?.basic?.features?.length > 0 && <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {service.metadata.pricing.basic.features.length} features</div>}
            </div>

            {showActions && (
              <div className="flex gap-2 items-center">
                <button onClick={handleViewDetails} className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1.5 px-3 rounded-lg flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Details</button>
                <button onClick={isPurchased ? handleContinue : handleInquire} className="border border-primary-600 text-primary-600 hover:bg-primary-50 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1">
                  {isPurchased ? <PlayCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {isPurchased ? 'Continue' : 'Inquire'}
                </button>
                <div className="flex gap-1.5 ml-auto">
                  <button onClick={toggleWishlist} className={`p-1.5 rounded-lg border transition-all ${isWishlisted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'}`}><Heart className={`w-3 h-3 ${isWishlisted ? 'fill-current' : ''}`} /></button>
                  <button onClick={handleShare} className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"><Share2 className="w-3 h-3" /></button>
                  <button onClick={handleDownloadSyllabus} className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600"><Download className="w-3 h-3" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAuthModal && <React.Suspense fallback={<div>Loading...</div>}><AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} /></React.Suspense>}
      {showOrderFlow && isAuthenticated && !isPurchased && <React.Suspense fallback={<div>Loading...</div>}><ServiceOrderFlow service={service} onClose={handleOrderFlowClose} /></React.Suspense>}
    </>
  )
}

export default ServiceCard