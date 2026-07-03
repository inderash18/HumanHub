import api from './api';

export const fetchStories = async () => {
  const { data } = await api.get('/stories');
  return data;
};

export const createStory = async (mediaUrl, caption = '') => {
  const { data } = await api.post('/stories', { mediaUrl, caption });
  return data;
};
