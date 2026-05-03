import { auth, googleProvider } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { generateCandidateSummary, askBallotBuddy, clearSummaryCache } from './ai.js';
import { sanitizeHTML, sanitizeObject } from './utils/sanitize.js';
import { createElement, safeSetText, clearElement, announceToScreenReader } from './utils/dom.js';
import { initTheme, renderThemeToggle, getTheme } from './modules/theme.js';
import { renderProfileIcon, renderProfileEdit } from './modules/profile.js';
import { renderNotepadFAB, renderNotepadPanel } from './modules/notepad.js';
import { renderSettings } from './modules/settings.js';
import { renderBoothCard, renderAllBooths } from './modules/boothLocator.js';
import { renderECIRulesCard, initECIAccordion } from './modules/eciRules.js';
import { pushView, initBrowserNavigation, renderBackButton, clearStack } from './modules/navigation.js';

// Application State
const state = {
  user: null,
  candidates: [],
  selectedCandidate: null,
  isLoading: true,
  error: null,
};

// DOM Elements
const appContainer = document.getElementById('app-container');
const navActions = document.getElementById('nav-actions');

/**
 * Initializes the application.
 */
async function initApp() {
  initTheme();
  
  // Set up auth listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // In a real app, we'd fetch profile from Firestore here. 
      // For this demo, we'll store additional info in localStorage or just use auth info.
      const storedProfileStr = localStorage.getItem(`profile_${user.uid}`);
      const storedProfile = storedProfileStr ? JSON.parse(storedProfileStr) : {};
      
      state.user = {
        uid: user.uid,
        name: storedProfile.name || user.displayName || 'Voter',
        email: user.email,
        persona: storedProfile.persona || null,
        age: storedProfile.age || null,
        location: storedProfile.location || '',
        avatarUrl: storedProfile.avatarUrl || user.photoURL || null,
      };
      
      // Fetch candidates
      await fetchCandidates();
      
      if (!state.user.persona) {
        renderOnboarding();
      } else {
        renderDashboard();
      }
    } else {
      state.user = null;
      state.candidates = [];
      clearStack();
      renderAuthScreen();
    }
    updateNav();
  });

  initBrowserNavigation(renderAuthScreen);
}

/**
 * Fetches candidates from backend proxy.
 */
async function fetchCandidates() {
  try {
    const response = await fetch('/api/candidates');
    if (!response.ok) throw new Error('Failed to fetch candidates');
    const data = await response.json();
    state.candidates = data.candidates || [];
  } catch (err) {
    console.error(err);
    state.error = 'Failed to load candidate data.';
  }
}

/**
 * Updates the navigation bar (theme toggle, profile, back button).
 */
function updateNav() {
  clearElement(navActions);
  
  // Back button container handled inside left nav
  const leftNav = document.querySelector('.nav-left');
  const backBtnContainer = document.getElementById('nav-back');
  if (backBtnContainer) {
    clearElement(backBtnContainer);
    renderBackButton(backBtnContainer);
  }

  // Right nav actions
  const actionsWrapper = document.createElement('div');
  actionsWrapper.style.display = 'flex';
  actionsWrapper.style.alignItems = 'center';
  actionsWrapper.style.gap = '1rem';

  renderThemeToggle(actionsWrapper);

  if (state.user) {
    // Settings icon
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'btn btn-outline';
    settingsBtn.style.cssText = 'padding: 0.4rem; border-radius: 50%; font-size: 1.1rem;';
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.setAttribute('aria-label', 'Settings');
    settingsBtn.addEventListener('click', () => {
      pushView('Settings', () => renderSettingsView());
      renderSettingsView();
    });
    actionsWrapper.appendChild(settingsBtn);

    renderProfileIcon(actionsWrapper, state, () => signOut(auth), () => {
      pushView('Edit Profile', () => renderProfileEditView());
      renderProfileEditView();
    });
  }

  navActions.appendChild(actionsWrapper);
}

/**
 * Renders the Auth (Login) Screen.
 */
function renderAuthScreen() {
  clearElement(appContainer);
  
  const html = `
    <div style="max-width:400px; margin:4rem auto; text-align:center;">
      <h1 class="gradient-text-primary">Welcome to BallotBuddy</h1>
      <p style="margin-bottom:2rem;">Your AI-powered election assistant for making informed choices.</p>
      <div class="glass-card" style="padding:2rem;">
        <h2 style="font-size:1.5rem; margin-bottom:1.5rem;">Sign In</h2>
        <button id="btn-google-login" class="btn btn-primary" style="width:100%;">
          <svg style="width:18px;height:18px;margin-right:8px;" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign in with Google
        </button>
      </div>
    </div>
  `;
  appContainer.innerHTML = html;

  document.getElementById('btn-google-login').addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to sign in. Please try again.');
    }
  });
  
  announceToScreenReader('Welcome to BallotBuddy. Please sign in to continue.');
}

