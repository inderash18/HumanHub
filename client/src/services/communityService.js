import api from './api';

export const fetchCommunities = async () => {
    const res = await api.get('/api/communities');
    return res.data;
};

export const getCommunity = async (slug) => {
    const res = await api.get(`/api/communities/${slug}`);
    return res.data;
};

export const createCommunity = async (payload) => {
    const res = await api.post('/api/communities', payload);
    return res.data;
};
