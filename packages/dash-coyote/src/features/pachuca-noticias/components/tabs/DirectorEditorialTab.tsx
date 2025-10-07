import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconSparkles, IconLanguage, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { apiClient } from '@/features/shared/services/apiClient';
import { useMutation } from '@tanstack/react-query';

interface GeneratedContent {
  id: string;
  generatedTitle: string;
  generatedContent: string;
  generatedSummary: string;
  metadata: {
    wordCount: number;
    keywords: string[];
  };
}

/**
 * 🎬 Director Editorial Tab
 * El usuario escribe instrucciones libres y el agente genera el artículo completo
 */
export function DirectorEditorialTab() {
  const [instructions, setInstructions] = useState('');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [result, setResult] = useState<GeneratedContent | null>(null);

  // Mutation para generar contenido
  const generateMutation = useMutation({
    mutationFn: async (params: { instructions: string; language: 'es' | 'en' }) => {
      const response = await apiClient.post('/generator-pro/director-editorial', params);
      return response.data.generatedContent;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleGenerate = () => {
    if (!instructions.trim() || instructions.trim().length < 20) {
      return;
    }

    generateMutation.mutate({
      instructions,
      language,
    });
  };

  const handleClear = () => {
    setInstructions('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconSparkles className="h-5 w-5 text-primary" />
                Director Editorial
              </CardTitle>
              <CardDescription className="mt-1">
                Escribe instrucciones libres sobre lo que quieres publicar.
                <strong> El Informante Pachuqueño</strong> generará el artículo completo.
              </CardDescription>
            </div>
            <Badge variant="outline" className="h-fit">
              El Informante Pachuqueño
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Instrucciones</CardTitle>
            <div className="flex items-center gap-2">
              <IconLanguage className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={language === 'es' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('es')}
              >
                Español
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
            </div>
          </div>
          <CardDescription>
            Escribe lo que quieras comunicar. Puede ser en español o inglés, organizado o desorganizado.
            El agente interpretará tu intención.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            placeholder={
              language === 'es'
                ? 'Ejemplo: Quiero publicar sobre el nuevo hospital que inauguraron en Pachuca, costó 500 millones de pesos, tiene 200 camas y tecnología de última generación...'
                : 'Example: I want to publish about the new hospital opening in Pachuca, it cost 500 million pesos, has 200 beds and state-of-the-art technology...'
            }
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={10}
            className="resize-none font-mono text-sm"
            disabled={generateMutation.isPending}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {instructions.length} caracteres
              {instructions.length > 0 && instructions.length < 20 && (
                <span className="text-destructive ml-2">
                  (mínimo 20)
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={!instructions && !result}
              >
                Limpiar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!instructions || instructions.length < 20 || generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <IconSparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <IconSparkles className="mr-2 h-4 w-4" />
                    Generar Artículo
                  </>
                )}
              </Button>
            </div>
          </div>

          {generateMutation.isError && (
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(generateMutation.error as Error).message || 'Error al generar contenido'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Result Section */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-green-500" />
                Artículo Generado
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {result.metadata.wordCount} palabras
                </Badge>
                <Badge variant="outline">
                  {result.metadata.keywords.length} keywords
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <h3 className="text-xl font-bold mb-2">{result.generatedTitle}</h3>
              <p className="text-sm text-muted-foreground">{result.generatedSummary}</p>
            </div>

            <Separator />

            {/* Content Preview */}
            <div>
              <h4 className="font-semibold mb-3">Contenido:</h4>
              <div
                className="prose prose-sm max-w-none p-4 border rounded-lg bg-muted/30"
                dangerouslySetInnerHTML={{ __html: result.generatedContent }}
              />
            </div>

            <Separator />

            {/* Keywords */}
            <div>
              <h4 className="font-semibold mb-3">Keywords SEO:</h4>
              <div className="flex flex-wrap gap-2">
                {result.metadata.keywords.map((keyword, i) => (
                  <Badge key={i} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                ID: <code className="bg-muted px-2 py-1 rounded text-xs">{result.id}</code>
              </p>
              <div className="flex gap-2">
                <Button variant="outline">
                  Ver en Contenidos
                </Button>
                <Button>
                  Publicar Ahora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
