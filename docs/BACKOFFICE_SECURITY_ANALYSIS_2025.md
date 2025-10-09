# Analisis de Seguridad para Backoffice dash-coyote en AWS EC2
## Fecha: 2025-10-09

---

## CONTEXTO DEL PROYECTO
- **Aplicacion**: dash-coyote (React SPA + TanStack Query)
- **Servidor**: AWS EC2 con Amazon Linux 2023
- **Objetivo**: Acceso EXCLUSIVO via VPN o metodo seguro
- **Restriccion**: Preferiblemente soluciones gratuitas

---

## COMPARATIVA DE SOLUCIONES 2025

### 1. AWS CLIENT VPN ❌ (NO RECOMENDADO PARA FREE TIER)

**Costos 2025:**
- **Endpoint Association**: $0.10 USD/hora (~$72 USD/mes)
- **Conexiones concurrentes**: $0.05 USD/hora por conexion (~$36 USD/mes por usuario)
- **Total mensual (1 usuario)**: ~$108 USD/mes
- **NO HAY FREE TIER**

**Complejidad:** 8/10

**Ventajas:**
- Solucion nativa de AWS completamente integrada
- Alta disponibilidad y escalabilidad
- Soporte para autenticacion con AWS Directory Service o SAML
- Split-tunnel y full-tunnel configurable

**Desventajas:**
- **COSTO ALTO** - Inviable para free tier
- Requiere certificados PKI (AWS Certificate Manager Private CA: $400 USD/mes)
- Configuracion compleja con OpenVPN client
- Overhead administrativo alto

**Veredicto:** Rechazado por costo prohibitivo

---

### 2. AWS SYSTEMS MANAGER SESSION MANAGER + PORT FORWARDING ✅ (RECOMENDADO - GRATIS)

**Costos 2025:**
- **Session Manager**: GRATIS (incluido en AWS Free Tier)
- **IAM**: GRATIS
- **Sin cargos por transferencia de datos para SSH/Port forwarding**

**Complejidad:** 4/10

**Como funciona:**
1. SSM Agent ya instalado en Amazon Linux 2023
2. Port forwarding via AWS CLI: `aws ssm start-session --target i-xxxxx --document-name AWS-StartPortForwardingSession --parameters "portNumber=3000,localPortNumber=8080"`
3. Acceso al backoffice: `http://localhost:8080`
4. Zero inbound rules en Security Group (todo via SSM)

**Ventajas:**
- ✅ **COMPLETAMENTE GRATIS**
- ✅ Sin puertos expuestos publicamente
- ✅ Logs de auditoria en CloudTrail
- ✅ Integracion nativa con IAM (MFA soportado)
- ✅ No requiere VPN client adicional
- ✅ Facil de revocar accesos (IAM policies)

**Desventajas:**
- Requiere AWS CLI configurado localmente
- Experiencia de usuario menos fluida (no es "click and browse")
- Session timeout de 60 minutos (reconfigurable)

**Configuracion necesaria:**
```bash
# 1. Verificar SSM Agent (pre-instalado en Amazon Linux 2023)
sudo systemctl status amazon-ssm-agent

# 2. Crear IAM Role para EC2 con policy:
# - AmazonSSMManagedInstanceCore

# 3. Crear IAM User/Role para administradores con policy personalizada:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:StartSession"
      ],
      "Resource": [
        "arn:aws:ec2:*:*:instance/i-INSTANCE_ID",
        "arn:aws:ssm:*:*:document/AWS-StartPortForwardingSession"
      ]
    }
  ]
}

# 4. Comando de conexion local:
aws ssm start-session \
  --target i-INSTANCE_ID \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3000"],"localPortNumber":["8080"]}'

# 5. Acceder: http://localhost:8080
```

**Veredicto:** ⭐ MEJOR OPCION GRATUITA NATIVA DE AWS

---

### 3. CLOUDFLARE ACCESS / CLOUDFLARE TUNNEL ✅✅ (ALTAMENTE RECOMENDADO - GRATIS + FACIL)

**Costos 2025:**
- **Cloudflare Zero Trust (hasta 50 usuarios)**: GRATIS
- **Cloudflare Tunnel**: GRATIS
- **Sin limites de ancho de banda**

