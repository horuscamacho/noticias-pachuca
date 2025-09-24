/**
 * ➕ CreateConfigSheet Component
 * Sheet form for creating new extraction configurations
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  IconX,
  IconPlus,
  IconSettings,
  IconCode,
  IconWorld,
  IconTestPipe,
  IconRefresh,
} from '@tabler/icons-react';
import { toast } from 'sonner';

import { useCreateNoticiasConfig, useUpdateNoticiasConfig, useExternalUrls } from '../hooks';
import type { CreateConfigForm, ExternalUrl, NoticiasConfig } from '../types/noticias.types';

// Validation schema
const configSchema = z.object({
  domain: z.string()
    .min(1, 'Dominio es requerido')
    .transform(val => val.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')),
  name: z.string().min(1, 'Nombre es requerido'),
  isActive: z.boolean().default(true),
  selectors: z.object({
    title: z.string().min(1, 'Selector de título es requerido'),
    content: z.string().min(1, 'Selector de contenido es requerido'),
    images: z.array(z.string()).optional(),
    publishedAt: z.string().optional(),
    author: z.string().optional(),
    categories: z.array(z.string()).optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  extractionSettings: z.object({
    useJavaScript: z.boolean().optional(),
    waitTime: z.number().min(0).max(30000).optional(),
    rateLimit: z.number().min(1).max(300).optional(),
    timeout: z.number().min(5000).max(120000).optional(),
    retryAttempts: z.number().min(0).max(10).optional(),
    respectRobots: z.boolean().optional(),
  }).optional(),
  customHeaders: z.record(z.string()).optional(),
  notes: z.string().optional(),
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingConfig?: NoticiasConfig | null;
  isEditing?: boolean;
}

export function CreateConfigSheet({ isOpen, onClose, editingConfig, isEditing = false }: Props) {
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedUrl, setSelectedUrl] = useState<ExternalUrl | null>(null);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [selectorInputs, setSelectorInputs] = useState({
    images: [''],
    categories: [''],
    tags: [''],
  });

  const createMutation = useCreateNoticiasConfig();
  const updateMutation = useUpdateNoticiasConfig();

  console.log('🔧 Mutations status:', {
    createPending: createMutation.isPending,
    updatePending: updateMutation.isPending,
    isEditing,
    editingConfig: !!editingConfig,
  });

  // Fetch unconfigured URLs
  const { data: urlsData, isLoading: isLoadingUrls, error: urlsError } = useExternalUrls({
    hasConfig: false,
    limit: 100, // Get all unconfigured URLs
  });

  // Debug logging
  console.log('CreateConfigSheet Debug:', {
    urlsData,
    isLoadingUrls,
    urlsError,
    hasData: !!urlsData,
    dataType: typeof urlsData,
    isArray: Array.isArray(urlsData),
    dataKeys: urlsData ? Object.keys(urlsData) : null,
  });

  // Group URLs by domain to get unique domains
  const unconfiguredDomains = React.useMemo(() => {
    // Handle both formats: direct array or { data: array }
    const urls = Array.isArray(urlsData) ? urlsData : urlsData?.data;

    console.log('Processing URLs:', { urls, urlsLength: urls?.length });

    if (!urls || !Array.isArray(urls)) return [];

    const domainsMap = new Map<string, ExternalUrl>();

    urls.forEach((url: ExternalUrl) => {
      if (!domainsMap.has(url.domain)) {
        domainsMap.set(url.domain, url);
      }
    });

    const domains = Array.from(domainsMap.values());
    console.log('Unconfigured domains:', domains);

    return domains;
  }, [urlsData]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<CreateConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: editingConfig && isEditing ? {
      domain: editingConfig.domain,
      name: editingConfig.name,
      isActive: editingConfig.isActive,
      selectors: {
        title: editingConfig.selectors?.title || '',
        content: editingConfig.selectors?.content || '',
        images: editingConfig.selectors?.images || [],
        publishedAt: editingConfig.selectors?.publishedAt || '',
        author: editingConfig.selectors?.author || '',
        categories: editingConfig.selectors?.categories || [],
        excerpt: editingConfig.selectors?.excerpt || '',
        tags: editingConfig.selectors?.tags || [],
      },
      extractionSettings: {
        useJavaScript: editingConfig.extractionSettings?.useJavaScript ?? false,
        waitTime: editingConfig.extractionSettings?.waitTime ?? 1000,
        rateLimit: editingConfig.extractionSettings?.rateLimit ?? 30,
        timeout: editingConfig.extractionSettings?.timeout ?? 30000,
        retryAttempts: editingConfig.extractionSettings?.retryAttempts ?? 3,
        respectRobots: editingConfig.extractionSettings?.respectRobots ?? true,
      },
      customHeaders: editingConfig.customHeaders || {},
      notes: editingConfig.notes || '',
    } : {
      isActive: true,
      selectors: {
        title: '',
        content: '',
        images: [],
        categories: [],
        tags: [],
      },
      extractionSettings: {
        useJavaScript: false,
        waitTime: 1000,
        rateLimit: 30,
        timeout: 30000,
        retryAttempts: 3,
        respectRobots: true,
      },
      customHeaders: {},
    },
  });

  const domain = watch('domain');

  // Reset form when editing config changes
  useEffect(() => {
    if (editingConfig && isEditing) {
      reset({
        domain: editingConfig.domain,
        name: editingConfig.name,
        isActive: editingConfig.isActive,
        selectors: {
          title: editingConfig.selectors?.title || '',
          content: editingConfig.selectors?.content || '',
          images: editingConfig.selectors?.images || [],
          publishedAt: editingConfig.selectors?.publishedAt || '',
          author: editingConfig.selectors?.author || '',
          categories: editingConfig.selectors?.categories || [],
          excerpt: editingConfig.selectors?.excerpt || '',
          tags: editingConfig.selectors?.tags || [],
        },
        extractionSettings: {
          useJavaScript: editingConfig.extractionSettings?.useJavaScript ?? false,
          waitTime: editingConfig.extractionSettings?.waitTime ?? 1000,
          rateLimit: editingConfig.extractionSettings?.rateLimit ?? 30,
          timeout: editingConfig.extractionSettings?.timeout ?? 30000,
          retryAttempts: editingConfig.extractionSettings?.retryAttempts ?? 3,
          respectRobots: editingConfig.extractionSettings?.respectRobots ?? true,
        },
        customHeaders: editingConfig.customHeaders || {},
        notes: editingConfig.notes || '',
      });

      // Also update selector inputs for dynamic fields
      setSelectorInputs({
        images: editingConfig.selectors?.images?.length ? editingConfig.selectors.images : [''],
        categories: editingConfig.selectors?.categories?.length ? editingConfig.selectors.categories : [''],
        tags: editingConfig.selectors?.tags?.length ? editingConfig.selectors.tags : [''],
      });

      // Set manual entry mode since we're editing existing config
      setUseManualEntry(true);
      setSelectedUrl(null);
    } else if (!isEditing) {
      // Reset to default values when not editing
      reset({
        isActive: true,
        selectors: {
          title: '',
          content: '',
          images: [],
          categories: [],
          tags: [],
        },
        extractionSettings: {
          useJavaScript: false,
          waitTime: 1000,
          rateLimit: 30,
          timeout: 30000,
          retryAttempts: 3,
          respectRobots: true,
        },
        customHeaders: {},
      });

      setSelectorInputs({ images: [''], categories: [''], tags: [''] });
      setUseManualEntry(false);
      setSelectedUrl(null);
    }
  }, [editingConfig, isEditing, reset]);

  const handleClose = () => {
    reset();
    setSelectorInputs({ images: [''], categories: [''], tags: [''] });
    setSelectedUrl(null);
    setUseManualEntry(false);
    setActiveTab('basic');
    onClose();
  };

  const handleUrlSelection = (url: ExternalUrl) => {
    setSelectedUrl(url);
    setValue('domain', url.domain);

    // Try to derive name from domain or use placeholder
    const domainName = url.domain
      .replace(/\.(com|net|org|mx|es|ar|co|cl|pe|ec|ve|py|uy|bo|gt|sv|hn|ni|cr|pa|do|cu|pr)$/, '')
      .replace(/^www\./, '')
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    setValue('name', `${domainName} Noticias`);
  };

  const toggleManualEntry = () => {
    setUseManualEntry(!useManualEntry);
    if (!useManualEntry) {
      // Switching to manual, clear selection
      setSelectedUrl(null);
      setValue('domain', '');
      setValue('name', '');
    }
  };

  const onSubmit = async (data: CreateConfigForm) => {
    console.log('🔥 onSubmit called', { isEditing, editingConfig, data });

    try {
      // Filter out empty arrays and strings
      const cleanedData = {
        ...data,
        selectors: {
          ...data.selectors,
          images: data.selectors.images?.filter(s => s.trim()) || undefined,
          categories: data.selectors.categories?.filter(s => s.trim()) || undefined,
          tags: data.selectors.tags?.filter(s => s.trim()) || undefined,
        },
      };

      console.log('🧹 Cleaned data:', cleanedData);

      if (isEditing && editingConfig) {
        console.log('🔄 Updating configuration...', { id: editingConfig._id, data: cleanedData });

        // For updates, remove the domain field since it cannot be changed
        const { domain, ...updateData } = cleanedData;
        console.log('🧹 Cleaned update data (without domain):', updateData);

        // Update existing configuration
        const result = await updateMutation.mutateAsync({
          id: editingConfig._id,
          data: updateData,
        });
        console.log('✅ Update successful:', result);
        toast.success(`Configuración actualizada para ${data.domain}`);
      } else {
        console.log('➕ Creating new configuration...', cleanedData);
        // Create new configuration
        const result = await createMutation.mutateAsync(cleanedData);
        console.log('✅ Create successful:', result);
        toast.success(`Configuración creada para ${data.domain}`);
      }

      handleClose();
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast.error(isEditing ? 'Error al actualizar la configuración' : 'Error al crear la configuración');
    }
  };

  const addSelectorInput = (field: 'images' | 'categories' | 'tags') => {
    setSelectorInputs(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeSelectorInput = (field: 'images' | 'categories' | 'tags', index: number) => {
    setSelectorInputs(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));

    // Update form values
    const currentValues = watch(`selectors.${field}`) || [];
    setValue(`selectors.${field}`, currentValues.filter((_, i) => i !== index));
  };

  const updateSelectorInput = (field: 'images' | 'categories' | 'tags', index: number, value: string) => {
    const currentValues = watch(`selectors.${field}`) || [];
    const newValues = [...currentValues];
    newValues[index] = value;
    setValue(`selectors.${field}`, newValues);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-4xl flex flex-col">
        {/* Fixed Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center space-x-2">
            <IconSettings className="h-5 w-5" />
            <span>{isEditing ? 'Editar Configuración de Extracción' : 'Nueva Configuración de Extracción'}</span>
          </SheetTitle>
          <SheetDescription>
            {isEditing ? 'Modifica los CSS selectors y configuración' : 'Configura CSS selectors para extraer contenido de un dominio específico'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            console.log('📋 Form submit triggered!', { isValid, errors });
            handleSubmit(onSubmit)(e);
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Fixed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 py-4 border-b flex-shrink-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center space-x-1">
                  <IconWorld className="h-4 w-4" />
                  <span>Básico</span>
                </TabsTrigger>
                <TabsTrigger value="selectors" className="flex items-center space-x-1">
                  <IconCode className="h-4 w-4" />
                  <span>Selectores</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-1">
                  <IconSettings className="h-4 w-4" />
                  <span>Configuración</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center space-x-1">
                  <IconTestPipe className="h-4 w-4" />
                  <span>Avanzado</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">

              {/* Basic Info */}
              <TabsContent value="basic" className="space-y-4 m-0 px-6 py-4">
                <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Datos principales del sitio web y la configuración
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* URL Selection Mode */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Fuente de configuración</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleManualEntry}
                      >
                        {useManualEntry ? 'Usar URLs detectadas' : 'Entrada manual'}
                      </Button>
                    </div>

                    {!useManualEntry ? (
                      <div className="space-y-3">
                        <Label>URLs detectadas sin configurar</Label>

                        {isLoadingUrls ? (
                          <div className="flex items-center justify-center p-8 border rounded-lg">
                            <IconRefresh className="h-6 w-6 animate-spin mr-2" />
                            <span>Cargando URLs detectadas...</span>
                          </div>
                        ) : urlsError ? (
                          <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                            <p className="text-red-600 text-sm">Error al cargar URLs: {urlsError.message}</p>
                          </div>
                        ) : unconfiguredDomains.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {unconfiguredDomains.length} dominios sin configurar encontrados
                            </p>
                            <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                              {unconfiguredDomains.map((url) => (
                                <div
                                  key={url.domain}
                                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedUrl?.domain === url.domain
                                      ? 'border-primary bg-primary/5'
                                      : 'border-muted hover:border-primary/50'
                                  }`}
                                  onClick={() => handleUrlSelection(url)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <div className="font-medium text-sm">{url.domain}</div>
                                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                                        {url.url}
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Página: {url.pageId || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                            <p className="text-yellow-700 text-sm">
                              No se encontraron URLs sin configurar.
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={toggleManualEntry}
                              >
                                Usar entrada manual
                              </Button>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {(useManualEntry || unconfiguredDomains.length === 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="domain">Dominio *</Label>
                          <Input
                            id="domain"
                            placeholder="ejemplo.com"
                            {...register('domain')}
                          />
                          {errors.domain && (
                            <p className="text-sm text-red-500">{errors.domain.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre del Medio *</Label>
                          <Input
                            id="name"
                            placeholder="Ejemplo Noticias"
                            {...register('name')}
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedUrl && !useManualEntry && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="domain">Dominio * (Auto-completado)</Label>
                          <Input
                            id="domain"
                            {...register('domain')}
                            disabled
                            className="bg-muted"
                          />
                          {errors.domain && (
                            <p className="text-sm text-red-500">{errors.domain.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre del Medio *</Label>
                          <Input
                            id="name"
                            placeholder="Ejemplo Noticias"
                            {...register('name')}
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="isActive">Configuración activa</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      placeholder="Información adicional sobre esta configuración..."
                      {...register('notes')}
                    />
                  </div>

                  {domain && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Vista previa:</strong> https://{domain}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

              {/* CSS Selectors */}
              <TabsContent value="selectors" className="space-y-4 m-0 px-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Selectores CSS</CardTitle>
                  <CardDescription>
                    Define cómo extraer cada elemento de la página web
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Required selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título * <Badge variant="destructive">Requerido</Badge></Label>
                      <Input
                        id="title"
                        placeholder="h1.post-title, .entry-title"
                        {...register('selectors.title')}
                      />
                      {errors.selectors?.title && (
                        <p className="text-sm text-red-500">{errors.selectors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Contenido * <Badge variant="destructive">Requerido</Badge></Label>
                      <Input
                        id="content"
                        placeholder=".post-content, .entry-content"
                        {...register('selectors.content')}
                      />
                      {errors.selectors?.content && (
                        <p className="text-sm text-red-500">{errors.selectors.content.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Optional selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="publishedAt">Fecha de Publicación</Label>
                      <Input
                        id="publishedAt"
                        placeholder=".post-date, time[datetime]"
                        {...register('selectors.publishedAt')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author">Autor</Label>
                      <Input
                        id="author"
                        placeholder=".author-name, .byline"
                        {...register('selectors.author')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Resumen/Extracto</Label>
                      <Input
                        id="excerpt"
                        placeholder=".post-excerpt, .summary"
                        {...register('selectors.excerpt')}
                      />
                    </div>
                  </div>

                  {/* Multiple selectors */}
                  {(['images', 'categories', 'tags'] as const).map((field) => (
                    <div key={field} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          {field === 'images' ? 'Imágenes' :
                           field === 'categories' ? 'Categorías' : 'Tags'}
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSelectorInput(field)}
                        >
                          <IconPlus className="h-4 w-4" />
                        </Button>
                      </div>

                      {selectorInputs[field].map((_, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            placeholder={
                              field === 'images' ? 'img.featured, .gallery img' :
                              field === 'categories' ? '.category-tag, .post-category' :
                              '.tag-link, .post-tag'
                            }
                            onChange={(e) => updateSelectorInput(field, index, e.target.value)}
                          />
                          {selectorInputs[field].length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectorInput(field, index)}
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

              {/* Extraction Settings */}
              <TabsContent value="settings" className="space-y-4 m-0 px-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Extracción</CardTitle>
                  <CardDescription>
                    Ajustes de rendimiento y comportamiento del scraper
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="extractionSettings.useJavaScript"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="useJavaScript"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="useJavaScript">Usar JavaScript (Puppeteer)</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="waitTime">Tiempo de Espera (ms)</Label>
                      <Input
                        id="waitTime"
                        type="number"
                        min="0"
                        max="30000"
                        placeholder="1000"
                        {...register('extractionSettings.waitTime', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rateLimit">Límite de Requests/min</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        min="1"
                        max="300"
                        placeholder="30"
                        {...register('extractionSettings.rateLimit', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (ms)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        min="5000"
                        max="120000"
                        placeholder="30000"
                        {...register('extractionSettings.timeout', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retryAttempts">Reintentos</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        min="0"
                        max="10"
                        placeholder="3"
                        {...register('extractionSettings.retryAttempts', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="extractionSettings.respectRobots"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="respectRobots"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="respectRobots">Respetar robots.txt</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

              {/* Advanced */}
              <TabsContent value="advanced" className="space-y-4 m-0 px-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración Avanzada</CardTitle>
                  <CardDescription>
                    Headers personalizados y configuraciones específicas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Headers Personalizados (JSON)</Label>
                    <Textarea
                      placeholder='{"User-Agent": "Custom Bot", "Accept": "text/html"}'
                      onChange={(e) => {
                        try {
                          const headers = JSON.parse(e.target.value || '{}');
                          setValue('customHeaders', headers);
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Formato JSON válido. Ejemplo: {`{"User-Agent": "Mi Bot"}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
              </TabsContent>
            </div>
          </Tabs>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t bg-background flex-shrink-0">
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={handleClose} className="w-auto">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || createMutation.isPending || updateMutation.isPending}
                className="w-auto"
                onClick={(e) => {
                  console.log('🔥 Button clicked!', {
                    isValid,
                    createPending: createMutation.isPending,
                    updatePending: updateMutation.isPending,
                    disabled: !isValid || createMutation.isPending || updateMutation.isPending,
                    isEditing,
                    editingConfig: !!editingConfig
                  });
                  // Don't prevent default, let form submit naturally
                }}
              >
                {isEditing
                  ? (updateMutation.isPending ? 'Actualizando...' : 'Actualizar Configuración')
                  : (createMutation.isPending ? 'Creando...' : 'Crear Configuración')
                }
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}