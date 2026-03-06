import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Image,
  CreditCard,
  FileText,
  LogOut,
  Home,
  Bell,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Inicio', href: '/portal', icon: Home, exact: true },
  { name: 'Mis Turnos', href: '/portal/turnos', icon: Calendar },
  { name: 'Mi Historial', href: '/portal/historial', icon: FileText },
  { name: 'Mis Fotos', href: '/portal/fotos', icon: Image },
  { name: 'Mis Pagos', href: '/portal/pagos', icon: CreditCard },
]

interface PacienteLayoutProps {
  children: React.ReactNode
}

export default function PacienteLayout({ children }: PacienteLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-gray-900">MedEstética</p>
                <p className="text-xs text-gray-500">Portal del Paciente</p>
              </div>
            </div>

            {/* User info - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-500" />
              </Button>

              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                  <p className="text-xs text-gray-500">Paciente</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold">
                    {user?.nombre?.charAt(0) || 'P'}
                  </span>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user?.nombre?.charAt(0) || 'P'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.nombre}</p>
                  <p className="text-sm text-gray-500">Paciente</p>
                </div>
              </div>
            </div>
            <nav className="px-2 py-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href, item.exact)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all',
                  isActive(item.href, item.exact)
                    ? 'border-primary-500 text-primary-700 bg-primary-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">MedEstética</p>
                <p className="text-xs text-gray-500">Consultorio de Medicina Estética</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>¿Necesita ayuda?</span>
              <a href="tel:+541112345678" className="text-primary-600 font-medium hover:underline">
                Contactar
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
