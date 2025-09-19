# CONTEXTO DASHBOARD COYOTE-DASH

## ESTADO ACTUAL - LO QUE ESTÁ JODIDO

### PROBLEMA PRINCIPAL
El dashboard se ve como basura comparado con el diseño original. Los componentes están mal posicionados y el layout está completamente roto.

### COMPONENTES CON PROBLEMAS

#### 1. SectionCards (src/components/SectionCards.tsx)
- **Problema**: Grid no funciona, cards en vertical en lugar de horizontal
- **Debe ser**: 4 cards en fila horizontal
- **Está**: Cards apiladas verticalmente
- **Clase problemática**: `*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4`

#### 2. ChartAreaInteractive (src/components/ChartAreaInteractive.tsx)
- **Problema**: Área completamente vacía
- **Debe ser**: Gráfico de área con múltiples líneas
- **Está**: Espacio en blanco

#### 3. DataTable (src/components/DataTable.tsx)
- **Problema**: Tabla cortada y mal layout
- **Debe ser**: Tabla completa con tabs y botones
- **Está**: Contenido cortado

#### 4. AppSidebar (src/components/AppSidebar.tsx)
- **Problema**: Width incorrecto
- **Debe ser**: Sidebar compacto
- **Está**: Muy ancho

### ARCHIVOS A REVISAR Y CORREGIR

1. `src/components/SectionCards.tsx` - Arreglar grid
2. `src/components/ChartAreaInteractive.tsx` - Implementar gráfico
3. `src/components/DataTable.tsx` - Arreglar layout tabla
4. `src/components/AppSidebar.tsx` - Ajustar width
5. `src/components/dashboard/V0DashboardApp.tsx` - Container principal

### ELEMENTOS ESPECÍFICOS QUE FALTAN

#### Cards Section:
- Grid de 4 columnas en desktop
- Badges con colores correctos (verde/rojo)
- Spacing correcto entre cards

#### Chart Section:
- Título "Total Visitors"
- Subtítulo "Total for the last 3 months"
- Tabs: "Last 3 months", "Last 30 days", "Last 7 days"
- Gráfico de área con líneas múltiples

#### Table Section:
- Tabs: "Outline", "Past Performance", "Key Personnel", "Focus Documents"
- Botones: "Customize Columns", "Add Section"
- Columnas: Header, Section Type, Status, Target, Limit, Reviewer
- Status indicators con colores

### PRIORIDAD DE CORRECCIÓN

1. **URGENTE**: SectionCards grid layout
2. **ALTA**: ChartAreaInteractive implementación
3. **ALTA**: DataTable layout completo
4. **MEDIA**: Sidebar width ajuste
5. **BAJA**: Responsive refinements

### NOTAS TÉCNICAS

- Usar grid CSS simple en lugar de clases complejas
- Verificar que recharts esté instalado para gráficos
- Revisar componentes UI de shadcn/ui disponibles
- Mantener structure de SidebarProvider existente