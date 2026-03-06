import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Settings, Clock, Users, Plus, Trash2, Edit, ExternalLink, Link2, Calendar, MessageSquare, CreditCard, CheckCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { configuracionService, HorarioAtencion, ListaEspera } from '@/services/configuracionService'
import { integracionesService } from '@/services/integracionesService'

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

export default function ConfiguracionPage() {
  const [horarioDialogOpen, setHorarioDialogOpen] = useState(false)
  const [nuevoHorario, setNuevoHorario] = useState({
    dia_semana: 0,
    hora_inicio: '09:00',
    hora_fin: '18:00',
  })
  const [searchParams, setSearchParams] = useSearchParams()
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Verificar estado de Google Calendar
  const { data: googleStatus, refetch: refetchGoogleStatus } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: integracionesService.getGoogleCalendarStatus,
  })

  // Procesar callback de Google OAuth
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      const redirectUri = window.location.origin + '/configuracion'
      integracionesService.googleCalendarCallback(code, redirectUri)
        .then(() => {
          toast({ title: 'Google Calendar conectado exitosamente' })
          refetchGoogleStatus()
          // Limpiar URL
          setSearchParams({})
        })
        .catch((error) => {
          toast({ title: 'Error al conectar Google Calendar', variant: 'destructive' })
          console.error(error)
          setSearchParams({})
        })
    }
  }, [searchParams])

  // Conectar Google Calendar
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true)
    try {
      const redirectUri = window.location.origin + '/configuracion'
      const { auth_url } = await integracionesService.getGoogleAuthUrl(redirectUri)
      window.location.href = auth_url
    } catch (error) {
      toast({ title: 'Error al obtener URL de autorización', variant: 'destructive' })
      setIsConnectingGoogle(false)
    }
  }

  const { data: horarios = [] } = useQuery({
    queryKey: ['horarios'],
    queryFn: configuracionService.listarHorarios,
  })

  const { data: listaEspera = [] } = useQuery({
    queryKey: ['lista-espera'],
    queryFn: () => configuracionService.listarListaEspera({ atendido: false }),
  })

  const { data: configuraciones = [] } = useQuery({
    queryKey: ['configuraciones'],
    queryFn: configuracionService.listar,
  })

  const crearHorarioMutation = useMutation({
    mutationFn: configuracionService.crearHorario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'] })
      setHorarioDialogOpen(false)
      toast({ title: 'Horario creado correctamente' })
    },
  })

  const eliminarHorarioMutation = useMutation({
    mutationFn: configuracionService.eliminarHorario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'] })
      toast({ title: 'Horario eliminado' })
    },
  })

  const marcarAtendidoMutation = useMutation({
    mutationFn: (id: number) =>
      configuracionService.actualizarListaEspera(id, { atendido: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-espera'] })
      toast({ title: 'Paciente marcado como atendido' })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Ajustes del sistema</p>
      </div>

      <Tabs defaultValue="horarios">
        <TabsList>
          <TabsTrigger value="horarios">
            <Clock className="mr-2 h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="lista-espera">
            <Users className="mr-2 h-4 w-4" />
            Lista de Espera ({listaEspera.length})
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="integraciones">
            <Link2 className="mr-2 h-4 w-4" />
            Integraciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="horarios" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Horarios de Atención</CardTitle>
                <CardDescription>
                  Configure los horarios de atención del consultorio
                </CardDescription>
              </div>
              <Button onClick={() => setHorarioDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Horario
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead>Hora Inicio</TableHead>
                    <TableHead>Hora Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {horarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay horarios configurados
                      </TableCell>
                    </TableRow>
                  ) : (
                    horarios.map((horario) => (
                      <TableRow key={horario.id}>
                        <TableCell className="font-medium">
                          {DIAS_SEMANA[horario.dia_semana]}
                        </TableCell>
                        <TableCell>{horario.hora_inicio}</TableCell>
                        <TableCell>{horario.hora_fin}</TableCell>
                        <TableCell>
                          <Badge variant={horario.activo ? 'default' : 'secondary'}>
                            {horario.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('¿Eliminar este horario?')) {
                                eliminarHorarioMutation.mutate(horario.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista-espera" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes en Lista de Espera</CardTitle>
              <CardDescription>
                Pacientes esperando turno disponible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente ID</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Fecha Preferida</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaEspera.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay pacientes en lista de espera
                      </TableCell>
                    </TableRow>
                  ) : (
                    listaEspera.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>#{item.paciente_id}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.prioridad === 2
                                ? 'destructive'
                                : item.prioridad === 1
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {item.prioridad === 2
                              ? 'Urgente'
                              : item.prioridad === 1
                              ? 'Alta'
                              : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.fecha_preferida
                            ? new Date(item.fecha_preferida).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>{item.notas || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => marcarAtendidoMutation.mutate(item.id)}
                          >
                            Marcar Atendido
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Parámetros generales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {configuraciones.length === 0 ? (
                  <p className="text-muted-foreground">
                    No hay configuraciones definidas
                  </p>
                ) : (
                  configuraciones.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{config.clave}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.descripcion}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{config.valor || '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          Tipo: {config.tipo}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integraciones" className="space-y-4">
          {/* RCTA - Receta Digital */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary-600" />
                RCTA - Recetas Digitales
              </CardTitle>
              <CardDescription>
                Sistema de Recetas Controladas y Trazabilidad de Argentina
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                RCTA es el sistema oficial para la emisión de recetas digitales de medicamentos controlados en Argentina.
                Para crear recetas digitales, accede al portal oficial.
              </p>
              <Button
                onClick={() => window.open('https://rcta.msal.gob.ar/', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Acceder a RCTA
              </Button>
              <div className="text-xs text-gray-500 mt-2">
                * Requiere matrícula habilitada y credenciales del Ministerio de Salud
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Google Calendar
              </CardTitle>
              <CardDescription>
                Sincroniza los turnos con Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Conecta tu cuenta de Google para sincronizar automáticamente los turnos con tu calendario.
                Los pacientes recibirán recordatorios automáticos.
              </p>
              <div className="flex items-center gap-4">
                {googleStatus?.connected ? (
                  <>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                    <span className="text-sm text-green-600">Google Calendar está vinculado</span>
                  </>
                ) : googleStatus?.configured ? (
                  <>
                    <Badge variant="secondary">No conectado</Badge>
                    <Button
                      variant="outline"
                      onClick={handleConnectGoogle}
                      disabled={isConnectingGoogle}
                    >
                      {isConnectingGoogle ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Conectar Google Calendar
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">No configurado</Badge>
                    <span className="text-sm text-gray-500">
                      Configura las credenciales OAuth2 en el servidor
                    </span>
                  </>
                )}
              </div>
              {!googleStatus?.configured && (
                <div className="text-xs text-gray-500">
                  * Requiere configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en las variables de entorno
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Recordatorios WhatsApp
              </CardTitle>
              <CardDescription>
                Envía recordatorios de turnos por WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Envía recordatorios automáticos 24 horas antes de cada turno.
                Los pacientes pueden confirmar o reprogramar directamente.
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">Modo de prueba</Badge>
                <span className="text-sm text-gray-500">Los mensajes se registran pero no se envían</span>
              </div>
              <div className="text-xs text-gray-500">
                * Requiere integración con Twilio o Meta WhatsApp Business API
              </div>
            </CardContent>
          </Card>

          {/* Mercado Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Mercado Pago
              </CardTitle>
              <CardDescription>
                Acepta pagos online con Mercado Pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Permite que los pacientes paguen online con tarjeta, débito o dinero en cuenta de Mercado Pago.
                Los pagos se registran automáticamente en el sistema.
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">No configurado</Badge>
                <Button variant="outline" disabled>
                  Configurar Mercado Pago
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                * Requiere credenciales de Mercado Pago Developers
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para nuevo horario */}
      <Dialog open={horarioDialogOpen} onOpenChange={setHorarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Horario de Atención</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Día de la semana</Label>
              <Select
                value={String(nuevoHorario.dia_semana)}
                onValueChange={(v) =>
                  setNuevoHorario({ ...nuevoHorario, dia_semana: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((dia, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora inicio</Label>
                <Input
                  type="time"
                  value={nuevoHorario.hora_inicio}
                  onChange={(e) =>
                    setNuevoHorario({ ...nuevoHorario, hora_inicio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Hora fin</Label>
                <Input
                  type="time"
                  value={nuevoHorario.hora_fin}
                  onChange={(e) =>
                    setNuevoHorario({ ...nuevoHorario, hora_fin: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setHorarioDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => crearHorarioMutation.mutate(nuevoHorario)}
                disabled={crearHorarioMutation.isPending}
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
