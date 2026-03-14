import axios from 'axios';

// The local or deployed URLs for your Python FastAPI detectors
const TEXT_DETECTION_URL = process.env.TEXT_DETECTION_URL || 'http://localhost:8001';
const MEDIA_DETECTION_URL = process.env.MEDIA_DETECTION_URL || 'http://localhost:8002';
const BOT_DETECTION_URL = process.env.BOT_DETECTION_URL || 'http://localhost:8003';

export const analyzeText = async (text) => {
  try {
    // In strict production, this actually hits the Python microservice
    // const response = await axios.post(`${TEXT_DETECTION_URL}/analyze`, { text });
    // return response.data;
    
    // Fallback simulation:
    const isBot = text.includes('As an AI'); // rudimentary dummy test
    return {
        score: isBot ? 0.95 : 0.1,
        isAI: isBot,
        confidence: 0.9
    };
  } catch (err) {
    console.error(`[DetectionService] Text check failed`, err.message);
    return { score: 0, isAI: false, confidence: 0 };
  }
};

export const analyzeMedia = async (urls) => {
   if (!urls || urls.length === 0) return { score: 0, isAI: false, confidence: 1 };
   return { score: 0.2, isAI: false, confidence: 0.8 }; // Simulation
};

export const analyzeBehavior = async (userId, sessionData = {}) => {
   return { score: 0.1, isBotLikely: false, confidence: 0.95 }; // Simulation
};
