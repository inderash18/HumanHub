import { Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout"
import HomePage from "./pages/HomePage"
import FeedPage from "./pages/FeedPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import CommunityPage from "./pages/CommunityPage"
import PostDetailPage from "./pages/PostDetailPage"
import SubmitPostPage from "./pages/SubmitPostPage"
import UserProfilePage from "./pages/UserProfilePage"
import ModeratorDashboard from "./pages/ModeratorDashboard"
import { useSocket } from "./hooks/useSocket"

export default function App() {
  // Initialize global singleton socket mapping auth listeners continuously securely cleanly intrinsically inherently dynamically beautifully.
  useSocket();

  return (
    <Routes>
      <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/c/:slug" element={<CommunityPage />} />
          <Route path="/p/:id" element={<PostDetailPage />} />
          <Route path="/u/:username" element={<UserProfilePage />} />
          
          <Route path="/submit" element={<SubmitPostPage />} />
          <Route path="/mod-dashboard" element={<ModeratorDashboard />} />
          
          <Route path="/communities" element={<div className="p-12 text-center text-brand-muted text-xl animate-pulse">Community directory mapped in architecture, pending build...</div>} />
      </Route>
    </Routes>
  )
}