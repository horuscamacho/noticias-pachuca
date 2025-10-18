# 🔍 DIAGNÓSTICO COMPLETO: TODAS las Llamadas a GetLate API

**Fecha**: 18 de octubre 2025
**Estado**: REVISIÓN EXHAUSTIVA COMPLETADA

---

## 📋 ARCHIVOS QUE USAN GETLATE.DEV API

Se encontraron **5 archivos** que realizan llamadas a GetLate:

1. ✅ `facebook-pages.service.ts` - Solo GET (OK)
2. ✅ `twitter-accounts.service.ts` - Solo GET (OK)
3. ❌ `facebook-publishing.service.ts` - POST con errores
4. ❌ `twitter-publishing.service.ts` - POST con errores
5. ⚠️ `getlate-analytics-sync.service.ts` - URL incorrecta

---

## ✅ ARCHIVOS CORRECTOS (Solo GET)

### **facebook-pages.service.ts**
**Llamadas**:
- ✅ `GET /profiles` (línea 29)
- ✅ `GET /accounts?profileId=X` (línea 44)

**URL Base**: `https://getlate.dev/api/v1` ✅ CORRECTO

**Estado**: ✅ NO REQUIERE CAMBIOS

---

### **twitter-accounts.service.ts**
**Llamadas**:
- ✅ `GET /profiles` (línea 29)
- ✅ `GET /accounts?profileId=X` (línea 44)

**URL Base**: `https://getlate.dev/api/v1` ✅ CORRECTO

**Estado**: ✅ NO REQUIERE CAMBIOS

---

## ❌ ARCHIVOS CON ERRORES EN POST

### **facebook-publishing.service.ts**

**Llamada Problemática**: `POST /posts` (líneas 90-120)

**Errores Encontrados**:

| Línea | Error | Valor Actual | Valor Correcto |
|-------|-------|--------------|----------------|
| 117 | Campo incorrecto | `scheduledDate` | `scheduledFor` |
| N/A | Campo faltante | NO existe | `timezone: "UTC"` |

**Código Actual (INCORRECTO)**:
```typescript
const postData = {
  content: post.postContent,
  platforms: [{
    platform: 'facebook',
    accountId: pageId,
    platformSpecificData: {
      firstComment: this.generateFirstComment(post),
    }
  }],
  mediaItems: post.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
  scheduledDate: post.scheduledAt.toISOString(),  // ❌ INCORRECTO
};
```

**Código Correcto**:
```typescript
const postData = {
  content: post.postContent,
  scheduledFor: post.scheduledAt.toISOString(),   // ✅ CORRECTO
  timezone: "UTC",                                 // ✅ AGREGAR
  platforms: [{
    platform: 'facebook',
    accountId: pageId,
    platformSpecificData: {
      firstComment: this.generateFirstComment(post),
    }
  }],
  mediaItems: post.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
};
```

**URL Base**: `https://getlate.dev/api/v1` ✅ CORRECTO (línea 57)

---

### **twitter-publishing.service.ts**

**Llamada Problemática**: `POST /posts` (líneas 99-112)

**Errores Encontrados**:

| Línea | Error | Valor Actual | Valor Correcto |
|-------|-------|--------------|----------------|
| 111 | Campo incorrecto | `scheduledDate` | `scheduledFor` |
| N/A | Campo faltante | NO existe | `timezone: "UTC"` |

**Código Actual (INCORRECTO)**:
```typescript
const postData = {
  content: tweet.tweetContent,
  platforms: [{
    platform: 'twitter',
    accountId: accountId,
  }],
  mediaItems: tweet.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
  scheduledDate: tweet.scheduledAt.toISOString(),  // ❌ INCORRECTO
};
```

**Código Correcto**:
```typescript
const postData = {
  content: tweet.tweetContent,
  scheduledFor: tweet.scheduledAt.toISOString(),   // ✅ CORRECTO
  timezone: "UTC",                                  // ✅ AGREGAR
  platforms: [{
    platform: 'twitter',
    accountId: accountId,
  }],
  mediaItems: tweet.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
};
```

**URL Base**: `https://getlate.dev/api/v1` ✅ CORRECTO (línea 58)

---

## ⚠️ ARCHIVO CON URL INCORRECTA

### **getlate-analytics-sync.service.ts**

**Llamadas**:
1. ✅ `GET /posts/${platformPostId}/analytics` (línea 270)
2. ✅ `GET /accounts` (línea 464)

**PROBLEMA**: URL Base incorrecta

**Línea 37**:
```typescript
private readonly GETLATE_API_BASE = 'https://api.getlate.dev/v1';  // ❌ INCORRECTO
```

