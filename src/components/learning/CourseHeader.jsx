import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiBook,
  FiFileText,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiVideo,
  FiGlobe,
  FiExternalLink,
  FiVideoOff,
  FiUser,
} from 'react-icons/fi'

export const CourseHeader = ({
  course,
  enrollment,
  progress,
  meetDetails,
  meetLoading,
  onJoinMeeting,
}) => {
  const [showHolidays, setShowHolidays] = useState(false)
  const [showCourseDescription, setShowCourseDescription] = useState(false)

  // Memoized Google Meet settings
  const meetSettings = useMemo(() => meetDetails?.metadata?.googleMeetSettings || {}, [meetDetails])

  // Derived memoized data
  const holidays = useMemo(() => meetSettings.holidays || [], [meetSettings])
  const workingHours = useMemo(() => meetSettings.workingHours || null, [meetSettings])

  const workingDays = useMemo(() => {
    if (!meetSettings.workingDaysRule) return null
    const dayMap = {
      MO: 'Monday',
      TU: 'Tuesday',
      WE: 'Wednesday',
      TH: 'Thursday',
      FR: 'Friday',
      SA: 'Saturday',
      SU: 'Sunday',
    }
    const match = meetSettings.workingDaysRule.match(/BYDAY=([^;]+)/)
    return match
      ? match[1]
          .split(',')
          .map(d => dayMap[d] || d)
          .join(', ')
      : null
  }, [meetSettings])

  const today = useMemo(() => new Date(), [])
  const todayISO = useMemo(() => today.toISOString().split('T')[0], [today])

  const isTodayHoliday = useMemo(() => holidays.includes(todayISO), [holidays, todayISO])

  const isMeetingActive = useMemo(() => {
    if (!workingHours) return true
    const now = today.getHours() * 60 + today.getMinutes()
    const [startH, startM] = workingHours.start.split(':').map(Number)
    const [endH, endM] = workingHours.end.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    const todayCode = dayMap[today.getDay()]

    const isWorkingDay = meetSettings.workingDaysRule
      ? meetSettings.workingDaysRule.includes(todayCode)
      : true

    return isWorkingDay && now >= startMinutes && now <= endMinutes && !isTodayHoliday
  }, [workingHours, meetSettings, today, isTodayHoliday])

  const meetingLink = meetSettings.meetingLink || null
  const meetingName = meetSettings.meetingName || 'Class Meeting'
  const duration = meetSettings.defaultDuration
    ? `${Math.floor(meetSettings.defaultDuration / 60)}h ${meetSettings.defaultDuration % 60}m`
    : '60m'
  const timezone =
    meetSettings.scheduleTimezone?.split('/').pop()?.replace('_', ' ') || 'Eastern Time'

  // Formatting functions
  const formatDate = (date, fmt = 'short') => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d)) return date
    if (fmt === 'short')
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (fmt === 'time')
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime12h = time24h => {
    if (!time24h) return ''
    try {
      const [hours, minutes] = time24h.split(':')
      const hour = parseInt(hours, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    } catch {
      return time24h
    }
  }

  const getModuleCount = useMemo(() => course?.metadata?.modules?.length || 0, [course])
  const getTopicCount = useMemo(
    () =>
      course?.metadata?.curriculum?.reduce((total, m) => total + (m.topics?.length || 0), 0) || 0,
    [course]
  )
  const capitalizeWords = s => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''

  const formatHolidays = useMemo(() => holidays.map(h => formatDate(h, 'full')), [holidays])

  const shouldShowJoinButton = course?.mode === 'online_live' && meetDetails && !meetLoading

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-gray-600 mb-3">
        <Link to="/dashboard/courses" className="hover:text-primary-600 transition-colors">
          Courses
        </Link>
        <FiChevronRight className="w-3 h-3 mx-1.5" />
        <span className="font-medium text-gray-900 truncate max-w-[200px]">{course.title}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
          {/* Left Section */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 mb-1.5 truncate">{course.title}</h1>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {showCourseDescription
                ? course.description
                : `${course.description.substring(0, 180)}${course.description.length > 180 ? '...' : ''}`}
            </p>
            {course.description.length > 180 && (
              <button
                onClick={() => setShowCourseDescription(!showCourseDescription)}
                className="mt-1 text-primary-600 hover:text-primary-800 text-xs font-medium flex items-center gap-0.5"
              >
                {showCourseDescription ? 'Show Less' : 'Read More'}{' '}
                {showCourseDescription ? (
                  <FiChevronUp className="w-3 h-3" />
                ) : (
                  <FiChevronDown className="w-3 h-3" />
                )}
              </button>
            )}

            {/* Highlights */}
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-1 text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full">
                <FiBook className="w-3 h-3 text-primary-600" />
                {getModuleCount} Modules
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full">
                <FiFileText className="w-3 h-3 text-primary-600" />
                {getTopicCount} Topics
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full">
                <FiClock className="w-3 h-3 text-primary-600" />
                <span className="truncate max-w-[80px]">{course.duration}</span>
              </div>
            </div>

            {/* Short Description */}
            {course.short_description && course.short_description !== course.description && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <p className="text-blue-800 italic">"{course.short_description}"</p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-1.5">
                  <FiUser className="w-3 h-3 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium">Instructor</p>
                  <p className="truncate max-w-[120px]">User {course.user_id}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FiClock className="w-3 h-3 text-gray-400 mr-1" />
                <span className="truncate max-w-[80px]">{course.duration}</span>
              </div>
              <div className="flex items-center">
                <FiCalendar className="w-3 h-3 text-gray-400 mr-1" />
                <span className="truncate max-w-[140px]">
                  Started {formatDate(enrollment?.enrolled_at || course.createdAt, 'short')}
                </span>
              </div>
              <div className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-[10px] font-medium">
                {capitalizeWords(course.level)}
              </div>
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${course.mode === 'online_live' ? 'bg-green-100 text-green-800' : course.mode === 'online_self_paced' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}
              >
                {capitalizeWords(course.mode)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Your Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Google Meet Section */}
          {course.mode === 'online_live' && (
            <div className="lg:w-auto min-w-[240px] max-w-full">
              {shouldShowJoinButton ? (
                <div className="bg-blue-50 border border-blue-100 rounded p-3">
                  {/* Holiday Warning */}
                  {isTodayHoliday && (
                    <div className="mb-2 p-1.5 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-1.5 text-yellow-800">
                      <FiAlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        Today is a holiday - No Live Class
                      </span>
                    </div>
                  )}

                  {/* Meeting Info */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FiVideo className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-gray-900 text-sm truncate">{meetingName}</h3>
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        Meeting ID: <span className="font-mono">{meetDetails.property_value}</span>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${isMeetingActive ? 'bg-green-100 text-green-800 animate-pulse' : isTodayHoliday ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {isTodayHoliday ? '🏖️ Holiday' : isMeetingActive ? '● Live' : '○ Offline'}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-1.5 mb-3 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 truncate">
                      <FiCalendar className="w-3 h-3 text-gray-500" />
                      <span className="font-medium flex-shrink-0">Days:</span>
                      <span className="truncate">{workingDays || 'Weekdays'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700 truncate">
                      <FiClock className="w-3 h-3 text-gray-500" />
                      <span className="font-medium flex-shrink-0">Time:</span>
                      <span className="truncate">
                        {workingHours
                          ? `${formatTime12h(workingHours.start)} - ${formatTime12h(workingHours.end)}`
                          : '9:00 AM - 5:00 PM'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700 truncate">
                      <FiGlobe className="w-3 h-3 text-gray-500" />
                      <span className="font-medium flex-shrink-0">Timezone:</span>
                      <span className="truncate">{timezone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700 truncate">
                      <FiClock className="w-3 h-3 text-gray-500" />
                      <span className="font-medium flex-shrink-0">Duration:</span>
                      <span className="truncate">{duration}</span>
                    </div>

                    {/* Holidays */}
                    {holidays.length > 0 && (
                      <div className="pt-1.5 border-t border-gray-200">
                        <button
                          onClick={() => setShowHolidays(!showHolidays)}
                          className="flex items-center justify-between w-full text-gray-700 hover:text-blue-600"
                        >
                          <div className="flex items-center gap-1.5">
                            <FiCalendar className="w-3 h-3 text-gray-500" />
                            <span className="font-medium flex-shrink-0">Holidays:</span>
                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                              {holidays.length} days
                            </span>
                          </div>
                          {showHolidays ? (
                            <FiChevronUp className="w-3 h-3" />
                          ) : (
                            <FiChevronDown className="w-3 h-3" />
                          )}
                        </button>
                        {showHolidays && (
                          <ul className="mt-1.5 pl-5 space-y-1 text-[10px] text-gray-600 max-h-24 overflow-y-auto">
                            {formatHolidays.map((h, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <FiCalendar className="w-2.5 h-2.5 text-gray-400" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={onJoinMeeting}
                    disabled={!meetingLink || meetLoading || isTodayHoliday}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${isMeetingActive && !isTodayHoliday ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white ${meetLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {meetLoading ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isTodayHoliday ? (
                      'No Class Today (Holiday)'
                    ) : (
                      'Join Live Meeting'
                    )}
                  </button>

                  <div
                    className={`mt-1.5 text-xs text-center ${isTodayHoliday ? 'text-yellow-600' : isMeetingActive ? 'text-green-600' : 'text-blue-600'}`}
                  >
                    {isTodayHoliday
                      ? 'Holiday'
                      : isMeetingActive
                        ? 'Live Now'
                        : 'Available During Working Hours'}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FiVideoOff className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-700 font-medium mb-0.5">No Live Meeting</p>
                  <p className="text-[10px] text-gray-500">
                    This course doesn't have scheduled live sessions
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
