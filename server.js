import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
  console.error('GEMINI_API_KEY is not set in .env');
  process.exit(1);
}

const geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ── Express App Setup ──────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ── API Routes ─────────────────────────────────────────────────────

// GET /api/candidates — Read all candidates from Firestore
app.get('/api/candidates', async (req, res) => {
  try {
    const snapshot = await db.collection('candidates').orderBy('id').get();
    const candidates = [];
    snapshot.forEach((doc) => {
      candidates.push({ firestoreId: doc.id, ...doc.data() });
    });
    res.json({ candidates });
  } catch (error) {
    console.error('Error fetching candidates from Firestore:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// POST /api/generate-summary — Generate AI candidate summary via Gemini
app.post('/api/generate-summary', async (req, res) => {
  try {
    const { candidate } = req.body;
    const prompt = `
      You are an expert political analyst AI. The user has provided you with basic facts about a candidate. Your task is to generate an ELABORATE, creative, and highly detailed mock profile for this candidate to show off the AI summary feature. Expand significantly on their basic stats to create a realistic, objective backstory. Include hypothetical details about their past campaigns, key policy focuses, public perception, and elaborate on their assets vs. criminal records. Do not use Markdown formatting like bold or asterisks.
      
      Name: ${candidate.name}
      Party: ${candidate.party}
      Education: ${candidate.education}
      Criminal Records: ${candidate.criminal_records}
      Assets: ${candidate.assets}
      Past Political Record: ${candidate.past}
      Electoral Performance: ${candidate.performance}
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
app.post('/api/ask-buddy', async (req, res) => {
  try {
    const { userMessage, userContext } = req.body;

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
      They are located in or asking about: ${userContext.location}.
      
      YOUR MODE INSTRUCTIONS:
      ${modeInstructions}
      
      Respond directly to the user's message below, adhering to your mode instructions and their persona context.
      
      User Message: "${userMessage}"
    `;

    const result = await geminiModel.generateContent(systemPrompt);
    const responseText = result.response.text();
    res.json({ text: responseText });
  } catch (error) {
    console.error('Error asking BallotBuddy:', error);
    res.status(500).json({ error: 'Failed to fetch response from BallotBuddy' });
  }
});

// ── Serve Vite production build ────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`BallotBuddy server running on http://localhost:${PORT}`);
});
