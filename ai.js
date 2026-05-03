/**
 * @module ai
 * @description Backend API client for BallotBuddy AI services.
 * All AI requests are proxied through the Express backend to keep API keys secure.
 */

import { sanitizeHTML } from './utils/sanitize.js';

/** @constant {string} Backend API base URL */
const BACKEND_URL = '/api';

/**
 * Cache for AI-generated summaries to avoid redundant API calls.
 * @type {Map<string, string>}
 */
const summaryCache = new Map();

/**
 * Generates an AI summary for a candidate via the backend Gemini proxy.
 * Results are cached to prevent duplicate API calls for the same candidate.
 * @param {Object} candidate - Candidate data object
 * @param {string} candidate.id - Unique candidate identifier
 * @param {string} candidate.name - Candidate name
 * @param {string} candidate.party - Political party
 * @param {string} candidate.education - Education level
 * @param {number} candidate.criminal_records - Number of criminal records
 * @param {string} candidate.assets - Total declared assets
 * @param {string} candidate.past - Past political record
 * @param {string} candidate.performance - Electoral performance summary
 * @returns {Promise<string>} AI-generated summary text
 */
export async function generateCandidateSummary(candidate) {
  // Return cached result if available
  if (candidate?.id && summaryCache.has(candidate.id)) {
    return summaryCache.get(candidate.id);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/generate-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    const text = data.text || 'No summary available.';

    // Cache the result
    if (candidate?.id) {
      summaryCache.set(candidate.id, text);
    }

    return text;
  } catch (error) {
    console.error('Error generating candidate summary:', error);
    return 'Unable to generate summary at this time. Please try again later.';
  }
}

/**
 * Sends a message to the BallotBuddy AI assistant via the backend proxy.
 * @param {string} userMessage - The user's question or message
 * @param {Object} userContext - Context about the user for AI personalization
 * @param {string} userContext.persona - User type ('first-time' or 'experienced')
 * @param {string} userContext.location - User's location
 * @param {string} userContext.aiMode - AI response mode ('beginner', 'summary', 'deep-dive')
 * @returns {Promise<string>} AI assistant response text
 */
export async function askBallotBuddy(userMessage, userContext) {
  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
    return 'Please enter a valid question.';
  }

  try {
    const response = await fetch(`${BACKEND_URL}/ask-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: userMessage.trim().substring(0, 1000),
        userContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.text || 'I could not generate a response. Please try again.';
  } catch (error) {
    console.error('Error asking BallotBuddy:', error);
    return 'Sorry, BallotBuddy encountered an error. Please check your connection and try again.';
  }
}

/**
 * Clears the AI summary cache (useful for testing or user-initiated refresh).
 */
export function clearSummaryCache() {
  summaryCache.clear();
}