**Complejidad:** 3/10

**Como funciona:**
1. Instalar `cloudflared` en EC2
2. Crear tunnel que conecta tu app interna con Cloudflare
3. Configurar Cloudflare Access con autenticacion (Google, GitHub, email OTP)
4. Acceso via URL publica protegida: `https://dash-admin.tudominio.com`
5. Zero Trust: usuarios autenticados pasan, resto bloqueado

**Ventajas:**
- ✅ **GRATIS hasta 50 usuarios**
- ✅ Experiencia de usuario excelente (URL normal + login)
- ✅ Autenticacion con Google/GitHub/Email OTP
- ✅ No requiere VPN client
- ✅ Proteccion DDoS de Cloudflare incluida
- ✅ Sin puertos expuestos en EC2
- ✅ Logs de acceso detallados
- ✅ MFA integrado
- ✅ Facil de implementar (~30 minutos)

**Desventajas:**
- Dependencia de servicio de terceros (Cloudflare)
- Requiere dominio configurado en Cloudflare

**Configuracion necesaria:**
```bash
# 1. Instalar cloudflared en EC2
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# 2. Autenticar con Cloudflare
cloudflared tunnel login

# 3. Crear tunnel
cloudflared tunnel create dash-coyote-backoffice

# 4. Crear archivo de configuracion /etc/cloudflared/config.yml
tunnel: TUNNEL_ID
credentials-file: /root/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: dash-admin.tudominio.com
    service: http://localhost:3000
  - service: http_status:404

# 5. Configurar DNS en Cloudflare Dashboard
# CNAME: dash-admin -> TUNNEL_ID.cfargotunnel.com

# 6. Instalar como servicio
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# 7. Configurar Cloudflare Access (en dashboard web):
# - Zero Trust > Access > Applications > Add an application
# - Type: Self-hosted
# - Domain: dash-admin.tudominio.com
# - Policy: Allow emails = [tu@email.com, admin@empresa.com]
# - Identity providers: Google, GitHub, o One-time PIN
```

**Veredicto:** ⭐⭐⭐ MEJOR OPCION GLOBAL (GRATIS + UX + SEGURIDAD)

---

### 4. TAILSCALE EN AWS EC2 ✅ (ALTERNATIVA GRATIS EXCELENTE)

**Costos 2025:**
- **Personal Plan**: GRATIS (hasta 3 usuarios, 100 dispositivos)
- **No hay cargos por trafico**

**Complejidad:** 3/10

**Como funciona:**
1. Instalar Tailscale client en EC2 y laptops de admins
2. Crear red privada virtual (mesh network)
3. EC2 obtiene IP privada en red Tailscale (ej: 100.x.x.x)
4. Admins acceden via IP Tailscale: `http://100.64.1.5:3000`

**Ventajas:**
- ✅ **GRATIS hasta 3 usuarios** (ideal para equipos pequenos)
- ✅ Zero-config networking
- ✅ Muy facil de usar
- ✅ WireGuard bajo el capo (rapido y seguro)
- ✅ Apps para todos los OS (Mac, Windows, Linux, iOS, Android)
- ✅ MagicDNS (nombres amigables)
- ✅ Sin puertos expuestos publicamente

**Desventajas:**
- Limite de 3 usuarios en free tier (problema si creces)
- Requiere instalar app en cada dispositivo cliente
- Dependencia de servicio de terceros

**Configuracion necesaria:**
```bash
# 1. Instalar Tailscale en EC2 (Amazon Linux 2023)
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://pkgs.tailscale.com/stable/amazon-linux/2023/tailscale.repo
sudo yum install -y tailscale

# 2. Iniciar y autenticar
sudo systemctl enable --now tailscaled
sudo tailscale up

# 3. Obtener IP de Tailscale
tailscale ip -4
# Output ejemplo: 100.64.1.5

# 4. Configurar como subnet router (opcional, para acceder a otros servicios)
sudo tailscale up --advertise-routes=172.31.0.0/16

# 5. En clientes (Mac/Windows):
# - Descargar Tailscale app
# - Login con misma cuenta
# - Acceder: http://100.64.1.5:3000 o http://ec2-backoffice:3000 (con MagicDNS)
```

