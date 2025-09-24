/**
 * 🧪 TestingTab Component
 * Playground para probar selectores CSS sin configuración en BD
 */

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  IconTestPipe,
  IconRefresh,
  IconCheck,
  IconX,
  IconClock,
  IconCode,
  IconBrowser,
  IconPhoto,
  IconUser,
  IconCalendar,
  IconTags,
  IconFileText,
  IconExternalLink,
  IconCopy,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { toast } from 'sonner';

// Hooks
import { useTestSelectors } from '../hooks';

// Schema de validación
const testSelectorsSchema = z.object({
  url: z.string().url('URL inválida'),
  selectors: z.object({
    title: z.string().min(1, 'Selector de título requerido'),
    content: z.string().min(1, 'Selector de contenido requerido'),
    images: z.array(z.string()).optional(),
    publishedAt: z.string().optional(),
    author: z.string().optional(),
    categories: z.array(z.string()).optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  settings: z.object({
    useJavaScript: z.boolean().optional(),
    waitTime: z.number().min(0).max(30000).optional(),
    timeout: z.number().min(1000).max(60000).optional(),
  }).optional(),
});

type TestSelectorsForm = z.infer<typeof testSelectorsSchema>;

export function TestingTab() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const testSelectorsMutation = useTestSelectors();

  const form = useForm<TestSelectorsForm>({
    resolver: zodResolver(testSelectorsSchema),
    defaultValues: {
      url: 'https://pachucabrilla.com/cine-gratuito-semana-entres-recintos-culturales-hidalgo/',
      selectors: {
        title: 'h1.entry-title',
        content: 'div.entry-content',
        images: ['figure.post-featured-image img', '.page-single-img-wrap img'],
        publishedAt: '',
        author: '',
        categories: [],
        excerpt: '',
        tags: [],
      },
      settings: {
        useJavaScript: true,
        waitTime: 1000,
        timeout: 15000,
      },
    },
  });

  const onSubmit = async (data: TestSelectorsForm) => {
    try {
      console.log('🧪 Testing selectors:', data);

      const result = await testSelectorsMutation.mutateAsync(data);
      setTestResult(result);

      if (result.success) {
        toast.success('Test de selectores exitoso');
      } else {
        toast.error(`Test falló: ${result.error?.message}`);
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error('Error en test de selectores');
      setTestResult({
        success: false,
        error: { message: error.message },
      });
    }
  };

  const loadPreset = (preset: 'pachucabrilla' | 'generic') => {
    if (preset === 'pachucabrilla') {
      form.setValue('url', 'https://pachucabrilla.com/cine-gratuito-semana-entres-recintos-culturales-hidalgo/');
      form.setValue('selectors', {
        title: 'h1.entry-title',
        content: 'div.entry-content',
        images: ['figure.post-featured-image img', '.page-single-img-wrap img'],
        publishedAt: 'time.entry-date',
        author: '.author-name',
        categories: ['.category-links a'],
        excerpt: '.entry-excerpt',
        tags: ['.tag-links a'],
      });
    } else {
      form.setValue('selectors', {
        title: 'h1, .title, .post-title',
        content: '.content, .post-content, article',
        images: ['img'],
        publishedAt: 'time, .date, .published',
        author: '.author, .by-author',
        categories: ['.category, .categories a'],
        excerpt: '.excerpt, .summary',
        tags: ['.tag, .tags a'],
      });
    }
  };

  const clearResults = () => {
    setTestResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <IconTestPipe className="h-5 w-5" />
            <span>Testing de Selectores CSS</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Experimenta con selectores CSS antes de crear configuraciones
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => loadPreset('pachucabrilla')}>
            Preset Pachuca Brilla
          </Button>
          <Button variant="outline" onClick={() => loadPreset('generic')}>
            Preset Genérico
          </Button>
          {testResult && (
            <Button variant="outline" onClick={clearResults}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconCode className="h-4 w-4" />
              <span>Configuración de Test</span>
            </CardTitle>
            <CardDescription>
              Define la URL y selectores CSS a probar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url">URL a probar</Label>
                <div className="flex space-x-2">
                  <Input
                    id="url"
                    {...form.register('url')}
                    placeholder="https://ejemplo.com/noticia"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = form.getValues('url');
                      if (url) window.open(url, '_blank');
                    }}
                  >
                    <IconExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                {form.formState.errors.url && (
                  <p className="text-sm text-red-500">{form.formState.errors.url.message}</p>
                )}
              </div>

              {/* Selectores principales */}
              <div className="space-y-4">
                <h3 className="font-medium">Selectores CSS</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    <IconFileText className="h-4 w-4 inline mr-1" />
                    Título (requerido)
                  </Label>
                  <Input
                    id="title"
                    {...form.register('selectors.title')}
                    placeholder="h1, .title, .post-title"
                  />
                  {form.formState.errors.selectors?.title && (
                    <p className="text-sm text-red-500">{form.formState.errors.selectors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">
                    <IconFileText className="h-4 w-4 inline mr-1" />
                    Contenido (requerido)
                  </Label>
                  <Input
                    id="content"
                    {...form.register('selectors.content')}
                    placeholder=".content, .post-content, article"
                  />
                  {form.formState.errors.selectors?.content && (
                    <p className="text-sm text-red-500">{form.formState.errors.selectors.content.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">
                    <IconPhoto className="h-4 w-4 inline mr-1" />
                    Imágenes (separados por comas)
                  </Label>
                  <Input
                    id="images"
                    placeholder="img, .featured-image img, figure img"
                    onChange={(e) => {
                      const value = e.target.value;
                      const images = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
                      form.setValue('selectors.images', images);
                    }}
                  />
                </div>

                {/* Selectores opcionales colapsibles */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full"
                  >
                    {isAdvancedOpen ? 'Ocultar' : 'Mostrar'} selectores opcionales
                  </Button>

                  {isAdvancedOpen && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      <div className="space-y-2">
                        <Label htmlFor="author">
                          <IconUser className="h-4 w-4 inline mr-1" />
                          Autor
                        </Label>
                        <Input
                          id="author"
                          {...form.register('selectors.author')}
                          placeholder=".author, .by-author, .writer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="publishedAt">
                          <IconCalendar className="h-4 w-4 inline mr-1" />
                          Fecha de publicación
                        </Label>
                        <Input
                          id="publishedAt"
                          {...form.register('selectors.publishedAt')}
                          placeholder="time, .date, .published"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="categories">
                          <IconTags className="h-4 w-4 inline mr-1" />
                          Categorías
                        </Label>
                        <Input
                          id="categories"
                          placeholder=".category a, .categories a"
                          onChange={(e) => {
                            const value = e.target.value;
                            const categories = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
                            form.setValue('selectors.categories', categories);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="excerpt">
                          <IconFileText className="h-4 w-4 inline mr-1" />
                          Extracto
                        </Label>
                        <Input
                          id="excerpt"
                          {...form.register('selectors.excerpt')}
                          placeholder=".excerpt, .summary, .description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">
                          <IconTags className="h-4 w-4 inline mr-1" />
                          Tags
                        </Label>
                        <Input
                          id="tags"
                          placeholder=".tag a, .tags a"
                          onChange={(e) => {
                            const value = e.target.value;
                            const tags = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
                            form.setValue('selectors.tags', tags);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuración avanzada */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Configuración</h3>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="useJavaScript"
                    checked={form.watch('settings.useJavaScript')}
                    onCheckedChange={(checked) => form.setValue('settings.useJavaScript', checked)}
                  />
                  <Label htmlFor="useJavaScript" className="flex items-center space-x-2">
                    <IconBrowser className="h-4 w-4" />
                    <span>Usar JavaScript (Puppeteer)</span>
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="waitTime">Tiempo espera (ms)</Label>
                    <Input
                      id="waitTime"
                      type="number"
                      {...form.register('settings.waitTime', { valueAsNumber: true })}
                      min="0"
                      max="30000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      {...form.register('settings.timeout', { valueAsNumber: true })}
                      min="1000"
                      max="60000"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de test */}
              <Button
                type="submit"
                className="w-full"
                disabled={testSelectorsMutation.isPending}
              >
                {testSelectorsMutation.isPending ? (
                  <>
                    <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                    Probando selectores...
                  </>
                ) : (
                  <>
                    <IconTestPipe className="h-4 w-4 mr-2" />
                    Probar Selectores
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Panel de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconCheck className="h-5 w-5 text-green-600" />
              <span>Resultados del Test</span>
            </CardTitle>
            <CardDescription>
              Resultados de la extracción con los selectores configurados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!testResult ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <IconTestPipe className="h-10 w-10 opacity-50" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Listo para probar</h3>
                <p className="text-sm">Configura los selectores y presiona "Probar Selectores"</p>
              </div>
            ) : testResult.success && testResult.extractedData ? (
              <div className="space-y-6">
                {/* Header compacto con metadata */}
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-500">
                      <IconCheck className="h-3 w-3 mr-1" />
                      Éxito
                    </Badge>
                    <span className="text-sm text-green-700">{testResult.metadata?.processingTime}ms</span>
                    <span className="text-sm text-green-700">{testResult.metadata?.method}</span>
                  </div>
                </div>

                {/* Contenido extraído en grid */}
                <div className="grid gap-4">
                  {/* Título */}
                  {testResult.extractedData?.title && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900 flex items-center">
                        <IconFileText className="h-4 w-4 mr-1" />
                        TÍTULO
                      </Label>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                          {testResult.extractedData.title}
                        </h3>
                      </div>
                    </div>
                  )}

                  {/* Contenido */}
                  {testResult.extractedData?.content && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-900 flex items-center">
                          <IconFileText className="h-4 w-4 mr-1" />
                          CONTENIDO
                        </Label>
                        <Badge variant="outline" className="text-gray-600">
                          {testResult.extractedData.content.length} caracteres
                        </Badge>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {testResult.extractedData.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Imágenes */}
                  {testResult.extractedData?.images && testResult.extractedData.images.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-900 flex items-center">
                          <IconPhoto className="h-4 w-4 mr-1" />
                          IMÁGENES
                        </Label>
                        <Badge variant="outline" className="text-gray-600">
                          {testResult.extractedData.images.length} encontradas
                        </Badge>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                        {testResult.extractedData.images.map((img: string, i: number) => (
                          <div key={i} className="flex items-start space-x-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                            {/* Miniatura */}
                            <div className="flex-shrink-0">
                              <img
                                src={img}
                                alt={`Imagen ${i + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                                onError={(e) => {
                                  // Si la imagen no carga, mostrar placeholder
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              {/* Placeholder si la imagen falla */}
                              <div className="hidden w-16 h-16 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
                                <IconPhoto className="h-6 w-6 text-gray-400" />
                              </div>
                            </div>

                            {/* URL y acciones */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 font-mono break-all">{img}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => window.open(img, '_blank')}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <IconExternalLink className="h-3 w-3 mr-1" />
                                  Ver original
                                </button>
                                <button
                                  onClick={() => navigator.clipboard.writeText(img)}
                                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                                >
                                  <IconCopy className="h-3 w-3 mr-1" />
                                  Copiar URL
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Otros datos extraídos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testResult.extractedData?.author && (
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-900 flex items-center">
                          <IconUser className="h-4 w-4 mr-1" />
                          AUTOR
                        </Label>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <p className="text-gray-800">{testResult.extractedData.author}</p>
                        </div>
                      </div>
                    )}

                    {testResult.extractedData?.publishedAt && (
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-900 flex items-center">
                          <IconCalendar className="h-4 w-4 mr-1" />
                          FECHA
                        </Label>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <p className="text-gray-800">{testResult.extractedData.publishedAt}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Categorías */}
                  {testResult.extractedData?.categories && testResult.extractedData.categories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900">CATEGORÍAS</Label>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex flex-wrap gap-2">
                          {testResult.extractedData.categories.map((cat: string, i: number) => (
                            <Badge key={i} variant="secondary">{cat}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {testResult.extractedData?.tags && testResult.extractedData.tags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900">TAGS</Label>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex flex-wrap gap-2">
                          {testResult.extractedData.tags.map((tag: string, i: number) => (
                            <Badge key={i} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Error header */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-500 text-white rounded-full p-2">
                      <IconX className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800">Error en la Extracción</h3>
                      <p className="text-sm text-red-600">Los selectores no pudieron extraer el contenido</p>
                    </div>
                    {testResult.metadata?.processingTime && (
                      <div className="flex items-center space-x-1 text-red-700">
                        <IconClock className="h-4 w-4" />
                        <span className="text-sm font-medium">{testResult.metadata.processingTime}ms</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error details */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <IconAlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-red-800">
                        {testResult.error?.message || 'Error desconocido en la extracción'}
                      </p>
                      {testResult.error?.details && (
                        <details className="text-sm text-red-600 mt-2">
                          <summary className="cursor-pointer">Ver detalles técnicos</summary>
                          <pre className="mt-2 overflow-auto bg-red-100 p-2 rounded text-xs">
                            {JSON.stringify(testResult.error.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}