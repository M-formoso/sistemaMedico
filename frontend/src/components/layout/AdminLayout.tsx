import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Scissors,
  Calendar,
  Package,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Tratamientos', href: '/tratamientos', icon: Scissors },
  { name: 'Sesiones', href: '/sesiones', icon: Calendar },
  { name: 'Materiales', href: '/materiales', icon: Package },
  { name: 'Finanzas', href: '/finanzas', icon: DollarSign },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <span className="text-xl font-bold text-primary-700">MedEstética</span>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname.startsWith(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r">
          <div className="flex h-16 items-center px-6 border-b">
            <span className="text-xl font-bold text-primary-700">MedEstética</span>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname.startsWith(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {user?.nombre?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                <p className="text-xs text-gray-500">Administradora</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-white border-b px-4 lg:px-6">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
