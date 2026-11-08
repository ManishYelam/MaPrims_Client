// src/components/enrollment/ProfileCompletionStep.jsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Loader2, User, MapPin, Briefcase, Target, Clock, AlertCircle, Check } from 'lucide-react'

// Yup schema matching your backend schema
const profileCompletionSchema = yup.object({
  full_name: yup
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters')
    .required('Full name is required'),
  date_of_birth: yup
    .date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
  phone_number: yup
    .string()
    .matches(/^[0-9]{10,15}$/, 'Phone number must be 10-15 digits')
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
  address: yup
    .string()
    .max(500, 'Address must be less than 500 characters')
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
  occupation: yup
    .string()
    .max(500, 'Occupation must be less than 500 characters')
    .required('Occupation is required'),
  profession: yup.string().required('Profession is required'),
  experience: yup.string().required('Experience level is required'),
  goals: yup
    .array()
    .of(yup.string())
    .min(1, 'Select at least one learning goal')
    .required('Learning goals are required'),
  time_commitment: yup.string().required('Time commitment is required'),
})

const ProfileCompletionStep = ({ user, onComplete, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(profileCompletionSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      date_of_birth: user?.date_of_birth || '',
      phone_number: user?.phone_number || '',
      address: user?.address || '',
      occupation: user?.occupation || '',
      profession: user?.profession || '',
      experience: user?.experience || '',
      goals: user?.goals || [],
      time_commitment: user?.time_commitment || '',
    },
  })

  const watchedGoals = watch('goals')
  const watchedExperience = watch('experience')
  const watchedTimeCommitment = watch('time_commitment')

  // Available options
  const professions = [
    'Student',
    'Software Developer',
    'SAP Consultant',
    'ABAP Developer',
    'Business Analyst',
    'Project Manager',
    'IT Manager',
    'System Administrator',
    'Freelancer',
    'Other',
  ]

  const experienceLevels = [
    { value: '0-1', label: '0-1 years (Beginner)' },
    { value: '1-3', label: '1-3 years (Intermediate)' },
    { value: '3-5', label: '3-5 years (Experienced)' },
    { value: '5-10', label: '5-10 years (Advanced)' },
    { value: '10+', label: '10+ years (Expert)' },
  ]

  const learningGoals = [
    'Career Change',
    'Skill Upgrade',
    'Project Work',
    'Certification',
    'Personal Interest',
    'Job Promotion',
    'Freelance Opportunities',
    'Consulting Skills',
  ]

  const timeCommitments = [
    { value: '1-5', label: '1-5 hours/week' },
    { value: '5-10', label: '5-10 hours/week' },
    { value: '10-15', label: '10-15 hours/week' },
    { value: '15-20', label: '15-20 hours/week' },
    { value: '20+', label: '20+ hours/week' },
  ]

  const handleGoalToggle = async goal => {
    const currentGoals = [...watchedGoals]
    const goalIndex = currentGoals.indexOf(goal)

    if (goalIndex > -1) {
      currentGoals.splice(goalIndex, 1)
    } else {
      currentGoals.push(goal)
    }

    setValue('goals', currentGoals)
    await trigger('goals')
  }

  const handleExperienceSelect = async experience => {
    setValue('experience', experience)
    await trigger('experience')
  }

  const handleTimeCommitmentSelect = async timeCommitment => {
    setValue('time_commitment', timeCommitment)
    await trigger('time_commitment')
  }

  const onSubmit = async data => {
    try {
      // Prepare the data for API
      const profileData = {
        full_name: data.full_name,
        date_of_birth: data.date_of_birth || null,
        phone_number: data.phone_number || null,
        address: data.address || null,
        occupation: data.occupation,
        user_metadata: {
          profession: data.profession,
          experience: data.experience,
          goals: data.goals,
          time_commitment: data.time_commitment,
          profile_completed_at: new Date().toISOString(),
        },
      }

      onComplete(profileData)
    } catch (error) {
      console.error('Profile completion failed:', error)
      setError('root', {
        type: 'manual',
        message: 'Failed to save profile. Please try again.',
      })
    }
  }

  const isFormValid = () => {
    return (
      watch('full_name') &&
      watch('occupation') &&
      watch('profession') &&
      watch('experience') &&
      watch('goals').length > 0 &&
      watch('time_commitment')
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6 text-primary-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Complete Your Profile</h3>
        <p className="text-gray-600 mt-2">
          Tell us about yourself to personalize your learning experience
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Root Error Message */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm animate-fade-in">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium">Profile Update Failed</p>
                <p className="text-red-600 mt-0.5">{errors.root.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('full_name')}
                  type="text"
                  data-error={!!errors.full_name}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  disabled={loading}
                  maxLength={50}
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                {...register('date_of_birth')}
                type="date"
                data-error={!!errors.date_of_birth}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.date_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              {...register('phone_number')}
              type="tel"
              data-error={!!errors.phone_number}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.phone_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter 10-15 digit phone number"
              pattern="[0-9]{10,15}"
              disabled={loading}
            />
            {errors.phone_number && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {errors.phone_number.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              {...register('address')}
              data-error={!!errors.address}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your address"
              rows={3}
              maxLength={500}
              disabled={loading}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.address.message}</p>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Professional Information
          </h4>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Occupation *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('occupation')}
                type="text"
                data-error={!!errors.occupation}
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.occupation ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Software Developer, Student, Consultant"
                maxLength={500}
                disabled={loading}
              />
            </div>
            {errors.occupation && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {errors.occupation.message}
              </p>
            )}
          </div>

          {/* Profession */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profession *</label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                {...register('profession')}
                data-error={!!errors.profession}
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white ${
                  errors.profession ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Select your profession</option>
                {professions.map(profession => (
                  <option key={profession} value={profession}>
                    {profession}
                  </option>
                ))}
              </select>
            </div>
            {errors.profession && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {errors.profession.message}
              </p>
            )}
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SAP/ABAP Experience Level *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {experienceLevels.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleExperienceSelect(level.value)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    watchedExperience === level.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                >
                  <div className="flex items-center">
                    {watchedExperience === level.value && (
                      <Check className="w-4 h-4 text-primary-500 mr-2" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{level.label.split(' (')[0]}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {level.label.split(' (')[1]?.replace(')', '')}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.experience && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {errors.experience.message}
              </p>
            )}
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Learning Preferences
          </h4>

          {/* Learning Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Learning Goals *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {learningGoals.map(goal => (
                <label
                  key={goal}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    watchedGoals.includes(goal)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={watchedGoals.includes(goal)}
                    onChange={() => handleGoalToggle(goal)}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 mr-3"
                    disabled={loading}
                  />
                  <span className="font-medium text-sm">{goal}</span>
                </label>
              ))}
            </div>
            {errors.goals && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.goals.message}</p>
            )}
          </div>

          {/* Time Commitment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Time Commitment *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeCommitments.map(commitment => (
                <button
                  key={commitment.value}
                  type="button"
                  onClick={() => handleTimeCommitmentSelect(commitment.value)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    watchedTimeCommitment === commitment.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                >
                  <div className="flex items-center">
                    {watchedTimeCommitment === commitment.value && (
                      <Check className="w-4 h-4 text-primary-500 mr-2" />
                    )}
                    <div className="font-medium text-sm">{commitment.label}</div>
                  </div>
                </button>
              ))}
            </div>
            {errors.time_commitment && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {errors.time_commitment.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t">
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={`w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded font-semibold text-sm shadow-sm hover:shadow transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              loading || !isFormValid()
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:from-primary-700 hover:to-primary-800 hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </div>
            ) : (
              'Complete Profile & Continue'
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">* Required fields</p>
        </div>
      </form>
    </div>
  )
}

export default ProfileCompletionStep
