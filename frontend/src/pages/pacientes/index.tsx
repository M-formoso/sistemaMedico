import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Key,
  Copy,
  Check,
  AlertCircle,
  User,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PacienteForm } from '@/components/pacientes/PacienteForm'
import { pacientesService } from '@/services/pacientesService'
import { formatearFecha } from '@/utils/formatters'
import { useToast } from '@/hooks/useToast'
import type { Paciente } from '@/types'

function generatePassword(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default function PacientesPage() {
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('todos')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null)
  const [deletingPaciente, setDeletingPaciente] = useState<Paciente | null>(null)
  const [credencialesOpen, setCredencialesOpen] = useState<Paciente | null>(null)
  const [credencialesData, setCredencialesData] = useState({ email: '', password: '' })
  const [credencialesCreadas, setCredencialesCreadas] = useState<{
    email: string
    password: string
  } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => pacientesService.listar(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pacientesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      toast({ title: 'Paciente eliminado correctamente' })
      setDeletingPaciente(null)
    },
  })

  const credencialesMutation = useMutation({
    mutationFn: ({ id, email, password }: { id: number; email: string; password: string }) =>
      pacientesService.crearCredenciales(id, email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      setCredencialesCreadas({
        email: credencialesData.email,
        password: credencialesData.password,
      })
      toast({ title: 'Credenciales creadas correctamente' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const handleOpenCredenciales = (paciente: Paciente) => {
    const generatedPassword = generatePassword()
    setCredencialesData({
      email: paciente.email || '',
      password: generatedPassword,
    })
    setCredencialesCreadas(null)
    setCredencialesOpen(paciente)
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const filteredPacientes = pacientes.filter((p) => {
    const matchesSearch =
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      p.dni?.includes(search) ||
      p.telefono?.includes(search)

    const matchesEstado = estadoFilter === 'todos' || p.estado === estadoFilter

    return matchesSearch && matchesEstado
  })

  const estadoBadge = {
    activo: { variant: 'default' as const, class: 'bg-green-100 text-green-700 border-green-200' },
    inactivo: { variant: 'secondary' as const, class: 'bg-gray-100 text-gray-600' },
    nuevo: { variant: 'default' as const, class: 'bg-blue-100 text-blue-700 border-blue-200' },
  }

  const stats = {
    total: pacientes.length,
    activos: pacientes.filter((p) => p.estado === 'activo').length,
    nuevos: pacientes.filter((p) => p.estado === 'nuevo').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500">Gestiona la información de tus pacientes</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary-500/20">
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">Total Pacientes</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <User className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">Activos</p>
                <p className="text-3xl font-bold text-green-700">{stats.activos}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">Nuevos</p>
                <p className="text-3xl font-bold text-blue-700">{stats.nuevos}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
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
                type="text"
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="nuevo">Nuevos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredPacientes.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No se encontraron pacientes</p>
              <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer paciente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Paciente</TableHead>
                  <TableHead className="font-semibold">Contacto</TableHead>
                  <TableHead className="font-semibold">DNI</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Registro</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPacientes.map((paciente) => (
                  <TableRow key={paciente.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold shadow-sm">
                          {paciente.nombre.charAt(0)}
                          {paciente.apellido.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {paciente.nombre} {paciente.apellido}
                          </p>
                          {paciente.email && (
                            <p className="text-sm text-gray-500">{paciente.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {paciente.telefono && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {paciente.telefono}
                          </div>
                        )}
                        {paciente.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            {paciente.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{paciente.dni || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={estadoBadge[paciente.estado]?.class}>
                        {paciente.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatearFecha(paciente.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => navigate(`/pacientes/${paciente.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingPaciente(paciente)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenCredenciales(paciente)}>
                            <Key className="h-4 w-4 mr-2" />
                            Crear acceso portal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingPaciente(paciente)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear Paciente */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary-600" />
              Nuevo Paciente
            </DialogTitle>
            <DialogDescription>Complete los datos del nuevo paciente</DialogDescription>
          </DialogHeader>
          <PacienteForm
            onSuccess={() => setIsCreateOpen(false)}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Paciente */}
      <Dialog open={!!editingPaciente} onOpenChange={() => setEditingPaciente(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary-600" />
              Editar Paciente
            </DialogTitle>
            <DialogDescription>Modifique los datos del paciente</DialogDescription>
          </DialogHeader>
          {editingPaciente && (
            <PacienteForm
              paciente={editingPaciente}
              onSuccess={() => setEditingPaciente(null)}
              onCancel={() => setEditingPaciente(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={!!deletingPaciente} onOpenChange={() => setDeletingPaciente(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Eliminar Paciente
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar a{' '}
              <strong>
                {deletingPaciente?.nombre} {deletingPaciente?.apellido}
              </strong>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPaciente(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingPaciente && deleteMutation.mutate(deletingPaciente.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear credenciales */}
      <Dialog
        open={!!credencialesOpen}
        onOpenChange={() => {
          setCredencialesOpen(null)
          setCredencialesCreadas(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary-600" />
              Crear Acceso al Portal
            </DialogTitle>
            <DialogDescription>
              {credencialesCreadas
                ? 'Las credenciales han sido creadas. Compártalas con el paciente.'
                : `Cree las credenciales de acceso para ${credencialesOpen?.nombre} ${credencialesOpen?.apellido}`}
            </DialogDescription>
          </DialogHeader>

          {credencialesCreadas ? (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-3">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Credenciales creadas exitosamente</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-green-600">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">
                        {credencialesCreadas.email}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(credencialesCreadas.email, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-green-600">Contraseña</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                        {credencialesCreadas.password}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(credencialesCreadas.password, 'password')}
                      >
                        {copiedField === 'password' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Guarde o comparta estas credenciales ahora. La
                  contraseña no se podrá recuperar después.
                </p>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    setCredencialesOpen(null)
                    setCredencialesCreadas(null)
                  }}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cred-email">Email de acceso</Label>
                <Input
                  id="cred-email"
                  type="email"
                  value={credencialesData.email}
                  onChange={(e) =>
                    setCredencialesData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="paciente@email.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cred-password">Contraseña inicial</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCredencialesData((prev) => ({
                        ...prev,
                        password: generatePassword(),
                      }))
                    }
                  >
                    Generar nueva
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="cred-password"
                    type="text"
                    value={credencialesData.password}
                    onChange={(e) =>
                      setCredencialesData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Contraseña"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  El paciente podrá ingresar al portal con estas credenciales para ver su historial
                  clínico, turnos y más.
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCredencialesOpen(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    credencialesOpen &&
                    credencialesMutation.mutate({
                      id: credencialesOpen.id,
                      ...credencialesData,
                    })
                  }
                  disabled={
                    credencialesMutation.isPending ||
                    !credencialesData.email ||
                    !credencialesData.password
                  }
                >
                  {credencialesMutation.isPending ? 'Creando...' : 'Crear Acceso'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
