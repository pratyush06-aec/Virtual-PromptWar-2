import './style.css';
import { candidates } from './data.js';
import { generateCandidateSummary, askBallotBuddy } from './ai.js';

const state = {
  user: null,
  selectedCandidates: [],
};

// Initialize App
function initApp() {
  const storedUser = localStorage.getItem('ballotBuddyUser');
  if (storedUser) {
    state.user = JSON.parse(storedUser);
    renderDashboard();
  } else {
    renderOnboarding();
  }
}

// Render Onboarding (Mock Auth)
function renderOnboarding() {
  const appContainer = document.getElementById('app-container');
  const navActions = document.getElementById('nav-actions');
  
  navActions.innerHTML = ''; // No actions on onboarding
  
  appContainer.innerHTML = `
    <div class="glass-panel" style="max-width: 500px; margin: 0 auto; width: 100%; padding: 2rem;">
      <div class="text-center mb-4">
        <h2>Welcome to BallotBuddy</h2>
        <p>Your personal guide to the elections.</p>
      </div>
      
      <form id="onboarding-form">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" class="form-control" placeholder="Enter your name" required>
        </div>
        
        <div class="form-group">
          <label for="location">Location (City / PIN Code)</label>
          <input type="text" id="location" class="form-control" placeholder="e.g. Kolkata or 700001" required>
        </div>
        
        <div class="form-group">
          <label>I am a...</label>
          <div class="persona-selector">
            <div class="persona-card active" data-persona="first-time">
              <h3>🆕</h3>
              <p style="margin-top: 0.5rem; font-weight: 500; color: white;">First-Time Voter</p>
              <p style="font-size: 0.8rem; margin-top: 0.2rem;">Age 18-22</p>
            </div>
            <div class="persona-card" data-persona="experienced">
              <h3>🗳️</h3>
              <p style="margin-top: 0.5rem; font-weight: 500; color: white;">Experienced Voter</p>
              <p style="font-size: 0.8rem; margin-top: 0.2rem;">I vote regularly</p>
            </div>
          </div>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%;">
          Start My Journey
        </button>
      </form>
    </div>
  `;

  // Handle Persona Selection
  let selectedPersona = 'first-time';
  const personaCards = document.querySelectorAll('.persona-card');
  personaCards.forEach(card => {
    card.addEventListener('click', () => {
      personaCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedPersona = card.dataset.persona;
    });
  });

  // Handle Form Submit
  document.getElementById('onboarding-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const location = document.getElementById('location').value;
    
    const user = { name, location, persona: selectedPersona };
    localStorage.setItem('ballotBuddyUser', JSON.stringify(user));
    state.user = user;
    
    renderDashboard();
  });
}

