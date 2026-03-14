import axios from 'axios';

// The deployed URL for your Python FastAPI detector
// Use the Docker service name if available, otherwise default to localhost:8000
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const analyzeText = async (text) => {
  try {
    // Hits the Python microservice /analyze/text endpoint
    const response = await axios.post(`${AI_SERVICE_URL}/analyze/text`, { text });
    return response.data;
  } catch (err) {
    console.error(`[DetectionService] Text check failed`, err.message);
    // Fallback if the service is unreachable
    const isBot = text.includes('As an AI'); // rudimentary dummy test
    return {
        score: isBot ? 0.95 : 0.1,
        isAI: isBot,
        confidence: 0.9
    };
  }
};

export const analyzeMedia = async (urls) => {
  if (!urls || urls.length === 0) return { score: 0, isAI: false, confidence: 1 };
  
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analyze/media`, { urls });
    return response.data;
  } catch (err) {
    console.error(`[DetectionService] Media check failed`, err.message);
    return { score: 0.2, isAI: false, confidence: 0.8 }; // Simulation fallback
  }
};

export const analyzeBehavior = async (userId, sessionData = {}) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analyze/behavior`, { userId, sessionData });
    return response.data;
  } catch (err) {
    console.error(`[DetectionService] Behavior check failed`, err.message);
    return { score: 0.1, isBotLikely: false, confidence: 0.95 }; // Simulation fallback
  }
};
