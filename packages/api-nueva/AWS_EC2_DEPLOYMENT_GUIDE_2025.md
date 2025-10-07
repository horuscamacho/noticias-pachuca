# AWS EC2 Deployment Guide 2025-2026
## Full-Stack Node.js: NestJS + Remix SSR

**Target Stack:**
- Backend: NestJS (puerto 3000)
- Frontend: Remix SSR (puerto 3001)
- Database: MongoDB Atlas (external)
- Domain: noticiaspachuca.com
- Cloud Provider: AWS (EC2 + Route53)
- Deployment Method: AWS CLI v2

---

## Table of Contents
1. [Instance Selection & Pricing](#1-instance-selection--pricing)
2. [AMI Selection: Amazon Linux 2023 vs Ubuntu 24.04](#2-ami-selection)
3. [Process Manager Comparison](#3-process-manager-comparison)
4. [Complete Deployment Steps](#4-complete-deployment-steps)
5. [Nginx Configuration](#5-nginx-configuration)
6. [SSL/TLS Setup](#6-ssltls-setup)
7. [DNS Configuration with Route53](#7-dns-configuration)
8. [Security Configuration](#8-security-configuration)
9. [Monitoring & Logs](#9-monitoring--logs)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Instance Selection & Pricing

### Instance Specifications Comparison (2025)

| Instance Type | vCPUs | RAM | Network | Monthly Cost | Best For |
|--------------|-------|-----|---------|--------------|----------|
| **t3.micro** | 2 | 1 GB | Up to 5 Gbps | $7.60 | Development/Testing |
| **t3.small** | 2 | 2 GB | Up to 5 Gbps | $15.18 | **RECOMMENDED** Production |
| **t3.medium** | 2 | 4 GB | Up to 5 Gbps | $30.37 | High Memory SSR |

### Performance Characteristics for Node.js SSR

**Memory Allocation:**
- t3.micro: ~500MB heap for Node.js
- t3.small: ~1GB heap for Node.js (2GB total RAM)
- t3.medium: ~2GB heap for Node.js (4GB total RAM)

**CPU Performance:**
All T3 instances provide **burst performance** - baseline CPU with ability to burst when needed. They share the same number of vCPUs (2), so the main difference is **RAM, not CPU**.

### Recommendation

**For Production NestJS + Remix SSR: t3.small**

**Rationale:**
1. **Memory:** 2GB RAM provides adequate heap space (~1GB) for two Node.js applications
2. **Cost-Effective:** At $15.18/month, it's 2x the cost of t3.micro but provides significantly better stability
3. **SSR Workloads:** Server-Side Rendering is memory-intensive; 1GB total (t3.micro) will cause frequent OOM errors
4. **Headroom:** Provides buffer for traffic spikes and concurrent requests

**When to upgrade to t3.medium:**
- Experiencing memory pressure or OOM errors
- High traffic with many concurrent SSR requests
- Complex rendering with large data sets
- Running additional services (Redis, etc.)

**Citations:**
[1] Vantage. "t3.small pricing and specs." 2025. https://instances.vantage.sh/aws/ec2/t3.small
[2] Technical Ustad. "Amazon Linux vs Ubuntu - Operating Systems Face-Off in 2025." 2025. https://technicalustad.com/amazon-linux-vs-ubuntu/

---

## 2. AMI Selection

### Amazon Linux 2023 vs Ubuntu 24.04

| Feature | Amazon Linux 2023 | Ubuntu 24.04 LTS |
|---------|-------------------|------------------|
| **Node.js Support** | v18, v20, v22 (namespaced) | Full apt repository |
| **Memory Usage** | 15% less than Ubuntu (AWS-optimized) | Higher baseline usage |
| **Boot Time** | Faster (AWS-optimized kernel) | Standard |
| **Lambda Cold Start** | ~100ms (20% faster) | ~120ms |
| **Package Manager** | dnf/yum | apt |
| **Package Availability** | Limited (AWS-focused) | Extensive ecosystem |
| **Community Support** | AWS-centric, smaller | Large, active community |
| **Multi-Cloud** | AWS-only | GCP, Azure, bare-metal |
| **Support Until** | 2028 | 2034 |
| **Cost** | Free tier eligible | Free tier eligible |

### Pros & Cons

#### Amazon Linux 2023 - RECOMMENDED for AWS-only deployments

**Pros:**
- AWS-specific optimizations (kernel tuned for EC2)
- 15% less memory usage than Ubuntu on t3.micro instances
- Faster boot times and pod startup (EKS)
- Pre-configured AWS tools (aws-cli, aws-sdk, ecs-agent)
- Node.js 18, 20, 22 available natively
- Longer support cycle than AL2 (which ends June 2025)
- Seamless integration with AWS services

**Cons:**
- Limited package availability (EPEL repos often needed)
- Smaller community support
- AWS lock-in (not portable to other clouds)
- Some packages require manual compilation

#### Ubuntu 24.04 LTS

**Pros:**
- Massive community support (Stack Overflow, forums)
- Extensive package ecosystem (apt)
- Multi-cloud portability
- Familiar to most developers
- Long-term support until 2034
- Better for hybrid/multi-cloud strategies

**Cons:**
- Higher memory usage vs Amazon Linux
- Less optimized for AWS-specific workloads
- Slower cold starts in Lambda/EKS

### Recommendation

**Use Amazon Linux 2023 for this deployment**

**Rationale:**
1. You're deploying exclusively to AWS
2. Memory optimization matters on t3.small
3. Better performance for Node.js on EC2
4. Native AWS tooling integration
5. No multi-cloud requirements stated

**When to use Ubuntu instead:**
- Multi-cloud deployment strategy
- Need specific packages only in apt repos
- Team familiarity with Ubuntu/Debian
- Planning to migrate off AWS later

**Citations:**
[3] AWS Documentation. "Node.js in AL2023." 2025. https://docs.aws.amazon.com/linux/al2023/ug/nodejs.html
[4] Technical Ustad. "Amazon Linux vs Ubuntu - Operating Systems Face-Off in 2025." https://technicalustad.com/amazon-linux-2023-vs-ubuntu/

---

## 3. Process Manager Comparison

### PM2 vs Systemd vs Docker

| Feature | PM2 | Systemd | Docker |
|---------|-----|---------|--------|
| **Ease of Setup** | Easy | Moderate | Complex |
| **Node.js Integration** | Excellent | Good | Good |
| **Zero Downtime Reload** | Yes | No | With orchestration |
| **Cluster Mode** | Built-in | Manual | Container scaling |
| **Log Management** | Built-in | journalctl | Docker logs |
| **Monitoring** | Built-in + Plus | Manual | Requires tools |
| **Memory Overhead** | ~50MB | Minimal | ~100-200MB |
| **Auto Restart** | Yes | Yes | Yes (with policy) |
| **Resource Limits** | Via config | Via service file | Via container limits |
| **Best For** | Node.js apps | Linux services | Containerized stacks |

### 2025-2026 Recommendations

#### PM2 - RECOMMENDED for this deployment

**When to use PM2:**
- Deploying directly to EC2 (not containerized)
- Need simple, reliable Node.js process management
- Want built-in monitoring and log management
- Need zero-downtime deployments
- Team familiar with Node.js ecosystem

**Advantages for your stack:**
- Manages multiple apps (NestJS + Remix) in single config
- Built-in clustering for better CPU utilization
- Automatic restarts on crashes
- Log rotation out of the box
- Easy environment variable management
- No container complexity

**PM2 Best Practices 2025:**
```bash
# Use ecosystem file for configuration
# Enable startup script for auto-start on boot
# Configure log rotation
# Use max_memory_restart to prevent memory leaks
# Enable watch mode only in development
```

#### Systemd

**When to use Systemd:**
- Want native Linux service management
- No need for Node.js-specific features
- Minimal resource overhead critical
- Already using systemd for other services

**Limitations:**
- More configuration required
- No built-in clustering
- Manual log rotation setup
- No zero-downtime reloads

#### Docker

**When to use Docker:**
- Already using containers in infrastructure
- Need strict resource isolation
- Running microservices architecture
- Multi-stage build optimization needed

**Why NOT Docker for this deployment:**
- Adds unnecessary complexity for simple dual-app setup
- Higher memory overhead (critical on t3.small)
- PM2 becomes redundant inside containers
- Longer initial setup time
- Overkill for 2-app deployment

### Final Recommendation

**Use PM2 for managing both NestJS and Remix applications**

**Rationale:**
1. Simplicity - single ecosystem.config.js for both apps
2. Node.js optimized - designed specifically for Node.js
3. Low overhead - minimal memory footprint
4. Built-in features - clustering, logs, monitoring
5. Easy deployment - no container orchestration needed
6. Team efficiency - familiar to Node.js developers

**Citations:**
[5] Better Stack. "Running Node.js Apps with PM2 (Complete Guide)." 2025. https://betterstack.com/community/guides/scaling-nodejs/pm2-guide/
[6] Medium. "To PM2, or Not to PM2: Embracing Docker for Node.js." 2024. https://medium.com/@saderi/to-pm2-or-not-to-pm2-embracing-docker-for-node-js-b4a8adce141c

---

## 4. Complete Deployment Steps

### Prerequisites

```bash
# Verify AWS CLI v2 installed
aws --version  # Should show aws-cli/2.x.x

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1 (or your preferred region)
# Default output format: json
```

### Step 1: Create Security Group

```bash
# Create security group
aws ec2 create-security-group \
  --group-name nodejs-web-sg \
  --description "Security group for Node.js web applications" \
  --vpc-id vpc-xxxxxxxxx  # Replace with your VPC ID

# Store the security group ID
SG_ID="sg-xxxxxxxxxxxxxxxxx"  # Replace with output from above

# Allow SSH (port 22) - RESTRICT to your IP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP_ADDRESS/32  # Replace with your IP

# Allow HTTP (port 80)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Verify security group rules
aws ec2 describe-security-groups --group-ids $SG_ID
```

### Step 2: Create Key Pair

```bash
# Create key pair for SSH access
aws ec2 create-key-pair \
  --key-name nodejs-deploy-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/nodejs-deploy-key.pem

# Set correct permissions
chmod 400 ~/.ssh/nodejs-deploy-key.pem
```

### Step 3: Launch EC2 Instance

```bash
# Find latest Amazon Linux 2023 AMI ID
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" \
  "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

echo "Using AMI: $AMI_ID"

# Launch t3.small instance
aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.small \
  --key-name nodejs-deploy-key \
  --security-group-ids $SG_ID \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nodejs-production}]' \
  --count 1

# Get instance ID from output
INSTANCE_ID="i-xxxxxxxxxxxxxxxxx"  # Replace with actual instance ID

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP address
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Instance Public IP: $PUBLIC_IP"
```

### Step 4: Allocate and Associate Elastic IP (Optional but Recommended)

```bash
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc

# Get Allocation ID from output
ALLOCATION_ID="eipalloc-xxxxxxxxxxxxxxxxx"

# Associate with instance
aws ec2 associate-address \
  --instance-id $INSTANCE_ID \
  --allocation-id $ALLOCATION_ID

# Get the Elastic IP
ELASTIC_IP=$(aws ec2 describe-addresses \
  --allocation-ids $ALLOCATION_ID \
  --query 'Addresses[0].PublicIp' \
  --output text)

echo "Elastic IP: $ELASTIC_IP"
```

### Step 5: Connect and Initial Setup

```bash
# SSH into instance
ssh -i ~/.ssh/nodejs-deploy-key.pem ec2-user@$ELASTIC_IP

# Once connected, update system
sudo dnf update -y

# Install Node.js 20 LTS
sudo dnf install -y nodejs20

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo dnf install -y git

# Create app directory
sudo mkdir -p /var/www
sudo chown ec2-user:ec2-user /var/www
cd /var/www
```

### Step 6: Clone Repository and Setup

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/pachuca-noticias.git
cd pachuca-noticias

# Install dependencies for backend
cd packages/api-nueva
npm install --production

# Build backend
npm run build

# Install dependencies for frontend
cd ../dash-coyote
npm install --production

# Build frontend
npm run build

# Go back to root
cd /var/www/pachuca-noticias
```

### Step 7: Environment Variables

```bash
# Create .env for backend (api-nueva)
cat > /var/www/pachuca-noticias/packages/api-nueva/.env << 'EOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key
# Add all your other environment variables
EOF

# Create .env for frontend (dash-coyote)
cat > /var/www/pachuca-noticias/packages/dash-coyote/.env << 'EOF'
NODE_ENV=production
PORT=3001
API_URL=http://localhost:3000
# Add all your other environment variables
EOF
```

### Step 8: PM2 Ecosystem Configuration

Create `/var/www/pachuca-noticias/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'nestjs-backend',
      cwd: '/var/www/pachuca-noticias/packages/api-nueva',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/nestjs-backend-error.log',
      out_file: '/var/log/pm2/nestjs-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'remix-frontend',
      cwd: '/var/www/pachuca-noticias/packages/dash-coyote',
      script: 'build/index.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/remix-frontend-error.log',
      out_file: '/var/log/pm2/remix-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '400M',
      autorestart: true,
      watch: false,
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown ec2-user:ec2-user /var/log/pm2

# Start applications with PM2
cd /var/www/pachuca-noticias
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Run the command it outputs (it will be something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Verify apps are running
pm2 status
pm2 logs
```

**Citations:**
[7] AWS Documentation. "Setting up Node.js on an Amazon EC2 instance." 2025. https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-up-node-on-ec2-instance.html
[8] PM2 Documentation. "Ecosystem File." 2025. https://pm2.keymetrics.io/docs/usage/application-declaration/

---

## 5. Nginx Configuration

### Step 1: Install Nginx

```bash
# Install Nginx on Amazon Linux 2023
sudo dnf install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### Step 2: Configure Nginx as Reverse Proxy

Create `/etc/nginx/conf.d/noticiaspachuca.conf`:

```nginx
# Upstream for NestJS Backend
upstream nestjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Upstream for Remix Frontend
upstream remix_frontend {
    server 127.0.0.1:3001;
    keepalive 64;
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name noticiaspachuca.com www.noticiaspachuca.com;

    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server - Frontend (Remix)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name noticiaspachuca.com www.noticiaspachuca.com;

    # SSL Configuration (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/noticiaspachuca.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/noticiaspachuca.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml text/javascript;

    # Client body size limit
    client_max_body_size 10M;

    # Remix Frontend - Root
    location / {
        proxy_pass http://remix_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
        proxy_connect_timeout 90;
        proxy_send_timeout 90;
    }
}

# HTTPS Server - Backend API (NestJS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.noticiaspachuca.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/noticiaspachuca.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/noticiaspachuca.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # CORS Headers (adjust as needed)
    add_header Access-Control-Allow-Origin "https://noticiaspachuca.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml text/javascript;

    # Client body size limit
    client_max_body_size 50M;

    # NestJS Backend API
    location / {
        proxy_pass http://nestjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://nestjs_backend/health;
    }
}
```

### Step 3: Create Certbot Directory

```bash
# Create directory for Let's Encrypt challenges
sudo mkdir -p /var/www/certbot
sudo chown nginx:nginx /var/www/certbot
```

### Step 4: Test and Reload Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Alternative: Simple HTTP Configuration (Before SSL)

If you want to test before SSL setup:

```nginx
# /etc/nginx/conf.d/noticiaspachuca-http.conf
server {
    listen 80;
    server_name noticiaspachuca.com www.noticiaspachuca.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.noticiaspachuca.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Citations:**
[9] Better Stack. "How to Configure Nginx as a Reverse Proxy for Node.js Applications." 2025. https://betterstack.com/community/guides/scaling-nodejs/nodejs-reverse-proxy-nginx/
[10] DEV Community. "Setting Up an Nginx Reverse Proxy with an Authentication System (NestJS Example)." 2024. https://dev.to/criscmd/setting-up-an-nginx-reverse-proxy-with-an-authentication-system-nestjs-example-54ng

---

## 6. SSL/TLS Setup

### Step 1: Install Certbot for Amazon Linux 2023

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 2: Obtain SSL Certificate

```bash
# Make sure Nginx is running and configured for HTTP first
sudo systemctl status nginx

# Obtain certificate using Nginx plugin
sudo certbot --nginx -d noticiaspachuca.com -d www.noticiaspachuca.com -d api.noticiaspachuca.com

# Follow the prompts:
# 1. Enter email address for renewal notifications
# 2. Agree to Terms of Service
# 3. Choose whether to share email with EFF
# 4. Choose to redirect HTTP to HTTPS (recommended: yes)
```

### Alternative: Manual Certificate (More Control)

```bash
# Obtain certificate without modifying Nginx config
sudo certbot certonly --nginx \
  -d noticiaspachuca.com \
  -d www.noticiaspachuca.com \
  -d api.noticiaspachuca.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Certificates will be saved to:
# /etc/letsencrypt/live/noticiaspachuca.com/fullchain.pem
# /etc/letsencrypt/live/noticiaspachuca.com/privkey.pem
```

### Step 3: Verify SSL Certificate

```bash
# Check certificate details
sudo certbot certificates

# Test SSL configuration
curl -I https://noticiaspachuca.com
curl -I https://api.noticiaspachuca.com

# Test SSL grade (from local machine)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=noticiaspachuca.com
```

### Step 4: Automatic Renewal Setup

**Amazon Linux 2023 uses systemd timers for Certbot renewal:**

```bash
# Check if renewal timer is active
sudo systemctl status certbot-renew.timer

# Enable automatic renewal (should be enabled by default)
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

# List all timers to verify
sudo systemctl list-timers certbot-renew.timer

# Test renewal process (dry run)
sudo certbot renew --dry-run
```

### Step 5: Setup Renewal Hook for Nginx

Create `/etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh`:

```bash
#!/bin/bash
# Reload Nginx after certificate renewal
systemctl reload nginx
```

```bash
# Make script executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

# Test hook
sudo certbot renew --dry-run
```

### Manual Cron Setup (Alternative to systemd timer)

```bash
# If you prefer cron instead of systemd timer:
sudo crontab -e

# Add this line to check for renewal twice daily at 2:30 AM and PM
30 2,14 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### Step 6: Nginx SSL Best Practices Configuration

The Nginx configuration in Section 5 already includes these SSL settings, but here's the detailed explanation:

```nginx
# Modern SSL Configuration (2025 Best Practices)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;

# SSL Session Settings
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/noticiaspachuca.com/chain.pem;

# DNS Resolver for OCSP
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

### Certificate Files Explained

```
/etc/letsencrypt/live/noticiaspachuca.com/
├── fullchain.pem    -> Certificate + Intermediate (use in nginx)
├── privkey.pem      -> Private key (use in nginx)
├── cert.pem         -> Certificate only
└── chain.pem        -> Intermediate certificate
```

### Renewal Timeline

- Let's Encrypt certificates are valid for **90 days**
- Certbot automatically renews certificates **30 days before expiry**
- Renewal checks run **twice daily** (via systemd timer)
- Nginx is automatically reloaded after successful renewal

### Monitoring Certificate Expiry

```bash
# Check certificate expiration date
echo | openssl s_client -servername noticiaspachuca.com -connect noticiaspachuca.com:443 2>/dev/null | openssl x509 -noout -dates

# View all certificates managed by Certbot
sudo certbot certificates
```

**Citations:**
[11] AWS re:Post. "Use Certbot to enable HTTPS with Nginx on EC2 instances running Amazon Linux 2023." 2025. https://repost.aws/articles/AR_doGU0cxQymwf5A1Gl97yA
[12] Medium. "How To Automatically Renew SSL Certificates on AWS EC2." 2024. https://medium.com/preprintblog/how-to-automatically-renew-ssl-certificates-on-aws-ec2-be22d6ad6a4f

---

## 7. DNS Configuration with Route53

### Step 1: Get Hosted Zone ID

```bash
# List all hosted zones
aws route53 list-hosted-zones

# Get specific hosted zone ID for your domain
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='noticiaspachuca.com.'].Id" \
  --output text | cut -d'/' -f3)

echo "Hosted Zone ID: $HOSTED_ZONE_ID"
```

### Step 2: Create A Record for Root Domain

Create file `route53-root-domain.json`:

```json
{
  "Comment": "Create A record for root domain",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "noticiaspachuca.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "YOUR_ELASTIC_IP"
          }
        ]
      }
    }
  ]
}
```

```bash
# Replace YOUR_ELASTIC_IP with actual IP
sed -i "s/YOUR_ELASTIC_IP/$ELASTIC_IP/g" route53-root-domain.json

# Create A record
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://route53-root-domain.json
```

### Step 3: Create A Record for www Subdomain

Create file `route53-www-subdomain.json`:

```json
{
  "Comment": "Create A record for www subdomain",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.noticiaspachuca.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "YOUR_ELASTIC_IP"
          }
        ]
      }
    }
  ]
}
```

```bash
# Replace YOUR_ELASTIC_IP with actual IP
sed -i "s/YOUR_ELASTIC_IP/$ELASTIC_IP/g" route53-www-subdomain.json

