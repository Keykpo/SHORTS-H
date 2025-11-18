# 🎬 AnimeShorts - Plataforma de Videos Cortos de Anime para Adultos

Una plataforma moderna de streaming de videos verticales estilo TikTok/Reels, especializada en contenido de anime para adultos (+18).

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Seguridad](#-seguridad)
- [Licencia](#-licencia)

## ✨ Características

### Funcionalidades Core (MVP)

- ✅ **Feed Infinito Vertical**: Scroll infinito con reproducción automática
- ✅ **Autenticación JWT**: Sistema robusto de registro/login
- ✅ **Verificación de Edad**: Age gate obligatorio para contenido +18
- ✅ **Sistema NSFW**: Etiquetado y filtrado de contenido explícito
- ✅ **Interacciones**: Likes, comentarios, compartir
- ✅ **Sistema de Tags**: Categorización por género, estilo, tema
- ✅ **Perfiles de Usuario**: Avatares, bio, estadísticas
- ✅ **Recomendaciones**: Algoritmo básico basado en tags

### Características de Seguridad

- 🔒 Verificación de edad obligatoria
- 🔒 Etiquetado NSFW de 3 niveles (SOFT, MODERATE, EXPLICIT)
- 🔒 Filtros de contenido personalizables
- 🔒 Sistema de reportes de contenido
- 🔒 Tokens JWT con refresh automático
- 🔒 Rate limiting en API

## 🛠 Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Cache**: Redis
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **API Client**: Axios
- **Video Player**: HTML5 Video + custom controls

### DevOps & Infraestructura
- **Storage**: AWS S3 / CloudFlare R2 (videos)
- **CDN**: CloudFront / CloudFlare
- **Video Processing**: FFmpeg
- **Containerización**: Docker
- **CI/CD**: GitHub Actions

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│              Cliente (Next.js 14)                    │
│  - Video Feed (Infinite Scroll)                     │
│  - Age Verification Gate                            │
│  - Authentication                                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           API Gateway / Load Balancer                │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ API Server 1 │          │ API Server N │
│  Express.js  │          │  Express.js  │
└──────┬───────┘          └──────┬───────┘
       │                         │
       └────────────┬────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│PostgreSQL│  │  Redis  │   │   S3    │
│   DB     │  │  Cache  │   │ Videos  │
└─────────┘   └─────────┘   └─────────┘
```

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para más detalles.

## 🚀 Instalación

### Prerequisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- pnpm (recomendado) o npm

### Instalación Rápida

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd SHORTS-H
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones

# Frontend
cp frontend/.env.example frontend/.env.local
# Editar frontend/.env.local
```

4. **Setup de la base de datos**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed  # (opcional) Datos de prueba
```

5. **Iniciar servicios**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

6. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Prisma Studio: `npm run prisma:studio` en `/backend`

## ⚙️ Configuración

### Variables de Entorno - Backend

```env
# Application
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/anime_shorts"

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Age Verification
MINIMUM_AGE=18
AGE_VERIFICATION_REQUIRED=true

# Storage (para producción)
STORAGE_PROVIDER=local
AWS_S3_BUCKET=anime-shorts-videos
CDN_URL=https://cdn.example.com
```

### Variables de Entorno - Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📖 Uso

### 1. Registro de Usuario

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "usuario123",
  "email": "user@example.com",
  "password": "Password123!",
  "birthDate": "1995-05-15",
  "agreedToTerms": true
}
```

### 2. Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### 3. Obtener Feed de Videos

```bash
GET /api/videos/feed?page=1&limit=20&sortBy=recent
Authorization: Bearer <token>
```

### 4. Dar Like a Video

```bash
POST /api/videos/{id}/like
Authorization: Bearer <token>
```

## 📚 API Documentation

### Endpoints de Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/logout` | Logout | Sí |
| POST | `/api/auth/refresh` | Refresh token | No |
| GET | `/api/auth/profile` | Perfil del usuario | Sí |

### Endpoints de Videos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/videos/feed` | Feed de videos | Opcional |
| GET | `/api/videos/:id` | Video por ID | Opcional |
| POST | `/api/videos/upload` | Subir video | Sí (+18) |
| POST | `/api/videos/:id/view` | Registrar vista | Opcional |
| POST | `/api/videos/:id/like` | Toggle like | Sí |
| GET | `/api/videos/user/:userId` | Videos de usuario | No |

### Parámetros del Feed

- `page`: Número de página (default: 1)
- `limit`: Videos por página (default: 20, max: 100)
- `tags`: Filtrar por tags (separados por coma)
- `nsfwOnly`: Solo contenido NSFW (true/false)
- `sortBy`: Ordenar por `recent`, `popular`, o `trending`

## 🚢 Deployment

### Docker (Recomendado)

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Logs
docker-compose logs -f
```

### Manual (Producción)

1. **Build del Frontend**
```bash
cd frontend
npm run build
```

2. **Build del Backend**
```bash
cd backend
npm run build
```

3. **Ejecutar Migraciones**
```bash
cd backend
npx prisma migrate deploy
```

4. **Iniciar Servicios**
```bash
# Backend
cd backend
npm start

# Frontend (con servidor Node)
cd frontend
npm start
```

### Despliegue en la Nube

- **Frontend**: Vercel, Netlify, CloudFlare Pages
- **Backend**: Railway, Render, AWS ECS, DigitalOcean
- **Database**: Supabase, Neon, AWS RDS
- **Redis**: Upstash, Redis Cloud
- **Storage**: AWS S3, CloudFlare R2, Backblaze B2

## 🔒 Seguridad

### Consideraciones Legales

⚠️ **IMPORTANTE**: Esta plataforma maneja contenido para adultos (+18). Asegúrate de:

1. **Verificación de Edad**: Implementar un sistema robusto de verificación
2. **Compliance Legal**: Cumplir con las leyes locales (2257 en USA, GDPR en EU)
3. **Content Moderation**: Sistema de reportes y moderación activa
4. **Terms of Service**: TOS claros sobre contenido permitido
5. **Privacy Policy**: Política de privacidad transparente
6. **Payment Processing**: Usar proveedores que acepten contenido adulto

### Best Practices Implementadas

- ✅ Passwords hasheados con bcrypt (12 rounds)
- ✅ JWT con expiración corta + refresh tokens
- ✅ Rate limiting en todos los endpoints
- ✅ Input validation con Zod
- ✅ SQL Injection protection (Prisma ORM)
- ✅ XSS protection
- ✅ CORS configurado
- ✅ Helmet.js para headers de seguridad
- ✅ HTTPS obligatorio en producción

## 📝 Estructura del Proyecto

```
SHORTS-H/
├── backend/                 # API Server
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.ts       # Entry point
│   └── package.json
│
├── frontend/               # Next.js App
│   ├── src/
│   │   ├── app/           # Next.js 14 App Router
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   ├── services/      # API services
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── ARCHITECTURE.md        # Arquitectura detallada
└── README.md             # Este archivo
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT.

---

## 🆘 Soporte

- Documentación: Ver `/docs`
- Issues: GitHub Issues
- Email: support@animeshorts.com

## 🎯 Roadmap

### Fase 1 - MVP (Actual) ✅
- [x] Sistema de autenticación
- [x] Feed de videos infinito
- [x] Age verification
- [x] Interacciones básicas
- [x] Sistema de tags

### Fase 2 - Mejoras
- [ ] Sistema de comentarios completo
- [ ] Notificaciones push
- [ ] Sistema de followers
- [ ] Búsqueda avanzada
- [ ] Algoritmo ML de recomendaciones

### Fase 3 - Escalamiento
- [ ] App móvil (React Native)
- [ ] Live streaming
- [ ] Sistema de monetización
- [ ] Creator dashboard
- [ ] Analytics avanzado

---

**Desarrollado con ❤️ para la comunidad de anime**
