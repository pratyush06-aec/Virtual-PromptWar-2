const BACKEND_URL = '/api';

export async function generateCandidateSummary(candidate) {
  try {
    const response = await fetch(`${BACKEND_URL}/generate-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ candidate }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error generating candidate summary from backend:", error);
    return "Error generating summary. Please try again later.";
  }
}

export async function askBallotBuddy(userMessage, userContext) {
  try {
    const response = await fetch(`${BACKEND_URL}/ask-buddy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userMessage, userContext }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error asking BallotBuddy backend:", error);
    return `Sorry, BallotBuddy encountered an error. Please check if the backend server is running.`;
  }
}