/**
 * Renders Onboarding Screen for Persona & Location.
 */
function renderOnboarding() {
  clearElement(appContainer);
  
  const html = `
    <div style="max-width:500px; margin:2rem auto;">
      <h2 style="text-align:center; margin-bottom:1rem;">Welcome, ${sanitizeHTML(state.user.name)}! 👋</h2>
      <p style="text-align:center; margin-bottom:2rem; color:var(--text-muted);">Let's personalize your BallotBuddy experience.</p>
      
      <form id="onboarding-form" class="glass-card">
        <div class="form-group">
          <label>I am a...</label>
          <div class="persona-selector">
            <div class="persona-card" data-persona="first-time" role="button" tabindex="0" aria-pressed="false">
              <div style="font-size:2rem; margin-bottom:0.5rem;">🌱</div>
              <h3 style="font-size:1rem; margin-bottom:0.25rem;">First-Time Voter</h3>
              <p style="font-size:0.8rem; margin:0;">I need guidance on the process</p>
            </div>
            <div class="persona-card" data-persona="experienced" role="button" tabindex="0" aria-pressed="false">
              <div style="font-size:2rem; margin-bottom:0.5rem;">🔍</div>
              <h3 style="font-size:1rem; margin-bottom:0.25rem;">Experienced Voter</h3>
              <p style="font-size:0.8rem; margin:0;">I just want candidate info</p>
            </div>
          </div>
          <input type="hidden" id="selected-persona" required />
        </div>
        
        <div class="form-group">
          <label for="onboard-location">My Location (City or PIN Code)</label>
          <input type="text" id="onboard-location" class="form-control" placeholder="e.g. Kolkata or 700014" required aria-required="true" />
        </div>
        
        <div class="form-group">
          <label for="onboard-age">Age</label>
          <input type="number" id="onboard-age" class="form-control" placeholder="e.g. 21" min="18" max="120" required aria-required="true" />
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Get Started</button>
      </form>
    </div>
  `;
  appContainer.innerHTML = html;

  // Persona selection logic
  const cards = document.querySelectorAll('.persona-card');
  const input = document.getElementById('selected-persona');
  
  cards.forEach(card => {
    const selectCard = () => {
      cards.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-pressed', 'true');
      input.value = card.dataset.persona;
    };
    
    card.addEventListener('click', selectCard);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCard();
      }
    });
  });

  document.getElementById('onboarding-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value) {
      alert('Please select a voter type.');
      return;
    }
    
    state.user.persona = input.value;
    state.user.location = document.getElementById('onboard-location').value.trim();
    state.user.age = parseInt(document.getElementById('onboard-age').value.trim(), 10);
    
    // Save to localStorage
    localStorage.setItem(`profile_${state.user.uid}`, JSON.stringify(state.user));
    
    pushView('Dashboard', renderDashboard);
    renderDashboard();
  });
  
  announceToScreenReader('Please complete your profile setup.');
}

/**
 * Renders the main Dashboard.
 */
function renderDashboard() {
  clearElement(appContainer);
  updateNav(); // Ensure nav is updated
  
  const isFirstTime = state.user.persona === 'first-time';
  
  let html = `
    <div style="margin-bottom:2rem;">
      <h1>Dashboard</h1>
      <p>Welcome back, ${sanitizeHTML(state.user.name)}. Here is your personalized election hub.</p>
    </div>
    
    <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom:2rem;">
      ${renderBoothCard(state.user.location)}
    </div>
    
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      <div class="glass-card">
        <h2>👥 Candidates</h2>
        <p style="margin-bottom: 1rem;">View and compare candidates in your constituency.</p>
        <button id="btn-view-candidates" class="btn btn-primary">Browse Candidates</button>
      </div>
      <div class="glass-card">
        <h2>🤖 BallotBuddy AI</h2>
        <p style="margin-bottom: 1rem;">Ask questions about candidates, policies, or voting procedures.</p>
        <button id="btn-open-chat" class="btn btn-outline">Ask Buddy</button>
      </div>
    </div>
    
    ${renderECIRulesCard(isFirstTime)}
  `;
  
  appContainer.innerHTML = html;
  initECIAccordion();
  
  // Event listeners
  document.getElementById('btn-view-candidates')?.addEventListener('click', () => {
    pushView('Candidates', renderCandidates);
    renderCandidates();
  });
  
  document.getElementById('btn-open-chat')?.addEventListener('click', () => {
    pushView('AI Chat', renderAIChat);
    renderAIChat();
  });
  
  document.querySelector('.btn-view-all-booths')?.addEventListener('click', () => {
    pushView('All Booths', () => {
      clearElement(appContainer);
      renderAllBooths(appContainer, state.user.location);
    });
    clearElement(appContainer);
    renderAllBooths(appContainer, state.user.location);
  });
  
  // Add Notepad FAB
  renderNotepadFAB(state, () => {
    pushView('Notepad', () => renderNotepadPanel(appContainer, state, () => {
      // on close notepad
      history.back(); // Use history to trigger the popstate which runs goBack
    }));
    clearElement(appContainer);
    renderNotepadPanel(appContainer, state, () => {
      history.back();
    });
  });
  
  announceToScreenReader('Dashboard loaded');
}

