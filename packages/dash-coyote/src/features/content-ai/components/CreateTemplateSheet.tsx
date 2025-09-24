"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RichTextEditor } from "./RichTextEditor"
import {
  Plus,
  Wand2,
  Save,
  TestTube,
  Eye,
  FileText,
  MessageSquare,
  Search,
  X,
  Sparkles
} from "lucide-react"

interface CreateTemplateSheetProps {
  trigger?: React.ReactNode
  importedPrompt?: string
  onSave?: (template: TemplateData) => void
  onTest?: (template: TemplateData) => void
}

interface TemplateData {
  name: string
  type: string
  agentPersona: string
  promptTemplate: string
  systemPrompt: string
  outputFormat: {
    title: boolean
    content: boolean
    keywords: boolean
    tags: boolean
    category: boolean
    summary: boolean
  }
  variables: string[]
  isActive: boolean
}

const AGENT_TYPES = [
  { value: "noticia", label: "Noticia", icon: FileText, description: "Noticias directas y objetivas" },
  { value: "columna", label: "Columna", icon: MessageSquare, description: "Análisis, opinión y crítica" },
  { value: "trascendido", label: "Trascendido", icon: Search, description: "Rumores, exclusivas e investigación" }
]

const AGENT_PERSONAS = {
  noticia: [
    "Reportero Objetivo",
    "Reportero Local",
    "Reportero Político Izquierda",
    "Reportero Político Derecha",
    "Reportero Deportivo",
    "Reportero Cultural"
  ],
  columna: [
    "Columnista Humor",
    "Columnista Análisis",
    "Columnista Crítico",
    "Columnista Popular",
    "Columnista Político",
    "Columnista Social"
  ],
  trascendido: [
    "Trascendido Político",
    "Trascendido Social",
    "Trascendido Deportivo",
    "Trascendido Económico",
    "Trascendido Cultural"
  ]
}

const DEFAULT_SYSTEM_PROMPT = `Eres un agente editorial especializado. Tu objetivo es transformar contenido original en una nueva versión que mantenga la información esencial pero con tu estilo y perspectiva únicos.

Instrucciones generales:
- Mantén la veracidad de la información
- Adapta el tono según tu personalidad editorial
- Asegúrate de que el contenido sea relevante y de calidad
- Utiliza un lenguaje claro y accesible
- Considera el contexto local mexicano cuando sea apropiado

Formato de respuesta: Devuelve un objeto JSON con los campos solicitados.`

export function CreateTemplateSheet({
  trigger,
  importedPrompt = "",
  onSave,
  onTest
}: CreateTemplateSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [template, setTemplate] = useState<TemplateData>({
    name: "",
    type: "",
    agentPersona: "",
    promptTemplate: importedPrompt,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    outputFormat: {
      title: true,
      content: true,
      keywords: true,
      tags: true,
      category: true,
      summary: true
    },
    variables: [],
    isActive: true
  })

  const [isTestMode, setIsTestMode] = useState(false)
  const [testContent, setTestContent] = useState({
    title: "Ejemplo: Nueva política económica anunciada",
    content: "El gobierno federal anunció hoy una serie de medidas económicas destinadas a combatir la inflación y estimular el crecimiento..."
  })

  // Auto-detect variables from prompt template
  const detectVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g)
    return matches ? [...new Set(matches)] : []
  }

  const updateTemplate = (updates: Partial<TemplateData>) => {
    setTemplate(prev => {
      const updated = { ...prev, ...updates }
      // Auto-detect variables when prompt changes
      if (updates.promptTemplate !== undefined) {
        updated.variables = detectVariables(updates.promptTemplate)
      }
      return updated
    })
  }

  const handleSave = () => {
    onSave?.(template)
    setIsOpen(false)
  }

  const handleTest = () => {
    onTest?.(template)
    setIsTestMode(true)
  }

  const getAvailablePersonas = () => {
    return template.type ? AGENT_PERSONAS[template.type as keyof typeof AGENT_PERSONAS] || [] : []
  }

  const selectedAgentType = AGENT_TYPES.find(type => type.value === template.type)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Template
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="w-full max-w-6xl sm:max-w-[90vw] p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {importedPrompt ? "Crear Template desde Wizard" : "Crear Nuevo Template"}
          </SheetTitle>
          <SheetDescription>
            {importedPrompt
              ? "Personaliza y guarda el prompt generado como template reutilizable"
              : "Crea un template personalizado para generación de contenido editorial"
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-240px)]">
            <div className="space-y-6 py-6 pr-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Nombre del Template</Label>
                  <Input
                    id="template-name"
                    value={template.name}
                    onChange={(e) => updateTemplate({ name: e.target.value })}
                    placeholder="Ej: Reportero Objetivo Deportes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-type">Tipo de Contenido</Label>
                  <Select value={template.type} onValueChange={(value) => updateTemplate({ type: value, agentPersona: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {template.type && (
                <div className="space-y-2">
                  <Label htmlFor="agent-persona">Personalidad del Agente</Label>
                  <Select value={template.agentPersona} onValueChange={(value) => updateTemplate({ agentPersona: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una personalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePersonas().map((persona) => (
                        <SelectItem key={persona} value={persona}>
                          {persona}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Prompt Template */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Template del Prompt</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={!template.promptTemplate.trim()}
                    className="gap-1"
                  >
                    <TestTube className="h-3 w-3" />
                    Test
                  </Button>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isTestMode}
                      onCheckedChange={setIsTestMode}
                    />
                    <Label className="text-sm">Modo Test</Label>
                  </div>
                </div>
              </div>

              <RichTextEditor
                content={template.promptTemplate}
                onChange={(content) => updateTemplate({ promptTemplate: content })}
                placeholder="Escribe tu prompt usando variables como {{title}}, {{content}}, etc."
                showPreview={!isTestMode}
              />

              {/* Variables Detection */}
              {template.variables.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Variables detectadas:</Label>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="font-mono text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* System Prompt */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prompt del Sistema</h3>
              <Textarea
                value={template.systemPrompt}
                onChange={(e) => updateTemplate({ systemPrompt: e.target.value })}
                placeholder="Instrucciones específicas para el agente..."
                rows={6}
              />
            </div>

            <Separator />

            {/* Output Format */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Formato de Salida</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(template.outputFormat).map(([field, enabled]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        updateTemplate({
                          outputFormat: { ...template.outputFormat, [field]: checked }
                        })
                      }
                    />
                    <Label className="capitalize">{field}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Mode Content */}
            {isTestMode && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contenido de Prueba</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-title">Título de prueba</Label>
                      <Input
                        id="test-title"
                        value={testContent.title}
                        onChange={(e) => setTestContent(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test-content">Contenido de prueba</Label>
                      <Textarea
                        id="test-content"
                        value={testContent.content}
                        onChange={(e) => setTestContent(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Previsualizar Resultado
                    </Button>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Template Status */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={template.isActive}
                onCheckedChange={(checked) => updateTemplate({ isActive: checked })}
              />
              <Label>Template activo</Label>
            </div>
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="border-t pt-6">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {template.variables.length} variables detectadas
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!template.name.trim() || !template.type || !template.promptTemplate.trim()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Template
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}