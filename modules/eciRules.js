/**
 * @module eciRules
 * @description Election Commission of India rules and guidelines content.
 * Renders an accessible accordion section with official ECI information.
 */

import { sanitizeHTML } from '../utils/sanitize.js';

/**
 * ECI rules and guidelines data organized by category.
 * @type {Array<{title: string, icon: string, content: string}>}
 */
const eciGuidelines = [
  {
    title: 'Voter Eligibility',
    icon: '✅',
    content: `• Every Indian citizen who has attained the age of 18 years on the qualifying date is eligible to be registered as a voter.\n• The qualifying date is January 1 of the year of revision of the electoral roll.\n• Persons of unsound mind, those disqualified under any law, and non-citizens are not eligible.\n• NRI citizens can also register as overseas voters under Section 20A of the R.P. Act, 1950.`,
  },
  {
    title: 'Required Documents',
    icon: '📄',
    content: `• EPIC (Elector's Photo Identity Card / Voter ID) is the primary document.\n• If EPIC is unavailable, the following are accepted: Aadhaar Card, MGNREGA Job Card, Passbook with photo issued by Bank/Post Office.\n• Additional accepted IDs: Driving License, PAN Card, Smart Card issued by RGI, Indian Passport, Pension document with photo.\n• At least one valid photo ID is mandatory for casting your vote.`,
  },
  {
    title: 'Voting Procedure',
    icon: '🗳️',
    content: `1. Visit your assigned polling booth on election day between 7:00 AM and 6:00 PM.\n2. Stand in the queue; separate queues may be available for differently-abled and senior citizens.\n3. The First Polling Officer verifies your identity against the electoral roll.\n4. The Second Polling Officer applies indelible ink on your left index finger.\n5. You sign or put your thumb impression on the register and receive a voter slip.\n6. The Third Polling Officer allows you to enter the voting compartment.\n7. Press the button on the EVM (Electronic Voting Machine) next to the symbol of your chosen candidate.\n8. You will hear a beep; verify your vote on the VVPAT (Voter Verifiable Paper Audit Trail) slip visible for 7 seconds.\n9. Exit the polling booth quietly.`,
  },
  {
    title: "Do's and Don'ts on Election Day",
    icon: '⚠️',
    content: `DO's:\n• Carry a valid photo ID to the polling booth.\n• Check your name in the voter list beforehand at nvsp.in.\n• Reach the booth early to avoid long waits.\n• Maintain discipline and follow queue rules.\n\nDON'Ts:\n• Do not carry mobile phones, cameras, or any electronic devices into the voting compartment.\n• Do not reveal your vote to anyone; voting is secret.\n• Do not attempt to vote more than once.\n• Do not canvass or campaign near the polling booth (within 100 meters).\n• Do not carry any weapons or sharp objects.`,
  },
  {
    title: 'Model Code of Conduct',
    icon: '📜',
    content: `• The Model Code of Conduct (MCC) comes into effect from the date of announcement of elections.\n• No party or candidate shall use government machinery for campaigning.\n• No party shall appeal to caste or communal feelings for votes.\n• Criticism of other parties shall be confined to their policies and programs.\n• Polling booths shall not be located in religious places.\n• Ministers shall not combine official visits with election work.\n• The ruling party shall not use public funds for advertising during elections.`,
  },
  {
    title: 'How to File Complaints',
    icon: '📞',
    content: `• Use the cVIGIL app to report MCC violations with photo/video evidence.\n• Call the National Grievance Helpline: 1950 (toll-free).\n• Visit the Grievance Portal: eci.gov.in/grievances.\n• Contact your local Returning Officer or District Election Officer.\n• Lodge complaints at the nearest police station if you witness booth capturing or voter intimidation.\n• All complaints are tracked and resolved within 100 minutes under the cVIGIL system.`,
  },
  {
    title: 'Rights of Voters',
    icon: '🛡️',
    content: `• Every eligible citizen has the right to vote without any discrimination.\n• Voters have the right to a secret ballot.\n• Voters can opt for NOTA (None of the Above) if they do not wish to vote for any candidate.\n• Voters with disabilities have the right to assistance and accessible voting facilities.\n• Voters are entitled to paid leave on election day.\n• Voters can challenge any malpractice or irregularity through proper channels.\n• Voters have the right to verify their vote through the VVPAT system.`,
  },
];

/**
 * Renders the ECI rules accordion section.
 * @param {boolean} isFirstTime - Whether user is a first-time voter
 * @returns {string} HTML string for the ECI rules section
 */
export function renderECIRulesCard(isFirstTime) {
  let html = `
    <div class="glass-panel eci-rules-section" style="padding:2rem; margin-top:1.5rem;" role="region" aria-label="Election Commission of India Rules and Guidelines">
      <h2 style="margin-bottom:0.5rem;">📋 ECI Rules & Guidelines</h2>
      <p style="margin-bottom:1.5rem;">Official rules and guidelines from the Election Commission of India</p>
      <div class="eci-accordion" role="list">
  `;

  eciGuidelines.forEach((item, index) => {
    const id = `eci-item-${index}`;
    html += `
      <div class="eci-accordion-item glass-card" style="margin-bottom:0.75rem; padding:0;" role="listitem">
        <button class="eci-accordion-btn" id="${id}-btn"
          aria-expanded="false" aria-controls="${id}-panel"
          style="width:100%; text-align:left; background:none; border:none; color:var(--text-main); padding:1rem 1.25rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-family:var(--font-body); font-size:0.95rem; font-weight:600;">
          <span>${sanitizeHTML(item.icon)} ${sanitizeHTML(item.title)}</span>
          <span class="eci-accordion-icon" aria-hidden="true" style="transition:transform 0.3s ease;">▼</span>
        </button>
        <div id="${id}-panel" role="region" aria-labelledby="${id}-btn"
          class="eci-accordion-panel" style="display:none; padding:0 1.25rem 1rem; font-size:0.88rem; color:var(--text-muted); white-space:pre-line; line-height:1.7;">
          ${sanitizeHTML(item.content)}
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

/**
 * Attaches event listeners for the ECI accordion.
 * Call after the HTML is inserted into the DOM.
 */
export function initECIAccordion() {
  document.querySelectorAll('.eci-accordion-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const icon = btn.querySelector('.eci-accordion-icon');

      btn.setAttribute('aria-expanded', String(!isOpen));
      panel.style.display = isOpen ? 'none' : 'block';
      if (icon) icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Keyboard: Enter/Space to toggle
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}
