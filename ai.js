import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API using the Vite environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function generateCandidateSummary(candidate) {
  try {
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
      modeInstructions = "Respond in a to the point way. Keep it very simple and direct without overwhelming details.";
    } else if (userContext.aiMode === 'summary') {
      modeInstructions = "Give a gist for the particular task asked. Provide a brief overview or bulleted facts.";
    } else if (userContext.aiMode === 'deep-dive') {
      modeInstructions = "Dive in depth into details about the same task. Provide comprehensive historical context, statistics, or thorough explanations.";
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
    return `Sorry, BallotBuddy encountered an error: ${error.message}. Please try again.`;
  }
}
