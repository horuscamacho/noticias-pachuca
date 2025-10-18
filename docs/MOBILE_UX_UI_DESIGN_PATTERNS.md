# Patrones de Diseño UX/UI - Mobile Expo App

**Proyecto:** Noticias Pachuca - Mobile Application
**Fecha de Análisis:** 15 de Octubre de 2025
**Documentado para:** Diseño de nuevas pantallas Sites Multi-Tenant

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Sistema de Diseño Base](#sistema-de-diseño-base)
3. [Patrones de Formularios](#patrones-de-formularios)
4. [Patrones de Listado](#patrones-de-listado)
5. [Componentes UI Estándar](#componentes-ui-estándar)
6. [Navegación y Layout](#navegación-y-layout)
7. [Guía de Diseño para Sites](#guía-de-diseño-para-sites)
8. [Mejoras Recomendadas para Home](#mejoras-recomendadas-para-home)

---

## Resumen Ejecutivo

El proyecto utiliza un **sistema de diseño consistente y profesional** basado en:

- **Design System:** Mezcla de componentes personalizados con NativeWind (TailwindCSS)
- **Paleta de colores:** Gris neutro con amarillo brillante (#f1ef47) como acento principal
- **Tipografía:** Sistema ThemedText con fuente Aleo (serif) para títulos y contenido
- **Layout responsivo:** Adaptable a tablets con máximo de 1000px centrado
- **Arquitectura de componentes:** Cards, modales, bottom sheets, y pantallas full-screen

El sistema está **bien implementado en screens de Outlets y Agents**, pero la pantalla Home requiere mejoras para alcanzar el mismo nivel de profesionalismo.

---

## Sistema de Diseño Base

### Paleta de Colores

#### Colores Principales
```typescript
// Color amarillo brillante - Acento principal
'#f1ef47' // Botones primarios, badges importantes, highlights

// Grises neutros
'#F3F4F6' // Fondo de pantallas (background)
'#FFFFFF' // Cards y componentes elevados
'#111827' // Texto primario (títulos, contenido principal)
'#6B7280' // Texto secundario (subtítulos, metadata)
'#9CA3AF' // Texto placeholder y disabled

// Bordes y separadores
'#E5E7EB' // Bordes suaves
'#D1D5DB' // Bordes de inputs
```

#### Colores de Estado (Sistema Semántico)
```typescript
// Success
'#22c55e' // Verde - Operaciones exitosas
'bg-green-50' // Fondo claro para stats

// Error
'#EF4444' // Rojo - Errores y validaciones
'bg-red-50'   // Fondo claro

// Info
'#3b82f6' // Azul - Información neutral
'bg-blue-50' // Fondo claro

// Warning
'#f59e0b' // Naranja - Advertencias
```

### Tipografía - ThemedText System

El sistema utiliza **Aleo** (serif) como fuente principal, con un sistema de variantes predefinidas:

```typescript
// Variantes disponibles
'display-large'   // 57px - Títulos muy grandes
'display-medium'  // 45px
'display-small'   // 36px

'headline-large'  // 32px - Encabezados principales
'headline-medium' // 28px
'headline-small'  // 24px

'title-large'     // 22px - Títulos de secciones (MÁS USADO)
'title-medium'    // 16px - Títulos de cards
'title-small'     // 14px

'body-large'      // 16px - Contenido extenso
'body-medium'     // 14px - Contenido normal (MÁS USADO)
'body-small'      // 12px - Texto complementario

'label-large'     // 14px - Labels y botones
'label-medium'    // 12px - Labels pequeños (MÁS USADO)
'label-small'     // 11px - Metadatos

'caption'         // 12px - Captions y notas
'overline'        // 10px - Texto muy pequeño
```

#### Colores de Texto
```typescript
color="primary"    // Negro/Blanco según tema (#111827)
color="secondary"  // Gris medio (#6B7280)
color="accent"     // Azul de acento
color="muted"      // Gris claro
color="error"      // Rojo
```

#### Uso de ThemedText
```tsx
// Título principal de pantalla
<ThemedText variant="title-large" style={styles.title}>
  Crear Nuevo Agente
</ThemedText>

// Subtítulo descriptivo
<ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
  Define la personalidad, estilo editorial y especialización del agente
</ThemedText>

// Labels de campos
<ThemedText variant="label-medium">Nombre del Agente</ThemedText>

// Texto de error
<ThemedText variant="label-small" style={styles.error}>
  {errors.name}
</ThemedText>
```

### Layout y Espaciado

#### Padding de Pantallas
```typescript
// Pantalla completa
padding: 16,           // Mobile
paddingHorizontal: 80, // Tablet
maxWidth: 1000,        // Ancho máximo centrado
alignSelf: 'center'

// Contenido interno
gap: 16,              // Separación entre secciones
marginBottom: 24      // Espacio entre bloques principales
```

#### Bordes y Sombras
```typescript
// Cards principales
borderRadius: 16,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 8,
elevation: 4

// Cards compactas (outlets)
borderRadius: 12,
elevation: 2

// Inputs y controles
borderRadius: 8
```

---

## Patrones de Formularios

### Estructura Base - AgentFormFields.tsx

El patrón más completo está en `/app/(protected)/agents/create.tsx` y `/src/components/agents/AgentFormFields.tsx`.

#### Anatomía de un Formulario

```tsx
<SafeAreaView style={styles.container}>
  {/* Header fijo con navegación */}
  <Stack.Screen options={{ title: 'Título', headerBackTitle: 'Cancelar' }} />

  <View style={[styles.content, isTablet && styles.contentTablet]}>
    {/* Encabezado de pantalla */}
    <View style={styles.header}>
      <ThemedText variant="title-large" style={styles.title}>
        Título Principal
      </ThemedText>
      <ThemedText variant="body-medium" color="secondary">
        Descripción de la pantalla
      </ThemedText>
    </View>

    {/* Secciones agrupadas en Cards */}
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-medium">Sección 1</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Campos del formulario */}
        </CardContent>
      </Card>

      {/* Más secciones... */}
    </ScrollView>

    {/* Botones de acción fijos al fondo */}
    <View style={styles.actions}>
      <Button variant="outline" onPress={handleCancel}>
        <ThemedText>Cancelar</ThemedText>
      </Button>
      <Button style={styles.createButton} onPress={handleSubmit}>
        <ThemedText style={styles.createButtonText}>
          Crear Agente
        </ThemedText>
      </Button>
    </View>
  </View>
</SafeAreaView>
```

### Estructura de Campo Individual

```tsx
<View style={styles.field}>
  {/* Label */}
  <Label>Nombre del Campo</Label>

  {/* Input/Select/Textarea */}
  <Input
    value={formData.field}
    onChangeText={(text) => updateField('field', text)}
    placeholder="Placeholder descriptivo"
    style={errors?.field ? styles.inputError : undefined}
  />

  {/* Mensaje de error (condicional) */}
  {errors?.field && (
    <ThemedText variant="label-small" style={styles.error}>
      {errors.field}
    </ThemedText>
  )}

  {/* Helper text (opcional) */}
  <ThemedText variant="label-small" color="secondary">
    Texto de ayuda o contador
  </ThemedText>
</View>
```

### Tipos de Campos

#### 1. Input de Texto Simple
```tsx
<View style={styles.field}>
  <Label>Nombre del Sitio</Label>
  <Input
    placeholder="Ej: El Sol de Pachuca"
    value={formData.name}
    onChangeText={(value) => updateField('name', value)}
  />
</View>
```

#### 2. Textarea Multi-línea
```tsx
<View style={styles.field}>
  <Label>Descripción</Label>
  <Textarea
    value={formData.description}
    onChangeText={(text) => updateField('description', text)}
    placeholder="Describe brevemente..."
    rows={3}
    style={errors?.description ? styles.inputError : undefined}
  />
</View>
```

#### 3. Select/Dropdown
```tsx
<View style={styles.field}>
  <Label>Tipo de Agente</Label>
  <Select
    value={formData.agentType}
    onValueChange={(value) => updateField('agentType', value)}
    options={[
      { label: '📰 Reportero', value: 'reportero' },
      { label: '✍️ Columnista', value: 'columnista' }
    ]}
  />
</View>
```

#### 4. Switch/Toggle
```tsx
<View style={styles.switchField}>
  <View style={styles.switchLabel}>
    <Label>Estado del Agente</Label>
    <ThemedText variant="body-small" color="secondary">
      {data.isActive ? 'Agente activo' : 'Agente desactivado'}
    </ThemedText>
  </View>
  <Switch
    checked={data.isActive}
    onCheckedChange={(checked) => updateField('isActive', checked)}
  />
</View>
```

### Validación y Estados de Error

```tsx
// Estado de errores
const [errors, setErrors] = useState<Record<string, string>>({});

// Función de validación
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.name || formData.name.trim().length < 3) {
    newErrors.name = `El nombre debe tener al menos 3 caracteres (actual: ${formData.name.length})`;
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Estilos de error
const styles = StyleSheet.create({
  error: {
    color: '#EF4444'
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2
  }
});
```

### Botones de Acción

```tsx
<View style={styles.actions}>
  {/* Botón secundario */}
  <Button
    variant="outline"
    onPress={() => router.back()}
    style={styles.actionButton}
    disabled={isLoading}
  >
    <ThemedText variant="label-medium">Cancelar</ThemedText>
  </Button>

  {/* Botón primario con loading */}
  <Button
    onPress={handleSubmit}
    style={[styles.actionButton, styles.createButton]}
    disabled={isLoading}
  >
    {isLoading ? (
      <>
        <ActivityIndicator size="small" color="#000" />
        <ThemedText style={styles.createButtonText}>
          Creando...
        </ThemedText>
      </>
    ) : (
      <ThemedText style={styles.createButtonText}>
        ✨ Crear Agente
      </ThemedText>
    )}
  </Button>
</View>

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    paddingBottom: 32
  },
  actionButton: {
    flex: 1
  },
  createButton: {
    backgroundColor: '#f1ef47'
  },
  createButtonText: {
    color: '#000000',
    fontWeight: '600'
  }
});
```

### Patrón de Toggle de Modo (AI vs Manual)

Usado en `/app/(protected)/outlet/create.tsx`:

```tsx
const [mode, setMode] = useState<'manual' | 'ai'>('ai');

{/* Toggle Card */}
<Card style={styles.sectionCard}>
  <CardHeader>
    <CardTitle>Modo de Configuración</CardTitle>
  </CardHeader>
  <CardContent>
    <View style={styles.modeToggle}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          mode === 'ai' && styles.modeButtonActive
        ]}
        onPress={() => setMode('ai')}
      >
        <Sparkles size={20} color={mode === 'ai' ? '#000' : '#6B7280'} />
        <Text style={[
          styles.modeButtonText,
          mode === 'ai' && styles.modeButtonTextActive
        ]}>
          Automático con AI
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          mode === 'manual' && styles.modeButtonActive
        ]}
        onPress={() => setMode('manual')}
      >
        <Search size={20} color={mode === 'manual' ? '#000' : '#6B7280'} />
        <Text style={[
          styles.modeButtonText,
          mode === 'manual' && styles.modeButtonTextActive
        ]}>
          Manual
        </Text>
      </TouchableOpacity>
    </View>
  </CardContent>
</Card>

const styles = StyleSheet.create({
  modeToggle: {
    flexDirection: 'row',
    gap: 12
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
    backgroundColor: '#FFFFFF'
  },
  modeButtonActive: {
    backgroundColor: '#f1ef47',
    borderColor: '#f1ef47'
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  modeButtonTextActive: {
    color: '#000000'
  }
});
```

---

## Patrones de Listado

### Patrón de OutletCard (Listado con Estadísticas)

Ubicación: `/app/(protected)/(tabs)/extract.tsx`

Este es el patrón **MÁS PROFESIONAL** del proyecto.

#### Anatomía de OutletCard

```tsx
<Card className="mb-4">
  {/* 1. Header: Título, URL, Badge de estado */}
  <CardHeader>
    <View className="flex-row items-start justify-between">
      <View className="flex-1 pr-2">
        <CardTitle>
          <Text className="text-lg font-bold">{outlet.name}</Text>
        </CardTitle>
        <CardDescription className="mt-1">
          <View className="flex-row items-center gap-1">
            <ExternalLink size={12} color="#6B7280" />
            <Text className="text-xs text-muted-foreground">
              {outlet.baseUrl}
            </Text>
          </View>
        </CardDescription>
      </View>
      <Badge variant={outlet.isActive ? 'default' : 'secondary'}>
        <Text className="text-xs font-semibold">
          {outlet.isActive ? 'Activo' : 'Inactivo'}
        </Text>
      </Badge>
    </View>
  </CardHeader>

  {/* 2. Content: Grid de estadísticas con colores */}
  <CardContent>
    {/* Fila principal: URLs y Extraidos */}
    <View className="flex-row gap-2 mb-3">
      <View className="flex-1 bg-blue-50 p-3 rounded-lg">
        <View className="flex-row items-center gap-1 mb-1">
          <TrendingUp size={14} color="#3b82f6" />
          <Text className="text-xs text-blue-600">URLs</Text>
        </View>
        <Text className="text-xl font-bold text-blue-700">
          {statistics?.totalUrlsExtracted ?? 0}
        </Text>
      </View>

      <View className="flex-1 bg-green-50 p-3 rounded-lg">
        <View className="flex-row items-center gap-1 mb-1">
          <CheckCircle2 size={14} color="#22c55e" />
          <Text className="text-xs text-green-600">Extraidos</Text>
        </View>
        <Text className="text-xl font-bold text-green-700">
          {statistics?.totalContentExtracted ?? 0}
        </Text>
      </View>
    </View>

    {/* Fila secundaria: Fallos y Tasa de éxito */}
    <View className="flex-row gap-2">
      <View className="flex-1 bg-red-50 p-3 rounded-lg">
        <View className="flex-row items-center gap-1 mb-1">
          <XCircle size={14} color="#ef4444" />
          <Text className="text-xs text-red-600">Fallos</Text>
        </View>
        <Text className="text-xl font-bold text-red-700">
          {statistics?.totalFailed ?? 0}
        </Text>
      </View>

      <View
        className="flex-1 p-3 rounded-lg"
        style={{ backgroundColor: '#f1ef47' }}
      >
        <View className="flex-row items-center gap-1 mb-1">
          <Sparkles size={14} color="#000" />
          <Text className="text-xs text-black font-medium">Tasa Éxito</Text>
        </View>
        <Text className="text-xl font-bold text-black">
          {statistics?.successRate?.toFixed(1) ?? 0}%
        </Text>
      </View>
    </View>

    {/* Metadata: Última extracción */}
    <View className="mt-3 pt-3 border-t border-gray-200">
      <View className="flex-row items-center gap-2">
        <Clock size={14} color="#6B7280" />
        <Text className="text-xs text-muted-foreground">
          Última extracción:
        </Text>
        <Text className="text-xs font-medium">{lastExtraction}</Text>
      </View>
    </View>
  </CardContent>

  {/* 3. Footer: Botones de acción */}
  <CardFooter className="gap-2">
    <Button variant="outline" className="flex-1">
      <Text className="font-semibold">Ver Detalles</Text>
    </Button>

    <TouchableOpacity style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: '#f1ef47',
          minHeight: 44,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <Play size={16} color="#000" fill="#000" />
        <Text style={{ color: '#000', fontWeight: '600' }}>
          Extraer Ahora
        </Text>
      </View>
    </TouchableOpacity>
  </CardFooter>
</Card>
```

### Patrón de Grid de Estadísticas (StatsCard)

Ubicación: `/app/(protected)/(tabs)/home.tsx`

```tsx
<View style={styles.statsGrid}>
  <StatsCard
    icon="🤖"
    title="Agentes"
    value={stats.totalAgents}
    subtitle="activos"
    variant="primary"
  />
  <StatsCard
    icon="🌐"
    title="Sitios"
    value={stats.totalSites}
    subtitle="configurados"
    variant="default"
  />
  <StatsCard
    icon="📰"
    title="Noticias"
    value={stats.totalNoticias}
    subtitle="publicadas"
    variant="default"
  />
  <StatsCard
    icon="📊"
    title="Outlets"
    value={stats.totalOutlets}
    subtitle="monitoreados"
    variant="secondary"
  />
</View>

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  }
});
```

### Patrón de Lista Horizontal con Items

Usado en Home para Agentes y Sites:

```tsx
<Card style={styles.agentsSection}>
  <CardHeader>
    <View style={styles.sectionHeader}>
      <CardTitle>
        <ThemedText variant="title-medium">
          Agentes Disponibles
        </ThemedText>
      </CardTitle>

      {/* Botón "+" para crear */}
      <Pressable
        style={styles.addButton}
        onPress={() => router.push('/agents/create')}
      >
        <ThemedText variant="label-medium" style={styles.addButtonText}>
          +
        </ThemedText>
      </Pressable>
    </View>
  </CardHeader>

  <CardContent>
    <FlatList
      horizontal
      data={agentsToShow}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={styles.agentItem}
          onPress={() => router.push(`/agents/${item.id}/edit`)}
        >
          {/* Ícono del agente */}
          <View style={styles.agentIconContainer}>
            <ThemedText variant="title-large" style={styles.agentIcon}>
              {AGENT_TYPE_EMOJI[item.agentType] || '🤖'}
            </ThemedText>
          </View>

          {/* Nombre */}
          <ThemedText
            variant="label-small"
            style={styles.agentName}
            numberOfLines={2}
          >
            {item.name}
          </ThemedText>

          {/* Badge */}
          <Badge variant="secondary" style={styles.agentBadge}>
            <ThemedText variant="label-small">
              {item.editorialLean}
            </ThemedText>
          </Badge>
        </Pressable>
      )}
      showsHorizontalScrollIndicator={false}
    />
  </CardContent>
</Card>

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1ef47',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 28
  },
  agentItem: {
    width: 100,
    marginRight: 16,
    alignItems: 'center'
  },
  agentIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2
  },
  agentIcon: {
    fontSize: 32
  },
  agentName: {
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 32
  }
});
```

### Empty States

```tsx
{items.length === 0 ? (
  <View style={styles.emptyState}>
    <AlertCircle size={64} color="#9CA3AF" />
    <ThemedText variant="title-medium" style={styles.emptyTitle}>
      No hay outlets configurados
    </ThemedText>
    <ThemedText variant="body-medium" color="secondary">
      Configura outlets desde el panel para comenzar
    </ThemedText>
  </View>
) : (
  {/* Lista normal */}
)}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24
  },
  emptyTitle: {
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  }
});
```

### Loading States

```tsx
{isLoading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="small" color="#f1ef47" />
    <ThemedText variant="body-small" color="secondary" style={{ marginTop: 8 }}>
      Cargando agentes...
    </ThemedText>
  </View>
) : (
  {/* Contenido */}
)}
```

---

## Componentes UI Estándar

### 1. Card (Base)

Ubicación: `/components/ui/card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

// Uso básico
<Card>
  <CardHeader>
    <CardTitle>Título de la Card</CardTitle>
    <CardDescription>Descripción opcional</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido principal */}
  </CardContent>
  <CardFooter>
    {/* Botones o acciones */}
  </CardFooter>
</Card>

// Estilos aplicados
className="bg-card border-border flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
```

### 2. Badge

Ubicación: `/components/ui/badge.tsx`

```tsx
import { Badge } from '@/components/ui/badge';

// Variantes disponibles
<Badge variant="default">      {/* Primario */}
<Badge variant="secondary">    {/* Gris neutro */}
<Badge variant="destructive">  {/* Rojo de error */}
<Badge variant="outline">      {/* Outline transparente */}

// Estilos inline
<Badge style={{ backgroundColor: '#f1ef47' }}>
  <Text style={{ color: '#000', fontWeight: '600' }}>Custom</Text>
</Badge>
```

### 3. Button

Ubicación: `/components/ui/button.tsx`

```tsx
import { Button } from '@/components/ui/button';

// Variantes
<Button variant="default">     {/* Primario (azul/default) */}
<Button variant="outline">     {/* Outline con fondo blanco */}
<Button variant="secondary">   {/* Gris secundario */}
<Button variant="destructive"> {/* Rojo destructivo */}
<Button variant="ghost">       {/* Transparente, hover gris */}
<Button variant="link">        {/* Estilo de link */}

// Tamaños
<Button size="default">  {/* h-10 px-4 */}
<Button size="sm">       {/* h-9 px-3 */}
<Button size="lg">       {/* h-11 px-6 */}
<Button size="icon">     {/* 10x10 cuadrado */}

// Personalización (botón amarillo primario)
<Button
  style={{ backgroundColor: '#f1ef47' }}
  disabled={isLoading}
  onPress={handleSubmit}
>
  <ThemedText style={{ color: '#000', fontWeight: '600' }}>
    Crear
  </ThemedText>
</Button>
```

### 4. Input

Ubicación: `/components/ui/input.tsx`

```tsx
import { Input } from '@/components/ui/input';

<Input
  placeholder="Ingresa texto..."
  value={value}
  onChangeText={setValue}
  autoCapitalize="none"
  keyboardType="email-address"
  editable={!disabled}
  style={error ? styles.inputError : undefined}
/>

// Estilos automáticos:
// - Borde: #D1D5DB
// - Focus: ring azul
// - Error: aria-invalid con ring rojo
// - Altura: h-10 (mobile), h-9 (desktop)
```

### 5. Textarea

Ubicación: `/components/ui/textarea.tsx`

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea
  value={description}
  onChangeText={setDescription}
  placeholder="Escribe una descripción..."
  rows={4}  // Número de líneas visibles
  style={error ? styles.inputError : undefined}
/>

// Props heredadas de TextInput
// - multiline: true (automático)
// - textAlignVertical: 'top'
// - minHeight: rows * 20px
```

### 6. Select

Ubicación: `/components/ui/select.tsx`

```tsx
import { Select, SelectOption } from '@/components/ui/select';

const OPTIONS: SelectOption[] = [
  { label: '📰 Reportero', value: 'reportero' },
  { label: '✍️ Columnista', value: 'columnista' },
  { label: '🔍 Trascendido', value: 'trascendido' }
];

<Select
  value={selectedValue}
  onValueChange={setSelectedValue}
  options={OPTIONS}
  placeholder="Seleccionar..."
  disabled={false}
/>

// Comportamiento:
// - Abre modal overlay con lista completa
// - Selección simple con highlight del activo
// - Cierra automáticamente al seleccionar
```

### 7. Switch

Ubicación: `/components/ui/switch.tsx`

```tsx
import { Switch } from '@/components/ui/switch';

<Switch
  checked={isActive}
  onCheckedChange={setIsActive}
  disabled={false}
/>

// Visual:
// - ON: bg-primary (azul)
// - OFF: bg-input (gris)
// - Thumb blanco que se desplaza
```

### 8. Label

Ubicación: `/components/ui/label.tsx`

```tsx
import { Label } from '@/components/ui/label';

<Label>Nombre del Campo</Label>
<Input placeholder="..." />

// Estilos automáticos:
// - text-foreground text-sm font-medium
// - Accesibilidad con peer-disabled
```

---

## Navegación y Layout

### Stack Navigation

```tsx
import { Stack, useRouter } from 'expo-router';

export default function Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Título de Pantalla',
          headerBackTitle: 'Atrás',
          headerShown: true
        }}
      />

      {/* Contenido */}
    </SafeAreaView>
  );
}
```

### Bottom Tabs (Tabs principales)

```tsx
// Estructura en /app/(protected)/(tabs)/
// - home.tsx
// - extract.tsx
// - extract-results.tsx
// - generate.tsx
// - images.tsx
// - stats.tsx
```

### SafeAreaView Container

Todas las pantallas usan este patrón:

```tsx
<SafeAreaView style={styles.container}>
  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={[
      styles.content,
      isTablet && styles.contentTablet
    ]}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor="#f1ef47"
      />
    }
  >
    {/* Contenido */}
  </ScrollView>
</SafeAreaView>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%'
  }
});
```

### Sticky Footer con Botón de Acción

```tsx
<View style={styles.stickyFooter}>
  <TouchableOpacity
    onPress={() => router.push('/sites/create')}
    activeOpacity={0.7}
    style={styles.createButton}
  >
    <View style={styles.createButtonContent}>
      <Plus size={20} color="#000" strokeWidth={2.5} />
      <Text style={styles.createButtonText}>Crear Nuevo Sitio</Text>
    </View>
  </TouchableOpacity>
