import { Routes, Route } from "react-router-dom"
import { Toaster } from 'react-hot-toast'
import Layout from "./components/layout/Layout"
import HomePage from "./pages/HomePage"
import FeedPage from "./pages/FeedPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ExplorePage from "./pages/ExplorePage"
import ReelsPage from "./pages/ReelsPage"
import MessagesPage from "./pages/MessagesPage"
import NotificationsPage from "./pages/NotificationsPage"
import OnboardingPage from "./pages/OnboardingPage"
import CommunityPage from "./pages/CommunityPage"
import PostDetailPage from "./pages/PostDetailPage"
import SubmitPostPage from "./pages/SubmitPostPage"
import UserProfilePage from "./pages/UserProfilePage"
import VerificationDashboard from "./pages/VerificationDashboard"
import SettingsPage from "./pages/SettingsPage"
import ModeratorDashboard from "./pages/ModeratorDashboard"
import { useSocket } from "./hooks/useSocket"


export default function App() {
  // Initialize global singleton socket mapping auth listeners continuously securely cleanly intrinsically inherently dynamically beautifully.
  useSocket();

  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/reels" element={<ReelsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/c/:slug" element={<CommunityPage />} />
            <Route path="/p/:id" element={<PostDetailPage />} />
            <Route path="/u/:username" element={<UserProfilePage />} />
            
            <Route path="/submit" element={<SubmitPostPage />} />
            <Route path="/verification-dashboard" element={<VerificationDashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/mod-dashboard" element={<ModeratorDashboard />} />

            
            <Route path="/communities" element={<div className="p-12 text-center text-brand-muted text-xl animate-pulse">Community directory mapped in architecture, pending build...</div>} />
        </Route>
      </Routes>
    </>
  )
}