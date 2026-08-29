import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import FeedPage from './FeedPage';
import LandingPage from './LandingPage';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <FeedPage />;
}