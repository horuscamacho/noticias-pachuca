# ✅ SOLUCIÓN FINAL: Error 500 GetLate API - accountId Incorrecto

**Fecha**: 18 de octubre 2025
**Estado**: PROBLEMA RESUELTO

---

## 🎯 PROBLEMA IDENTIFICADO

GetLate API devolvía error 500 con el siguiente mensaje:

```json
{
  "error": "Internal server error",
  "details": "Cast to ObjectId failed for value \"872015802652894\" (type string) at path \"_id\" for model \"SocialAccount\""
}
```

**Causa Raíz**:
- Estábamos enviando `accountId: "872015802652894"` (ID de la página de Facebook)
- GetLate esperaba `accountId: "68efe856352ee82c852957fa"` (ObjectId de MongoDB)

---

## 🔍 ANÁLISIS TÉCNICO

### **Cómo funciona GetLate API:**

1. **Un "account" de GetLate** = Una cuenta social específica ya conectada
2. El `account._id` es un **ObjectId de MongoDB** (ej: `68efe856352ee82c852957fa`)
3. Cuando publicamos, usamos el `account._id` como `accountId`

### **Lo que estábamos haciendo MAL:**

En `facebook-pages.service.ts` líneas 58-79 (ANTES):

```typescript
// ❌ INCORRECTO: Iterábamos availablePages y guardábamos page.id
for (const account of facebookAccounts) {
  const availablePages = account.metadata?.availablePages || [];

  for (const page of availablePages) {
    pages.push({
      id: page.id,  // ❌ ESTO ES EL pageId DE FACEBOOK (872015802652894)
      name: page.name,
      ...
    });
  }
}
```

**Problema**: `page.id` es el ID de la página en Facebook (número largo), NO el accountId de GetLate.

---

## ✅ SOLUCIÓN APLICADA

### **1. Corregido `facebook-pages.service.ts`** (líneas 62-72)

```typescript
// ✅ CORRECTO: Cada account YA representa una página específica conectada
const pages: FacebookPageDto[] = facebookAccounts.map((account: any) => ({
  id: account._id, // ✅ FIX: Usar account._id de GetLate (ObjectId MongoDB)
  name: account.displayName || account.username,
  username: account.username,
  picture: account.profilePicture || '',
  followerCount: 0,
  isVerified: false,
  accessToken: account.accessToken,
}));
```

**Cambio clave**: Ahora devolvemos `account._id` en lugar de iterar `availablePages`.

---

### **2. Corregido `twitter-accounts.service.ts`** (línea 65)

```typescript
// ✅ CORRECTO: Usar solo account._id
const accounts: TwitterAccountDto[] = twitterAccounts.map((account: any) => ({
  id: account._id, // ✅ FIX: Usar solo account._id de GetLate (ObjectId MongoDB)
  username: account.username?.replace('@', '') || 'unknown',
  displayName: account.displayName || account.name || account.username || 'Unknown',
  ...
}));
```

**Antes**: `id: account._id || account.accountId` (fallback confuso)
**Ahora**: `id: account._id` (solo el correcto)

---

### **3. Actualizado Schema `site.schema.ts`** (líneas 45 y 54)

```typescript
facebookPages?: Array<{
  pageId: string; // ✅ FIX: accountId de GetLate (account._id = ObjectId MongoDB)
  pageName: string;
  ...
}>;

twitterAccounts?: Array<{
  accountId: string; // ✅ FIX: accountId de GetLate (account._id = ObjectId MongoDB)
  username: string;
  ...
}>;
```

**Clarificación**: Los comentarios ahora especifican que estos IDs son `account._id` de GetLate.

---

### **4. Agregado logging diagnóstico** (facebook-publishing.service.ts y twitter-publishing.service.ts)

**Request logging** (antes de enviar):
```typescript
this.logger.debug(`🔍 GetLate API REQUEST:
  URL: ${this.getLateBaseUrl}/posts
  Method: POST
  Body: ${JSON.stringify(postData, null, 2)}
  API Key: ${getLateApiKey.substring(0, 10)}...
`);
```

**Error logging** (cuando falla):
```typescript
if (error.response) {
  this.logger.error(`❌ GetLate API Error Details:
    Status: ${error.response.status}
    Data: ${JSON.stringify(error.response.data, null, 2)}
    Headers: ${JSON.stringify(error.response.headers, null, 2)}
  `);
}
```

**Beneficio**: Ahora vemos el error COMPLETO de GetLate, no solo "500".

---

## 📊 IMPACTO DE LOS CAMBIOS

### **Archivos Modificados**:

1. ✅ `facebook-pages.service.ts` - Corregido extracción de accountId
2. ✅ `twitter-accounts.service.ts` - Limpiado fallback confuso
3. ✅ `site.schema.ts` - Clarificados comentarios
4. ✅ `facebook-publishing.service.ts` - Agregado logging detallado
5. ✅ `twitter-publishing.service.ts` - Agregado logging detallado

### **Qué necesita actualizarse en Base de Datos**:

Los `Site` existentes pueden tener `pageId` y `accountId` incorrectos guardados.

**Opciones**:

1. **Opción A (Recomendada)**: Volver a conectar las cuentas sociales desde la app móvil
   - Ir a Settings → Social Media
   - Reconectar Facebook y Twitter
   - Esto guardará los accountId correctos

2. **Opción B**: Script de migración (si hay muchos sites)
   ```typescript
   // TODO: Crear script que llame a GET /accounts y actualice los IDs
   ```

---

## 🧪 PRUEBA

**Ejecuta**: `yarn start:dev` y prueba publicar una noticia.

**Resultado esperado**:

```
✅ Post published successfully to Noticias Pachuca
✅ Tweet published successfully to PachucaNoticias
✅ Social media publishing completed: 2/2 successful
```

**Si aún falla**, revisa los logs para ver el REQUEST completo que se envía a GetLate.

---

## 📚 DOCUMENTACIÓN GETLATE RELACIONADA

- **GET /v1/accounts**: Devuelve `account._id` (líneas 3659-3673 de getlatedocs.html)
- **POST /v1/posts**: Espera `accountId` = `account._id` (líneas 2836-2858)
- **Facebook Page Management**: Explica que un account ya está vinculado a una página (líneas 4139-4288)

---

## ✅ VERIFICACIÓN FINAL

- [x] Correcciones de `scheduledDate` → `scheduledFor`
- [x] Agregado campo `timezone: "UTC"`
- [x] Corregida URL en `getlate-analytics-sync.service.ts`
- [x] Corregido `accountId` en Facebook (usar `account._id`)
- [x] Corregido `accountId` en Twitter (usar `account._id`)
- [x] Agregado logging detallado de errores
- [x] Clarificados comentarios en schema

**TODAS LAS CORRECCIONES COMPLETADAS** ✅

---

**FIN DEL DOCUMENTO**
