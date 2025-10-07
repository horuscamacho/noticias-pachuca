# 🎯 IMPLEMENTACIÓN DE OPTIMIZACIONES DE PROMPTS

## 📋 RESUMEN EJECUTIVO

Se han optimizado DOS flujos de generación de contenido para incluir formato HTML enriquecido y eliminar redundancia:

1. **Generator-Pro** (Existente): Modificación del prompt para generar HTML
2. **Director Editorial** (Nuevo): Sistema completo para instrucciones libres del usuario

---

## 🔧 1. MODIFICACIONES PARA GENERATOR-PRO

### Archivo a Modificar
`/packages/api-nueva/src/generator-pro/services/generator-pro-prompt-builder.service.ts`

### Cambios Específicos

#### A. Reemplazar `contentLengthInstructions` (líneas 84-140)

```typescript
const contentLengthInstructions = `
📝 EXTENSIÓN MÍNIMA OBLIGATORIA DEL CONTENIDO PRINCIPAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MÍNIMO: 800 palabras | IDEAL: 1000-1200 palabras | MÁXIMO: 1500 palabras

⚠️ FORMATO HTML OBLIGATORIO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
El campo "content" DEBE contener HTML válido y semántico. NO usar markdown, NO usar backticks.

TAGS HTML PERMITIDOS Y REQUERIDOS:
• <h2> para títulos de sección principal (3-4 por artículo)
• <h3> para subtítulos dentro de secciones (2-3 por sección mayor)
• <p> para CADA párrafo (obligatorio, NO texto suelto)
• <strong> para énfasis fuerte en puntos clave
• <em> para énfasis suave o citas indirectas
• <ul> y <li> para listas con viñetas
• <ol> y <li> para listas numeradas
• <br> SOLO si necesitas salto de línea dentro de un párrafo
• <blockquote> para citas textuales importantes

[... resto del contenido como está en el prompt completo arriba ...]
`;
```

#### B. Modificar la sección del `userPrompt` (líneas 243-292)

Agregar instrucciones explícitas de HTML en el ejemplo de JSON:

```typescript
"content": "<h2>Título de Primera Sección</h2><p><strong>Lead impactante</strong> que capture la atención...</p><p>Segundo párrafo con contexto...</p><h2>Desarrollo y Contexto</h2><p>Antecedentes del tema...</p><ul><li>Punto clave 1</li><li>Punto clave 2</li></ul>..."
```

### Validación en Frontend

El frontend debe renderizar el HTML directamente:

```tsx
// En el componente de visualización
<div
  className="article-content"
  dangerouslySetInnerHTML={{ __html: generatedContent.content }}
/>
```

---

## 🆕 2. IMPLEMENTACIÓN DE DIRECTOR EDITORIAL

### Nuevo Archivo Creado
`/packages/api-nueva/src/generator-pro/services/director-editorial-prompt-builder.service.ts`

### Integración en el Módulo

```typescript
// En generator-pro.module.ts
import { DirectorEditorialPromptBuilderService } from './services/director-editorial-prompt-builder.service';

@Module({
  providers: [
    // ... otros servicios
    DirectorEditorialPromptBuilderService,
  ],
  exports: [
    // ... otros exports
    DirectorEditorialPromptBuilderService,
  ],
})
```

### Crear Endpoint para Director Editorial

```typescript
// En generator-pro.controller.ts

@Post('director-editorial')
@UseGuards(JwtAuthGuard)
async generateFromDirectorEditorial(
  @Body() dto: {
    instructions: string;
    language?: 'es' | 'en';
  },
  @Req() req: any,
) {
  return this.generatorProService.generateFromDirectorEditorial({
    instructions: dto.instructions,
    language: dto.language || 'es',
    userId: req.user.id,
  });
}
```

### Método en el Servicio Principal

```typescript
// En generator-pro.service.ts

async generateFromDirectorEditorial(params: {
  instructions: string;
  language: 'es' | 'en';
  userId: string;
}) {
  // 1. Construir prompt
  const { systemPrompt, userPrompt, agentProfile } =
    this.directorEditorialPromptBuilder.buildPrompt({
      userInstructions: params.instructions,
      language: params.language,
    });

  // 2. Llamar a OpenAI
  const completion = await this.openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  // 3. Parsear y validar
  const generated = JSON.parse(completion.choices[0].message.content);

  // 4. Validar output
  const validation = this.directorEditorialPromptBuilder.validateOutput(generated);
  if (!validation.isValid) {
    throw new BadRequestException(`Generación inválida: ${validation.errors.join(', ')}`);
  }

  // 5. Guardar en base de datos
  const job = new this.jobModel({
    userId: params.userId,
    type: 'director-editorial',
    status: 'completed',
    input: { instructions: params.instructions },
    output: generated,
    agentProfile,
    createdAt: new Date(),
  });

  await job.save();

  return {
    success: true,
    jobId: job._id,
    content: generated,
  };
}
```

---

## 🎨 3. CAMBIOS EN EL FRONTEND

### Nuevo Componente para Director Editorial

