import React from 'react';
import { Link } from 'react-router-dom';

const SubHeader = ({ items, currentPath, breadcrumbItems = [], className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={`border-b border-gray-200 bg-primary-50 px-4 py-1 overflow-x-auto hide-scrollbar ${className}`}>   
      {breadcrumbItems.length > 0 && (
        <div className="flex items-center space-x-1 text-sm text-gray-600 flex-wrap">
          {breadcrumbItems.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <span className="text-gray-400 mx-0.5">›</span>}
              {index === breadcrumbItems.length - 1 ? (
                <span className="font-medium text-primary-700">{crumb.name}</span>
              ) : (
                <Link
                  to={crumb.href}
                  className="font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  {crumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Sub‑navigation links (siblings / children) */}
      {/* <nav className="flex space-x-6 text-sm" aria-label="Sub‑navigation">
        {items.map((item) => {
          const isActive =
            currentPath === item.href ||
            currentPath.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                'whitespace-nowrap py-1 border-b-2 font-medium transition-colors',
                isActive
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.name}
            </Link>
          );
        })}
      </nav> */}
    </div>
  );
};

export default React.memo(SubHeader);