// Render Dashboard
function renderDashboard() {
  const appContainer = document.getElementById('app-container');
  const navActions = document.getElementById('nav-actions');
  
  // Render Nav
  navActions.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <span style="font-weight: 500; color: var(--text-muted);">Hi, ${state.user.name}</span>
      <button id="btn-logout" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Sign Out</button>
    </div>
  `;
  
  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('ballotBuddyUser');
    state.user = null;
    renderOnboarding();
  });

  // Render Dashboard Content based on Persona
  const isFirstTime = state.user.persona === 'first-time';
  
  appContainer.innerHTML = `
    <div class="glass-card" style="border-left: 4px solid var(--primary);">
      <h3>📍 Location Updates for <span class="gradient-text-primary">${state.user.location}</span></h3>
      <p class="mt-2">Elections are approaching in your area. Make sure your voter ID is ready!</p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;" class="mt-4">
      
      ${isFirstTime ? `
        <div class="glass-panel" style="padding: 2rem;">
          <h2 class="gradient-text">Election Simulator</h2>
          <p class="mt-2 mb-4">Learn the step-by-step process of casting your vote. Earn badges as you go!</p>
          <button id="btn-simulator" class="btn btn-primary">Start Simulator</button>
        </div>
      ` : `
        <div class="glass-panel" style="padding: 2rem;">
          <h2 class="gradient-text">Candidate Compare</h2>
          <p class="mt-2 mb-4">Analyze past performance, assets, and criminal records of candidates in your constituency.</p>
          <button id="btn-compare" class="btn btn-primary">Compare Candidates</button>
        </div>
      `}
      
      <div class="glass-panel" style="padding: 2rem; background: linear-gradient(180deg, rgba(30, 33, 40, 0.6) 0%, rgba(66, 133, 244, 0.1) 100%);">
        <h2>Ask BallotBuddy AI</h2>
        <p class="mt-2 mb-4">Your personal election assistant. Ask anything about the process, rules, or candidates.</p>
        <button id="btn-assistant" class="btn btn-outline" style="background: rgba(255,255,255,0.1); border-color: var(--primary);">Open Assistant</button>
      </div>
      
    </div>
  `;

  // Add event listener to Compare Candidates button
  const compareBtn = document.getElementById('btn-compare');
  if (compareBtn) {
    compareBtn.addEventListener('click', renderCandidateGrid);
  }
  
  // Add event listener for Simulator button
  const simulatorBtn = document.getElementById('btn-simulator');
  if (simulatorBtn) {
    simulatorBtn.addEventListener('click', renderSimulator);
  }
  
  // Add event listener for AI Assistant
  const assistantBtn = document.getElementById('btn-assistant');
  if (assistantBtn) {
    assistantBtn.addEventListener('click', renderAssistant);
  }
}

// Render AI Assistant Interface
function renderAssistant() {
  const appContainer = document.getElementById('app-container');
  const navActions = document.getElementById('nav-actions');
  
  navActions.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button id="btn-back" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;">&larr; Back</button>
    </div>
  `;
  
  document.getElementById('btn-back').addEventListener('click', renderDashboard);

  // Set default mode based on persona
  let currentMode = state.user.persona === 'first-time' ? 'beginner' : 'summary';

  appContainer.innerHTML = `
    <div class="glass-panel" style="display: flex; flex-direction: column; height: 75vh; overflow: hidden;">
      <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="margin-bottom: 0;">BallotBuddy AI</h2>
          <p style="font-size: 0.9rem;">Powered by Google Gemini</p>
        </div>
        
        <div style="display: flex; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.25rem; border-radius: var(--radius-full);">
          <button class="btn mode-btn ${currentMode === 'beginner' ? 'active-mode' : ''}" data-mode="beginner" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: ${currentMode === 'beginner' ? 'var(--secondary)' : 'transparent'}; border: none;">🟢 Beginner</button>
          <button class="btn mode-btn ${currentMode === 'summary' ? 'active-mode' : ''}" data-mode="summary" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: ${currentMode === 'summary' ? 'var(--warning)' : 'transparent'}; border: none; color: ${currentMode === 'summary' ? '#000' : 'white'};">🟡 Summary</button>
          <button class="btn mode-btn ${currentMode === 'deep-dive' ? 'active-mode' : ''}" data-mode="deep-dive" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: ${currentMode === 'deep-dive' ? 'var(--primary)' : 'transparent'}; border: none;">🔵 Deep Dive</button>
        </div>
      </div>
      
      <div id="chat-history" style="flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;">
        <div style="align-self: flex-start; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-md); border-top-left-radius: 0; max-width: 80%;">
          Hi ${state.user.name}! I'm BallotBuddy. How can I help you with the upcoming elections in ${state.user.location}?
        </div>
      </div>
      
      <div style="padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <form id="chat-form" style="display: flex; gap: 1rem;">
          <input type="text" id="chat-input" class="form-control" placeholder="Ask a question..." style="flex: 1;" required>
          <button type="submit" class="btn btn-primary" id="btn-send">Send</button>
        </form>
      </div>
    </div>
  `;

  // Handle Mode Switching
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Reset all buttons
      modeBtns.forEach(b => {
        b.classList.remove('active-mode');
        b.style.background = 'transparent';
        b.style.color = 'white';
      });
      
      // Activate clicked button
      const clickedBtn = e.target;
      currentMode = clickedBtn.dataset.mode;
      clickedBtn.classList.add('active-mode');
      
      if (currentMode === 'beginner') {
        clickedBtn.style.background = 'var(--secondary)';
      } else if (currentMode === 'summary') {
        clickedBtn.style.background = 'var(--warning)';
        clickedBtn.style.color = '#000';
      } else if (currentMode === 'deep-dive') {
        clickedBtn.style.background = 'var(--primary)';
      }
    });
  });

  // Handle Chat Submit
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatHistory = document.getElementById('chat-history');
  const btnSend = document.getElementById('btn-send');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // Add user message to UI
    chatHistory.innerHTML += `
      <div style="align-self: flex-end; background: var(--primary); color: white; padding: 1rem; border-radius: var(--radius-md); border-top-right-radius: 0; max-width: 80%;">
        ${userMessage}
      </div>
    `;
    
    chatInput.value = '';
    btnSend.disabled = true;
    btnSend.textContent = '...';
    
    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Construct context for AI
    const userContext = {
      persona: state.user.persona,
      location: state.user.location,
      aiMode: currentMode
    };

    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    chatHistory.innerHTML += `
      <div id="${loadingId}" style="align-self: flex-start; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-md); border-top-left-radius: 0; max-width: 80%;">
        <em>Thinking...</em>
      </div>
    `;
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Call Gemini API
    const responseText = await askBallotBuddy(userMessage, userContext);

    // Replace loading with actual response
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      // Format response (basic newline to br)
      const formattedResponse = responseText.replace(/\\n/g, '<br>');
      loadingEl.innerHTML = formattedResponse;
    }

    btnSend.disabled = false;
    btnSend.textContent = 'Send';
    chatHistory.scrollTop = chatHistory.scrollHeight;
  });
}

