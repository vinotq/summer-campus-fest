import { Routes, Route, Navigate } from 'react-router-dom'
import StartPage from './pages/player/StartPage.jsx'
import PlayPage from './pages/player/PlayPage.jsx'
import ResultPage from './pages/player/ResultPage.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminPlayersPage from './pages/admin/AdminPlayersPage.jsx'
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage.jsx'
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/result" element={<ResultPage />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/players" replace />} />
        <Route path="players" element={<AdminPlayersPage />} />
        <Route path="questions" element={<AdminQuestionsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
