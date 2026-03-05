import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Search, Receipt, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EgresoForm } from './EgresoForm'
import { egresosService } from '@/services/egresosService'
import { toast } from '@/hooks/useToast'
import type { Egreso, CategoriaEgreso } from '@/types'

const categoriaLabels: Record<CategoriaEgreso, string> = {
  materiales: 'Materiales',
  servicios: 'Servicios',
  alquiler: 'Alquiler',
  sueldos: 'Sueldos',
  impuestos: 'Impuestos',
  marketing: 'Marketing',
  mantenimiento: 'Mantenimiento',
  otros: 'Otros',
}

const categoriaColors: Record<CategoriaEgreso, string> = {
  materiales: 'bg-blue-100 text-blue-800',
  servicios: 'bg-purple-100 text-purple-800',
  alquiler: 'bg-orange-100 text-orange-800',
  sueldos: 'bg-green-100 text-green-800',
  impuestos: 'bg-red-100 text-red-800',
  marketing: 'bg-pink-100 text-pink-800',
  mantenimiento: 'bg-yellow-100 text-yellow-800',
  otros: 'bg-gray-100 text-gray-800',
}

interface EgresosTabProps {
  fechaInicio: string
  fechaFin: string
}

export function EgresosTab({ fechaInicio, fechaFin }: EgresosTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedEgreso, setSelectedEgreso] = useState<Egreso | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const queryClient = useQueryClient()

  const { data: egresos = [], isLoading } = useQuery({
    queryKey: ['egresos', fechaInicio, fechaFin],
    queryFn: () => egresosService.listar({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => egresosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egresos'] })
      toast({
        title: 'Egreso eliminado',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const filteredEgresos = egresos.filter((egreso) => {
    if (!searchTerm) return true
    return (
      egreso.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      egreso.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Calcular totales por categoría
  const totalesPorCategoria = egresos.reduce((acc, e) => {
    acc[e.categoria] = (acc[e.categoria] || 0) + e.monto
    return acc
  }, {} as Record<string, number>)

  const handleEdit = (egreso: Egreso) => {
    setSelectedEgreso(egreso)
    setIsEditing(true)
  }

  const handleDelete = (egreso: Egreso) => {
    if (confirm('¿Estás seguro de eliminar este egreso?')) {
      deleteMutation.mutate(egreso.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Resumen por categoría */}
      {Object.keys(totalesPorCategoria).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500 mb-3">Desglose por Categoría</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(totalesPorCategoria).map(([categoria, monto]) => (
                <div key={categoria} className="flex items-center gap-2">
                  <Badge className={categoriaColors[categoria as CategoriaEgreso]}>
                    {categoriaLabels[categoria as CategoriaEgreso]}
                  </Badge>
                  <span className="font-medium">${monto.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por concepto o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Egreso
            </Button>
          </div>

          {/* Tabla */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredEgresos.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hay egresos registrados</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm ? 'No se encontraron egresos con ese criterio.' : 'Registra un egreso para comenzar.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEgresos.map((egreso) => (
                  <TableRow key={egreso.id}>
                    <TableCell>
                      {format(new Date(egreso.fecha), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{egreso.concepto}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoriaColors[egreso.categoria]}>
                        {categoriaLabels[egreso.categoria]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">{egreso.proveedor || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-red-600">
                        -${egreso.monto.toLocaleString('es-AR')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(egreso)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(egreso)}
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

          {/* Dialog: Crear Egreso */}
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Egreso</DialogTitle>
              </DialogHeader>
              <EgresoForm
                onSuccess={() => setIsCreating(false)}
                onCancel={() => setIsCreating(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Dialog: Editar Egreso */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Editar Egreso</DialogTitle>
              </DialogHeader>
              {selectedEgreso && (
                <EgresoForm
                  egreso={selectedEgreso}
                  onSuccess={() => {
                    setIsEditing(false)
                    setSelectedEgreso(null)
                  }}
                  onCancel={() => {
                    setIsEditing(false)
                    setSelectedEgreso(null)
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
