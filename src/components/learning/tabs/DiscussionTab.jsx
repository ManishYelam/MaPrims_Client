import React, { useState } from 'react'
import { Icon } from '../common/Icon'

export const DiscussionTab = () => {
  const [question, setQuestion] = useState('')

  const handlePostQuestion = () => {
    if (!question.trim()) return
    // console.log('Posting question:', question)
    setQuestion('')
    alert('Question posted successfully!')
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Lesson Discussion</h3>
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Icon name="User" className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">How do I center a div?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Can someone explain different ways to center a div both horizontally and vertically?
            </p>
            <div className="text-xs text-gray-500 mt-2">Posted 2 hours ago by John Doe</div>
          </div>
        </div>
      </div>
      <div className="flex space-x-3">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Ask a question about this lesson..."
        />
        <button
          onClick={handlePostQuestion}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Post
        </button>
      </div>
    </div>
  )
}
