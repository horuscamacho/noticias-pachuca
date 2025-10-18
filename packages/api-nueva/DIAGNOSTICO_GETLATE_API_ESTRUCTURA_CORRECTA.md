# 🔍 DIAGNÓSTICO FINAL: Estructura Incorrecta del Request a GetLate API

**Fecha**: 18 de octubre 2025
**Estado**: DIAGNÓSTICO COMPLETO SIN MODIFICACIONES

---

## 🎯 PROBLEMA REAL ENCONTRADO

La estructura del request que estamos enviando a GetLate **NO COINCIDE** con la documentación oficial.

---

## 📋 ESTRUCTURA ACTUAL (INCORRECTA)

### **Facebook** (`facebook-publishing.service.ts:90-120`)

```typescript
const postData = {
  content: post.postContent,
  platforms: [{
    platform: 'facebook',
    accountId: pageId,  // ❌ INCORRECTO: pageId no es accountId
    platformSpecificData: {
      firstComment: this.generateFirstComment(post),
    }
  }],
  mediaItems: post.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
  scheduledDate: post.scheduledAt.toISOString(),  // ❌ INCORRECTO: debe ser scheduledFor
};
```

### **Twitter** (`twitter-publishing.service.ts:99-112`)

```typescript
const postData = {
  content: tweet.tweetContent,
  platforms: [{
    platform: 'twitter',
    accountId: accountId,  // ❌ INCORRECTO: mismo problema
  }],
  mediaItems: tweet.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
  scheduledDate: tweet.scheduledAt.toISOString(),  // ❌ INCORRECTO: debe ser scheduledFor
};
```

---

## 📖 ESTRUCTURA CORRECTA (SEGÚN DOCUMENTACIÓN)

### **Según getlatedocs.html líneas 2836-2858**:

```json
{
  "content": "Your post content here",
  "platforms": [
    {"platform": "twitter", "accountId": "TWITTER_ACCOUNT_ID"},
    {"platform": "instagram", "accountId": "INSTAGRAM_ACCOUNT_ID"},
    {"platform": "linkedin", "accountId": "LINKEDIN_ACCOUNT_ID"},
    {"platform": "facebook", "accountId": "FACEBOOK_ACCOUNT_ID"}
  ],
  "scheduledFor": "2024-01-01T12:00:00",     // ✅ scheduledFor NO scheduledDate
  "timezone": "America/New_York",             // ✅ timezone REQUERIDO
  "publishNow": false,                        // ✅ Opcional
  "isDraft": false,                           // ✅ Opcional
  "mediaItems": [
    {
      "type": "image|video|gif|document",
      "url": "media_url_from_/v1/media"
    }
  ]
}
```

---

## ❌ ERRORES IDENTIFICADOS

### **ERROR 1: Campo `scheduledDate` vs `scheduledFor`**

**Ubicación**:
- `facebook-publishing.service.ts:117`
- `twitter-publishing.service.ts:111`

**Código actual**:
```typescript
scheduledDate: post.scheduledAt.toISOString(),  // ❌ INCORRECTO
```

**Código correcto**:
```typescript
scheduledFor: post.scheduledAt.toISOString(),  // ✅ CORRECTO
```

---

### **ERROR 2: Falta campo `timezone`**

**Ubicación**:
- `facebook-publishing.service.ts:90-120` (no está)
- `twitter-publishing.service.ts:99-112` (no está)

**Según documentación (líneas 2865-2876)**:
> **🕐 Timezone Handling:** Two formats are accepted for `scheduledFor`:
> - **Option A (recommended):** Local `YYYY-MM-DDTHH:mm` (no Z) together with a valid `timezone` (e.g., "America/New_York").
> - **Option B:** ISO UTC with Z (e.g., `2025-01-15T16:00:00Z`). In this case, `timezone` can be "UTC" or omitted.

**Solución**: Agregar campo `timezone`:
```typescript
{
  scheduledFor: post.scheduledAt.toISOString(),
  timezone: "UTC",  // ✅ AGREGAR
  // ...
}
```

---

### **ERROR 3: `accountId` puede ser incorrecto**

**Problema**:
- Estamos pasando `pageId` como `accountId` para Facebook
- Estamos pasando `accountId` como `accountId` para Twitter

**Según documentación (líneas 2340-2344)**:
> **🔗 Getting Account IDs:** To get the account IDs for your platforms, use `GET /v1/accounts?profileId=PROFILE_ID`. Each connected social media account has a unique ID that you need to specify in the platforms array.

