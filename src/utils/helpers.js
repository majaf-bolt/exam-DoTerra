export function parseQueryParams(search) {
  return Object.fromEntries(new URLSearchParams(search));
}

export function formatPrice(price) {
  return `${Number(price).toFixed(2)} лв`;
}

export function matchRoute(path, routes) {
  const routeSegmentsFromPath = path.split("/").filter(Boolean);

  for (const route of routes) {
    const routeSegments = route.path.split("/").filter(Boolean);
    if (routeSegments.length !== routeSegmentsFromPath.length) {
      continue;
    }

    const params = {};
    let isMatch = true;

    routeSegments.forEach((segment, index) => {
      const currentPathSegment = routeSegmentsFromPath[index];

      if (segment.startsWith(":")) {
        params[segment.slice(1)] = currentPathSegment;
        return;
      }

      if (segment !== currentPathSegment) {
        isMatch = false;
      }
    });

    if (isMatch) {
      return { route, params };
    }
  }

  return null;
}
