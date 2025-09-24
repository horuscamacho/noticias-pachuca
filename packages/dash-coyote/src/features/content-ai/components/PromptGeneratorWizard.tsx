"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, Copy, Wand2, FileText, MessageSquare, Search } from "lucide-react"
import { CreateTemplateSheet } from "./CreateTemplateSheet"

interface WizardPromptResponse {
  success: boolean
  generatedPrompt: {
    promptTemplate: string
    systemPrompt: string
    reasoning: string
  }
  agentConfiguration: {
    editorialLine: string
    politicalIntensity: number
    agentPersonality: string
    canHandlePolitics: boolean
    requiresReference: boolean
  }
  templatePreview: {
    name: string
    type: string
    variables: string[]
    compatibleProviders: string[]
  }
  suggestions: string[]
}

interface PromptGeneratorState {
  step: number
  agentType: string
  specialization: string
  isSpecialized: boolean
  context: string
  politicization: number
  editorialLine: string
  enablePoliticalSlant: boolean
  examples: string[]
  generatedPrompt: string
  templateName: string
  isGenerating: boolean
  generatedResponse: WizardPromptResponse | null
}

const AGENT_TYPES = [
  {
    id: "redactor",
    name: "Redactor",
    description: "Noticias directas y objetivas",
    icon: FileText,
    subtypes: ["general", "deportes", "política", "cultura", "economía", "tecnología"]
  },
  {
    id: "columnista",
    name: "Columnista",
    description: "Análisis, opinión y crítica",
    icon: MessageSquare,
    subtypes: ["análisis", "opinión", "humor", "crítica", "social"]
  },
  {
    id: "trascendido",
    name: "Trascendido",
    description: "Rumores, exclusivas e investigación",
    icon: Search,
    subtypes: ["político", "social", "deportivo", "económico", "cultural"]
  }
]

const EDITORIAL_LINES = [
  { value: "neutral", label: "Neutral/Objetivo" },
  { value: "izquierda", label: "Línea Progresista" },
  { value: "derecha", label: "Línea Conservadora" },
  { value: "critica", label: "Crítica Constructiva" }
]