</View>

const styles = StyleSheet.create({
  stickyFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16
  },
  createButtonContent: {
    backgroundColor: '#f1ef47',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600'
  }
});
```

### Modal Full-Screen

```tsx
<Modal
  visible={visible}
  animationType="slide"
  transparent={true}
  onRequestClose={onClose}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text>Título del Modal</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.modalBody}>
        {/* Contenido */}
      </View>

      {/* Footer */}
      <View style={styles.modalFooter}>
        <Button onPress={onClose}>Cerrar</Button>
      </View>
    </View>
  </View>
</Modal>

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  modalBody: {
    flex: 1,
    padding: 20
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  }
});
```

---

## Guía de Diseño para Sites

### Nuevas Pantallas Requeridas

Basándote en los patrones existentes, estas son las pantallas que debes crear:

#### 1. Pantalla de Listado: `/app/(protected)/(tabs)/sites.tsx`

```tsx
/**
 * PANTALLA: Lista de Sites
 * Patrón: Similar a extract.tsx (OutletCard con estadísticas)
 */

export default function SitesScreen() {
  const { data: sites, isLoading } = useSites({ isActive: true });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl />}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Sitios Multi-Tenant
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            Gestiona tus sitios de publicación de noticias
          </ThemedText>
        </View>

        {/* Grid de Stats */}
        <View style={styles.statsGrid}>
          <StatsCard
            icon="🌐"
            title="Sites Activos"
            value={stats.totalActiveSites}
            variant="primary"
          />
          <StatsCard
            icon="📰"
            title="Noticias"
            value={stats.totalNoticias}
            variant="default"
          />
          <StatsCard
            icon="📊"
            title="Categorías"
            value={stats.totalCategories}
            variant="secondary"
          />
        </View>

        {/* Lista de Sites */}
        {sites?.map((site) => (
          <SiteCard
            key={site.id}
            site={site}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
          />
        ))}
      </ScrollView>

      {/* Sticky Footer: Crear Nuevo Site */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity onPress={() => router.push('/sites/create')}>
          <View style={styles.createButtonContent}>
            <Plus size={20} color="#000" />
            <Text style={styles.createButtonText}>
              Crear Nuevo Sitio
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
```

#### 2. Componente SiteCard

```tsx
/**
 * COMPONENTE: SiteCard
 * Patrón: OutletCard con estadísticas y acciones
 * Ubicación sugerida: /src/components/sites/SiteCard.tsx
 */

interface SiteCardProps {
  site: Site;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
}

export function SiteCard({ site, onViewDetails, onEdit }: SiteCardProps) {
  const { data: stats } = useSiteStatistics(site.id);

  return (
    <Card className="mb-4">
      {/* Header */}
      <CardHeader>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-lg font-bold">{site.name}</Text>
              {site.isMainSite && (
                <Badge style={{ backgroundColor: '#f1ef47' }}>
                  <Text style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>
                    MAIN
                  </Text>
                </Badge>
              )}
            </View>
            <View className="flex-row items-center gap-1">
              <ExternalLink size={12} color="#6B7280" />
              <Text className="text-xs text-muted-foreground">
                {site.domain}
              </Text>
            </View>
          </View>
          <Badge variant={site.isActive ? 'default' : 'secondary'}>
            <Text className="text-xs font-semibold">
              {site.isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </Badge>
        </View>
      </CardHeader>

      {/* Content: Estadísticas */}
      <CardContent>
        {/* Primera fila: Noticias y Categorías */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-blue-50 p-3 rounded-lg">
            <View className="flex-row items-center gap-1 mb-1">
              <FileText size={14} color="#3b82f6" />
              <Text className="text-xs text-blue-600">Noticias</Text>
            </View>
            <Text className="text-xl font-bold text-blue-700">
              {stats?.totalNoticias ?? 0}
            </Text>
          </View>

          <View className="flex-1 bg-purple-50 p-3 rounded-lg">
            <View className="flex-row items-center gap-1 mb-1">
              <Tag size={14} color="#9333ea" />
              <Text className="text-xs text-purple-600">Categorías</Text>
            </View>
            <Text className="text-xl font-bold text-purple-700">
              {stats?.totalCategories ?? 0}
            </Text>
          </View>
        </View>

        {/* Segunda fila: Publicadas y Borradores */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-green-50 p-3 rounded-lg">
            <View className="flex-row items-center gap-1 mb-1">
              <CheckCircle2 size={14} color="#22c55e" />
              <Text className="text-xs text-green-600">Publicadas</Text>
            </View>
            <Text className="text-xl font-bold text-green-700">
              {stats?.published ?? 0}
            </Text>
          </View>

          <View className="flex-1 bg-orange-50 p-3 rounded-lg">
            <View className="flex-row items-center gap-1 mb-1">
              <Edit size={14} color="#f59e0b" />
              <Text className="text-xs text-orange-600">Borradores</Text>
            </View>
            <Text className="text-xl font-bold text-orange-700">
              {stats?.draft ?? 0}
            </Text>
          </View>
        </View>

        {/* Metadata */}
        <View className="mt-3 pt-3 border-t border-gray-200">
          <View className="flex-row items-center gap-2 mb-1">
            <Globe size={14} color="#6B7280" />
            <Text className="text-xs text-muted-foreground">
              Idioma:
            </Text>
            <Text className="text-xs font-medium">
              {site.defaultLanguage || 'es'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Clock size={14} color="#6B7280" />
            <Text className="text-xs text-muted-foreground">
              Creado:
            </Text>
            <Text className="text-xs font-medium">
              {new Date(site.createdAt).toLocaleDateString('es-MX')}
            </Text>
          </View>
        </View>
      </CardContent>

      {/* Footer: Acciones */}
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => onViewDetails(site.id)}
        >
          <Text className="font-semibold">Ver Dashboard</Text>
        </Button>

        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => onEdit(site.id)}
        >
          <View
            style={{
              backgroundColor: '#f1ef47',
              minHeight: 44,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Settings size={16} color="#000" />
            <Text style={{ color: '#000', fontWeight: '600' }}>
              Configurar
            </Text>
          </View>
        </TouchableOpacity>
      </CardFooter>
    </Card>
  );
}
```

#### 3. Formulario de Creación: `/app/(protected)/sites/create.tsx`

```tsx
/**
 * PANTALLA: Crear Site
 * Patrón: Similar a agents/create.tsx (formulario por secciones)
 */

const INITIAL_FORM_DATA: CreateSiteRequest = {
  name: '',
  domain: '',
  description: '',
  tagline: '',
  defaultLanguage: 'es',
  timezone: 'America/Mexico_City',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#f1ef47',
  secondaryColor: '#111827',
  isMainSite: false,
  isActive: true,
  seo: {
    metaTitle: '',
    metaDescription: '',
    ogImage: ''
  },
  contact: {
    email: '',
    phone: '',
    address: ''
  },
  social: {
    facebook: '',
    twitter: '',
    instagram: ''
  }
};

export default function CreateSiteScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const createSite = useCreateSite();

  const [formData, setFormData] = useState<CreateSiteRequest>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof CreateSiteRequest>(
    field: K,
    value: CreateSiteRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Crear Nuevo Sitio',
          headerBackTitle: 'Cancelar'
        }}
      />

      <View style={[styles.content, isTablet && styles.contentTablet]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Crear Nuevo Sitio
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            Configura tu sitio multi-tenant para publicación de noticias
          </ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Sección 1: Información General */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">
                  Información General
                </ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.field}>
                <Label>Nombre del Sitio</Label>
                <Input
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  placeholder="Ej: Noticias Pachuca"
                  style={errors.name ? styles.inputError : undefined}
                />
                {errors.name && (
                  <ThemedText variant="label-small" style={styles.error}>
                    {errors.name}
                  </ThemedText>
                )}
              </View>

              <View style={styles.field}>
                <Label>Dominio</Label>
                <Input
                  value={formData.domain}
                  onChangeText={(text) => updateField('domain', text)}
                  placeholder="pachuca.news"
                  autoCapitalize="none"
                  keyboardType="url"
                  style={errors.domain ? styles.inputError : undefined}
                />
              </View>

              <View style={styles.field}>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChangeText={(text) => updateField('description', text)}
                  placeholder="Descripción breve del sitio..."
                  rows={3}
                />
              </View>

              <View style={styles.field}>
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChangeText={(text) => updateField('tagline', text)}
                  placeholder="Ej: Tu fuente de noticias locales"
                />
              </View>
            </CardContent>
          </Card>

          {/* Sección 2: Configuración Regional */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">
                  Configuración Regional
                </ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.field}>
                <Label>Idioma Principal</Label>
                <Select
                  value={formData.defaultLanguage}
                  onValueChange={(value) => updateField('defaultLanguage', value)}
                  options={[
                    { label: 'Español', value: 'es' },
                    { label: 'English', value: 'en' }
                  ]}
                />
              </View>

              <View style={styles.field}>
                <Label>Zona Horaria</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => updateField('timezone', value)}
                  options={[
                    { label: 'Ciudad de México (GMT-6)', value: 'America/Mexico_City' },
                    { label: 'Monterrey (GMT-6)', value: 'America/Monterrey' }
                  ]}
                />
              </View>
            </CardContent>
          </Card>

          {/* Sección 3: Identidad Visual */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">
                  Identidad Visual
                </ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.field}>
                <Label>URL del Logo</Label>
                <Input
                  value={formData.logoUrl}
                  onChangeText={(text) => updateField('logoUrl', text)}
                  placeholder="https://ejemplo.com/logo.png"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.field}>
                <Label>URL del Favicon</Label>
                <Input
                  value={formData.faviconUrl}
                  onChangeText={(text) => updateField('faviconUrl', text)}
                  placeholder="https://ejemplo.com/favicon.ico"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.field}>
                <Label>Color Primario</Label>
                <Input
                  value={formData.primaryColor}
                  onChangeText={(text) => updateField('primaryColor', text)}
                  placeholder="#f1ef47"
                />
                <View style={[styles.colorPreview, { backgroundColor: formData.primaryColor }]} />
              </View>

              <View style={styles.field}>
                <Label>Color Secundario</Label>
                <Input
                  value={formData.secondaryColor}
                  onChangeText={(text) => updateField('secondaryColor', text)}
                  placeholder="#111827"
                />
                <View style={[styles.colorPreview, { backgroundColor: formData.secondaryColor }]} />
              </View>
            </CardContent>
          </Card>

          {/* Sección 4: SEO */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">
                  SEO y Metadatos
                </ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.field}>
                <Label>Meta Título</Label>
                <Input
                  value={formData.seo.metaTitle}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      seo: { ...prev.seo, metaTitle: text }
                    }))
                  }
                  placeholder="Título para motores de búsqueda"
                />
              </View>

              <View style={styles.field}>
                <Label>Meta Descripción</Label>
                <Textarea
                  value={formData.seo.metaDescription}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      seo: { ...prev.seo, metaDescription: text }
                    }))
                  }
                  placeholder="Descripción para SEO (150-160 caracteres)"
                  rows={3}
                />
                <ThemedText variant="label-small" color="secondary">
                  {formData.seo.metaDescription.length} / 160 caracteres
                </ThemedText>
              </View>

              <View style={styles.field}>
                <Label>Imagen OG (Open Graph)</Label>
                <Input
                  value={formData.seo.ogImage}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      seo: { ...prev.seo, ogImage: text }
                    }))
                  }
                  placeholder="https://ejemplo.com/og-image.jpg"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </CardContent>
          </Card>

          {/* Sección 5: Contacto */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">
                  Información de Contacto
                </ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.field}>
                <Label>Email de Contacto</Label>
                <Input
                  value={formData.contact.email}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, email: text }
                    }))
                  }
                  placeholder="contacto@ejemplo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.field}>
                <Label>Teléfono</Label>
                <Input
                  value={formData.contact.phone}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, phone: text }
                    }))
                  }
                  placeholder="+52 771 123 4567"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.field}>
                <Label>Dirección</Label>
                <Textarea
                  value={formData.contact.address}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, address: text }
                    }))
                  }
                  placeholder="Dirección física del sitio..."
                  rows={2}
                />
              </View>
            </CardContent>
          </Card>

          {/* Sección 6: Redes Sociales */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">
                  Redes Sociales
                </ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.field}>
                <Label>Facebook</Label>
                <Input
                  value={formData.social.facebook}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      social: { ...prev.social, facebook: text }
                    }))
                  }
                  placeholder="https://facebook.com/tupagina"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.field}>
                <Label>Twitter / X</Label>
                <Input
                  value={formData.social.twitter}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      social: { ...prev.social, twitter: text }
                    }))
                  }
                  placeholder="https://twitter.com/tuperfil"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.field}>
                <Label>Instagram</Label>
                <Input
                  value={formData.social.instagram}
                  onChangeText={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      social: { ...prev.social, instagram: text }
                    }))
                  }
                  placeholder="https://instagram.com/tuperfil"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </CardContent>
          </Card>

          {/* Sección 7: Estado */}
          <Card style={styles.section}>
            <CardContent style={styles.cardContent}>
              <View style={styles.switchField}>
                <View style={styles.switchLabel}>
                  <Label>Sitio Principal (Main Site)</Label>
                  <ThemedText variant="body-small" color="secondary">
                    Marca este sitio como el sitio principal del sistema
                  </ThemedText>
                </View>
                <Switch
                  checked={formData.isMainSite}
                  onCheckedChange={(checked) => updateField('isMainSite', checked)}
                />
              </View>

              <View style={styles.switchField}>
                <View style={styles.switchLabel}>
                  <Label>Estado del Sitio</Label>
                  <ThemedText variant="body-small" color="secondary">
                    {formData.isActive ? 'Sitio activo' : 'Sitio desactivado'}
                  </ThemedText>
                </View>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateField('isActive', checked)}
                />
              </View>
            </CardContent>
          </Card>
        </ScrollView>

        {/* Botones de Acción */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.actionButton}
            disabled={createSite.isPending}
          >
            <ThemedText variant="label-medium">Cancelar</ThemedText>
          </Button>

          <Button
            onPress={handleSubmit}
            style={[styles.actionButton, styles.createButton]}
            disabled={createSite.isPending}
          >
            {createSite.isPending ? (
              <>
                <ActivityIndicator size="small" color="#000" />
                <ThemedText style={styles.createButtonText}>
                  Creando...
                </ThemedText>
              </>
            ) : (
              <ThemedText style={styles.createButtonText}>
                🌐 Crear Sitio
              </ThemedText>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  content: {
    flex: 1,
    padding: 16
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%'
  },
  header: {
    marginBottom: 24
  },
  title: {
    color: '#111827',
    marginBottom: 8
  },
  section: {
    marginBottom: 16
  },
  cardContent: {
    gap: 16
  },
  field: {
    gap: 8
  },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  switchLabel: {
    flex: 1,
    gap: 4
  },
  error: {
    color: '#EF4444'
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: 4
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    paddingBottom: 32
  },
  actionButton: {
    flex: 1
  },
  createButton: {
    backgroundColor: '#f1ef47'
  },
  createButtonText: {
    color: '#000000',
    fontWeight: '600'
  }
});
```

#### 4. Pantalla de Edición: `/app/(protected)/sites/[id]/edit.tsx`

Igual que el formulario de creación, pero:
- Título: "Editar Sitio"
- Botón primario: "Guardar Cambios"
- Pre-cargar datos existentes del site

---

## Mejoras Recomendadas para Home

### Problemas Actuales

La pantalla Home actual (`/app/(protected)/(tabs)/home.tsx`) tiene:
1. Sección básica "Dashboard Principal" sin contenido
2. Cards de agentes y sites funcionales pero sin pulir
3. Falta de consistencia visual comparado con extract.tsx

### Propuesta de Mejora

#### 1. Header más profesional

```tsx
<View style={styles.header}>
  <View style={styles.headerTop}>
    <View>
      <ThemedText variant="headline-medium" style={styles.title}>
        Hola, {user?.username || 'Usuario'} 👋
      </ThemedText>
      <ThemedText variant="body-medium" color="secondary">
        {new Date().toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </ThemedText>
    </View>

    {/* Botón de notificaciones o perfil */}
    <Pressable style={styles.avatarButton}>
      <View style={styles.avatar}>
        <ThemedText variant="title-medium" style={styles.avatarText}>
          {user?.username?.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
    </Pressable>
  </View>
</View>

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1ef47',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#000',
    fontWeight: '700'
  }
});
```

#### 2. Stats Grid mejorado

Ya implementado, pero agregar animaciones sutiles:

```tsx
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

