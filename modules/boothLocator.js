/**
 * @module boothLocator
 * @description Polling booth locator using mock data.
 * Matches user location (city name or PIN code) to nearby booths.
 */

import { boothData, pinToCityMap } from '../data/boothData.js';
import { sanitizeHTML } from '../utils/sanitize.js';

/**
 * Finds booths matching a location string (city name or PIN code).
 * @param {string} location - User's location (city name, PIN, or "City/PIN")
 * @returns {{city: string, booths: Array}} Matching city and booths
 */
export function findBooths(location) {
  if (!location || typeof location !== 'string') return { city: '', booths: [] };

  const input = location.trim().toLowerCase();

  // Try PIN code first
  const pinMatch = input.match(/\d{6}/);
  if (pinMatch && pinToCityMap[pinMatch[0]]) {
    const city = pinToCityMap[pinMatch[0]];
    return { city, booths: boothData[city] || [] };
  }

  // Try city name match
  for (const city of Object.keys(boothData)) {
    if (input.includes(city)) {
      return { city, booths: boothData[city] };
    }
  }

  // Partial match
  for (const city of Object.keys(boothData)) {
    if (city.includes(input) || input.includes(city.substring(0, 4))) {
      return { city, booths: boothData[city] };
    }
  }

  return { city: '', booths: [] };
}

/**
 * Renders the booth locator card for the dashboard.
 * @param {string} location - User's location
 * @returns {string} HTML string for the booth locator card
 */
export function renderBoothCard(location) {
  const { city, booths } = findBooths(location);

  if (booths.length === 0) {
    return `
      <div class="glass-card" style="border-left:4px solid var(--warning);" role="region" aria-label="Polling booth information">
        <h3 style="font-size:1.1rem;">🏛️ Polling Booth Locator</h3>
        <p class="mt-2" style="font-size:0.9rem;">No booths found for your location. Try updating your location in profile settings.</p>
      </div>
    `;
  }

  const booth = booths[0];
  return `
    <div class="glass-card" style="border-left:4px solid var(--secondary);" role="region" aria-label="Your nearest polling booth">
      <h3 style="font-size:1.1rem;">🏛️ Your Nearest Polling Booth</h3>
      <div style="margin-top:0.75rem; font-size:0.9rem; display:flex; flex-direction:column; gap:0.4rem;">
        <p><strong>Booth:</strong> ${sanitizeHTML(booth.name)}</p>
        <p><strong>Address:</strong> ${sanitizeHTML(booth.address)}</p>
        <p><strong>Timings:</strong> ${sanitizeHTML(booth.timings)}</p>
        <p><strong>Type:</strong> <span style="background:rgba(52,168,83,0.2); padding:0.15rem 0.5rem; border-radius:4px; font-size:0.8rem;">${sanitizeHTML(booth.type)}</span></p>
      </div>
      <div style="margin-top:1rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
        <a href="${sanitizeHTML(booth.mapUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.8rem; text-decoration:none;" aria-label="Open booth location in Google Maps">
          📍 View on Map
        </a>
        <button class="btn btn-outline btn-view-all-booths" style="padding:0.4rem 0.8rem; font-size:0.8rem;" aria-label="View all ${booths.length} booths in ${sanitizeHTML(city)}">
          View All ${booths.length} Booths
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders a full list of booths for a location.
 * @param {HTMLElement} container - Container element
 * @param {string} location - User's location
 */
export function renderAllBooths(container, location) {
  const { city, booths } = findBooths(location);

  if (!container) return;

  let html = `
    <div class="glass-panel" style="padding:2rem; border-top:4px solid var(--secondary);" role="region" aria-label="All polling booths in ${sanitizeHTML(city)}">
      <h2>🏛️ Polling Booths in ${sanitizeHTML(city.charAt(0).toUpperCase() + city.slice(1))}</h2>
      <p class="mt-2" style="margin-bottom:1.5rem;">Found ${booths.length} booths in your area</p>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
  `;

  booths.forEach((booth) => {
    html += `
      <div class="glass-card" role="article" aria-label="Booth: ${sanitizeHTML(booth.name)}">
        <h4 style="font-size:0.95rem; margin-bottom:0.5rem;">${sanitizeHTML(booth.name)}</h4>
        <p style="font-size:0.85rem; color:var(--text-muted);">${sanitizeHTML(booth.address)}</p>
        <p style="font-size:0.8rem; margin-top:0.4rem;"><strong>Timings:</strong> ${sanitizeHTML(booth.timings)}</p>
        <p style="font-size:0.8rem; margin-top:0.2rem;"><strong>Type:</strong> ${sanitizeHTML(booth.type)}</p>
        <a href="${sanitizeHTML(booth.mapUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="margin-top:0.75rem; padding:0.4rem 0.8rem; font-size:0.8rem; text-decoration:none; display:inline-block;" aria-label="Open ${sanitizeHTML(booth.name)} in Google Maps">
          📍 Map
        </a>
      </div>
    `;
  });

  html += '</div></div>';
  container.innerHTML = html;
}
