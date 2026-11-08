import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { coursesAPI, assignmentAPI, tutorialNoteAPI, applicationAPI } from '../services/api'

import { CourseHeader } from '../components/learning/CourseHeader'
import { CourseSidebar } from '../components/learning/CourseSidebar'
import { VideoPlayer } from '../components/learning/VideoPlayer'
import { TabNavigation } from '../components/learning/tabs/TabNavigation'
import { LessonTab } from '../components/learning/tabs/LessonTab'
import { AssignmentsTab } from '../components/learning/tabs/AssignmentsTab'
import { ResourcesTab } from '../components/learning/tabs/ResourcesTab'
import { NotesTab } from '../components/learning/tabs/NotesTab'
import { Deadlines } from '../components/learning/Deadlines'

const UploadAssignmentModal = lazy(() =>
  import('../components/learning/assignments/UploadAssignmentModal')
)

const CourseLearning = () => {
  const { course_id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userData = user?.user

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [assignments, setAssignments] = useState([])
  const [resources, setResources] = useState([])
  const [tutorialNote, setTutorialNote] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [meetDetails, setMeetDetails] = useState(null)

  const [activeTab, setActiveTab] = useState('lesson')
  const [expandedModule, setExpandedModule] = useState(0)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [isLoadingMeet, setIsLoadingMeet] = useState(false)

  const [currentLesson, setCurrentLesson] = useState({
    id: '0-0',
    title: 'Introduction',
    description: 'Welcome to the course!',
    moduleIndex: 0,
    topicIndex: 0,
    completed: false,
  })

  /* ---------------- Helpers ---------------- */

  const transformCurriculumToModules = curriculum =>
    Array.isArray(curriculum)
      ? curriculum.map((item, index) => ({
        id: index,
        module: item.module,
        topics: item.topics || [],
        isCompleted: false,
      }))
      : []

  const getCourseProgress = () => {
    if (enrollment?.progress) return enrollment.progress
    if (!modules.length) return 0
    const completed = modules.filter(m => m.isCompleted).length
    return Math.round((completed / modules.length) * 100)
  }

  const getTabCounts = () => ({
    lesson: modules.reduce((s, m) => s + (m.topics?.length || 0), 0),
    assignments: assignments.length,
    resources: resources.length,
    notes: tutorialNote ? 1 : 0,
  })

  /* ---------------- Meet ---------------- */

  const fetchMeetDetails = async () => {
    setIsLoadingMeet(true)
    try {
      const res = await applicationAPI.getGoogleMeetProperty()
      if (res.data?.data) setMeetDetails(res.data.data)
    } finally {
      setIsLoadingMeet(false)
    }
  }

  const handleJoinMeeting = () => {
    const link = meetDetails?.metadata?.googleMeetSettings?.meetingLink || meetDetails?.meetingUrl
    if (!link) return alert('Meeting not available')
    window.open(link, '_blank')
  }

  /* ---------------- Fetch Course ---------------- */

  useEffect(() => {
    const fetchCourse = async () => {
      const res = await coursesAPI.getById(course_id)
      if (!res.data?.success) return

      const courseData = res.data.data
      setCourse(courseData)

      const transformed = transformCurriculumToModules(courseData?.metadata?.curriculum)
      setModules(transformed)

      if (transformed?.[0]?.topics?.length) {
        setCurrentLesson({
          id: '0-0',
          title: transformed[0].topics[0],
          description: `Starting with ${transformed[0].topics[0]}`,
          moduleIndex: 0,
          topicIndex: 0,
          completed: false,
        })
      }

      setResources([
        {
          id: 1,
          title: 'Course Syllabus',
          type: 'pdf',
          url: courseData.syllabus_pdf,
        },
      ])

      if (['online_live', 'hybrid'].includes(courseData.mode)) {
        fetchMeetDetails()
      }
    }

    fetchCourse()
  }, [course_id])

  /* ---------------- Extra Data ---------------- */

  useEffect(() => {
    if (!course) return

    assignmentAPI.getCourseAssignments(course_id).then(res => {
      if (res.data?.success) setAssignments(res.data.data || [])
    })

    tutorialNoteAPI
      .getByCourseId(course_id)
      .then(res => res.data?.success && setTutorialNote(res.data.data))
      .catch(() => { })

    if (userData?.id) {
      coursesAPI
        .getEnrolled(userData.id, course_id)
        .then(res => res.data?.success && setEnrollment(res.data.data))
        .catch(() => { })
    }
  }, [course, course_id, userData?.id])

  /* ---------------- Lesson ---------------- */

  const handleSelectLesson = (id, m, t) =>
    setCurrentLesson({
      id,
      title: modules[m].topics[t],
      description: `This topic covers ${modules[m].topics[t]}`,
      moduleIndex: m,
      topicIndex: t,
      completed: false,
    })

  const handleNextLesson = () => {
    const mod = modules[currentLesson.moduleIndex]
    const next = currentLesson.topicIndex + 1
    if (next < mod.topics.length)
      handleSelectLesson(`${currentLesson.moduleIndex}-${next}`, currentLesson.moduleIndex, next)
  }

  const handleToggleModule = moduleId => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId)
  }

  const handleUploadAssignment = a => {
    setSelectedAssignment(a)
    setShowUploadModal(true)
  }

  const handleViewSubmission = id =>
    navigate(`/dashboard/courses/${course_id}/assignments/${id}/submission`)

  const handleSubmitAssignment = data => {
    setAssignments(prev =>
      prev.map(a =>
        a.assignment_id === selectedAssignment.assignment_id
          ? { ...a, user_progress: { ...a.user_progress, ...data } }
          : a
      )
    )
    setShowUploadModal(false)
    setSelectedAssignment(null)
  }

  const handleDownloadResource = resource => {
    if (!resource) return
    if (resource.url) window.open(resource.url, '_blank')
  }

  const handleMarkComplete = () => {
    setCurrentLesson(prev => ({ ...prev, completed: true }))
    const updatedModules = [...modules]
    const mod = updatedModules[currentLesson.moduleIndex]
    if (mod && !mod.isCompleted) {
      mod.isCompleted = true
      setModules(updatedModules)
    }
  }

  const handleExpandAllSections = () => {
    localStorage.clear()
    window.location.reload()
  }

  const isLastLesson =
    currentLesson.moduleIndex === modules.length - 1 &&
    currentLesson.topicIndex === modules[modules.length - 1]?.topics?.length - 1

  if (!course) return

  const tabCounts = getTabCounts()
  const currentModule = modules[currentLesson.moduleIndex]

  return (
    <div className="py-2 md:py-2 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <CourseHeader
        course={course}
        enrollment={enrollment}
        progress={getCourseProgress()}
        meetDetails={meetDetails}
        meetLoading={isLoadingMeet}
        onJoinMeeting={handleJoinMeeting}
      />

      {/* VIDEO + SIDEBAR GRID */}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-4 md:gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <VideoPlayer title={`${currentModule?.module || 'Intro'}: ${currentLesson.title}`} />
        </div>

        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <div className="h-[300px] md:h-[350px] overflow-y-auto">
              <CourseSidebar
                modules={modules}
                currentLessonId={currentLesson.id}
                onSelectLesson={handleSelectLesson}
                onToggleModule={handleToggleModule}
                expandedModule={expandedModule}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABS BELOW BOTH VIDEO + SIDEBAR */}
      <div>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />
        <div className="p-3 md:p-4">
          {activeTab === 'lesson' && (
            <LessonTab
              currentLesson={currentLesson}
              currentModule={currentModule}
              course={course}
              onMarkComplete={handleMarkComplete}
              onNextLesson={handleNextLesson}
              isLastLesson={isLastLesson}
            />
          )}
          {activeTab === 'assignments' && (
            <AssignmentsTab
              assignments={assignments}
              onUploadAssignment={handleUploadAssignment}
              onViewSubmission={handleViewSubmission}
              onExpandAllSections={handleExpandAllSections}
            />
          )}
          {activeTab === 'resources' && (
            <ResourcesTab resources={resources} onDownloadResource={handleDownloadResource} />
          )}
          {activeTab === 'notes' && <NotesTab tutorialNote={tutorialNote} />}
        </div>
      </div>

      {/* UPLOAD MODAL – lazy loaded with Suspense fallback */}
      {showUploadModal && selectedAssignment && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/30 flex items-center justify-center">Loading...</div>}>
          <UploadAssignmentModal
            assignment={selectedAssignment}
            isOpen
            onClose={() => {
              setShowUploadModal(false)
              setSelectedAssignment(null)
            }}
            onSubmit={handleSubmitAssignment}
          />
        </Suspense>
      )}
    </div>
  )
}

export default CourseLearning