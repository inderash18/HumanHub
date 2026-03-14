import api from './api';

export const fetchPosts = async (cursor = null, community = null) => {
  const params = { limit: 15 };
  if (cursor) params.cursor = cursor;
  if (community) params.community = community;
  
  const response = await api.get('/posts', { params });
  return response.data;
};

export const getPost = async (id) => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};

export const createPost = async (postData) => {
   const config = { headers: { 'Content-Type': 'application/json' } };
   const response = await api.post('/posts', postData, config);
   return response.data;
};

export const reportPost = async (id, payload) => {
   return api.post(`/posts/${id}/report`, payload);
};
