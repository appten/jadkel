const routes = {};
let currentRoute = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  history.pushState(null, '', path);
  handleRoute();
}

export function handleRoute() {
  const path = location.pathname;
  const app = document.getElementById('app');
  
  // Find matching route
  let handler = routes[path];
  if (!handler) {
    // Try prefix match for admin routes
    const keys = Object.keys(routes).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (path.startsWith(key)) { handler = routes[key]; break; }
    }
  }
  if (!handler) handler = routes['/'] || (() => '<h1>404</h1>');
  
  currentRoute = path;
  handler(app);
  updateActiveNav();
}

function updateActiveNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('data-href');
    if (href === currentRoute || (href !== '/' && currentRoute?.startsWith(href))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Handle browser back/forward
window.addEventListener('popstate', handleRoute);

// Intercept link clicks
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-href]');
  if (link) {
    e.preventDefault();
    navigate(link.getAttribute('data-href'));
  }
});