**Posible causa del error 500**:
- El `pageId` guardado en `site.socialMedia.facebookPages[0].pageId` **NO** es el mismo que el `accountId` que GetLate espera
- El `accountId` guardado en `site.socialMedia.twitterAccounts[0].accountId` **puede** no ser el correcto

**Verificación necesaria**:
Revisar si `pageId` y `accountId` fueron obtenidos originalmente de:
```
GET https://getlate.dev/api/v1/accounts?profileId=PROFILE_ID
```

O si fueron guardados desde otro lugar (ej. OAuth callback).

---

## 🔍 EJEMPLO DE REQUEST CORRECTO

### **Facebook con First Comment**:

```typescript
const postData = {
  content: post.postContent,
  scheduledFor: post.scheduledAt.toISOString(),  // ✅ scheduledFor
  timezone: "UTC",                                // ✅ timezone
  platforms: [{
    platform: 'facebook',
    accountId: accountId,  // ✅ accountId correcto desde GET /v1/accounts
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

### **Twitter Simple**:

```typescript
const postData = {
  content: tweet.tweetContent,
  scheduledFor: tweet.scheduledAt.toISOString(),  // ✅ scheduledFor
  timezone: "UTC",                                 // ✅ timezone
  platforms: [{
    platform: 'twitter',
    accountId: accountId,  // ✅ accountId correcto desde GET /v1/accounts
  }],
  mediaItems: tweet.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
};
```

---

## 📊 COMPARACIÓN CAMPO POR CAMPO

| Campo | Código Actual | Documentación GetLate | Estado |
|-------|---------------|----------------------|--------|
| `content` | ✅ Correcto | ✅ `content` | OK |
| `scheduledDate` | ❌ Existe | ❌ NO EXISTE | ERROR |
| `scheduledFor` | ❌ NO existe | ✅ REQUERIDO | FALTA |
| `timezone` | ❌ NO existe | ✅ Recomendado | FALTA |
| `platforms[].platform` | ✅ Correcto | ✅ `platform` | OK |
| `platforms[].accountId` | ⚠️ Valor dudoso | ✅ `accountId` | VERIFICAR |
| `platforms[].platformSpecificData` | ✅ Correcto | ✅ Opcional | OK |
| `mediaItems[]` | ✅ Correcto | ✅ `mediaItems` | OK |

---

## 🎯 CORRECCIONES REQUERIDAS

### **CORRECCIÓN 1: Cambiar `scheduledDate` → `scheduledFor`**

**Archivos**:
- `facebook-publishing.service.ts:117`
- `twitter-publishing.service.ts:111`

**Cambio**:
```typescript
// ❌ ANTES:
scheduledDate: post.scheduledAt.toISOString(),

// ✅ DESPUÉS:
scheduledFor: post.scheduledAt.toISOString(),
```

---

### **CORRECCIÓN 2: Agregar campo `timezone`**

**Archivos**:
- `facebook-publishing.service.ts:90-120`
- `twitter-publishing.service.ts:99-112`

**Cambio**:
```typescript
const postData = {
  content: post.postContent,
  scheduledFor: post.scheduledAt.toISOString(),
  timezone: "UTC",  // ✅ AGREGAR ESTA LÍNEA
  platforms: [
    // ...
  ],
  // ...
};
```

---

### **CORRECCIÓN 3: Verificar `accountId`**

**Opciones**:

**Opción A**: Si `pageId` y `accountId` YA son correctos (obtenidos de `/v1/accounts`):
- ✅ No cambiar nada

**Opción B**: Si NO estamos seguros:
- ❌ Necesitamos implementar un fetch inicial a `/v1/accounts?profileId=X` para obtener los `accountId` reales
- ❌ Guardarlos en `site.socialMedia` correctamente

---

## 🔧 PRÓXIMOS PASOS

1. **Aplicar CORRECCIÓN 1 y 2** (cambiar `scheduledDate` → `scheduledFor` + agregar `timezone`)
2. **Probar nuevamente** - Esto debería resolver el error 500
3. **Si persiste error 500**: Verificar CORRECCIÓN 3 (accountId)
4. **Agregar logs** del error completo de GetLate para ver mensaje exacto

---

## 📝 NOTAS ADICIONALES

### **Sobre `publishNow`**:
Si queremos publicar inmediatamente en lugar de programar:
```typescript
{
  content: "...",
  publishNow: true,  // ✅ Publica inmediatamente
  // NO incluir scheduledFor ni timezone
  platforms: [...]
}
```

### **Sobre `isDraft`**:
Si queremos crear un borrador:
```typescript
{
  content: "...",
  isDraft: true,  // ✅ Guarda como borrador
  platforms: [...]
}
```

---

**FIN DEL DIAGNÓSTICO**
