/**
 * 📝 Crear Contenido Manual - Screen
 *
 * Pantalla para crear contenido manual (URGENT o NORMAL)
 * Usa el componente UserContentForm
 */

import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { UserContentForm } from '@/src/components/user-content/UserContentForm';
import { ThemedText } from '@/src/components/ThemedText';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

export default function CreateUserContentScreen() {
  const router = useRouter();

  const handleSuccess = (contentId: string) => {
    console.log('[CreateUserContent] Content created successfully:', contentId);
    // Navegar de regreso al tab de generados
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con botón de regreso */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.backButton}>
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <ThemedText variant="title-large" style={styles.title}>
          Crear Contenido Manual
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Formulario */}
      <UserContentForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#111827',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
});
