// 🌐 API Client - Hybrid Auth (JWT + Sessions) for NestJS API
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { useAuthStore } from "../../auth/stores/authStore";
import type {
  AuthTokens,
  RefreshTokenResponse,
} from "../../auth/types/auth.types";

class ApiClient {
  private client: typeof axios;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];
  // Referencia mutable para tokens (actualizada via subscription)
  private tokensRef: { current: AuthTokens | null } = { current: null };
  private isAuthenticatedRef: { current: boolean } = { current: false };

  constructor() {
    this.client = this.createAxiosInstance();
    this.setupTokenSubscription();
    this.setupInterceptors();
  }

  private setupTokenSubscription(): void {
    // Suscribirse a cambios en authStore para mantener ref actualizada
    useAuthStore.subscribe((state) => {
      this.tokensRef.current = state.tokens;
      this.isAuthenticatedRef.current = state.isAuthenticated;
    });

    // Inicializar con valores actuales
    const currentState = useAuthStore.getState();
    this.tokensRef.current = currentState.tokens;
    this.isAuthenticatedRef.current = currentState.isAuthenticated;
  }

  private createAxiosInstance(): AxiosInstance {
    const baseURL = import.meta.env.VITE_API_URL || "/api";

    return axios.create({
      baseURL,
      timeout: 60000, // 60s para generación de contenido con IA
      // 🍪 IMPORTANT: Include cookies for session management
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  private setupInterceptors(): void {
    // 📤 REQUEST INTERCEPTOR - Platform detection + auth
    this.client.interceptors.request.use(
      (config) => {
        // 🌐 Platform detection header (required by NestJS API)
        config.headers["X-Platform"] = "web";

        // 🔑 JWT Token for API auth (if available)
        if (this.tokensRef.current?.accessToken && this.isAuthenticatedRef.current) {
          config.headers.Authorization = `Bearer ${this.tokensRef.current.accessToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 📥 RESPONSE INTERCEPTOR - Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors - Token expired or invalid
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // If already refreshing, queue the request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          return this.handleTokenRefresh(originalRequest);
        }

        // Handle 403 errors - Forbidden
        if (error.response?.status === 403) {
          this.handleAuthFailure();
        }

        return Promise.reject(error);
      }
    );
  }

  private async handleTokenRefresh(
    originalRequest: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    const tokens = this.tokensRef.current;
    const { refreshSession, logout } = useAuthStore.getState();

    if (!tokens?.refreshToken) {
      this.handleAuthFailure();
      return Promise.reject(new Error("No refresh token available"));
    }

    this.isRefreshing = true;

    try {
      // 🔄 Call refresh endpoint with platform detection
      const response = await axios.post<RefreshTokenResponse>(
        "/auth/refresh",
        { refreshToken: tokens.refreshToken },
        {
          baseURL: this.client.defaults.baseURL,
          withCredentials: true,
          headers: {
            "X-Platform": "web",
            "Content-Type": "application/json",
          },
        }
      );

      const newTokens: AuthTokens = response.data.tokens;

      // Update tokens in store
      refreshSession(newTokens);

      // Process failed queue
      this.processQueue(newTokens.accessToken, null);

      // Retry original request with new token
      originalRequest.headers!.Authorization = `Bearer ${newTokens.accessToken}`;
      return this.client(originalRequest);
    } catch (refreshError) {
      // Refresh failed - logout user
      this.processQueue(null, refreshError as Error);
      this.handleAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  private processQueue(token: string | null, error: Error | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private handleAuthFailure(): void {
    const { logout } = useAuthStore.getState();
    logout();

    // Clear any potential session cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // Redirect will be handled by TanStack Router guards
  }

  // 🔧 PUBLIC API METHODS

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // 🔧 UTILITY METHODS

  setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  // Get raw axios instance if needed
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
