import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  FileText,
  Send,
  Check,
  X,
  Eye,
  Trash2,
  Search,
  Calendar,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { presupuestosService, Presupuesto, PresupuestoCreate, ItemPresupuesto } from '@/services/presupuestosService'
import { pacientesService } from '@/services/pacientesService'
import { formatearFecha, formatearMonto } from '@/utils/formatters'
import { toast } from '@/components/ui/toast'

const estadoConfig = {
  borrador: { label: 'Borrador', variant: 'secondary' as const },
  enviado: { label: 'Enviado', variant: 'info' as const },
  aprobado: { label: 'Aprobado', variant: 'success' as const },
  rechazado: { label: 'Rechazado', variant: 'destructive' as const },
  vencido: { label: 'Vencido', variant: 'secondary' as const },
}

export default function PresupuestosPage() {
  const queryClient = useQueryClient()
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [busqueda, setBusqueda] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [presupuestoDetalle, setPresupuestoDetalle] = useState<Presupuesto | null>(null)
  const [pacienteId, setPacienteId] = useState<number | null>(null)
  const [items, setItems] = useState<ItemPresupuesto[]>([])
  const [nuevoItem, setNuevoItem] = useState({ descripcion: '', cantidad: 1, precio_unitario: 0 })
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    valido_hasta: '',
    notas: '',
    condiciones: '',
    descuento_porcentaje: 0,
  })

  const { data: presupuestos = [], isLoading } = useQuery({
    queryKey: ['presupuestos', filtroEstado],
    queryFn: () => presupuestosService.listar(filtroEstado ? { estado: filtroEstado } : {}),
  })

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => pacientesService.listar(),
  })

  const crearMutation = useMutation({
    mutationFn: (data: PresupuestoCreate) => presupuestosService.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] })
      toast({ title: 'Presupuesto creado correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al crear el presupuesto', variant: 'destructive' })
    },
  })

  const enviarMutation = useMutation({
    mutationFn: (id: number) => presupuestosService.enviar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] })
      toast({ title: 'Presupuesto marcado como enviado' })
    },
  })

  const aprobarMutation = useMutation({
    mutationFn: (id: number) => presupuestosService.aprobar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] })
      toast({ title: 'Presupuesto aprobado' })
    },
  })

  const rechazarMutation = useMutation({
    mutationFn: (id: number) => presupuestosService.rechazar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] })
      toast({ title: 'Presupuesto rechazado' })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => presupuestosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] })
      toast({ title: 'Presupuesto eliminado' })
    },
  })

  const abrirNuevo = () => {
    setPacienteId(null)
    setItems([])
    setNuevoItem({ descripcion: '', cantidad: 1, precio_unitario: 0 })
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      valido_hasta: '',
      notas: '',
      condiciones: '',
      descuento_porcentaje: 0,
    })
    setIsDialogOpen(true)
  }

  const cerrarDialog = () => {
    setIsDialogOpen(false)
    setPacienteId(null)
    setItems([])
  }

  const agregarItem = () => {
    if (!nuevoItem.descripcion || nuevoItem.precio_unitario <= 0) {
      toast({ title: 'Completa la descripción y precio', variant: 'destructive' })
      return
    }
    const subtotal = nuevoItem.cantidad * nuevoItem.precio_unitario
    setItems([...items, { ...nuevoItem, subtotal }])
    setNuevoItem({ descripcion: '', cantidad: 1, precio_unitario: 0 })
  }

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calcularTotales = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const descuentoMonto = subtotal * (formData.descuento_porcentaje / 100)
    const total = subtotal - descuentoMonto
    return { subtotal, descuentoMonto, total }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pacienteId) {
      toast({ title: 'Selecciona un paciente', variant: 'destructive' })
      return
    }
    if (items.length === 0) {
      toast({ title: 'Agrega al menos un item', variant: 'destructive' })
      return
    }

    const { subtotal, descuentoMonto, total } = calcularTotales()

    crearMutation.mutate({
      paciente_id: pacienteId,
      fecha: formData.fecha,
      valido_hasta: formData.valido_hasta || undefined,
      items,
      subtotal,
      descuento_porcentaje: formData.descuento_porcentaje,
      descuento_monto: descuentoMonto,
      total,
      notas: formData.notas,
      condiciones: formData.condiciones,
      estado: 'borrador',
    })
  }

  const presupuestosFiltrados = presupuestos.filter((p) => {
    if (!busqueda) return true
    return p.numero.toLowerCase().includes(busqueda.toLowerCase())
  })

  const { subtotal, descuentoMonto, total } = calcularTotales()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de presupuestos */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        </div>
      ) : presupuestosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>No hay presupuestos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presupuestosFiltrados.map((presupuesto) => (
                <TableRow key={presupuesto.id}>
                  <TableCell className="font-medium">{presupuesto.numero}</TableCell>
                  <TableCell>{formatearFecha(presupuesto.fecha)}</TableCell>
                  <TableCell>
                    {pacientes.find((p) => p.id === presupuesto.paciente_id)?.nombre || '-'}
                  </TableCell>
                  <TableCell className="font-medium">{formatearMonto(presupuesto.total)}</TableCell>
                  <TableCell>
                    <Badge variant={estadoConfig[presupuesto.estado].variant}>
                      {estadoConfig[presupuesto.estado].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPresupuestoDetalle(presupuesto)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {presupuesto.estado === 'borrador' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => enviarMutation.mutate(presupuesto.id)}
                        >
                          <Send className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                      {presupuesto.estado === 'enviado' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => aprobarMutation.mutate(presupuesto.id)}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => rechazarMutation.mutate(presupuesto.id)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('¿Eliminar este presupuesto?')) {
                            eliminarMutation.mutate(presupuesto.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog crear presupuesto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Presupuesto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paciente *</Label>
                <Select
                  value={pacienteId?.toString()}
                  onValueChange={(v) => setPacienteId(parseInt(v))}
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
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Válido hasta</Label>
              <Input
                type="date"
                value={formData.valido_hasta}
                onChange={(e) => setFormData({ ...formData, valido_hasta: e.target.value })}
              />
            </div>

            {/* Items */}
            <div className="space-y-4">
              <Label>Items del presupuesto</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Descripción"
                  value={nuevoItem.descripcion}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Cant"
                  value={nuevoItem.cantidad}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={nuevoItem.precio_unitario || ''}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, precio_unitario: parseFloat(e.target.value) || 0 })}
                  className="w-32"
                />
                <Button type="button" onClick={agregarItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Cant</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.descripcion}</TableCell>
                        <TableCell className="text-right">{item.cantidad}</TableCell>
                        <TableCell className="text-right">{formatearMonto(item.precio_unitario)}</TableCell>
                        <TableCell className="text-right">{formatearMonto(item.subtotal)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => eliminarItem(idx)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Totales */}
            {items.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatearMonto(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Descuento (%):</span>
                  <Input
                    type="number"
                    value={formData.descuento_porcentaje}
                    onChange={(e) => setFormData({ ...formData, descuento_porcentaje: parseFloat(e.target.value) || 0 })}
                    className="w-24 text-right"
                  />
                </div>
                {descuentoMonto > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-{formatearMonto(descuentoMonto)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>TOTAL:</span>
                  <span>{formatearMonto(total)}</span>
                </div>
              </div>
            )}

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>

            <div>
              <Label>Condiciones</Label>
              <Textarea
                value={formData.condiciones}
                onChange={(e) => setFormData({ ...formData, condiciones: e.target.value })}
                placeholder="Condiciones del presupuesto..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={cerrarDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearMutation.isPending}>
                {crearMutation.isPending ? 'Guardando...' : 'Crear Presupuesto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog detalle */}
      <Dialog open={!!presupuestoDetalle} onOpenChange={() => setPresupuestoDetalle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Presupuesto {presupuestoDetalle?.numero}</DialogTitle>
          </DialogHeader>
          {presupuestoDetalle && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {formatearFecha(presupuestoDetalle.fecha)}
                </div>
                <Badge variant={estadoConfig[presupuestoDetalle.estado].variant}>
                  {estadoConfig[presupuestoDetalle.estado].label}
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cant</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presupuestoDetalle.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">{formatearMonto(item.precio_unitario)}</TableCell>
                      <TableCell className="text-right">{formatearMonto(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatearMonto(presupuestoDetalle.subtotal)}</span>
                </div>
                {presupuestoDetalle.descuento_monto && presupuestoDetalle.descuento_monto > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento ({presupuestoDetalle.descuento_porcentaje}%):</span>
                    <span>-{formatearMonto(presupuestoDetalle.descuento_monto)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>TOTAL:</span>
                  <span>{formatearMonto(presupuestoDetalle.total)}</span>
                </div>
              </div>

              {presupuestoDetalle.notas && (
                <div>
                  <h4 className="font-medium">Notas</h4>
                  <p className="text-gray-600">{presupuestoDetalle.notas}</p>
                </div>
              )}

              {presupuestoDetalle.condiciones && (
                <div>
                  <h4 className="font-medium">Condiciones</h4>
                  <p className="text-gray-600">{presupuestoDetalle.condiciones}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