# Create A record
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://route53-www-subdomain.json
```

### Step 4: Create A Record for API Subdomain

Create file `route53-api-subdomain.json`:

```json
{
  "Comment": "Create A record for api subdomain",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.noticiaspachuca.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "YOUR_ELASTIC_IP"
          }
        ]
      }
    }
  ]
}
```

```bash
# Replace YOUR_ELASTIC_IP with actual IP
sed -i "s/YOUR_ELASTIC_IP/$ELASTIC_IP/g" route53-api-subdomain.json

# Create A record
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://route53-api-subdomain.json
```

### Step 5: Verify DNS Records

```bash
# List all records in hosted zone
aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID

# Check specific record
aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --query "ResourceRecordSets[?Name=='noticiaspachuca.com.']"
```

### Step 6: Test DNS Resolution

```bash
# From your local machine
dig noticiaspachuca.com
dig www.noticiaspachuca.com
dig api.noticiaspachuca.com

# Or using nslookup
nslookup noticiaspachuca.com
nslookup www.noticiaspachuca.com
nslookup api.noticiaspachuca.com

# Check DNS propagation (from local machine)
# Visit: https://dnschecker.org/#A/noticiaspachuca.com
```

### Alternative: Single Command for All Records

Create file `route53-all-records.json`:

```json
{
  "Comment": "Create all A records for noticiaspachuca.com",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "noticiaspachuca.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_ELASTIC_IP"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.noticiaspachuca.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_ELASTIC_IP"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.noticiaspachuca.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_ELASTIC_IP"}]
      }
    }
  ]
}
```

```bash
# Replace YOUR_ELASTIC_IP with actual IP
sed -i "s/YOUR_ELASTIC_IP/$ELASTIC_IP/g" route53-all-records.json

