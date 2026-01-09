import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FLASH = 'gemini-3-flash-preview';

export const getDailyQuote = async (): Promise<{ text: string; author: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: "Generate a short, powerful, earthy, and spiritual motivational quote for a young adult leader. Format: Quote|Author",
    });
    const raw = response.text || "Grow where you are planted.|Anonymous";
    const [text, author] = raw.split('|');
    return { text: text.trim(), author: author ? author.trim() : "Unknown" };
  } catch (error) {
    console.error("Error fetching quote:", error);
    return { text: "The creation of a thousand forests is in one acorn.", author: "Ralph Waldo Emerson" };
  }
};

export const getBibleVerse = async (reference: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Provide the text for the Bible verse(s): ${reference}. Just the text, no intro.`,
    });
    return response.text || "Verse not found.";
  } catch (error) {
    console.error("Error fetching verse:", error);
    return "Could not retrieve verse at this time.";
  }
};

export const getMentorshipAdvice = async (history: {role: string, content: string}[], userMessage: string): Promise<string> => {
  try {
    // Construct chat history for context
    const prompt = `
      You are a wise, empathetic, and encouraging mentor for a young adult (18-22). 
      Your tone is supportive, guiding, and rooted in leadership and holistic growth principles.
      User says: "${userMessage}"
      Provide a concise, helpful response (max 100 words).
    `;
    
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
    });
    return response.text || "I am listening. Tell me more.";
  } catch (error) {
    console.error("Error fetching advice:", error);
    return "I'm having trouble connecting right now, but I'm here for you.";
  }
};

export const analyzeDecision = async (decisionData: any): Promise<string> => {
    try {
        const content = typeof decisionData === 'string' ? decisionData : JSON.stringify(decisionData);
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Analyze this decision making process and provide a brief insight on how to proceed: ${content}`
        });
        return response.text || "Review your alternatives carefully.";
    } catch (error) {
        return "Unable to analyze at the moment.";
    }
}