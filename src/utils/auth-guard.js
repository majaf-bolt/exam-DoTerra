export function canAccessProtectedRoute(route, guards) {
  if (!route.protected) {
    return true;
  }

  return Boolean(guards?.isAuthenticated?.());
}

export function canAccessAdminRoute(route, guards) {
  if (!route.adminOnly) {
    return true;
  }

  return Boolean(guards?.isAdmin?.());
}