# Create all records at once
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://route53-all-records.json
```

### Understanding TTL (Time To Live)

- **TTL 300 (5 minutes)**: Good for initial setup or when changes are frequent
- **TTL 3600 (1 hour)**: Standard for production
- **TTL 86400 (24 hours)**: For stable, rarely-changing records

### DNS Propagation Time

- Route53 changes are typically propagated within **60 seconds**
- Global DNS propagation can take **2-48 hours** depending on ISP caching
- To verify: Use multiple DNS checkers from different locations

### Change Status Tracking

```bash
# Get change ID from previous command output
CHANGE_ID="/change/C1234567890ABC"

# Check status of DNS change
aws route53 get-change --id $CHANGE_ID

# Status will be either PENDING or INSYNC
# INSYNC means propagated to all Route53 DNS servers
```

**Citations:**
[13] AWS CLI Documentation. "change-resource-record-sets." 2025. https://docs.aws.amazon.com/cli/latest/reference/route53/change-resource-record-sets.html
[14] LearnAWS. "AWS CLI & Route53: Complete Guide with examples." 2025. https://www.learnaws.org/2022/02/04/aws-cli-route53-guide/

---

## 8. Security Configuration

### Step 1: SSH Hardening

```bash
# Backup original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

Apply these settings in `/etc/ssh/sshd_config`:

