import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { profesionalesService, Profesional, ProfesionalCreate } from '@/services/profesionalesService'
import { ProfesionalForm } from '@/components/profesionales/ProfesionalForm'

export default function ProfesionalesPage() {
  const [buscar, setBuscar] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [profesionalEditar, setProfesionalEditar] = useState<Profesional | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: profesionales = [], isLoading } = useQuery({
    queryKey: ['profesionales', buscar],
    queryFn: () => profesionalesService.listar({ buscar: buscar || undefined }),
  })

  const crearMutation = useMutation({
    mutationFn: profesionalesService.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] })
      setDialogOpen(false)
      toast({ title: 'Profesional creado correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al crear profesional', variant: 'destructive' })
    },
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProfesionalCreate> }) =>
      profesionalesService.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] })
      setDialogOpen(false)
      setProfesionalEditar(null)
      toast({ title: 'Profesional actualizado correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al actualizar profesional', variant: 'destructive' })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: profesionalesService.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] })
      toast({ title: 'Profesional eliminado correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al eliminar profesional', variant: 'destructive' })
    },
  })

  const handleSubmit = (data: ProfesionalCreate) => {
    if (profesionalEditar) {
      actualizarMutation.mutate({ id: profesionalEditar.id, data })
    } else {
      crearMutation.mutate(data)
    }
  }

  const handleEditar = (profesional: Profesional) => {
    setProfesionalEditar(profesional)
    setDialogOpen(true)
  }

  const handleNuevo = () => {
    setProfesionalEditar(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profesionales</h1>
          <p className="text-muted-foreground">Gestión de médicos y especialistas</p>
        </div>
        <Button onClick={handleNuevo}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Profesional
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o matrícula..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : profesionales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay profesionales registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profesionales.map((profesional) => (
                  <TableRow key={profesional.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: profesional.color_agenda }}
                        >
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {profesional.nombre} {profesional.apellido}
                          </div>
                          {profesional.email && (
                            <div className="text-sm text-muted-foreground">
                              {profesional.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{profesional.especialidad || '-'}</TableCell>
                    <TableCell>{profesional.matricula || '-'}</TableCell>
                    <TableCell>{profesional.telefono || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={profesional.activo ? 'default' : 'secondary'}>
                        {profesional.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditar(profesional)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('¿Eliminar este profesional?')) {
                              eliminarMutation.mutate(profesional.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {profesionalEditar ? 'Editar Profesional' : 'Nuevo Profesional'}
            </DialogTitle>
          </DialogHeader>
          <ProfesionalForm
            profesional={profesionalEditar}
            onSubmit={handleSubmit}
            isLoading={crearMutation.isPending || actualizarMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
