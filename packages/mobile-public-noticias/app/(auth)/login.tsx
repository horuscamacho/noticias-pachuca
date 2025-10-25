import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/src/components/ThemedText'
import { useAuth } from '@/src/hooks/useAuth'
import { useResponsive } from '@/src/features/responsive'

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { login, isLoggingIn, error, clearError } = useAuth()
  const { getResponsiveValue, isTablet } = useResponsive()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña')
      return
    }

    try {
      clearError()
      await login({ emailOrUsername: email, password })
      // Redirigir manualmente después del login exitoso
      router.replace('/(tabs)/home')
    } catch (error) {
      console.error('Login failed:', error)
      Alert.alert(
        'Error de inicio de sesión',
        'Credenciales inválidas. Por favor verifica tu email y contraseña.'
      )
    }
  }

  const handleRegister = () => {
    // TODO: Implementar navegación a registro
    Alert.alert('Registro', 'Funcionalidad de registro pendiente de implementar')
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.content, isTablet && styles.contentTablet]}>
          {/* Login Form Card */}
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <ThemedText variant="title-large" style={styles.title}>
              Iniciar Sesión
            </ThemedText>

            <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
              Ingresa tu email y contraseña para acceder
              al panel
            </ThemedText>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <ThemedText variant="caption" color="error">
                  {error.message || 'Error desconocido'}
                </ThemedText>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <ThemedText variant="label-medium" style={styles.label}>
                Email
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoggingIn}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <ThemedText variant="label-medium" style={styles.label}>
                  Contraseña
                </ThemedText>
                <TouchableOpacity>
                  <ThemedText variant="caption" color="accent" style={styles.forgotPassword}>
                    ¿Olvidaste tu contraseña?
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                editable={!isLoggingIn}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              <ThemedText variant="label-large" style={styles.loginButtonText}>
                {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </ThemedText>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <ThemedText variant="body-small" color="secondary">
                ¿No tienes una cuenta?{' '}
              </ThemedText>
              <TouchableOpacity onPress={handleRegister} disabled={isLoggingIn}>
                <ThemedText variant="body-small" customColor="#000000" style={{ textDecorationLine: 'underline' }}>
                  Registrarse
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  keyboardView: {
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  contentTablet: {
    paddingHorizontal: 120,
    alignItems: 'center'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
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
    maxWidth: 400,
    width: '100%',
    padding: 40
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#6B7280'
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    marginBottom: 8,
    color: '#374151'
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  forgotPassword: {
    color: '#000000',
    textDecorationLine: 'underline'
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Aleo-Regular',
    color: '#111827',
    backgroundColor: '#FFFFFF'
  },
  loginButton: {
    backgroundColor: '#f1ef47',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  loginButtonDisabled: {
    backgroundColor: '#f1ef47',
    opacity: 0.7
  },
  loginButtonText: {
    color: '#000000',
    fontWeight: '600'
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default LoginScreen
