import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectOption } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CreateContentAgentRequest } from '@/src/types/content-agent.types';

export interface AgentFormFieldsProps {
  data: CreateContentAgentRequest;
  onChange: (data: CreateContentAgentRequest) => void;
  errors?: Partial<Record<keyof CreateContentAgentRequest, string>>;
}

const AGENT_TYPE_OPTIONS: SelectOption[] = [
  { label: '📰 Reportero', value: 'reportero' },
  { label: '✍️ Columnista', value: 'columnista' },
  { label: '🔍 Trascendido', value: 'trascendido' },
  { label: '🎯 SEO Specialist', value: 'seo-specialist' }
];

const EDITORIAL_LEAN_OPTIONS: SelectOption[] = [
  { label: 'Conservadora', value: 'conservative' },
  { label: 'Progresista', value: 'progressive' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Humorística', value: 'humor' },
  { label: 'Crítica', value: 'critical' },
  { label: 'Analítica', value: 'analytical' }
];

const TONE_OPTIONS: SelectOption[] = [
  { label: 'Formal', value: 'formal' },
  { label: 'Informal', value: 'informal' },
  { label: 'Humorístico', value: 'humor' },
  { label: 'Académico', value: 'academic' },
  { label: 'Conversacional', value: 'conversational' }
];

const VOCABULARY_OPTIONS: SelectOption[] = [
  { label: 'Simple', value: 'simple' },
  { label: 'Intermedio', value: 'intermediate' },
  { label: 'Avanzado', value: 'advanced' },
  { label: 'Técnico', value: 'technical' }
];

const LENGTH_OPTIONS: SelectOption[] = [
  { label: 'Corto', value: 'short' },
  { label: 'Medio', value: 'medium' },
  { label: 'Largo', value: 'long' },
  { label: 'Variable', value: 'variable' }
];

const STRUCTURE_OPTIONS: SelectOption[] = [
  { label: 'Lineal', value: 'linear' },
  { label: 'Narrativa', value: 'narrative' },
  { label: 'Analítica', value: 'analytical' },
  { label: 'Opinión', value: 'opinion' }
];

const AUDIENCE_OPTIONS: SelectOption[] = [
  { label: 'General', value: 'general' },
  { label: 'Especializada', value: 'specialized' },
  { label: 'Académica', value: 'academic' },
  { label: 'Jóvenes', value: 'youth' },
  { label: 'Adultos mayores', value: 'senior' }
];

export function AgentFormFields({ data, onChange, errors }: AgentFormFieldsProps) {
  const updateField = <K extends keyof CreateContentAgentRequest>(
    field: K,
    value: CreateContentAgentRequest[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const updateWritingStyle = <K extends keyof CreateContentAgentRequest['writingStyle']>(
    field: K,
    value: CreateContentAgentRequest['writingStyle'][K]
  ) => {
    onChange({
      ...data,
      writingStyle: {
        ...data.writingStyle,
        [field]: value
      }
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Información Básica */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-medium">Información Básica</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          <View style={styles.field}>
            <Label>Nombre del Agente</Label>
            <Input
              value={data.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Ej: Juan Pérez - Reportero Político"
              style={errors?.name ? styles.inputError : undefined}
            />
            {errors?.name && (
              <ThemedText variant="label-small" style={styles.error}>{errors.name}</ThemedText>
            )}
          </View>

          <View style={styles.field}>
            <Label>Tipo de Agente</Label>
            <Select
              value={data.agentType}
              onValueChange={(value) => updateField('agentType', value as CreateContentAgentRequest['agentType'])}
              options={AGENT_TYPE_OPTIONS}
            />
          </View>

          <View style={styles.field}>
            <Label>Descripción</Label>
            <Textarea
              value={data.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Describe brevemente el rol y función del agente"
              rows={3}
              style={errors?.description ? styles.inputError : undefined}
            />
            {errors?.description && (
              <ThemedText variant="label-small" style={styles.error}>{errors.description}</ThemedText>
            )}
          </View>

          <View style={styles.field}>
            <Label>Personalidad</Label>
            <Textarea
              value={data.personality}
              onChangeText={(text) => updateField('personality', text)}
              placeholder="Define la personalidad y estilo del agente..."
              rows={4}
              style={errors?.personality ? styles.inputError : undefined}
            />
            {errors?.personality && (
              <ThemedText variant="label-small" style={styles.error}>{errors.personality}</ThemedText>
            )}
          </View>

          <View style={styles.field}>
            <Label>Especializaciones (separadas por comas)</Label>
            <Input
              value={data.specializations.join(', ')}
              onChangeText={(text) => {
                // Si el campo está vacío, dejar array vacío
                if (!text || text.trim() === '') {
                  updateField('specializations', []);
                  return;
                }

                // Split por coma, limpiar espacios, y filtrar vacíos
                const specs = text
                  .split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0);

                updateField('specializations', specs);
              }}
              placeholder="política, deportes, social"
              style={errors?.specializations ? styles.inputError : undefined}
            />
            {errors?.specializations && (
              <ThemedText variant="label-small" style={styles.error}>{errors.specializations}</ThemedText>
            )}
            <ThemedText variant="label-small" color="secondary">
              {data.specializations.length > 0
                ? `✓ ${data.specializations.length} especialización${data.specializations.length > 1 ? 'es' : ''} agregada${data.specializations.length > 1 ? 's' : ''}`
                : 'Escribe al menos una especialización'
              }
            </ThemedText>
          </View>

          <View style={styles.field}>
            <Label>Línea Editorial</Label>
            <Select
              value={data.editorialLean}
              onValueChange={(value) => updateField('editorialLean', value as CreateContentAgentRequest['editorialLean'])}
              options={EDITORIAL_LEAN_OPTIONS}
            />
          </View>
        </CardContent>
      </Card>

      {/* Estilo de Escritura */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-medium">Estilo de Escritura</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          <View style={styles.field}>
            <Label>Tono</Label>
            <Select
              value={data.writingStyle.tone}
              onValueChange={(value) => updateWritingStyle('tone', value as CreateContentAgentRequest['writingStyle']['tone'])}
              options={TONE_OPTIONS}
            />
          </View>

          <View style={styles.field}>
            <Label>Vocabulario</Label>
            <Select
              value={data.writingStyle.vocabulary}
              onValueChange={(value) => updateWritingStyle('vocabulary', value as CreateContentAgentRequest['writingStyle']['vocabulary'])}
              options={VOCABULARY_OPTIONS}
            />
          </View>

          <View style={styles.field}>
            <Label>Longitud</Label>
            <Select
              value={data.writingStyle.length}
              onValueChange={(value) => updateWritingStyle('length', value as CreateContentAgentRequest['writingStyle']['length'])}
              options={LENGTH_OPTIONS}
            />
          </View>

          <View style={styles.field}>
            <Label>Estructura</Label>
            <Select
              value={data.writingStyle.structure}
              onValueChange={(value) => updateWritingStyle('structure', value as CreateContentAgentRequest['writingStyle']['structure'])}
              options={STRUCTURE_OPTIONS}
            />
          </View>

          <View style={styles.field}>
            <Label>Audiencia</Label>
            <Select
              value={data.writingStyle.audience}
              onValueChange={(value) => updateWritingStyle('audience', value as CreateContentAgentRequest['writingStyle']['audience'])}
              options={AUDIENCE_OPTIONS}
            />
          </View>
        </CardContent>
      </Card>

      {/* Estado */}
      <Card style={styles.section}>
        <CardContent style={styles.cardContent}>
          <View style={styles.switchField}>
            <View style={styles.switchLabel}>
              <Label>Estado del Agente</Label>
              <ThemedText variant="body-small" color="secondary">
                {data.isActive ? 'Agente activo y disponible' : 'Agente desactivado'}
              </ThemedText>
            </View>
            <Switch
              checked={data.isActive}
              onCheckedChange={(checked) => updateField('isActive', checked)}
            />
          </View>
        </CardContent>
      </Card>
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
  }
});
