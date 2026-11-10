import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth, AuthProvider } from '@/auth/AuthProvider'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { BoardPage } from '@/pages/board/BoardPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { NewTaskPage } from '@/pages/new-task/NewTaskPage'
import { TaskPage } from '@/pages/task/TaskPage'
import { Shell } from '@/shell/Shell'

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Shell />}>
            <Route path="/board" element={<BoardPage />} />
            <Route path="/tasks/new" element={<NewTaskPage />} />
            <Route path="/tasks/:id" element={<TaskPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function RequireAuth() {
  const { user, fetching } = useAuth()
  if (fetching) return <p style={{ padding: 24 }}>Загрузка…</p>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
