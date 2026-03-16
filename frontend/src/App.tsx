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
import UsuariosPage from '@/pages/usuarios'

// Portal Paciente
import PortalTurnos from '@/pages/portal-paciente/turnos'
import PortalTratamientos from '@/pages/portal-paciente/tratamientos'
import PortalConsentimientos from '@/pages/portal-paciente/consentimientos'
import PortalFotos from '@/pages/portal-paciente/fotos'
import PortalPagos from '@/pages/portal-paciente/pagos'
import PortalHistorial from '@/pages/portal-paciente/historial'

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'paciente' }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 'admin' incluye administradora y empleado
  if (requiredRole === 'admin') {
    if (user?.rol !== 'administradora' && user?.rol !== 'empleado') {
      return <Navigate to="/portal" replace />
    }
  }

  // 'paciente' solo para pacientes
  if (requiredRole === 'paciente' && user?.rol !== 'paciente') {
    return <Navigate to="/dashboard" replace />
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

        {/* Admin Routes (accesibles por administradora y empleado) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <PacientesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <PacienteDetailPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tratamientos/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <TratamientosPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sesiones/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <SesionesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materiales/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <MaterialesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finanzas/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <FinanzasPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ReportesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profesionales/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ProfesionalesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ConfiguracionPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/presupuestos/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <PresupuestosPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <UsuariosPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Portal Paciente */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute requiredRole="paciente">
              <Navigate to="/portal/turnos" replace />
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
          path="/portal/tratamientos"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout>
                <PortalTratamientos />
              </PacienteLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/consentimientos"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout>
                <PortalConsentimientos />
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

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
