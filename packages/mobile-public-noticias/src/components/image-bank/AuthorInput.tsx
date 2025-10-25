/**
 * 📸 AuthorInput Component
 *
 * Input especializado para autor/fuente con auto-formato de citado
 *
 * Features:
 * - Selector de tipo de captura (Wikipedia, stock photos, social media, etc.)
 * - Campos condicionales según tipo seleccionado
 * - Auto-generación de atribución formateada
 * - Ejemplos de formato para cada tipo
 * - Todos los campos son opcionales
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Select } from '@/components/ui/select'

export enum CaptureType {
  WIKIPEDIA = 'wikipedia',
  UNSPLASH = 'unsplash',
  PEXELS = 'pexels',
  VIDEO_SCREENSHOT = 'video_screenshot',
  SOCIAL_SCREENSHOT = 'social_screenshot',
  STAFF_PHOTO = 'staff_photo',
  NEWS_AGENCY = 'news_agency',
  OTHER = 'other',
}

export interface AuthorData {
  captureType?: CaptureType
  photographerName?: string
  author?: string
  license?: string
  attribution?: string
}

interface AuthorInputProps {
  value: AuthorData
  onChange: (data: AuthorData) => void
}

// Labels para cada tipo
const CAPTURE_TYPE_LABELS: Record<CaptureType, string> = {
  [CaptureType.WIKIPEDIA]: 'Wikipedia / Wikimedia Commons',
  [CaptureType.UNSPLASH]: 'Unsplash (Stock Photo)',
  [CaptureType.PEXELS]: 'Pexels (Stock Photo)',
  [CaptureType.VIDEO_SCREENSHOT]: 'Screenshot de Video',
  [CaptureType.SOCIAL_SCREENSHOT]: 'Screenshot de Red Social',
  [CaptureType.STAFF_PHOTO]: 'Foto de Staff/Equipo',
  [CaptureType.NEWS_AGENCY]: 'Agencia de Noticias',
  [CaptureType.OTHER]: 'Otro',
}

// Ejemplos de atribución para cada tipo
const ATTRIBUTION_EXAMPLES: Record<CaptureType, string> = {
  [CaptureType.WIKIPEDIA]: 'Juan Pérez. (2025). Palacio de Gobierno [Digital image]. Wikimedia Commons.',
  [CaptureType.UNSPLASH]: 'Photo by María López on Unsplash',
  [CaptureType.PEXELS]: 'Photo by Carlos García from Pexels',
  [CaptureType.VIDEO_SCREENSHOT]: 'Screenshot de video público / Fair Use para fines periodísticos',
  [CaptureType.SOCIAL_SCREENSHOT]: 'Screenshot de redes sociales / Fair Use para fines periodísticos',
  [CaptureType.STAFF_PHOTO]: 'Foto por Noticias Pachuca',
  [CaptureType.NEWS_AGENCY]: 'Foto: Notimex / Agencia de noticias',
  [CaptureType.OTHER]: '',
}

export function AuthorInput({ value, onChange }: AuthorInputProps) {
  const [localData, setLocalData] = useState<AuthorData>(value)

  // Auto-generar atribución cuando cambian los campos
  useEffect(() => {
    if (!localData.captureType) return

    let generatedAttribution = ''
    let generatedAuthor = ''
    let generatedLicense = ''

    switch (localData.captureType) {
      case CaptureType.WIKIPEDIA:
        if (localData.photographerName) {
          generatedAttribution = `${localData.photographerName}. (${new Date().getFullYear()}). [Digital image]. Wikimedia Commons.`
          generatedAuthor = `${localData.photographerName} / Wikimedia Commons`
          generatedLicense = 'CC BY-SA 4.0'
        }
        break

      case CaptureType.UNSPLASH:
        if (localData.photographerName) {
          generatedAttribution = `Photo by ${localData.photographerName} on Unsplash`
          generatedAuthor = `${localData.photographerName} / Unsplash`
          generatedLicense = 'Unsplash License'
        }
        break

      case CaptureType.PEXELS:
        if (localData.photographerName) {
          generatedAttribution = `Photo by ${localData.photographerName} from Pexels`
          generatedAuthor = `${localData.photographerName} / Pexels`
          generatedLicense = 'Pexels License'
        }
        break

      case CaptureType.VIDEO_SCREENSHOT:
        generatedAttribution = 'Screenshot de video público / Fair Use para fines periodísticos'
        generatedAuthor = 'Screenshot de video'
        generatedLicense = 'Fair Use'
        break

      case CaptureType.SOCIAL_SCREENSHOT:
        generatedAttribution = 'Screenshot de redes sociales / Fair Use para fines periodísticos'
        generatedAuthor = 'Screenshot de redes sociales'
        generatedLicense = 'Fair Use'
        break

      case CaptureType.STAFF_PHOTO:
        generatedAttribution = 'Foto por Noticias Pachuca'
        generatedAuthor = 'Noticias Pachuca'
        generatedLicense = 'Copyright © Noticias Pachuca'
        break

      case CaptureType.NEWS_AGENCY:
        if (localData.photographerName) {
          generatedAttribution = `Foto: ${localData.photographerName} / Agencia de noticias`
          generatedAuthor = `${localData.photographerName} / Agencia`
          generatedLicense = 'Licencia de agencia'
        }
        break

      case CaptureType.OTHER:
        // Manual - no auto-generar
        break
    }

    // Actualizar datos locales con valores generados
    const updatedData = {
      ...localData,
      author: generatedAuthor || localData.author,
      license: generatedLicense || localData.license,
      attribution: generatedAttribution || localData.attribution,
    }

    setLocalData(updatedData)
    onChange(updatedData)
  }, [localData.captureType, localData.photographerName])

  // Handle capture type change
  const handleCaptureTypeChange = (newType: CaptureType | undefined) => {
    setLocalData({
      ...localData,
      captureType: newType,
      // Reset fields cuando cambia el tipo
      photographerName: '',
      author: '',
      license: '',
      attribution: '',
    })
  }

  // Handle photographer name change
  const handlePhotographerNameChange = (text: string) => {
    setLocalData({
      ...localData,
      photographerName: text,
    })
  }

  // Handle manual author change (solo para "other")
  const handleAuthorChange = (text: string) => {
    const updatedData = {
      ...localData,
      author: text,
    }
    setLocalData(updatedData)
    onChange(updatedData)
  }

  // Handle manual license change (solo para "other")
  const handleLicenseChange = (text: string) => {
    const updatedData = {
      ...localData,
      license: text,
    }
    setLocalData(updatedData)
    onChange(updatedData)
  }

  // Check if photographer name is needed
  const needsPhotographerName = [
    CaptureType.WIKIPEDIA,
    CaptureType.UNSPLASH,
    CaptureType.PEXELS,
    CaptureType.NEWS_AGENCY,
  ].includes(localData.captureType as CaptureType)

  return (
    <View style={styles.container}>
      {/* Label */}
      <ThemedText variant="label-medium" style={styles.label}>
        Autor / Fuente de Imagen (OPCIONAL)
      </ThemedText>

      {/* Capture Type Selector */}
      <View style={styles.inputGroup}>
        <ThemedText variant="body-small" style={styles.sublabel}>
          Tipo de fuente
        </ThemedText>
        <Select
          value={localData.captureType || ''}
          onValueChange={(value) => handleCaptureTypeChange(value as CaptureType)}
          options={Object.entries(CAPTURE_TYPE_LABELS).map(([key, label]) => ({
            value: key,
            label: label,
          }))}
          placeholder="Seleccionar tipo de fuente..."
          style={styles.selectTrigger}
        />
      </View>

      {/* Photographer Name (conditional) */}
      {needsPhotographerName && (
        <View style={styles.inputGroup}>
          <ThemedText variant="body-small" style={styles.sublabel}>
            Nombre del fotógrafo
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="ej: Juan Pérez"
            placeholderTextColor="#9CA3AF"
            value={localData.photographerName}
            onChangeText={handlePhotographerNameChange}
            autoCapitalize="words"
          />
        </View>
      )}

      {/* Manual fields for "other" type */}
      {localData.captureType === CaptureType.OTHER && (
        <>
          <View style={styles.inputGroup}>
            <ThemedText variant="body-small" style={styles.sublabel}>
              Autor
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="ej: Juan Pérez / Fuente"
              placeholderTextColor="#9CA3AF"
              value={localData.author}
              onChangeText={handleAuthorChange}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText variant="body-small" style={styles.sublabel}>
              Licencia
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="ej: CC BY-SA 4.0"
              placeholderTextColor="#9CA3AF"
              value={localData.license}
              onChangeText={handleLicenseChange}
            />
          </View>
        </>
      )}

      {/* Attribution preview */}
      {localData.attribution && (
        <View style={styles.previewContainer}>
          <ThemedText variant="body-small" style={styles.previewLabel}>
            📝 Atribución generada:
          </ThemedText>
          <View style={styles.previewBox}>
            <ThemedText variant="body-small" style={styles.previewText}>
              {localData.attribution}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Example */}
      {localData.captureType && ATTRIBUTION_EXAMPLES[localData.captureType] && (
        <View style={styles.exampleContainer}>
          <ThemedText variant="body-small" style={styles.exampleLabel}>
            💡 Ejemplo:
          </ThemedText>
          <ThemedText variant="body-small" style={styles.exampleText}>
            {ATTRIBUTION_EXAMPLES[localData.captureType]}
          </ThemedText>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  label: {
    color: '#111827',
    fontWeight: '700',
  },
  inputGroup: {
    gap: 8,
  },
  sublabel: {
    color: '#6B7280',
    fontWeight: '600',
  },
  selectTrigger: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewContainer: {
    gap: 8,
    backgroundColor: '#f7f6d4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e33d',
  },
  previewLabel: {
    color: '#000000',
    fontWeight: '700',
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e33d',
  },
  previewText: {
    color: '#111827',
    fontStyle: 'italic',
  },
  exampleContainer: {
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  exampleLabel: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  exampleText: {
    color: '#1E3A8A',
    fontStyle: 'italic',
  },
})
