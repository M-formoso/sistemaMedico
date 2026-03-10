import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Calendar, Eye, Upload, Trash2, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { pacientesService } from '@/services/pacientesService'
import { fotosService, type Foto } from '@/services/fotosService'
import { tratamientosService } from '@/services/tratamientosService'
import { formatearFecha } from '@/utils/formatters'
import { useState, useRef } from 'react'
import { useToast } from '@/hooks/useToast'
import type { Tratamiento } from '@/types'

interface FotosTabProps {
  pacienteId: number
}

export function FotosTab({ pacienteId }: FotosTabProps) {
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadTipo, setUploadTipo] = useState<'antes' | 'despues' | 'evolucion'>('antes')
  const [uploadTratamientoId, setUploadTratamientoId] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Obtener lista de tratamientos
  const { data: tratamientos = [] } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: () => tratamientosService.listar({ solo_activos: true }),
  })

  const { data: historial, isLoading } = useQuery({
    queryKey: ['pacientes', pacienteId, 'historial'],
    queryFn: () => pacientesService.obtenerHistorial(pacienteId),
  })

  const { data: fotosDirectas = [] } = useQuery({
    queryKey: ['fotos', pacienteId],
    queryFn: () => fotosService.obtenerPorPaciente(pacienteId),
  })

  // Combinar fotos del historial con las directas
  const fotosHistorial: Foto[] = historial?.fotos || []
  const fotos: Foto[] = [...fotosDirectas, ...fotosHistorial.filter(
    fh => !fotosDirectas.some(fd => fd.id === fh.id)
  )]

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return fotosService.subir({
        pacienteId,
        tipo: uploadTipo,
        tratamientoId: uploadTratamientoId ? parseInt(uploadTratamientoId) : undefined,
        file,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', pacienteId] })
      queryClient.invalidateQueries({ queryKey: ['pacientes', pacienteId, 'historial'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (fotoId: number) => fotosService.eliminar(fotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos', pacienteId] })
      queryClient.invalidateQueries({ queryKey: ['pacientes', pacienteId, 'historial'] })
      toast({ title: 'Foto eliminada correctamente' })
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setSelectedFiles(prev => [...prev, ...files])

    // Crear URLs de preview
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      for (const file of selectedFiles) {
        await uploadMutation.mutateAsync(file)
      }
      toast({
        title: 'Fotos subidas correctamente',
        description: `Se subieron ${selectedFiles.length} foto(s)`,
      })
      // Limpiar
      setSelectedFiles([])
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      setPreviewUrls([])
      setIsUploadOpen(false)
      setUploadTratamientoId('')
      setUploadTipo('antes')
    } catch (error) {
      toast({
        title: 'Error al subir fotos',
        description: 'Intente nuevamente',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteFoto = (foto: Foto, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Está seguro de eliminar esta foto?')) {
      deleteMutation.mutate(foto.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Agrupar por tratamiento
  const fotosPorTratamiento: Record<string, Foto[]> = {}
  fotos.forEach((foto) => {
    const tratamientoKey = foto.tratamiento_nombre || 'Sin tratamiento'
    if (!fotosPorTratamiento[tratamientoKey]) {
      fotosPorTratamiento[tratamientoKey] = []
    }
    fotosPorTratamiento[tratamientoKey].push(foto)
  })

  const tipoLabels: Record<string, string> = {
    antes: 'Antes',
    despues: 'Después',
    evolucion: 'Evolución',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Galería de Fotos</h3>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Subir Fotos
        </Button>
      </div>

      {fotos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Camera className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>No hay fotos registradas para este paciente.</p>
            <p className="text-sm mt-1">
              Haz clic en "Subir Fotos" para agregar fotos de antes/después.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(fotosPorTratamiento).map(([tratamiento, fotosDelTratamiento]) => (
            <div key={tratamiento}>
              <h4 className="font-medium text-gray-700 mb-3">
                {tratamiento}
                <Badge variant="secondary" className="ml-2">
                  {fotosDelTratamiento.length}
                </Badge>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {fotosDelTratamiento.map((foto) => (
                  <Card
                    key={foto.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group relative"
                    onClick={() => setFotoAmpliada(foto)}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={foto.url}
                        alt={foto.tipo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Badge de tipo */}
                      <div className="absolute top-2 left-2">
                        <Badge
                          className={
                            foto.tipo === 'antes'
                              ? 'bg-orange-500 text-white'
                              : foto.tipo === 'despues'
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 text-white'
                          }
                        >
                          {tipoLabels[foto.tipo] || foto.tipo}
                        </Badge>
                      </div>
                      {/* Botón eliminar */}
                      <button
                        onClick={(e) => handleDeleteFoto(foto, e)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {foto.fecha && (
                      <CardContent className="p-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatearFecha(foto.fecha)}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparación Antes/Después por tratamiento */}
      {Object.entries(fotosPorTratamiento).map(([tratamiento, fotosDelTratamiento]) => {
        const fotosAntes = fotosDelTratamiento.filter(f => f.tipo === 'antes')
        const fotosDespues = fotosDelTratamiento.filter(f => f.tipo === 'despues')

        if (fotosAntes.length === 0 || fotosDespues.length === 0) return null

        return (
          <div key={`comparacion-${tratamiento}`} className="mt-8">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              Comparación Antes / Después
              <Badge variant="outline" className="text-primary-600">
                {tratamiento}
              </Badge>
            </h4>
            <div className="space-y-4">
              {fotosAntes.map((fotoAntes, index) => {
                const fotoDespues = fotosDespues[index] || fotosDespues[0]
                return (
                  <div key={`comp-${fotoAntes.id}`} className="grid grid-cols-2 gap-4">
                    <Card className="overflow-hidden">
                      <div className="bg-orange-100 px-3 py-2 text-center text-sm font-medium text-orange-700">
                        ANTES
                        {fotoAntes.fecha && (
                          <span className="ml-2 text-xs text-orange-500">
                            {formatearFecha(fotoAntes.fecha)}
                          </span>
                        )}
                      </div>
                      <div
                        className="aspect-square cursor-pointer"
                        onClick={() => setFotoAmpliada(fotoAntes)}
                      >
                        <img
                          src={fotoAntes.url}
                          alt="Antes"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </Card>
                    <Card className="overflow-hidden">
                      <div className="bg-green-100 px-3 py-2 text-center text-sm font-medium text-green-700">
                        DESPUÉS
                        {fotoDespues.fecha && (
                          <span className="ml-2 text-xs text-green-500">
                            {formatearFecha(fotoDespues.fecha)}
                          </span>
                        )}
                      </div>
                      <div
                        className="aspect-square cursor-pointer"
                        onClick={() => setFotoAmpliada(fotoDespues)}
                      >
                        <img
                          src={fotoDespues.url}
                          alt="Después"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Dialog para foto ampliada */}
      <Dialog open={!!fotoAmpliada} onOpenChange={() => setFotoAmpliada(null)}>
        <DialogContent className="max-w-4xl p-0">
          {fotoAmpliada && (
            <div>
              <img
                src={fotoAmpliada.url}
                alt={fotoAmpliada.tipo}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <Badge>{fotoAmpliada.tipo}</Badge>
                  {fotoAmpliada.fecha && (
                    <span className="text-sm text-gray-500">
                      {formatearFecha(fotoAmpliada.fecha)}
                    </span>
                  )}
                </div>
                {fotoAmpliada.zona && (
                  <p className="mt-2 text-gray-600">{fotoAmpliada.zona}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para subir fotos */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary-600" />
              Subir Fotos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selector de tratamiento */}
            <div className="space-y-2">
              <Label>Tratamiento *</Label>
              <Select value={uploadTratamientoId} onValueChange={setUploadTratamientoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tratamiento..." />
                </SelectTrigger>
                <SelectContent>
                  {tratamientos.map((tratamiento: Tratamiento) => (
                    <SelectItem key={tratamiento.id} value={tratamiento.id.toString()}>
                      {tratamiento.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de tipo (antes/después) */}
            <div className="space-y-2">
              <Label>Tipo de foto *</Label>
              <Select value={uploadTipo} onValueChange={(v) => setUploadTipo(v as typeof uploadTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="antes">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      Antes del tratamiento
                    </div>
                  </SelectItem>
                  <SelectItem value="despues">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Después del tratamiento
                    </div>
                  </SelectItem>
                  <SelectItem value="evolucion">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      Evolución / Seguimiento
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input de archivos */}
            <div className="space-y-2">
              <Label>Seleccionar fotos</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Click para seleccionar imágenes
                  </span>
                </div>
              </Button>
            </div>

            {/* Preview de imágenes seleccionadas */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <Label>Imágenes seleccionadas ({previewUrls.length})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Subiendo...' : `Subir ${selectedFiles.length} foto(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
