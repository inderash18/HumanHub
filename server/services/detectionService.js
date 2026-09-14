import axios from 'axios';
const endpoint = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function analyze(path, payload) {
  const { data } = await axios.post(endpoint() + path, payload, { timeout: 15000 });
  if (data?.status !== 'ok' || typeof data.modelVersion !== 'string' || !data.modelVersion ||
      !Number.isFinite(data.score) || data.score < 0 || data.score > 1 ||
      !Number.isFinite(data.confidence) || data.confidence < 0 || data.confidence > 1) {
    throw new Error('Detection unavailable: no valid model result');
  }
  return data;
}

export const analyzeText = text => text
  ? analyze('/analyze/text', { text }) : Promise.resolve({ status: 'not_applicable' });
export const analyzeMedia = urls => urls?.length
  ? analyze('/analyze/media', { urls }) : Promise.resolve({ status: 'not_applicable' });
export const analyzeBehavior = (userId, sessionData = {}) =>
  analyze('/analyze/behavior', { userId: String(userId), sessionData });
