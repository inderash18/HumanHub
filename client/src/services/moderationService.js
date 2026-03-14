import api from './api';

export const getModerationQueue = async () => {
    const res = await api.get('/moderation/queue');
    return res.data;
};

export const approveItemAction = async (id) => {
    const res = await api.post(`/moderation/${id}/approve`);
    return res.data;
};

export const rejectItemAction = async (id, reason) => {
    const res = await api.post(`/moderation/${id}/reject`, { reason });
    return res.data;
};

export const banUserAction = async (id) => {
    const res = await api.post(`/moderation/ban/${id}`);
    return res.data;
};
