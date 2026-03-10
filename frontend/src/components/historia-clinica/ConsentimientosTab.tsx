import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Calendar, FileCheck, FileX, Check, Eye, Upload, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { historiaClinicaService, Consentimiento, ConsentimientoCreate } from '@/services/historiaClinicaService'
import { formatearFecha } from '@/utils/formatters'
import { toast } from '@/hooks/useToast'

interface ConsentimientosTabProps {
  pacienteId: number
}

const tipoConfig = {
  tratamiento: 'Tratamiento',
  datos_personales: 'Datos Personales',
  fotografias: 'Fotografías',
  procedimiento: 'Procedimiento',
  anestesia: 'Anestesia',
  otro: 'Otro',
}

export function ConsentimientosTab({ pacienteId }: ConsentimientosTabProps) {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Consentimiento | null>(null)
  const [formData, setFormData] = useState<Partial<ConsentimientoCreate>>({
    tipo: 'tratamiento',
    nombre: '',
    descripcion: '',
    firmado: false,
  })
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: consentimientos = [], isLoading } = useQuery({
    queryKey: ['consentimientos', pacienteId],
    queryFn: () => historiaClinicaService.listarConsentimientos(pacienteId),
  })

  const crearMutation = useMutation({
    mutationFn: ({ data, archivo }: { data: ConsentimientoCreate; archivo?: File }) =>
      historiaClinicaService.crearConsentimientoConArchivo(data, archivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentimientos', pacienteId] })
      toast({ title: 'Consentimiento creado correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al crear el consentimiento', variant: 'destructive' })
    },
  })

  const firmarMutation = useMutation({
    mutationFn: (id: number) => historiaClinicaService.firmarConsentimiento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentimientos', pacienteId] })
      toast({ title: 'Consentimiento firmado correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al firmar el consentimiento', variant: 'destructive' })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => historiaClinicaService.eliminarConsentimiento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentimientos', pacienteId] })
      toast({ title: 'Consentimiento eliminado correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al eliminar el consentimiento', variant: 'destructive' })
    },
  })

  const abrirNuevo = () => {
    setEditando(null)
    setFormData({
      tipo: 'tratamiento',
      nombre: '',
      descripcion: '',
      firmado: false,
    })
    setArchivoSeleccionado(null)
    setPreviewUrl(null)
    setIsDialogOpen(true)
  }

  const cerrarDialog = () => {
    setIsDialogOpen(false)
    setEditando(null)
    setFormData({})
    setArchivoSeleccionado(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArchivoSeleccionado(file)
      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const removeSelectedFile = () => {
    setArchivoSeleccionado(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre) {
      toast({ title: 'El nombre es requerido', variant: 'destructive' })
      return
    }

    crearMutation.mutate({
      data: {
        paciente_id: pacienteId,
        tipo: formData.tipo,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        firmado: formData.firmado,
      },
      archivo: archivoSeleccionado || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    )
  }

  const pendientes = consentimientos.filter((c) => !c.firmado)
  const firmados = consentimientos.filter((c) => c.firmado)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Consentimientos Informados</h3>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Consentimiento
        </Button>
      </div>

      {consentimientos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay consentimientos registrados. Haz clic en "Nuevo Consentimiento" para agregar uno.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendientes.length > 0 && (
            <div>
              <h4 className="font-medium text-amber-700 mb-3 flex items-center gap-2">
                <FileX className="h-5 w-5" />
                Pendientes de Firma ({pendientes.length})
              </h4>
              <div className="space-y-3">
                {pendientes.map((consentimiento) => (
                  <ConsentimientoCard
                    key={consentimiento.id}
                    consentimiento={consentimiento}
                    onFirmar={() => {
                      if (confirm('¿Confirmar firma de este consentimiento?')) {
                        firmarMutation.mutate(consentimiento.id)
                      }
                    }}
                    onEliminar={() => {
                      if (confirm('¿Eliminar este consentimiento?')) {
                        eliminarMutation.mutate(consentimiento.id)
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {firmados.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Firmados ({firmados.length})
              </h4>
              <div className="space-y-3">
                {firmados.map((consentimiento) => (
                  <ConsentimientoCard
                    key={consentimiento.id}
                    consentimiento={consentimiento}
                    onEliminar={() => {
                      if (confirm('¿Eliminar este consentimiento?')) {
                        eliminarMutation.mutate(consentimiento.id)
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog para crear */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Consentimiento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo de Consentimiento</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as Consentimiento['tipo'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tratamiento">Tratamiento</SelectItem>
                  <SelectItem value="datos_personales">Datos Personales</SelectItem>
                  <SelectItem value="fotografias">Fotografías</SelectItem>
                  <SelectItem value="procedimiento">Procedimiento</SelectItem>
                  <SelectItem value="anestesia">Anestesia</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nombre / Título *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Consentimiento para aplicación de Botox"
                required
              />
            </div>

            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalles del consentimiento..."
                rows={3}
              />
            </div>

            <div>
              <Label>Archivo del Documento (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {archivoSeleccionado ? (
                <div className="space-y-2">
                  {previewUrl && (
                    <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Paperclip className="h-4 w-4 text-green-600" />
                    <span className="flex-1 text-sm text-green-700 truncate">
                      {archivoSeleccionado.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFile}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Click para adjuntar PDF o imagen
                    </span>
                  </div>
                </Button>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceptados: PDF, JPG, PNG
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={cerrarDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearMutation.isPending}>
                {crearMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConsentimientoCard({
  consentimiento,
  onFirmar,
  onEliminar,
}: {
  consentimiento: Consentimiento
  onFirmar?: () => void
  onEliminar: () => void
}) {
  return (
    <Card className={consentimiento.firmado ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}>
      <CardContent className="py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {consentimiento.firmado ? (
                <FileCheck className="h-5 w-5 text-green-600" />
              ) : (
                <FileX className="h-5 w-5 text-amber-600" />
              )}
              <h4 className="font-medium">{consentimiento.nombre}</h4>
              <Badge variant={consentimiento.firmado ? 'success' : 'warning'}>
                {consentimiento.firmado ? 'Firmado' : 'Pendiente'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>{tipoConfig[consentimiento.tipo]}</span>
              {consentimiento.fecha_firma && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Firmado: {formatearFecha(consentimiento.fecha_firma)}
                </span>
              )}
            </div>
            {consentimiento.descripcion && (
              <p className="text-sm text-gray-600 mt-2">{consentimiento.descripcion}</p>
            )}
          </div>
          <div className="flex gap-2">
            {consentimiento.archivo_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(consentimiento.archivo_url, '_blank')}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {!consentimiento.firmado && onFirmar && (
              <Button variant="ghost" size="sm" onClick={onFirmar}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onEliminar}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
