import React from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/src/components/ThemedText'
import { useAuth } from '@/src/hooks/useAuth'
import { useSocket } from '@/src/features/socket/hooks/useSocket'
import { useResponsive } from '@/src/features/responsive'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

const ProtectedScreen = () => {
  const router = useRouter()
  const { user, logout } = useAuth()
  const {
    connectionState,
    isConnected,
    lastConnected,
    roomsJoined,
    isAuthenticatedAndConnected
  } = useSocket()
  const { isTablet, getResponsiveValue } = useResponsive()

  // Debug para ver qué contiene el objeto user
  console.log('🔍 User object:', user)
  console.log('🔍 User keys:', user ? Object.keys(user) : 'user is null/undefined')

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout()
              router.replace('/(auth)/login')
            } catch (error) {
              console.error('Logout failed:', error)
              Alert.alert('Error', 'No se pudo cerrar la sesión')
            }
          }
        }
      ]
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleString('es-ES')
  }

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return '#10B981' // green
      case 'connecting':
        return '#F59E0B' // yellow
      case 'disconnected':
        return '#EF4444' // red
      default:
        return '#6B7280' // gray
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Conectado'
      case 'connecting':
        return 'Conectando...'
      case 'disconnected':
        return 'Desconectado'
      default:
        return 'Desconocido'
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet
        ]}
      >
        {/* Header */}
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <ThemedText variant="title-large" style={styles.title}>
            Panel de Control
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            Estado de la aplicación y datos del usuario
          </ThemedText>
        </View>

        {/* Cards Container */}
        <View style={[
          styles.cardsContainer,
          isTablet && styles.cardsContainerTablet
        ]}>
          {/* User Info Card */}
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <ThemedText variant="title-medium" style={styles.icon}>👤</ThemedText>
              </View>
              <ThemedText variant="title-medium" style={styles.cardTitle}>
                Información del Usuario
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">
                ID:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.infoValue}>
                {user?.id || 'No disponible'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">
                Email:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.infoValue}>
                {user?.email || 'No disponible'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">
                Usuario:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.infoValue}>
                {user?.username || 'No disponible'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">
                Último acceso:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.infoValue}>
                {user?.lastLoginAt ? formatDate(user.lastLoginAt) : 'No disponible'}
              </ThemedText>
            </View>
          </View>

          {/* Socket Connection Card */}
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <ThemedText variant="title-medium" style={styles.icon}>🔌</ThemedText>
              </View>
              <ThemedText variant="title-medium" style={styles.cardTitle}>
                Conexión Socket
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">
                Estado:
              </ThemedText>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: getConnectionStatusColor() }
                ]} />
                <ThemedText
                  variant="body-medium"
                  style={[styles.statusText, { color: getConnectionStatusColor() }]}
                >
                  {getConnectionStatusText()}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">
                Autenticado y conectado:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.infoValue}>
                {isAuthenticatedAndConnected ? '✅ Sí' : '❌ No'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">
                Última conexión:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.infoValue}>
                {formatDate(lastConnected)}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">
                Salas unidas:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.infoValue}>
                {roomsJoined.length > 0 ? roomsJoined.join(', ') : 'Ninguna'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.buttonContainer, isTablet && styles.buttonContainerTablet]}>
          <Button
            variant="default"
            size="lg"
            onPress={() => Alert.alert('Enviar', 'Funcionalidad de envío')}
            className={isTablet ? 'max-w-[300px] w-full mb-4' : 'w-full mb-4'}
          >
            <Text className="text-primary-foreground font-semibold">Enviar</Text>
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onPress={handleLogout}
            className={isTablet ? 'max-w-[300px] w-full' : 'w-full'}
          >
            <Text className="text-white font-semibold">Cerrar Sesión</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 24,
    paddingBottom: 40
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%'
  },
  header: {
    marginBottom: 32
  },
  headerTablet: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    color: '#6B7280'
  },
  cardsContainer: {
    gap: 20
  },
  cardsContainerTablet: {
    flexDirection: 'row',
    gap: 32
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  cardTablet: {
    flex: 1,
    padding: 32
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  icon: {
    fontSize: 20
  },
  cardTitle: {
    color: '#111827',
    flex: 1
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 16
  },
  infoValue: {
    color: '#111827',
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    fontWeight: '600'
  },
  buttonContainer: {
    marginTop: 32
  },
  buttonContainerTablet: {
    alignItems: 'center'
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center'
  },
  logoutButtonTablet: {
    maxWidth: 300,
    width: '100%'
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600'
  }
})

export default ProtectedScreen
