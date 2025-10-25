# Mejores Prácticas Editoriales para Enriquecimiento HTML en Noticias Digitales 2025-2026

**Investigación Técnica - Generado: 2025-10-21**
**Proyecto:** Sistema de Generación de Noticias con IA - Noticias Pachuca

---

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Mejores Prácticas Encontradas](#mejores-prácticas-encontradas)
3. [Análisis de Medios Digitales](#análisis-de-medios-digitales)
4. [Reglas Específicas para Implementación](#reglas-específicas-para-implementación)
5. [Ejemplos Antes/Después](#ejemplos-antesdespués)
6. [Referencias y Fuentes](#referencias-y-fuentes)

---

## Resumen Ejecutivo

### Hallazgos Clave

La investigación reveló que el enriquecimiento HTML estratégico en noticias digitales para 2025-2026 se centra en tres pilares fundamentales:

1. **Uso Semántico Correcto**: Diferenciar entre estilo visual (`<b>`, `<i>`) y significado semántico (`<strong>`, `<em>`)
2. **Escaneabilidad (Scanability)**: 79% de usuarios escanean contenido en lugar de leer palabra por palabra
3. **SEO y Accesibilidad**: Los motores de búsqueda con IA (Google SGE, Bing AI) dependen fuertemente de señales semánticas

### Impacto Medido

- **47% mejora** en escaneabilidad con jerarquía tipográfica estructurada
- **22% reducción** en tiempo de completar tareas con layouts organizados
- **40% de marketers** proyectan mayor dependencia de contenido visual para finales de 2025

---

## Mejores Prácticas Encontradas

### 1. Diferencias Semánticas: `<strong>` vs `<b>` y `<em>` vs `<i>`

#### HTML5 - Significado Semántico

| Tag | Significado | Uso en Periodismo | Accesibilidad |
|-----|-------------|-------------------|---------------|
| **`<strong>`** | Importancia fuerte, peso semántico | Conceptos clave, datos críticos, advertencias | Screen readers pueden enfatizar (configuración del usuario) |
| **`<b>`** | Texto visualmente destacado sin importancia extra | Palabras clave en extractos, inicio de artículos | Sin anuncio en screen readers |
| **`<em>`** | Énfasis de entonación (se pronunciaría diferente) | Citas con énfasis, opiniones, contexto emocional | Posible anuncio en screen readers (limitado) |
| **`<i>`** | Voz alternativa, términos técnicos | Palabras extranjeras, términos técnicos, nombres de barcos | Sin anuncio en screen readers |

#### Consideraciones Importantes

**Accesibilidad (WCAG 2025):**
- La mayoría de screen readers NO anuncian `<em>` y `<strong>` por defecto
- NVDA eliminó anuncios de énfasis en 2015.4 tras quejas de usuarios
- **Mejor práctica**: Comunicar énfasis a través de elección de palabras, no solo etiquetas HTML

**SEO (2025):**
- Google SGE y Bing AI interpretan señales semánticas para extraer jerarquía
- `<strong>` y `<em>` pueden influir en snippets enriquecidos y búsqueda por voz
- No hay penalización por usar `<b>` o `<i>`, pero hay menor contexto semántico

### 2. Estructura Semántica para Artículos de Noticias

```html
<article>
  <header>
    <h1>Título Principal del Artículo</h1>
    <p class="kicker">Categoría o Contexto</p>
    <div class="article-meta">
      <span class="author">Por Nombre del Autor</span>
      <time datetime="2025-10-21">21 de octubre, 2025</time>
    </div>
  </header>

  <section class="lead">
    <p><strong>Lead paragraph con información crítica</strong></p>
  </section>

  <section class="content">
    <!-- Contenido principal -->
    <p>Texto regular con <strong>conceptos importantes</strong> y <em>énfasis contextual</em>.</p>
  </section>

  <aside>
    <blockquote cite="https://source.com">
      <p>Texto de la cita textual</p>
    </blockquote>
    <figcaption>
      <cite>Nombre de la Fuente</cite>, Cargo o Contexto
    </figcaption>
  </aside>

  <footer>
    <!-- Tags, compartir, autor info -->
  </footer>
</article>
```

#### Elementos Clave

1. **Un solo `<h1>` por artículo** - Título principal
2. **`<h2>` a `<h6>` anidados lógicamente** - Subtítulos jerárquicos
3. **`<time datetime="YYYY-MM-DD">`** - Fechas legibles por máquinas y humanos
4. **`<article>`** - Contenedor semántico para contenido autocontenido
5. **`<section>`** - Agrupación temática de contenido
6. **`<aside>`** - Contenido relacionado pero no esencial (citas, datos adicionales)

### 3. Uso de Blockquotes y Citas

#### Mejores Prácticas para Citas (2025)

**Estructura Correcta:**
```html
<figure>
  <blockquote cite="https://source-url.com">
    <p>Texto exacto de la cita sin comillas HTML (se agregan con CSS)</p>
  </blockquote>
  <figcaption>
    <cite>Título de la Obra o Fuente</cite>, Contexto adicional
  </figcaption>
</figure>
```

**Errores Comunes a Evitar:**
- ❌ No incluir la atribución dentro del `<blockquote>` (sería parte de la cita)
- ❌ No usar `<blockquote>` solo para sangría visual (usar CSS)
- ❌ No usar `<cite>` para nombres de personas (solo títulos de obras/fuentes)

**Recomendaciones:**
- **Límite: 1-2 pull quotes por artículo** para mantener impacto
- Usar atributo `cite=""` con URL de fuente original
- Para citas inline cortas, usar `<q>` en lugar de `<blockquote>`

### 4. Escaneabilidad y Jerarquía Visual

#### Patrones de Escaneo Identificados

**Investigación Nielsen Norman Group:**
- 79% de usuarios escanean páginas nuevas
- Solo 16% leen palabra por palabra
- Usuarios buscan palabras clave relevantes en patrón de "manchas" (spotted pattern)

#### Elementos que Mejoran Escaneabilidad

**Tipografía:**
- Headers en **negrita** con tamaño mayor (h2: 24-28px, h3: 18-22px)
- Body text regular (16-18px)
- Diferenciación clara entre títulos y cuerpo

**Estructura:**
```html
<!-- CORRECTO: Estructura escaneable -->
<article>
  <h2>Subtítulo Descriptivo</h2>

  <p>Párrafo corto introductorio con <strong>concepto clave</strong>.</p>

  <ul>
    <li><strong>Punto importante 1:</strong> Explicación breve</li>
    <li><strong>Punto importante 2:</strong> Explicación breve</li>
    <li><strong>Punto importante 3:</strong> Explicación breve</li>
  </ul>

  <p>Continuación con <strong>datos relevantes</strong> destacados.</p>
</article>
```

**Espaciado:**
- Párrafos cortos: 2-3 oraciones máximo
- Espacio en blanco estratégico entre secciones
- Márgenes generosos alrededor de elementos importantes

### 5. Datos, Números y Estadísticas

#### Formato para Datos Numéricos

**Principio Periodístico: Pirámide Invertida**
- Información más importante primero (Quién, Qué, Cuándo, Dónde, Por qué)
- Datos críticos en negritas para escaneo rápido
- Contexto adicional después

**Ejemplo de Formato:**
```html
<p>
  El gobierno anunció una inversión de
  <strong>500 millones de pesos</strong> para infraestructura,
  beneficiando a <strong>15 municipios</strong> de la región durante
  <strong>2025-2026</strong>.
</p>

<!-- Para datos complejos, usar tablas semánticas -->
<table>
  <caption>Distribución de Inversión por Municipio</caption>
  <thead>
    <tr>
      <th>Municipio</th>
      <th>Monto (MXN)</th>
      <th>Proyectos</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Pachuca</strong></td>
      <td>150,000,000</td>
      <td>12</td>
    </tr>
    <!-- más filas -->
  </tbody>
</table>
```

#### Cuándo Usar Negritas en Datos

**SÍ usar `<strong>` para:**
- Cifras específicas importantes (presupuestos, estadísticas clave)
- Porcentajes relevantes
- Fechas críticas
- Rangos numéricos significativos

**NO usar `<strong>` para:**
- Todos los números (pierde impacto)
- Datos secundarios o contextuales
- Cálculos derivados no esenciales

### 6. Nombres, Instituciones y Entidades

#### Patrón Editorial Observado

**Ejemplo de referencia (estilo Quadratín):**
```html
<p>
  El secretario de <strong>Desarrollo Social</strong>,
  <strong>Juan Pérez García</strong>, anunció que la
  <strong>Secretaría de Hacienda y Crédito Público (SHCP)</strong>
  autorizó recursos para programas sociales.
</p>
```

#### Reglas de Aplicación

**Primera mención:**
- Nombres completos de personas: `<strong>Nombre Completo</strong>`
- Instituciones completas: `<strong>Nombre Institución (SIGLAS)</strong>`
- Cargos oficiales importantes: `<strong>Cargo</strong>`

**Menciones subsecuentes:**
- Apellido solo: Pérez García (sin `<strong>`)
- Siglas: SHCP (sin `<strong>`)
- Pronombres: él, ella, la institución (sin `<strong>`)

**Excepciones:**
- Figuras de alta relevancia (presidente, gobernador) pueden mantener `<strong>` en múltiples menciones
- Instituciones centrales del artículo pueden mantener énfasis

---

## Análisis de Medios Digitales

### Tendencias Observadas en Medios Líderes 2025

#### The New York Times
**Estructura editorial:**
- Uso de algoritmos editoriales con juicio humano para curación de homepage
- Publican +250 historias/día, destacan 50-60 en homepage
- Énfasis en jerarquía visual clara y metadatos estructurados

**HTML Structure:**
- Uso extensivo de `<article>`, `<section>`, `<header>`, `<footer>`
- Metadatos ricos (autor, fecha, categoría) en formato schema.org
- Imágenes destacadas con `<figure>` y `<figcaption>`

#### BBC News
**Características:**
- Tipografía: Headlines en fuente bold y autoritaria, body text legible
- Uso consistente de semantic markup
- Estructura modular para fácil mantenimiento

**Patrones de énfasis:**
- Negritas para: datos clave, nombres en primera mención, cifras importantes
- Citas en `<blockquote>` con styling visual distintivo
- Listas para información escaneable

#### Medios de Habla Hispana

**Patrones comunes (El País, otros medios líderes):**
- Lead paragraph frecuentemente en negrita parcial o completa
- Datos numéricos destacados con `<strong>`
- Nombres de instituciones en primera mención con énfasis
- Uso de "kickers" (antetítulos) para contexto

### Estándares de Contenido AI-Generated (2025)

#### Google's Guidelines para Contenido con IA

**Criterio E-E-A-T:**
- **Experience** (Experiencia)
- **Expertise** (Experticia)
- **Authoritativeness** (Autoridad)
- **Trustworthiness** (Confiabilidad)

**Recomendaciones:**
- Revisión humana obligatoria antes de publicación
- Mantener intención del usuario y originalidad
- No requiere etiquetar contenido generado por IA
- Evaluadores de calidad identifican contenido AI de menor calidad

#### Microsoft's Principles para AI Content

1. **Revisión de autor**: Todo contenido AI revisado por humanos
2. **Validación estándar**: Verificar errores de formato
3. **Lenguaje apropiado e inclusivo**
4. **Compliance review**: Adherencia a estándares legales, éticos, regulatorios

---

## Reglas Específicas para Implementación

### Sistema de Reglas para Prompt de IA

#### REGLA 1: Uso de `<strong>` (Importancia Semántica)

**APLICAR `<strong>` PARA:**

1. **Conceptos Clave y Términos Importantes**
   ```html
   <p>La reforma aborda el tema de <strong>seguridad ciudadana</strong> como prioridad.</p>
   ```

2. **Datos Numéricos Críticos**
   ```html
   <p>El presupuesto asciende a <strong>850 millones de pesos</strong>.</p>
   <p>La inflación alcanzó <strong>4.5%</strong> en octubre.</p>
   <p>Beneficiará a <strong>12,500 familias</strong> en la región.</p>
   ```

3. **Nombres Propios en Primera Mención**
   ```html
   <!-- Primera mención -->
   <p><strong>María González López</strong>, secretaria de Educación, anunció...</p>

   <!-- Menciones posteriores (sin strong) -->
   <p>González López detalló que...</p>
   <p>La funcionaria agregó que...</p>
   ```

4. **Instituciones y Organizaciones Importantes**
   ```html
   <!-- Primera mención con siglas -->
   <p>La <strong>Secretaría de Medio Ambiente y Recursos Naturales (SEMARNAT)</strong> publicó...</p>

   <!-- Menciones posteriores -->
   <p>La SEMARNAT indicó que...</p>
   ```

5. **Cargos Oficiales de Alto Nivel (Primera Mención)**
   ```html
   <p>El <strong>gobernador de Hidalgo</strong>, Juan Pérez, declaró...</p>
   ```

6. **Fechas y Plazos Críticos**
   ```html
   <p>El proyecto debe completarse antes del <strong>31 de diciembre de 2025</strong>.</p>
   ```

7. **Ubicaciones Específicas Relevantes**
   ```html
   <p>Los trabajos se realizarán en <strong>Boulevard Felipe Ángeles</strong>.</p>
   ```

8. **Resultados y Conclusiones Principales**
   ```html
   <p>El estudio concluyó que <strong>el 65% de los encuestados apoya la iniciativa</strong>.</p>
   ```

**NO APLICAR `<strong>` PARA:**
- Todos los números (solo los críticos)
- Palabras comunes repetidas
- Conectores o artículos
- Datos secundarios o de contexto menor

#### REGLA 2: Uso de `<em>` (Énfasis de Entonación)

**APLICAR `<em>` PARA:**

1. **Énfasis que Cambia Significado**
   ```html
   <p>El funcionario negó <em>categóricamente</em> las acusaciones.</p>
   <p>No se trata de un problema <em>menor</em>, advirtió el experto.</p>
   ```

2. **Palabras o Frases Destacadas en Citas**
   ```html
   <p>"Esto es <em>absolutamente inaceptable</em>", declaró el alcalde.</p>
   ```

3. **Contexto Emocional o de Opinión**
   ```html
   <p>Los residentes expresaron estar <em>profundamente preocupados</em> por la situación.</p>
   ```

4. **Contraste o Comparación**
   ```html
   <p>A diferencia de años anteriores, <em>este año</em> se priorizará la infraestructura.</p>
   ```

**LÍMITE:** Máximo 2-3 usos de `<em>` por artículo para mantener impacto.

#### REGLA 3: Uso de `<blockquote>` (Citas Textuales)

**ESTRUCTURA REQUERIDA:**
```html
<figure>
  <blockquote cite="URL_FUENTE_SI_DISPONIBLE">
    <p>Texto exacto de la declaración o cita</p>
  </blockquote>
  <figcaption>
    <cite>Nombre de la Persona</cite>, Cargo o Contexto
  </figcaption>
</figure>
```

**CUÁNDO USAR:**
- Declaraciones directas de fuentes oficiales
- Citas textuales relevantes (mínimo 20 palabras)
- Máximo 1-2 blockquotes por artículo estándar

**PARA CITAS CORTAS (inline):**
```html
<p>El funcionario dijo que <q>la situación está bajo control</q>.</p>
```

#### REGLA 4: Listas y Estructura

**USAR `<ul>` PARA LISTAS NO ORDENADAS:**
```html
<p>Los beneficios del programa incluyen:</p>
<ul>
  <li><strong>Apoyo económico:</strong> Hasta 5,000 pesos mensuales</li>
  <li><strong>Capacitación:</strong> Talleres técnicos gratuitos</li>
  <li><strong>Seguimiento:</strong> Acompañamiento durante 6 meses</li>
</ul>
```

**USAR `<ol>` PARA PROCESOS O SECUENCIAS:**
```html
<p>El proceso de inscripción consta de:</p>
<ol>
  <li>Registro en línea en el portal oficial</li>
  <li>Carga de documentos requeridos</li>
  <li>Validación por parte de la autoridad</li>
  <li>Notificación de aceptación</li>
</ol>
```

#### REGLA 5: Párrafos y Legibilidad

**ESTRUCTURA DE PÁRRAFOS:**
- **Lead paragraph**: Primera oración o párrafo completo puede usar `<strong>` para resaltar información crítica
- **Párrafos body**: 2-4 oraciones máximo
- **Espacio visual**: Usar `<p>` tags apropiadamente, evitar wall of text

```html
<!-- Lead paragraph -->
<p>
  <strong>El gobierno estatal anunció una inversión histórica de
  500 millones de pesos para infraestructura educativa en Hidalgo.</strong>
</p>

<!-- Párrafos siguientes -->
<p>
  El programa beneficiará a <strong>150 escuelas</strong> en
  <strong>84 municipios</strong> durante el ciclo escolar
  <strong>2025-2026</strong>.
</p>

<p>
  Según el titular de Educación, la inversión se enfocará en
  rehabilitación de aulas, equipamiento tecnológico y mejora de
  instalaciones deportivas.
</p>
```

#### REGLA 6: Balance de Enriquecimiento

**PRINCIPIO DE ESCANEABILIDAD:**
- 10-20% del contenido debe tener enriquecimiento (`<strong>`, `<em>`)
- Si TODO está en negrita, NADA destaca
- Priorizar calidad sobre cantidad

**DISTRIBUCIÓN RECOMENDADA (artículo de 500 palabras):**
- `<strong>`: 15-25 aplicaciones
- `<em>`: 2-5 aplicaciones
- `<blockquote>`: 0-2 elementos
- `<ul>` o `<ol>`: 1-2 listas

**ANTI-PATRÓN (evitar):**
```html
<!-- INCORRECTO: Sobre-énfasis -->
<p>
  <strong>El secretario</strong> de <strong>Desarrollo Social</strong>
  anunció <strong>ayer</strong> que <strong>la Secretaría</strong>
  otorgará <strong>apoyos</strong> a <strong>familias</strong>.
</p>

<!-- CORRECTO: Énfasis estratégico -->
<p>
  El secretario de <strong>Desarrollo Social</strong> anunció ayer que
  la dependencia otorgará apoyos económicos de <strong>3,000 pesos</strong>
  a <strong>5,000 familias</strong> vulnerables.
</p>
```

---

## Ejemplos Antes/Después

### Ejemplo 1: Noticia Gubernamental

#### ❌ ANTES (Texto Plano)
```html
<p>
  El gobernador de Hidalgo, Julio Menchaca Salazar, encabezó la entrega
  de 250 apoyos económicos por un monto de 5,000 pesos cada uno a familias
  de escasos recursos en el municipio de Pachuca. El programa denominado
  Impulso Hidalgo beneficiará a un total de 10,000 familias en todo el
  estado durante 2025. La inversión total asciende a 50 millones de pesos
  provenientes del presupuesto estatal.
</p>
```

#### ✅ DESPUÉS (Enriquecido Estratégicamente)
```html
<article>
  <h1>Gobierno de Hidalgo entrega apoyos económicos a familias vulnerables</h1>

  <time datetime="2025-10-21">21 de octubre, 2025</time>

  <section class="lead">
    <p>
      El gobernador de Hidalgo, <strong>Julio Menchaca Salazar</strong>,
      encabezó la entrega de <strong>250 apoyos económicos</strong> por un
      monto de <strong>5,000 pesos</strong> cada uno a familias de escasos
      recursos en el municipio de <strong>Pachuca</strong>.
    </p>
  </section>

  <section class="content">
    <p>
      El programa denominado <strong>Impulso Hidalgo</strong> beneficiará a
      un total de <strong>10,000 familias</strong> en todo el estado durante
      <strong>2025</strong>.
    </p>

    <p>
      La inversión total asciende a <strong>50 millones de pesos</strong>
      provenientes del presupuesto estatal.
    </p>
  </section>
</article>
```

**Mejoras aplicadas:**
- Estructura semántica con `<article>`, `<section>`
- Nombres propios en primera mención: `<strong>`
- Datos numéricos críticos: `<strong>`
- Nombres de programas: `<strong>`
- Párrafos separados para escaneabilidad

---

### Ejemplo 2: Noticia con Citas

#### ❌ ANTES (Sin Estructura)
```html
<p>
  La secretaria de Medio Ambiente, Ana López Hernández, dijo que "es
  fundamental que la ciudadanía participe activamente en el cuidado del
  medio ambiente". López Hernández explicó que el nuevo programa de
  reforestación plantará 100,000 árboles en zonas urbanas durante los
  próximos seis meses.
</p>
```

#### ✅ DESPUÉS (Con Citas Estructuradas)
```html
<article>
  <h1>SEMARNAT lanza programa de reforestación urbana en Hidalgo</h1>

  <section class="lead">
    <p>
      La secretaria de <strong>Medio Ambiente</strong>,
      <strong>Ana López Hernández</strong>, anunció un ambicioso programa
      de reforestación que plantará <strong>100,000 árboles</strong> en
      zonas urbanas durante los próximos <strong>seis meses</strong>.
    </p>
  </section>

  <figure>
    <blockquote>
      <p>
        Es fundamental que la ciudadanía participe activamente en el
        cuidado del medio ambiente
      </p>
    </blockquote>
    <figcaption>
      <cite>Ana López Hernández</cite>, Secretaria de Medio Ambiente
    </figcaption>
  </figure>

  <section class="content">
    <p>
      López Hernández explicó que el programa se implementará en
      <em>coordinación directa</em> con municipios y organizaciones
      civiles ambientalistas.
    </p>
  </section>
</article>
```

**Mejoras aplicadas:**
- Cita textual en `<blockquote>` con estructura semántica
- Atribución fuera del blockquote en `<figcaption>`
- Datos numéricos destacados
- Uso de `<em>` para énfasis contextual

---

### Ejemplo 3: Noticia con Datos Estadísticos

#### ❌ ANTES (Datos Sin Jerarquía)
```html
<p>
  Según el INEGI, la inflación en Hidalgo fue de 4.2% en septiembre,
  mientras que la nacional alcanzó 4.5%. Los productos que más
  incrementaron fueron: jitomate (12%), cebolla (8%), gasolina (3%) y
  transporte público (2.5%). El sector de alimentos concentró el 60%
  del incremento inflacionario.
</p>
```

#### ✅ DESPUÉS (Datos Estructurados)
```html
<article>
  <h1>Inflación en Hidalgo se ubica en 4.2% durante septiembre</h1>

  <section class="lead">
    <p>
      Según el <strong>Instituto Nacional de Estadística y Geografía
      (INEGI)</strong>, la inflación en Hidalgo fue de <strong>4.2%</strong>
      en septiembre, cifra <em>ligeramente menor</em> que la nacional de
      <strong>4.5%</strong>.
    </p>
  </section>

  <section class="content">
    <h2>Productos con Mayor Incremento</h2>

    <p>Los productos que registraron los mayores incrementos fueron:</p>

    <ul>
      <li><strong>Jitomate:</strong> 12% de aumento</li>
      <li><strong>Cebolla:</strong> 8% de aumento</li>
      <li><strong>Gasolina:</strong> 3% de aumento</li>
      <li><strong>Transporte público:</strong> 2.5% de aumento</li>
    </ul>

    <p>
      El sector de alimentos concentró <strong>60% del incremento
      inflacionario</strong>, según el reporte del instituto.
    </p>
  </section>
</article>
```

**Mejoras aplicadas:**
- Lista `<ul>` para datos escaneables
- Negritas en conceptos y porcentajes clave
- Subtítulo `<h2>` para jerarquía visual
- Datos numéricos destacados estratégicamente

---

### Ejemplo 4: Noticia con Proceso o Secuencia

#### ❌ ANTES (Secuencia Sin Estructura)
```html
<p>
  Para inscribirse al programa social, los interesados deben primero
  registrarse en el portal web www.hidalgo.gob.mx, luego subir copia
  de identificación oficial y comprobante de domicilio, después esperar
  la validación de documentos que tarda 5 días hábiles, y finalmente
  recibir notificación de aceptación por correo electrónico.
</p>
```

#### ✅ DESPUÉS (Proceso Ordenado)
```html
<article>
  <h1>Convocatoria abierta para programa de apoyo social en Hidalgo</h1>

  <section class="lead">
    <p>
      El gobierno estatal abrió la convocatoria para el
      <strong>Programa de Apoyo Económico Familiar 2025</strong>, que
      beneficiará a <strong>15,000 familias</strong> con apoyos mensuales
      de <strong>3,500 pesos</strong>.
    </p>
  </section>

  <section class="content">
    <h2>Proceso de Inscripción</h2>

    <p>Los interesados deben completar los siguientes pasos:</p>

    <ol>
      <li>
        <strong>Registro en línea:</strong> Acceder al portal oficial
        <a href="https://www.hidalgo.gob.mx">www.hidalgo.gob.mx</a>
      </li>
      <li>
        <strong>Carga de documentos:</strong> Subir copia de identificación
        oficial y comprobante de domicilio vigente
      </li>
      <li>
        <strong>Validación:</strong> Esperar verificación de documentos
        (proceso de <strong>5 días hábiles</strong>)
      </li>
      <li>
        <strong>Notificación:</strong> Recibir confirmación de aceptación
        por correo electrónico
      </li>
    </ol>

    <p>
      La convocatoria estará abierta hasta el
      <strong>30 de noviembre de 2025</strong>.
    </p>
  </section>
</article>
```

**Mejoras aplicadas:**
- Lista ordenada `<ol>` para proceso secuencial
- Negritas en conceptos clave de cada paso
- Subtítulo para separar secciones
- Fecha límite destacada

---

## Guía de Implementación para Prompt de IA

### Template de Instrucciones para LLM

```
INSTRUCCIONES DE FORMATO HTML PARA CONTENIDO PERIODÍSTICO:

Aplica enriquecimiento HTML estratégico siguiendo estas reglas:

1. ESTRUCTURA BASE:
   - Envolver contenido en <article>
   - Usar <section> para agrupar contenido temático
   - Incluir <h1> para título principal
   - Usar <h2>-<h3> para subtítulos jerárquicos
   - Incluir <time datetime="YYYY-MM-DD"> para fechas

2. USO DE <strong> (10-15% del contenido):
   - Nombres propios en PRIMERA mención (personas, instituciones)
   - Datos numéricos CRÍTICOS (presupuestos, estadísticas principales, fechas límite)
   - Conceptos clave del tema principal
   - Nombres de programas, iniciativas o proyectos oficiales
   - Ubicaciones específicas relevantes

   NO usar <strong> en:
   - Menciones subsecuentes de nombres (usar texto plano)
   - Todos los números (solo los críticos)
   - Palabras comunes o conectores

3. USO DE <em> (2-5 veces por artículo):
   - Énfasis que cambia significado
   - Palabras destacadas en citas textuales
   - Contraste o comparación importante
   - LÍMITE ESTRICTO: Máximo 2-3 usos por artículo

4. USO DE <blockquote>:
   - Solo para citas textuales de 20+ palabras
   - Máximo 1-2 por artículo
   - Estructura:
     <figure>
       <blockquote cite="URL">
         <p>Texto de la cita</p>
       </blockquote>
       <figcaption>
         <cite>Nombre</cite>, Cargo
       </figcaption>
     </figure>

5. LISTAS:
   - Usar <ul> para listas no ordenadas (beneficios, características)
   - Usar <ol> para procesos secuenciales
   - Aplicar <strong> en concepto clave al inicio de cada <li>

6. PÁRRAFOS:
   - Lead paragraph puede usar <strong> completo o parcial
   - Párrafos de 2-4 oraciones máximo
   - Separar ideas diferentes en <p> distintos

7. BALANCE:
   - 10-20% del contenido total debe tener enriquecimiento
   - Priorizar calidad sobre cantidad
   - Si todo está en negrita, nada destaca

EJEMPLO DE APLICACIÓN:
Input: "El gobernador Juan Pérez anunció inversión de 100 millones para educación"

Output:
<p>
  El gobernador <strong>Juan Pérez</strong> anunció una inversión de
  <strong>100 millones de pesos</strong> para infraestructura educativa.
</p>
```

### Checklist de Validación Post-Generación

**Antes de publicar contenido generado por IA, verificar:**

- [ ] Estructura HTML válida (`<article>`, `<section>`, headers)
- [ ] Un solo `<h1>` por artículo
- [ ] Jerarquía de subtítulos lógica (h2 > h3 > h4)
- [ ] Fecha en formato `<time datetime="YYYY-MM-DD">`
- [ ] Enriquecimiento balanceado (10-20% del contenido)
- [ ] `<strong>` aplicado solo a conceptos críticos
- [ ] Nombres propios en `<strong>` solo en primera mención
- [ ] `<em>` usado con moderación (2-5 veces máximo)
- [ ] Blockquotes con estructura semántica correcta
- [ ] Listas (`<ul>`, `<ol>`) formateadas adecuadamente
- [ ] Párrafos cortos (2-4 oraciones)
- [ ] Sin "wall of text" (espaciado visual adecuado)
- [ ] Citas textuales con atribución fuera de `<blockquote>`
- [ ] Links con texto descriptivo (no "click aquí")

---

## Referencias y Fuentes

### Documentación Técnica

[1] HTML5 Doctor. "The i, b, em, & strong elements." HTML5 Doctor, 2025. http://html5doctor.com/i-b-em-strong-element/

[2] W3C. "HTML5 Semantic Elements." W3Schools, 2025. https://www.w3schools.com/html/html5_semantic_elements.asp

[3] Mozilla Developer Network. "<blockquote>: The Block Quotation element." MDN Web Docs, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/blockquote

### Mejores Prácticas y Guías

[4] Smashing Magazine. "Block Quotes and Pull Quotes: Examples and Good Practices." Smashing Magazine, 2008. https://www.smashingmagazine.com/2008/06/block-quotes-and-pull-quotes-examples-and-good-practices/

[5] UXPin. "Website Design for Scannability – 8 UI Tips and Proven Reading Patterns." UXPin Studio Blog, 2025. https://www.uxpin.com/studio/blog/website-design-for-scannability/

[6] DEV Community. "Semantic HTML in 2025: The Bedrock of Accessible, SEO-Ready, and Future-Proof Web Experiences." DEV.to, 2025. https://dev.to/gerryleonugroho/semantic-html-in-2025-the-bedrock-of-accessible-seo-ready-and-future-proof-web-experiences-2k01

### Accesibilidad

[7] TPGi. "Screen Readers support for text level HTML semantics." TPGi (Vispero), 2025. https://www.tpgi.com/screen-readers-support-for-text-level-html-semantics/

[8] Bureau of Internet Accessibility. "Emphasizing Text for Accessibility: Bold, Italics, and Strong." BOIA Blog, 2025. https://www.boia.org/blog/emphasizing-text-for-accessibility-bold-italics-and-strong

[9] University of Tennessee Knoxville. "Strong and Emphasis - Accessibility Best Practices." LibGuides, 2025. https://libguides.utk.edu/libguide-accessibility/strong-emphasis

### Periodismo y Editorial

[10] Purdue OWL. "Journalism and Journalistic Writing." Purdue Online Writing Lab, 2025. https://owl.purdue.edu/owl/subject_specific_writing/journalism_and_journalistic_writing/index.html

[11] Search Engine Journal. "How To Create Content Tagging Policies For News Publishers." SEJ, 2025. https://www.searchenginejournal.com/content-tagging-policies/468144/

[12] Nieman Lab. "How The New York Times incorporates editorial judgment in algorithms to curate its home page." Nieman Journalism Lab, 2024. https://www.niemanlab.org/2024/10/how-the-new-york-times-incorporates-editorial-judgment-in-algorithms-to-curate-its-home-page/

### SEO y Contenido AI

[13] GetGenie. "Google's AI Content Guidelines (2025)." GetGenie AI, 2025. https://getgenie.ai/googles-ai-content-guidelines/

[14] Microsoft Learn. "Principles for AI generated content." Microsoft Documentation, 2025. https://learn.microsoft.com/en-us/principles-for-ai-generated-content

[15] BrandWell. "How to Refine AI Generated Content for Optimal Results." BrandWell Blog, 2025. https://brandwell.ai/blog/how-to-refine-ai-generated-content/

### Diseño y UX

[16] Interaction Design Foundation. "What is Readability in UX Design?" IxDF, 2025. https://www.interaction-design.org/literature/topics/readability-in-ux-design

[17] Women in Tech Network. "Enhances Readability and Scanability." WomenTech, 2025. https://www.womentech.net/how-to/enhances-readability-and-scanability

---

## Resumen de Implementación

### Puntos Clave para Recordar

1. **Semántica > Estilo Visual**: Usar `<strong>` y `<em>` por su significado, no solo por apariencia
2. **Menos es Más**: 10-20% de enriquecimiento es óptimo
3. **Escaneabilidad**: 79% de usuarios escanean, diseñar para eso
4. **Accesibilidad Limitada**: Screen readers no siempre anuncian `<strong>/<em>`, usar elección de palabras
5. **SEO 2025**: Google SGE y Bing AI valoran señales semánticas estructuradas
6. **Jerarquía Visual**: Headers, listas, espaciado > decoración excesiva
7. **Datos Numéricos**: Solo cifras críticas en `<strong>`
8. **Primera Mención**: Nombres propios e instituciones destacados solo la primera vez
9. **Blockquotes**: Máximo 1-2 por artículo, estructura semántica correcta
10. **Validación Humana**: TODO contenido AI debe revisarse antes de publicar

### Métricas de Éxito

**Medir el impacto del enriquecimiento HTML mediante:**

- **Tiempo en página**: Debería aumentar con mejor escaneabilidad
- **Bounce rate**: Debería disminuir con contenido más digerible
- **Click-through rate**: CTR en elementos destacados con `<strong>`
- **SEO rankings**: Mejora en featured snippets y resultados enriquecidos
- **Accesibilidad score**: Validar con herramientas WCAG 2.1/2.2
- **Feedback de usuarios**: Encuestas sobre legibilidad

---

**Documento generado el 21 de octubre de 2025**
**Investigación realizada por: Technical Researcher Agent**
**Proyecto: Noticias Pachuca - Sistema de Generación de Contenido con IA**

---

## Anexo: Prompts Sugeridos para Testing

### Prompt 1: Noticia Gubernamental Básica
```
Genera una noticia de 300 palabras sobre:
"El gobierno de Hidalgo anuncia programa de becas para estudiantes universitarios.
5000 becas de 2500 pesos mensuales. Convocatoria abierta del 1 al 30 de noviembre."

Aplica enriquecimiento HTML según las reglas establecidas.
```

### Prompt 2: Noticia con Datos Estadísticos
```
Genera una noticia de 400 palabras sobre:
"INEGI reporta crecimiento económico de 3.2% en Hidalgo durante Q3 2025.
Sectores destacados: manufactura (5%), servicios (3.8%), comercio (2.1%).
Generación de 2500 empleos formales."

Incluye estructura con listas, datos destacados y formato apropiado.
```

### Prompt 3: Noticia con Citas
```
Genera una noticia de 350 palabras sobre:
"Secretaria de Salud anuncia campaña de vacunación.
Cita textual: 'Esperamos vacunar a 100,000 personas en las próximas dos semanas'
Meta: 80% de cobertura en población objetivo."

Incluye blockquote estructurado y enriquecimiento estratégico.
```

---

**FIN DEL DOCUMENTO**
