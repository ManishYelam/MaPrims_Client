import React from 'react'

// TabPanel Component
export const TabPanel = ({ value, activeTab, children }) => {
  if (value !== activeTab) return null
  return <div className="p-2 text-sm">{children}</div> // smaller padding & font
}

// Tabs Component
export const Tabs = ({
  activeTab,
  setActiveTab,
  children,
  assignmentsCount,
  resourcesCount,
  topicsCount,
}) => {
  const tabs = [
    { id: 'lesson', label: 'Lesson', count: topicsCount },
    { id: 'assignments', label: 'Assignments', count: assignmentsCount },
    { id: 'resources', label: 'Resources', count: resourcesCount },
    { id: 'notes', label: 'Notes', count: null },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 px-2" aria-label="Tabs">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}

// Tab Button Component
const TabButton = ({ tab, isActive, onClick }) => {
  const stateClasses = isActive
    ? 'border-primary-500 text-primary-600'
    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${stateClasses}`}
    >
      {tab.label}
      {tab.count !== null && tab.count > 0 && (
        <span className="ml-1 px-1 py-0.5 text-[9px] bg-primary-100 text-primary-800 rounded-full">
          {tab.count}
        </span>
      )}
    </button>
  )
}

// Course Tabs Wrapper
export const CourseTabs = ({
  activeTab,
  setActiveTab,
  assignmentsCount,
  resourcesCount,
  topicsCount,
  children,
}) => (
  <Tabs
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    assignmentsCount={assignmentsCount}
    resourcesCount={resourcesCount}
    topicsCount={topicsCount}
  >
    {children}
  </Tabs>
)