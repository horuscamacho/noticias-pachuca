import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Copy, Sparkles } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

/**
 * 🤖 Componente Alert con prompt para Claude
 * Permite copiar un prompt optimizado para obtener selectores CSS
 */

const CLAUDE_PROMPT = `Analiza esta página web y ayúdame a extraer los selectores CSS correctos para scraping de noticias.

CONTEXTO:
Estoy configurando un sistema de extracción de noticias y necesito identificar los selectores CSS para dos tipos de contenido:

1. **SELECTORES DE LISTADO** (para la página principal que lista artículos):
   - articleLinks: selector que capture TODOS los enlaces (<a>) de artículos individuales

2. **SELECTORES DE CONTENIDO** (para páginas individuales de artículos):
   - titleSelector: selector del título principal del artículo
   - contentSelector: selector del contenido/cuerpo del artículo (texto completo)
   - imageSelector: selector de la imagen principal (opcional)
   - dateSelector: selector de la fecha de publicación (opcional)
   - authorSelector: selector del nombre del autor (opcional)
   - categorySelector: selector de la categoría/sección (opcional)

INSTRUCCIONES:
1. Visita esta URL que te voy a proporcionar
2. Inspecciona el HTML de la página
3. Identifica los selectores CSS más específicos y estables
4. Prioriza selectores por:
   - ID únicos (#id)
   - Clases específicas (.class)
   - Atributos data-* ([data-attribute])
   - Combinaciones de elementos cuando sea necesario

5. Devuélveme SOLO los selectores en este formato JSON:

\`\`\`json
{
  "listingSelectors": {
    "articleLinks": "selector aquí"
  },
  "contentSelectors": {
    "titleSelector": "selector aquí",
    "contentSelector": "selector aquí",
    "imageSelector": "selector aquí",
    "dateSelector": "selector aquí",
    "authorSelector": "selector aquí",
    "categorySelector": "selector aquí"
  }
}
\`\`\`

NOTAS IMPORTANTES:
- Los selectores deben ser válidos para usar con querySelector/querySelectorAll
- El articleLinks debe capturar MÚLTIPLES enlaces (usa un selector que matchee varios elementos)
- El contentSelector debe capturar TODO el texto del artículo, no solo un párrafo
- Si un selector opcional no existe en la página, déjalo vacío ""
- Valida que los selectores funcionen correctamente antes de responder

URL A ANALIZAR:
[PEGA AQUÍ LA URL DE LA PÁGINA]`;

interface ClaudePromptAlertProps {
  variant?: 'default' | 'compact';
}

export function ClaudePromptAlert({ variant = 'default' }: ClaudePromptAlertProps) {
  const handleCopyPrompt = async () => {
    try {
      await Clipboard.setStringAsync(CLAUDE_PROMPT);
      Alert.alert(
        '✅ Prompt copiado',
        'El prompt ha sido copiado al portapapeles. Ahora:\n\n1. Abre Claude en tu celular\n2. Pega el prompt\n3. Agrega la URL de la página\n4. Claude te dará los selectores',
        [{ text: 'Entendido' }]
      );
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo copiar el prompt al portapapeles');
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={handleCopyPrompt}
        activeOpacity={0.7}
      >
        <View style={styles.compactContent}>
          <Sparkles size={16} color="#8B5CF6" />
          <Text style={styles.compactText}>Necesitas ayuda con los selectores?</Text>
        </View>
        <Copy size={16} color="#6B7280" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleCopyPrompt}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Sparkles size={20} color="#8B5CF6" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>¿Necesitas ayuda con los selectores?</Text>
        <Text style={styles.description}>
          Toca aquí para copiar un prompt optimizado para Claude. Te ayudará a identificar
          los selectores CSS correctos analizando la página web.
        </Text>
      </View>
      <Copy size={20} color="#6B7280" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});
