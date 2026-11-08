import React, { useState, useEffect } from 'react'
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaCode,
  FaCopy,
  FaMagic,
  FaTrash,
  FaSpinner,
} from 'react-icons/fa'

// Custom UI Components using Tailwind CSS
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
)

const Badge = ({ children, variant = 'default', size = 'md', className = '', ...props }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700',
  }

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

const Button = ({
  children,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  disabled = false,
  onClick,
  as = 'button',
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
    outline:
      'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:opacity-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:opacity-50',
    success:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    warning:
      'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 disabled:bg-yellow-300',
    default: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-100',
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const Component = as

  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      type={type}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </Component>
  )
}

const Alert = ({ children, variant = 'info', className = '', icon, ...props }) => {
  const variants = {
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
    success: 'bg-green-50 border border-green-200 text-green-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
  }

  const icons = {
    info: <FaInfoCircle className="w-5 h-5 text-blue-500" />,
    success: <FaCheckCircle className="w-5 h-5 text-green-500" />,
    warning: <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />,
    error: <FaExclamationTriangle className="w-5 h-5 text-red-500" />,
  }

  return (
    <div className={`p-4 rounded-lg ${variants[variant]} ${className}`} {...props}>
      <div className="flex items-start">
        {icon || icons[variant]}
        <div className="ml-3 flex-1">{children}</div>
      </div>
    </div>
  )
}

const Spinner = ({ size = 'md', className = '', ...props }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}

