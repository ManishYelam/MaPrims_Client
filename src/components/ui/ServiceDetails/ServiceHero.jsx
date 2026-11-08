// ServiceHero.jsx
import React, { useState } from 'react'
import { ChevronLeft, Heart, Share2, Star, Users, Clock, Shield, PlayCircle } from 'lucide-react'

const ServiceHero = ({
  service,
  onNavigateBack,
  onOrderNow,
  onToggleWishlist,
  onShare,
  isWishlisted,
  isAuthenticated,
  isPurchased = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const fallbackImage = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=400&fit=crop'

  const thumbnail = service.thumbnail_image || service.gallery?.[0] || fallbackImage
  const rating = 4.8
  const reviewCount = 128
  const deliveries = service.view_count || 245

  return (
    <div className="relative bg-gradient-to-r from-primary-900 to-primary-800 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-repeat" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <button onClick={onNavigateBack} className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Services
        </button>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gray-800 relative">
              {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-gray-700" />}
              <img
                src={thumbnail}
                alt={service.title}
                onLoad={() => setImageLoaded(true)}
                onError={e => (e.target.src = fallbackImage)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{rating}</span>
                <span className="text-sm text-white/70">({reviewCount} reviews)</span>
              </div>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1 text-sm text-white/80">
                <Users className="w-4 h-4" />
                <span>{deliveries}+ deliveries</span>
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{service.title}</h1>
            <p className="text-white/90 text-lg mb-6 leading-relaxed">
              {service.short_description || service.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Delivery: {service.metadata?.pricing?.basic?.delivery_days || '7-14'} days</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Money-back guarantee</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={onOrderNow}
                className="px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2"
              >
                {isPurchased && <PlayCircle className="w-5 h-5" />}
                {isPurchased ? 'Start Business' : 'Order Now'}
              </button>
              <button
                onClick={onToggleWishlist}
                className={`p-3 rounded-lg border transition-all ${
                  isWishlisted
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-white/30 text-white hover:bg-white/10'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={onShare}
                className="p-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceHero