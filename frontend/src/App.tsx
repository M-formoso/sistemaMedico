import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import AdminLayout from '@/components/layout/AdminLayout'
import PacienteLayout from '@/components/layout/PacienteLayout'

// Pages
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/dashboard'
import PacientesPage from '@/pages/pacientes'
import TratamientosPage from '@/pages/tratamientos'
import SesionesPage from '@/pages/sesiones'
import MaterialesPage from '@/pages/materiales'
import FinanzasPage from '@/pages/finanzas'
import ReportesPage from '@/pages/reportes'

// Portal Paciente
import PortalHome from '@/pages/portal-paciente'

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.rol !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Redirigir según rol */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              user?.rol === 'paciente' ? (
                <Navigate to="/portal" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <PacientesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tratamientos/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <TratamientosPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sesiones/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <SesionesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materiales/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <MaterialesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finanzas/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <FinanzasPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <ReportesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Portal Paciente */}
        <Route
          path="/portal/*"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout>
                <PortalHome />
              </PacienteLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
