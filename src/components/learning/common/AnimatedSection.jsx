import React, { useEffect, useState, useRef } from 'react'

export const AnimatedSection = ({ isExpanded, children, className = '' }) => {
  const [height, setHeight] = useState(0)
  const contentRef = useRef(null)

  useEffect(() => {
    if (contentRef.current) {
      if (isExpanded) {
        setHeight(contentRef.current.scrollHeight)
      } else {
        setHeight(0)
      }
    }
  }, [isExpanded, children])

  return (
    <div
      ref={contentRef}
      className={`overflow-hidden transition-all duration-300 ease-in-out ${className}`}
      style={{
        maxHeight: `${height}px`,
        opacity: isExpanded ? 1 : 0.8,
      }}
    >
      {children}
    </div>
  )
}
