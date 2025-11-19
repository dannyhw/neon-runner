import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

let chatSession: Chat | null = null;

export const initGeminiChat = () => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing.");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return chatSession;
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
    return null;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    // Re-init if lost or not started
    const session = initGeminiChat();
    if (!session) return "SYSTEM ERROR: UPLINK OFFLINE";
  }

  try {
    // chatSession is definitely assigned if initGeminiChat returns distinct val, 
    // but typescript needs reassurance.
    if (!chatSession) return "SYSTEM ERROR: UPLINK OFFLINE";

    const result = await chatSession.sendMessage({ message });
    return result.text || "NO DATA RECEIVED";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "CONNECTION INTERRUPTED...";
  }
};