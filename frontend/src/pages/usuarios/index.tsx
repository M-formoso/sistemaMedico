import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Shield,
  User,
  Settings,
  Check,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usuariosService, Usuario, UsuarioCreate, UsuarioUpdate, ModulosDisponibles, RolUsuario } from '@/services/usuariosService'
import { Checkbox } from '@/components/ui/checkbox'
import { pacientesService } from '@/services/pacientesService'
import { formatearFecha } from '@/utils/formatters'
import { toast } from '@/hooks/useToast'

// Generar contraseña aleatoria
function generarPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default function UsuariosPage() {
  const queryClient = useQueryClient()
  const [buscar, setBuscar] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('todos')
  const [filtroActivo, setFiltroActivo] = useState<string>('activos')

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isPermisosDialogOpen, setIsPermisosDialogOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([])

  // Form states
  const [formData, setFormData] = useState<Partial<UsuarioCreate>>({
    email: '',
    password: '',
    nombre: '',
    rol: 'paciente',
    paciente_id: undefined,
  })
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Queries
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', filtroRol, filtroActivo, buscar],
    queryFn: () =>
      usuariosService.listar({
        rol: filtroRol !== 'todos' ? filtroRol : undefined,
        activo: filtroActivo === 'activos' ? true : filtroActivo === 'inactivos' ? false : undefined,
        buscar: buscar || undefined,
      }),
  })

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes-para-usuarios'],
    queryFn: () => pacientesService.listar(),
  })

  const { data: modulosDisponibles } = useQuery({
    queryKey: ['modulos-disponibles'],
    queryFn: () => usuariosService.obtenerModulosDisponibles(),
  })

  // Mutations
  const crearMutation = useMutation({
    mutationFn: (data: UsuarioCreate) => usuariosService.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast({ title: 'Usuario creado correctamente' })
      setIsCreateDialogOpen(false)
      resetForm()
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: 'Error al crear usuario',
        description: error.response?.data?.detail || 'Ocurrió un error',
        variant: 'destructive',
      })
    },
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UsuarioUpdate }) =>
      usuariosService.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast({ title: 'Usuario actualizado correctamente' })
      setIsEditDialogOpen(false)
      setSelectedUsuario(null)
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: 'Error al actualizar usuario',
        description: error.response?.data?.detail || 'Ocurrió un error',
        variant: 'destructive',
      })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      usuariosService.resetearPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast({ title: 'Contraseña actualizada correctamente' })
      setIsResetPasswordDialogOpen(false)
      setSelectedUsuario(null)
      setNewPassword('')
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: 'Error al resetear contraseña',
        description: error.response?.data?.detail || 'Ocurrió un error',
        variant: 'destructive',
      })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => usuariosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast({ title: 'Usuario desactivado correctamente' })
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: 'Error al desactivar usuario',
        description: error.response?.data?.detail || 'Ocurrió un error',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setFormData({
      email: '',
      password: generarPassword(),
      nombre: '',
      rol: 'paciente',
      paciente_id: undefined,
    })
    setShowPassword(false)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      paciente_id: usuario.paciente_id,
    })
    setIsEditDialogOpen(true)
  }

  const openResetPasswordDialog = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setNewPassword(generarPassword())
    setShowPassword(true)
    setIsResetPasswordDialogOpen(true)
  }

  const openPermisosDialog = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    // Obtener permisos según el rol
    const defaultPermisos = usuario.rol === 'empleado'
      ? modulosDisponibles?.empleado?.default || []
      : modulosDisponibles?.paciente?.default || []
    setSelectedPermisos(usuario.permisos_modulos || defaultPermisos)
    setIsPermisosDialogOpen(true)
  }

  const handleTogglePermiso = (modulo: string) => {
    setSelectedPermisos((prev) =>
      prev.includes(modulo)
        ? prev.filter((p) => p !== modulo)
        : [...prev, modulo]
    )
  }

  const handleSavePermisos = () => {
    if (!selectedUsuario) return
    actualizarMutation.mutate(
      {
        id: selectedUsuario.id,
        data: { permisos_modulos: selectedPermisos },
      },
      {
        onSuccess: () => {
          setIsPermisosDialogOpen(false)
          setSelectedUsuario(null)
        },
      }
    )
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.nombre) {
      toast({ title: 'Complete todos los campos requeridos', variant: 'destructive' })
      return
    }
    crearMutation.mutate(formData as UsuarioCreate)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUsuario) return
    actualizarMutation.mutate({
      id: selectedUsuario.id,
      data: {
        email: formData.email,
        nombre: formData.nombre,
        rol: formData.rol as RolUsuario,
        paciente_id: formData.paciente_id,
      },
    })
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUsuario || !newPassword) return
    resetPasswordMutation.mutate({ id: selectedUsuario.id, password: newPassword })
  }

  const handleDelete = (usuario: Usuario) => {
    if (confirm(`¿Desactivar el usuario "${usuario.nombre}"?`)) {
      eliminarMutation.mutate(usuario.id)
    }
  }

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter((u) => u.rol === 'administradora').length,
    empleados: usuarios.filter((u) => u.rol === 'empleado').length,
    pacientes: usuarios.filter((u) => u.rol === 'paciente').length,
    activos: usuarios.filter((u) => u.activo).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500">Gestiona los accesos al sistema</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Administradores</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Empleados</p>
                <p className="text-2xl font-bold text-amber-600">{stats.empleados}</p>
              </div>
              <Briefcase className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pacientes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pacientes}</p>
              </div>
              <User className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroRol} onValueChange={setFiltroRol}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="administradora">Administradores</SelectItem>
                <SelectItem value="empleado">Empleados</SelectItem>
                <SelectItem value="paciente">Pacientes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroActivo} onValueChange={setFiltroActivo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Paciente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Último acceso</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Estado</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              usuario.rol === 'administradora'
                                ? 'bg-purple-100'
                                : usuario.rol === 'empleado'
                                ? 'bg-amber-100'
                                : 'bg-blue-100'
                            }`}
                          >
                            {usuario.rol === 'administradora' ? (
                              <Shield className="h-5 w-5 text-purple-600" />
                            ) : usuario.rol === 'empleado' ? (
                              <Briefcase className="h-5 w-5 text-amber-600" />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <span className="font-medium">{usuario.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{usuario.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            usuario.rol === 'administradora'
                              ? 'default'
                              : usuario.rol === 'empleado'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {usuario.rol === 'administradora'
                            ? 'Admin'
                            : usuario.rol === 'empleado'
                            ? 'Empleado'
                            : 'Paciente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {usuario.paciente_nombre || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {usuario.ultimo_acceso
                          ? formatearFecha(usuario.ultimo_acceso)
                          : 'Nunca'}
                      </td>
                      <td className="py-3 px-4">
                        {usuario.activo ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <UserCheck className="h-3 w-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <UserX className="h-3 w-3" />
                            Inactivo
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          {(usuario.rol === 'paciente' || usuario.rol === 'empleado') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPermisosDialog(usuario)}
                              title="Configurar permisos"
                            >
                              <Settings className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openResetPasswordDialog(usuario)}
                            title="Resetear contraseña"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(usuario)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {usuario.activo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(usuario)}
                              title="Desactivar"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear Usuario */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario para acceder al sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@ejemplo.com"
                required
              />
            </div>

            <div>
              <Label>Contraseña *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, password: generarPassword() })}
                >
                  Generar
                </Button>
              </div>
            </div>

            <div>
              <Label>Rol *</Label>
              <Select
                value={formData.rol}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    rol: value as RolUsuario,
                    paciente_id: value === 'paciente' ? formData.paciente_id : undefined,
                    permisos_modulos: undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administradora">Administradora (acceso total)</SelectItem>
                  <SelectItem value="empleado">Empleado (permisos personalizables)</SelectItem>
                  <SelectItem value="paciente">Paciente (portal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.rol === 'paciente' && (
              <div>
                <Label>Paciente asociado *</Label>
                <Select
                  value={formData.paciente_id?.toString() || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paciente_id: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.rol === 'empleado' && modulosDisponibles && (
              <div>
                <Label>Módulos habilitados</Label>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-amber-700">
                    Selecciona los módulos de administración a los que tendrá acceso este empleado.
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {Object.entries(modulosDisponibles.empleado.modulos).map(([key, label]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        (formData.permisos_modulos || modulosDisponibles.empleado.default).includes(key)
                          ? 'bg-amber-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        const currentPermisos = formData.permisos_modulos || modulosDisponibles.empleado.default
                        const newPermisos = currentPermisos.includes(key)
                          ? currentPermisos.filter((p) => p !== key)
                          : [...currentPermisos, key]
                        setFormData({ ...formData, permisos_modulos: newPermisos })
                      }}
                    >
                      <Checkbox
                        checked={(formData.permisos_modulos || modulosDisponibles.empleado.default).includes(key)}
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearMutation.isPending}>
                {crearMutation.isPending ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Rol *</Label>
              <Select
                value={formData.rol}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    rol: value as RolUsuario,
                    paciente_id: value === 'paciente' ? formData.paciente_id : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administradora">Administradora</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                  <SelectItem value="paciente">Paciente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.rol === 'paciente' && (
              <div>
                <Label>Paciente asociado</Label>
                <Select
                  value={formData.paciente_id?.toString() || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paciente_id: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarMutation.isPending}>
                {actualizarMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Resetear Contraseña */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resetear Contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para {selectedUsuario?.nombre}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>Nueva Contraseña</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewPassword(generarPassword())}
                >
                  Generar
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetPasswordDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? 'Guardando...' : 'Cambiar Contraseña'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Configurar Permisos */}
      <Dialog open={isPermisosDialogOpen} onOpenChange={setIsPermisosDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Permisos</DialogTitle>
            <DialogDescription>
              {selectedUsuario?.rol === 'empleado'
                ? `Selecciona los módulos de administración que puede acceder ${selectedUsuario?.nombre}`
                : `Selecciona los módulos que puede ver ${selectedUsuario?.nombre} en el portal`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUsuario?.rol === 'empleado' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-700">
                  Selecciona los módulos del sistema de administración a los que tendrá acceso este empleado.
                  La gestión de usuarios está reservada solo para administradores.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  Por defecto, los pacientes pueden ver: Turnos, Tratamientos y Consentimientos.
                  Marca los módulos adicionales que deseas habilitar.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {modulosDisponibles && selectedUsuario &&
                Object.entries(
                  selectedUsuario.rol === 'empleado'
                    ? modulosDisponibles.empleado.modulos
                    : modulosDisponibles.paciente.modulos
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPermisos.includes(key)
                        ? selectedUsuario.rol === 'empleado'
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-primary-50 border-primary-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTogglePermiso(key)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedPermisos.includes(key)}
                        onCheckedChange={() => handleTogglePermiso(key)}
                      />
                      <span className="font-medium">{label}</span>
                    </div>
                    {selectedPermisos.includes(key) && (
                      <Check className={`h-4 w-4 ${selectedUsuario.rol === 'empleado' ? 'text-amber-600' : 'text-primary-600'}`} />
                    )}
                  </div>
                ))}
            </div>

            <div className="pt-2 text-sm text-gray-500">
              <strong>Módulos seleccionados:</strong> {selectedPermisos.length}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPermisosDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePermisos}
              disabled={actualizarMutation.isPending}
            >
              {actualizarMutation.isPending ? 'Guardando...' : 'Guardar Permisos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
