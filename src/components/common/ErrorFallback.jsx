import React from 'react';

export const ErrorFallback = ({ error, resetError }) => {
  return (
    <div className="w-full p-6 text-center">
      {error?.stack && (
        <pre className="w-full text-left text-xs bg-gray-100 p-3 rounded border border-gray-200 overflow-x-auto mb-4 whitespace-pre">
          {error.stack}
        </pre>
      )}
    </div>
  );
};