// Render Candidate Grid
function renderCandidateGrid() {
  const appContainer = document.getElementById('app-container');
  const navActions = document.getElementById('nav-actions');
  
  navActions.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button id="btn-back" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;">&larr; Back</button>
    </div>
  `;
  
  document.getElementById('btn-back').addEventListener('click', renderDashboard);

  let gridHTML = `
    <div class="glass-panel" style="padding: 2rem; border-top: 4px solid var(--secondary);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2>Candidate Information System</h2>
          <p>Explore and compare candidates in your area.</p>
        </div>
        <button id="btn-vs-compare" class="btn btn-outline" style="border-color: var(--warning); color: var(--warning);">
          VS Compare Selected (${state.selectedCandidates.length})
        </button>
      </div>
    </div>
    
    <div class="candidate-grid mt-4" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
  `;

  candidates.forEach(c => {
    gridHTML += `
      <div class="glass-card candidate-card" data-id="${c.id}">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <img src="${c.image}" alt="${c.name}" style="width: 50px; height: 50px; border-radius: 50%;">
          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0;">${c.name}</h3>
            <span style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">${c.party}</span>
          </div>
        </div>
        
        <div style="font-size: 0.9rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.5rem;">
          <p><strong>Education:</strong> ${c.education}</p>
          <p><strong>Assets:</strong> <span style="color: var(--secondary);">${c.assets}</span></p>
          <p><strong>Criminal Records:</strong> <span style="color: ${c.criminal_records > 0 ? 'var(--accent)' : 'var(--secondary)'}">${c.criminal_records}</span></p>
        </div>
        
        <div class="mt-4" style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-ai-summary" data-id="${c.id}" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">AI Summary</button>
          <button class="btn btn-outline btn-select-candidate" data-id="${c.id}" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">
            ${state.selectedCandidates.includes(c.id) ? 'Selected ✅' : 'Select'}
          </button>
        </div>
        <div id="summary-result-${c.id}" style="margin-top: 1rem; font-size: 0.85rem; color: #fff; background: rgba(66, 133, 244, 0.1); border-radius: 4px; padding: 0;"></div>
      </div>
    `;
  });

  gridHTML += `
    </div>
    <div id="comparison-container" class="mt-4" style="transition: all 0.3s ease;"></div>
  `;
  appContainer.innerHTML = gridHTML;

  // Add event listeners for AI Summary buttons
  document.querySelectorAll('.btn-ai-summary').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const candidateId = e.target.dataset.id;
      const candidate = candidates.find(c => c.id === candidateId);
      const summaryDiv = document.getElementById(`summary-result-${candidateId}`);
      if (candidate && summaryDiv) {
        summaryDiv.style.padding = '0.75rem';
        summaryDiv.innerHTML = '<em>Generating AI summary...</em>';
        e.target.disabled = true;
        
        const summaryText = await generateCandidateSummary(candidate);
        
        summaryDiv.innerHTML = summaryText;
        e.target.disabled = false;
      }
    });
  });

  // Add event listeners for Candidate Selection buttons
  document.querySelectorAll('.btn-select-candidate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const candidateId = e.target.dataset.id;
      
      // Toggle selection
      if (state.selectedCandidates.includes(candidateId)) {
        state.selectedCandidates = state.selectedCandidates.filter(id => id !== candidateId);
        e.target.textContent = 'Select';
        e.target.style.background = 'transparent';
        e.target.style.color = 'var(--text-main)';
      } else {
        if (state.selectedCandidates.length < 2) {
          state.selectedCandidates.push(candidateId);
          e.target.textContent = 'Selected ✅';
          e.target.style.background = 'rgba(52, 168, 83, 0.2)';
          e.target.style.color = 'white';
        } else {
          alert('You can only compare 2 candidates at a time.');
        }
      }
      
      // Update Header Button
      const vsCompareBtn = document.getElementById('btn-vs-compare');
      if (vsCompareBtn) {
        vsCompareBtn.textContent = `VS Compare Selected (${state.selectedCandidates.length})`;
      }
    });
  });

  // Add event listener for the VS Compare button
  const vsCompareBtn = document.getElementById('btn-vs-compare');
  if (vsCompareBtn) {
    vsCompareBtn.addEventListener('click', () => {
      const compContainer = document.getElementById('comparison-container');
      if (state.selectedCandidates.length !== 2) {
        alert('Please select exactly 2 candidates to compare.');
        return;
      }
      
      const c1 = candidates.find(c => c.id === state.selectedCandidates[0]);
      const c2 = candidates.find(c => c.id === state.selectedCandidates[1]);
      
      compContainer.innerHTML = `
        <div class="glass-panel" style="padding: 2rem; border-top: 4px solid var(--warning); animation: dropIn 0.3s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2>Quick Comparison</h2>
            <button id="btn-clear-compare" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">Clear</button>
          </div>
          
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; color: white;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                  <th style="padding: 1rem; width: 20%;">Metrics</th>
                  <th style="padding: 1rem; width: 40%; border-left: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <img src="${c1.image}" style="width: 30px; height: 30px; border-radius: 50%;">
                      ${c1.name} <span style="font-size: 0.7rem; color: var(--text-muted);">(${c1.party})</span>
                    </div>
                  </th>
                  <th style="padding: 1rem; width: 40%; border-left: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <img src="${c2.image}" style="width: 30px; height: 30px; border-radius: 50%;">
                      ${c2.name} <span style="font-size: 0.7rem; color: var(--text-muted);">(${c2.party})</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
                  <td style="padding: 1rem; font-weight: bold; color: var(--text-muted);">Education</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1);">${c1.education}</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1);">${c2.education}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <td style="padding: 1rem; font-weight: bold; color: var(--text-muted);">Total Assets</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1); color: var(--secondary);">${c1.assets}</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1); color: var(--secondary);">${c2.assets}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
                  <td style="padding: 1rem; font-weight: bold; color: var(--text-muted);">Criminal Records</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1); color: ${c1.criminal_records > 0 ? 'var(--accent)' : 'var(--text-main)'};">${c1.criminal_records}</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1); color: ${c2.criminal_records > 0 ? 'var(--accent)' : 'var(--text-main)'};">${c2.criminal_records}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <td style="padding: 1rem; font-weight: bold; color: var(--text-muted);">Past Record</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">${c1.past}</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">${c2.past}</td>
                </tr>
                <tr>
                  <td style="padding: 1rem; font-weight: bold; color: var(--text-muted);">Electoral Performance</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">${c1.performance}</td>
                  <td style="padding: 1rem; border-left: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">${c2.performance}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Scroll to comparison
      setTimeout(() => {
        compContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);

      // Add clear event listener
      document.getElementById('btn-clear-compare').addEventListener('click', () => {
        state.selectedCandidates = [];
        renderCandidateGrid(); // Re-render to clear selection styles
      });
    });
  }
}