**Veredicto:** ⭐⭐ EXCELENTE para equipos de 1-3 personas

---

### 5. WIREGUARD SELF-HOSTED (GRATIS + CONTROL TOTAL)

**Costos 2025:**
- **GRATIS** (solo software open-source)
- Sin costos adicionales en AWS

**Complejidad:** 6/10

**Como funciona:**
1. Instalar WireGuard server en EC2
2. Generar claves publicas/privadas para server y clientes
3. Clientes instalan WireGuard app y configuran con archivo .conf
4. Acceso via IP privada VPN

**Ventajas:**
- ✅ **COMPLETAMENTE GRATIS**
- ✅ Control total sobre la infraestructura
- ✅ Protocolo moderno y rapido
- ✅ Bajo overhead (mejor performance que OpenVPN)
- ✅ Sin limites de usuarios
- ✅ Apps oficiales para todos los OS

**Desventajas:**
- Requiere mantenimiento manual
- Configuracion inicial mas compleja
- Gestion manual de claves por usuario
- Sin UI de administracion (salvo que agregues wg-ui)

**Configuracion necesaria:**
```bash
# 1. Instalar WireGuard en EC2
sudo yum install -y wireguard-tools

# 2. Generar claves del servidor
wg genkey | sudo tee /etc/wireguard/server_private.key
sudo cat /etc/wireguard/server_private.key | wg pubkey | sudo tee /etc/wireguard/server_public.key

# 3. Crear /etc/wireguard/wg0.conf
[Interface]
PrivateKey = SERVER_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
# Cliente 1
PublicKey = CLIENT1_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32

# 4. Habilitar IP forwarding
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 5. Iniciar WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# 6. Configurar Security Group
# - Inbound: UDP 51820 desde tus IPs de casa/oficina

# 7. Cliente (ejemplo Mac/Windows):
# Crear archivo client1.conf:
[Interface]
PrivateKey = CLIENT1_PRIVATE_KEY
Address = 10.0.0.2/32
DNS = 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = EC2_PUBLIC_IP:51820
AllowedIPs = 10.0.0.0/24, 172.31.0.0/16
PersistentKeepalive = 25
```

**Veredicto:** ⭐ Buena opcion si quieres control total y no dependencias

---

### 6. VPC SECURITY GROUPS + SSH TUNNEL (BASICO - GRATIS)

**Costos 2025:**
- **GRATIS** (solo features nativas de AWS)

**Complejidad:** 2/10

**Como funciona:**
1. Security Group permite SSH solo desde tus IPs
2. Puerto 3000 (backoffice) NO expuesto publicamente
3. SSH tunnel: `ssh -L 8080:localhost:3000 ec2-user@EC2_IP`
4. Acceso: `http://localhost:8080`

**Ventajas:**
- ✅ **GRATIS**
- ✅ Muy simple de implementar
- ✅ Sin software adicional
- ✅ Usa herramientas estandar (SSH)

**Desventajas:**
- Requiere IP publica fija (o actualizar SG constantemente)
- Puerto SSH expuesto publicamente (riesgo de ataques)
- No escalable para multiples usuarios
- Experiencia de usuario pobre

**Configuracion necesaria:**
```bash
# 1. Security Group EC2:
# Inbound Rules:
# - SSH (22): Desde TU_IP_PUBLICA/32
# - HTTP (3000): SOLO localhost (no rule publica)

# 2. Comando SSH tunnel local:
ssh -i ~/.ssh/tu-key.pem -L 8080:localhost:3000 ec2-user@EC2_PUBLIC_IP -N

# 3. Acceder: http://localhost:8080

# 4. (Opcional) Script de auto-reconexion
#!/bin/bash
while true; do
  ssh -i ~/.ssh/tu-key.pem -L 8080:localhost:3000 ec2-user@EC2_IP -N
  sleep 5
done
```

**Veredicto:** ⚠️ Solucion temporal o para 1 usuario tecnico

---

### 7. OPENVPN ACCESS SERVER (FREEMIUM)

**Costos 2025:**
- **Free Tier**: 2 conexiones concurrentes GRATIS
- **Licensed**: $15 USD/mes por 10 conexiones

**Complejidad:** 7/10

