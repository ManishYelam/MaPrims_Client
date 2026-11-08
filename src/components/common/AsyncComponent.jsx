import React, { Suspense } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

export const AsyncComponent = ({ children, fallback = <div>Loading...</div> }) => (
  <ErrorBoundary>
    <Suspense fallback={fallback}>{children}</Suspense>
  </ErrorBoundary>
)
