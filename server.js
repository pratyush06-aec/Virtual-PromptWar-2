/**
 * @module server
 * @description Express server for BallotBuddy backend API.
 * Handles AI proxy requests (Gemini), Firestore data access, and serves the Vite build.
 * Security: Helmet headers, rate limiting, input validation, CORS, compression.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ── Firebase Admin SDK (server-side only) ──────────────────────────
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

// ── Gemini AI (server-side only — NEVER exposed to frontend) ──────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables.');
  process.exit(1);
}

const geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ── Express App Setup ──────────────────────────────────────────────
const app = express();

// Security: Helmet.js for HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://ui-avatars.com", "https://firebasestorage.googleapis.com", "https://*.firebasestorage.app"],
      connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.firebasestorage.app", "wss://*.firebaseio.com", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com"],
      frameSrc: ["'self'", "https://*.firebaseapp.com", "https://accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression for performance
app.use(compression());

// CORS with whitelist
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  `https://${FIREBASE_PROJECT_ID}.web.app`,
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow Cloud Run domains
    if (origin.endsWith('.run.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Body parser with size limit to prevent payload attacks
app.use(express.json({ limit: '10kb' }));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit exceeded. Please wait a moment.' },
});

const PORT = process.env.PORT || 3000;

// ── Input Validation Helpers ───────────────────────────────────────

/**
 * Strips HTML tags from a string for security.
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validates candidate object shape.
 * @param {Object} candidate - Candidate data
 * @returns {boolean} True if valid
 */
function isValidCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const requiredFields = ['name', 'party', 'education'];
  return requiredFields.every((field) =>
    typeof candidate[field] === 'string' && candidate[field].length > 0 && candidate[field].length <= 200
  );
}

/**
 * Validates user context object shape.
 * @param {Object} ctx - User context
 * @returns {boolean} True if valid
 */
function isValidUserContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return false;
  const validPersonas = ['first-time', 'experienced'];
  const validModes = ['beginner', 'summary', 'deep-dive'];
  return (
    validPersonas.includes(ctx.persona) &&
    validModes.includes(ctx.aiMode) &&
    typeof ctx.location === 'string' &&
    ctx.location.length <= 100
  );
}

// ── API Routes ─────────────────────────────────────────────────────

// GET /api/candidates — Read all candidates from Firestore
app.get('/api/candidates', apiLimiter, async (req, res) => {
  try {
    const snapshot = await db.collection('candidates').orderBy('id').get();
    const candidates = [];
    snapshot.forEach((doc) => {
      candidates.push({ firestoreId: doc.id, ...doc.data() });
    });

    // Cache-Control for candidate data (can be cached for 5 minutes)
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ candidates });
  } catch (error) {
    console.error('Error fetching candidates from Firestore:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// POST /api/generate-summary — Generate AI candidate summary via Gemini
app.post('/api/generate-summary', aiLimiter, async (req, res) => {
  try {
    const { candidate } = req.body;

    // Input validation
    if (!isValidCandidate(candidate)) {
      return res.status(400).json({ error: 'Invalid candidate data provided.' });
    }

    // Sanitize all string inputs before sending to AI
    const sanitizedCandidate = {
      name: stripHtml(candidate.name).substring(0, 200),
      party: stripHtml(candidate.party).substring(0, 100),
      education: stripHtml(candidate.education).substring(0, 200),
      criminal_records: Number(candidate.criminal_records) || 0,
      assets: stripHtml(String(candidate.assets || '')).substring(0, 100),
      past: stripHtml(String(candidate.past || '')).substring(0, 500),
      performance: stripHtml(String(candidate.performance || '')).substring(0, 500),
    };

    const prompt = `
      You are an expert political analyst AI. The user has provided you with basic facts about a candidate. Your task is to generate an ELABORATE, creative, and highly detailed mock profile for this candidate to show off the AI summary feature. Expand significantly on their basic stats to create a realistic, objective backstory. Include hypothetical details about their past campaigns, key policy focuses, public perception, and elaborate on their assets vs. criminal records. Do not use Markdown formatting like bold or asterisks.
      
      Name: ${sanitizedCandidate.name}
      Party: ${sanitizedCandidate.party}
      Education: ${sanitizedCandidate.education}
      Criminal Records: ${sanitizedCandidate.criminal_records}
      Assets: ${sanitizedCandidate.assets}
      Past Political Record: ${sanitizedCandidate.past}
      Electoral Performance: ${sanitizedCandidate.performance}
    `;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    res.json({ text: responseText });
  } catch (error) {
    console.error('Error generating candidate summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// POST /api/ask-buddy — AI Chat Assistant via Gemini
app.post('/api/ask-buddy', aiLimiter, async (req, res) => {
  try {
    const { userMessage, userContext } = req.body;

    // Input validation
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (userMessage.length > 1000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 1000 characters.' });
    }

    if (!isValidUserContext(userContext)) {
      return res.status(400).json({ error: 'Invalid user context.' });
    }

    // Sanitize user message
    const sanitizedMessage = stripHtml(userMessage).substring(0, 1000);
    const sanitizedLocation = stripHtml(userContext.location).substring(0, 100);

    let modeInstructions = '';
    if (userContext.aiMode === 'beginner') {
      modeInstructions = 'Respond in a to the point way. Keep it very simple and direct without overwhelming details.';
    } else if (userContext.aiMode === 'summary') {
      modeInstructions = 'Give a gist for the particular task asked. Provide a brief overview or bulleted facts.';
    } else if (userContext.aiMode === 'deep-dive') {
      modeInstructions = 'Dive in depth into details about the same task. Provide comprehensive historical context, statistics, or thorough explanations.';
    }

    const systemPrompt = `
      You are 'BallotBuddy', a helpful, neutral AI assistant for voters in India.
      The user interacting with you is a ${userContext.persona === 'first-time' ? 'First-Time Voter (18-22 years old)' : 'Experienced Voter'}.
      They are located in or asking about: ${sanitizedLocation}.
      
      YOUR MODE INSTRUCTIONS:
      ${modeInstructions}
      
      Respond directly to the user's message below, adhering to your mode instructions and their persona context.
      
      User Message: "${sanitizedMessage}"
    `;

    const result = await geminiModel.generateContent(systemPrompt);
    const responseText = result.response.text();
    res.json({ text: responseText });
  } catch (error) {
    console.error('Error asking BallotBuddy:', error);
    res.status(500).json({ error: 'Failed to fetch response from BallotBuddy' });
  }
});

// ── Serve Vite production build with caching ───────────────────────
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1h',
  etag: true,
  lastModified: true,
}));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`BallotBuddy server running on http://localhost:${PORT}`);
});

export default app;
