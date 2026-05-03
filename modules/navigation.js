/**
 * @module navigation
 * @description Navigation history stack management for single-page application routing.
 * Provides back button functionality and browser history API integration.
 */

/** @type {Array<{name: string, renderFn: Function}>} Navigation history stack */
const navStack = [];

/**
 * Pushes a new view onto the navigation stack.
 * @param {string} name - Human-readable view name for accessibility
 * @param {Function} renderFn - Function to call to render this view
 */
export function pushView(name, renderFn) {
  navStack.push({ name, renderFn });
  try {
    window.history.pushState({ viewIndex: navStack.length - 1 }, '', '');
  } catch (e) {
    // Silently handle if pushState fails (e.g. in test environments)
  }
}

/**
 * Navigates back one step in the navigation stack.
 * @returns {boolean} True if navigation occurred, false if at root
 */
export function goBack() {
  if (navStack.length > 1) {
    navStack.pop();
    const previous = navStack[navStack.length - 1];
    if (previous && typeof previous.renderFn === 'function') {
      previous.renderFn();
    }
    return true;
  }
  return false;
}

/**
 * Returns the current depth of the navigation stack.
 * @returns {number} Number of views in the stack
 */
export function getStackDepth() {
  return navStack.length;
}

/**
 * Returns the name of the current view.
 * @returns {string} Current view name
 */
export function getCurrentViewName() {
  if (navStack.length === 0) return '';
  return navStack[navStack.length - 1].name;
}

/**
 * Clears the entire navigation stack (used on logout or reset).
 */
export function clearStack() {
  navStack.length = 0;
}

/**
 * Initializes the browser popstate listener for back/forward buttons.
 * @param {Function} fallbackRender - Function to render if stack is empty
 */
export function initBrowserNavigation(fallbackRender) {
  window.addEventListener('popstate', () => {
    if (navStack.length > 1) {
      navStack.pop();
      const previous = navStack[navStack.length - 1];
      if (previous && typeof previous.renderFn === 'function') {
        previous.renderFn();
      }
    } else if (typeof fallbackRender === 'function') {
      fallbackRender();
    }
  });
}

/**
 * Renders a back button into the target container.
 * @param {HTMLElement} container - Container to render the back button into
 * @param {string} label - Button label text
 * @returns {HTMLButtonElement|null} The created button, or null if at root
 */
export function renderBackButton(container, label = 'Back') {
  if (navStack.length <= 1 || !container) return null;

  const btn = document.createElement('button');
  btn.id = 'btn-nav-back';
  btn.className = 'btn btn-outline';
  btn.setAttribute('aria-label', `Go back to previous page`);
  btn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.85rem;';
  btn.innerHTML = `&larr; ${label}`;

  btn.addEventListener('click', () => {
    goBack();
  });

  // Keyboard accessibility
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goBack();
    }
  });

  container.appendChild(btn);
  return btn;
}
