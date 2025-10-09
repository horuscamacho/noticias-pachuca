# 🔐 GitHub Secrets Setup - Noticias Pachuca

Este documento contiene las instrucciones para configurar los secrets necesarios en GitHub Actions.

---

## 📍 Ubicación

Ve a: `https://github.com/horuscamacho/noticias-pachuca/settings/secrets/actions`

O navega:
1. Repositorio → Settings
2. Sidebar izquierdo → Secrets and variables → Actions
3. Click en "New repository secret"

---

## 🔑 Secrets Requeridos

### 1. EC2_SSH_KEY
**Descripción:** Clave privada SSH para conectarse a la instancia EC2

**Valor:** Contenido completo del archivo `~/.ssh/pachuca-noticias-key.pem`

**Cómo obtenerlo:**
```bash
cat ~/.ssh/pachuca-noticias-key.pem
```

Copia todo el output incluyendo:
```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

**Importante:**
- NO incluir espacios extra al inicio o final
- NO modificar el formato
- Incluir ambas líneas BEGIN/END

---

### 2. EC2_HOST
**Descripción:** Elastic IP de la instancia EC2 en mx-central-1

**Valor:** La IP elástica asignada a tu instancia

**Cómo obtenerlo:**
```bash
# Opción 1: AWS Console
# EC2 → Instances → Seleccionar "pachuca-noticias-production" → Ver Elastic IP

# Opción 2: AWS CLI
aws ec2 describe-instances \
  --region mx-central-1 \
  --filters "Name=tag:Name,Values=pachuca-noticias-production" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

**Formato:** Solo la IP (ejemplo: `35.123.45.67`)

---

### 3. EC2_USER
**Descripción:** Usuario SSH para conectarse a la instancia EC2

**Valor:** `ec2-user`

**Nota:** Amazon Linux 2023 usa por default el usuario `ec2-user`

---

### 4. API_ENV
**Descripción:** Variables de entorno de producción para api-nueva (NestJS)

**Valor:** Contenido completo del archivo `.env.production` de api-nueva

**Template:**
```env
NODE_ENV=production
PORT=4000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://coyotito_db_user:RXRl3mqVcaLeGgki@noticiaspachuca.lcbial0.mongodb.net/noticias_pachuca?retryWrites=true

# Redis AWS ElastiCache
REDIS_HOST=tu-redis-endpoint.cache.amazonaws.com
REDIS_PORT=6379

# JWT
JWT_SECRET=tu_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://noticiaspachuca.com,https://www.noticiaspachuca.com

# RapidAPI (Facebook/Instagram)
RAPIDAPI_KEY=tu_rapidapi_key_aqui
RAPIDAPI_HOST=facebook-instagram-apis.p.rapidapi.com

# OpenAI
OPENAI_API_KEY=sk-proj-tu_openai_key_aqui

# Uploads
UPLOAD_MAX_FILE_SIZE=10485760
UPLOAD_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,image/gif

# Logs
LOG_LEVEL=info
```

**Importante:**
- Reemplazar todos los valores placeholder con los reales
- NO incluir comentarios en producción (opcional)
- Asegurar que MongoDB URI y Redis están correctos

---

### 5. FRONTEND_ENV
**Descripción:** Variables de entorno para public-noticias (TanStack Start)

**Valor:** Contenido del archivo `.env.production` de public-noticias

**Template:**
```env
NODE_ENV=production
PORT=3000

# API URL
VITE_API_URL=https://api.noticiaspachuca.com

# Site metadata
VITE_SITE_NAME=Noticias Pachuca
VITE_SITE_URL=https://noticiaspachuca.com
VITE_SITE_DESCRIPTION=Las noticias más relevantes de Pachuca y Hidalgo

# Analytics (opcional)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

**Importante:**
- `VITE_API_URL` debe apuntar al dominio de producción de la API
- Las variables con prefijo `VITE_` son expuestas al cliente (NO incluir secrets)

---

### 6. BACKOFFICE_ENV
**Descripción:** Variables de entorno para dash-coyote (React SPA)

**Valor:** Contenido del archivo `.env.production` de dash-coyote

**Template:**
```env
# API URL
VITE_API_URL=https://api.noticiaspachuca.com

# Backoffice Config
VITE_APP_NAME=Dash Coyote - Backoffice
VITE_APP_VERSION=1.0.0

# Feature Flags (opcional)
VITE_ENABLE_ANALYTICS=true
```

**Importante:**
- Este backoffice estará protegido por Cloudflare Tunnel (Fase 7)
- Solo incluir variables que necesita el cliente
- NO incluir secrets sensibles aquí

---

## ✅ Checklist de Configuración

- [ ] `EC2_SSH_KEY` → Clave privada completa
- [ ] `EC2_HOST` → IP elástica de EC2
- [ ] `EC2_USER` → `ec2-user`
- [ ] `API_ENV` → Variables de api-nueva
- [ ] `FRONTEND_ENV` → Variables de public-noticias
- [ ] `BACKOFFICE_ENV` → Variables de dash-coyote

---

## 🧪 Test de Secrets

Una vez configurados todos los secrets, puedes testear haciendo push a `main`:

```bash
# Push a main para trigger workflows
git add .github/workflows/
git commit -m "ci: Add GitHub Actions workflows"
git push origin main
```

**Verifica:**
1. Ve a Actions tab en GitHub
2. Deberías ver los workflows ejecutándose
3. Revisa logs de cada step
4. Si hay errores, revisa que los secrets estén correctos

---

## 🔒 Seguridad

**Buenas Prácticas:**
- ✅ Rotar secrets cada 3-6 meses
- ✅ NO commitear secrets al repositorio
- ✅ Usar secrets de GitHub, no variables de entorno en workflows
- ✅ Limitar acceso al repositorio solo a usuarios autorizados
- ✅ Habilitar 2FA en GitHub
- ✅ Revisar "Audit log" periódicamente

**NO hacer:**
- ❌ NO compartir secrets por Slack/email/WhatsApp
- ❌ NO imprimir secrets en logs de CI/CD
- ❌ NO usar secrets en branches públicos
- ❌ NO reutilizar secrets entre ambientes (dev/staging/prod)

---

## 📚 Referencias

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS EC2 Instance Connect](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-connect-methods.html)
- [Security Best Practices for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

**Última actualización:** 9 de Octubre, 2025
**Autor:** Jarvis (Claude Code Agent)