<Animated.View
  entering={FadeIn.duration(300)}
  style={styles.statsGrid}
>
  {statsData.map((stat, index) => (
    <Animated.View
      key={stat.title}
      entering={SlideInDown.delay(index * 100).duration(300)}
    >
      <StatsCard {...stat} />
    </Animated.View>
  ))}
</Animated.View>
```

#### 3. Accesos rápidos con iconos grandes

```tsx
<Card style={styles.quickActionsCard}>
  <CardHeader>
    <CardTitle>
      <ThemedText variant="title-medium">Acciones Rápidas</ThemedText>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <View style={styles.quickActionsGrid}>
      <Pressable
        style={styles.quickAction}
        onPress={() => router.push('/outlet/create')}
      >
        <View style={styles.quickActionIcon}>
          <Globe size={32} color="#3b82f6" />
        </View>
        <ThemedText variant="label-medium" style={styles.quickActionText}>
          Nuevo Outlet
        </ThemedText>
      </Pressable>

      <Pressable
        style={styles.quickAction}
        onPress={() => router.push('/agents/create')}
      >
        <View style={styles.quickActionIcon}>
          <Bot size={32} color="#9333ea" />
        </View>
        <ThemedText variant="label-medium" style={styles.quickActionText}>
          Nuevo Agente
        </ThemedText>
      </Pressable>

      <Pressable
        style={styles.quickAction}
        onPress={() => router.push('/sites/create')}
      >
        <View style={styles.quickActionIcon}>
          <PlusCircle size={32} color="#22c55e" />
        </View>
        <ThemedText variant="label-medium" style={styles.quickActionText}>
          Nuevo Sitio
        </ThemedText>
      </Pressable>

      <Pressable
        style={styles.quickAction}
        onPress={() => router.push('/generate')}
      >
        <View style={styles.quickActionIcon}>
          <Sparkles size={32} color="#f59e0b" />
        </View>
        <ThemedText variant="label-medium" style={styles.quickActionText}>
          Generar Contenido
        </ThemedText>
      </Pressable>
    </View>
  </CardContent>