```tsx
// /packages/dash-coyote/src/features/generator-pro/components/DirectorEditorial.tsx

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function DirectorEditorial() {
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generator-pro/director-editorial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          instructions,
          language: 'es',
        }),
      });

      const data = await response.json();
      setResult(data.content);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Director Editorial</h2>
        <p className="text-muted-foreground mb-4">
          Escribe instrucciones libres sobre lo que quieres publicar.
          El Informante Pachuqueño generará el artículo completo.
        </p>

        <Textarea
          placeholder="Ejemplo: Quiero un artículo sobre el nuevo hospital que van a construir en Pachuca, será el más moderno de Hidalgo, tendrá 200 camas, costará 500 millones de pesos..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
          className="mb-4"
        />

        <Button
          onClick={handleGenerate}
          disabled={!instructions || generating}
        >
          {generating ? 'Generando...' : 'Generar Artículo'}
        </Button>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">{result.title}</h3>

          {/* Renderizar HTML directamente */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: result.content }}
          />

          {/* Social Media Copys */}
          <div className="mt-6 space-y-4">
            <div>
              <h4 className="font-semibold">Facebook:</h4>
              <p>{result.socialMediaCopies.facebook.copy}</p>
            </div>
            <div>
              <h4 className="font-semibold">Twitter:</h4>
              <p>{result.socialMediaCopies.twitter.tweet}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### Renderizado de HTML en Contenido Existente

Para todos los componentes que muestran `content`:

```tsx
// ANTES (texto plano)
<p>{content}</p>

// DESPUÉS (HTML renderizado)
<div
  className="prose prose-lg max-w-none"
  dangerouslySetInnerHTML={{ __html: content }}
/>
```

---

## ✅ 4. CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Modificar `generator-pro-prompt-builder.service.ts` con nuevo prompt HTML
- [ ] Agregar `director-editorial-prompt-builder.service.ts`
- [ ] Registrar nuevo servicio en módulo
- [ ] Crear endpoint `/director-editorial` en controller
- [ ] Implementar método `generateFromDirectorEditorial` en servicio
- [ ] Actualizar esquemas si es necesario

### Frontend
- [ ] Crear componente `DirectorEditorial.tsx`
- [ ] Agregar ruta para Director Editorial
- [ ] Modificar renderizado para usar `dangerouslySetInnerHTML`
- [ ] Agregar estilos CSS para contenido HTML (prose)
- [ ] Testear formato HTML en visualización

### Testing
- [ ] Probar generación con Generator-Pro (debe generar HTML)
- [ ] Probar Director Editorial con instrucciones en español
- [ ] Probar Director Editorial con instrucciones en inglés
- [ ] Verificar anti-redundancia con instrucciones repetitivas
- [ ] Validar mínimo 800 palabras
- [ ] Verificar formato HTML correcto

---

## 🚀 5. BENEFICIOS ESPERADOS

1. **Formato Enriquecido**: Artículos con estructura HTML profesional
2. **Sin Redundancia**: Contenido variado aunque las instrucciones sean repetitivas
3. **Flexibilidad**: Usuario puede dar instrucciones libres en cualquier formato
4. **Bilingüe**: Acepta inglés y genera español mexicano natural
5. **Extensión Garantizada**: Siempre 800+ palabras
6. **SEO Optimizado**: HTML semántico para mejor indexación
7. **UX Mejorada**: Lectura más agradable con formato apropiado

---

## 📝 NOTAS TÉCNICAS

### Modelos Recomendados
- **Producción**: GPT-4-turbo o GPT-4
- **Desarrollo**: GPT-3.5-turbo (más económico para pruebas)
- **Alternativa**: Claude 3 Sonnet/Opus

### Configuración OpenAI
```typescript
{
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,  // Balance creatividad/consistencia
  max_tokens: 4000,  // Suficiente para 800+ palabras
  response_format: { type: 'json_object' },  // JSON garantizado
}
```

### Sanitización HTML (Opcional pero Recomendado)
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Antes de guardar o mostrar
const cleanHTML = DOMPurify.sanitize(generated.content, {
  ALLOWED_TAGS: ['h2', 'h3', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'br'],
  ALLOWED_ATTR: [],
});
```

---

## 🔍 EJEMPLOS DE USO

### Director Editorial - Instrucción Redundante
**Input del usuario:**
```
"Quiero publicar sobre el nuevo parque, el nuevo parque es muy grande,
el parque tiene muchos árboles, en el parque hay juegos para niños,
el parque está en el centro, el parque es bonito"
```

**Output esperado:**
- Artículo NO redundante de 800+ palabras
- Información variada sobre el parque
- Contexto adicional (historia, impacto, comparaciones)
- HTML estructurado con secciones claras

### Generator-Pro - HTML Output
**Antes:**
```
"Pachuca inaugura nuevo hospital. El hospital cuenta con..."
```

**Ahora:**
```html
<h2>Inauguración Histórica en el Sector Salud</h2>
<p><strong>Pachuca marca un hito</strong> en la infraestructura médica...</p>
<p>El nuevo complejo hospitalario...</p>
```

---

## 📞 SOPORTE

Para dudas sobre la implementación:
1. Revisar este documento
2. Verificar los prompts completos en los archivos
3. Testear con diferentes inputs
4. Validar HTML output