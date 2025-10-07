import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBrain,
  IconTrendingUp,
} from '@tabler/icons-react';
import { toast } from 'sonner';

import {
  useContentAgents,
  useCreateContentAgent,
  useUpdateContentAgent,
  useDeleteContentAgent,
  type ContentAgent,
  type CreateContentAgentRequest,
} from '../../hooks';

const agentFormSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  agentType: z.enum(['reportero', 'columnista', 'trascendido', 'seo-specialist']),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  personality: z.string().min(50, 'La personalidad debe tener al menos 50 caracteres'),
  specializations: z.string().min(1, 'Agrega al menos una especialización'),
  editorialLean: z.enum(['conservative', 'progressive', 'neutral', 'humor', 'critical', 'analytical']),
  writingStyle: z.object({
    tone: z.enum(['formal', 'informal', 'humor', 'academic', 'conversational']),
    vocabulary: z.enum(['simple', 'intermediate', 'advanced', 'technical']),
    length: z.enum(['short', 'medium', 'long', 'variable']),
    structure: z.enum(['linear', 'narrative', 'analytical', 'opinion']),
    audience: z.enum(['general', 'specialized', 'academic', 'youth', 'senior']),
  }),
  isActive: z.boolean(),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

const AGENT_TYPE_LABELS: Record<ContentAgent['agentType'], string> = {
  reportero: 'Reportero',
  columnista: 'Columnista',
  trascendido: 'Trascendido',
  'seo-specialist': 'SEO Specialist',
};

const EDITORIAL_LEAN_LABELS: Record<ContentAgent['editorialLean'], string> = {
  conservative: 'Conservadora',
  progressive: 'Progresista',
  neutral: 'Neutral',
  humor: 'Humorística',
  critical: 'Crítica',
  analytical: 'Analítica',
};

const SPECIALIZATIONS_OPTIONS = [
  'política',
  'deportes',
  'social',
  'economía',
  'tecnología',
  'cultura',
  'salud',
  'educación',
  'seguridad',
  'internacional',
];