</Card>

const styles = StyleSheet.create({
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  quickAction: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  quickActionText: {
    textAlign: 'center'
  }
});
```

#### 4. Actividad reciente

```tsx
<Card style={styles.activityCard}>
  <CardHeader>
    <View style={styles.activityHeader}>
      <CardTitle>
        <ThemedText variant="title-medium">Actividad Reciente</ThemedText>
      </CardTitle>
      <Pressable onPress={() => router.push('/activity')}>
        <ThemedText variant="label-medium" style={styles.viewAllLink}>
          Ver todo
        </ThemedText>
      </Pressable>
    </View>
  </CardHeader>
  <CardContent>
    {recentActivity.map((activity) => (
      <View key={activity.id} style={styles.activityItem}>
        <View style={styles.activityIconContainer}>
          {getActivityIcon(activity.type)}
        </View>
        <View style={styles.activityContent}>
          <ThemedText variant="label-medium">
            {activity.title}
          </ThemedText>
          <ThemedText variant="label-small" color="secondary">
            {formatRelativeTime(activity.timestamp)}
          </ThemedText>
        </View>
        <Badge variant="secondary">
          <ThemedText variant="label-small">
            {activity.status}
          </ThemedText>
        </Badge>
      </View>
    ))}
  </CardContent>
</Card>

