/**
 * @module dom
 * @description Safe DOM manipulation utilities that prevent XSS vulnerabilities
 * by avoiding direct innerHTML usage with user-generated content.
 */

/**
 * Creates an HTML element with specified attributes and children.
 * Uses safe attribute setting — no innerHTML for user content.
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes to set on the element
 * @param {...(Node|string)} children - Child nodes or text strings
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset' && typeof value === 'object') {
      for (const [dk, dv] of Object.entries(value)) {
        el.dataset[dk] = dv;
      }
    } else if (key === 'htmlContent') {
      // Only for trusted HTML — never for user-generated content
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  }

  children.forEach((child) => {
    if (child == null) return;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });

  return el;
}

/**
 * Safely sets the text content of an element (auto-escapes HTML).
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to set
 */
export function safeSetText(element, text) {
  if (element && typeof text === 'string') {
    element.textContent = text;
  }
}

/**
 * Clears all children of an element safely.
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
  if (element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}

/**
 * Creates a DocumentFragment from an array of elements for batch DOM insertion.
 * @param {HTMLElement[]} elements - Array of elements to add
 * @returns {DocumentFragment} Fragment containing all elements
 */
export function createFragment(elements) {
  const fragment = document.createDocumentFragment();
  elements.forEach((el) => {
    if (el instanceof Node) fragment.appendChild(el);
  });
  return fragment;
}

/**
 * Announces a message to screen readers via an ARIA live region.
 * @param {string} message - Message to announce
 * @param {'polite'|'assertive'} priority - Announcement priority
 */
export function announceToScreenReader(message, priority = 'polite') {
  let announcer = document.getElementById('sr-announcer');
  if (!announcer) {
    announcer = createElement('div', {
      id: 'sr-announcer',
      'aria-live': priority,
      'aria-atomic': 'true',
      className: 'sr-only',
      role: 'status',
    });
    document.body.appendChild(announcer);
  }
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

/**
 * Sets focus to the first focusable element within a container.
 * @param {HTMLElement} container - Container to search within
 */
export function focusFirstInteractive(container) {
  if (!container) return;
  const focusable = container.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) {
    focusable.focus();
  }
}

/**
 * Creates a keyboard-accessible click handler that responds to Enter and Space.
 * @param {Function} handler - Click handler function
 * @returns {Function} Keyboard event handler
 */
export function onKeyboardActivate(handler) {
  return function keyboardHandler(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler(event);
    }
  };
}
