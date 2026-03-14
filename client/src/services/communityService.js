import api from './api';

export const fetchCommunities = async () => {
    const res = await api.get('/communities');
    return res.data;
};

export const getCommunity = async (slug) => {
    const res = await api.get(`/communities/${slug}`);
    return res.data;
};

export const createCommunity = async (payload) => {
    const res = await api.post('/communities', payload);
    return res.data;
};
