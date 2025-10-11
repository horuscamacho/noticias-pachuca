# 📱 Guía de Usuario: Generación de Imágenes AI

**Versión**: 1.0
**Fecha**: 11 de Octubre, 2025
**Audiencia**: Equipo editorial de Pachuca Noticias

---

## 🎯 ¿Qué es este feature?

El generador de imágenes AI te permite crear imágenes personalizadas con marca "NOTICIAS PACHUCA" para tus artículos. Las imágenes se generan automáticamente con inteligencia artificial y se optimizan en múltiples formatos para web y móvil.

### ¿Cuándo usar imágenes AI?

✅ **SÍ usar para**:
- Ilustraciones conceptuales de noticias
- Headers de artículos sin foto disponible
- Gráficos decorativos
- Imágenes de opinión o editoriales
- Representaciones visuales de temas abstractos

❌ **NO usar para**:
- Fotoperiodismo
- Eventos en vivo
- Personas específicas
- Evidencia de hechos
- Contenido que requiera autenticidad fotográfica

> ⚠️ **IMPORTANTE**: Todas las imágenes generadas llevan la etiqueta "AI-GENERATED" visible. Esto es un requisito ético y legal.

---

## 🚀 Generación Individual

### Paso 1: Encontrar la imagen base
1. Abre la app Pachuca Noticias
2. Ve al tab **"Imágenes"** (ícono de fotos apiladas)
3. Navega por el banco de imágenes extraídas
4. Toca una imagen para ver su detalle

### Paso 2: Abrir el generador
```
┌─────────────────────────────┐
│ ← Detalle de Imagen         │ ← Header
├─────────────────────────────┤
│                             │
│   [Imagen del contenido]    │
│                             │
├─────────────────────────────┤
│ Metadatos                   │
│ • Fuente: ejemplo.com       │
│ • Fecha: Hace 2 horas       │
│ • Título: "..."             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │  ✨ Generar con IA      │ │ ← Botón amarillo
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Paso 3: Configurar la generación

Al presionar "Generar con IA", se abre el modal:

```
┌─────────────────────────────┐
│ Generar Imagen AI       [X] │
├─────────────────────────────┤
│                             │
│ Prompt:                     │
│ ┌─────────────────────────┐ │
│ │ Noticia de tecnología... │ │
│ └─────────────────────────┘ │
│ 157/2000 caracteres         │
│                             │
│ Calidad:                    │
│ ○ Baja ($0.01) - Rápido    │
│ ⦿ Media ($0.04) ✓           │
│ ○ Alta ($0.17) - Premium    │
│                             │
│ Branding:                   │
│ ☑ Incluir decoraciones      │
│                             │
│ Keywords:                   │
│ ┌─────────────────────────┐ │
│ │ + Agregar keyword        │ │
│ └─────────────────────────┘ │
│ [tecnología] [innovación]   │
│                             │
├─────────────────────────────┤
│ Costo estimado: $0.04       │
│                             │
│ ┌─────────────────────────┐ │
│ │    Generar Imagen       │ │ ← Botón amarillo
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Tips de prompt**:
- Sé específico: "Un smartphone moderno sobre escritorio"
- Evita personas específicas: "Un político sonriendo" → "Edificio del congreso"
- Usa keywords relevantes: Máximo 5
- El título de la noticia se usa como base

### Paso 4: Ver el progreso

Tras presionar "Generar", verás el progreso en tiempo real:

