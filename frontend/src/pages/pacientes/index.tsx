import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Edit, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { PacienteForm } from '@/components/pacientes/PacienteForm'
import { pacientesService } from '@/services/pacientesService'
import { formatearFecha } from '@/utils/formatters'
import { toast } from '@/hooks/useToast'
import type { Paciente } from '@/types'

export default function PacientesPage() {
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null)
  const [deletingPaciente, setDeletingPaciente] = useState<Paciente | null>(null)
  const [credencialesOpen, setCredencialesOpen] = useState<Paciente | null>(null)
  const [credencialesData, setCredencialesData] = useState({ email: '', password: '' })

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: pacientes, isLoading } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => pacientesService.obtenerTodos(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pacientesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      toast({ title: 'Paciente eliminado', variant: 'success' })
      setDeletingPaciente(null)
    },
  })

  const credencialesMutation = useMutation({
    mutationFn: ({ id, email, password }: { id: string; email: string; password: string }) =>
      pacientesService.crearCredenciales(id, email, password),
    onSuccess: () => {
      toast({ title: 'Credenciales creadas correctamente', variant: 'success' })
      setCredencialesOpen(null)
      setCredencialesData({ email: '', password: '' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const filteredPacientes = pacientes?.filter((p) =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
    p.dni?.includes(search)
  )

  const estadoBadge = {
    activo: 'success',
    inactivo: 'secondary',
    nuevo: 'info',
  } as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filteredPacientes?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No se encontraron pacientes
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPacientes?.map((paciente) => (
                <TableRow key={paciente.id}>
                  <TableCell className="font-medium">
                    {paciente.nombre} {paciente.apellido}
                  </TableCell>
                  <TableCell>{paciente.dni || '-'}</TableCell>
                  <TableCell>{paciente.telefono || '-'}</TableCell>
                  <TableCell>{paciente.email || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={estadoBadge[paciente.estado]}>
                      {paciente.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatearFecha(paciente.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/pacientes/${paciente.id}`)}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPaciente(paciente)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCredencialesOpen(paciente)}
                        title="Crear acceso portal"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPaciente(paciente)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog: Crear Paciente */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Paciente</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo paciente
            </DialogDescription>
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
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Modifique los datos del paciente
            </DialogDescription>
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
            <DialogTitle>Eliminar Paciente</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar a {deletingPaciente?.nombre} {deletingPaciente?.apellido}?
              Esta acción no se puede deshacer.
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
      <Dialog open={!!credencialesOpen} onOpenChange={() => setCredencialesOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Acceso al Portal</DialogTitle>
            <DialogDescription>
              Cree las credenciales de acceso para {credencialesOpen?.nombre} {credencialesOpen?.apellido}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={credencialesData.email}
                onChange={(e) => setCredencialesData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="paciente@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="text"
                value={credencialesData.password}
                onChange={(e) => setCredencialesData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Contraseña inicial"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCredencialesOpen(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => credencialesOpen && credencialesMutation.mutate({
                id: credencialesOpen.id,
                ...credencialesData
              })}
              disabled={credencialesMutation.isPending || !credencialesData.email || !credencialesData.password}
            >
              {credencialesMutation.isPending ? 'Creando...' : 'Crear Acceso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
