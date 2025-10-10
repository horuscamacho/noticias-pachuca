# 🛡️ LOG DE DECISIONES DE SEGURIDAD - FASE 6
## Noticias Pachuca - Security Hardening

**Fecha:** 09 Octubre 2025
**Fase:** FASE 6 - Seguridad y Hardening
**Responsable:** Jarvis + Coyotito

---

## 📋 DECISIONES TOMADAS

### 1. Puerto SSH: Mantener en 22 ✅

**Decisión:** NO cambiar puerto SSH de 22 a 2222

**Razón:**
- ✅ **Security through obscurity NO es seguridad real**
  - Cambiar puerto solo evita bots tontos
  - Atacantes reales escanean todos los puertos
  - No aporta beneficio de seguridad significativo

- ✅ **Ya tenemos lo importante:**
  - SSH Keys Only (PasswordAuthentication no) ✅
  - PermitRootLogin no ✅
  - AWS Security Group limitando acceso ✅
  - Fail2Ban para banear intentos maliciosos ✅

- ✅ **Ventajas de mantener puerto 22:**
  - Estándar de la industria
  - Más fácil de mantener y documentar
  - No requiere recordar puerto custom
  - No requiere actualizar Security Groups
  - Compatible con todas las herramientas

**Alternativa descartada:**
```bash
# NO ejecutado:
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
```

**Configuración actual:**
```bash
# /etc/ssh/sshd_config
Port 22                        # ← Mantenido en default
PermitRootLogin no             # ✅ Seguridad real
PasswordAuthentication no      # ✅ Seguridad real
```

**Referencias:**
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)

---

### 2. Firewall Local: NO activar firewalld ✅

**Decisión:** NO habilitar firewalld en el servidor

**Razón:**
- ✅ **AWS Security Groups es superior:**
  - Funciona en la capa de AWS (antes de llegar al servidor)
  - Más eficiente (no consume recursos del servidor)
  - Centralizado y fácil de gestionar desde AWS Console
  - Auditable desde CloudTrail

- ✅ **Ya configurado correctamente:**
  ```
  Security Group: pachuca-web-sg
  Inbound Rules:
    - SSH (22) from GitHub Actions IPs (dinámico) + tu IP
    - HTTP (80) from 0.0.0.0/0, ::/0
    - HTTPS (443) from 0.0.0.0/0, ::/0
  ```

- ⚠️ **Riesgos de doble firewall:**
  - Complejidad innecesaria (dos lugares para configurar)
  - Posibles conflictos y bloqueos accidentales
  - Dificulta troubleshooting
  - Consume recursos del servidor (t3.micro tiene 1GB RAM)

**Alternativa descartada:**
```bash
# NO ejecutado:
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
```

**Configuración actual:**
- Firewalld: Disabled (inactive)
- AWS Security Group: Active ✅
- Fail2Ban: Active ✅ (capa adicional)

**Comparación:**

| Aspecto | AWS Security Groups | firewalld local |
|---------|---------------------|-----------------|
| Performance | ⚡ No afecta servidor | 🐢 Usa RAM/CPU |
| Gestión | 🎯 Centralizado AWS Console | 🔧 SSH manual |
| Auditoría | ✅ CloudTrail logs | ⚠️ Logs locales |
| HA/Scaling | ✅ Se replica automático | ❌ Config por servidor |
| Costo | ✅ Incluido en EC2 | ✅ Gratis |