```
┌─────────────────────────────┐
│ ← Generación AI             │
├─────────────────────────────┤
│                             │
│ Generando imagen...         │
│                             │
│ [████████░░░░░░░░░░] 60%    │
│                             │
│ ✓ Preparando solicitud      │
│ ✓ Generando imagen AI       │
│ ● Procesando decoraciones   │ ← Paso actual
│ ○ Subiendo a storage        │
│ ○ Completado                │
│                             │
│ Costo: $0.04                │
│                             │
│ ┌─────────────────────────┐ │
│ │ Logs:                   │ │
│ │ 10:30:45 - Starting...  │ │
│ │ 10:30:47 - OpenAI API   │ │
│ │ 10:31:02 - Processing   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Tiempo estimado**: 15-30 segundos

### Paso 5: Ver el resultado

Al completar:

```
┌─────────────────────────────┐
│ ← Generación AI             │
├─────────────────────────────┤
│ [AI-GENERATED] 🔴           │ ← Badge rojo
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │   [Imagen generada]     │ │
│ │                         │ │
│ │   "NOTICIAS PACHUCA" →  │ │ ← Watermark
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Metadata                │ │
│ │ • Modelo: gpt-image-1   │ │
│ │ • Calidad: Media        │ │
│ │ • Tamaño: 1024×1024     │ │
│ │ • Costo: $0.04          │ │
│ │ • Prompt: "..."         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  💾 Almacenar en banco  │ │ ← Botón principal
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  🔄 Regenerar           │ │ ← Botón secundario
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  ✕ Cerrar               │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Opciones**:
- **Almacenar**: Guarda en el banco de imágenes (12 formatos)
- **Regenerar**: Genera nueva versión con mismo prompt
- **Cerrar**: Descarta la imagen

---

## 🚀 Generación Batch (Múltiples imágenes)

### Paso 1: Seleccionar imágenes
1. En el tab **"Imágenes"**
2. Mantén presionada una imagen (long-press)
3. Modo selección se activa
4. Toca más imágenes para seleccionar

```
┌─────────────────────────────┐
│ [X] 5 seleccionadas  [Todo] │
├─────────────────────────────┤
│ ┌──────┬──────┬──────┐      │
│ │ [✓]  │ [✓]  │      │      │ ← Checkmarks amarillos
│ │ img1 │ img2 │ img3 │      │
│ ├──────┼──────┼──────┤      │
│ │ [✓]  │ [✓]  │      │      │
│ │ img4 │ img5 │ img6 │      │
│ └──────┴──────┴──────┘      │
└─────────────────────────────┘
```

### Paso 2: Iniciar batch generation

Al seleccionar, aparece la barra de acciones:

```
┌─────────────────────────────┐
│ ┌───────────┬─────────────┐ │
│ │ ✨ Generar│ 💾 Almacenar│ │
│ │ IA (5)    │ (5)         │ │ ← Dos botones
│ └───────────┴─────────────┘ │
└─────────────────────────────┘
```

### Paso 3: Configurar (igual que individual)

El modal es el mismo, pero la configuración se aplica a todas:

```
Prompt: "Generar 5 imágenes para noticias"
Calidad: Media ($0.04 × 5 = $0.20)
```

### Paso 4: Ver progreso batch

Tras presionar "Generar":

```
┌─────────────────────────────┐
│ ← Generación Batch AI   [X] │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Resumen de Generación   │ │
│ │ • Total: 5              │ │
│ │ • Completadas: 3 ✓      │ │ ← Actualiza en vivo
│ │ • Fallidas: 0           │ │
│ │ • Costo total: $0.20    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 💾 Almacenar todas (5)  │ │ ← Aparece cuando completa
│ └─────────────────────────┘ │
│                             │
│ ┌──────┬──────┐             │
│ │ ✓    │ ●    │             │ ← Grid 2 columnas
│ │[img1]│[....] │ Img 2      │
│ │      │ 60%  │             │
│ ├──────┼──────┤             │
│ │ ✓    │ ○    │             │
│ │[img3]│ Q... │ Img 4      │
│ │Store │      │             │
│ ├──────┼──────┤             │
│ │ ○    │      │             │
│ │ Q... │      │ Img 5      │
│ └──────┴──────┘             │
└─────────────────────────────┘
```

**Estados por imagen**:
- ✓ Verde: Completada
- ● Amarillo: En progreso (con %)
- ○ Gris: En cola
- ✗ Rojo: Fallida

### Paso 5: Almacenar todas

Al completar, dos opciones:
1. **"Almacenar todas"**: Guarda las 5 en el banco
2. **Almacenar individual**: Toca "Store" en cada imagen

---

## 📊 Monitoreo de Uso