```bash
# 2025 SSH Hardening Best Practices

# Disable root login
PermitRootLogin no

# Use SSH Protocol 2 only
Protocol 2

# Disable password authentication (use keys only)
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no

# Limit user login
AllowUsers ec2-user

# Disable X11 forwarding
X11Forwarding no

# Set login grace time
LoginGraceTime 60

# Maximum auth tries
MaxAuthTries 3

# Session timeout for idle connections
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable unused authentication methods
UsePAM no
HostbasedAuthentication no

# Use strong ciphers (2025 standards)
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512

# Log level
LogLevel VERBOSE

# Change default port (optional but recommended)
# Port 2222  # Uncomment and change if desired
```

```bash
# Test SSH config for syntax errors
sudo sshd -t

# Restart SSH service
sudo systemctl restart sshd

# IMPORTANT: Keep your current SSH session open
# Open a NEW terminal to test SSH connection before closing this one
```

### Step 2: Configure UFW Firewall

```bash
# Install UFW
sudo dnf install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if you changed it)
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP
sudo ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS
sudo ufw allow 443/tcp comment 'HTTPS'

# Optional: Limit SSH connections (rate limiting)
sudo ufw limit 22/tcp

# Enable UFW
sudo ufw enable

# Check status
sudo ufw status verbose

# List numbered rules
sudo ufw status numbered
```

### Advanced UFW: Allow SSH from Specific IP Only

```bash
# Delete existing SSH rule
sudo ufw delete allow 22/tcp

# Allow SSH only from your IP
sudo ufw allow from YOUR_IP_ADDRESS to any port 22 proto tcp comment 'SSH from trusted IP'

# Verify
sudo ufw status numbered
```

### Step 3: Install and Configure Fail2Ban

```bash
# Install Fail2Ban
sudo dnf install -y fail2ban

# Create local configuration file
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit local configuration
sudo nano /etc/fail2ban/jail.local
```

Configure `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
# Ban duration (10 hours)
bantime = 36000

# Time window to check for failed attempts (10 minutes)
findtime = 600

# Max failed attempts before ban
maxretry = 3

# Ignore localhost
ignoreip = 127.0.0.1/8 ::1

# Email notifications (optional)
destemail = your-email@example.com
sender = fail2ban@noticiaspachuca.com
mta = sendmail

# Action: ban only (or ban and email if configured)
action = %(action_)s

[sshd]
enabled = true
port = 22
logpath = /var/log/secure
maxretry = 3
bantime = 36000
findtime = 600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
```

```bash
# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo systemctl status fail2ban

# Check active jails
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status sshd

# View banned IPs
sudo fail2ban-client status sshd

# Unban an IP (if needed)
sudo fail2ban-client set sshd unbanip IP_ADDRESS
```

### Step 4: Disable Unused Services

```bash
# List all running services
sudo systemctl list-units --type=service --state=running

# Disable unused services (examples)
sudo systemctl disable --now bluetooth.service
sudo systemctl disable --now cups.service

# Check what's listening on ports
sudo ss -tlnp
```

### Step 5: Configure Automatic Security Updates

```bash
# Install dnf-automatic for Amazon Linux 2023
sudo dnf install -y dnf-automatic

# Configure automatic updates
sudo nano /etc/dnf/automatic.conf
```

Edit `/etc/dnf/automatic.conf`:

```ini
[commands]
upgrade_type = security
download_updates = yes
apply_updates = yes

[emitters]
emit_via = stdio

[email]
email_from = root@noticiaspachuca.com
email_to = your-email@example.com
```

```bash
# Enable and start automatic updates
sudo systemctl enable --now dnf-automatic.timer

# Check status
sudo systemctl status dnf-automatic.timer
```

### Step 6: Set Up Intrusion Detection (Optional)

```bash
# Install AIDE (Advanced Intrusion Detection Environment)
sudo dnf install -y aide

# Initialize AIDE database
sudo aide --init

# Move database
sudo mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# Run manual check
sudo aide --check

# Setup daily cron job
echo "0 5 * * * /usr/sbin/aide --check" | sudo crontab -
```

### Step 7: File Permissions Hardening

```bash
# Secure sensitive files
sudo chmod 600 /var/www/pachuca-noticias/packages/*/. env
sudo chown ec2-user:ec2-user /var/www/pachuca-noticias/packages/*/.env

# Secure SSH keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Secure log files
sudo chmod 640 /var/log/nginx/*.log
sudo chown nginx:nginx /var/log/nginx/*.log
```

### Step 8: Enable SELinux (Already Active on Amazon Linux 2023)

```bash
# Check SELinux status
sestatus

# Should show: SELinux status: enabled

# View current mode
getenforce

# If disabled, enable it
sudo setenforce 1

# Make persistent
sudo sed -i 's/SELINUX=disabled/SELINUX=enforcing/g' /etc/selinux/config
```

### Security Checklist Summary

- [x] SSH hardening (keys only, no root, strong ciphers)
- [x] UFW firewall configured
- [x] Fail2Ban protecting SSH and Nginx
- [x] Automatic security updates enabled
- [x] Unused services disabled
- [x] File permissions secured
- [x] SELinux enabled
- [x] Intrusion detection configured (optional)
- [x] Security groups properly configured in AWS
- [x] Elastic IP to prevent IP changes
- [x] SSL/TLS with Let's Encrypt

