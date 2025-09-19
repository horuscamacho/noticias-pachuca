# ThemedList - Componente Universal

Componente de lista universal basado en `@legendapp/list` con soporte completo para pull-to-refresh, scroll infinito, modo chat y theming.

## 🚀 Uso Rápido

```typescript
import { ThemedList } from './src/components/ThemedList'

// Lista básica
<ThemedList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={item => item.id}
/>

// Lista con scroll infinito
<ThemedList
  mode="infinite"
  data={articles}
  renderItem={({ item }) => <ArticleCard article={item} />}
  onRefresh={refetchArticles}
  onLoadMore={loadMoreArticles}
  hasNextPage={hasMore}
  loading={isLoading}
/>

// Chat con historial infinito
<ThemedList
  mode="chat-infinite"
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  onLoadMore={loadOlderMessages}
  hasNextPage={hasOlderMessages}
/>
```

## 📱 Modos Disponibles

- **`default`**: Lista básica con theming
- **`infinite`**: Pull-to-refresh + scroll infinito
- **`chat`**: Optimizado para mensajes
- **`chat-infinite`**: Chat + carga bidireccional

## 🎨 Theming

- **`light`**: Tema claro
- **`dark`**: Tema oscuro
- **`auto`**: Detecta tema del sistema

## ⚡ Performance

- `recycleItems`: Activado por defecto
- `estimatedItemSize`: 50px por defecto
- `drawDistance`: 250px buffer de renderizado