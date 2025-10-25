# ANALISIS DE ARQUITECTURA FRONTEND - CREACION DE CONTENIDO ORIGINAL

**Proyecto:** Noticias Pachuca
**Fecha:** 21 de Octubre, 2025
**Analista:** Jarvis (Frontend Developer Agent)
**Objetivo:** Implementar funcionalidad de creacion manual de contenido original con notificaciones urgentes

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura Frontend Actual](#arquitectura-frontend-actual)
3. [Patron Actions → Mapping → Hooks](#patron-actions-mapping-hooks)
4. [Sistema de Sockets y Tiempo Real](#sistema-de-sockets-y-tiempo-real)
5. [Manejo de Formularios](#manejo-de-formularios)
6. [Upload de Archivos](#upload-de-archivos)
7. [Estructura de Tabs y Navegacion](#estructura-de-tabs-y-navegacion)
8. [Propuesta de Implementacion](#propuesta-de-implementacion)
9. [Componentes a Crear](#componentes-a-crear)
10. [Plan de Implementacion por Fases](#plan-de-implementacion-por-fases)

---

## 1. RESUMEN EJECUTIVO

### Stack Tecnologico Actual

```typescript
// Core
- React Native 0.81.4
- React 19.1.0
- Expo ~54.0.16
- Expo Router ~6.0.13 (File-based routing)

// State Management & Data Fetching
- @tanstack/react-query ^5.89.0
- zustand ^5.0.8
- @tanstack/query-async-storage-persister ^5.89.0

// UI & Styling
- nativewind ^4.2.1 (Tailwind CSS)
- class-variance-authority ^0.7.1
- lucide-react-native ^0.545.0
- @rn-primitives/* (Radix-style primitives)

// Networking
- axios ^1.12.2
- socket.io-client ^4.8.1

// Form & Validation
- No hay libreria de forms (Custom implementation)
- Validacion manual en componentes

// Image & Media
- expo-image-picker ~17.0.8
- expo-image ~3.0.10
```

### Hallazgos Clave

1. **Patron de Arquitectura:** Services → Mappers → Hooks → Components
2. **Estado Global:** Zustand para estado UI, React Query para estado del servidor
3. **Formularios:** Implementacion custom sin React Hook Form ni Formik
4. **Modals:** React Native Modal con presentationStyle="pageSheet"
5. **Upload de Imagenes:** FormData con axios, subida a backend que procesa y almacena
6. **Sockets:** Socket.io client con auto-conexion y manejo de eventos personalizados
7. **Navegacion:** Expo Router con file-based routing y Native Tabs

---

## 2. ARQUITECTURA FRONTEND ACTUAL

### Estructura de Directorios

```
packages/mobile-expo/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Auth screens
│   ├── (protected)/              # Protected routes
│   │   ├── (tabs)/               # Tab navigation
│   │   │   ├── home.tsx
│   │   │   ├── extract.tsx       # Tab de Sitios
│   │   │   ├── generate.tsx      # Tab de Contenidos
│   │   │   ├── generados.tsx     # Tab de Generados
│   │   │   ├── images.tsx        # Tab de Imagenes
│   │   │   └── stats.tsx
│   │   └── generated/            # Stack screens
│   ├── _layout.tsx
│   └── index.tsx
│
├── src/
│   ├── components/               # UI Components
│   │   ├── ThemedText/
│   │   ├── ThemedList/
│   │   ├── sites/                # Site-specific components
│   │   │   ├── SiteFormFields.tsx
│   │   │   └── SocialMediaConfig.tsx
│   │   ├── extracted-news/       # Extracted news components
│   │   │   ├── FilterBottomSheet.tsx
│   │   │   └── KeywordSelector.tsx
│   │   ├── generated-content/    # Generated content components
│   │   ├── content/              # Content components
│   │   ├── image-bank/
│   │   └── image-generation/
│   │
│   ├── services/                 # API Services Layer
│   │   ├── api/
│   │   │   ├── ApiClient.ts      # Axios instance with interceptors
│   │   │   ├── imageBankApi.ts
│   │   │   └── imageGenerationApi.ts
│   │   ├── auth/
│   │   │   ├── TokenManager.ts
│   │   │   └── DeviceInfoService.ts
│   │   ├── sites/
│   │   │   └── sitesApi.ts       # CRUD Sites
│   │   └── image-bank/
│   │       └── imageBankApi.ts
│   │
│   ├── hooks/                    # Custom Hooks (TanStack Query)
│   │   ├── useSites.ts
│   │   ├── useExtractedContent.ts
│   │   ├── useGeneratedContent.ts
│   │   ├── useUploadImages.ts
│   │   └── useAuth.ts
│   │
│   ├── utils/
│   │   └── mappers.ts            # API ↔ App data transformers
│   │
│   ├── types/                    # TypeScript types
│   │   ├── site.types.ts
│   │   ├── extracted-content.types.ts
│   │   ├── generated-content.types.ts
│   │   └── image-bank.types.ts
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   └── appStore.ts
│   │
│   ├── features/                 # Feature modules
│   │   ├── socket/
│   │   │   ├── services/
│   │   │   │   └── SocketService.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts
│   │   │   │   └── useRealtimeQuery.ts
│   │   │   ├── stores/
│   │   │   │   ├── socketStore.ts
│   │   │   │   └── notificationStore.ts
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── responsive/
│   │   └── analytics/
│   │
│   └── config/
│       ├── queryClient.ts        # React Query config
│       └── env.ts
│
└── components/ui/                # UI primitives (shadcn-style)
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── textarea.tsx
    ├── switch.tsx
    ├── label.tsx
    └── badge.tsx
```

---

## 3. PATRON ACTIONS → MAPPING → HOOKS

### Flujo Completo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                       COMPONENT (UI)                            │
│  - Usa hooks custom                                             │
│  - Renderiza data                                               │
│  - Maneja eventos de usuario                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOM HOOK (React Query)                    │
│  - useQuery / useMutation / useInfiniteQuery                    │
│  - Query keys para cache invalidation                          │
│  - onSuccess callbacks                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API SERVICE                                │
│  - Funciones async que usan ApiClient                          │
│  - Construye URLs y params                                      │
│  - Usa Mappers para transformar data                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MAPPER LAYER                               │
│  - toApp(apiData): snake_case → camelCase                      │
│  - toAPI(appData): camelCase → snake_case                      │
│  - createToAPI / updateToAPI                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API CLIENT                                 │
│  - Axios instance con interceptors                              │
│  - Auto token refresh                                           │
│  - Error handling global                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Ejemplo Real: Creacion de Site

#### 1. Tipos (types/site.types.ts)

```typescript
export interface CreateSitePayload {
  domain: string;
  name: string;
  description: string;
  isMainSite?: boolean;
  isActive?: boolean;
}

export interface Site {
  id: string;
  domain: string;
  slug: string;
  name: string;
  description: string;
  socialMedia?: SocialMedia;
  isActive: boolean;
  isMainSite: boolean;
  totalNoticias: number;
  totalViews: number;
  totalSocialPosts: number;
  createdAt: string;
  updatedAt: string;
}
```

#### 2. Mapper (utils/mappers.ts)

```typescript
export class SiteMapper {
  static toApp(apiSite: Record<string, unknown>): Site {
    return {
      id: apiSite.id as string || apiSite._id as string,
      domain: apiSite.domain as string,
      slug: apiSite.slug as string,
      name: apiSite.name as string,
      description: apiSite.description as string,
      socialMedia: apiSite.socialMedia as Site['socialMedia'],
      isActive: apiSite.isActive as boolean ?? true,
      isMainSite: apiSite.isMainSite as boolean ?? false,
      totalNoticias: apiSite.totalNoticias as number || 0,
      totalViews: apiSite.totalViews as number || 0,
      totalSocialPosts: apiSite.totalSocialPosts as number || 0,
      createdAt: apiSite.createdAt as string || new Date().toISOString(),
      updatedAt: apiSite.updatedAt as string || new Date().toISOString()
    }
  }

  static createToAPI(appSite: CreateSitePayload): Record<string, unknown> {
    return {
      domain: appSite.domain,
      name: appSite.name,
      description: appSite.description,
      isMainSite: appSite.isMainSite,
      isActive: appSite.isActive
    }
  }
}
```

#### 3. API Service (services/sites/sitesApi.ts)

```typescript
export const sitesApi = {
  createSite: async (data: CreateSitePayload): Promise<Site> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // Transformar payload para API
      const apiPayload = SiteMapper.createToAPI(data);

      const response = await rawClient.post<Record<string, unknown>>(
        '/pachuca-noticias/sites',
        apiPayload
      );

      return SiteMapper.toApp(response.data);
    } catch (error) {
      console.error('Error creating site:', error);
      throw error;
    }
  }
}
```

#### 4. Custom Hook (hooks/useSites.ts)

```typescript
export const sitesKeys = {
  all: ['sites'] as const,
  lists: () => [...sitesKeys.all, 'list'] as const,
  list: (filters?: SitesFilters) => [...sitesKeys.lists(), filters] as const,
  details: () => [...sitesKeys.all, 'detail'] as const,
  detail: (id: string) => [...sitesKeys.details(), id] as const,
  stats: () => [...sitesKeys.all, 'stats'] as const,
};

export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSitePayload) => sitesApi.createSite(data),
    onSuccess: () => {
      // Invalidar todas las listas de sites y stats
      queryClient.invalidateQueries({ queryKey: sitesKeys.all });
    },
  });
}
```

#### 5. Componente UI

```typescript
import { useCreateSite } from '@/src/hooks/useSites';

export function CreateSiteModal() {
  const { mutate: createSite, isPending } = useCreateSite();
  const [formData, setFormData] = useState<CreateSitePayload>({
    domain: '',
    name: '',
    description: '',
    isMainSite: false,
    isActive: true
  });

  const handleSubmit = () => {
    createSite(formData, {
      onSuccess: (site) => {
        console.log('Site created:', site);
        // Cerrar modal, mostrar toast, etc.
      },
      onError: (error) => {
        console.error('Error:', error);
      }
    });
  };

  return (
    <Modal>
      <SiteFormFields
        data={formData}
        onChange={setFormData}
      />
      <Button onPress={handleSubmit} disabled={isPending}>
        Crear Sitio
      </Button>
    </Modal>
  );
}
```

### Ventajas del Patron

1. **Separacion de Responsabilidades:** Cada capa tiene un proposito claro
2. **Type Safety:** TypeScript en toda la cadena
3. **Testabilidad:** Cada capa se puede testear independientemente
4. **Cache Inteligente:** React Query maneja cache y revalidacion
5. **Transformacion de Datos:** Mappers centralizan la logica de transformacion
6. **Reutilizacion:** Hooks se pueden usar en multiples componentes

---

## 4. SISTEMA DE SOCKETS Y TIEMPO REAL

### Arquitectura de Sockets

```typescript
// features/socket/services/SocketService.ts
export class SocketService {
  private static instance: SocketService | null = null;
  private _socket: Socket | null = null;
  private queryClient: QueryClient;

  static getInstance(queryClient: QueryClient): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService(queryClient);
    }
    return SocketService.instance;
  }

  async connect(): Promise<void> {
    const token = await TokenManager.getAccessToken();
    const deviceId = await DeviceInfoService.getDeviceId();

    const socketUrl = ENV.API_BASE_URL.replace(/^https?/, 'ws').replace('/api', '');

    this._socket = io(socketUrl, {
      auth: { token },
      extraHeaders: {
        'authorization': `Bearer ${token}`,
        'x-platform': 'mobile',
        'x-device-id': deviceId
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    this.setupEventHandlers();
    this._socket.connect();
  }

  private setupEventHandlers(): void {
    // Connection events
    this._socket.on('connect', () => this.updateConnectionState('connected'));
    this._socket.on('disconnect', () => this.updateConnectionState('disconnected'));

    // Backend specific events
    this._socket.on('notification', (data) => this.handleNotification(data));
    this._socket.on('message', (data) => this.handleMessage(data));
  }

  private handleNotification(data: SocketAPI.SocketMessage): void {
    // Invalidar queries relacionadas
    this.queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  emit<K extends keyof SocketEventMap>(event: K, data: SocketEventMap[K]): boolean {
    if (this._socket?.connected) {
      this._socket.emit(event as string, data);
      return true;
    }
    return false;
  }

  get socket(): Socket | null {
    return this._socket;
  }
}
```

### Hook de Socket

```typescript
// features/socket/hooks/useSocket.ts
export const useSocket = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { connectionState, isOnline, roomsJoined } = useSocketStore();

  // Auto-connect cuando el usuario esta autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const socketService = SocketService.getInstance(queryClient);
      socketService.connect().catch(error => {
        console.error('Socket connection failed:', error);
      });
    } else {
      const socketService = SocketService.getInstance(queryClient);
      socketService.disconnect();
      reset();
    }
  }, [isAuthenticated, queryClient, reset]);

  const joinRoom = useCallback((roomId: string) => {
    const socketService = SocketService.getInstance(queryClient);
    socketService.joinRoom(roomId);
    storeJoinRoom(roomId);
  }, [queryClient, storeJoinRoom]);

  return {
    connectionState,
    isConnected: isOnline,
    joinRoom,
    leaveRoom,
    isAuthenticatedAndConnected: isAuthenticated && isOnline
  };
}
```

### Escuchar Eventos Personalizados

```typescript
// Ejemplo: hooks/useImageGenerationSocket.ts
export const useImageGenerationSocket = (generationId: string) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !generationId) return;

    const handleProgress = (data: any) => {
      if (data.generationId === generationId) {
        // Actualizar query especifica
        queryClient.setQueryData(
          imageGenerationKeys.detail(generationId),
          (old: any) => ({
            ...old,
            status: data.status,
            progress: data.progress
          })
        );
      }
    };

    socket.on('image-generation:progress', handleProgress);
    socket.on('image-generation:completed', handleProgress);

    return () => {
      socket.off('image-generation:progress', handleProgress);
      socket.off('image-generation:completed', handleProgress);
    };
  }, [socket, generationId, queryClient]);
};
```

### Store de Sockets (Zustand)

```typescript
// features/socket/stores/socketStore.ts
export const useSocketStore = create<SocketStore>((set) => ({
  connectionState: 'disconnected',
  isOnline: false,
  roomsJoined: [],

  updateConnectionState: (state) => set({
    connectionState: state,
    isOnline: state === 'connected'
  }),

  joinRoom: (roomId) => set((state) => ({
    roomsJoined: [...state.roomsJoined, roomId]
  })),

  leaveRoom: (roomId) => set((state) => ({
    roomsJoined: state.roomsJoined.filter(id => id !== roomId)
  })),
}));
```

---

## 5. MANEJO DE FORMULARIOS

### Patron Actual: Custom Implementation

**Caracteristicas:**
- No usa React Hook Form ni Formik
- Estado local con useState
- Validacion manual
- Props pattern para componentes reutilizables

### Ejemplo: SiteFormFields Component

```typescript
export interface SiteFormFieldsProps {
  data: CreateSitePayload;
  onChange: (data: CreateSitePayload) => void;
  errors?: Partial<Record<keyof CreateSitePayload, string>>;
}

export function SiteFormFields({ data, onChange, errors }: SiteFormFieldsProps) {
  const updateField = <K extends keyof CreateSitePayload>(
    field: K,
    value: CreateSitePayload[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <CardContent>
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
            <Label>Descripcion *</Label>
            <Textarea
              value={data.description}
              onChangeText={(text) => {
                if (text.length <= 500) {
                  updateField('description', text);
                }
              }}
              placeholder="Describe brevemente..."
              rows={4}
            />
            <ThemedText variant="label-small" color="secondary">
              {data.description.length}/500 caracteres
            </ThemedText>
          </View>

          {/* isActive Switch */}
          <View style={styles.switchField}>
            <View style={styles.switchLabel}>
              <Label>Estado del Sitio</Label>
              <ThemedText variant="body-small" color="secondary">
                {data.isActive ? 'Activo' : 'Desactivado'}
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
```

### Patron de Validacion

```typescript
function validateSiteForm(data: CreateSitePayload): {
  isValid: boolean;
  errors: Partial<Record<keyof CreateSitePayload, string>>;
} {
  const errors: Partial<Record<keyof CreateSitePayload, string>> = {};

  // Domain validation
  if (!data.domain || data.domain.trim() === '') {
    errors.domain = 'El dominio es requerido';
  } else if (!/^[a-z0-9-.]+(\.com|\.mx|\.net)$/.test(data.domain)) {
    errors.domain = 'Formato de dominio invalido';
  }

  // Name validation
  if (!data.name || data.name.trim() === '') {
    errors.name = 'El nombre es requerido';
  } else if (data.name.length < 3) {
    errors.name = 'El nombre debe tener al menos 3 caracteres';
  }

  // Description validation
  if (!data.description || data.description.trim() === '') {
    errors.description = 'La descripcion es requerida';
  } else if (data.description.length < 10) {
    errors.description = 'La descripcion debe tener al menos 10 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

### Uso en Modal/Screen

```typescript
export default function CreateSiteModal({ visible, onClose }: Props) {
  const { mutate: createSite, isPending } = useCreateSite();
  const [formData, setFormData] = useState<CreateSitePayload>({
    domain: '',
    name: '',
    description: '',
    isMainSite: false,
    isActive: true
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateSitePayload, string>>>({});

  const handleSubmit = () => {
    // Validate
    const validation = validateSiteForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Clear errors
    setErrors({});

    // Submit
    createSite(formData, {
      onSuccess: (site) => {
        console.log('Site created:', site);
        onClose();
        // Show success toast
      },
      onError: (error) => {
        console.error('Error:', error);
        // Show error toast
      }
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="title-medium">Crear Nuevo Sitio</ThemedText>
          <Pressable onPress={onClose}>
            <X size={24} color="#6B7280" />
          </Pressable>
        </View>

        <SiteFormFields
          data={formData}
          onChange={setFormData}
          errors={errors}
        />

        <View style={styles.footer}>
          <Button onPress={handleSubmit} disabled={isPending}>
            {isPending ? 'Creando...' : 'Crear Sitio'}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
```

---

## 6. UPLOAD DE ARCHIVOS

### Sistema Actual de Upload

#### 1. API Service (services/api/imageBankApi.ts)

```typescript
export const imageBankApi = {
  uploadImages: async (formData: FormData): Promise<UploadImageResponse> => {
    const rawClient = ApiClient.getRawClient();

    const response = await rawClient.post<UploadImageResponse>(
      '/image-bank/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos para uploads grandes
      }
    );

    return response.data;
  },
};
```

#### 2. Hook Custom (hooks/useUploadImages.ts)

```typescript
export function useUploadImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => imageBankApi.uploadImages(formData),
    onSuccess: (data: UploadImageResponse) => {
      console.log(`${data.totalUploaded} imagen(es) subida(s) correctamente`);

      // Invalidar cache del banco de imagenes
      queryClient.invalidateQueries({ queryKey: ['image-bank'] });
      queryClient.invalidateQueries({ queryKey: ['image-bank-stats'] });
      queryClient.invalidateQueries({ queryKey: ['image-bank-keywords'] });
    },
    onError: (error) => {
      console.error('Error uploading images:', error);
    },
  });
}
```

#### 3. Uso con expo-image-picker

```typescript
import * as ImagePicker from 'expo-image-picker';
import { useUploadImages } from '@/src/hooks/useUploadImages';

export function ImageUploadComponent() {
  const { mutate: uploadImages, isPending } = useUploadImages();

  const handlePickImages = async () => {
    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Necesitamos permisos para acceder a tus fotos');
      return;
    }

    // Seleccionar imagenes (multiple)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets.length > 0) {
      // Crear FormData
      const formData = new FormData();

      result.assets.forEach((asset, index) => {
        const uri = asset.uri;
        const filename = uri.split('/').pop() || `image-${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('images', {
          uri,
          name: filename,
          type,
        } as any);
      });

      // Metadata opcional
      formData.append('author', 'Usuario Manual');
      formData.append('captureType', 'manual');

      // Upload
      uploadImages(formData, {
        onSuccess: (response) => {
          console.log('Upload exitoso:', response);
          alert(`${response.totalUploaded} imagenes subidas`);
        },
        onError: (error) => {
          console.error('Error:', error);
          alert('Error al subir imagenes');
        }
      });
    }
  };

  return (
    <Button onPress={handlePickImages} disabled={isPending}>
      {isPending ? 'Subiendo...' : 'Seleccionar Imagenes'}
    </Button>
  );
}
```

### Upload Multiple con Preview

```typescript
export function MultipleImageUpload() {
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const { mutate: uploadImages, isPending } = useUploadImages();

  const handleAddImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, ...result.assets]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    const formData = new FormData();

    selectedImages.forEach((asset, index) => {
      const uri = asset.uri;
      const filename = uri.split('/').pop() || `image-${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('images', {
        uri,
        name: filename,
        type,
      } as any);
    });

    uploadImages(formData, {
      onSuccess: () => {
        setSelectedImages([]);
        alert('Imagenes subidas exitosamente');
      }
    });
  };

  return (
    <View>
      {/* Image Grid Preview */}
      <ScrollView horizontal>
        {selectedImages.map((image, index) => (
          <View key={index} style={styles.imagePreview}>
            <Image source={{ uri: image.uri }} style={styles.thumbnail} />
            <Pressable onPress={() => handleRemoveImage(index)}>
              <X size={20} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Actions */}
      <Button onPress={handleAddImages}>Agregar Imagenes</Button>
      <Button
        onPress={handleUpload}
        disabled={selectedImages.length === 0 || isPending}
      >
        {isPending ? 'Subiendo...' : `Subir ${selectedImages.length} imagenes`}
      </Button>
    </View>
  );
}
```

---

## 7. ESTRUCTURA DE TABS Y NAVEGACION

### Tabs Actuales (Expo Router Native Tabs)

```typescript
// app/(protected)/(tabs)/_layout.tsx
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Label>Inicio</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="extract">
        <Label>Sitios</Label>
        <Icon sf="doc.text.magnifyingglass" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="generate">
        <Label>Contenidos</Label>
        <Icon sf="sparkles" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="generados">
        <Label>Generados</Label>
        <Icon sf="doc.text" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="images">
        <Label>Imagenes</Label>
        <Icon sf="photo.stack" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <Label>Stats</Label>
        <Icon sf="chart.bar" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

### Nueva Tab Propuesta: "Noticias en Progreso"

```typescript
<NativeTabs.Trigger name="urgent-news">
  <Label>Urgentes</Label>
  <Icon sf="exclamationmark.triangle.fill" />
</NativeTabs.Trigger>
```

---

## 8. PROPUESTA DE IMPLEMENTACION

### Funcionalidades Requeridas

1. **Boton "Crear Contenido Original" en Tab de Contenidos**
   - Similar al boton de "Crear nuevo sitio"
   - Abre modal con formulario

2. **Modal de Creacion con Formulario**
   - Titulo (input text)
   - Contenido (textarea/rich text)
   - Upload de imagenes/videos (opcional, multiple)
   - Toggle "Urgent" (switch)
   - Si NO urgent: Radio buttons ("Breaking", "Noticia", "Post de blog")
   - Checkbox "Usar banco de imagenes si no se suben"
   - Boton "Crear y Publicar"

3. **Nueva Tab "Noticias en Progreso"**
   - Muestra solo noticias con `urgent: true`
   - Card con: Titulo, tiempo transcurrido, boton "Actualizar contenido"
   - Socket para auto-refresh cuando hay cambios

4. **Cintillo "ULTIMO MOMENTO"**
   - Componente ya existe en UI
   - Debe mostrar noticias urgent mas recientes
   - Auto-actualiza en tiempo real via socket

### Arquitectura de Backend Requerida

```typescript
// ENDPOINTS NECESARIOS

POST /api/original-content
Body: {
  title: string;
  content: string;
  images?: File[]; // Opcional
  videos?: File[]; // Opcional
  urgent: boolean;
  type?: 'breaking' | 'noticia' | 'blog'; // Si no urgent
  useImageBank?: boolean; // Si no se suben imagenes
}
Response: {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  urgent: boolean;
  type?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

GET /api/original-content?urgent=true
Response: {
  data: OriginalContent[];
  total: number;
}

PATCH /api/original-content/:id
Body: {
  content?: string;
  images?: File[];
  status?: string;
}

// SOCKET EVENTS
'original-content:created' - Cuando se crea contenido urgent
'original-content:updated' - Cuando se actualiza contenido urgent
'original-content:published' - Cuando se publica contenido
```

---

## 9. COMPONENTES A CREAR

### 9.1. Tipos TypeScript

```typescript
// src/types/original-content.types.ts

export type ContentType = 'breaking' | 'noticia' | 'blog';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface OriginalContent {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  urgent: boolean;
  type?: ContentType;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    id: string;
    name: string;
  };
}

export interface CreateOriginalContentPayload {
  title: string;
  content: string;
  urgent: boolean;
  type?: ContentType;
  useImageBank?: boolean;
}

export interface UpdateOriginalContentPayload {
  content?: string;
  status?: ContentStatus;
}

export interface OriginalContentFilters {
  urgent?: boolean;
  type?: ContentType;
  status?: ContentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface OriginalContentListResponse {
  data: OriginalContent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 9.2. Mapper

```typescript
// src/utils/mappers.ts (agregar)

export class OriginalContentMapper {
  static toApp(apiContent: Record<string, unknown>): OriginalContent {
    return {
      id: apiContent.id as string,
      title: apiContent.title as string,
      content: apiContent.content as string,
      imageUrls: apiContent.imageUrls as string[] || apiContent.image_urls as string[] || [],
      videoUrls: apiContent.videoUrls as string[] || apiContent.video_urls as string[] || [],
      urgent: apiContent.urgent as boolean ?? false,
      type: apiContent.type as ContentType,
      status: apiContent.status as ContentStatus || 'draft',
      createdAt: apiContent.createdAt as string || apiContent.created_at as string,
      updatedAt: apiContent.updatedAt as string || apiContent.updated_at as string,
      publishedAt: apiContent.publishedAt as string | undefined || apiContent.published_at as string | undefined,
      author: {
        id: (apiContent.author as any)?.id || '',
        name: (apiContent.author as any)?.name || 'Usuario'
      }
    };
  }

  static createToAPI(appContent: CreateOriginalContentPayload): Record<string, unknown> {
    return {
      title: appContent.title,
      content: appContent.content,
      urgent: appContent.urgent,
      type: appContent.type,
      useImageBank: appContent.useImageBank
    };
  }

  static updateToAPI(appContent: UpdateOriginalContentPayload): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (appContent.content !== undefined) payload.content = appContent.content;
    if (appContent.status !== undefined) payload.status = appContent.status;

    return payload;
  }
}
```

### 9.3. API Service

```typescript
// src/services/original-content/originalContentApi.ts

import { ApiClient } from '@/src/services/api/ApiClient';
import { OriginalContentMapper } from '@/src/utils/mappers';
import type {
  OriginalContent,
  CreateOriginalContentPayload,
  UpdateOriginalContentPayload,
  OriginalContentFilters,
  OriginalContentListResponse,
} from '@/src/types/original-content.types';

export const originalContentApi = {
  /**
   * Obtener lista de contenido original con filtros
   */
  getOriginalContent: async (filters?: OriginalContentFilters): Promise<OriginalContentListResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const params = new URLSearchParams();
      if (filters?.urgent !== undefined) params.append('urgent', String(filters.urgent));
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const url = queryString ? `/original-content?${queryString}` : '/original-content';

      const response = await rawClient.get<{
        data: Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(url);

      return {
        data: response.data.data.map(item => OriginalContentMapper.toApp(item)),
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
      };
    } catch (error) {
      console.error('Error fetching original content:', error);
      throw error;
    }
  },

  /**
   * Obtener contenido original por ID
   */
  getOriginalContentById: async (id: string): Promise<OriginalContent> => {
    try {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.get<Record<string, unknown>>(`/original-content/${id}`);
      return OriginalContentMapper.toApp(response.data);
    } catch (error) {
      console.error(`Error fetching original content ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear contenido original
   */
  createOriginalContent: async (
    data: CreateOriginalContentPayload,
    files?: { images?: File[]; videos?: File[] }
  ): Promise<OriginalContent> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // Si hay archivos, usar FormData
      if (files && (files.images?.length || files.videos?.length)) {
        const formData = new FormData();

        // Agregar datos del formulario
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('urgent', String(data.urgent));
        if (data.type) formData.append('type', data.type);
        if (data.useImageBank !== undefined) formData.append('useImageBank', String(data.useImageBank));

        // Agregar imagenes
        if (files.images) {
          files.images.forEach((image, index) => {
            formData.append('images', image);
          });
        }

        // Agregar videos
        if (files.videos) {
          files.videos.forEach((video, index) => {
            formData.append('videos', video);
          });
        }

        const response = await rawClient.post<Record<string, unknown>>(
          '/original-content',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutos para uploads grandes
          }
        );

        return OriginalContentMapper.toApp(response.data);
      } else {
        // Sin archivos, JSON normal
        const apiPayload = OriginalContentMapper.createToAPI(data);
        const response = await rawClient.post<Record<string, unknown>>(
          '/original-content',
          apiPayload
        );
        return OriginalContentMapper.toApp(response.data);
      }
    } catch (error) {
      console.error('Error creating original content:', error);
      throw error;
    }
  },

  /**
   * Actualizar contenido original
   */
  updateOriginalContent: async (
    id: string,
    data: UpdateOriginalContentPayload,
    files?: { images?: File[]; videos?: File[] }
  ): Promise<OriginalContent> => {
    try {
      const rawClient = ApiClient.getRawClient();

      if (files && (files.images?.length || files.videos?.length)) {
        const formData = new FormData();

        if (data.content) formData.append('content', data.content);
        if (data.status) formData.append('status', data.status);

        if (files.images) {
          files.images.forEach(image => formData.append('images', image));
        }

        if (files.videos) {
          files.videos.forEach(video => formData.append('videos', video));
        }

        const response = await rawClient.patch<Record<string, unknown>>(
          `/original-content/${id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000,
          }
        );

        return OriginalContentMapper.toApp(response.data);
      } else {
        const apiPayload = OriginalContentMapper.updateToAPI(data);
        const response = await rawClient.patch<Record<string, unknown>>(
          `/original-content/${id}`,
          apiPayload
        );
        return OriginalContentMapper.toApp(response.data);
      }
    } catch (error) {
      console.error(`Error updating original content ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar contenido original
   */
  deleteOriginalContent: async (id: string): Promise<void> => {
    try {
      const rawClient = ApiClient.getRawClient();
      await rawClient.delete(`/original-content/${id}`);
    } catch (error) {
      console.error(`Error deleting original content ${id}:`, error);
      throw error;
    }
  },
};
```

### 9.4. Custom Hooks

```typescript
// src/hooks/useOriginalContent.ts

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { originalContentApi } from '@/src/services/original-content/originalContentApi';
import type {
  OriginalContentFilters,
  CreateOriginalContentPayload,
  UpdateOriginalContentPayload,
} from '@/src/types/original-content.types';

/**
 * Query keys para React Query
 */
export const originalContentKeys = {
  all: ['original-content'] as const,
  lists: () => [...originalContentKeys.all, 'list'] as const,
  list: (filters?: OriginalContentFilters) => [...originalContentKeys.lists(), filters] as const,
  details: () => [...originalContentKeys.all, 'detail'] as const,
  detail: (id: string) => [...originalContentKeys.details(), id] as const,
  urgent: () => [...originalContentKeys.all, 'urgent'] as const,
};

/**
 * Hook para obtener lista de contenido original
 */
export function useOriginalContent(filters?: OriginalContentFilters) {
  return useQuery({
    queryKey: originalContentKeys.list(filters),
    queryFn: () => originalContentApi.getOriginalContent(filters),
    staleTime: 30 * 1000, // 30 segundos (contenido puede cambiar frecuentemente)
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener solo contenido URGENT
 */
export function useUrgentContent() {
  return useQuery({
    queryKey: originalContentKeys.urgent(),
    queryFn: () => originalContentApi.getOriginalContent({ urgent: true }),
    staleTime: 10 * 1000, // 10 segundos (urgente necesita actualizarse rapido)
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30 * 1000, // Auto-refetch cada 30 segundos
  });
}

/**
 * Hook para obtener contenido por ID
 */
export function useOriginalContentById(id: string) {
  return useQuery({
    queryKey: originalContentKeys.detail(id),
    queryFn: () => originalContentApi.getOriginalContentById(id),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Hook para crear contenido original
 */
export function useCreateOriginalContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: CreateOriginalContentPayload;
      files?: { images?: any[]; videos?: any[] };
    }) => originalContentApi.createOriginalContent(data, files),
    onSuccess: (newContent) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: originalContentKeys.lists() });

      // Si es urgent, invalidar lista de urgentes
      if (newContent.urgent) {
        queryClient.invalidateQueries({ queryKey: originalContentKeys.urgent() });
      }
    },
  });
}

/**
 * Hook para actualizar contenido original
 */
export function useUpdateOriginalContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: string;
      data: UpdateOriginalContentPayload;
      files?: { images?: any[]; videos?: any[] };
    }) => originalContentApi.updateOriginalContent(id, data, files),
    onSuccess: (updatedContent, variables) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: originalContentKeys.lists() });

      // Invalidar detalle especifico
      queryClient.invalidateQueries({ queryKey: originalContentKeys.detail(variables.id) });

      // Si es urgent, invalidar lista de urgentes
      if (updatedContent.urgent) {
        queryClient.invalidateQueries({ queryKey: originalContentKeys.urgent() });
      }
    },
  });
}

/**
 * Hook para eliminar contenido
 */
export function useDeleteOriginalContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => originalContentApi.deleteOriginalContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: originalContentKeys.all });
    },
  });
}
```

### 9.5. Socket Hook para Urgentes

```typescript
// src/hooks/useUrgentContentSocket.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketService } from '@/src/features/socket/services/SocketService';
import { originalContentKeys } from './useOriginalContent';

export const useUrgentContentSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socketService = SocketService.getInstance(queryClient);
    const socket = socketService.socket;

    if (!socket) return;

    // Evento: Nuevo contenido urgent creado
    const handleContentCreated = (data: any) => {
      console.log('Socket: Nuevo contenido urgent creado', data);

      // Invalidar lista de urgentes
      queryClient.invalidateQueries({ queryKey: originalContentKeys.urgent() });
    };

    // Evento: Contenido urgent actualizado
    const handleContentUpdated = (data: any) => {
      console.log('Socket: Contenido urgent actualizado', data);

      // Invalidar lista de urgentes
      queryClient.invalidateQueries({ queryKey: originalContentKeys.urgent() });

      // Invalidar detalle especifico
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: originalContentKeys.detail(data.id) });
      }
    };

    // Evento: Contenido publicado
    const handleContentPublished = (data: any) => {
      console.log('Socket: Contenido publicado', data);

      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: originalContentKeys.all });
    };

    // Registrar listeners
    socket.on('original-content:created', handleContentCreated);
    socket.on('original-content:updated', handleContentUpdated);
    socket.on('original-content:published', handleContentPublished);

    // Cleanup
    return () => {
      socket.off('original-content:created', handleContentCreated);
      socket.off('original-content:updated', handleContentUpdated);
      socket.off('original-content:published', handleContentPublished);
    };
  }, [queryClient]);
};
```

### 9.6. Componente: OriginalContentFormFields

```typescript
// src/components/content/OriginalContentFormFields.tsx

import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/src/components/ThemedText';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image as ImageIcon } from 'lucide-react-native';
import type { CreateOriginalContentPayload, ContentType } from '@/src/types/original-content.types';

export interface OriginalContentFormFieldsProps {
  data: CreateOriginalContentPayload;
  onChange: (data: CreateOriginalContentPayload) => void;
  selectedImages: ImagePicker.ImagePickerAsset[];
  onImagesChange: (images: ImagePicker.ImagePickerAsset[]) => void;
  errors?: Partial<Record<keyof CreateOriginalContentPayload, string>>;
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'breaking', label: 'Breaking News' },
  { value: 'noticia', label: 'Noticia' },
  { value: 'blog', label: 'Post de Blog' },
];

export function OriginalContentFormFields({
  data,
  onChange,
  selectedImages,
  onImagesChange,
  errors,
}: OriginalContentFormFieldsProps) {
  const updateField = <K extends keyof CreateOriginalContentPayload>(
    field: K,
    value: CreateOriginalContentPayload[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Necesitamos permisos para acceder a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      onImagesChange([...selectedImages, ...result.assets]);
    }
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(selectedImages.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Titulo */}
      <Card style={styles.section}>
        <CardContent style={styles.cardContent}>
          <View style={styles.field}>
            <Label>Titulo *</Label>
            <Input
              value={data.title}
              onChangeText={(text) => updateField('title', text)}
              placeholder="Ingresa el titulo de la noticia..."
              style={errors?.title ? styles.inputError : undefined}
            />
            {errors?.title && (
              <ThemedText variant="label-small" style={styles.error}>
                {errors.title}
              </ThemedText>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Contenido */}
      <Card style={styles.section}>
        <CardContent style={styles.cardContent}>
          <View style={styles.field}>
            <Label>Contenido *</Label>
            <Textarea
              value={data.content}
              onChangeText={(text) => updateField('content', text)}
              placeholder="Escribe el contenido de la noticia..."
              rows={10}
              style={[styles.contentTextarea, errors?.content ? styles.inputError : undefined]}
            />
            {errors?.content && (
              <ThemedText variant="label-small" style={styles.error}>
                {errors.content}
              </ThemedText>
            )}
            <ThemedText variant="label-small" color="secondary">
              {data.content.length} caracteres
            </ThemedText>
          </View>
        </CardContent>
      </Card>

      {/* Imagenes/Videos */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-small">Multimedia (Opcional)</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Imagenes Seleccionadas */}
          {selectedImages.length > 0 && (
            <View style={styles.imageGrid}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                  <Pressable
                    onPress={() => handleRemoveImage(index)}
                    style={styles.removeButton}
                  >
                    <X size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Boton Upload */}
          <Pressable onPress={handlePickImages} style={styles.uploadButton}>
            <Upload size={20} color="#6B7280" />
            <ThemedText variant="label-medium" style={styles.uploadText}>
              {selectedImages.length > 0 ? 'Agregar mas imagenes' : 'Seleccionar imagenes'}
            </ThemedText>
          </Pressable>

          {/* Checkbox: Usar banco de imagenes */}
          {selectedImages.length === 0 && (
            <View style={styles.checkboxContainer}>
              <Switch
                checked={data.useImageBank ?? false}
                onCheckedChange={(checked) => updateField('useImageBank', checked)}
              />
              <View style={styles.checkboxLabel}>
                <Label>Usar banco de imagenes</Label>
                <ThemedText variant="body-small" color="secondary">
                  El sistema seleccionara imagenes automaticamente del banco
                </ThemedText>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Configuracion */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-small">Configuracion</ThemedText>
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Toggle Urgent */}
          <View style={styles.switchField}>
            <View style={styles.switchLabel}>
              <Label>Noticia Urgente</Label>
              <ThemedText variant="body-small" color="secondary">
                {data.urgent
                  ? 'Se mostrara en el cintillo "ULTIMO MOMENTO"'
                  : 'Noticia normal sin urgencia'}
              </ThemedText>
            </View>
            <Switch
              checked={data.urgent}
              onCheckedChange={(checked) => {
                updateField('urgent', checked);
                // Si es urgent, limpiar el type
                if (checked) {
                  updateField('type', undefined);
                }
              }}
            />
          </View>

          {/* Tipo de Contenido (solo si NO es urgent) */}
          {!data.urgent && (
            <View style={styles.field}>
              <Label>Tipo de Contenido</Label>
              <View style={styles.typeGrid}>
                {CONTENT_TYPES.map((type) => {
                  const selected = data.type === type.value;
                  return (
                    <Pressable
                      key={type.value}
                      style={[styles.typeChip, selected && styles.typeChipSelected]}
                      onPress={() => updateField('type', type.value)}
                    >
                      <ThemedText
                        variant="label-medium"
                        style={[styles.typeText, selected && styles.typeTextSelected]}
                      >
                        {type.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  cardContent: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  error: {
    color: '#EF4444',
  },
  contentTextarea: {
    minHeight: 200,
  },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    flex: 1,
    gap: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeChipSelected: {
    backgroundColor: '#f1ef47',
    borderColor: '#e5e33d',
  },
  typeText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  typeTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkboxLabel: {
    flex: 1,
    gap: 4,
  },
});
```

### 9.7. Modal de Creacion

```typescript
// src/components/content/CreateOriginalContentModal.tsx

import React, { useState } from 'react';
import {
  View,
  Modal,
  SafeAreaView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X } from 'lucide-react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Button } from '@/components/ui/button';
import { OriginalContentFormFields } from './OriginalContentFormFields';
import { useCreateOriginalContent } from '@/src/hooks/useOriginalContent';
import type { CreateOriginalContentPayload } from '@/src/types/original-content.types';

interface CreateOriginalContentModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateOriginalContentModal({ visible, onClose }: CreateOriginalContentModalProps) {
  const { mutate: createContent, isPending } = useCreateOriginalContent();

  const [formData, setFormData] = useState<CreateOriginalContentPayload>({
    title: '',
    content: '',
    urgent: false,
    type: undefined,
    useImageBank: false,
  });

  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateOriginalContentPayload, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateOriginalContentPayload, string>> = {};

    // Titulo requerido
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'El titulo es requerido';
    } else if (formData.title.length < 10) {
      newErrors.title = 'El titulo debe tener al menos 10 caracteres';
    }

    // Contenido requerido
    if (!formData.content || formData.content.trim() === '') {
      newErrors.content = 'El contenido es requerido';
    } else if (formData.content.length < 50) {
      newErrors.content = 'El contenido debe tener al menos 50 caracteres';
    }

    // Si no es urgent, debe tener tipo
    if (!formData.urgent && !formData.type) {
      Alert.alert('Tipo requerido', 'Selecciona un tipo de contenido (Breaking, Noticia o Blog)');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Preparar archivos
    const files = selectedImages.length > 0 ? { images: selectedImages } : undefined;

    createContent(
      { data: formData, files },
      {
        onSuccess: (newContent) => {
          console.log('Contenido creado:', newContent);
          Alert.alert(
            'Exito',
            formData.urgent
              ? 'Noticia urgente creada. Se mostrara en el cintillo.'
              : 'Contenido creado exitosamente.',
            [{ text: 'OK', onPress: () => {
              // Reset form
              setFormData({
                title: '',
                content: '',
                urgent: false,
                type: undefined,
                useImageBank: false,
              });
              setSelectedImages([]);
              setErrors({});
              onClose();
            }}]
          );
        },
        onError: (error: any) => {
          console.error('Error:', error);
          Alert.alert('Error', 'No se pudo crear el contenido. Intenta de nuevo.');
        },
      }
    );
  };

  const handleClose = () => {
    if (formData.title || formData.content || selectedImages.length > 0) {
      Alert.alert(
        'Descartar cambios',
        'Tienes cambios sin guardar. ¿Deseas descartarlos?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              setFormData({
                title: '',
                content: '',
                urgent: false,
                type: undefined,
                useImageBank: false,
              });
              setSelectedImages([]);
              setErrors({});
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-medium" style={styles.title}>
            Crear Contenido Original
          </ThemedText>
          <Pressable onPress={handleClose} hitSlop={8}>
            <X size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* Form */}
        <OriginalContentFormFields
          data={formData}
          onChange={setFormData}
          selectedImages={selectedImages}
          onImagesChange={setSelectedImages}
          errors={errors}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleClose}
            disabled={isPending}
            style={styles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            disabled={isPending}
            style={styles.submitButton}
          >
            {isPending ? 'Creando...' : 'Crear y Publicar'}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#111827',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
```

### 9.8. Boton Flotante en Tab

```typescript
// Agregar a: app/(protected)/(tabs)/generate.tsx

import { Plus } from 'lucide-react-native';
import { CreateOriginalContentModal } from '@/src/components/content/CreateOriginalContentModal';

export default function GenerateScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Lista actual de contenido extraido... */}

      {/* Boton Flotante */}
      <Pressable
        onPress={() => setShowCreateModal(true)}
        style={styles.fab}
      >
        <Plus size={28} color="#000000" strokeWidth={3} />
      </Pressable>

      {/* Modal de Creacion */}
      <CreateOriginalContentModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... otros estilos
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1ef47',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
```

### 9.9. Nueva Tab: Noticias en Progreso

```typescript
// app/(protected)/(tabs)/urgent-news.tsx

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Clock } from 'lucide-react-native';
import { useUrgentContent } from '@/src/hooks/useOriginalContent';
import { useUrgentContentSocket } from '@/src/hooks/useUrgentContentSocket';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { OriginalContent } from '@/src/types/original-content.types';

function UrgentCard({ item }: { item: OriginalContent }) {
  const router = useRouter();

  const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Pressable
      onPress={() => router.push(`/original-content/${item.id}`)}
      style={styles.cardWrapper}
    >
      <Card style={styles.urgentCard}>
        <CardHeader>
          <View style={styles.cardHeaderContent}>
            <Badge variant="destructive">
              <ThemedText variant="label-small" style={styles.urgentBadgeText}>
                URGENTE
              </ThemedText>
            </Badge>
            <View style={styles.timeContainer}>
              <Clock size={14} color="#6B7280" />
              <ThemedText variant="label-small" color="secondary">
                {timeAgo}
              </ThemedText>
            </View>
          </View>
          <CardTitle>
            <ThemedText variant="title-medium" style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </ThemedText>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ThemedText
            variant="body-small"
            color="secondary"
            style={styles.cardPreview}
            numberOfLines={3}
          >
            {item.content.substring(0, 150)}...
          </ThemedText>

          <View style={styles.cardFooter}>
            <Pressable
              onPress={() => router.push(`/original-content/${item.id}/edit`)}
              style={styles.editButton}
            >
              <Edit size={16} color="#FFFFFF" />
              <ThemedText variant="label-small" style={styles.editButtonText}>
                Actualizar contenido
              </ThemedText>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <ThemedText variant="title-large" style={styles.emptyTitle}>
        No hay noticias urgentes
      </ThemedText>
      <ThemedText variant="body-medium" color="secondary" style={styles.emptySubtitle}>
        Las noticias marcadas como urgentes apareceran aqui
      </ThemedText>
    </View>
  );
}

export default function UrgentNewsScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useUrgentContent();

  // Socket para actualizaciones en tiempo real
  useUrgentContentSocket();

  const urgentNews = data?.data || [];

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>Cargando...</ThemedText>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>Error al cargar noticias urgentes</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title-large" style={styles.title}>
          Noticias en Progreso
        </ThemedText>
        <ThemedText variant="body-medium" color="secondary">
          Noticias urgentes que estan en vivo
        </ThemedText>
      </View>

      <FlatList
        data={urgentNews}
        renderItem={({ item }) => <UrgentCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#f1ef47"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTitle: {
    color: '#111827',
    fontWeight: '600',
  },
  cardPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
```

### 9.10. Cintillo "ULTIMO MOMENTO"

```typescript
// src/components/content/UrgentBanner.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Pressable,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useUrgentContent } from '@/src/hooks/useOriginalContent';
import { useUrgentContentSocket } from '@/src/hooks/useUrgentContentSocket';

export function UrgentBanner() {
  const router = useRouter();
  const { data } = useUrgentContent();
  const scrollX = useRef(new Animated.Value(0)).current;

  // Socket para actualizaciones en tiempo real
  useUrgentContentSocket();

  const urgentNews = data?.data || [];
  const latestUrgent = urgentNews[0]; // Mostrar la mas reciente

  useEffect(() => {
    if (!latestUrgent) return;

    // Animacion de scroll horizontal
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -300, // Ajustar segun longitud del texto
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [latestUrgent, scrollX]);

  if (!latestUrgent) return null;

  return (
    <Pressable
      onPress={() => router.push(`/original-content/${latestUrgent.id}`)}
      style={styles.container}
    >
      <View style={styles.labelContainer}>
        <ThemedText variant="label-small" style={styles.label}>
          ULTIMO MOMENTO
        </ThemedText>
      </View>

      <View style={styles.textContainer}>
        <Animated.View
          style={[
            styles.scrollingText,
            { transform: [{ translateX: scrollX }] },
          ]}
        >
          <ThemedText variant="body-medium" style={styles.text} numberOfLines={1}>
            {latestUrgent.title}
          </ThemedText>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#DC2626',
  },
  labelContainer: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  textContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollingText: {
    flexDirection: 'row',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    paddingRight: 100, // Espacio para loop
  },
});
```

---

## 10. PLAN DE IMPLEMENTACION POR FASES

### FASE 1: Setup Backend & Types (2-3 dias)

**Backend:**
- [ ] Crear modelo OriginalContent en MongoDB
- [ ] Implementar CRUD endpoints
- [ ] Implementar upload de imagenes/videos
- [ ] Configurar Socket.io events

**Frontend:**
- [ ] Crear tipos TypeScript (`original-content.types.ts`)
- [ ] Crear Mapper (`OriginalContentMapper`)

**Entregable:** Backend funcional con endpoints testeados

---

### FASE 2: API Service & Hooks (1-2 dias)

- [ ] Implementar `originalContentApi.ts`
- [ ] Crear custom hooks:
  - `useOriginalContent()`
  - `useUrgentContent()`
  - `useOriginalContentById()`
  - `useCreateOriginalContent()`
  - `useUpdateOriginalContent()`
- [ ] Crear socket hook: `useUrgentContentSocket()`

**Entregable:** Hooks funcionales que se pueden usar en componentes

---

### FASE 3: Componentes de Formulario (2-3 dias)

- [ ] `OriginalContentFormFields.tsx`
  - Inputs de titulo y contenido
  - Upload de imagenes con preview
  - Toggle urgent
  - Radio buttons para tipo
  - Validaciones
- [ ] `CreateOriginalContentModal.tsx`
  - Modal con formulario completo
  - Validacion y manejo de errores
  - Integracion con hook de creacion

**Entregable:** Modal de creacion funcional

---

### FASE 4: Integracion en Tab de Contenidos (1 dia)

- [ ] Agregar boton flotante (FAB) en `generate.tsx`
- [ ] Conectar modal al boton
- [ ] Testear flujo completo de creacion

**Entregable:** Usuario puede crear contenido original desde la app

---

### FASE 5: Nueva Tab "Noticias en Progreso" (2-3 dias)

- [ ] Crear `urgent-news.tsx`
- [ ] Componente `UrgentCard` con tiempo transcurrido
- [ ] Integracion con socket para auto-refresh
- [ ] Boton "Actualizar contenido" que navega a pantalla de edicion

**Entregable:** Tab funcional que muestra noticias urgentes en tiempo real

---

### FASE 6: Cintillo "ULTIMO MOMENTO" (1-2 dias)

- [ ] Crear `UrgentBanner.tsx`
- [ ] Implementar animacion de scroll
- [ ] Integracion con socket para auto-actualizar
- [ ] Agregar en layout principal (visible en todas las tabs)

**Entregable:** Cintillo funcional que muestra ultima noticia urgente

---

### FASE 7: Pantalla de Edicion (2-3 dias)

- [ ] Crear `app/(protected)/original-content/[id]/edit.tsx`
- [ ] Reutilizar `OriginalContentFormFields`
- [ ] Implementar logica de actualizacion
- [ ] Upload adicional de imagenes

**Entregable:** Usuario puede actualizar contenido urgente

---

### FASE 8: Testing & Refinamiento (2-3 dias)

- [ ] Test de flujos completos
- [ ] Ajustes de UI/UX
- [ ] Optimizacion de performance
- [ ] Test de sockets en produccion
- [ ] Documentacion final

**Entregable:** Feature completa y testeada

---

### RESUMEN DE TIEMPOS

- **FASE 1:** 2-3 dias (Backend + Types)
- **FASE 2:** 1-2 dias (API Service + Hooks)
- **FASE 3:** 2-3 dias (Componentes Formulario)
- **FASE 4:** 1 dia (Integracion Tab Contenidos)
- **FASE 5:** 2-3 dias (Tab Noticias en Progreso)
- **FASE 6:** 1-2 dias (Cintillo ULTIMO MOMENTO)
- **FASE 7:** 2-3 dias (Pantalla de Edicion)
- **FASE 8:** 2-3 dias (Testing & Refinamiento)

**TOTAL ESTIMADO:** 13-20 dias (~3-4 semanas)

---

## WIREFRAMES DESCRIPTIVOS

### 1. Modal de Creacion de Contenido

```
┌───────────────────────────────────────────────────┐
│ [X]                Crear Contenido Original       │
├───────────────────────────────────────────────────┤
│                                                   │
│  Titulo *                                         │
│  ┌─────────────────────────────────────────────┐ │
│  │ Ingresa el titulo...                        │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Contenido *                                      │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │ Escribe el contenido...                     │ │
│  │                                             │ │
│  │                                             │ │
│  │                                             │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│  500 caracteres                                   │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Multimedia (Opcional)                       │ │
│  ├─────────────────────────────────────────────┤ │
│  │ [IMG] [IMG] [IMG]                           │ │
│  │                                             │ │
│  │ [+] Seleccionar imagenes                    │ │
│  │                                             │ │
│  │ [✓] Usar banco de imagenes si no se suben  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Configuracion                               │ │
│  ├─────────────────────────────────────────────┤ │
│  │ Noticia Urgente                        [ON] │ │
│  │ Se mostrara en cintillo "ULTIMO MOMENTO"    │ │
│  │                                             │ │
│  │ (Si NO urgent:)                             │ │
│  │ Tipo de Contenido:                          │ │
│  │ [Breaking] [Noticia] [Blog]                 │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
├───────────────────────────────────────────────────┤
│  [Cancelar]        [Crear y Publicar]            │
└───────────────────────────────────────────────────┘
```

### 2. Tab "Noticias en Progreso"

```
┌───────────────────────────────────────────────────┐
│  Noticias en Progreso                             │
│  Noticias urgentes que estan en vivo              │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ [URGENTE]           hace 5 minutos       ⏱ │ │
│  │                                             │ │
│  │ Accidente multiple en autopista Mexico-... │ │
│  │                                             │ │
│  │ Se reportan multiples vehiculos involucr... │ │
│  │                                             │ │
│  │            [✏️ Actualizar contenido]        │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ [URGENTE]           hace 15 minutos      ⏱ │ │
│  │                                             │ │
│  │ Corte de energia afecta a colonias del...  │ │
│  │                                             │ │
│  │ La CFE reporta que estan trabajando par... │ │
│  │                                             │ │
│  │            [✏️ Actualizar contenido]        │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 3. Cintillo "ULTIMO MOMENTO"

```
┌───────────────────────────────────────────────────┐
│ [ULTIMO MOMENTO] ◀━ Accidente multiple en aut... │
└───────────────────────────────────────────────────┘
```

### 4. Boton Flotante en Tab de Contenidos

```
┌───────────────────────────────────────────────────┐
│  Contenido Extraido                               │
├───────────────────────────────────────────────────┤
│                                                   │
│  [Card de noticia]                                │
│  [Card de noticia]                                │
│  [Card de noticia]                                │
│                                                   │
│                                            ┌────┐ │
│                                            │ +  │ │
│                                            └────┘ │
└───────────────────────────────────────────────────┘
        ^ Boton flotante para crear contenido
```

---

## CONCLUSIONES

### Fortalezas de la Arquitectura Actual

1. **Patron Clear:** Services → Mappers → Hooks → Components es escalable
2. **Type Safety:** TypeScript end-to-end
3. **Cache Inteligente:** React Query maneja cache y revalidacion
4. **Socket Integration:** SocketService centralizado con auto-conexion
5. **Reutilizacion:** Componentes y hooks altamente reutilizables

### Recomendaciones

1. **Mantener Consistencia:** Seguir el patron establecido para nueva funcionalidad
2. **Testing:** Implementar tests unitarios para mappers y hooks
3. **Error Handling:** Mejorar manejo de errores global con boundaries
4. **Performance:** Implementar lazy loading para tabs pesadas
5. **Documentacion:** Mantener JSDoc en todos los componentes y funciones

### Proximos Pasos

1. Revisar este documento con el equipo
2. Ajustar estimaciones de tiempo
3. Crear tickets en gestor de proyectos
4. Comenzar con FASE 1 (Backend + Types)
5. Iterar en sprints de 1 semana

---

**FIN DEL ANALISIS**

Cualquier duda o aclaracion, contactar a Jarvis (Frontend Developer Agent) 🤖
