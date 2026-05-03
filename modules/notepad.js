/**
 * @module notepad
 * @description Election notepad feature for users to keep notes.
 * Stored in localStorage, keyed per user.
 */

import { sanitizeHTML, generateId } from '../utils/sanitize.js';

const NOTES_KEY = 'ballotBuddyNotes';
const MAX_NOTES = 20;
const MAX_NOTE_LENGTH = 2000;

/**
 * Gets all notes for a user.
 * @param {string} uid - User ID
 * @returns {Array<{id:string, title:string, content:string, timestamp:number}>}
 */
export function getNotes(uid) {
  try {
    const stored = localStorage.getItem(`${NOTES_KEY}_${uid}`);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

/**
 * Saves a note for a user.
 * @param {string} uid - User ID
 * @param {{title:string, content:string, id?:string}} note - Note data
 * @returns {{success:boolean, message:string}}
 */
export function saveNote(uid, note) {
  const notes = getNotes(uid);
  if (note.content.length > MAX_NOTE_LENGTH) {
    return { success: false, message: `Note exceeds ${MAX_NOTE_LENGTH} character limit.` };
  }

  if (note.id) {
    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      notes[idx] = { ...notes[idx], title: note.title, content: note.content, timestamp: Date.now() };
    }
  } else {
    if (notes.length >= MAX_NOTES) {
      return { success: false, message: `Maximum ${MAX_NOTES} notes reached.` };
    }
    notes.unshift({ id: generateId('note'), title: note.title, content: note.content, timestamp: Date.now() });
  }

  try {
    localStorage.setItem(`${NOTES_KEY}_${uid}`, JSON.stringify(notes));
    return { success: true, message: 'Note saved.' };
  } catch {
    return { success: false, message: 'Storage full.' };
  }
}

/**
 * Deletes a note by ID.
 * @param {string} uid - User ID
 * @param {string} noteId - Note ID to delete
 */
export function deleteNote(uid, noteId) {
  const notes = getNotes(uid).filter((n) => n.id !== noteId);
  localStorage.setItem(`${NOTES_KEY}_${uid}`, JSON.stringify(notes));
}

/**
 * Renders the notepad FAB (floating action button).
 * @param {Object} state - App state with user info
 * @param {Function} onOpen - Callback when notepad opens
 * @returns {HTMLButtonElement} The FAB button element
 */
export function renderNotepadFAB(state, onOpen) {
  // Remove existing FAB if present
  const existing = document.getElementById('notepad-fab');
  if (existing) existing.remove();

  const fab = document.createElement('button');
  fab.id = 'notepad-fab';
  fab.className = 'notepad-fab';
  fab.setAttribute('aria-label', 'Open election notepad');
  fab.setAttribute('title', 'Election Notepad');
  fab.textContent = '📝';

  fab.addEventListener('click', () => {
    if (typeof onOpen === 'function') onOpen();
  });

  document.body.appendChild(fab);
  return fab;
}

/**
 * Renders the notepad panel.
 * @param {HTMLElement} container - Container for the notepad
 * @param {Object} state - App state
 * @param {Function} onClose - Close callback
 */
export function renderNotepadPanel(container, state, onClose) {
  if (!container || !state.user) return;

  const notes = getNotes(state.user.uid);
  let editingNoteId = null;

  function renderNotesList() {
    const notesList = document.getElementById('notepad-list');
    if (!notesList) return;

    if (notes.length === 0) {
      notesList.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">No notes yet. Create your first election note!</p>';
      return;
    }

    notesList.innerHTML = notes.map((n) => `
      <div class="notepad-item glass-card" data-note-id="${sanitizeHTML(n.id)}" role="article" aria-label="Note: ${sanitizeHTML(n.title)}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <h4 style="margin:0; font-size:0.95rem;">${sanitizeHTML(n.title || 'Untitled')}</h4>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn-note-edit" data-id="${sanitizeHTML(n.id)}" aria-label="Edit note ${sanitizeHTML(n.title)}" style="background:none; border:none; cursor:pointer; font-size:0.9rem; color:var(--primary);">✏️</button>
            <button class="btn-note-delete" data-id="${sanitizeHTML(n.id)}" aria-label="Delete note ${sanitizeHTML(n.title)}" style="background:none; border:none; cursor:pointer; font-size:0.9rem; color:var(--accent);">🗑️</button>
          </div>
        </div>
        <p style="font-size:0.85rem; margin:0.5rem 0 0; color:var(--text-muted); white-space:pre-wrap;">${sanitizeHTML(n.content).substring(0, 150)}${n.content.length > 150 ? '...' : ''}</p>
        <small style="color:var(--text-muted); font-size:0.7rem;">${new Date(n.timestamp).toLocaleString()}</small>
      </div>
    `).join('');

    // Attach edit/delete listeners
    notesList.querySelectorAll('.btn-note-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingNoteId = btn.dataset.id;
        const note = notes.find((n) => n.id === editingNoteId);
        if (note) {
          document.getElementById('notepad-title').value = note.title;
          document.getElementById('notepad-content').value = note.content;
          document.getElementById('notepad-form-heading').textContent = 'Edit Note';
        }
      });
    });

    notesList.querySelectorAll('.btn-note-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteNote(state.user.uid, btn.dataset.id);
        const idx = notes.findIndex((n) => n.id === btn.dataset.id);
        if (idx >= 0) notes.splice(idx, 1);
        renderNotesList();
      });
    });
  }

  container.innerHTML = `
    <div class="notepad-panel glass-panel" role="dialog" aria-label="Election Notepad" aria-modal="false">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1);">
        <h3 id="notepad-heading" style="margin:0;">📝 Election Notepad</h3>
        <button id="notepad-close" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.85rem;" aria-label="Close notepad">✕</button>
      </div>

      <div style="padding:1rem 1.5rem;">
        <h4 id="notepad-form-heading" style="margin-bottom:0.5rem; font-size:0.9rem;">New Note</h4>
        <form id="notepad-form">
          <input type="text" id="notepad-title" class="form-control" placeholder="Note title..." maxlength="100" required aria-label="Note title" aria-required="true" style="margin-bottom:0.5rem; padding:0.6rem;" />
          <textarea id="notepad-content" class="form-control" placeholder="Write your election notes here..." maxlength="${MAX_NOTE_LENGTH}" rows="3" required aria-label="Note content" aria-required="true" style="resize:vertical; padding:0.6rem;"></textarea>
          <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
            <button type="submit" class="btn btn-primary" style="flex:1; padding:0.5rem; font-size:0.85rem;">Save Note</button>
            <button type="button" id="notepad-clear-form" class="btn btn-outline" style="padding:0.5rem; font-size:0.85rem;">Clear</button>
          </div>
        </form>
      </div>

      <div id="notepad-list" style="padding:0 1.5rem 1.5rem; max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:0.75rem;" aria-label="Your notes" role="list">
      </div>
    </div>
  `;

  renderNotesList();

  document.getElementById('notepad-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('notepad-title').value.trim();
    const content = document.getElementById('notepad-content').value.trim();
    if (!title || !content) return;

    const result = saveNote(state.user.uid, { title, content, id: editingNoteId || undefined });
    if (result.success) {
      editingNoteId = null;
      document.getElementById('notepad-title').value = '';
      document.getElementById('notepad-content').value = '';
      document.getElementById('notepad-form-heading').textContent = 'New Note';
      // Refresh notes array
      const fresh = getNotes(state.user.uid);
      notes.length = 0;
      notes.push(...fresh);
      renderNotesList();
    } else {
      alert(result.message);
    }
  });

  document.getElementById('notepad-clear-form').addEventListener('click', () => {
    editingNoteId = null;
    document.getElementById('notepad-title').value = '';
    document.getElementById('notepad-content').value = '';
    document.getElementById('notepad-form-heading').textContent = 'New Note';
  });

  document.getElementById('notepad-close').addEventListener('click', () => {
    if (typeof onClose === 'function') onClose();
  });
}
