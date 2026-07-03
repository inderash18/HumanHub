import api from './api';

export const fetchConversations = async () => {
  const { data } = await api.get('/messages/conversations/active');
  return data;
};

export const fetchMessages = async (userId) => {
  const { data } = await api.get(`/messages/${userId}`);
  return data;
};

export const sendMessageApi = async (receiverId, text) => {
  const { data } = await api.post('/messages', { receiverId, text });
  return data;
};
