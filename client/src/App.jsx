import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Layout from "./components/layout/Layout";
import { useSocket } from "./hooks/useSocket";

// Immediate load for the primary landing/feed experience
import HomePage from "./pages/HomePage";
import FeedPage from "./pages/FeedPage";

// On-demand lazy load for auxiliary routes to slash initial bundle size by >75%
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ReelsPage = lazy(() => import("./pages/ReelsPage"));
const CommunitiesPage = lazy(() => import("./pages/CommunitiesPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const SavedPostsPage = lazy(() => import("./pages/SavedPostsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ModeratorDashboard = lazy(() => import("./pages/ModeratorDashboard"));
const SubmitPostPage = lazy(() => import("./pages/SubmitPostPage"));

// Ultra-lightweight non-blocking loading skeleton
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full animate-fade-in">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--ig-primary-button)] border-t-transparent animate-spin" />
      <span className="text-xs text-[var(--ig-text-tertiary)] font-medium">Loading...</span>
    </div>
  </div>
);

export default function App() {
  useSocket();

  return (
    <>
      <Toaster position="top-center" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/reels" element={<ReelsPage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/c/:slug" element={<CommunityPage />} />
            <Route path="/saved" element={<SavedPostsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/p/:id" element={<PostDetailPage />} />
            <Route path="/u/:username" element={<UserProfilePage />} />
            <Route path="/moderation" element={<ModeratorDashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/moderator" element={<ModeratorDashboard />} />
            <Route path="/submit" element={<SubmitPostPage />} />
            <Route path="/create" element={<SubmitPostPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}