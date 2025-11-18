# 🚀 Guía de Deployment - AnimeShorts

Guía completa para desplegar AnimeShorts en producción.

## 📋 Tabla de Contenidos

- [Prerequisitos](#prerequisitos)
- [Deployment con Docker](#deployment-con-docker)
- [Deployment Manual](#deployment-manual)
- [Servicios en la Nube](#servicios-en-la-nube)
- [SSL/HTTPS](#sslhttps)
- [Monitoring](#monitoring)
- [Backup](#backup)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisitos

### Infraestructura Mínima

**Para producción pequeña (hasta 10K usuarios):**
- **Backend**: 2 vCPU, 4 GB RAM
- **Frontend**: 1 vCPU, 2 GB RAM
- **PostgreSQL**: 2 vCPU, 4 GB RAM, 50 GB SSD
- **Redis**: 1 vCPU, 2 GB RAM
- **Almacenamiento**: S3 o equivalente

**Para producción media (hasta 100K usuarios):**
- **Backend**: 4 vCPU, 8 GB RAM (x2 instancias + Load Balancer)
- **Frontend**: 2 vCPU, 4 GB RAM (CDN + Edge)
- **PostgreSQL**: 4 vCPU, 16 GB RAM, 200 GB SSD
- **Redis**: 2 vCPU, 4 GB RAM
- **CDN**: CloudFront/CloudFlare

### Software Requerido

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Nginx (reverse proxy)
- Docker & Docker Compose (opcional)
- FFmpeg (para procesamiento de video)

---

## 🐳 Deployment con Docker

### 1. Preparación

```bash
# Clonar repositorio
git clone <repository-url>
cd SHORTS-H

# Crear archivos de environment
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production

# Editar con configuraciones de producción
nano backend/.env.production
nano frontend/.env.production
```

### 2. Configuración de Docker Compose (Producción)

Crear `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_prod:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod:/data
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    env_file:
      - ./backend/.env.production
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.animeshorts.com`)"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    env_file:
      - ./frontend/.env.production
    depends_on:
      - backend
    networks:
      - app-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`animeshorts.com`)"

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

volumes:
  postgres_prod:
  redis_prod:

networks:
  app-network:
    driver: bridge
```

### 3. Build y Deploy

```bash
# Build de imágenes
docker-compose -f docker-compose.prod.yml build

# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml run backend npx prisma migrate deploy

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Health Check

```bash
# Verificar servicios
docker-compose -f docker-compose.prod.yml ps

# Verificar API
curl https://api.animeshorts.com/api/health

# Verificar Frontend
curl https://animeshorts.com
```

---

## 🔧 Deployment Manual

### 1. Backend

```bash
# Ir al directorio backend
cd backend

# Instalar dependencias de producción
npm ci --production

# Build
npm run build

# Ejecutar migraciones
npx prisma migrate deploy

# Generar cliente de Prisma
npx prisma generate

# Iniciar con PM2
pm2 start dist/server.js --name animeshorts-api -i max

# Guardar configuración PM2
pm2 save

# Setup para auto-inicio
pm2 startup
```

### 2. Frontend

```bash
# Ir al directorio frontend
cd frontend

# Instalar dependencias
npm ci --production

# Build para producción
npm run build

# Iniciar con PM2
pm2 start npm --name animeshorts-frontend -- start

# O servir con Nginx (recomendado)
# Los archivos estáticos están en .next/
```

### 3. Nginx Configuration

Crear `/etc/nginx/sites-available/animeshorts`:

```nginx
# Backend API
upstream backend {
    least_conn;
    server localhost:5000;
    server localhost:5001;  # Si tienes múltiples instancias
}

# Frontend
upstream frontend {
    server localhost:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name animeshorts.com www.animeshorts.com api.animeshorts.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name animeshorts.com www.animeshorts.com;

    ssl_certificate /etc/nginx/ssl/animeshorts.com.crt;
    ssl_certificate_key /etc/nginx/ssl/animeshorts.com.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js static files
    location /_next/static {
        alias /var/www/animeshorts/frontend/.next/static;
        expires 365d;
        access_log off;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.animeshorts.com;

    ssl_certificate /etc/nginx/ssl/animeshorts.com.crt;
    ssl_certificate_key /etc/nginx/ssl/animeshorts.com.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS (si es necesario)
        add_header 'Access-Control-Allow-Origin' 'https://animeshorts.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Activar configuración:

```bash
sudo ln -s /etc/nginx/sites-available/animeshorts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ☁️ Servicios en la Nube

### Opción 1: Railway

**Backend:**
1. Conectar repositorio en Railway
2. Crear servicio PostgreSQL
3. Crear servicio Redis
4. Crear servicio Web (backend)
5. Configurar variables de entorno
6. Deploy automático

**Frontend:**
1. Deploy en Vercel (recomendado para Next.js)
2. Configurar `NEXT_PUBLIC_API_URL`

### Opción 2: AWS

**Arquitectura:**
```
CloudFront (CDN)
    │
    ├─► S3 (Frontend estático)
    └─► ALB (Load Balancer)
            │
            ├─► ECS (Backend containers)
            ├─► RDS PostgreSQL
            └─► ElastiCache Redis
```

**Pasos:**

1. **RDS PostgreSQL**
```bash
# Crear base de datos
aws rds create-db-instance \
  --db-instance-identifier animeshorts-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 100
```

2. **ElastiCache Redis**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id animeshorts-redis \
  --cache-node-type cache.t3.small \
  --engine redis \
  --num-cache-nodes 1
```

3. **ECS (Backend)**
```bash
# Crear cluster
aws ecs create-cluster --cluster-name animeshorts-cluster

# Build y push imagen a ECR
aws ecr create-repository --repository-name animeshorts-backend
docker build -t animeshorts-backend ./backend
docker tag animeshorts-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/animeshorts-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/animeshorts-backend:latest

# Crear task definition y service
```

4. **S3 + CloudFront (Frontend)**
```bash
# Build frontend
cd frontend && npm run build

# Subir a S3
aws s3 sync out/ s3://animeshorts-frontend

# Crear distribución CloudFront
aws cloudfront create-distribution --origin-domain-name animeshorts-frontend.s3.amazonaws.com
```

### Opción 3: DigitalOcean

1. **Droplet para Backend**
   - Ubuntu 22.04
   - 4 GB RAM / 2 vCPUs
   - Instalar Node.js, PostgreSQL, Redis
   - Configurar Nginx

2. **App Platform para Frontend**
   - Conectar repositorio
   - Auto-deploy Next.js

3. **Spaces para Videos**
   - S3-compatible storage
   - CDN incluido

---

## 🔒 SSL/HTTPS

### Let's Encrypt (Gratuito)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d animeshorts.com -d www.animeshorts.com -d api.animeshorts.com

# Auto-renovación
sudo certbot renew --dry-run
```

### CloudFlare (Recomendado)

1. Agregar dominio a CloudFlare
2. Cambiar nameservers
3. Activar SSL/TLS (Full)
4. Activar WAF (Web Application Firewall)
5. Configurar Page Rules para cache

---

## 📊 Monitoring

### 1. Application Monitoring

**PM2 Monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Sentry (Error Tracking):**
```javascript
// backend/src/server.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 2. Server Monitoring

**Prometheus + Grafana:**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 3. Database Monitoring

```bash
# pgAdmin
docker run -p 5050:80 \
  -e 'PGADMIN_DEFAULT_EMAIL=admin@animeshorts.com' \
  -e 'PGADMIN_DEFAULT_PASSWORD=admin' \
  -d dpage/pgadmin4
```

---

## 💾 Backup

### Database Backup

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
FILENAME="animeshorts_$DATE.sql.gz"

# Crear backup
pg_dump -h localhost -U animeshorts anime_shorts | gzip > "$BACKUP_DIR/$FILENAME"

# Subir a S3
aws s3 cp "$BACKUP_DIR/$FILENAME" s3://animeshorts-backups/database/

# Eliminar backups locales antiguos (más de 7 días)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

Programar con cron:
```bash
# Crontab: Backup diario a las 3 AM
0 3 * * * /path/to/backup-db.sh
```

### Restore

```bash
# Descargar desde S3
aws s3 cp s3://animeshorts-backups/database/animeshorts_20240115_030000.sql.gz ./

# Restaurar
gunzip -c animeshorts_20240115_030000.sql.gz | psql -h localhost -U animeshorts anime_shorts
```

---

## 🔍 Troubleshooting

### Backend no inicia

```bash
# Verificar logs
pm2 logs animeshorts-api

# Verificar conexión a DB
psql -h localhost -U animeshorts -d anime_shorts

# Verificar conexión a Redis
redis-cli -a <password> ping
```

### Alto uso de CPU

```bash
# Identificar proceso
top -p $(pgrep -f animeshorts)

# Verificar queries lentas
# En PostgreSQL
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 10;
```

### Memoria alta

```bash
# Verificar uso
free -h

# Reiniciar servicios
pm2 restart animeshorts-api
```

### Database lenta

```bash
# Vacuum
psql -c "VACUUM ANALYZE;"

# Reindex
psql -c "REINDEX DATABASE anime_shorts;"

# Verificar índices faltantes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY abs(correlation) DESC;
```

---

## 🎯 Checklist Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Secrets rotados (JWT, DB password, etc.)
- [ ] SSL/HTTPS configurado
- [ ] Backups programados
- [ ] Monitoring configurado
- [ ] Rate limiting activado
- [ ] CDN configurado para videos
- [ ] Logs centralizados
- [ ] Health checks configurados
- [ ] Rollback plan documentado
- [ ] Load testing ejecutado
- [ ] Security audit completado

---

## 📞 Soporte

Para problemas de deployment:
- GitHub Issues
- Email: devops@animeshorts.com

---

**¡Deployment exitoso! 🚀**
