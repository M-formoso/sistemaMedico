import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PacienteDetail } from '@/components/pacientes/PacienteDetail'
import { PacienteForm } from '@/components/pacientes/PacienteForm'
import { useQuery } from '@tanstack/react-query'
import { pacientesService } from '@/services/pacientesService'

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)

  const { data: paciente } = useQuery({
    queryKey: ['pacientes', id],
    queryFn: () => pacientesService.obtenerPorId(id!),
    enabled: !!id,
  })

  if (!id) {
    return <div>ID no válido</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/pacientes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Detail */}
      <PacienteDetail pacienteId={id} />

      {/* Dialog: Editar */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          {paciente && (
            <PacienteForm
              paciente={paciente}
              onSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
