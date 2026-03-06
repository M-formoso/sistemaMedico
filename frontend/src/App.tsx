import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import AdminLayout from '@/components/layout/AdminLayout'
import PacienteLayout from '@/components/layout/PacienteLayout'

// Pages
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/dashboard'
import PacientesPage from '@/pages/pacientes'
import PacienteDetailPage from '@/pages/pacientes/[id]'
import TratamientosPage from '@/pages/tratamientos'
import SesionesPage from '@/pages/sesiones'
import MaterialesPage from '@/pages/materiales'
import FinanzasPage from '@/pages/finanzas'
import ReportesPage from '@/pages/reportes'
import ProfesionalesPage from '@/pages/profesionales'
import ConfiguracionPage from '@/pages/configuracion'
import PresupuestosPage from '@/pages/presupuestos'

// Portal Paciente
import PortalHome from '@/pages/portal-paciente'
import PortalTurnos from '@/pages/portal-paciente/turnos'
import PortalHistorial from '@/pages/portal-paciente/historial'
import PortalFotos from '@/pages/portal-paciente/fotos'
import PortalPagos from '@/pages/portal-paciente/pagos'

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
          path="/pacientes"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <PacientesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:id"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <PacienteDetailPage />
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
        <Route
          path="/profesionales/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <ProfesionalesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <ConfiguracionPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/presupuestos/*"
          element={
            <ProtectedRoute requiredRole="administradora">
              <AdminLayout>
                <PresupuestosPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Portal Paciente */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout>
                <PortalHome />
              </PacienteLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/turnos"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout>
                <PortalTurnos />
              </PacienteLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/historial"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout>
                <PortalHistorial />
              </PacienteLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/fotos"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout>
                <PortalFotos />
              </PacienteLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/pagos"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout>
                <PortalPagos />
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