### Regular Security Maintenance Tasks

```bash
# Weekly: Check fail2ban logs
sudo fail2ban-client status
sudo journalctl -u fail2ban -n 100

# Weekly: Review UFW logs
sudo tail -100 /var/log/ufw.log

# Monthly: Check for failed login attempts
sudo lastb | head -20

# Monthly: Review system logs
sudo journalctl -p 3 -xb  # Show priority 3 (errors) and higher

# Monthly: Update packages
sudo dnf update -y

# Quarterly: Review user accounts
cat /etc/passwd
sudo lastlog
```

**Citations:**
[15] AWS re:Post. "Keep EC2 Linux instances secure when you use SSH." 2025. https://repost.aws/knowledge-center/ec2-ssh-best-practices
[16] Medium. "Linux Server Hardening Guide: Securing SSH with Fail2Ban, UFW, and iptables." 2024. https://h3des.medium.com/linux-server-hardening-guide-securing-ssh-with-fail2ban-ufw-and-iptables-e17907adc1a7
[17] OnlineHashCrack. "HowTo: Harden SSH Daemon 2025: Best Settings." 2025. https://www.onlinehashcrack.com/guides/tutorials/howto-harden-ssh-daemon-2025-best-settings.php

---

## 9. Monitoring & Logs

### PM2 Log Management

#### Viewing Logs

```bash
# View all logs
pm2 logs

# View logs for specific app
pm2 logs nestjs-backend
pm2 logs remix-frontend

# View only error logs
pm2 logs --err

# View only output logs
pm2 logs --out

# View last N lines
pm2 logs --lines 100

# Clear all logs
pm2 flush

# Show log locations
pm2 show nestjs-backend
pm2 show remix-frontend
```

#### PM2 Log Rotation

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M           # Max size before rotation
pm2 set pm2-logrotate:retain 7               # Keep 7 rotated files
pm2 set pm2-logrotate:compress true          # Compress rotated files
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD  # Date format for rotated files
pm2 set pm2-logrotate:workerInterval 30      # Check interval in seconds
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Rotate daily at midnight

# Check module info
pm2 info pm2-logrotate
```

#### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process status
pm2 status

# Detailed info
pm2 info nestjs-backend

# CPU/Memory usage
pm2 describe nestjs-backend

# Web-based monitoring (PM2 Plus - Free tier available)
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY
```

### CloudWatch Logs Integration

#### Step 1: Install CloudWatch Agent

```bash
# Download CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm

# Install agent
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Verify installation
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a query -m ec2 -c default -s
```

#### Step 2: Create IAM Role for CloudWatch

```bash
# Create IAM role policy document
cat > cloudwatch-assume-role.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name EC2-CloudWatch-Role \
  --assume-role-policy-document file://cloudwatch-assume-role.json

# Attach CloudWatch policy
aws iam attach-role-policy \
  --role-name EC2-CloudWatch-Role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name EC2-CloudWatch-Profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-CloudWatch-Profile \
  --role-name EC2-CloudWatch-Role

# Attach instance profile to EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id $INSTANCE_ID \
  --iam-instance-profile Name=EC2-CloudWatch-Profile
```

#### Step 3: Configure CloudWatch Agent

Create `/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json`:

```json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/pm2/nestjs-backend-error.log",
            "log_group_name": "/aws/ec2/noticiaspachuca/nestjs-backend",
            "log_stream_name": "{instance_id}/error",
            "retention_in_days": 7
          },
          {
            "file_path": "/var/log/pm2/nestjs-backend-out.log",
            "log_group_name": "/aws/ec2/noticiaspachuca/nestjs-backend",
            "log_stream_name": "{instance_id}/output",
            "retention_in_days": 7
          },
          {
            "file_path": "/var/log/pm2/remix-frontend-error.log",
            "log_group_name": "/aws/ec2/noticiaspachuca/remix-frontend",
            "log_stream_name": "{instance_id}/error",
            "retention_in_days": 7
          },
          {
            "file_path": "/var/log/pm2/remix-frontend-out.log",
            "log_group_name": "/aws/ec2/noticiaspachuca/remix-frontend",
            "log_stream_name": "{instance_id}/output",
            "retention_in_days": 7
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/noticiaspachuca/nginx",
            "log_stream_name": "{instance_id}/access",
            "retention_in_days": 7
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/noticiaspachuca/nginx",
            "log_stream_name": "{instance_id}/error",
            "retention_in_days": 7
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "Noticiaspachuca/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          },
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEMORY_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      },
      "swap": {
        "measurement": [
          {
            "name": "swap_used_percent",
            "rename": "SWAP_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
```

#### Step 4: Start CloudWatch Agent

```bash
# Start CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Verify agent is running
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a query \
  -m ec2 \
  -c default \
  -s

# Check agent logs
sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log
```

### Health Checks & Monitoring Scripts

#### Create Health Check Script

```bash
# Create health check script
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash
# Health check script for Node.js applications

LOG_FILE="/var/log/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check NestJS backend
NESTJS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$NESTJS_STATUS" != "200" ]; then
  echo "[$TIMESTAMP] ERROR: NestJS backend unhealthy (HTTP $NESTJS_STATUS)" >> $LOG_FILE
  pm2 restart nestjs-backend
  echo "[$TIMESTAMP] INFO: Restarted NestJS backend" >> $LOG_FILE
fi

# Check Remix frontend
REMIX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$REMIX_STATUS" != "200" ]; then
  echo "[$TIMESTAMP] ERROR: Remix frontend unhealthy (HTTP $REMIX_STATUS)" >> $LOG_FILE
  pm2 restart remix-frontend
  echo "[$TIMESTAMP] INFO: Restarted Remix frontend" >> $LOG_FILE
fi

# Check Nginx
if ! sudo systemctl is-active --quiet nginx; then
  echo "[$TIMESTAMP] ERROR: Nginx is down" >> $LOG_FILE
  sudo systemctl restart nginx
  echo "[$TIMESTAMP] INFO: Restarted Nginx" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  echo "[$TIMESTAMP] WARNING: Disk usage is at ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
if [ "$MEM_USAGE" -gt 85 ]; then
  echo "[$TIMESTAMP] WARNING: Memory usage is at ${MEM_USAGE}%" >> $LOG_FILE
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/health-check.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -

# Test health check
sudo /usr/local/bin/health-check.sh
```

### Nginx Access Logs Analysis

```bash
# Real-time log viewing
sudo tail -f /var/log/nginx/access.log

# Count requests by status code
sudo awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Top 10 IPs
sudo awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# Top 10 requested URLs
sudo awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 404 errors
sudo grep ' 404 ' /var/log/nginx/access.log

# 5xx errors
sudo grep ' 5[0-9][0-9] ' /var/log/nginx/error.log

# Requests per hour
sudo awk '{print $4}' /var/log/nginx/access.log | cut -d: -f1-2 | sort | uniq -c
```

### System Monitoring Commands

```bash
# CPU usage
top -bn1 | head -20

# Memory usage
free -h

# Disk usage
df -h

# Network connections
sudo netstat -tuln

# Process list
ps aux | grep node

# System load
uptime

# Check open files
lsof -i :3000
lsof -i :3001
lsof -i :80
lsof -i :443
```