**Como funciona:**
1. Instalar OpenVPN Access Server en EC2
2. Configurar usuarios via web UI
3. Clientes descargan perfil .ovpn
4. Conexion VPN tradicional

**Ventajas:**
- ✅ 2 usuarios gratis (suficiente para equipos muy pequenos)
- ✅ UI de administracion
- ✅ Cliente OpenVPN multiplataforma
- ✅ Protocolo maduro y probado

**Desventajas:**
- Solo 2 usuarios en free tier
- Mas pesado que WireGuard
- Configuracion mas compleja que Tailscale/Cloudflare
- Requiere mantenimiento del servidor

**Configuracion necesaria:**
```bash
# 1. Lanzar OpenVPN Access Server AMI desde AWS Marketplace
# (AMI ID: ami-0c55b159cbfafe1f0 - verificar region)

# 2. Acceder a admin UI
# https://EC2_PUBLIC_IP:943/admin

# 3. Configurar red VPN (ejemplo: 172.27.224.0/20)

# 4. Crear usuarios

# 5. Clientes descargan perfil desde:
# https://EC2_PUBLIC_IP:943/

# 6. Conectar con OpenVPN Connect app
```

**Veredicto:** ⚠️ Viable para 2 usuarios, pero Tailscale es mejor

---

## TABLA COMPARATIVA FINAL

| Solucion | Costo/mes | Complejidad | UX | Seguridad | Escalabilidad | Veredicto |
|----------|-----------|-------------|-----|-----------|---------------|-----------|
| AWS Client VPN | ~$108 | 8/10 | 7/10 | 10/10 | 10/10 | ❌ Muy caro |
| **AWS SSM Session Manager** | $0 | 4/10 | 5/10 | 10/10 | 8/10 | ✅ Mejor gratis AWS |
| **Cloudflare Tunnel + Access** | $0 | 3/10 | 10/10 | 9/10 | 10/10 | ✅✅✅ GANADOR |
| Tailscale | $0 (≤3 users) | 3/10 | 9/10 | 9/10 | 4/10 | ✅ Excelente (equipos pequenos) |
| WireGuard Self-Hosted | $0 | 6/10 | 6/10 | 9/10 | 7/10 | ⚠️ DIY control total |
| SSH Tunnel + SG | $0 | 2/10 | 3/10 | 6/10 | 2/10 | ⚠️ Temporal/1 usuario |
| OpenVPN Access Server | $0 (2 users) | 7/10 | 7/10 | 8/10 | 3/10 | ⚠️ Limitado |

---

## RECOMENDACION PRINCIPAL: CLOUDFLARE TUNNEL + ACCESS ⭐⭐⭐

### Por que Cloudflare es la mejor opcion:

1. **Gratis hasta 50 usuarios** - Muy por encima de tus necesidades actuales
2. **UX perfecta** - Admins solo navegan a URL normal, login, y listo
3. **Zero Trust moderno** - Autenticacion granular por usuario
4. **Sin cambios en EC2** - No expones puertos, no modificas Security Groups
5. **Setup rapido** - 30 minutos de principio a fin
6. **Sin mantenimiento** - Cloudflare maneja toda la infraestructura
7. **Logs y auditoria** - Dashboard con todos los accesos
8. **MFA incluido** - Proveedores de identidad con 2FA

### Casos de uso:
- ✅ **Tu caso**: Backoffice administrativo con 1-5 usuarios
- ✅ Multiples admins en diferentes ubicaciones
- ✅ Acceso desde movil (sin VPN client)
- ✅ Equipo no tecnico (no quieres que configuren VPN)

---

## RECOMENDACION ALTERNATIVA: AWS SSM SESSION MANAGER

### Si prefieres quedarte 100% en AWS:

1. **Totalmente gratis** - Incluido en free tier
2. **Zero puertos expuestos** - Maxima seguridad
3. **Integracion IAM** - Control de accesos con MFA
4. **Auditoria nativa** - CloudTrail logs automaticos

### Trade-offs:
- ⚠️ UX menos fluida (requiere comando CLI)
- ⚠️ Requiere AWS CLI configurado localmente
- ⚠️ No ideal para usuarios no tecnicos

---

## PLAN DE IMPLEMENTACION RECOMENDADO

