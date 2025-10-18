# 🔍 DIAGNÓSTICO: Error 500 en GetLate API

**Fecha**: 18 de octubre 2025
**Error**: Request failed with status code 500

---

## 📊 LO QUE SABEMOS DE LOS LOGS

### ✅ **LO QUE FUNCIONA**:
1. Optimización de contenido para Facebook - OK
2. Optimización de contenido para Twitter - OK
3. Creación de documentos en BD - OK
4. Campos correctos en PublishedNoticia - OK

### ❌ **LO QUE FALLA**:
1. Facebook: `Request failed with status code 500`
2. Twitter: `Failed to publish to Twitter`

---

## 🔍 REQUEST QUE SE ESTÁ ENVIANDO

### **Facebook (facebook-publishing.service.ts:90-120)**

```typescript
const postData = {
  content: post.postContent,
  platforms: [{
    platform: 'facebook',
    accountId: pageId,  // ← Este valor viene de site.socialMedia.facebookPages[0].pageId
    platformSpecificData: {
      firstComment: this.generateFirstComment(post),
    }
  }],
  mediaItems: post.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
  scheduledDate: post.scheduledAt.toISOString(),
};

// POST a https://getlate.dev/api/v1/posts
// Headers:
// - Authorization: Bearer sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8
// - Content-Type: application/json
```

### **Twitter (twitter-publishing.service.ts:99-112)**

```typescript
const postData = {
  content: tweet.tweetContent,
  platforms: [{
    platform: 'twitter',
    accountId: accountId,  // ← Este valor viene de site.socialMedia.twitterAccounts[0].accountId
  }],
  mediaItems: tweet.mediaUrls.map(url => ({
    type: 'image',
    url: url,
  })),
  scheduledDate: tweet.scheduledAt.toISOString(),
};

// POST a https://getlate.dev/api/v1/posts
// Headers:
// - Authorization: Bearer sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8
// - Content-Type: application/json
```

---

## ❓ POSIBLES CAUSAS DEL ERROR 500

### **CAUSA 1: accountId incorrecto**
- `pageId` viene de `site.socialMedia.facebookPages[0].pageId`
- `accountId` viene de `site.socialMedia.twitterAccounts[0].accountId`

**Pregunta**: ¿Estos IDs son válidos en GetLate?

**Cómo se obtienen normalmente**:
Según `facebook-pages.service.ts:66-79`, los pageId se obtienen de:
```typescript
const availablePages = account.metadata?.availablePages || [];
for (const page of availablePages) {
  pages.push({
    id: page.id,  // ← Este es el pageId
    name: page.name,
    // ...
  });
}
```

**Problema posible**:
- El `pageId` guardado en site.socialMedia puede no ser el `accountId` correcto
- GetLate puede requerir el `accountId` de la cuenta, no el `pageId` de la página

---

### **CAUSA 2: Estructura del body incorrecta**

**No tenemos documentación de GetLate**, pero comparando con `facebook-pages.service.ts`:
- GetLate usa endpoint `/accounts` para obtener cuentas
- GetLate usa endpoint `/posts` para crear posts

**Estructura que enviamos**:
```json
{
  "content": "...",
  "platforms": [{
    "platform": "facebook",
    "accountId": "pageId_de_la_pagina",  // ← Puede ser incorrecto
    "platformSpecificData": {
      "firstComment": "..."
    }
  }],
  "mediaItems": [...],
  "scheduledDate": "2025-10-18T..."
}
```

**Posible estructura correcta** (especulación):
```json
{
  "content": "...",
  "platforms": [{
    "platform": "facebook",
    "accountId": "id_de_la_cuenta_no_de_la_pagina",  // ← Diferente
    "pageId": "id_de_la_pagina"  // ← Campo adicional?
  }],
  "media": [...],  // ← Puede llamarse "media" no "mediaItems"
  "scheduledDate": "2025-10-18T..."
}
```

---

### **CAUSA 3: mediaUrls incorrectas**

```typescript
mediaUrls: noticia.featuredImage?.large ? [noticia.featuredImage.large] : []
```

**Valor real**: `noticia.featuredImage.large`
- Ejemplo: `https://cdn.example.com/noticias/2025/10/slug/large.webp`

**Problema posible**:
- GetLate puede no tener acceso a esta URL
- GetLate puede requerir que las imágenes se suban primero
- GetLate puede requerir formato diferente

---

### **CAUSA 4: scheduledDate mal formateado**

```typescript
scheduledDate: post.scheduledAt.toISOString(),
```

**Problema posible**:
- GetLate puede requerir timestamp Unix
- GetLate puede requerir timezone específico
- GetLate puede no aceptar fechas pasadas (si scheduledAt es NOW)

---

### **CAUSA 5: firstComment inválido**

En Facebook se genera:
```typescript
platformSpecificData: {
  firstComment: this.generateFirstComment(post),
}
```

**Problema posible**:
- `generateFirstComment()` puede retornar undefined
- GetLate puede no soportar firstComment
- La estructura puede ser incorrecta

---

## 🎯 DIAGNÓSTICO REQUERIDO

Para saber la causa exacta necesitamos:

### **OPCIÓN 1: Ver el error completo de GetLate**
Modificar el catch en `facebook-publishing.service.ts:160-180` para loggear:
```typescript
this.logger.error(`❌ Failed to publish post ${post._id} to ${pageName}: ${error.message}`);
this.logger.error(`Full error response:`, error.response?.data); // ← AGREGAR ESTO
```

### **OPCIÓN 2: Ver qué datos reales tiene site.socialMedia**
Necesitamos ver:
- `site.socialMedia.facebookPages[0].pageId` - valor real
- `site.socialMedia.twitterAccounts[0].accountId` - valor real
- `site.socialMedia.getLateApiKey` - si existe

### **OPCIÓN 3: Probar request manualmente**
Hacer un request de prueba a GetLate con curl:
```bash
curl -X POST https://getlate.dev/api/v1/posts \
  -H "Authorization: Bearer sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test post",
    "platforms": [{
      "platform": "facebook",
      "accountId": "ID_DE_LA_CUENTA"
    }]
  }'
```

---

## 🔧 PRÓXIMOS PASOS SUGERIDOS

1. **Ver el error completo de GetLate** - Agregar log del error.response?.data
2. **Verificar accountId/pageId** - Ver qué valores reales tiene site.socialMedia
3. **Verificar estructura del body** - Comparar con documentación de GetLate

---

## 📋 PREGUNTAS PARA EL USUARIO

1. ¿Tienes acceso a la documentación de GetLate.dev API?
2. ¿Puedes ver en la BD qué valor tiene `site.socialMedia.facebookPages[0].pageId`?
3. ¿El API key es correcto? `sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8`
4. ¿Quieres que agregue logs más detallados para ver el error exacto de GetLate?

---

**FIN DEL DIAGNÓSTICO**