const JSONLinter = ({ jsonContent, onValidationChange, onApplyFix }) => {
  const [lintResults, setLintResults] = useState({
    errors: [],
    warnings: [],
    suggestions: [],
    score: 0,
  })
  const [isLinting, setIsLinting] = useState(false)

  useEffect(() => {
    if (jsonContent) {
      lintJSON(jsonContent)
    }
  }, [jsonContent])

  const lintJSON = async content => {
    setIsLinting(true)

    try {
      const parsed = JSON.parse(content)
      const results = {
        errors: [],
        warnings: [],
        suggestions: [],
        score: 100,
      }

      // Check for common issues

      // 1. Check for trailing commas
      const trailingCommaRegex = /,\s*}/g
      const trailingCommas = content.match(trailingCommaRegex)
      if (trailingCommas) {
        results.warnings.push({
          message: 'Trailing commas found',
          fix: 'Remove trailing commas before closing braces',
          line: findLineNumber(content, trailingCommas[0]),
          type: 'trailing_commas',
        })
        results.score -= 5
      }

      // 2. Check for single quotes (should be double quotes in JSON)
      const singleQuoteRegex = /'(.*?)'/g
      const singleQuotes = content.match(singleQuoteRegex)
      if (singleQuotes) {
        results.warnings.push({
          message: 'Single quotes found',
          fix: 'Replace single quotes with double quotes',
          line: findLineNumber(content, singleQuotes[0]),
          type: 'single_quotes',
        })
        results.score -= 5
      }

      // 3. Check for missing commas
      const missingCommaRegex = /"\s*\n\s*"/g
      const missingCommas = content.match(missingCommaRegex)
      if (missingCommas) {
        results.errors.push({
          message: 'Missing commas between properties',
          fix: 'Add commas between object properties',
          line: findLineNumber(content, missingCommas[0]),
          type: 'missing_commas',
        })
        results.score -= 10
      }

      // 4. Check for duplicate keys
      const duplicateKeys = findDuplicateKeys(parsed)
      if (duplicateKeys.length > 0) {
        results.errors.push({
          message: `Duplicate keys found: ${duplicateKeys.join(', ')}`,
          fix: 'Remove duplicate keys',
          line: 1,
          type: 'duplicate_keys',
        })
        results.score -= 15
      }

      // 5. Check for circular references (basic check)
      try {
        JSON.stringify(parsed)
      } catch (e) {
        if (e.message.includes('circular')) {
          results.errors.push({
            message: 'Circular reference detected',
            fix: 'Remove circular references in object structure',
            line: 1,
            type: 'circular_reference',
          })
          results.score -= 20
        }
      }

      // 6. Check for very large arrays/objects
      const jsonSize = new Blob([content]).size
      if (jsonSize > 100000) {
        // 100KB
        results.warnings.push({
          message: 'Large JSON file detected',
          fix: 'Consider splitting large arrays or objects',
          line: 1,
          type: 'large_file',
        })
        results.score -= 5
      }

      // 7. Check for proper indentation
      const lines = content.split('\n')
      let inconsistentLines = []
      lines.forEach((line, index) => {
        if (index > 0 && line.trim()) {
          const expectedIndent =
            Math.floor((lines[index - 1].match(/^\s*/) || [''])[0].length / 2) * 2
          const actualIndent = (line.match(/^\s*/) || [''])[0].length
          if (actualIndent !== expectedIndent && Math.abs(actualIndent - expectedIndent) > 2) {
            inconsistentLines.push(index + 1)
          }
        }
      })

      if (inconsistentLines.length > 0) {
        results.suggestions.push({
          message: `Inconsistent indentation at lines: ${inconsistentLines.join(', ')}`,
          fix: 'Use consistent 2-space indentation',
          line: inconsistentLines[0],
          type: 'indentation',
        })
        results.score -= 2
      }

      // 8. Check for empty arrays/objects
      const emptyArrays = countEmptyArrays(parsed)
      if (emptyArrays > 3) {
        results.suggestions.push({
          message: `Multiple empty arrays/objects found (${emptyArrays})`,
          fix: 'Consider removing or populating empty arrays/objects',
          line: 1,
          type: 'empty_structures',
        })
        results.score -= 1
      }

      setLintResults(results)
      if (onValidationChange) {
        onValidationChange(results)
      }
    } catch (error) {
      setLintResults({
        errors: [
          {
            message: `JSON Parse Error: ${error.message}`,
            line: 1,
            fix: 'Check JSON syntax',
            type: 'parse_error',
          },
        ],
        warnings: [],
        suggestions: [],
        score: 0,
      })
    } finally {
      setIsLinting(false)
    }
  }

  const findLineNumber = (content, pattern) => {
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1
      }
    }
    return 1
  }

  const findDuplicateKeys = (obj, path = '', duplicates = []) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const keys = Object.keys(obj)
      const uniqueKeys = new Set()

      keys.forEach(key => {
        if (uniqueKeys.has(key)) {
          duplicates.push(path ? `${path}.${key}` : key)
        } else {
          uniqueKeys.add(key)
        }

        // Recursively check nested objects
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          findDuplicateKeys(obj[key], path ? `${path}.${key}` : key, duplicates)
        }
      })
    }
    return duplicates
  }

  const countEmptyArrays = (obj, count = 0) => {
    if (!obj || typeof obj !== 'object') return count

    if (Array.isArray(obj)) {
      if (obj.length === 0) count++
      obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          count = countEmptyArrays(item, count)
        }
      })
    } else {
      Object.values(obj).forEach(value => {
        if (typeof value === 'object' && value !== null) {
          count = countEmptyArrays(value, count)
        }
      })
    }
    return count
  }

  const applyFix = (issueType, index) => {
    let fixedContent = jsonContent

    switch (issueType) {
      case 'trailing_commas':
        // Remove trailing commas
        fixedContent = jsonContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
        break

      case 'single_quotes':
        // Replace single quotes with double quotes (but not in escaped quotes)
        fixedContent = jsonContent.replace(/(?<!\\)'/g, '"')
        break

      case 'missing_commas':
        // This is complex to fix automatically, we'll just format
        try {
          const parsed = JSON.parse(jsonContent)
          fixedContent = JSON.stringify(parsed, null, 2)
        } catch (e) {
          console.error('Cannot fix missing commas:', e)
          return
        }
        break

      case 'indentation':
        // Format JSON with proper indentation
        try {
          const parsed = JSON.parse(jsonContent)
          fixedContent = JSON.stringify(parsed, null, 2)
        } catch (e) {
          console.error('Cannot fix indentation:', e)
          return
        }
        break

      default:
        // For other issues, just format the JSON
        try {
          const parsed = JSON.parse(jsonContent)
          fixedContent = JSON.stringify(parsed, null, 2)
        } catch (e) {
          console.error('Cannot fix issue:', e)
          return
        }
    }

    if (onApplyFix) {
      onApplyFix(fixedContent)
    }
  }

  const handleQuickFix = fixType => {
    let fixedContent = jsonContent

    if (fixType === 'remove_trailing_commas') {
      fixedContent = jsonContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
    } else if (fixType === 'fix_quotes') {
      fixedContent = jsonContent.replace(/(?<!\\)'/g, '"')
    } else if (fixType === 'format_json') {
      try {
        const parsed = JSON.parse(jsonContent)
        fixedContent = JSON.stringify(parsed, null, 2)
      } catch (e) {
        console.error('Format failed:', e)
        return
      }
    } else if (fixType === 'minify_json') {
      try {
        const parsed = JSON.parse(jsonContent)
        fixedContent = JSON.stringify(parsed)
      } catch (e) {
        console.error('Minify failed:', e)
        return
      }
    }

    if (onApplyFix) {
      onApplyFix(fixedContent)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">JSON Linter</h3>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              lintResults.score >= 90 ? 'success' : lintResults.score >= 70 ? 'warning' : 'error'
            }
          >
            Score: {lintResults.score}/100
          </Badge>
          {isLinting && <Spinner size="sm" />}
        </div>
      </div>

      <div className="space-y-4">
        {/* Errors */}
        {lintResults.errors.length > 0 && (
          <div>
            <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
              <FaExclamationTriangle className="w-4 h-4" />
              Errors ({lintResults.errors.length})
            </h4>
            <div className="space-y-2">
              {lintResults.errors.map((error, index) => (
                <Alert key={index} variant="error" className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{error.message}</div>
                      {error.line && (
                        <div className="text-sm text-red-600 mt-1">Line {error.line}</div>
                      )}
                      <div className="text-sm text-red-500 mt-1">{error.fix}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyFix(error.type, index)}
                      leftIcon={<FaMagic className="w-3 h-3" />}
                    >
                      Fix
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {lintResults.warnings.length > 0 && (
          <div>
            <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
              <FaExclamationTriangle className="w-4 h-4" />
              Warnings ({lintResults.warnings.length})
            </h4>
            <div className="space-y-2">
              {lintResults.warnings.map((warning, index) => (
                <Alert key={index} variant="warning" className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{warning.message}</div>
                      {warning.line && (
                        <div className="text-sm text-yellow-600 mt-1">Line {warning.line}</div>
                      )}
                      <div className="text-sm text-yellow-500 mt-1">{warning.fix}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyFix(warning.type, index)}
                      leftIcon={<FaMagic className="w-3 h-3" />}
                    >
                      Fix
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {lintResults.suggestions.length > 0 && (
          <div>
            <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
              <FaInfoCircle className="w-4 h-4" />
              Suggestions ({lintResults.suggestions.length})
            </h4>
            <div className="space-y-2">
              {lintResults.suggestions.map((suggestion, index) => (
                <Alert key={index} variant="info" className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{suggestion.message}</div>
                      {suggestion.line && (
                        <div className="text-sm text-blue-600 mt-1">Line {suggestion.line}</div>
                      )}
                      <div className="text-sm text-blue-500 mt-1">{suggestion.fix}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyFix(suggestion.type, index)}
                      leftIcon={<FaMagic className="w-3 h-3" />}
                    >
                      Apply
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* All Good */}
        {lintResults.errors.length === 0 &&
          lintResults.warnings.length === 0 &&
          lintResults.suggestions.length === 0 &&
          jsonContent.trim() && (
            <Alert variant="success">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500 w-5 h-5" />
                <span>JSON is well-formed and follows best practices!</span>
              </div>
            </Alert>
          )}

        {/* Empty JSON */}
        {!jsonContent.trim() && (
          <Alert variant="warning">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-500 w-5 h-5" />
              <span>JSON content is empty</span>
            </div>
          </Alert>
        )}

        {/* Quick Fixes */}
        {(lintResults.errors.length > 0 || lintResults.warnings.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              {lintResults.errors.some(e => e.type === 'trailing_commas') ||
                (lintResults.warnings.some(w => w.type === 'trailing_commas') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFix('remove_trailing_commas')}
                    leftIcon={<FaTrash className="w-3 h-3" />}
                  >
                    Remove Trailing Commas
                  </Button>
                ))}
              {lintResults.warnings.some(w => w.type === 'single_quotes') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFix('fix_quotes')}
                  leftIcon={<FaCopy className="w-3 h-3" />}
                >
                  Fix Quotes
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFix('format_json')}
                leftIcon={<FaMagic className="w-3 h-3" />}
              >
                Format JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFix('minify_json')}
                leftIcon={<FaCode className="w-3 h-3" />}
              >
                Minify JSON
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default JSONLinter
