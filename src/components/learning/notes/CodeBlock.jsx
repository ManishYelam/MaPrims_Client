// components/learning/tabs/CodeBlock.jsx
import React from 'react'
import { Icon } from '../common/Icon'

export const CodeBlock = ({ code, language = 'javascript', showCopyButton = true }) => {
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        alert('Code copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy code:', err)
      })
  }

  return (
    <div className="relative group">
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <span className="px-2 py-1 bg-gray-800 text-gray-200 text-xs font-mono rounded-bl-lg">
          {language}
        </span>
        {showCopyButton && (
          <button
            onClick={copyToClipboard}
            className="px-2 py-1 bg-gray-700 text-gray-200 text-xs hover:bg-gray-600 transition-colors rounded-tr-lg flex items-center gap-1"
          >
            <Icon name="Copy" className="w-3 h-3" />
            Copy
          </button>
        )}
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mt-8">
        <code className="whitespace-pre-wrap break-words">{code}</code>
      </pre>
    </div>
  )
}