**Citations:**
[18] PM2 Documentation. "Logs." 2025. https://pm2.keymetrics.io/docs/usage/log-management/
[19] Stack Overflow. "Send pm2 logs from ec2 instance to cloudwatch." 2024. https://stackoverflow.com/questions/62534276/send-pm2-logs-from-ec2-instance-to-cloudwatch
[20] AWS Documentation. "Quick Start: Install and configure the CloudWatch Logs agent." 2025. https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/QuickStartEC2Instance.html

---

## 10. Troubleshooting

### Common Issues & Solutions

#### 1. Application Won't Start

**Symptoms:**
- PM2 shows app as "errored" or constantly restarting
- `pm2 logs` shows errors

**Solutions:**

```bash
# Check PM2 logs
pm2 logs nestjs-backend --lines 100
pm2 logs remix-frontend --lines 100

# Check if port is already in use
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process on port (if needed)
sudo kill -9 $(sudo lsof -t -i:3000)
sudo kill -9 $(sudo lsof -t -i:3001)

# Check environment variables
pm2 env nestjs-backend
pm2 env remix-frontend

# Verify Node.js version
node --version  # Should be v20.x.x

# Check file permissions
ls -la /var/www/pachuca-noticias/packages/api-nueva/dist/main.js
ls -la /var/www/pachuca-noticias/packages/dash-coyote/build/index.js

# Try running directly (debugging)
cd /var/www/pachuca-noticias/packages/api-nueva
node dist/main.js

# Check for missing dependencies
npm list --production
```

#### 2. Can't Access Website (502 Bad Gateway)

**Symptoms:**
- Browser shows "502 Bad Gateway"
- Nginx error logs show "connect() failed (111: Connection refused)"

**Solutions:**

```bash
# Check if apps are running
pm2 status

# Check if apps are listening on correct ports
sudo netstat -tlnp | grep node

# Check Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Restart applications
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx

# Check upstream connections in Nginx config
sudo grep -A 5 "upstream" /etc/nginx/conf.d/noticiaspachuca.conf

# Test local connection
curl http://localhost:3000/health
curl http://localhost:3001

# Check SELinux (if enabled)
sudo setsebool -P httpd_can_network_connect 1
```

#### 3. SSL Certificate Issues

**Symptoms:**
- Browser shows "Your connection is not private"
- Certificate expired warnings

**Solutions:**

```bash
# Check certificate status
sudo certbot certificates

# Check certificate expiration
echo | openssl s_client -servername noticiaspachuca.com -connect noticiaspachuca.com:443 2>/dev/null | openssl x509 -noout -dates

# Test renewal
sudo certbot renew --dry-run

# Force renewal (if close to expiry)
sudo certbot renew --force-renewal

# Check Nginx SSL configuration
sudo nginx -t

# Verify certificate files exist
ls -la /etc/letsencrypt/live/noticiaspachuca.com/

# Check Nginx error log
sudo tail -50 /var/log/nginx/error.log | grep ssl

# Restart Nginx after renewal
sudo systemctl restart nginx
```

#### 4. Out of Memory (OOM) Errors

**Symptoms:**
- PM2 apps keep restarting
- Logs show "JavaScript heap out of memory"
- System is slow/unresponsive

**Solutions:**

```bash
# Check memory usage
free -h

# Check which process is using memory
ps aux --sort=-%mem | head -10

# Check PM2 memory usage
pm2 list

# Increase Node.js memory limit in ecosystem.config.js
# Add to app config:
# node_args: '--max_old_space_size=512'

# Restart apps with new memory limit
pm2 delete all
pm2 start ecosystem.config.js

# Enable swap (if not already enabled)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Monitor memory in real-time
watch -n 1 free -h
```

#### 5. DNS Not Resolving

**Symptoms:**
- Domain doesn't resolve to server IP
- "Server not found" errors

**Solutions:**

```bash
# Check Route53 records
aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID

# Test DNS resolution locally
dig noticiaspachuca.com
nslookup noticiaspachuca.com

# Check if change is propagated
aws route53 get-change --id $CHANGE_ID

# Verify NS records are correct
dig NS noticiaspachuca.com

# Check from multiple locations
# Use: https://dnschecker.org

# Flush local DNS cache (on your machine)
# macOS:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns

# Linux:
sudo systemd-resolve --flush-caches
```

#### 6. High CPU Usage

**Symptoms:**
- Server is slow
- Apps are unresponsive
- `top` shows high CPU usage

**Solutions:**

```bash
# Check CPU usage
top -bn1 | head -20

# Find CPU-hungry processes
ps aux --sort=-%cpu | head -10

# Check PM2 monitoring
pm2 monit

# Check for infinite loops in logs
pm2 logs --lines 200

# Enable PM2 clustering (if not already)
# In ecosystem.config.js, set:
# instances: 2  # or 'max' for all cores
# exec_mode: 'cluster'

# Restart with cluster mode
pm2 delete all
pm2 start ecosystem.config.js

# Check for malicious processes
sudo ps aux | grep -v grep | grep -E '(bitcoin|miner|crypto)'

# Check network connections
sudo netstat -tuln | wc -l
```

#### 7. Disk Space Full

**Symptoms:**
- Can't write files
- PM2 logs show write errors
- Apps crash randomly

**Solutions:**

```bash
# Check disk usage
df -h

# Find large files/directories
sudo du -sh /* | sort -hr | head -10
sudo du -sh /var/www/* | sort -hr

# Check log file sizes
sudo du -sh /var/log/*

# Clean PM2 logs
pm2 flush

# Clean old log files
sudo find /var/log -type f -name "*.log" -mtime +30 -delete
sudo find /var/log -type f -name "*.gz" -mtime +30 -delete

# Clean package manager cache
sudo dnf clean all

# Clean old kernels
sudo dnf remove $(dnf repoquery --installonly --latest-limit=-1 -q)

# Clean npm cache
npm cache clean --force

# Remove old PM2 logs
rm -rf ~/.pm2/logs/*
```

#### 8. PM2 Not Starting on Boot

**Symptoms:**
- Apps don't run after reboot
- PM2 list is empty after restart

**Solutions:**

```bash
# Save current PM2 processes
pm2 save

# Generate startup script
pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Run the command it outputs (something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Verify startup script exists
ls -la /etc/systemd/system/pm2-ec2-user.service

# Test by rebooting
sudo reboot

# After reboot, check PM2
pm2 list
pm2 status
```

#### 9. Nginx Configuration Test Fails

**Symptoms:**
- `nginx -t` shows errors
- Nginx won't reload/restart

**Solutions:**

```bash
# Test configuration
sudo nginx -t

# Check syntax errors in config files
sudo nginx -T | less

# Verify file paths exist
ls -la /etc/nginx/conf.d/
ls -la /etc/letsencrypt/live/noticiaspachuca.com/

# Check for duplicate server blocks
sudo grep -r "listen 80" /etc/nginx/
sudo grep -r "listen 443" /etc/nginx/

# Restore backup configuration (if needed)
sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf

# Check Nginx error log
sudo tail -50 /var/log/nginx/error.log

# Verify permissions
sudo chown -R nginx:nginx /var/log/nginx/
sudo chmod 755 /var/log/nginx/
```

#### 10. SSH Connection Refused

**Symptoms:**
- Can't SSH into server
- Connection timeout or refused