export function PerfilesEditorialesTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<ContentAgent | null>(null);

  const { data: agents, isLoading } = useContentAgents();
  const createAgent = useCreateContentAgent();
  const updateAgent = useUpdateContentAgent();
  const deleteAgent = useDeleteContentAgent();

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      agentType: 'reportero',
      description: '',
      personality: '',
      specializations: '',
      editorialLean: 'neutral',
      writingStyle: {
        tone: 'formal',
        vocabulary: 'intermediate',
        length: 'medium',
        structure: 'linear',
        audience: 'general',
      },
      isActive: true,
    },
  });

  const handleOpenDialog = (agent?: ContentAgent) => {
    if (agent) {
      setEditingAgent(agent);
      form.reset({
        name: agent.name,
        agentType: agent.agentType,
        description: agent.description,
        personality: agent.personality,
        specializations: agent.specializations.join(', '),
        editorialLean: agent.editorialLean,
        writingStyle: agent.writingStyle,
        isActive: agent.isActive,
      });
    } else {
      setEditingAgent(null);
      form.reset({
        name: '',
        agentType: 'reportero',
        description: '',
        personality: '',
        specializations: '',
        editorialLean: 'neutral',
        writingStyle: {
          tone: 'formal',
          vocabulary: 'intermediate',
          length: 'medium',
          structure: 'linear',
          audience: 'general',
        },
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (values: AgentFormValues) => {
    const specializationsArray = values.specializations
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const agentData: CreateContentAgentRequest = {
      name: values.name,
      agentType: values.agentType,
      description: values.description,
      personality: values.personality,
      specializations: specializationsArray,
      editorialLean: values.editorialLean,
      writingStyle: values.writingStyle,
      isActive: values.isActive,
    };

    if (editingAgent) {
      updateAgent.mutate(
        { id: editingAgent.id, data: agentData },
        {
          onSuccess: () => {
            toast.success(`El agente "${values.name}" ha sido actualizado exitosamente.`);
            setIsDialogOpen(false);
            setEditingAgent(null);
            form.reset();
          },
          onError: () => {
            toast.error('No se pudo actualizar el agente. Intenta de nuevo.');
          },
        }
      );
    } else {
      createAgent.mutate(agentData, {
        onSuccess: () => {
          toast.success(`El agente "${values.name}" ha sido creado exitosamente.`);
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast.error('No se pudo crear el agente. Intenta de nuevo.');
        },
      });
    }
  };

  const handleDelete = (agent: ContentAgent) => {
    if (!confirm(`¿Estás seguro de eliminar el agente "${agent.name}"?`)) return;

    deleteAgent.mutate(agent.id, {
      onSuccess: () => {
        toast.success(`El agente "${agent.name}" ha sido eliminado.`);
      },
      onError: () => {
        toast.error('No se pudo eliminar el agente. Intenta de nuevo.');
      },
    });
  };

  const getAgentTypeBadgeVariant = (type: ContentAgent['agentType']) => {
    const variants: Record<ContentAgent['agentType'], string> = {
      reportero: 'bg-blue-500 text-white',
      columnista: 'bg-purple-500 text-white',
      trascendido: 'bg-orange-500 text-white',
      'seo-specialist': 'bg-green-500 text-white',
    };
    return variants[type] || 'default';
  };

  const getEditorialLeanBadgeVariant = (lean: ContentAgent['editorialLean']) => {
    const variants: Record<ContentAgent['editorialLean'], string> = {
      neutral: 'bg-gray-500 text-white',
      critical: 'bg-red-500 text-white',
      humor: 'bg-yellow-500 text-black',
      analytical: 'bg-blue-600 text-white',
      conservative: 'bg-indigo-600 text-white',
      progressive: 'bg-teal-600 text-white',
    };
    return variants[lean] || 'default';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Cargando perfiles editoriales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Perfiles Editoriales</h2>
          <p className="text-muted-foreground">
            Gestiona los agentes de contenido con diferentes estilos y personalidades
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <IconPlus className="h-4 w-4 mr-2" />
              Crear Nuevo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAgent ? 'Editar Agente' : 'Crear Nuevo Agente'}
              </DialogTitle>
              <DialogDescription>
                Define la personalidad, estilo editorial y especialización del agente
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Agente</FormLabel>
                        <FormControl>
                          <Input placeholder="ej. Juan Pérez - Reportero Político" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Agente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="reportero">Reportero</SelectItem>
                            <SelectItem value="columnista">Columnista</SelectItem>
                            <SelectItem value="trascendido">Trascendido</SelectItem>
                            <SelectItem value="seo-specialist">SEO Specialist</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe brevemente el rol y función del agente"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personalidad</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Define la personalidad y estilo del agente. Ej: Periodista veterano con 20 años de experiencia, estilo directo y objetivo, con capacidad para análisis profundo..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Mínimo 50 caracteres. Sé específico sobre el tono, enfoque y características.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="specializations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especializaciones</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="política, deportes, social (separadas por comas)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Opciones: {SPECIALIZATIONS_OPTIONS.join(', ')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="editorialLean"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Línea Editorial</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar línea" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="neutral">Neutral</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                            <SelectItem value="humor">Humorística</SelectItem>
                            <SelectItem value="analytical">Analítica</SelectItem>
                            <SelectItem value="conservative">Conservadora</SelectItem>
                            <SelectItem value="progressive">Progresista</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estilo de Escritura</CardTitle>
                    <CardDescription>
                      Define cómo el agente estructura y redacta el contenido
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="writingStyle.tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tono</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="informal">Informal</SelectItem>
                                <SelectItem value="humor">Humorístico</SelectItem>
                                <SelectItem value="academic">Académico</SelectItem>
                                <SelectItem value="conversational">Conversacional</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="writingStyle.vocabulary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vocabulario</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="simple">Simple</SelectItem>
                                <SelectItem value="intermediate">Intermedio</SelectItem>
                                <SelectItem value="advanced">Avanzado</SelectItem>
                                <SelectItem value="technical">Técnico</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="writingStyle.length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitud</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="short">Corto</SelectItem>
                                <SelectItem value="medium">Medio</SelectItem>
                                <SelectItem value="long">Largo</SelectItem>
                                <SelectItem value="variable">Variable</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="writingStyle.structure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estructura</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="linear">Lineal</SelectItem>
                                <SelectItem value="narrative">Narrativa</SelectItem>
                                <SelectItem value="analytical">Analítica</SelectItem>
                                <SelectItem value="opinion">Opinión</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="writingStyle.audience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audiencia</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="specialized">Especializada</SelectItem>
                                <SelectItem value="academic">Académica</SelectItem>
                                <SelectItem value="youth">Jóvenes</SelectItem>
                                <SelectItem value="senior">Adultos mayores</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Estado del Agente</FormLabel>
                        <FormDescription>
                          {field.value ? 'Agente activo y disponible' : 'Agente desactivado'}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingAgent(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAgent.isPending || updateAgent.isPending}
                  >
                    {createAgent.isPending || updateAgent.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Guardando...</span>
                      </div>
                    ) : editingAgent ? (
                      'Actualizar Agente'
                    ) : (
                      'Crear Agente'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconBrain className="h-5 w-5" />
            <span>Agentes Configurados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents && agents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nombre</TableHead>
                    <TableHead className="min-w-[120px]">Tipo</TableHead>
                    <TableHead className="min-w-[120px]">Línea Editorial</TableHead>
                    <TableHead className="min-w-[150px]">Especializaciones</TableHead>
                    <TableHead className="min-w-[180px]">Métricas</TableHead>
                    <TableHead className="min-w-[100px]">Estado</TableHead>
                    <TableHead className="min-w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="max-w-[250px]">
                        <div>
                          <div className="font-medium truncate">{agent.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {agent.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAgentTypeBadgeVariant(agent.agentType)}>
                          {AGENT_TYPE_LABELS[agent.agentType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEditorialLeanBadgeVariant(agent.editorialLean)}>
                          {EDITORIAL_LEAN_LABELS[agent.editorialLean]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {agent.specializations.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {agent.specializations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.specializations.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.performanceMetrics ? (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center space-x-1">
                              <IconTrendingUp className="h-3 w-3 text-blue-500" />
                              <span className="whitespace-nowrap">{agent.performanceMetrics.totalArticles} artículos</span>
                            </div>
                            <div className="text-muted-foreground text-xs whitespace-nowrap">
                              Calidad: {agent.performanceMetrics.averageQuality.toFixed(1)} |
                              Éxito: {(agent.performanceMetrics.successRate * 100).toFixed(0)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin métricas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                          {agent.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(agent)}
                            title="Editar agente"
                          >
                            <IconEdit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(agent)}
                            disabled={deleteAgent.isPending}
                            title="Eliminar agente"
                          >
                            <IconTrash className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <IconBrain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay agentes configurados</h3>
              <p className="text-muted-foreground">
                Crea tu primer agente editorial para comenzar a generar contenido
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
