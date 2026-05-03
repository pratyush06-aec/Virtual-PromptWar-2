/**
 * @module settings
 * @description Settings panel with Firebase MFA (Multi-Factor Authentication) setup.
 */

import { multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier } from 'firebase/auth';
import { sanitizeHTML } from '../utils/sanitize.js';

const SETTINGS_KEY = 'ballotBuddySettings';

/**
 * Gets settings for a user.
 * @param {string} uid - User ID
 * @returns {Object} User settings
 */
export function getSettings(uid) {
  try {
    const stored = localStorage.getItem(`${SETTINGS_KEY}_${uid}`);
    return stored ? JSON.parse(stored) : { mfaEnabled: false, notifications: true, language: 'en' };
  } catch {
    return { mfaEnabled: false, notifications: true, language: 'en' };
  }
}

/**
 * Saves settings for a user.
 * @param {string} uid - User ID
 * @param {Object} settings - Settings to save
 */
export function saveSettings(uid, settings) {
  try {
    localStorage.setItem(`${SETTINGS_KEY}_${uid}`, JSON.stringify(settings));
  } catch {
    // Storage full — silently fail
  }
}

/**
 * Checks if a user has MFA enrolled via Firebase.
 * @param {Object} firebaseUser - Firebase auth user object
 * @returns {boolean} True if MFA is enrolled
 */
export function isMFAEnrolled(firebaseUser) {
  if (!firebaseUser) return false;
  try {
    const mfa = multiFactor(firebaseUser);
    return mfa.enrolledFactors.length > 0;
  } catch {
    return false;
  }
}

/**
 * Renders the settings panel.
 * @param {HTMLElement} container - Container element
 * @param {Object} state - App state
 * @param {Object} auth - Firebase auth instance
 * @param {Function} onClose - Close callback
 */