### FASE 1: IMPLEMENTACION INMEDIATA (Cloudflare Tunnel)

**Tiempo estimado: 30-45 minutos**

```bash
# 1. SSH a tu EC2
ssh -i tu-key.pem ec2-user@EC2_PUBLIC_IP

# 2. Instalar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# 3. Autenticar (abre browser local)
cloudflared tunnel login

# 4. Crear tunnel
cloudflared tunnel create dash-coyote-admin

# Nota el TUNNEL_ID que aparece

# 5. Crear directorio de config
sudo mkdir -p /etc/cloudflared

# 6. Crear archivo de configuracion
sudo tee /etc/cloudflared/config.yml > /dev/null <<EOF
tunnel: TUNNEL_ID_AQUI
credentials-file: /home/ec2-user/.cloudflared/TUNNEL_ID_AQUI.json

ingress:
  - hostname: dash-admin.tudominio.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# 7. Configurar DNS en Cloudflare Dashboard
# Zero Trust > Access > Tunnels > Configure > Public Hostnames
# Hostname: dash-admin
# Domain: tudominio.com
# Service: http://localhost:3000

# 8. Instalar como servicio systemd
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# 9. Verificar estado
sudo systemctl status cloudflared
```

**Configurar Cloudflare Access (en browser):**

1. Ir a: https://one.dash.cloudflare.com/
2. Zero Trust > Access > Applications
3. Click "Add an application"
4. Tipo: "Self-hosted"
5. Application name: "Dash Coyote Backoffice"
6. Subdomain: `dash-admin`
7. Domain: `tudominio.com`
8. Click "Next"
9. Policy name: "Admins Only"
10. Action: "Allow"
11. Configure rules:
    - Selector: "Emails"
    - Value: `admin@tudominio.com, coyotito@email.com`
12. Click "Next" y "Add application"

**Probar:**
1. Navegar a: `https://dash-admin.tudominio.com`
2. Te redirige a login de Cloudflare
3. Elegir proveedor (Google, GitHub, Email OTP)
4. Autenticar
5. Acceso al backoffice dash-coyote

---

### FASE 2: ENDURECIMIENTO ADICIONAL (Opcional)

```bash
# 1. Remover TODAS las reglas de Security Group para puerto 3000
# Solo dejar SSH (22) desde IPs especificas

# 2. Configurar WAF en Cloudflare (gratis):
# - Rate limiting: 100 req/min
# - Geo-blocking: Solo permitir Mexico (si aplica)
# - Bot protection

# 3. Habilitar alertas:
# Cloudflare > Notifications > Add
# - Failed login attempts
# - New device access
```

---

## MIGRACION FUTURA (SI CRECES)

### Si necesitas mas de 50 usuarios:

**Opcion A: AWS Client VPN** (~$108 USD/mes)
- Justificado cuando tienes presupuesto
- Implementacion de 1-2 dias

**Opcion B: Cloudflare Paid Plan** ($7 USD/usuario/mes)
- Mas economico que AWS Client VPN
- Misma UX que ya conoces

**Opcion C: WireGuard + UI (wg-gen-web)** (Gratis)
- Self-hosted, sin limites
- Requiere mantenimiento

---

## MONITOREO Y AUDITORIA

### Cloudflare Access Logs:
```bash
# Ver ultimos accesos:
# Cloudflare Dashboard > Zero Trust > Logs > Access

# Campos clave:
# - User email
# - Timestamp
# - IP address
# - Device posture (pass/fail)
# - Country
```

### AWS SSM Session Manager Logs:
```bash
# Ver sesiones en CloudTrail:
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=StartSession \
  --max-results 10

# Habilitar logging a S3 (opcional):
aws ssm create-document \
  --name "SessionManager-LoggingConfiguration" \
  --document-type "Session" \
  --content file://logging-config.json
```

---

## SCRIPTS UTILES

### Script de conexion rapida (AWS SSM)
```bash
#!/bin/bash
# Archivo: ~/bin/connect-dash-coyote.sh

INSTANCE_ID="i-0123456789abcdef"
LOCAL_PORT=8080
REMOTE_PORT=3000

echo "Conectando a dash-coyote via AWS SSM..."
echo "Accede a: http://localhost:$LOCAL_PORT"

aws ssm start-session \
  --target "$INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSession \
  --parameters "{\"portNumber\":[\"$REMOTE_PORT\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}"
```