// Render Gamified Election Simulator
function renderSimulator() {
  const appContainer = document.getElementById('app-container');
  const navActions = document.getElementById('nav-actions');
  
  navActions.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button id="btn-back" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;">&larr; Exit Simulator</button>
    </div>
  `;
  
  document.getElementById('btn-back').addEventListener('click', renderDashboard);

  let currentStep = 1;
  const badges = JSON.parse(localStorage.getItem('ballotBuddyBadges')) || [];

  function updateSimulatorUI() {
    let contentHTML = '';
    
    if (currentStep === 1) {
      contentHTML = `
        <div class="text-center">
          <div style="font-size: 4rem; margin-bottom: 1rem;">📝</div>
          <h2>Step 1: Registration & Documents</h2>
          <p class="mt-2" style="max-width: 600px; margin-left: auto; margin-right: auto;">
            Before voting, you must be registered and have the correct documents. Which of the following is a VALID document to carry to the polling booth?
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px; margin: 2rem auto;">
            <button class="btn btn-outline sim-answer" data-correct="false" style="justify-content: flex-start; padding: 1rem;">A) Library Card</button>
            <button class="btn btn-outline sim-answer" data-correct="true" style="justify-content: flex-start; padding: 1rem;">B) EPIC (Voter ID) or Aadhar Card</button>
            <button class="btn btn-outline sim-answer" data-correct="false" style="justify-content: flex-start; padding: 1rem;">C) Electricity Bill</button>
          </div>
        </div>
      `;
    } else if (currentStep === 2) {
      contentHTML = `
        <div class="text-center">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🏫</div>
          <h2>Step 2: Inside the Polling Booth</h2>
          <p class="mt-2" style="max-width: 600px; margin-left: auto; margin-right: auto;">
            You have arrived at the booth. The First Polling Officer checks your name on the voter list and your ID. What happens next?
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px; margin: 2rem auto;">
            <button class="btn btn-outline sim-answer" data-correct="false" style="justify-content: flex-start; padding: 1rem;">A) You go straight to vote</button>
            <button class="btn btn-outline sim-answer" data-correct="true" style="justify-content: flex-start; padding: 1rem;">B) Your finger is inked, you sign the register, and receive a slip</button>
            <button class="btn btn-outline sim-answer" data-correct="false" style="justify-content: flex-start; padding: 1rem;">C) You show your documents to the EVM</button>
          </div>
        </div>
      `;
    } else if (currentStep === 3) {
      contentHTML = `
        <div class="text-center">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🗳️</div>
          <h2>Step 3: Casting Your Vote</h2>
          <p class="mt-2" style="max-width: 600px; margin-left: auto; margin-right: auto;">
            You are at the EVM (Electronic Voting Machine). You press the blue button against your chosen candidate. How do you verify your vote was recorded correctly?
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px; margin: 2rem auto;">
            <button class="btn btn-outline sim-answer" data-correct="true" style="justify-content: flex-start; padding: 1rem;">A) Check the VVPAT machine for the printed slip (visible for 7 secs)</button>
            <button class="btn btn-outline sim-answer" data-correct="false" style="justify-content: flex-start; padding: 1rem;">B) Ask the polling officer to confirm</button>
            <button class="btn btn-outline sim-answer" data-correct="false" style="justify-content: flex-start; padding: 1rem;">C) Wait for an SMS confirmation</button>
          </div>
        </div>
      `;
    } else if (currentStep === 4) {
      // Reward granted
      if (!badges.includes('informed-voter')) {
        badges.push('informed-voter');
        localStorage.setItem('ballotBuddyBadges', JSON.stringify(badges));
      }
      
      contentHTML = `
        <div class="text-center" style="animation: dropIn 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);">
          <div style="font-size: 5rem; margin-bottom: 1rem;">🎉</div>
          <h2 class="gradient-text-primary">Congratulations!</h2>
          <p class="mt-2" style="max-width: 600px; margin-left: auto; margin-right: auto;">
            You have successfully completed the Election Simulator. You are now ready to cast your vote confidently!
          </p>
          
          <div class="glass-card mt-4" style="display: inline-block; padding: 2rem; background: rgba(52, 168, 83, 0.1); border-color: var(--secondary);">
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏅</div>
            <h3>Badge Unlocked!</h3>
            <p style="color: var(--secondary); font-weight: bold;">"Informed Citizen"</p>
          </div>
          
          <div class="mt-4">
            <button id="btn-finish-sim" class="btn btn-primary">Return to Dashboard</button>
          </div>
        </div>
      `;
    }

    appContainer.innerHTML = `
      <div class="glass-panel" style="padding: 3rem 2rem; min-height: 60vh; display: flex; flex-direction: column; justify-content: center; position: relative;">
        ${currentStep < 4 ? `
          <div style="position: absolute; top: 1.5rem; left: 2rem; right: 2rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
              <span>Progress</span>
              <span>Step ${currentStep} of 3</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${(currentStep / 3) * 100}%; background: var(--primary); transition: width 0.3s ease;"></div>
            </div>
          </div>
        ` : ''}
        
        ${contentHTML}
      </div>
    `;

    // Attach listeners
    if (currentStep < 4) {
      document.querySelectorAll('.sim-answer').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const isCorrect = e.target.dataset.correct === 'true';
          if (isCorrect) {
            e.target.style.background = 'var(--secondary)';
            e.target.style.color = 'white';
            e.target.innerHTML += ' ✅ Correct!';
            setTimeout(() => {
              currentStep++;
              updateSimulatorUI();
            }, 1000);
          } else {
            e.target.style.background = 'var(--accent)';
            e.target.style.color = 'white';
            e.target.innerHTML += ' ❌ Try again!';
            setTimeout(() => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'var(--text-main)';
              e.target.innerHTML = e.target.innerHTML.replace(' ❌ Try again!', '');
            }, 1000);
          }
        });
      });
    } else {
      document.getElementById('btn-finish-sim').addEventListener('click', renderDashboard);
    }
  }

  updateSimulatorUI();
}

// Start App
document.addEventListener('DOMContentLoaded', initApp);