const styles = StyleSheet.create({
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activityContent: {
    flex: 1,
    gap: 4
  },
  viewAllLink: {
    color: '#3b82f6'
  }
});
```

#### 5. Layout final recomendado

```tsx
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Header personalizado */}
        <View style={styles.header}>...</View>

        {/* 2. Stats Grid (4 cards) */}
        <View style={styles.statsGrid}>...</View>

        {/* 3. Acciones Rápidas */}
        <Card style={styles.quickActionsCard}>...</Card>

        {/* 4. Agentes Disponibles (horizontal) */}
        <Card style={styles.agentsSection}>...</Card>

        {/* 5. Sitios Disponibles (horizontal) */}
        <Card style={styles.sitesSection}>...</Card>

        {/* 6. Actividad Reciente */}
        <Card style={styles.activityCard}>...</Card>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Checklist de Implementación

### Para Sites Multi-Tenant

- [ ] Crear `/app/(protected)/(tabs)/sites.tsx` (listado)
- [ ] Crear `/src/components/sites/SiteCard.tsx` (card con stats)
- [ ] Crear `/app/(protected)/sites/create.tsx` (formulario)
- [ ] Crear `/app/(protected)/sites/[id]/edit.tsx` (edición)
- [ ] Crear `/app/(protected)/sites/[id]/index.tsx` (dashboard)
- [ ] Agregar tab "Sites" al bottom navigator
- [ ] Implementar hooks: `useSites`, `useCreateSite`, `useSiteStats`
- [ ] Agregar tipos en `/src/types/site.types.ts`

