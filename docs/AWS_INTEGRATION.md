# 🚀 INTEGRACIÓN AWS - NOTICIAS PACHUCA

## 📋 CONFIGURACIÓN PARA CONEXIÓN A INSTANCIA AWS

### **Servicios AWS Recomendados**

#### **1. EC2 para el Contenedor**
```bash
# Tipo de instancia recomendada
t3.medium (2 vCPU, 4 GB RAM) - Para desarrollo
t3.large (2 vCPU, 8 GB RAM) - Para producción baja

# AMI recomendada
Amazon Linux 2 con Docker preinstalado
```

#### **2. RDS para Base de Datos (Opcional - Escalabilidad)**
```bash
# Solo si quieres separar MongoDB más adelante
# Por ahora usamos MongoDB en el contenedor
```

#### **3. ElastiCache para Redis (Opcional - Escalabilidad)**
```bash
# Solo si quieres separar Redis más adelante
# Por ahora usamos Redis en el contenedor
```

### **Variables de Entorno para AWS**

```bash
# En tu instancia EC2
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=tu_access_key
export AWS_SECRET_ACCESS_KEY=tu_secret_key
export NODE_ENV=production

# Para conexiones externas (si usas RDS/ElastiCache después)
export MONGODB_URL=mongodb://localhost:27017/noticias_pachuca
export REDIS_URL=redis://localhost:6379
```

### **Script de Deploy a EC2**

```bash
#!/bin/bash
# scripts/deploy-aws.sh

# Variables
EC2_HOST="tu-instancia.compute.amazonaws.com"
EC2_USER="ec2-user"
KEY_PATH="~/.ssh/tu-key.pem"

echo "🚀 Desplegando a AWS EC2..."

# 1. Construir imagen localmente
docker build -t noticias-pachuca .

# 2. Guardar imagen
docker save noticias-pachuca | gzip > noticias-pachuca.tar.gz

# 3. Subir a EC2
scp -i $KEY_PATH noticias-pachuca.tar.gz $EC2_USER@$EC2_HOST:~/

# 4. Ejecutar en EC2
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
    # Cargar imagen
    docker load < noticias-pachuca.tar.gz

    # Parar contenedor anterior si existe
    docker stop noticias-pachuca-app 2>/dev/null || true
    docker rm noticias-pachuca-app 2>/dev/null || true

    # Ejecutar nuevo contenedor
    docker run -d \
        --name noticias-pachuca-app \
        --restart unless-stopped \
        -p 80:3000 \
        -p 3001:3001 \
        -p 6379:6379 \
        -p 27017:27017 \
        -v /home/ec2-user/data:/data \
        noticias-pachuca

    echo "✅ Aplicación desplegada en EC2"
EOF

# 5. Limpiar archivo temporal
rm noticias-pachuca.tar.gz

echo "🎯 Deploy completado. Accede a: http://$EC2_HOST"
```

### **Security Groups AWS**

```json
{
  "SecurityGroupRules": [
    {
      "IpPermissions": [
        {
          "IpProtocol": "tcp",
          "FromPort": 80,
          "ToPort": 80,
          "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
        },
        {
          "IpProtocol": "tcp",
          "FromPort": 443,
          "ToPort": 443,
          "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
        },
        {
          "IpProtocol": "tcp",
          "FromPort": 22,
          "ToPort": 22,
          "IpRanges": [{"CidrIp": "TU_IP/32"}]
        }
      ]
    }
  ]
}
```

### **Comandos de Setup EC2**

```bash
# 1. Conectar a instancia
ssh -i tu-key.pem ec2-user@tu-instancia.compute.amazonaws.com

# 2. Instalar Docker (si no está preinstalado)
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# 3. Crear directorio de datos persistentes
mkdir -p /home/ec2-user/data/mongodb
mkdir -p /home/ec2-user/data/redis

# 4. Configurar firewall interno (opcional)
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

### **Monitoring y Logs**

```bash
# Ver logs del contenedor
docker logs -f noticias-pachuca-app

# Ver estado de servicios internos
docker exec noticias-pachuca-app supervisorctl status

# Monitorear recursos
docker stats noticias-pachuca-app

# Backup de datos
docker exec noticias-pachuca-app mongodump --out /data/backup/$(date +%Y%m%d)
```

### **Costos Estimados AWS (Mensual)**

```
EC2 t3.medium (desarrollo):
- Instancia: $30/mes
- Storage (20GB): $2/mes
- Transfer: ~$1/mes
Total: ~$33/mes

EC2 t3.large (producción):
- Instancia: $60/mes
- Storage (50GB): $5/mes
- Transfer: ~$5/mes
Total: ~$70/mes
```

### **Escalabilidad Futura**

Cuando el tráfico crezca, puedes migrar a:

1. **Separar Base de Datos**
   - RDS MongoDB (DocumentDB)
   - ElastiCache Redis

2. **Load Balancer**
   - Application Load Balancer
   - Múltiples instancias EC2

3. **CDN**
   - CloudFront para assets estáticos

4. **Container Orchestration**
   - ECS Fargate
   - EKS (Kubernetes)

### **Variables de Entorno de Producción**

```bash
# supervisord.conf - Actualizar para producción
environment=NODE_ENV=production,MONGODB_URL=mongodb://localhost:27017/noticias_pachuca_prod,REDIS_URL=redis://localhost:6379,AWS_REGION=us-east-1
```

---

**✅ Con esta configuración tendrás:**
- Deploy simple a EC2
- Todos los servicios en un contenedor
- Conexión directa a AWS desde el contenedor
- Escalabilidad futura cuando sea necesario