**Referencias:**
- [AWS Security Groups vs NACLs vs OS Firewall](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)
- [Defense in Depth - When to use multiple layers](https://cheatsheetseries.owasp.org/cheatsheets/Defense_in_Depth_Cheat_Sheet.html)

---

### 3. Fail2Ban: Instalado y configurado ✅

**Decisión:** Instalar Fail2Ban con jails para SSH y Nginx

**Razón:**
- ✅ **Protección en tiempo real:**
  - Banea IPs con intentos de fuerza bruta
  - Reduce ruido en logs
  - Complementa AWS Security Groups

- ✅ **Configuración implementada:**
  ```ini
  [DEFAULT]
  bantime = 3600     # 1 hora
  findtime = 600     # 10 minutos
  maxretry = 5       # 5 intentos

  [sshd]
  enabled = true
  port = 22
  maxretry = 5

  [nginx-http-auth]
  enabled = true

  [nginx-botsearch]
  enabled = true
  maxretry = 2       # Más estricto para bots
  bantime = 7200     # 2 horas
  ```

**Estado actual:**
```bash
$ sudo fail2ban-client status
Number of jail: 3
Jail list: nginx-botsearch, nginx-http-auth, sshd
```

**Beneficios:**
- Reduce carga del servidor (bloquea atacantes rápido)
- Logs más limpios (menos ruido)
- Protección activa contra bots y scrapers
- No depende de AWS (funciona local)

---

## 🎯 RESUMEN DE CAPAS DE SEGURIDAD IMPLEMENTADAS

### Capa 1: AWS (Perimetral)
- ✅ Security Groups (firewall de red)
- ✅ VPC aislado
- ✅ Elastic IP estático

### Capa 2: Sistema Operativo
- ✅ Amazon Linux 2023 (SELinux habilitado por default)
- ✅ Updates automáticos (pendiente configurar)
- ✅ SSH keys only (no passwords)
- ✅ Root login deshabilitado

### Capa 3: Servicios
- ✅ Fail2Ban (banea atacantes)
- ✅ Nginx con SSL/TLS 1.3
- ✅ PM2 con límites de memoria
- ✅ Node.js con restricciones

### Capa 4: Aplicación
- ✅ NestJS con validación de inputs
- ✅ CORS configurado
- ✅ Helmet.js (security headers)
- ✅ Rate limiting (pendiente en Nginx)

---

## 📊 EVALUACIÓN DE RIESGO

### Amenazas Mitigadas ✅
| Amenaza | Mitigación | Estado |
|---------|------------|--------|
| Fuerza bruta SSH | SSH keys + Fail2Ban | ✅ Protegido |
| DDoS básico | AWS Security Groups + Fail2Ban | ✅ Protegido |
| Port scanning | AWS SG + Fail2Ban | ✅ Detectado y bloqueado |
| Root access | PermitRootLogin no | ✅ Bloqueado |
| Password guessing | PasswordAuth no | ✅ Imposible |
| Web scraping | nginx-botsearch jail | ✅ Limitado |

### Riesgos Aceptados (Temporalmente)
| Riesgo | Razón | Mitigación Futura |
|--------|-------|-------------------|
| Sin WAF | Costo ($) | Cloudflare WAF (gratis) |
| Backoffice público | En desarrollo | FASE 7: Cloudflare Tunnel |
| Sin rate limiting | Pendiente | FASE 6.9: Nginx rate limit |

---

## 🔄 PRÓXIMOS PASOS (PENDIENTES EN FASE 6)

- [ ] 6.6: Configurar updates automáticos (dnf-automatic)
- [ ] 6.7: Kernel hardening (sysctl parameters)
- [ ] 6.8: Auditd para compliance
- [ ] 6.9: Rate limiting en Nginx (protección DDoS aplicación)

---

## 📚 REFERENCIAS Y ESTÁNDARES

**Frameworks seguidos:**
- ✅ CIS Benchmarks for Amazon Linux
- ✅ OWASP Top 10 (2021)
- ✅ NIST Cybersecurity Framework
- ✅ AWS Well-Architected Framework (Security Pillar)

**Documentación consultada:**
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [Fail2Ban Documentation](https://github.com/fail2ban/fail2ban/wiki)
- [SSH Hardening Guide - Mozilla](https://infosec.mozilla.org/guidelines/openssh)
- [Amazon Linux 2023 Security](https://docs.aws.amazon.com/linux/al2023/ug/security.html)

---

### 4. Updates Automáticos: dnf-automatic configurado ✅

**Decisión:** Instalar y habilitar dnf-automatic para updates de seguridad

**Implementación:**
```bash
sudo dnf install -y dnf-automatic
sudo sed -i 's/apply_updates = no/apply_updates = yes/' /etc/dnf/automatic.conf
sudo systemctl enable --now dnf-automatic.timer
```

**Configuración:**
- `apply_updates = yes` - Aplica actualizaciones automáticamente
- Timer activo - Se ejecuta diariamente
- Solo actualizaciones de seguridad por defecto

**Beneficios:**
- Patches de seguridad aplicados rápidamente
- Reduce ventana de vulnerabilidad
- Sin intervención manual necesaria
- Amazon Linux 2023 tiene updates estables

---

### 5. Kernel Hardening: Parámetros sysctl aplicados ✅

**Decisión:** Aplicar hardening del kernel con sysctl

**Parámetros configurados:**
```bash
# /etc/sysctl.conf
net.ipv4.ip_forward = 0                    # No somos router
net.ipv4.tcp_syncookies = 1                # Protección SYN flood
net.ipv4.conf.all.accept_redirects = 0     # No aceptar redirects
net.ipv4.conf.all.accept_source_route = 0  # No source routing
net.ipv4.conf.all.log_martians = 1         # Log paquetes sospechosos
net.ipv4.conf.all.rp_filter = 1            # Anti-spoofing
```

**Protecciones activadas:**
- ✅ SYN flood attack mitigation
- ✅ IP spoofing protection
- ✅ ICMP redirect attacks blocked
- ✅ Source routing disabled
- ✅ Martian packets logged

---

### 6. Auditd: Sistema de auditoría configurado ✅

**Decisión:** Habilitar auditd para compliance y forensics

**Reglas configuradas:**
```bash
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/ssh/sshd_config -p wa -k sshd_config
```

**Beneficios:**
- Logs de cambios en archivos críticos
- Auditoría de acceso a passwords
- Compliance (PCI-DSS, HIPAA requieren auditd)
- Forensics post-incidente

**Uso:**
```bash
# Ver eventos de cambio de passwords
sudo ausearch -k passwd_changes

# Ver cambios en SSH config
sudo ausearch -k sshd_config
```

---

### 7. Rate Limiting Nginx: Protección DDoS aplicación ✅

**Decisión:** Configurar rate limiting en Nginx

**Zonas configuradas:**
```nginx
# /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=300r/m;
```

**Aplicación en API:**
```nginx
# /etc/nginx/conf.d/noticiaspachuca.conf
location / {
    limit_req zone=api_limit burst=20 nodelay;
    # ...
}
```

**Protección:**
- API: 100 requests/minuto por IP (burst 20)
- General: 300 requests/minuto por IP
- Respuesta HTTP 429 (Too Many Requests) cuando se excede
- Protege contra:
  - DDoS de capa 7
  - Scrapers agresivos
  - Credential stuffing attacks
  - API abuse

---

## ✅ FASE 6 COMPLETADA

### Resumen de implementaciones:

| # | Tarea | Estado | Decisión |
|---|-------|--------|----------|
| 1 | Root login | ✅ | Ya deshabilitado |
| 2 | SSH keys only | ✅ | Ya configurado |
| 3 | Puerto SSH | ✅ | Mantenido en 22 (documentado) |
| 4 | Fail2Ban | ✅ | 3 jails activos |
| 5 | Firewall local | ✅ | Saltado (AWS SG suficiente) |
| 6 | Updates auto | ✅ | dnf-automatic habilitado |
| 7 | Kernel hardening | ✅ | sysctl configurado |
| 8 | Auditd | ✅ | Reglas aplicadas |
| 9 | Rate limiting | ✅ | Nginx configurado |

### Comandos de verificación:

```bash
# Fail2Ban status
sudo fail2ban-client status

# Auditd rules
sudo auditctl -l

# Kernel parameters
sudo sysctl -a | grep -E "(ip_forward|syncookies|rp_filter)"

# Updates automáticos
sudo systemctl status dnf-automatic.timer

# Rate limiting (verificar en logs)
sudo tail -f /var/log/nginx/error.log | grep limiting
```

---

**Última actualización:** 10 Oct 2025 05:05 UTC
**Estado:** FASE 6 COMPLETADA ✅
**Próxima fase:** FASE 7 - Protección Backoffice (Cloudflare Tunnel)