### Ver estadísticas personales

En el endpoint `/stats/summary` (o UI futura):

```json
{
  "totalGenerations": 47,
  "totalCost": 2.35,
  "averageCost": 0.05,
  "byQuality": {
    "low": 5,
    "medium": 40,
    "high": 2
  },
  "lastGeneration": "2025-10-11T10:30:00Z"
}
```

### Límites y presupuesto

**Presupuesto mensual**: $60
**Límite sugerido**: 50 imágenes/día
**Costo promedio**: $0.04 (medium quality)

**Cálculo rápido**:
- 10 imágenes = $0.40
- 50 imágenes = $2.00/día
- 1 mes (30 días) = $60

---

## ❓ FAQ

### ¿Puedo generar fotos de personas específicas?
**No**. El modelo no genera rostros de personas reales por políticas de OpenAI. Usa imágenes genéricas o conceptuales.

### ¿Cuánto tarda la generación?
**15-30 segundos** en promedio:
- API OpenAI: ~10s
- Processing: ~5s
- Upload S3: ~3s
- Total: ~18s

### ¿Puedo editar la imagen después?
**No directamente**. Puedes:
1. Regenerar con prompt modificado
2. Descargar y editar manualmente
3. (Futuro) Usar endpoint `/edit` para inpainting

### ¿Las imágenes tienen copyright?
Según políticas de OpenAI:
- Imágenes generadas por ti son tuyas
- No infringen copyright existente
- Debes etiquetar como AI-generated (✅ automático)

### ¿Puedo usar calidad alta siempre?
**No recomendado**. Calidad alta cuesta $0.17 vs $0.04 medium (4.25x más). Úsala solo para:
- Portadas de artículos importantes
- Imágenes hero de homepage
- Campañas especiales

### ¿Qué pasa si falla la generación?
El sistema reintenta automáticamente 1 vez. Si falla:
1. Verifica tu prompt (sin contenido prohibido)
2. Revisa la conexión
3. Intenta calidad más baja
4. Contacta soporte si persiste

### ¿Puedo borrar una generación?
**Sí**. Usa endpoint `DELETE /image-generation/:id`. Nota:
- Se borra registro de generación
- Si ya está en banco, permanece allí
- No se reembolsa el costo

---

## 🎨 Tips para buenos prompts

### ✅ Buenos ejemplos
```
"Un smartphone moderno sobre un escritorio de oficina,
iluminación natural, estilo profesional"

"Vista aérea de una ciudad con tráfico intenso,
hora pico, tonos cálidos"

"Libros apilados con gafas de lectura, fondo blanco,
estilo minimalista"
```

### ❌ Malos ejemplos
```
"Andrés Manuel López Obrador en conferencia"
→ No genera personas específicas

"Foto del accidente en la carretera"
→ No es apropiado para IA

"Imagen"
→ Muy vago, resultado impredecible
```

### Estructura recomendada
```
[Sujeto principal] + [Contexto] + [Estilo] + [Iluminación]

Ejemplo:
"Laptop abierta en café → con taza de café al lado →
estilo cálido → iluminación suave de tarde"
```

---

## 📞 Soporte

**Problemas técnicos**: soporte@pachuca-noticias.com
**Dudas editoriales**: editor@pachuca-noticias.com
**Bug reports**: GitHub Issues

---

## ✅ Checklist Pre-Publicación

Antes de usar una imagen AI en un artículo:

- [ ] La imagen tiene la etiqueta "AI-GENERATED" visible
- [ ] El prompt no incluye personas/lugares/eventos específicos
- [ ] La imagen no se presenta como fotoperiodismo
- [ ] El contexto del artículo deja claro que es ilustrativa
- [ ] Se almacenó correctamente en el banco (12 formatos)
- [ ] Se agregaron keywords relevantes para búsqueda
- [ ] El alt text describe la imagen claramente

---

**📱 ¡Listo para generar imágenes increíbles con IA!**

_Recuerda: Las imágenes AI son herramientas poderosas, pero la responsabilidad editorial es tuya. Úsalas con criterio._
