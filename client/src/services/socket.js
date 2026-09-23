import { useSocketStore } from '../store/useSocketStore';

export const getSocket = () => useSocketStore.getState().socket;

export default {
  getSocket
};