export function renderSettings(container, state, auth, onClose) {
  if (!container || !state.user) return;

  const settings = getSettings(state.user.uid);
  let mfaEnrolled = false;
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      mfaEnrolled = isMFAEnrolled(currentUser);
    }
  } catch {
    mfaEnrolled = false;
  }

  container.innerHTML = `
    <div class="glass-panel" style="max-width:600px; margin:0 auto; width:100%; padding:2rem;" role="region" aria-label="Application settings">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
        <h2 id="settings-heading">⚙️ Settings</h2>
      </div>

      <div class="settings-section" role="group" aria-labelledby="security-heading">
        <h3 id="security-heading" style="font-size:1.1rem; margin-bottom:1rem; color:var(--primary);">🔒 Security</h3>
        <div class="glass-card" style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0; font-size:0.95rem;">Two-Step Authentication</h4>
              <p style="font-size:0.8rem; margin:0.3rem 0 0;">Add phone-based verification for extra account security</p>
            </div>
            <div id="mfa-status" style="display:flex; align-items:center; gap:0.5rem;">
              ${mfaEnrolled
                ? '<span style="color:var(--secondary); font-weight:600; font-size:0.85rem;">✅ Active</span>'
                : '<button id="btn-setup-mfa" class="btn btn-primary" style="padding:0.5rem 1rem; font-size:0.8rem;" aria-label="Set up two-factor authentication">Setup</button>'
              }
            </div>
          </div>

          <div id="mfa-setup-area" style="display:none; margin-top:1.5rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.1);">
            <p style="font-size:0.85rem; margin-bottom:1rem;">Enter your phone number to receive verification codes:</p>
            <div class="form-group" style="margin-bottom:0.75rem;">
              <label for="mfa-phone" style="font-size:0.85rem;">Phone Number (with country code)</label>
              <input type="tel" id="mfa-phone" class="form-control" placeholder="+91 9876543210" aria-required="true" style="padding:0.7rem;" />
            </div>
            <div id="recaptcha-container"></div>
            <div id="mfa-verify-section" style="display:none; margin-top:1rem;">
              <label for="mfa-code" style="font-size:0.85rem;">Verification Code</label>
              <input type="text" id="mfa-code" class="form-control" placeholder="Enter 6-digit code" maxlength="6" style="padding:0.7rem; margin-bottom:0.75rem;" aria-label="Verification code" />
              <button id="btn-verify-mfa" class="btn btn-primary" style="width:100%; padding:0.6rem; font-size:0.85rem;">Verify & Enable</button>
            </div>
            <button id="btn-send-mfa-code" class="btn btn-primary" style="width:100%; padding:0.6rem; font-size:0.85rem; margin-top:0.5rem;">Send Verification Code</button>
            <p id="mfa-error" style="color:var(--accent); font-size:0.8rem; margin-top:0.5rem; display:none;" role="alert"></p>
            <p id="mfa-success" style="color:var(--secondary); font-size:0.8rem; margin-top:0.5rem; display:none;" role="status"></p>
          </div>
        </div>
      </div>

      <div class="settings-section" style="margin-top:1.5rem;" role="group" aria-labelledby="prefs-heading">
        <h3 id="prefs-heading" style="font-size:1.1rem; margin-bottom:1rem; color:var(--primary);">🔔 Preferences</h3>
        <div class="glass-card" style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0; font-size:0.95rem;">Notifications</h4>
              <p style="font-size:0.8rem; margin:0.3rem 0 0;">Receive election updates and reminders</p>
            </div>
            <label class="toggle-switch" aria-label="Toggle notifications">
              <input type="checkbox" id="toggle-notifications" ${settings.notifications ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="glass-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0; font-size:0.95rem;">Language</h4>
              <p style="font-size:0.8rem; margin:0.3rem 0 0;">Choose your preferred language</p>
            </div>
            <select id="select-language" class="form-control" style="width:auto; padding:0.5rem 1rem; font-size:0.85rem;" aria-label="Select language">
              <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
              <option value="hi" ${settings.language === 'hi' ? 'selected' : ''}>हिन्दी</option>
              <option value="bn" ${settings.language === 'bn' ? 'selected' : ''}>বাংলা</option>
            </select>
          </div>
        </div>
      </div>

      <button id="btn-close-settings" class="btn btn-outline" style="width:100%; margin-top:2rem;" aria-label="Close settings">Close Settings</button>
    </div>
  `;

  // MFA setup toggle
  const setupBtn = document.getElementById('btn-setup-mfa');
  if (setupBtn) {
    setupBtn.addEventListener('click', () => {
      document.getElementById('mfa-setup-area').style.display = 'block';
      setupBtn.style.display = 'none';
    });
  }

  // MFA send code
  const sendCodeBtn = document.getElementById('btn-send-mfa-code');
  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async () => {
      const phone = document.getElementById('mfa-phone').value.trim();
      const errorEl = document.getElementById('mfa-error');
      const successEl = document.getElementById('mfa-success');
      errorEl.style.display = 'none';
      successEl.style.display = 'none';

      if (!phone || phone.length < 10) {
        errorEl.textContent = 'Please enter a valid phone number with country code.';
        errorEl.style.display = 'block';
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        const mfaSession = await multiFactor(currentUser).getSession();
        const phoneInfoOptions = { phoneNumber: phone, session: mfaSession };

        // Initialize RecaptchaVerifier
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        const phoneAuthProviderInstance = new PhoneAuthProvider(auth);
        const verificationId = await phoneAuthProviderInstance.verifyPhoneNumber(phoneInfoOptions, window.recaptchaVerifier);

        window._mfaVerificationId = verificationId;
        sendCodeBtn.style.display = 'none';
        document.getElementById('mfa-verify-section').style.display = 'block';
        successEl.textContent = 'Verification code sent! Check your phone.';
        successEl.style.display = 'block';
      } catch (err) {
        errorEl.textContent = `Error: ${err.message}`;
        errorEl.style.display = 'block';
      }
    });
  }

  // MFA verify code
  const verifyBtn = document.getElementById('btn-verify-mfa');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      const code = document.getElementById('mfa-code').value.trim();
      const errorEl = document.getElementById('mfa-error');
      const successEl = document.getElementById('mfa-success');

      if (!code || code.length !== 6) {
        errorEl.textContent = 'Please enter the 6-digit verification code.';
        errorEl.style.display = 'block';
        return;
      }

      try {
        const credential = PhoneAuthProvider.credential(window._mfaVerificationId, code);
        const assertion = PhoneMultiFactorGenerator.assertion(credential);
        const currentUser = auth.currentUser;
        await multiFactor(currentUser).enroll(assertion, 'Phone Number');

        settings.mfaEnabled = true;
        saveSettings(state.user.uid, settings);
        successEl.textContent = '✅ Two-factor authentication enabled successfully!';
        successEl.style.display = 'block';
        document.getElementById('mfa-setup-area').style.display = 'none';
        document.getElementById('mfa-status').innerHTML = '<span style="color:var(--secondary); font-weight:600; font-size:0.85rem;">✅ Active</span>';
      } catch (err) {
        errorEl.textContent = `Verification failed: ${err.message}`;
        errorEl.style.display = 'block';
      }
    });
  }

  // Preferences listeners
  document.getElementById('toggle-notifications').addEventListener('change', (e) => {
    settings.notifications = e.target.checked;
    saveSettings(state.user.uid, settings);
  });

  document.getElementById('select-language').addEventListener('change', (e) => {
    settings.language = e.target.value;
    saveSettings(state.user.uid, settings);
  });

  // Close
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    if (typeof onClose === 'function') onClose();
  });
}
