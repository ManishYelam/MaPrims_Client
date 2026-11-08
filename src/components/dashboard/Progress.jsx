// src/pages/dashboard/Progress.jsx
import React from 'react'

const Progress = () => {
  const progressData = {
    overallProgress: 68,
    weeklyStudy: [12, 8, 15, 10, 18, 14, 9], // hours per day
    skills: [
      { name: 'ABAP Syntax', level: 90 },
      { name: 'Data Dictionary', level: 75 },
      { name: 'Modularization', level: 60 },
      { name: 'Reports', level: 45 },
      { name: 'Dialog Programming', level: 30 },
    ],
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Learning Progress</h1>

      {/* Overall Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h2>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
              <div
                className="w-28 h-28 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{
                  background: `conic-gradient(#4f46e5 ${progressData.overallProgress * 3.6}deg, #e5e7eb 0deg)`,
                }}
              >
                {progressData.overallProgress}%
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-primary-600 rounded"></div>
              <span className="text-gray-700">Completed: {progressData.overallProgress}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-gray-700">
                Remaining: {100 - progressData.overallProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Mastery</h2>
        <div className="space-y-4">
          {progressData.skills.map(skill => (
            <div key={skill.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{skill.name}</span>
                <span className="text-gray-600">{skill.level}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Study Hours */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Study Hours</h2>
        <div className="flex items-end justify-between h-32">
          {progressData.weeklyStudy.map((hours, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className="w-8 bg-primary-600 rounded-t-lg transition-all duration-500 hover:bg-primary-700"
                style={{ height: `${hours * 4}px` }}
              />
              <span className="text-xs text-gray-600 mt-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Progress
