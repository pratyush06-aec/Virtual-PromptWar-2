/**
 * @module theme
 * @description Theme management module supporting Light, Dark, and System Default modes.
 * Persists user preference in localStorage and respects prefers-color-scheme.
 */

const THEME_STORAGE_KEY = 'ballotBuddyTheme';

/** @type {'light'|'dark'|'system'} */
let currentTheme = 'dark';

/**
 * Initializes the theme system from stored preference or system default.
 */
export function initTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    currentTheme = stored;
  } else {
    currentTheme = 'dark';
  }
  applyTheme(currentTheme);

  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (currentTheme === 'system') {
      applyResolvedTheme();
    }
  });
}

/**
 * Applies the specified theme to the document.
 * @param {'light'|'dark'|'system'} theme - Theme to apply
 */
export function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyResolvedTheme();
}

/**
 * Resolves 'system' to actual light/dark and applies to DOM.
 */
function applyResolvedTheme() {
  let resolved = currentTheme;
  if (currentTheme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', resolved);
}

/**
 * Returns the current theme setting.
 * @returns {'light'|'dark'|'system'} Current theme
 */
export function getTheme() {
  return currentTheme;
}

/**
 * Cycles to the next theme: dark → light → system → dark.
 * @returns {'light'|'dark'|'system'} The newly applied theme
 */
export function cycleTheme() {
  const order = ['dark', 'light', 'system'];
  const idx = order.indexOf(currentTheme);
  const next = order[(idx + 1) % order.length];
  applyTheme(next);
  return next;
}

/**
 * Renders the theme toggle button into a container.
 * @param {HTMLElement} container - Container element for the toggle
 * @returns {HTMLButtonElement} The theme toggle button
 */
export function renderThemeToggle(container) {
  const btn = document.createElement('button');
  btn.id = 'btn-theme-toggle';
  btn.className = 'btn btn-outline theme-toggle-btn';
  btn.setAttribute('aria-label', `Toggle theme. Current: ${currentTheme}`);
  btn.setAttribute('title', 'Toggle theme');
  btn.style.cssText = 'padding: 0.5rem; font-size: 1.1rem; min-width: 40px; border-radius: 50%;';

  function updateIcon() {
    const icons = { dark: '🌙', light: '☀️', system: '💻' };
    btn.textContent = icons[currentTheme] || '🌙';
    btn.setAttribute('aria-label', `Toggle theme. Current: ${currentTheme}`);
  }

  updateIcon();

  btn.addEventListener('click', () => {
    cycleTheme();
    updateIcon();
  });

  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cycleTheme();
      updateIcon();
    }
  });

  if (container) {
    container.appendChild(btn);
  }
  return btn;
}
