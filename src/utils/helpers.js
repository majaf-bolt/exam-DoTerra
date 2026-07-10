export const PRODUCT_PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240' viewBox='0 0 400 240'%3E%3Crect fill='%23198754' width='400' height='240'/%3E%3Ctext fill='%23ffffff' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EdoTERRA%3C/text%3E%3C/svg%3E";

export function getProductImageUrl(imageUrl) {
  return imageUrl || PRODUCT_PLACEHOLDER_IMAGE;
}

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
