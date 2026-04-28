import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API using the Vite environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // Or gemini-1.5-flash for speed

export async function generateCandidateSummary(candidate) {
  try {
    const prompt = `
      You are an unbiased political analyst AI. Summarize the following candidate's profile into a brief, easy-to-read paragraph (max 4 sentences) for a voter. Highlight key strengths and any major red flags (like criminal records) objectively. Do not use Markdown formatting like bold or asterisks.
      
      Name: ${candidate.name}
      Party: ${candidate.party}
      Education: ${candidate.education}
      Criminal Records: ${candidate.criminal_records}
      Assets: ${candidate.assets}
      Past Political Record: ${candidate.past}
      Electoral Performance: ${candidate.performance}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating candidate summary:", error);
    return "Error generating summary. Please try again later.";
  }
}

export async function askBallotBuddy(userMessage, userContext) {
  try {
    // Determine the instructions based on the AI Mode
    let modeInstructions = "";
    if (userContext.aiMode === 'beginner') {
      modeInstructions = "Use very simple language. Break everything down step-by-step. Assume the user knows nothing about voting.";
    } else if (userContext.aiMode === 'summary') {
      modeInstructions = "Be extremely concise. Use bullet points. Provide fast facts only.";
    } else if (userContext.aiMode === 'deep-dive') {
      modeInstructions = "Provide a comprehensive, detailed analysis. Include historical context, constitutional rules, or policy implications where relevant.";
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

    const result = await model.generateContent(systemPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Error asking BallotBuddy:", error);
    return "Sorry, BallotBuddy is currently unavailable. Please try again.";
  }
}
