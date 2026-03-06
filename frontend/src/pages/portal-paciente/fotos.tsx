import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Image, Calendar, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/axios'
import { formatearFecha } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Foto {
  id: number
  url: string
  tipo: 'antes' | 'despues' | 'durante'
  fecha: string
  tratamiento_nombre?: string
  notas?: string
}

export default function PortalFotos() {
  const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  const { data: fotos = [], isLoading } = useQuery({
    queryKey: ['portal', 'mis-fotos'],
    queryFn: async () => {
      const { data } = await api.get('/portal/mis-fotos')
      return data as Foto[]
    },
  })

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'antes':
        return 'bg-blue-100 text-blue-700'
      case 'durante':
        return 'bg-yellow-100 text-yellow-700'
      case 'despues':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'antes':
        return 'Antes'
      case 'durante':
        return 'Durante'
      case 'despues':
        return 'Después'
      default:
        return tipo
    }
  }

  const openLightbox = (foto: Foto, index: number) => {
    setSelectedFoto(foto)
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedFoto(null)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'prev'
        ? (selectedIndex - 1 + fotos.length) % fotos.length
        : (selectedIndex + 1) % fotos.length
    setSelectedIndex(newIndex)
    setSelectedFoto(fotos[newIndex])
  }

  // Agrupar fotos por tratamiento
  const fotosPorTratamiento = fotos.reduce(
    (acc, foto) => {
      const key = foto.tratamiento_nombre || 'Sin tratamiento'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(foto)
      return acc
    },
    {} as Record<string, Foto[]>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Fotos</h1>
        <p className="text-gray-500">Galería de fotos de tus tratamientos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-700">
                {fotos.filter((f) => f.tipo === 'antes').length}
              </p>
              <p className="text-sm text-blue-600">Fotos Antes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-700">
                {fotos.filter((f) => f.tipo === 'durante').length}
              </p>
              <p className="text-sm text-yellow-600">Fotos Durante</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-700">
                {fotos.filter((f) => f.tipo === 'despues').length}
              </p>
              <p className="text-sm text-green-600">Fotos Después</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-700">{fotos.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {fotos.length === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="py-16 text-center">
            <Image className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No tenés fotos aún</p>
            <p className="text-sm text-gray-400">
              Las fotos de tus tratamientos aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(fotosPorTratamiento).map(([tratamiento, fotosGrupo]) => (
            <Card key={tratamiento} className="shadow-md border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary-600" />
                  {tratamiento}
                  <Badge variant="secondary" className="ml-2">
                    {fotosGrupo.length} fotos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {fotosGrupo.map((foto) => {
                    const globalIndex = fotos.findIndex((f) => f.id === foto.id)
                    return (
                      <div
                        key={foto.id}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200"
                        onClick={() => openLightbox(foto, globalIndex)}
                      >
                        <img
                          src={foto.url}
                          alt={`Foto ${foto.tipo}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                          <Badge className={getTipoBadge(foto.tipo)}>{getTipoLabel(foto.tipo)}</Badge>
                          <p className="text-white text-xs mt-1">{formatearFecha(foto.fecha)}</p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 backdrop-blur rounded-full p-2">
                            <ZoomIn className="h-4 w-4 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedFoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10"
            onClick={closeLightbox}
          >
            <X className="h-8 w-8" />
          </button>

          {fotos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  navigateLightbox('prev')
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  navigateLightbox('next')
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div
            className="max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedFoto.url}
              alt={`Foto ${selectedFoto.tipo}`}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center text-white">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Badge className={getTipoBadge(selectedFoto.tipo)}>
                  {getTipoLabel(selectedFoto.tipo)}
                </Badge>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatearFecha(selectedFoto.fecha)}
                </span>
              </div>
              {selectedFoto.tratamiento_nombre && (
                <p className="text-gray-400">{selectedFoto.tratamiento_nombre}</p>
              )}
              {selectedFoto.notas && (
                <p className="text-gray-300 mt-2 text-sm">{selectedFoto.notas}</p>
              )}
              <p className="text-gray-500 text-sm mt-3">
                {selectedIndex + 1} de {fotos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
