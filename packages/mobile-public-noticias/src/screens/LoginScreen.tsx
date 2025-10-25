import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { ThemedText } from '@/src/components/ThemedText'

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    // Login logic will be implemented here
    console.log('Login attempt:', { email, password })
  }

  const handleRegister = () => {
    // Navigate to register screen
    console.log('Navigate to register')
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Login Form Card */}
          <View style={styles.card}>
            <ThemedText variant="title-large" style={styles.title}>
              Iniciar Sesión
            </ThemedText>

            <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
              Ingresa tu email y contraseña para acceder
              al panel
            </ThemedText>

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
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <ThemedText variant="label-large" style={styles.loginButtonText}>
                Iniciar Sesión
              </ThemedText>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <ThemedText variant="body-small" color="secondary">
                ¿No tienes una cuenta?{' '}
              </ThemedText>
              <TouchableOpacity onPress={handleRegister}>
                <ThemedText variant="body-small" color="accent">
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
    color: '#3B82F6'
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
    backgroundColor: '#EAB308',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
})