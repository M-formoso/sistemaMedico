import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, TestTube, ClipboardList, FileCheck, Image } from 'lucide-react'
import { EvolucionesTab } from './EvolucionesTab'
import { EstudiosTab } from './EstudiosTab'
import { ResultadosTab } from './ResultadosTab'
import { ConsentimientosTab } from './ConsentimientosTab'
import { FotosTab } from './FotosTab'

interface HistoriaClinicaTabsProps {
  pacienteId: number
}

export function HistoriaClinicaTabs({ pacienteId }: HistoriaClinicaTabsProps) {
  return (
    <Tabs defaultValue="evoluciones" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="evoluciones" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Evoluciones</span>
        </TabsTrigger>
        <TabsTrigger value="estudios" className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          <span className="hidden sm:inline">Estudios</span>
        </TabsTrigger>
        <TabsTrigger value="resultados" className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          <span className="hidden sm:inline">Resultados</span>
        </TabsTrigger>
        <TabsTrigger value="consentimientos" className="flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Consentim.</span>
        </TabsTrigger>
        <TabsTrigger value="fotos" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          <span className="hidden sm:inline">Fotos</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="evoluciones">
          <EvolucionesTab pacienteId={pacienteId} />
        </TabsContent>

        <TabsContent value="estudios">
          <EstudiosTab pacienteId={pacienteId} />
        </TabsContent>

        <TabsContent value="resultados">
          <ResultadosTab pacienteId={pacienteId} />
        </TabsContent>

        <TabsContent value="consentimientos">
          <ConsentimientosTab pacienteId={pacienteId} />
        </TabsContent>

        <TabsContent value="fotos">
          <FotosTab pacienteId={pacienteId} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