```bash
chmod +x ~/bin/connect-dash-coyote.sh
# Uso: ./connect-dash-coyote.sh
```

---

## CHECKLIST DE SEGURIDAD

### Pre-implementacion:
- [ ] Backups de configuracion actual de EC2
- [ ] Documentar Security Groups actuales
- [ ] Identificar usuarios que necesitan acceso
- [ ] Verificar que dash-coyote esta corriendo en puerto correcto

### Post-implementacion:
- [ ] Probar acceso desde 2+ dispositivos diferentes
- [ ] Verificar logs de acceso en dashboard
- [ ] Configurar alertas de seguridad
- [ ] Remover reglas de Security Group innecesarias
- [ ] Documentar procedimiento de acceso para nuevos admins
- [ ] Probar revocacion de acceso (remover email de policy)
- [ ] Configurar MFA obligatorio (si es critico)

---

## TROUBLESHOOTING COMUN

### Cloudflare Tunnel:

**Problema: "Unable to reach the origin"**
```bash
# Verificar que dash-coyote esta corriendo
curl http://localhost:3000

# Verificar logs de cloudflared
sudo journalctl -u cloudflared -f

# Reiniciar servicio
sudo systemctl restart cloudflared
```

**Problema: "Access Denied" despues de login**
```
# Verificar que tu email esta en la policy de Cloudflare Access
# Dashboard > Zero Trust > Access > Applications > [Tu App] > Policies
```

### AWS SSM:

**Problema: "TargetNotConnected"**
```bash
# Verificar SSM Agent
sudo systemctl status amazon-ssm-agent

# Reiniciar agent
sudo systemctl restart amazon-ssm-agent

# Verificar IAM Role de EC2
aws ec2 describe-instances --instance-ids i-xxxxx --query 'Reservations[0].Instances[0].IamInstanceProfile'
```

---

## COSTOS PROYECTADOS (12 MESES)

| Solucion | Ano 1 | Ano 2 | Ano 3 |
|----------|-------|-------|-------|
| Cloudflare Access (≤50 users) | $0 | $0 | $0 |
| AWS SSM Session Manager | $0 | $0 | $0 |
| Tailscale (≤3 users) | $0 | $0 | $0 |
| WireGuard Self-Hosted | $0 | $0 | $0 |
| AWS Client VPN | $1,296 | $1,296 | $1,296 |
| OpenVPN Access Server (2 users) | $0 | $0 | $0 |

---

## CONCLUSION

Para tu caso de uso (backoffice dash-coyote con ~1-5 usuarios), la solucion optima es:

### 🏆 GANADOR: Cloudflare Tunnel + Cloudflare Access

**Implementar ahora:**
- Tiempo: 30 minutos
- Costo: $0 USD
- Mantenimiento: Minimo
- UX: Excelente
- Seguridad: Alta

**Plan B (si no puedes usar Cloudflare):**
- AWS SSM Session Manager (100% gratis, nativo AWS)

**Plan C (si necesitas control total):**
- WireGuard self-hosted

---

## PROXIMOS PASOS

1. ✅ Decidir entre Cloudflare (recomendado) o AWS SSM
2. ✅ Implementar solucion elegida (usar guia de FASE 1)
3. ✅ Probar acceso desde 2+ dispositivos
4. ✅ Documentar procedimiento para equipo
5. ✅ Configurar alertas de seguridad
6. ✅ Remover acceso publico de Security Groups

---

**Documento generado:** 2025-10-09
**Valido hasta:** 2026-01-01 (revisar pricing updates)
**Autor:** Jarvis para Coyotito
**Proyecto:** pachuca-noticias / dash-coyote backoffice security

---

## REFERENCIAS

- AWS SSM Session Manager: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Cloudflare Access Pricing: https://www.cloudflare.com/plans/zero-trust-services/
- Tailscale Pricing: https://tailscale.com/pricing/
- WireGuard: https://www.wireguard.com/
- AWS Client VPN Pricing: https://aws.amazon.com/vpn/pricing/
