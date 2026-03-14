import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import FeedPage from "./pages/FeedPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}