# ⚠️ ACCIÓN REQUERIDA: Reconectar Cuentas Sociales

**Fecha**: 18 de octubre 2025
**Prioridad**: CRÍTICA

---

## 🎯 PROBLEMA IDENTIFICADO

Las cuentas sociales en la base de datos tienen **accountId INCORRECTOS**:

- **Facebook**: Guardado `872015802652894` (pageId de Facebook)
- **Esperado**: ObjectId de MongoDB como `68efe856352ee82c852957fa`

Este error causa que GetLate API rechace las publicaciones con error 500.

---

## ✅ SOLUCIONES APLICADAS EN CÓDIGO

### 1. **Correcciones en servicios** (YA APLICADAS)

- ✅ `facebook-pages.service.ts` - Ahora devuelve `account._id` correcto
- ✅ `twitter-accounts.service.ts` - Ahora devuelve `account._id` correcto
- ✅ `social-media-publishing.service.ts` - Ahora usa `socialMediaCopies` + URL canónica
- ✅ `facebook-publishing.service.ts` - Logging detallado de errores
- ✅ `twitter-publishing.service.ts` - Logging detallado de errores

### 2. **Contenido publicado** (YA CORREGIDO)

**ANTES** (INCORRECTO):
```
⚽ 💰 <p>En Hidalgo, el Instituto Mexicano del Seguro Social (IMSS) reconfiguró...
```
- Publicaba HTML con tags `<p>`
- No incluía URL canónica

**AHORA** (CORRECTO):
```
🏥 El IMSS despliega 8 brigadas médicas en Hidalgo tras tormenta Priscilla #Hidalgo #SaludPública

https://noticiaspachuca.com/imss-despliega-ocho-brigadas-medicas...
```
- Usa copy mejorado de redes sociales
- Incluye URL canónica
- Sin HTML

---

## 🔧 ACCIÓN REQUERIDA DEL USUARIO

**DEBES RECONECTAR LAS CUENTAS SOCIALES** para guardar los accountId correctos en la base de datos.

### **Pasos a seguir:**

1. **Abrir la app móvil**
2. **Ir a Settings → Social Media** (o donde esté la configuración de redes)
3. **Desconectar Facebook**:
   - Buscar la cuenta "Noticias Pachuca"
   - Click en "Desconectar" o "Remove"
4. **Reconectar Facebook**:
   - Click en "Connect Facebook"
   - Autorizar con OAuth
   - Seleccionar la página "Noticias Pachuca"
   - Guardar
5. **Repetir para Twitter**:
   - Desconectar cuenta "@PachucaNoticias"
   - Reconectar cuenta
   - Autorizar con OAuth
   - Guardar

---

## 📊 QUÉ PASARÁ DESPUÉS

Una vez reconectes las cuentas:

1. Los nuevos `accountId` se guardarán en `site.socialMedia.facebookPages[].pageId`
2. Los nuevos `accountId` se guardarán en `site.socialMedia.twitterAccounts[].accountId`
3. Estos serán ObjectId de MongoDB (formato correcto)
4. GetLate API aceptará las publicaciones

**Resultado esperado:**
```
✅ Post published successfully to Noticias Pachuca
✅ Tweet published successfully to PachucaNoticias
✅ Social media publishing completed: 2/2 successful
```

---

## 🧪 PRUEBA DESPUÉS DE RECONECTAR

1. **Ejecuta**: `yarn start:dev`
2. **Publica una noticia** desde la app móvil
3. **Verifica los logs**:
   - Debe mostrar `accountId` con formato ObjectId (24 caracteres hex)
   - Debe publicar exitosamente en ambas plataformas
   - NO debe haber error 500

---

## 🔍 VERIFICACIÓN MANUAL (OPCIONAL)

Si quieres verificar que los IDs estén correctos en la BD:

```javascript
// MongoDB Shell
db.sites.findOne({ domain: "noticiaspachuca.com" }, {
  "socialMedia.facebookPages.pageId": 1,
  "socialMedia.twitterAccounts.accountId": 1
})
```

**Resultado esperado:**
```json
{
  "socialMedia": {
    "facebookPages": [{
      "pageId": "68efe856352ee82c852957fa"  // ✅ ObjectId MongoDB
    }],
    "twitterAccounts": [{
      "accountId": "68efe856352ee82c852957fa"  // ✅ ObjectId MongoDB
    }]
  }
}
```

**Resultado INCORRECTO (actual):**
```json
{
  "socialMedia": {
    "facebookPages": [{
      "pageId": "872015802652894"  // ❌ ID de Facebook (incorrecto)
    }]
  }
}
```

---

## 📝 RESUMEN

| Problema | Solución en Código | Acción del Usuario |
|----------|-------------------|-------------------|
| accountId incorrecto en BD | ✅ Servicios corregidos | ⚠️ Reconectar cuentas |
| HTML en publicaciones | ✅ Usa socialMediaCopies | ✅ Ninguna (ya corregido) |
| Sin URL canónica | ✅ Agrega URL automáticamente | ✅ Ninguna (ya corregido) |
| Logging insuficiente | ✅ Logging detallado agregado | ✅ Ninguna (ya corregido) |

---

**FIN DEL DOCUMENTO**
