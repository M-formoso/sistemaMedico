import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Package, Search, AlertTriangle, ArrowUpDown, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MaterialForm } from '@/components/materiales/MaterialForm'
import { MovimientoStockForm } from '@/components/materiales/MovimientoStockForm'
import { materialesService } from '@/services/materialesService'
import { toast } from '@/hooks/useToast'
import type { Material } from '@/types'

export default function MaterialesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingStock, setIsAddingStock] = useState(false)

  const queryClient = useQueryClient()

  const { data: materiales = [], isLoading } = useQuery({
    queryKey: ['materiales'],
    queryFn: () => materialesService.listar(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => materialesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
      toast({
        title: 'Material eliminado',
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

  const filteredMateriales = materiales.filter((material) => {
    if (!searchTerm) return true
    return (
      material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const materialesStockBajo = materiales.filter(
    (m) => m.stock_actual <= (m.stock_minimo || 0)
  )

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material)
    setIsEditing(true)
  }

  const handleAddStock = (material: Material) => {
    setSelectedMaterial(material)
    setIsAddingStock(true)
  }

  const handleDelete = (material: Material) => {
    if (confirm(`¿Estás seguro de eliminar "${material.nombre}"?`)) {
      deleteMutation.mutate(material.id)
    }
  }

  const getStockStatus = (material: Material) => {
    if (material.stock_actual <= 0) {
      return <Badge variant="destructive">Sin Stock</Badge>
    }
    if (material.stock_minimo && material.stock_actual <= material.stock_minimo) {
      return <Badge className="bg-orange-100 text-orange-800">Stock Bajo</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">OK</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiales e Inventario</h1>
          <p className="text-gray-500">Gestiona los materiales y el stock</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Material
        </Button>
      </div>

      {/* Alertas de Stock Bajo */}
      {materialesStockBajo.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Stock Bajo ({materialesStockBajo.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {materialesStockBajo.map((material) => (
                <Badge
                  key={material.id}
                  className="bg-orange-100 text-orange-800 cursor-pointer"
                  onClick={() => handleAddStock(material)}
                >
                  {material.nombre}: {material.stock_actual} {material.unidad_medida}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Búsqueda y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, código o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 rounded-full p-2">
                <Package className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Materiales</p>
                <p className="text-xl font-bold">{materiales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-full p-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock Bajo</p>
                <p className="text-xl font-bold text-orange-600">{materialesStockBajo.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Materiales */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredMateriales.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hay materiales</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm ? 'No se encontraron materiales con ese criterio.' : 'Comienza agregando un nuevo material.'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Material
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Precio Costo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMateriales.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{material.nombre}</p>
                        {material.descripcion && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {material.descripcion}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-500">{material.codigo || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{material.stock_actual}</span>
                      <span className="text-gray-500 ml-1">{material.unidad_medida}</span>
                      {material.stock_minimo && (
                        <p className="text-xs text-gray-400">
                          Mín: {material.stock_minimo}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {material.precio_costo ? (
                        <span>${material.precio_costo.toLocaleString('es-AR')}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-500">{material.proveedor || '-'}</span>
                    </TableCell>
                    <TableCell>{getStockStatus(material)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddStock(material)}
                          title="Agregar Stock"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(material)}
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

      {/* Dialog: Crear Material */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Material</DialogTitle>
          </DialogHeader>
          <MaterialForm
            onSuccess={() => setIsCreating(false)}
            onCancel={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Material */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Material</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <MaterialForm
              material={selectedMaterial}
              onSuccess={() => {
                setIsEditing(false)
                setSelectedMaterial(null)
              }}
              onCancel={() => {
                setIsEditing(false)
                setSelectedMaterial(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Movimiento de Stock */}
      <Dialog open={isAddingStock} onOpenChange={setIsAddingStock}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Movimiento de Stock</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <MovimientoStockForm
              material={selectedMaterial}
              onSuccess={() => {
                setIsAddingStock(false)
                setSelectedMaterial(null)
              }}
              onCancel={() => {
                setIsAddingStock(false)
                setSelectedMaterial(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