export function PromptGeneratorWizard() {
  const [state, setState] = useState<PromptGeneratorState>({
    step: 1,
    agentType: "",
    specialization: "",
    isSpecialized: false,
    context: "",
    politicization: 50,
    editorialLine: "neutral",
    enablePoliticalSlant: false,
    examples: [],
    generatedPrompt: "",
    templateName: "",
    isGenerating: false,
    generatedResponse: null
  })

  const updateState = (updates: Partial<PromptGeneratorState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (state.step < 5) {
      updateState({ step: state.step + 1 })
    }
  }

  const prevStep = () => {
    if (state.step > 1) {
      updateState({ step: state.step - 1 })
    }
  }

  const generatePrompt = async () => {
    if (!state.templateName.trim()) {
      toast.error("Por favor ingresa un nombre para el template")
      return
    }

    updateState({ isGenerating: true })

    try {
      const selectedAgent = AGENT_TYPES.find(agent => agent.id === state.agentType)
      if (!selectedAgent) {
        throw new Error("Tipo de agente no válido")
      }

      // Mapear tipos del wizard a tipos del backend
      const getTemplateType = (agentType: string): string => {
        switch (agentType) {
          case "redactor": return "noticia"
          case "columnista": return "columna"
          case "trascendido": return "trascendido"
          default: return "noticia"
        }
      }

      const wizardData = {
        agentType: selectedAgent.name,
        specialization: state.isSpecialized ? state.specialization : "General",
        editorialLine: state.enablePoliticalSlant ? state.editorialLine : "neutral",
        politicalIntensity: state.enablePoliticalSlant ? state.politicization : 0,
        agentPersonality: state.context.trim() || `${selectedAgent.name} profesional especializado en ${state.isSpecialized ? state.specialization : "contenido general"}`,
        canHandlePolitics: state.enablePoliticalSlant,
        requiresReference: state.enablePoliticalSlant && state.politicization > 70,
        templateName: state.templateName.trim(),
        templateType: getTemplateType(state.agentType),
        category: state.isSpecialized ? state.specialization : undefined,
        examples: state.examples.length > 0 ? state.examples.map((example, i) => ({
          input: `Noticia ejemplo ${i + 1}`,
          expectedOutput: example,
          description: `Ejemplo de transformación editorial ${i + 1}`
        })) : undefined,
        additionalInstructions: state.context.trim() || undefined
      }

      const response = await fetch('/api/content-ai/generate-prompt-from-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wizardData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const result: WizardPromptResponse = await response.json()

      if (!result.success) {
        throw new Error("El servidor no pudo generar el prompt")
      }

      updateState({
        generatedResponse: result,
        generatedPrompt: result.generatedPrompt.promptTemplate
      })

      toast.success("¡Prompt generado exitosamente con IA!")

    } catch (error) {
      console.error('Error generando prompt:', error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error generando prompt: ${errorMessage}`)
    } finally {
      updateState({ isGenerating: false })
    }
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(state.generatedPrompt)
    toast.success("Prompt copiado al portapapeles")
  }

  const createTemplateFromWizard = async () => {
    if (!state.generatedResponse) {
      toast.error("No hay prompt generado para crear el template")
      return
    }

    try {
      const selectedAgent = AGENT_TYPES.find(agent => agent.id === state.agentType)
      if (!selectedAgent) {
        throw new Error("Tipo de agente no válido")
      }

      const getTemplateType = (agentType: string): string => {
        switch (agentType) {
          case "redactor": return "noticia"
          case "columnista": return "columna"
          case "trascendido": return "trascendido"
          default: return "noticia"
        }
      }

      const createRequest = {
        wizardData: {
          agentType: selectedAgent.name,
          specialization: state.isSpecialized ? state.specialization : "General",
          editorialLine: state.enablePoliticalSlant ? state.editorialLine : "neutral",
          politicalIntensity: state.enablePoliticalSlant ? state.politicization : 0,
          agentPersonality: state.context.trim() || `${selectedAgent.name} profesional especializado en ${state.isSpecialized ? state.specialization : "contenido general"}`,
          canHandlePolitics: state.enablePoliticalSlant,
          requiresReference: state.enablePoliticalSlant && state.politicization > 70,
          templateName: state.templateName.trim(),
          templateType: getTemplateType(state.agentType),
          category: state.isSpecialized ? state.specialization : undefined,
          examples: state.examples.length > 0 ? state.examples.map((example, i) => ({
            input: `Noticia ejemplo ${i + 1}`,
            expectedOutput: example,
            description: `Ejemplo de transformación editorial ${i + 1}`
          })) : undefined,
          additionalInstructions: state.context.trim() || undefined
        },
        generatedPrompt: state.generatedResponse.generatedPrompt,
        userApproval: true
      }

      const response = await fetch('/api/content-ai/create-template-from-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createRequest)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      toast.success(`¡Template "${result.name}" creado exitosamente!`)

      // Reset wizard to start fresh
      setState({
        step: 1,
        agentType: "",
        specialization: "",
        isSpecialized: false,
        context: "",
        politicization: 50,
        editorialLine: "neutral",
        enablePoliticalSlant: false,
        examples: [],
        generatedPrompt: "",
        templateName: "",
        isGenerating: false,
        generatedResponse: null
      })

    } catch (error) {
      console.error('Error creating template:', error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error creando template: ${errorMessage}`)
    }
  }

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Selecciona el tipo de agente editorial</h3>
              <RadioGroup value={state.agentType} onValueChange={(value) => updateState({ agentType: value })}>
                <div className="grid gap-4">
                  {AGENT_TYPES.map((agent) => {
                    const Icon = agent.icon
                    return (
                      <div key={agent.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={agent.id} id={agent.id} />
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label htmlFor={agent.id} className="font-medium">{agent.name}</Label>
                            <p className="text-sm text-muted-foreground">{agent.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </RadioGroup>
            </div>
          </div>
        )

      case 2:
        const selectedAgent = AGENT_TYPES.find(agent => agent.id === state.agentType)
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Especialización y contexto</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="specialized"
                    checked={state.isSpecialized}
                    onCheckedChange={(checked) => updateState({ isSpecialized: !!checked })}
                  />
                  <Label htmlFor="specialized">Contenido especializado</Label>
                </div>

                {state.isSpecialized && (
                  <div>
                    <Label htmlFor="specialization">Especialidad</Label>
                    <Select value={state.specialization} onValueChange={(value) => updateState({ specialization: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedAgent?.subtypes.map((subtype) => (
                          <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="context">Contexto específico (opcional)</Label>
                  <Textarea
                    id="context"
                    placeholder="Describe el contexto específico, audiencia objetivo, o características especiales..."
                    value={state.context}
                    onChange={(e) => updateState({ context: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuración política/editorial</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="political"
                    checked={state.enablePoliticalSlant}
                    onCheckedChange={(checked) => updateState({ enablePoliticalSlant: !!checked })}
                  />
                  <Label htmlFor="political">Activar matización política</Label>
                </div>

                {state.enablePoliticalSlant && (
                  <>
                    <div>
                      <Label>Línea editorial</Label>
                      <Select value={state.editorialLine} onValueChange={(value) => updateState({ editorialLine: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDITORIAL_LINES.map((line) => (
                            <SelectItem key={line.value} value={line.value}>{line.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Intensidad política: {state.politicization}%</Label>
                      <Slider
                        value={[state.politicization]}
                        onValueChange={([value]) => updateState({ politicization: value })}
                        max={100}
                        step={10}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Sutil</span>
                        <span>Moderado</span>
                        <span>Marcado</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuración del template</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Nombre del template *</Label>
                  <Input
                    id="templateName"
                    placeholder="Ej: Reportero Deportivo Objetivo"
                    value={state.templateName}
                    onChange={(e) => updateState({ templateName: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nombre único que identifique a este agente editorial
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Ejemplos de referencia (opcional)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Proporciona 2-3 ejemplos de contenido para que el agente entienda el estilo deseado
                  </p>
                  <Textarea
                    placeholder="Pega aquí ejemplos de contenido que representen el estilo que buscas..."
                    rows={6}
                    value={state.examples.join('\n\n---\n\n')}
                  onChange={(e) => updateState({ examples: e.target.value.split('\n\n---\n\n').filter(ex => ex.trim()) })}
                />

                  {state.examples.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Ejemplos detectados: {state.examples.length}</p>
                      <div className="flex gap-2 mt-1">
                        {state.examples.map((_, i) => (
                          <Badge key={i} variant="secondary">Ejemplo {i + 1}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {state.isGenerating ? "Generando prompt con IA..." : "Prompt generado"}
              </h3>

              {state.isGenerating ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Usando IA para crear tu agente editorial personalizado...</p>
                  <p className="text-xs text-muted-foreground mt-2">Esto puede tomar unos segundos</p>
                </div>
              ) : !state.generatedPrompt ? (
                <div className="text-center py-8">
                  <Button
                    onClick={generatePrompt}
                    className="gap-2"
                    disabled={!state.templateName.trim()}
                  >
                    <Wand2 className="h-4 w-4" />
                    Generar Prompt con IA
                  </Button>
                  {!state.templateName.trim() && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Ingresa un nombre para el template en el paso anterior
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Preview del agent configuration */}
                  {state.generatedResponse && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">Configuración del Agente</h4>
                        <div className="text-xs text-muted-foreground space-y-1 mt-2">
                          <p><strong>Nombre:</strong> {state.templateName}</p>
                          <p><strong>Tipo:</strong> {state.agentType}</p>
                          <p><strong>Línea Editorial:</strong> {state.generatedResponse.agentConfiguration.editorialLine}</p>
                          <p><strong>Intensidad Política:</strong> {state.generatedResponse.agentConfiguration.politicalIntensity}%</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Variables Disponibles</h4>
                        <div className="flex gap-1 mt-2">
                          {state.generatedResponse.templatePreview.variables.map(variable => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sugerencias de IA */}
                  {state.generatedResponse?.suggestions && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm text-blue-900 mb-2">💡 Sugerencias</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        {state.generatedResponse.suggestions.map((suggestion, i) => (
                          <li key={i}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prompt generado */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Prompt Template</Label>
                      <Button onClick={copyPrompt} variant="outline" size="sm" className="gap-2">
                        <Copy className="h-3 w-3" />
                        Copiar
                      </Button>
                    </div>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{state.generatedPrompt}</pre>
                    </div>
                  </div>

                  {/* System Prompt */}
                  {state.generatedResponse?.generatedPrompt.systemPrompt && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">System Prompt</Label>
                      <div className="bg-muted p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{state.generatedResponse.generatedPrompt.systemPrompt}</pre>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={createTemplateFromWizard}
                      className="gap-2"
                      disabled={!state.generatedResponse}
                    >
                      <FileText className="h-4 w-4" />
                      Crear Template Final
                    </Button>
                    <CreateTemplateSheet
                      trigger={
                        <Button variant="outline" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Crear Template Manual
                        </Button>
                      }
                      importedPrompt={state.generatedPrompt}
                      onSave={(template) => {
                        console.log("Template creado:", template)
                        toast.success("Template creado exitosamente")
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Generador de Prompts Editoriales
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step === state.step ? 'bg-primary' :
                  step < state.step ? 'bg-primary/60' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            Paso {state.step} de 5
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {renderStep()}

        <Separator className="my-6" />

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={state.step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            onClick={nextStep}
            disabled={state.step === 5 || (state.step === 1 && !state.agentType)}
            className="gap-2"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}