### Para Mejoras de Home

- [ ] Implementar header personalizado con avatar
- [ ] Crear sección de Acciones Rápidas
- [ ] Implementar Actividad Reciente
- [ ] Agregar animaciones con react-native-reanimated
- [ ] Mejorar espaciado y jerarquía visual
- [ ] Hacer responsive para tablets

---

## Recursos de Referencia

### Archivos Clave para Consultar

**Formularios:**
- `/app/(protected)/agents/create.tsx`
- `/src/components/agents/AgentFormFields.tsx`
- `/app/(protected)/outlet/create.tsx`

**Listados:**
- `/app/(protected)/(tabs)/extract.tsx`
- `/app/(protected)/(tabs)/home.tsx`

**Componentes UI:**
- `/components/ui/card.tsx`
- `/components/ui/badge.tsx`
- `/components/ui/button.tsx`
- `/components/ui/input.tsx`
- `/components/ui/select.tsx`
- `/components/ui/textarea.tsx`
- `/components/ui/switch.tsx`
- `/components/ui/label.tsx`

**Tipografía:**
- `/src/components/ThemedText/ThemedText.tsx`
- `/src/components/ThemedText/utils.ts`

**Stats:**
- `/src/components/stats/StatsCard.tsx`

---

## Notas Finales

Este documento captura los patrones visuales y de interacción más importantes del proyecto. Al crear nuevas pantallas:

1. **Sigue la estructura existente:** SafeAreaView > ScrollView > Cards
2. **Usa los componentes estándar:** No reinventes la rueda
3. **Mantén la paleta de colores:** #f1ef47 para acciones primarias
4. **Aplica responsive:** isTablet con maxWidth 1000px
5. **Agrega loading y empty states:** Nunca dejes pantallas vacías
6. **Valida formularios:** Muestra errores en rojo con mensajes claros
7. **Usa iconos:** lucide-react-native para consistencia

**El estándar de calidad es:** La pantalla de extract.tsx (Outlets) es la referencia de diseño más pulida.

---

**Documentado por:** Jarvis (Claude Code)
**Para:** Coyotito
**Última actualización:** 15 de Octubre de 2025
