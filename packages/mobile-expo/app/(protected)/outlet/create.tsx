import { useState } from 'react';
import { View, ScrollView, SafeAreaView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { TestTube2, Search, Save, Sparkles } from 'lucide-react-native';
import { useCreateOutlet, useTestListingSelectors, useTestContentSelectors } from '@/src/hooks/useOutlets';
import { useAiCreateOutlet } from '@/src/hooks/useAiOutlets';
import { ClaudePromptAlert } from '@/src/components/outlet/ClaudePromptAlert';
import type { CreateOutletDto } from '@/src/types/outlet.types';

export default function CreateOutletScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'manual' | 'ai'>('ai'); // Modo por defecto: AI

  const [formData, setFormData] = useState<CreateOutletDto>({
    name: '',
    baseUrl: '',
    listingUrl: '',
    testUrl: '',
    extractionFrequency: 60, // Default: cada hora
    useJavaScript: false, // Default: no requiere Puppeteer
    listingSelectors: {
      articleLinks: 'a[href]',
    },
    contentSelectors: {
      titleSelector: '',
      contentSelector: '',
      imageSelector: '',
      dateSelector: '',
      authorSelector: '',
      categorySelector: '',
    },
  });

  const createOutlet = useCreateOutlet();
  const testListingSelectors = useTestListingSelectors();
  const testContentSelectors = useTestContentSelectors();
  const aiCreateOutlet = useAiCreateOutlet();

  const updateField = (field: keyof CreateOutletDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateListingSelector = (field: keyof CreateOutletDto['listingSelectors'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      listingSelectors: { ...prev.listingSelectors, [field]: value },
    }));
  };

  const updateContentSelector = (field: keyof CreateOutletDto['contentSelectors'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      contentSelectors: { ...prev.contentSelectors, [field]: value },
    }));
  };

  const isFormValid = (): boolean => {
    return !!(
      formData.name &&
      formData.baseUrl &&
      formData.listingUrl &&
      formData.listingSelectors.articleLinks &&
      formData.contentSelectors.titleSelector &&
      formData.contentSelectors.contentSelector
    );
  };

  const canTestListing = (): boolean => {
    return !!(formData.listingUrl && formData.listingSelectors.articleLinks);
  };

  const canTestContent = (): boolean => {
    return !!(
      formData.testUrl &&
      formData.contentSelectors.titleSelector &&
      formData.contentSelectors.contentSelector
    );
  };

  const handleTestListing = () => {
    if (!canTestListing()) return;

    testListingSelectors.mutate({
      listingUrl: formData.listingUrl,
      articleLinksSelector: formData.listingSelectors.articleLinks,
    });
  };

  const handleTestContent = () => {
    if (!canTestContent()) return;

    testContentSelectors.mutate({
      testUrl: formData.testUrl!,
      contentSelectors: formData.contentSelectors,
    });
  };

  const handleSave = () => {
    if (!isFormValid()) return;

    createOutlet.mutate(formData);
  };

  const handleAiAnalyze = () => {
    console.log('🤖 handleAiAnalyze called');
    console.log('Form data:', {
      name: formData.name,
      baseUrl: formData.baseUrl,
      listingUrl: formData.listingUrl,
      testUrl: formData.testUrl,
    });

    if (!formData.name || !formData.baseUrl || !formData.listingUrl) {
      console.log('❌ Missing required fields');
      return;
    }

    console.log('✅ Calling aiCreateOutlet.mutate');
    aiCreateOutlet.mutate({
      name: formData.name,
      baseUrl: formData.baseUrl,
      listingUrl: formData.listingUrl,
      testUrl: formData.testUrl || undefined,
    });
  };

  const canUseAI = (): boolean => {
    return !!(
      formData.name &&
      formData.baseUrl &&
      formData.listingUrl
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nuevo Sitio Web',
          headerShown: true,
        }}
      />

      <View style={styles.scrollView}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Toggle de Modo */}
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Modo de Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'ai' && styles.modeButtonActive]}
                  onPress={() => setMode('ai')}
                >
                  <Sparkles size={20} color={mode === 'ai' ? '#000' : '#6B7280'} />
                  <Text style={[styles.modeButtonText, mode === 'ai' && styles.modeButtonTextActive]}>
                    Automático con AI
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
                  onPress={() => setMode('manual')}
                >
                  <Search size={20} color={mode === 'manual' ? '#000' : '#6B7280'} />
                  <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
                    Manual
                  </Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Alert de ayuda con Claude - solo en modo manual */}
          {mode === 'manual' && <ClaudePromptAlert />}

          {/* Sección 1: Información General */}
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent style={styles.inputContainer}>
              <View>
                <Label>Nombre del Sitio</Label>
                <Input
                  placeholder="Ej: El Sol de Pachuca"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                />
              </View>

              <View>
                <Label>URL Base</Label>
                <Input
                  placeholder="https://example.com"
                  value={formData.baseUrl}
                  onChangeText={(value) => updateField('baseUrl', value)}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View>
                <Label>URL de Listado</Label>
                <Input
                  placeholder="https://example.com/noticias"
                  value={formData.listingUrl}
                  onChangeText={(value) => updateField('listingUrl', value)}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View>
                <Label>URL de Prueba (opcional)</Label>
                <Input
                  placeholder="URL de un artículo para probar"
                  value={formData.testUrl}
                  onChangeText={(value) => updateField('testUrl', value)}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </CardContent>
          </Card>

          {/* Sección: Configuración de Extracción Automática */}
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Configuración de Extracción Automática</CardTitle>
            </CardHeader>
            <CardContent style={styles.inputContainer}>
              <View>
                <Label>Frecuencia de Extracción (minutos)</Label>
                <Input
                  placeholder="60"
                  value={formData.extractionFrequency?.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value) || 60;
                    setFormData(prev => ({ ...prev, extractionFrequency: num }));
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                  Cada cuántos minutos extraer URLs nuevas del listado (1-1440)
                </Text>
              </View>

              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Label>¿Requiere JavaScript? (Puppeteer)</Label>
                    <Text style={[styles.helperText, { marginTop: 4 }]}>
                      Activar si el sitio carga contenido dinámicamente
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setFormData(prev => ({ ...prev, useJavaScript: !prev.useJavaScript }))}
                    style={{
                      width: 51,
                      height: 31,
                      borderRadius: 16,
                      backgroundColor: formData.useJavaScript ? '#f1ef47' : '#E5E7EB',
                      padding: 2,
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 27,
                        height: 27,
                        borderRadius: 13.5,
                        backgroundColor: '#FFFFFF',
                        transform: [{ translateX: formData.useJavaScript ? 20 : 0 }],
                      }}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Sección 2: Selectores Listado - Solo en modo manual */}
          {mode === 'manual' && <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Selectores de Listado</CardTitle>
            </CardHeader>
            <CardContent style={styles.inputContainer}>
              <View>
                <Label>Selector de Links de Artículos</Label>
                <Input
                  placeholder="a.article-link, .news-item a"
                  value={formData.listingSelectors.articleLinks}
                  onChangeText={(value) => updateListingSelector('articleLinks', value)}
                  autoCapitalize="none"
                />
                <Text style={styles.helperText}>
                  Selector CSS para extraer links de artículos
                </Text>
              </View>
            </CardContent>
          </Card>}

          {/* Sección 3: Selectores Contenido - Solo en modo manual */}
          {mode === 'manual' && <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Selectores de Contenido</CardTitle>
            </CardHeader>
            <CardContent style={styles.inputContainer}>
              <View>
                <Label>Selector de Título</Label>
                <Input
                  placeholder="h1.title, .article-title"
                  value={formData.contentSelectors.titleSelector}
                  onChangeText={(value) => updateContentSelector('titleSelector', value)}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Label>Selector de Contenido</Label>
                <Input
                  placeholder=".article-body, .content"
                  value={formData.contentSelectors.contentSelector}
                  onChangeText={(value) => updateContentSelector('contentSelector', value)}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Label>Selector de Imagen (opcional)</Label>
                <Input
                  placeholder="img.main-image"
                  value={formData.contentSelectors.imageSelector}
                  onChangeText={(value) => updateContentSelector('imageSelector', value)}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Label>Selector de Fecha (opcional)</Label>
                <Input
                  placeholder="time[datetime], .publish-date"
                  value={formData.contentSelectors.dateSelector}
                  onChangeText={(value) => updateContentSelector('dateSelector', value)}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Label>Selector de Autor (opcional)</Label>
                <Input
                  placeholder=".author-name, .by-line"
                  value={formData.contentSelectors.authorSelector}
                  onChangeText={(value) => updateContentSelector('authorSelector', value)}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Label>Selector de Categoría (opcional)</Label>
                <Input
                  placeholder=".category, .section"
                  value={formData.contentSelectors.categorySelector}
                  onChangeText={(value) => updateContentSelector('categorySelector', value)}
                  autoCapitalize="none"
                />
              </View>
            </CardContent>
          </Card>}

          {/* Espacio para el footer sticky */}
          <View style={{ height: mode === 'ai' ? 100 : 200 }} />
        </ScrollView>
      </View>

      {/* Footer Sticky */}
      <View style={styles.stickyFooter}>
        {mode === 'ai' ? (
          <>
            {/* Modo AI: Un solo botón de análisis automático */}
            <TouchableOpacity
              style={[styles.button, styles.buttonAI]}
              onPress={handleAiAnalyze}
              disabled={!canUseAI() || aiCreateOutlet.isPending}
            >
              {aiCreateOutlet.isPending ? (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator color="#000000" />
                  <Text style={[styles.buttonText, styles.buttonTextBlack, { marginLeft: 8 }]}>
                    {aiCreateOutlet.isPending && !aiCreateOutlet.isSuccess ? 'Analizando con AI...' : 'Completado'}
                  </Text>
                </View>
              ) : (
                <>
                  <Sparkles size={24} color="#000000" />
                  <Text style={[styles.buttonText, styles.buttonTextBlack, { fontSize: 17 }]}>
                    🤖 Analizar con AI
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.aiHelpText}>
              La AI analizará las páginas y detectará automáticamente los selectores correctos
            </Text>
          </>
        ) : (
          <>
            {/* Modo Manual: Botones de prueba y guardar */}
            <TouchableOpacity
              style={[styles.button, styles.buttonBlue]}
              onPress={handleTestListing}
              disabled={!canTestListing() || testListingSelectors.isPending}
            >
              {testListingSelectors.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Search size={20} color="#FFFFFF" />
                  <Text style={[styles.buttonText, styles.buttonTextWhite]}>
                    Probar Listado
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPurple]}
              onPress={handleTestContent}
              disabled={!canTestContent() || testContentSelectors.isPending}
            >
              {testContentSelectors.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <TestTube2 size={20} color="#FFFFFF" />
                  <Text style={[styles.buttonText, styles.buttonTextWhite]}>
                    Probar Contenido
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonYellow]}
              onPress={handleSave}
              disabled={!isFormValid() || createOutlet.isPending}
            >
              {createOutlet.isPending ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Save size={20} color="#000000" />
                  <Text style={[styles.buttonText, styles.buttonTextBlack]}>
                    Guardar Sitio
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  sectionCard: {
    marginBottom: 0,
  },
  inputContainer: {
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  stickyFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 52,
  },
  buttonBlue: {
    backgroundColor: '#2563eb',
  },
  buttonPurple: {
    backgroundColor: '#9333ea',
  },
  buttonYellow: {
    backgroundColor: '#f1ef47',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextWhite: {
    color: '#FFFFFF',
  },
  buttonTextBlack: {
    color: '#000000',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modeButtonActive: {
    backgroundColor: '#f1ef47',
    borderColor: '#f1ef47',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#000000',
  },
  buttonAI: {
    backgroundColor: '#f1ef47',
    paddingVertical: 20,
  },
  aiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHelpText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
});
