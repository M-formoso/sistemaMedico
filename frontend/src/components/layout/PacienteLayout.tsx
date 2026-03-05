import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, Calendar, Image, CreditCard, FileText, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Mi Historial', href: '/portal', icon: User },
  { name: 'Mis Sesiones', href: '/portal/sesiones', icon: Calendar },
  { name: 'Mis Fotos', href: '/portal/fotos', icon: Image },
  { name: 'Mis Pagos', href: '/portal/pagos', icon: CreditCard },
  { name: 'Documentos', href: '/portal/documentos', icon: FileText },
]

interface PacienteLayoutProps {
  children: React.ReactNode
}

export default function PacienteLayout({ children }: PacienteLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {user?.nombre?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Hola, {user?.nombre}</p>
                <p className="text-sm text-gray-500">Portal del Paciente</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  location.pathname === item.href
                    ? 'border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Consultorio de Medicina Estética
        </div>
      </footer>
    </div>
  )
}