**Solutions:**

```bash
# From AWS Console:
# 1. Go to EC2 Dashboard
# 2. Select your instance
# 3. Actions -> Monitor and troubleshoot -> Get system log

# Check security group rules (from local machine)
aws ec2 describe-security-groups --group-ids $SG_ID

# Verify SSH service is running (via EC2 Serial Console or AWS Console)
sudo systemctl status sshd

# Check if port 22 is listening
sudo netstat -tlnp | grep :22

# Restart SSH service
sudo systemctl restart sshd

# Check SSH logs
sudo tail -100 /var/log/secure

# Verify key permissions (on local machine)
chmod 400 ~/.ssh/nodejs-deploy-key.pem

# Try verbose SSH connection
ssh -vvv -i ~/.ssh/nodejs-deploy-key.pem ec2-user@$ELASTIC_IP
```

### Emergency Recovery Commands

```bash
# Stop all applications
pm2 stop all

# Kill all node processes
sudo killall node

# Restart Nginx
sudo systemctl restart nginx

# Full system restart
sudo reboot

# Check all services after reboot
pm2 status
sudo systemctl status nginx
sudo systemctl status fail2ban
sudo systemctl status sshd
```

### Performance Debugging

```bash
# Install monitoring tools
sudo dnf install -y htop iotop nethogs

# Real-time system monitoring
htop

# Disk I/O monitoring
sudo iotop

# Network bandwidth monitoring
sudo nethogs

# Node.js profiling (for debugging)
node --prof dist/main.js

# Analyze profile
node --prof-process isolate-*-v8.log > processed.txt
```

### Useful Debugging Commands

```bash
# Check all listening ports
sudo ss -tlnp

# Check all active connections
sudo ss -tn

# Check system messages
sudo dmesg | tail -50

# Check journal logs
sudo journalctl -xe

# Check last logins
last -a | head -20

# Check failed login attempts
sudo lastb | head -20

# Monitor file changes in real-time
sudo tail -f /var/log/messages

# Check running processes
ps aux | grep node

# Check cron jobs
crontab -l
sudo crontab -l

# Check systemd timers
sudo systemctl list-timers
```

### Quick Health Check Script

```bash
#!/bin/bash
echo "=== System Health Check ==="
echo ""
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'
echo ""
echo "Memory Usage:"
free -h | awk '/^Mem/ {print $3 "/" $2}'
echo ""
echo "Disk Usage:"
df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}'
echo ""
echo "PM2 Status:"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status)"'
echo ""
echo "Nginx Status:"
sudo systemctl is-active nginx
echo ""
echo "Application Ports:"
sudo ss -tlnp | grep -E ':(3000|3001|80|443)'
```

**Citations:**
[21] Stack Overflow. "Node.js Heap Memory Issue: EC2 t3a.small vs t3.medium." 2024. https://stackoverflow.com/questions/78971768/node-js-heap-memory-issue-ec2-t3a-small-vs-t3-medium
[22] AWS Documentation. "Best practices for Amazon EC2." 2025. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html

---

## Complete Deployment Script

Here's a comprehensive bash script that automates the entire deployment:

```bash
#!/bin/bash
# Complete AWS EC2 Deployment Script for NestJS + Remix
# Run from your local machine with AWS CLI configured

set -e  # Exit on error

# Configuration
DOMAIN="noticiaspachuca.com"
INSTANCE_TYPE="t3.small"
KEY_NAME="nodejs-deploy-key"
SG_NAME="nodejs-web-sg"
APP_DIR="/var/www/pachuca-noticias"
YOUR_IP=$(curl -s https://checkip.amazonaws.com)
REPO_URL="https://github.com/YOUR_USERNAME/pachuca-noticias.git"

echo "=== AWS EC2 Deployment Script ==="
echo "Domain: $DOMAIN"
echo "Instance Type: $INSTANCE_TYPE"
echo "Your IP: $YOUR_IP"
echo ""

# Step 1: Create Security Group
echo "Step 1: Creating security group..."
SG_ID=$(aws ec2 create-security-group \
  --group-name $SG_NAME \
  --description "Security group for Node.js web applications" \
  --query 'GroupId' \
  --output text)

echo "Security Group ID: $SG_ID"

# Add security group rules
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr $YOUR_IP/32
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# Step 2: Create Key Pair
echo "Step 2: Creating key pair..."
aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text > ~/.ssh/${KEY_NAME}.pem
chmod 400 ~/.ssh/${KEY_NAME}.pem

# Step 3: Launch Instance
echo "Step 3: Launching EC2 instance..."
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_NAME \
  --security-group-ids $SG_ID \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=nodejs-production}]" \
  --count 1 \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# Wait for instance
echo "Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "Public IP: $PUBLIC_IP"

# Allocate Elastic IP
echo "Step 4: Allocating Elastic IP..."
ALLOCATION_ID=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
aws ec2 associate-address --instance-id $INSTANCE_ID --allocation-id $ALLOCATION_ID
ELASTIC_IP=$(aws ec2 describe-addresses --allocation-ids $ALLOCATION_ID --query 'Addresses[0].PublicIp' --output text)
echo "Elastic IP: $ELASTIC_IP"

# Wait for SSH to be ready
echo "Waiting for SSH to be ready..."
sleep 60

# Save connection details
cat > deployment-info.txt << EOF
Deployment Information
=====================
Instance ID: $INSTANCE_ID
Elastic IP: $ELASTIC_IP
Security Group: $SG_ID
Key Name: $KEY_NAME
SSH Command: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$ELASTIC_IP
EOF

echo ""
echo "=== Deployment Information Saved to deployment-info.txt ==="
echo ""
echo "Next Steps:"
echo "1. SSH into the instance: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$ELASTIC_IP"
echo "2. Run the server setup script (see Server Setup Script below)"
echo "3. Configure DNS in Route53"
echo ""
```

### Server Setup Script (Run on EC2 Instance)

Save as `server-setup.sh` and run on the EC2 instance:

```bash
#!/bin/bash
# Server Setup Script - Run on EC2 instance after SSH

set -e

REPO_URL="https://github.com/YOUR_USERNAME/pachuca-noticias.git"
APP_DIR="/var/www/pachuca-noticias"

echo "=== Server Setup Script ==="

# Update system
echo "Updating system..."
sudo dnf update -y

# Install Node.js 20
echo "Installing Node.js 20..."
sudo dnf install -y nodejs20 git nginx

# Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Create app directory
echo "Creating app directory..."
sudo mkdir -p $APP_DIR
sudo chown ec2-user:ec2-user $APP_DIR

# Clone repository
echo "Cloning repository..."
git clone $REPO_URL $APP_DIR
cd $APP_DIR

# Install backend dependencies
echo "Setting up backend..."
cd packages/api-nueva
npm install --production
npm run build

# Install frontend dependencies
echo "Setting up frontend..."
cd ../dash-coyote
npm install --production
npm run build

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next Steps:"
echo "1. Create .env files in packages/api-nueva and packages/dash-coyote"
echo "2. Start applications: pm2 start ecosystem.config.js"
echo "3. Configure Nginx"
echo "4. Setup SSL with Certbot"
echo ""
```

---

## Summary & Best Practices 2025-2026

### Key Recommendations

