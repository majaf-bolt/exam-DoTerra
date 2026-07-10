import { matchRoute, parseQueryParams } from "./helpers.js";
import { canAccessAdminRoute, canAccessProtectedRoute } from "./auth-guard.js";

export function createRouter({
  routes,
  rootElement,
  guards,
  onAuthRequired,
  onForbidden
}) {
  const renderCurrentRoute = () => {
    const path = window.location.pathname;
    const routeMatch = matchRoute(path, routes);

    if (!routeMatch) {
      rootElement.innerHTML = `<div class="alert alert-danger">Page not found.</div>`;
      return;
    }

    const { route, params } = routeMatch;

    if (!canAccessProtectedRoute(route, guards)) {
      onAuthRequired?.();
      return;
    }

    if (!canAccessAdminRoute(route, guards)) {
      onForbidden?.();
      return;
    }

    route.render(rootElement, {
      params,
      query: parseQueryParams(window.location.search),
      navigate
    });
  };

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    renderCurrentRoute();
  };

  const start = () => {
    window.addEventListener("popstate", renderCurrentRoute);
    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-link]");
      if (!link) {
        return;
      }

      event.preventDefault();
      navigate(link.getAttribute("href"));
    });

    renderCurrentRoute();
  };

  return {
    start,
    navigate
  };
}
