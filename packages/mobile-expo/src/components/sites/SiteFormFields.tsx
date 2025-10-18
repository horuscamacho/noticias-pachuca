import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CreateSitePayload } from '@/src/types/site.types';

export interface SiteFormFieldsProps {
  data: CreateSitePayload;
  onChange: (data: CreateSitePayload) => void;
  errors?: Partial<Record<keyof CreateSitePayload, string>>;
}

/**
 * 🌐 FASE 8: SiteFormFields Component (SIMPLIFICADO)
 * Formulario para crear/editar Sites con SOLO 5 campos esenciales
 *
 * Campos:
 * - domain (URL)
 * - name (text)
 * - description (textarea 500 chars)
 * - isMainSite (switch)
 * - isActive (switch, default true)
 */
export function SiteFormFields({ data, onChange, errors }: SiteFormFieldsProps) {
  const updateField = <K extends keyof CreateSitePayload>(
    field: K,
    value: CreateSitePayload[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Información Básica - ÚNICA SECCIÓN */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-medium">Información Básica</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Domain */}
          <View style={styles.field}>
            <Label>Dominio del Sitio *</Label>
            <Input
              value={data.domain}
              onChangeText={(text) => updateField('domain', text)}
              placeholder="Ej: noticiaspachuca.com"
              keyboardType="url"
              autoCapitalize="none"
              style={errors?.domain ? styles.inputError : undefined}
            />
            {errors?.domain && (
              <ThemedText variant="label-small" style={styles.error}>
                {errors.domain}
              </ThemedText>
            )}
            <ThemedText variant="label-small" color="secondary">
              Dominio completo sin https:// (ej: tuzona.noticiaspachuca.com)
            </ThemedText>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Label>Nombre del Sitio *</Label>
            <Input
              value={data.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Ej: Noticias Pachuca"
              style={errors?.name ? styles.inputError : undefined}
            />
            {errors?.name && (
              <ThemedText variant="label-small" style={styles.error}>
                {errors.name}
              </ThemedText>
            )}
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Label>Descripción *</Label>
            <Textarea
              value={data.description}
              onChangeText={(text) => {
                // Limitar a 500 caracteres
                if (text.length <= 500) {
                  updateField('description', text);
                }
              }}
              placeholder="Describe brevemente el propósito de este sitio..."
              rows={4}
              style={errors?.description ? styles.inputError : undefined}
            />
            {errors?.description && (
              <ThemedText variant="label-small" style={styles.error}>
                {errors.description}
              </ThemedText>
            )}
            <ThemedText variant="label-small" color="secondary">
              {data.description.length}/500 caracteres
            </ThemedText>
          </View>

          {/* isMainSite Switch */}
          <View style={styles.switchField}>
            <View style={styles.switchLabel}>
              <Label>Sitio Principal</Label>
              <ThemedText variant="body-small" color="secondary">
                {data.isMainSite
                  ? 'Este es el sitio principal de la red'
                  : 'Sitio secundario/subdominio'}
              </ThemedText>
            </View>
            <Switch
              checked={data.isMainSite}
              onCheckedChange={(checked) => updateField('isMainSite', checked)}
            />
          </View>

          {/* isActive Switch */}
          <View style={styles.switchField}>
            <View style={styles.switchLabel}>
              <Label>Estado del Sitio</Label>
              <ThemedText variant="body-small" color="secondary">
                {data.isActive
                  ? 'Sitio activo y disponible para publicación'
                  : 'Sitio desactivado (no se puede publicar)'}
              </ThemedText>
            </View>
            <Switch
              checked={data.isActive}
              onCheckedChange={(checked) => updateField('isActive', checked)}
            />
          </View>
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <View style={styles.noteContainer}>
        <ThemedText variant="body-small" color="secondary" style={styles.note}>
          💡 La configuración de redes sociales (Facebook, Twitter) se agrega después de crear el sitio desde la pantalla de edición.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
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
  noteContainer: {
    padding: 16,
    marginBottom: 24
  },
  note: {
    textAlign: 'center',
    fontStyle: 'italic'
  }
});