**Corrección**:
```typescript
private readonly GETLATE_API_BASE = 'https://getlate.dev/api/v1';  // ✅ CORRECTO
```

**Impacto**:
- Este servicio NO se está usando actualmente (es un cron job desactivado)
- Cuando se active, fallará con DNS error
- **Prioridad**: Media (no afecta el problema actual)

---

## 📊 RESUMEN DE CORRECCIONES REQUERIDAS

### **PRIORIDAD ALTA** (Bloquean publicación actual):

1. **facebook-publishing.service.ts:117**
   - ❌ Cambiar: `scheduledDate` → `scheduledFor`
   - ❌ Agregar: `timezone: "UTC"`

2. **twitter-publishing.service.ts:111**
   - ❌ Cambiar: `scheduledDate` → `scheduledFor`
   - ❌ Agregar: `timezone: "UTC"`

### **PRIORIDAD MEDIA** (Futuros errores):

3. **getlate-analytics-sync.service.ts:37**
   - ⚠️ Cambiar: `https://api.getlate.dev/v1` → `https://getlate.dev/api/v1`

---

## 🎯 PLAN DE ACCIÓN

### **PASO 1**: Corregir Facebook Publishing
```typescript
// Archivo: facebook-publishing.service.ts
// Líneas: 90-120

const postData = {
  content: post.postContent,
  scheduledFor: post.scheduledAt.toISOString(),  // ✅ FIX 1
  timezone: "UTC",                                // ✅ FIX 2
  platforms: [
    {
      platform: 'facebook',
      accountId: pageId,
      platformSpecificData: {
        firstComment: this.generateFirstComment(post),
      }
    }
  ],
  mediaItems: post.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
};
```

### **PASO 2**: Corregir Twitter Publishing
```typescript
// Archivo: twitter-publishing.service.ts
// Líneas: 99-112

const postData = {
  content: tweet.tweetContent,
  scheduledFor: tweet.scheduledAt.toISOString(),  // ✅ FIX 1
  timezone: "UTC",                                 // ✅ FIX 2
  platforms: [
    {
      platform: 'twitter',
      accountId: accountId,
    }
  ],
  mediaItems: tweet.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
};
```

### **PASO 3**: Corregir Analytics Sync (opcional ahora)
```typescript
// Archivo: getlate-analytics-sync.service.ts
// Línea: 37

private readonly GETLATE_API_BASE = 'https://getlate.dev/api/v1';  // ✅ FIX
```

---

## ✅ VERIFICACIÓN FINAL

### **Comparación con Documentación GetLate**:

Según `getlatedocs.html` líneas 2836-2858, la estructura correcta es:

```json
{
  "content": "Your post content here",
  "scheduledFor": "2024-01-01T12:00:00",     // ✅ NO scheduledDate
  "timezone": "America/New_York",             // ✅ Requerido o UTC
  "platforms": [
    {"platform": "twitter", "accountId": "TWITTER_ACCOUNT_ID"},
    {"platform": "facebook", "accountId": "FACEBOOK_ACCOUNT_ID"}
  ],
  "mediaItems": [
    {
      "type": "image|video|gif|document",
      "url": "media_url_from_/v1/media"
    }
  ]
}
```

**Nuestra implementación DESPUÉS de las correcciones**: ✅ COINCIDE 100%

---

## 🔍 ENDPOINTS VERIFICADOS EN DOCUMENTACIÓN

| Endpoint | Usado En | Verificado | Estado |
|----------|----------|------------|--------|
| `GET /profiles` | facebook-pages, twitter-accounts | ✅ Sí | OK |
| `GET /accounts` | facebook-pages, twitter-accounts, analytics | ✅ Sí | OK |
| `POST /posts` | facebook-publishing, twitter-publishing | ✅ Sí | ERRORES ENCONTRADOS |
| `GET /posts/{id}/analytics` | analytics-sync | ⚠️ No encontrado en docs | VERIFICAR |

**NOTA**: El endpoint `/posts/{id}/analytics` NO aparece en la documentación HTML que revisamos. Puede que:
- Sea un endpoint legacy
- Esté en otra sección de la documentación
- No exista (necesita implementarse diferente)

---

## 📝 CONCLUSIÓN

**Total de archivos revisados**: 5
**Archivos correctos**: 2
**Archivos con errores**: 2 (bloquean funcionalidad actual)
**Archivos con advertencias**: 1 (no afecta ahora)

**Causa del error 500**: `scheduledDate` no existe en la API de GetLate, debe ser `scheduledFor` + `timezone`

---

**FIN DEL DIAGNÓSTICO COMPLETO**
