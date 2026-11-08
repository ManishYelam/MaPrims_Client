import React, { memo, useContext, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Folder } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ModuleGrid = ({
  iconMap = {},
  fallbackPath = null,
  emptyMessage = 'No sub‑modules available.',
  basePath = '/dashboard',
}) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const permissions = user?.hasPermission ?? [];

  const getModuleIcon = (permission) => {
    const name = permission.name?.toLowerCase() || '';
    if (iconMap[name]) return iconMap[name];
    const firstWord = name.split(' ')[0];
    if (iconMap[firstWord]) return iconMap[firstWord];
    return Folder;
  };

  const findParentByPath = (perms, currentPath) => {
    if (!perms?.length) return null;

    const stack = [...perms];
    let bestMatch = null;
    let bestLength = -1;

    while (stack.length) {
      const item = stack.pop();
      if (item?.url && item.url !== basePath && currentPath.startsWith(item.url)) {
        const urlLength = item.url.length;
        if (urlLength > bestLength) {
          bestLength = urlLength;
          bestMatch = item;
        }
      }
      if (item?.children?.length) {
        stack.push(...item.children);
      }
    }
    return bestMatch;
  };

  const ModuleCard = memo(({ module, childCount }) => {
    const Icon = module.icon;
    return (
      <Link
        to={module.href}
        className="relative flex flex-col items-center justify-center p-1.5 sm:p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-300 hover:scale-105 transition-all duration-200 group"
      >
        {/* Badge in top‑right corner */}
        {childCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[8px] font-semibold text-white bg-primary-500 rounded-full shadow-sm">
            {childCount}
          </span>
        )}
        <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">
          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
        <span className="mt-0.5 text-[8px] sm:text-[9px] font-medium text-gray-700 text-center group-hover:text-primary-700 leading-tight truncate max-w-full">
          {module.name}
        </span>
      </Link>
    );
  });
  ModuleCard.displayName = 'ModuleCard';

  const Grid = ({ modules }) => {
    if (!modules || modules.length === 0) {
      return <p className="text-gray-500 text-center py-8">{emptyMessage}</p>;
    }

    return (
      <div className="w-full px-1 sm:px-2">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-1 sm:gap-1.5">
          {modules.map((module) => (
            <ModuleCard key={module.name} module={module} childCount={module.childCount || 0} />
          ))}
        </div>
      </div>
    );
  };

  const parentModule = useMemo(() => {
    return findParentByPath(permissions, location.pathname);
  }, [permissions, location.pathname]);

  const childrenPermissions = useMemo(() => {
    return parentModule?.children ?? [];
  }, [parentModule]);

  const modules = useMemo(() => {
    let perms = childrenPermissions;
    if (perms.length === 0 && fallbackPath) {
      const fallbackParent = findParentByPath(permissions, fallbackPath);
      perms = fallbackParent?.children ?? [];
    }
    return perms
      .filter((p) => p.url && p.action_type === 'view')
      .map((p) => {
        // Count sub‑children that are viewable
        const subChildren = p.children?.filter(
          (child) => child.url && child.action_type === 'view'
        ) || [];
        return {
          name: p.name,
          href: p.url,
          icon: getModuleIcon(p),
          childCount: subChildren.length,
        };
      });
  }, [childrenPermissions, permissions, fallbackPath]);

  return <Grid modules={modules} />;
};

export default memo(ModuleGrid);