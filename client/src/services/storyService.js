import api from './api';

export const fetchStories = async () => {
  const { data } = await api.get('/stories');
  return data;
};

export const fetchMyStories = async () => {
  const { data } = await api.get('/stories/my');
  return data;
};

export const createStory = async (mediaUrl, caption = '') => {
  const { data } = await api.post('/stories', { mediaUrl, caption });
  return data;
};

export const deleteStory = async (storyId) => {
  const { data } = await api.delete(`/stories/${storyId}`);
  return data;
};

export const recordStoryView = async (storyId) => {
  try {
    const { data } = await api.post(`/stories/${storyId}/view`);
    return data;
  } catch {
    return null;
  }
};

export const reactToStory = async (storyId, reaction = 'heart') => {
  const { data } = await api.post(`/stories/${storyId}/react`, { reaction });
  return data;
};

export const replyToStory = async (storyId, text) => {
  const { data } = await api.post(`/stories/${storyId}/reply`, { text });
  return data;
};
