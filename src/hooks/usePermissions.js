import { useContext, useCallback, useMemo } from 'react'
import { AuthContext } from '../context/AuthContext'

const findPermission = (perms, resourceType, action, level = null) => {
  for (const p of perms) {
    if (p.resource_type === resourceType && p.action_type === action) {
      if (level === null || p.level === level) return true
    }
    if (p.children?.length && findPermission(p.children, resourceType, action, level)) {
      return true
    }
  }
  return false
}

export const usePermissions = () => {
  const { user } = useContext(AuthContext)
  const isAdmin = useMemo(() => user?.user?.role === 'super_admin', [user])
  const permissions = useMemo(() => user?.hasPermission || [], [user])
  // console.log(permissions)

  const hasPermission = useCallback(
    (action, resourceType = 'user', level = null) => {
      if (!user) return false
      if (isAdmin) return true
      return findPermission(permissions, resourceType, action, level)
    },
    [user, isAdmin, permissions]
  )
  const canView = useMemo(() => hasPermission('view') || isAdmin, [hasPermission, isAdmin])
  return { hasPermission, canView, isAdmin }
}
