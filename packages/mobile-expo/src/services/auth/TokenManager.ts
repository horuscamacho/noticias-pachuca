import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { CONFIG } from '@/src/config/env'
import { App } from '@/src/types/auth.types'

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = CONFIG.STORAGE.ACCESS_TOKEN_KEY
  private static readonly REFRESH_TOKEN_KEY = CONFIG.STORAGE.REFRESH_TOKEN_KEY

  // Almacenar tokens de forma segura
  static async setTokens(tokens: App.TokenPair): Promise<void> {
    try {
      await Promise.all([
        // Access token - encriptado en AsyncStorage (más rápido para acceso frecuente)
        AsyncStorage.setItem(
          this.ACCESS_TOKEN_KEY,
          JSON.stringify({
            token: tokens.accessToken,
            expiresAt: tokens.expiresAt.toISOString(),
            tokenType: tokens.tokenType
          })
        ),
        // Refresh token - SecureStore con biometría (más seguro)
        SecureStore.setItemAsync(
          this.REFRESH_TOKEN_KEY,
          JSON.stringify({
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + CONFIG.TOKEN.REFRESH_TOKEN_DURATION).toISOString()
          }),
          {
            // requireAuthentication solo funciona en development builds, no en Expo Go
            requireAuthentication: !Constants.appOwnership || Constants.appOwnership === 'expo' ? false : true,
            authenticationPrompt: 'Authenticate to access your account'
          }
        )
      ])
    } catch (error) {
      console.error('Error storing tokens:', error)
      throw new Error('Failed to store authentication tokens securely')
    }
  }

  // Obtener access token
  static async getAccessToken(): Promise<string | null> {
    try {
      const storedData = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY)
      if (!storedData) return null

      const { token, expiresAt } = JSON.parse(storedData)

      // Verificar si el token ha expirado
      if (new Date(expiresAt) <= new Date()) {
        await this.removeAccessToken()
        return null
      }

      return token
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }

  // Obtener refresh token
  static async getRefreshToken(): Promise<string | null> {
    try {
      const storedData = await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY)
      if (!storedData) return null

      const { token, expiresAt } = JSON.parse(storedData)

      // Verificar si el refresh token ha expirado
      if (new Date(expiresAt) <= new Date()) {
        await this.removeRefreshToken()
        return null
      }

      return token
    } catch (error) {
      console.error('Error getting refresh token:', error)
      return null
    }
  }

  // Verificar si el access token necesita refresh
  static async shouldRefreshToken(): Promise<boolean> {
    try {
      const storedData = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY)
      if (!storedData) return false

      const { expiresAt } = JSON.parse(storedData)
      const expirationTime = new Date(expiresAt)
      const now = new Date()
      const timeUntilExpiry = expirationTime.getTime() - now.getTime()

      // Refresh si expira en los próximos 2 minutos
      return timeUntilExpiry <= CONFIG.TOKEN.AUTO_REFRESH_THRESHOLD
    } catch (error) {
      console.error('Error checking token expiration:', error)
      return false
    }
  }

  // Obtener información del token
  static async getTokenInfo(): Promise<{
    hasAccessToken: boolean
    hasRefreshToken: boolean
    accessTokenExpiresAt: Date | null
    needsRefresh: boolean
  }> {
    try {
      const [accessTokenData, refreshTokenData] = await Promise.all([
        AsyncStorage.getItem(this.ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY)
      ])

      const hasAccessToken = !!accessTokenData
      const hasRefreshToken = !!refreshTokenData

      let accessTokenExpiresAt: Date | null = null
      let needsRefresh = false

      if (accessTokenData) {
        const { expiresAt } = JSON.parse(accessTokenData)
        accessTokenExpiresAt = new Date(expiresAt)
        needsRefresh = await this.shouldRefreshToken()
      }

      return {
        hasAccessToken,
        hasRefreshToken,
        accessTokenExpiresAt,
        needsRefresh
      }
    } catch (error) {
      console.error('Error getting token info:', error)
      return {
        hasAccessToken: false,
        hasRefreshToken: false,
        accessTokenExpiresAt: null,
        needsRefresh: false
      }
    }
  }

  // Refresh token automático
  static async refreshToken(): Promise<string> {
    const refreshToken = await this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      // Importación dinámica para evitar dependencias circulares
      const { ApiClient } = await import('@/src/services/api/ApiClient')
      const { TokenMapper } = await import('@/src/utils/mappers')

      const response = await ApiClient.post<{
        access_token: string
        refresh_token: string
        token_type: string
        expires_in: number
      }>('/auth/refresh', {
        refresh_token: refreshToken
      })

      const tokens = TokenMapper.toApp(response)
      await this.setTokens(tokens)

      return tokens.accessToken
    } catch (error) {
      console.error('Error refreshing token:', error)
      await this.clearTokens()
      throw new Error('Failed to refresh authentication token')
    }
  }

  // Validar formato JWT (validación básica)
  static isValidJWT(token: string): boolean {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return false

      // Verificar que se pueda decodificar el payload
      const payload = JSON.parse(atob(parts[1]))
      return payload.exp && payload.sub
    } catch {
      return false
    }
  }

  // Obtener información del payload del token
  static getTokenPayload(token: string): Record<string, unknown> | null {
    try {
      if (!this.isValidJWT(token)) return null

      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload
    } catch {
      return null
    }
  }

  // Verificar si el token está expirado (validación local)
  static isTokenExpired(token: string): boolean {
    try {
      const payload = this.getTokenPayload(token)
      if (!payload?.exp) return true

      return Date.now() >= (payload.exp as number) * 1000
    } catch {
      return true
    }
  }

  // Remover solo access token
  static async removeAccessToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ACCESS_TOKEN_KEY)
    } catch (error) {
      console.error('Error removing access token:', error)
    }
  }

  // Remover solo refresh token
  static async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error('Error removing refresh token:', error)
    }
  }

  // Limpiar todos los tokens
  static async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        this.removeAccessToken(),
        this.removeRefreshToken()
      ])
    } catch (error) {
      console.error('Error clearing tokens:', error)
    }
  }

  // Verificar si hay tokens válidos
  static async hasValidTokens(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()
      const refreshToken = await this.getRefreshToken()

      if (!accessToken && !refreshToken) return false

      // Si tenemos refresh token pero no access token, intentar refresh
      if (!accessToken && refreshToken) {
        try {
          await this.refreshToken()
          return true
        } catch {
          return false
        }
      }

      return !!accessToken
    } catch {
      return false
    }
  }
}