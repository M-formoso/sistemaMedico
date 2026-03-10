import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Calendar, FileText, Eye, Upload, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { historiaClinicaService, Resultado, ResultadoCreate } from '@/services/historiaClinicaService'
import { formatearFecha } from '@/utils/formatters'
import { toast } from '@/hooks/useToast'

interface ResultadosTabProps {
  pacienteId: number
}

export function ResultadosTab({ pacienteId }: ResultadosTabProps) {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Resultado | null>(null)
  const [formData, setFormData] = useState<Partial<ResultadoCreate>>({
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  })
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: resultados = [], isLoading } = useQuery({
    queryKey: ['resultados', pacienteId],
    queryFn: () => historiaClinicaService.listarResultados(pacienteId),
  })

  const crearMutation = useMutation({
    mutationFn: ({ data, archivo }: { data: ResultadoCreate; archivo?: File }) =>
      historiaClinicaService.crearResultadoConArchivo(data, archivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultados', pacienteId] })
      toast({ title: 'Resultado agregado correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al agregar el resultado', variant: 'destructive' })
    },
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ResultadoCreate> }) =>
      historiaClinicaService.actualizarResultado(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultados', pacienteId] })
      toast({ title: 'Resultado actualizado correctamente' })
      cerrarDialog()
    },
    onError: () => {
      toast({ title: 'Error al actualizar el resultado', variant: 'destructive' })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => historiaClinicaService.eliminarResultado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultados', pacienteId] })
      toast({ title: 'Resultado eliminado correctamente' })
    },
    onError: () => {
      toast({ title: 'Error al eliminar el resultado', variant: 'destructive' })
    },
  })

  const abrirNuevo = () => {
    setEditando(null)
    setFormData({
      nombre: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      notas: '',
    })
    setArchivoSeleccionado(null)
    setPreviewUrl(null)
    setIsDialogOpen(true)
  }

  const abrirEditar = (resultado: Resultado) => {
    setEditando(resultado)
    setFormData({
      nombre: resultado.nombre,
      descripcion: resultado.descripcion || '',
      fecha: resultado.fecha,
      notas: resultado.notas || '',
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

    if (editando) {
      actualizarMutation.mutate({ id: editando.id, data: formData })
    } else {
      crearMutation.mutate({
        data: {
          paciente_id: pacienteId,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          fecha: formData.fecha || new Date().toISOString().split('T')[0],
          notas: formData.notas,
        },
        archivo: archivoSeleccionado || undefined,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Resultados de Análisis</h3>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Resultado
        </Button>
      </div>

      {resultados.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay resultados registrados. Haz clic en "Agregar Resultado" para agregar uno.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resultados.map((resultado) => (
            <Card key={resultado.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary-600" />
                      <h4 className="font-medium">{resultado.nombre}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatearFecha(resultado.fecha)}
                    </div>
                    {resultado.descripcion && (
                      <p className="text-sm text-gray-600 mt-2">{resultado.descripcion}</p>
                    )}
                    {resultado.notas && (
                      <p className="text-sm text-gray-500 mt-1 italic">{resultado.notas}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {resultado.archivo_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(resultado.archivo_url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(resultado)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('¿Eliminar este resultado?')) {
                          eliminarMutation.mutate(resultado.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Resultado' : 'Agregar Resultado'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre del Análisis *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Hemograma completo"
                required
              />
            </div>

            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Resumen de los resultados..."
                rows={3}
              />
            </div>

            <div>
              <Label>Archivo del Resultado (opcional)</Label>
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

            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={cerrarDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearMutation.isPending || actualizarMutation.isPending}>
                {crearMutation.isPending || actualizarMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
