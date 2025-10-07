import React, { useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/src/hooks/useAuth'
import { useSocket } from '@/src/features/socket'
import { ThemedText } from '@/src/components/ThemedText'

const AppScreen: React.FC = () => {
  const router = useRouter()
  const { isAuthenticated, isInitialized, initialize, isLoading } = useAuth()

  // Inicializar sockets automáticamente cuando el usuario esté autenticado
  const { isConnected, connectionState } = useSocket()

  useEffect(() => {
    // Inicializar sistema de autenticación al cargar la app
    initialize()
  }, [initialize])

  // Log del estado de sockets para debug
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔌 Socket Status:', {
        isConnected,
        connectionState,
        isAuthenticated
      })
    }
  }, [isConnected, connectionState, isAuthenticated])

  useEffect(() => {
    // Redirigir una vez que la inicialización esté completa
    if (isInitialized && !isLoading) {
      if (isAuthenticated) {
        // Usuario autenticado -> ir a tabs
        router.replace('/(tabs)/home')
      } else {
        // Usuario no autenticado -> ir a login
        router.replace('/(auth)/login')
      }
    }
  }, [isAuthenticated, isInitialized, isLoading, router])

  // Mostrar loading mientras se inicializa
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#EAB308" />
        <ThemedText variant="body-medium" color="secondary" style={styles.loadingText}>
          Inicializando aplicación...
        </ThemedText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    textAlign: 'center'
  }
})

export default AppScreen
