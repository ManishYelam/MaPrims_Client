// src/components/service/ServicePlanSelectionStep.jsx
import React, { useState, useMemo } from 'react'
import { Check, Star, Crown, Rocket, Clock, Users, Shield } from 'lucide-react'

const ServicePlanSelectionStep = ({
  service,
  data,
  onChange,
  onNext,
  onBack,
  user,
  isAuthenticated,
}) => {
  const [selectedAddons, setSelectedAddons] = useState({
    tipPercentage: 0,
    extraServices: [],
    fastDeliveryId: null,
  })

  const formatPrice = price => {
    if (!price && price !== 0) return 'Contact Us'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const selectedPlan = useMemo(() => {
    const plans = service?.metadata?.pricing
    if (!plans) return null
    switch (data.payment_plan) {
      case 'basic': return plans.basic
      case 'standard': return plans.standard
      case 'premium': return plans.premium
      default: return plans.basic
    }
  }, [service, data.payment_plan])

  const basePrice = selectedPlan?.price || 0
  const deliveryDays = selectedPlan?.delivery_days || 7
  // Calculate order delivery date based on plan's delivery days
  const orderDeliveryDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000).toISOString()

  const extraServicesTotal = useMemo(() => {
    if (!service?.metadata?.extra_services) return 0
    return service.metadata.extra_services
      .filter(ext => selectedAddons.extraServices.includes(ext.name))
      .reduce((sum, ext) => sum + (ext.price || 0), 0)
  }, [service, selectedAddons.extraServices])

  const fastDeliveryOption = useMemo(() => {
    if (!selectedAddons.fastDeliveryId) return null
    return service?.metadata?.fast_delivery_options?.options?.find(
      opt => opt.id === selectedAddons.fastDeliveryId
    )
  }, [service, selectedAddons.fastDeliveryId])

  const fastDeliveryCost = fastDeliveryOption?.extra_price || 0

  const subtotal = basePrice + extraServicesTotal + fastDeliveryCost
  const tipAmount = subtotal * (selectedAddons.tipPercentage / 100) || 0
  const totalAmount = subtotal + tipAmount

  const updateOrderData = () => {
    onChange({
      ...data,
      payment_plan: data.payment_plan,
      addons: {
        tipPercentage: selectedAddons.tipPercentage,
        extraServices: selectedAddons.extraServices,
        extraServicesTotal,
        fastDeliveryId: selectedAddons.fastDeliveryId,
        fastDeliveryCost,
        fastDeliveryOption,
        extraServicesList: service?.metadata?.extra_services?.filter(ext =>
          selectedAddons.extraServices.includes(ext.name)
        ),
        totalAmount,
        subtotal,
        tipAmount,
        orderDeliveryDate,   // ✅ added
      },
    })
  }

  const handleNext = () => {
    updateOrderData()
    onNext()
  }

  const toggleExtraService = serviceName => {
    setSelectedAddons(prev => ({
      ...prev,
      extraServices: prev.extraServices.includes(serviceName)
        ? prev.extraServices.filter(s => s !== serviceName)
        : [...prev.extraServices, serviceName],
    }))
  }

  const setFastDelivery = id => {
    setSelectedAddons(prev => ({
      ...prev,
      fastDeliveryId: prev.fastDeliveryId === id ? null : id,
    }))
  }

  const setTipPercentage = pct => {
    setSelectedAddons(prev => ({
      ...prev,
      tipPercentage: prev.tipPercentage === pct ? 0 : pct,
    }))
  }

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      icon: Star,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      plan: service?.metadata?.pricing?.basic,
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      icon: Rocket,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      plan: service?.metadata?.pricing?.standard,
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      plan: service?.metadata?.pricing?.premium,
    },
  ].filter(p => p.plan)

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Choose Your Plan</h3>
      <p className="text-gray-600 text-sm">Select the package that best fits your needs</p>

      <div className="space-y-4">
        {plans.map(plan => {
          const Icon = plan.icon
          const isSelected = data.payment_plan === plan.id
          return (
            <div
              key={plan.id}
              className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              } ${plan.popular ? 'relative' : ''}`}
              onClick={() => onChange({ ...data, payment_plan: plan.id })}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                  <Icon className={`w-6 h-6 ${plan.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900">{plan.name}</h4>
                    {isSelected && <Check className="w-5 h-5 text-primary-600" />}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">
                    {formatPrice(plan.plan.price)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{plan.plan.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.plan.delivery_days} days</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {plan.plan.max_revisions} revisions</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {plan.plan.support_level} support</span>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {plan.plan.features?.slice(0,4).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {data.payment_plan && (
        <div className="border-t border-gray-200 pt-6 mt-4">
          <h4 className="font-semibold text-gray-900 mb-4">Optional Add‑ons</h4>

          {service?.metadata?.extra_services?.length > 0 && (
            <div className="mb-5">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Extra Services</h5>
              <div className="space-y-2">
                {service.metadata.extra_services.map(ext => (
                  <label key={ext.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedAddons.extraServices.includes(ext.name)} onChange={() => toggleExtraService(ext.name)} className="w-4 h-4 text-primary-600 rounded" />
                      <div><span className="font-medium text-gray-900">{ext.name}</span><p className="text-xs text-gray-500">{ext.description}</p></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatPrice(ext.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {service?.metadata?.fast_delivery_options?.enabled && (
            <div className="mb-5">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Fast Delivery Options</h5>
              <div className="space-y-2">
                {service.metadata.fast_delivery_options.options.map(opt => (
                  <label key={opt.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="fastDelivery" checked={selectedAddons.fastDeliveryId === opt.id} onChange={() => setFastDelivery(opt.id)} className="w-4 h-4 text-primary-600" />
                      <div><span className="font-medium text-gray-900">{opt.name}</span><p className="text-xs text-gray-500">{opt.description}</p>{opt.delivery_days === 0 ? <span className="text-xs text-green-600">Same day delivery</span> : <span className="text-xs text-gray-500">Delivery in {opt.delivery_days} days</span>}</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">+{formatPrice(opt.extra_price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {service?.metadata?.tip_payment?.enabled && (
            <div className="mb-5">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Tip the Creator (Optional)</h5>
              <div className="flex flex-wrap gap-2">
                {service.metadata.tip_payment.percentages.map(pct => (
                  <button key={pct} type="button" onClick={() => setTipPercentage(pct)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedAddons.tipPercentage === pct ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{pct}%</button>
                ))}
                {selectedAddons.tipPercentage > 0 && <button type="button" onClick={() => setTipPercentage(0)} className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100">Remove Tip</button>}
              </div>
              {selectedAddons.tipPercentage > 0 && <p className="text-xs text-gray-500 mt-2">You are adding a {selectedAddons.tipPercentage}% tip (≈ {formatPrice(tipAmount)})</p>}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Base price ({selectedPlan?.name || 'Selected plan'})</span><span className="font-medium">{formatPrice(basePrice)}</span></div>
              {extraServicesTotal > 0 && <div className="flex justify-between"><span className="text-gray-600">Extra services</span><span className="font-medium">{formatPrice(extraServicesTotal)}</span></div>}
              {fastDeliveryCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Fast delivery</span><span className="font-medium">{formatPrice(fastDeliveryCost)}</span></div>}
              {tipAmount > 0 && <div className="flex justify-between"><span className="text-gray-600">Tip ({selectedAddons.tipPercentage}%)</span><span className="font-medium">{formatPrice(tipAmount)}</span></div>}
              <div className="border-t border-gray-200 pt-2 mt-2"><div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatPrice(totalAmount)}</span></div></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onBack && <button onClick={onBack} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Back</button>}
        <button onClick={handleNext} disabled={!data.payment_plan} className="flex-1 px-4 py-3 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed">Continue to Payment</button>
      </div>
    </div>
  )
}

export default ServicePlanSelectionStep