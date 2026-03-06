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
  UserCog,
  Settings,
  ChevronRight,
  Bell,
  Search,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agenda/Turnos', href: '/sesiones', icon: Calendar },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Profesionales', href: '/profesionales', icon: UserCog },
  { name: 'Tratamientos', href: '/tratamientos', icon: Scissors },
  { name: 'Materiales', href: '/materiales', icon: Package },
  { name: 'Finanzas', href: '/finanzas', icon: DollarSign },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const currentPage = navigation.find((item) => location.pathname.startsWith(item.href))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar móvil */}
      <div
        className={cn('fixed inset-0 z-50 lg:hidden', sidebarOpen ? 'block' : 'hidden')}
      >
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl">
          <div className="flex h-16 items-center justify-between px-6 border-b bg-gradient-to-r from-primary-600 to-primary-700">
            <span className="text-xl font-bold text-white">MedEstética</span>
            <button onClick={() => setSidebarOpen(false)} className="text-white/80 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn('h-5 w-5', isActive && 'text-white')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        )}
      >
        <div className="flex flex-col flex-grow bg-white border-r shadow-xl">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b bg-gradient-to-r from-primary-600 to-primary-700">
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-white tracking-tight">MedEstética</span>
            )}
            {sidebarCollapsed && (
              <span className="text-xl font-bold text-white mx-auto">M</span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    sidebarCollapsed && 'justify-center px-3'
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-white')} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-white/60" />}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t bg-gray-50">
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-white shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold">
                      {user?.nombre?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre}</p>
                    <p className="text-xs text-gray-500">Administradora</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-white hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full p-3 text-gray-600 hover:bg-white hover:text-red-600 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b shadow-sm">
          <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-gray-600" />
            </button>

            {/* Collapse button (desktop) */}
            <button
              className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5 text-gray-500" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-400">Dashboard</span>
              {currentPage && currentPage.name !== 'Dashboard' && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                  <span className="font-medium text-gray-700">{currentPage.name}</span>
                </>
              )}
            </div>

            <div className="flex-1" />

            {/* Search */}
            <div className="hidden md:flex relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white w-64"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
