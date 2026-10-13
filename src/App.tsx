import { Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from './components/ui'
import { useAuth } from './hooks/useAuth'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminLogin } from './pages/admin/AdminLogin'
import { QuestionBankPage } from './pages/admin/QuestionBankPage'
import { SessionControlPage } from './pages/admin/SessionControlPage'
import { SessionCreatePage } from './pages/admin/SessionCreatePage'
import { SessionsListPage } from './pages/admin/SessionsListPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { HistoricoDetailPage, HistoricoPage } from './pages/HistoricoPage'
import { HomePage } from './pages/HomePage'
import { PlayPage } from './pages/PlayPage'
import { RankingPage } from './pages/RankingPage'
import type { ReactNode } from 'react'

function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, isAdmin } = useAuth()
  if (loading) return <Spinner />
  if (!isAdmin) return <AdminLogin />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/ranking" element={<RankingPage />} />
      <Route
        path="/historico"
        element={
          <AdminGuard>
            <HistoricoPage />
          </AdminGuard>
        }
      />
      <Route
        path="/historico/:id"
        element={
          <AdminGuard>
            <HistoricoDetailPage />
          </AdminGuard>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/perguntas"
        element={
          <AdminGuard>
            <QuestionBankPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/sessoes"
        element={
          <AdminGuard>
            <SessionsListPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/sessoes/nova"
        element={
          <AdminGuard>
            <SessionCreatePage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/sessoes/:id"
        element={
          <AdminGuard>
            <SessionControlPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/configuracoes"
        element={
          <AdminGuard>
            <SettingsPage />
          </AdminGuard>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
