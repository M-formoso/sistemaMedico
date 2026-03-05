import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Search, Receipt, Edit, Trash2, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PagoForm } from './PagoForm'
import { pagosService } from '@/services/pagosService'
import { toast } from '@/hooks/useToast'
import type { Pago, MetodoPago } from '@/types'

const metodoPagoLabels: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
  mercadopago: 'Mercado Pago',
}

const metodoPagoColors: Record<MetodoPago, string> = {
  efectivo: 'bg-green-100 text-green-800',
  transferencia: 'bg-blue-100 text-blue-800',
  debito: 'bg-purple-100 text-purple-800',
  credito: 'bg-orange-100 text-orange-800',
  mercadopago: 'bg-cyan-100 text-cyan-800',
}

interface PagosTabProps {
  fechaInicio: string
  fechaFin: string
}

export function PagosTab({ fechaInicio, fechaFin }: PagosTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const queryClient = useQueryClient()

  const { data: pagos = [], isLoading } = useQuery({
    queryKey: ['pagos', fechaInicio, fechaFin],
    queryFn: () => pagosService.listar({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pagosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] })
      toast({
        title: 'Pago eliminado',
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

  const filteredPagos = pagos.filter((pago) => {
    if (!searchTerm) return true
    const pacienteNombre = pago.paciente?.nombre_completo || ''
    return (
      pacienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.concepto?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleEdit = (pago: Pago) => {
    setSelectedPago(pago)
    setIsEditing(true)
  }

  const handleDelete = (pago: Pago) => {
    if (confirm('¿Estás seguro de eliminar este pago?')) {
      deleteMutation.mutate(pago.id)
    }
  }

  const handleGenerarRecibo = async (pago: Pago) => {
    try {
      const blob = await pagosService.generarRecibo(pago.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo_${pago.id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo generar el recibo',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por paciente o concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredPagos.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay pagos registrados</h3>
            <p className="text-gray-500 mt-1">
              {searchTerm ? 'No se encontraron pagos con ese criterio.' : 'Registra un pago para comenzar.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPagos.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>
                    {format(new Date(pago.fecha), "d MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {pago.paciente?.nombre_completo || 'Sin paciente'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{pago.concepto || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={metodoPagoColors[pago.metodo_pago]}>
                      {metodoPagoLabels[pago.metodo_pago]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">
                      ${pago.monto.toLocaleString('es-AR')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerarRecibo(pago)}
                        title="Generar Recibo"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(pago)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(pago)}
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

        {/* Dialog: Crear Pago */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
            </DialogHeader>
            <PagoForm
              onSuccess={() => setIsCreating(false)}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog: Editar Pago */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Pago</DialogTitle>
            </DialogHeader>
            {selectedPago && (
              <PagoForm
                pago={selectedPago}
                onSuccess={() => {
                  setIsEditing(false)
                  setSelectedPago(null)
                }}
                onCancel={() => {
                  setIsEditing(false)
                  setSelectedPago(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
