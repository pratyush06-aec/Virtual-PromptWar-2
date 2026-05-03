/**
 * @module profile
 * @description Profile management module with Firebase Storage avatar uploads,
 * XP tracking for first-time voters, and profile editing capabilities.
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sanitizeHTML, validateAge } from '../utils/sanitize.js';

const XP_STORAGE_KEY = 'ballotBuddyXP';
const XP_LEVELS = [
  { name: 'Newbie', min: 0, max: 99, icon: '🌱' },
  { name: 'Explorer', min: 100, max: 299, icon: '🧭' },
  { name: 'Informed', min: 300, max: 499, icon: '📚' },
  { name: 'Expert', min: 500, max: Infinity, icon: '🏆' },
];

/**
 * Gets the current XP for a user.
 * @param {string} uid - User ID
 * @returns {number} Current XP points
 */
export function getXP(uid) {
  try {
    const stored = localStorage.getItem(`${XP_STORAGE_KEY}_${uid}`);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Adds XP points for a user.
 * @param {string} uid - User ID
 * @param {number} points - Points to add
 * @returns {number} New total XP
 */
export function addXP(uid, points) {
  const current = getXP(uid);
  const newTotal = current + points;
  try {
    localStorage.setItem(`${XP_STORAGE_KEY}_${uid}`, String(newTotal));
  } catch {
    // Storage full — silently fail
  }
  return newTotal;
}

/**
 * Gets the XP level information for a given XP amount.
 * @param {number} xp - Current XP points
 * @returns {{name: string, icon: string, min: number, max: number}} Level info
 */
export function getXPLevel(xp) {
  return XP_LEVELS.find((level) => xp >= level.min && xp <= level.max) || XP_LEVELS[0];
}

/**
 * Uploads a profile avatar image to Firebase Storage.
 * @param {File} file - Image file to upload
 * @param {string} uid - User ID for storage path
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export async function uploadAvatar(file, uid) {
  if (!file || !uid) throw new Error('File and user ID are required');
  if (file.size > 2 * 1024 * 1024) throw new Error('File size must be under 2MB');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed');

  const storage = getStorage();
  const storageRef = ref(storage, `avatars/${uid}/profile.${file.name.split('.').pop()}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

/**
 * Gets the avatar URL for a user, falling back to initials-based avatar.
 * @param {Object} profile - User profile object
 * @returns {string} Avatar image URL
 */
export function getAvatarUrl(profile) {
  if (profile.avatarUrl) return profile.avatarUrl;
  const name = sanitizeHTML(profile.name || 'User');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285f4&color=fff&size=128`;
}

/**
 * Renders the profile dropdown/icon into the navigation area.
 * @param {HTMLElement} container - Container for the profile UI
 * @param {Object} state - Application state
 * @param {Function} onSignOut - Sign out callback
 * @param {Function} onEditProfile - Edit profile callback
 */
export function renderProfileIcon(container, state, onSignOut, onEditProfile) {
  if (!container || !state.user) return;

  const avatarUrl = getAvatarUrl(state.user);
  const xp = state.user.persona === 'first-time' ? getXP(state.user.uid) : null;
  const level = xp !== null ? getXPLevel(xp) : null;

  const wrapper = document.createElement('div');
  wrapper.className = 'profile-wrapper';
  wrapper.style.cssText = 'position: relative; display: flex; align-items: center; gap: 0.75rem;';

  // Profile button
  const profileBtn = document.createElement('button');
  profileBtn.id = 'btn-profile';
  profileBtn.className = 'profile-avatar-btn';
  profileBtn.setAttribute('aria-label', 'Open profile menu');
  profileBtn.setAttribute('aria-haspopup', 'true');
  profileBtn.setAttribute('aria-expanded', 'false');
  profileBtn.innerHTML = `<img src="${sanitizeHTML(avatarUrl)}" alt="Profile avatar for ${sanitizeHTML(state.user.name)}" class="profile-avatar-img" />`;

  // Dropdown menu
  const dropdown = document.createElement('div');
  dropdown.id = 'profile-dropdown';
  dropdown.className = 'profile-dropdown';
  dropdown.setAttribute('role', 'menu');
  dropdown.setAttribute('aria-label', 'Profile menu');
  dropdown.style.display = 'none';

  let dropdownHTML = `
    <div class="profile-dropdown-header" role="none">
      <img src="${sanitizeHTML(avatarUrl)}" alt="" class="profile-dropdown-avatar" aria-hidden="true" />
      <div>
        <strong>${sanitizeHTML(state.user.name)}</strong>
        <p style="font-size:0.8rem; margin:0; color: var(--text-muted);">${sanitizeHTML(state.user.email || '')}</p>
        ${state.user.age ? `<p style="font-size:0.75rem; margin:0.2rem 0 0; color: var(--text-muted);">Age: ${sanitizeHTML(String(state.user.age))}</p>` : ''}
      </div>
    </div>
  `;

  if (xp !== null && level) {
    dropdownHTML += `
      <div class="profile-xp-section" role="none">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span style="font-size:0.85rem; font-weight:600;">${level.icon} ${sanitizeHTML(level.name)}</span>
          <span style="font-size:0.8rem; color:var(--primary);">${xp} XP</span>
        </div>
        <div class="xp-progress-bar" role="progressbar" aria-valuenow="${xp}" aria-valuemin="${level.min}" aria-valuemax="${level.max}" aria-label="XP progress">
          <div class="xp-progress-fill" style="width: ${Math.min(100, ((xp - level.min) / (level.max - level.min + 1)) * 100)}%;"></div>
        </div>
      </div>
    `;
  }

  dropdownHTML += `
    <button class="profile-dropdown-item" role="menuitem" id="btn-edit-profile" aria-label="Edit profile">
      ✏️ Edit Profile
    </button>
    <button class="profile-dropdown-item" role="menuitem" id="btn-dropdown-signout" aria-label="Sign out">
      🚪 Sign Out
    </button>
  `;

  dropdown.innerHTML = dropdownHTML;

  // Toggle dropdown
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.style.display !== 'none';
    dropdown.style.display = isOpen ? 'none' : 'block';
    profileBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.style.display = 'none';
      profileBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Escape key closes dropdown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown.style.display !== 'none') {
      dropdown.style.display = 'none';
      profileBtn.setAttribute('aria-expanded', 'false');
      profileBtn.focus();
    }
  });

  wrapper.appendChild(profileBtn);
  wrapper.appendChild(dropdown);
  container.appendChild(wrapper);

  // Attach event listeners after DOM insertion
  setTimeout(() => {
    const editBtn = document.getElementById('btn-edit-profile');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        dropdown.style.display = 'none';
        profileBtn.setAttribute('aria-expanded', 'false');
        if (typeof onEditProfile === 'function') onEditProfile();
      });
    }
    const signOutBtn = document.getElementById('btn-dropdown-signout');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        dropdown.style.display = 'none';
        if (typeof onSignOut === 'function') onSignOut();
      });
    }
  }, 0);
}

/**
 * Renders the profile edit modal/form.
 * @param {HTMLElement} container - Container for the edit form
 * @param {Object} state - Application state
 * @param {Function} onSave - Callback when profile is saved
 * @param {Function} onCancel - Callback to cancel editing
 */
export function renderProfileEdit(container, state, onSave, onCancel) {
  if (!container || !state.user) return;

  const avatarUrl = getAvatarUrl(state.user);

  container.innerHTML = `
    <div class="glass-panel" style="max-width: 500px; margin: 0 auto; width: 100%; padding: 2rem;" role="dialog" aria-label="Edit your profile" aria-modal="false">
      <h2 id="edit-profile-heading">Edit Profile</h2>
      <form id="edit-profile-form" aria-labelledby="edit-profile-heading" novalidate>
        <div class="form-group" style="text-align: center;">
          <img src="${sanitizeHTML(avatarUrl)}" alt="Your current avatar" class="profile-edit-avatar" id="edit-avatar-preview" />
          <div style="margin-top: 0.75rem;">
            <label for="avatar-upload" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem; cursor: pointer;">
              📷 Change Photo
            </label>
            <input type="file" id="avatar-upload" accept="image/*" style="display: none;" aria-label="Upload profile picture" />
          </div>
          <p id="avatar-error" style="color: var(--accent); font-size: 0.8rem; margin-top: 0.5rem; display: none;" role="alert"></p>
        </div>

        <div class="form-group">
          <label>I am a...</label>
          <div class="persona-selector">
            <div class="persona-card ${state.user.persona === 'first-time' ? 'active' : ''}" data-persona="first-time" role="button" tabindex="0" aria-pressed="${state.user.persona === 'first-time'}">
              <div style="font-size:2rem; margin-bottom:0.5rem;">🌱</div>
              <h3 style="font-size:1rem; margin-bottom:0.25rem;">First-Time Voter</h3>
              <p style="font-size:0.8rem; margin:0;">I need guidance</p>
            </div>
            <div class="persona-card ${state.user.persona === 'experienced' ? 'active' : ''}" data-persona="experienced" role="button" tabindex="0" aria-pressed="${state.user.persona === 'experienced'}">
              <div style="font-size:2rem; margin-bottom:0.5rem;">🔍</div>
              <h3 style="font-size:1rem; margin-bottom:0.25rem;">Experienced Voter</h3>
              <p style="font-size:0.8rem; margin:0;">I want candidate info</p>
            </div>
          </div>
          <input type="hidden" id="edit-persona" value="${sanitizeHTML(state.user.persona || '')}" required />
        </div>

        <div class="form-group">
          <label for="edit-name">Full Name</label>
          <input type="text" id="edit-name" class="form-control" value="${sanitizeHTML(state.user.name || '')}" required aria-required="true" maxlength="100" />
        </div>

        <div class="form-group">
          <label for="edit-age">Age</label>
          <input type="number" id="edit-age" class="form-control" value="${state.user.age || ''}" min="18" max="120" placeholder="Enter your age" aria-describedby="age-hint" />
          <small id="age-hint" style="color: var(--text-muted); font-size: 0.8rem;">Must be 18 or older to vote</small>
        </div>

        <div class="form-group">
          <label for="edit-location">Location</label>
          <input type="text" id="edit-location" class="form-control" value="${sanitizeHTML(state.user.location || '')}" required aria-required="true" maxlength="100" />
        </div>

        <div id="edit-form-error" style="color: var(--accent); font-size: 0.85rem; margin-bottom: 0.5rem; display: none;" role="alert"></div>

        <div style="display: flex; gap: 1rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save Changes</button>
          <button type="button" id="btn-cancel-edit" class="btn btn-outline" style="flex: 1;" aria-label="Cancel editing profile">Cancel</button>
        </div>
      </form>
    </div>
  `;

  // Avatar preview on file select
  const fileInput = document.getElementById('avatar-upload');
  const avatarPreview = document.getElementById('edit-avatar-preview');
  const avatarError = document.getElementById('avatar-error');
  let selectedFile = null;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      avatarError.textContent = 'Image must be under 2MB';
      avatarError.style.display = 'block';
      return;
    }
    if (!file.type.startsWith('image/')) {
      avatarError.textContent = 'Please select an image file';
      avatarError.style.display = 'block';
      return;
    }
    avatarError.style.display = 'none';
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      avatarPreview.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Persona selection logic
  const cards = container.querySelectorAll('.persona-card');
  const personaInput = document.getElementById('edit-persona');
  
  cards.forEach(card => {
    const selectCard = () => {
      cards.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-pressed', 'true');
      personaInput.value = card.dataset.persona;
    };
    
    card.addEventListener('click', selectCard);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCard();
      }
    });
  });

  // Form submission
  document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('edit-form-error');
    const name = document.getElementById('edit-name').value.trim();
    const age = document.getElementById('edit-age').value;
    const location = document.getElementById('edit-location').value.trim();
    const persona = document.getElementById('edit-persona').value;

    if (!persona) {
      errorDiv.textContent = 'Please select a voter type.';
      errorDiv.style.display = 'block';
      return;
    }
    if (!name || name.length < 2) {
      errorDiv.textContent = 'Name must be at least 2 characters.';
      errorDiv.style.display = 'block';
      return;
    }
    if (age && !validateAge(age)) {
      errorDiv.textContent = 'Age must be between 18 and 120.';
      errorDiv.style.display = 'block';
      return;
    }
    if (!location || location.length < 2) {
      errorDiv.textContent = 'Location is required.';
      errorDiv.style.display = 'block';
      return;
    }

    errorDiv.style.display = 'none';

    let avatarDownloadUrl = state.user.avatarUrl || '';
    if (selectedFile) {
      try {
        avatarDownloadUrl = await uploadAvatar(selectedFile, state.user.uid);
      } catch (err) {
        avatarError.textContent = `Upload failed: ${err.message}`;
        avatarError.style.display = 'block';
        return;
      }
    }

    const updatedProfile = {
      ...state.user,
      name,
      persona,
      age: age ? parseInt(age, 10) : null,
      location,
      avatarUrl: avatarDownloadUrl,
    };

    if (typeof onSave === 'function') onSave(updatedProfile);
  });

  // Cancel button
  document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    if (typeof onCancel === 'function') onCancel();
  });
}