1. **Instance:** t3.small ($15.18/month) - Best balance for SSR workloads
2. **AMI:** Amazon Linux 2023 - AWS-optimized performance
3. **Process Manager:** PM2 - Simple, reliable, Node.js-focused
4. **Reverse Proxy:** Nginx - Industry standard, excellent performance
5. **SSL:** Let's Encrypt with Certbot - Free, automated renewal
6. **Security:** UFW + Fail2Ban + SSH hardening - Defense in depth
7. **Monitoring:** PM2 logs + CloudWatch - Comprehensive observability

### Cost Estimation (Monthly)

- EC2 t3.small instance: $15.18
- Elastic IP (in use): $0
- EBS storage (20GB gp3): $1.60
- Data transfer (assuming <1TB): $0-90
- Route53 hosted zone: $0.50
- **Total: ~$17-107/month** (depending on traffic)

### Performance Expectations

- **Memory:** 2GB total, ~1GB available for apps
- **CPU:** 2 vCPUs with burst capability
- **Network:** Up to 5 Gbps
- **Expected Traffic:** Medium (thousands of requests/day)
- **Concurrent Users:** Hundreds to low thousands

### Maintenance Schedule

**Daily:**
- Automated: Security updates, log rotation, certificate checks

**Weekly:**
- Review PM2 logs and error rates
- Check fail2ban status
- Monitor disk/memory usage

**Monthly:**
- Update npm packages
- Review CloudWatch metrics
- Check for security vulnerabilities
- Audit user access logs

**Quarterly:**
- Full security audit
- Performance optimization review
- Backup and disaster recovery test

### When to Scale Up

Upgrade to t3.medium if:
- Memory usage consistently > 85%
- Frequent OOM errors
- Response times degrading
- Traffic exceeds current capacity

Consider load balancer + multiple instances if:
- Traffic requires high availability
- Need zero-downtime deployments
- Geographic distribution needed

---

## Additional Resources

### Official Documentation

1. AWS EC2: https://docs.aws.amazon.com/ec2/
2. Amazon Linux 2023: https://docs.aws.amazon.com/linux/al2023/
3. PM2: https://pm2.keymetrics.io/docs/
4. Nginx: https://nginx.org/en/docs/
5. Let's Encrypt: https://letsencrypt.org/docs/
6. NestJS Deployment: https://docs.nestjs.com/deployment
7. Remix Deployment: https://remix.run/docs/en/main/guides/deployment

### Community Resources

1. AWS subreddit: r/aws
2. Stack Overflow: [aws-ec2] [nginx] [pm2] tags
3. Nginx forums: https://forum.nginx.org/
4. PM2 GitHub: https://github.com/Unitech/pm2

### Security Resources

1. AWS Security Best Practices: https://aws.amazon.com/security/
2. OWASP Top 10: https://owasp.org/www-project-top-ten/
3. Mozilla SSL Config Generator: https://ssl-config.mozilla.org/

---

## Complete Citations

[1] Vantage. "t3.small pricing and specs." 2025. https://instances.vantage.sh/aws/ec2/t3.small

[2] Technical Ustad. "Amazon Linux vs Ubuntu - Operating Systems Face-Off in 2025." 2025. https://technicalustad.com/amazon-linux-vs-ubuntu/

[3] AWS Documentation. "Node.js in AL2023." Amazon Linux 2023, 2025. https://docs.aws.amazon.com/linux/al2023/ug/nodejs.html

[4] Technical Ustad. "Amazon Linux vs Ubuntu - Operating Systems Face-Off in 2025." 2025. https://technicalustad.com/amazon-linux-vs-ubuntu/

[5] Better Stack. "Running Node.js Apps with PM2 (Complete Guide)." Better Stack Community, 2025. https://betterstack.com/community/guides/scaling-nodejs/pm2-guide/

[6] Saderi, Payam. "To PM2, or Not to PM2: Embracing Docker for Node.js." Medium, 2024. https://medium.com/@saderi/to-pm2-or-not-to-pm2-embracing-docker-for-node-js-b4a8adce141c

[7] AWS Documentation. "Setting up Node.js on an Amazon EC2 instance." AWS SDK for JavaScript, 2025. https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-up-node-on-ec2-instance.html

[8] PM2 Documentation. "Ecosystem File." PM2 Documentation, 2025. https://pm2.keymetrics.io/docs/usage/application-declaration/

[9] Better Stack. "How to Configure Nginx as a Reverse Proxy for Node.js Applications." Better Stack Community, 2025. https://betterstack.com/community/guides/scaling-nodejs/nodejs-reverse-proxy-nginx/

[10] Criscmd. "Setting Up an Nginx Reverse Proxy with an Authentication System (NestJS Example)." DEV Community, 2024. https://dev.to/criscmd/setting-up-an-nginx-reverse-proxy-with-an-authentication-system-nestjs-example-54ng

[11] AWS re:Post. "Use Certbot to enable HTTPS with Nginx on EC2 instances running Amazon Linux 2023." 2025. https://repost.aws/articles/AR_doGU0cxQymwf5A1Gl97yA

[12] Wu, Henry. "How To Automatically Renew SSL Certificates on AWS EC2." Medium, preprintblog, 2024. https://medium.com/preprintblog/how-to-automatically-renew-ssl-certificates-on-aws-ec2-be22d6ad6a4f

[13] AWS CLI Documentation. "change-resource-record-sets." AWS CLI 2.31.7 Command Reference, 2025. https://docs.aws.amazon.com/cli/latest/reference/route53/change-resource-record-sets.html

[14] LearnAWS. "AWS CLI & Route53: Complete Guide with examples." 2025. https://www.learnaws.org/2022/02/04/aws-cli-route53-guide/

[15] AWS re:Post. "Keep EC2 Linux instances secure when you use SSH." 2025. https://repost.aws/knowledge-center/ec2-ssh-best-practices

[16] Hades. "Linux Server Hardening Guide: Securing SSH with Fail2Ban, UFW, and iptables." Medium, 2024. https://h3des.medium.com/linux-server-hardening-guide-securing-ssh-with-fail2ban-ufw-and-iptables-e17907adc1a7

[17] OnlineHashCrack. "HowTo: Harden SSH Daemon 2025: Best Settings." 2025. https://www.onlinehashcrack.com/guides/tutorials/howto-harden-ssh-daemon-2025-best-settings.php

[18] PM2 Documentation. "Logs." PM2 Documentation, 2025. https://pm2.keymetrics.io/docs/usage/log-management/

[19] Stack Overflow. "Send pm2 logs from ec2 instance to cloudwatch." 2024. https://stackoverflow.com/questions/62534276/send-pm2-logs-from-ec2-instance-to-cloudwatch

[20] AWS Documentation. "Quick Start: Install and configure the CloudWatch Logs agent on a running EC2 Linux instance." Amazon CloudWatch Logs, 2025. https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/QuickStartEC2Instance.html

[21] Stack Overflow. "Node.js Heap Memory Issue: EC2 t3a.small vs t3.medium." 2024. https://stackoverflow.com/questions/78971768/node-js-heap-memory-issue-ec2-t3a-small-vs-t3-medium

[22] AWS Documentation. "Best practices for Amazon EC2." Amazon Elastic Compute Cloud, 2025. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Target AWS Regions:** All (optimized for us-east-1)
**Tested On:** Amazon Linux 2023, Node.js 20 LTS, NestJS 10+, Remix latest

---

*This guide represents best practices as of January 2025-2026. Always consult official documentation for the most current recommendations.*
