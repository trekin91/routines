// === Hash-based SPA Router ===

const routes = [];
let appContainer = null;
let currentCleanup = null;

export function addRoute(pattern, viewLoader) {
  routes.push({ pattern, viewLoader });
}

export function initRouter(container) {
  appContainer = container;
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function getCurrentHash() {
  return window.location.hash || '#/';
}

async function handleRoute() {
  const hash = window.location.hash || '#/';

  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (match) {
      const params = {};
      if (route.pattern.source) {
        // Extract named groups or positional params
        const groups = match.groups || {};
        if (Object.keys(groups).length > 0) {
          Object.assign(params, groups);
        } else {
          // Positional params
          match.slice(1).forEach((val, i) => {
            params[`p${i}`] = val;
          });
        }
      }

      // Cleanup previous view
      if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
      }

      // Load and render view
      const view = await route.viewLoader();
      appContainer.innerHTML = '';
      appContainer.className = 'view-enter';
      const cleanup = view.render(appContainer, params);
      if (typeof cleanup === 'function') {
        currentCleanup = cleanup;
      }
      return;
    }
  }

  // Fallback: redirect to home
  navigate('#/');
}