/**
 * Renders the Settings View.
 */
function renderSettingsView() {
  clearElement(appContainer);
  renderSettings(appContainer, state, auth, () => {
    history.back();
  });
  announceToScreenReader('Settings page loaded');
}

/**
 * Renders the Profile Edit View.
 */
function renderProfileEditView() {
  clearElement(appContainer);
  renderProfileEdit(appContainer, state, (updatedProfile) => {
    state.user = updatedProfile;
    localStorage.setItem(`profile_${state.user.uid}`, JSON.stringify(state.user));
    updateNav();
    history.back();
  }, () => {
    history.back();
  });
  announceToScreenReader('Edit profile page loaded');
}

/**
 * Renders the Candidates List.
 */
function renderCandidates() {
  clearElement(appContainer);
  updateNav();
  
  if (state.candidates.length === 0) {
    appContainer.innerHTML = `
      <div class="glass-card text-center" style="padding:4rem 2rem;">
        <h2>No Candidates Found</h2>
        <p>We couldn't find any candidates for your area right now.</p>
        <button id="btn-back-dash" class="btn btn-outline mt-2">Back to Dashboard</button>
      </div>
    `;
    document.getElementById('btn-back-dash').addEventListener('click', () => history.back());
    return;
  }
  
  let html = `
    <div style="margin-bottom:2rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
      <div>
        <h1>👥 Candidates</h1>
        <p>Select a candidate to view their AI-generated summary.</p>
      </div>
      ${state.user.persona === 'first-time' ? `
        <button id="btn-compare" class="btn btn-outline" style="border-color:var(--secondary); color:var(--secondary);">
          ⚖️ Compare Candidates
        </button>
      ` : ''}
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:1.5rem;">
  `;
  
  state.candidates.forEach(c => {
    html += `
      <div class="glass-card candidate-card" data-id="${sanitizeHTML(c.id)}" role="button" tabindex="0" aria-label="View details for ${sanitizeHTML(c.name)}">
        <h3 style="margin-bottom:0.5rem; font-size:1.2rem;">${sanitizeHTML(c.name)}</h3>
        <p style="color:var(--primary); font-weight:600; margin-bottom:1rem;">${sanitizeHTML(c.party)}</p>
        <div style="font-size:0.85rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.25rem;">
          <p>🎓 Education: ${sanitizeHTML(c.education)}</p>
          <p>⚖️ Criminal Records: <span style="color:${c.criminal_records > 0 ? 'var(--accent)' : 'inherit'}">${sanitizeHTML(String(c.criminal_records))}</span></p>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  appContainer.innerHTML = html;
  
  document.querySelectorAll('.candidate-card').forEach(card => {
    const activate = () => {
      const candidateId = card.dataset.id;
      const candidate = state.candidates.find(c => String(c.id) === candidateId);
      if (candidate) {
        state.selectedCandidate = candidate;
        pushView('Candidate Detail', renderCandidateDetail);
        renderCandidateDetail();
      }
    };
    
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });
  
  document.getElementById('btn-compare')?.addEventListener('click', () => {
    pushView('Compare Candidates', renderCompareView);
    renderCompareView();
  });
  
  announceToScreenReader(`Loaded ${state.candidates.length} candidates.`);
}

/**
 * Renders Candidate Detail & AI Summary.
 */
async function renderCandidateDetail() {
  clearElement(appContainer);
  updateNav();
  const c = state.selectedCandidate;
  if (!c) {
    history.back();
    return;
  }
  
  appContainer.innerHTML = `
    <div class="glass-panel" style="padding:2rem;" role="region" aria-label="Candidate details">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1.5rem;">
        <div>
          <h1 style="margin-bottom:0.25rem;">${sanitizeHTML(c.name)}</h1>
          <p style="color:var(--primary); font-size:1.1rem; font-weight:600;">${sanitizeHTML(c.party)}</p>
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:2rem;">
        <div class="glass-card" style="padding:1rem;">
          <small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Education</small>
          <strong>${sanitizeHTML(c.education)}</strong>
        </div>
        <div class="glass-card" style="padding:1rem;">
          <small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Assets</small>
          <strong>${sanitizeHTML(c.assets || 'Not declared')}</strong>
        </div>
        <div class="glass-card" style="padding:1rem;">
          <small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Criminal Records</small>
          <strong style="color:${c.criminal_records > 0 ? 'var(--accent)' : 'inherit'}">${sanitizeHTML(String(c.criminal_records))}</strong>
        </div>
      </div>
      
      <div class="glass-card" style="margin-bottom:2rem;">
        <h3 style="margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
          <svg style="width:20px;height:20px;color:var(--primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          AI Summary
        </h3>
        <div id="ai-summary-content" aria-live="polite">
          <div class="skeleton-loader" style="height:20px; width:100%; margin-bottom:10px; background:rgba(255,255,255,0.1); border-radius:4px; animation: pulse 1.5s infinite;"></div>
          <div class="skeleton-loader" style="height:20px; width:90%; margin-bottom:10px; background:rgba(255,255,255,0.1); border-radius:4px; animation: pulse 1.5s infinite;"></div>
          <div class="skeleton-loader" style="height:20px; width:95%; background:rgba(255,255,255,0.1); border-radius:4px; animation: pulse 1.5s infinite;"></div>
        </div>
      </div>
    </div>
  `;
  
  // Inject style for pulse animation if not exists
  if (!document.getElementById('pulse-style')) {
    const style = document.createElement('style');
    style.id = 'pulse-style';
    style.innerHTML = `@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`;
    document.head.appendChild(style);
  }
  
  announceToScreenReader(`Loading AI summary for ${c.name}`);
  
  try {
    const summary = await generateCandidateSummary(c);
    const contentDiv = document.getElementById('ai-summary-content');
    if (contentDiv) {
      contentDiv.innerHTML = `<p style="line-height:1.7; white-space:pre-wrap;">${sanitizeHTML(summary)}</p>`;
      announceToScreenReader('AI summary loaded');
    }
  } catch (err) {
    const contentDiv = document.getElementById('ai-summary-content');
    if (contentDiv) {
      contentDiv.innerHTML = `<p style="color:var(--accent);">Failed to load summary. Please try again later.</p>`;
      announceToScreenReader('Failed to load AI summary');
    }
  }
}

/**
 * Renders Compare Candidates View (for First Time Voters)
 */
function renderCompareView() {
  clearElement(appContainer);
  updateNav();
  
  let html = `
    <div style="margin-bottom:2rem;">
      <h1>⚖️ Compare Candidates</h1>
      <p>A simple breakdown of candidates to help you decide.</p>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; min-width:600px;" class="glass-card" aria-label="Candidate Comparison">
        <thead>
          <tr style="border-bottom:1px solid var(--border-color);">
            <th style="padding:1rem; text-align:left;">Name</th>
            <th style="padding:1rem; text-align:left;">Party</th>
            <th style="padding:1rem; text-align:left;">Education</th>
            <th style="padding:1rem; text-align:left;">Criminal Records</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  state.candidates.forEach(c => {
    html += `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
        <td style="padding:1rem; font-weight:600;">${sanitizeHTML(c.name)}</td>
        <td style="padding:1rem; color:var(--primary);">${sanitizeHTML(c.party)}</td>
        <td style="padding:1rem;">${sanitizeHTML(c.education)}</td>
        <td style="padding:1rem; color:${c.criminal_records > 0 ? 'var(--accent)' : 'inherit'}">${sanitizeHTML(String(c.criminal_records))}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  appContainer.innerHTML = html;
  announceToScreenReader('Candidate comparison table loaded');
}

/**
 * Renders the AI Chat Interface.
 */
function renderAIChat() {
  clearElement(appContainer);
  updateNav();
  
  appContainer.innerHTML = `
    <div class="glass-panel flex-col" style="height: calc(100vh - 140px); max-height:800px; padding:0; overflow:hidden;">
      <div style="padding:1.5rem; border-bottom:1px solid var(--border-color); background:rgba(0,0,0,0.2);">
        <h2 style="margin:0; display:flex; align-items:center; gap:0.5rem;">
          <svg style="width:24px;height:24px;color:var(--primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          Ask BallotBuddy
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">
          Mode: <select id="ai-mode-select" style="background:transparent; border:none; color:var(--primary); outline:none; cursor:pointer; font-weight:600;" aria-label="AI response mode">
            <option value="beginner" ${state.user.persona === 'first-time' ? 'selected' : ''}>Beginner (Simple)</option>
            <option value="summary" ${state.user.persona !== 'first-time' ? 'selected' : ''}>Summary (Gist)</option>
            <option value="deep-dive">Deep Dive (Detailed)</option>
          </select>
        </p>
      </div>
      
      <div id="chat-messages" style="flex:1; overflow-y:auto; padding:1.5rem; display:flex; flex-direction:column; gap:1rem;" role="log" aria-label="Chat messages">
        <div class="chat-message assistant" style="align-self:flex-start; max-width:80%; background:var(--bg-input); padding:1rem 1.25rem; border-radius:1rem 1rem 1rem 0; border:1px solid var(--border-color);">
          Hi ${sanitizeHTML(state.user.name)}! I'm BallotBuddy. How can I help you with the upcoming elections?
        </div>
      </div>
      
      <form id="chat-form" style="padding:1rem 1.5rem; border-top:1px solid var(--border-color); background:rgba(0,0,0,0.1); display:flex; gap:0.75rem;">
        <input type="text" id="chat-input" class="form-control" placeholder="Ask about candidates, rules, or voting..." style="flex:1; border-radius:var(--radius-full);" required aria-label="Your message" maxlength="1000" autocomplete="off" />
        <button type="submit" class="btn btn-primary" style="border-radius:50%; width:48px; height:48px; padding:0; display:flex; align-items:center; justify-content:center;" aria-label="Send message">
          <svg style="width:20px;height:20px;transform:translateX(-1px);" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        </button>
      </form>
    </div>
  `;
  
  const messagesDiv = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const inputEl = document.getElementById('chat-input');
  const modeSelect = document.getElementById('ai-mode-select');
  
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = inputEl.value.trim();
    if (!msg) return;
    
    // Add user message
    messagesDiv.innerHTML += `
      <div class="chat-message user" style="align-self:flex-end; max-width:80%; background:var(--primary); color:white; padding:1rem 1.25rem; border-radius:1rem 1rem 0 1rem; box-shadow:0 4px 15px rgba(66, 133, 244, 0.2);">
        ${sanitizeHTML(msg)}
      </div>
    `;
    inputEl.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    messagesDiv.innerHTML += `
      <div id="${loadingId}" class="chat-message assistant" style="align-self:flex-start; max-width:80%; background:var(--bg-input); padding:1rem 1.25rem; border-radius:1rem 1rem 1rem 0; border:1px solid var(--border-color); display:flex; gap:0.5rem; align-items:center;">
        <span class="dot" style="width:8px;height:8px;background:var(--text-muted);border-radius:50%;animation:pulse 1s infinite alternate;"></span>
        <span class="dot" style="width:8px;height:8px;background:var(--text-muted);border-radius:50%;animation:pulse 1s infinite alternate 0.2s;"></span>
        <span class="dot" style="width:8px;height:8px;background:var(--text-muted);border-radius:50%;animation:pulse 1s infinite alternate 0.4s;"></span>
      </div>
    `;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    try {
      const context = {
        persona: state.user.persona,
        location: state.user.location,
        aiMode: modeSelect.value
      };
      
      const response = await askBallotBuddy(msg, context);
      
      // Replace loading with response
      document.getElementById(loadingId).remove();
      messagesDiv.innerHTML += `
        <div class="chat-message assistant" style="align-self:flex-start; max-width:80%; background:var(--bg-input); padding:1rem 1.25rem; border-radius:1rem 1rem 1rem 0; border:1px solid var(--border-color); white-space:pre-wrap; line-height:1.6;">${sanitizeHTML(response)}</div>
      `;
      announceToScreenReader('BallotBuddy replied');
    } catch (err) {
      document.getElementById(loadingId).remove();
      messagesDiv.innerHTML += `
        <div class="chat-message assistant" style="align-self:flex-start; max-width:80%; background:rgba(234, 67, 53, 0.1); color:var(--accent); padding:1rem 1.25rem; border-radius:1rem 1rem 1rem 0; border:1px solid rgba(234, 67, 53, 0.3);">
          Sorry, I encountered an error. Please try again.
        </div>
      `;
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// Start App
initApp();
