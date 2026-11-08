export const buildRoutesFromPermissions = (permissions) => {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return [];
  }
  const routes = [];
  const seenUrls = new Set();
  const stack = [...permissions];
  while (stack.length) {
    const permission = stack.pop();
    if (!permission) continue;
    const { url, element, permission_id, children } = permission;
    if (url && element && !seenUrls.has(url)) {
      seenUrls.add(url);
      routes.push({
        key: permission_id,
        permissionId: permission_id,
        elementName: element,
        path: url.startsWith('/dashboard/')
          ? url.slice(11)
          : url.replace(/^\//, ''),
      });
    }
    if (Array.isArray(children) && children.length) {
      stack.push(...children);
    }
  }
  return routes;
};