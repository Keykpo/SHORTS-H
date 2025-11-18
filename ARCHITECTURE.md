# 🎬 AnimeShorts - Arquitectura del Sistema

## 📐 Visión General de la Arquitectura

AnimeShorts es una plataforma de streaming de videos cortos verticales (shorts) centrada en contenido de anime para adultos (+18). La arquitectura está diseñada para ser escalable, modular y optimizada para el consumo móvil.

### Principios de Diseño

1. **Escalabilidad Horizontal**: Arquitectura stateless que permite escalar servicios independientemente
2. **Separación de Responsabilidades**: Frontend, Backend API, y servicios de procesamiento de video separados
3. **Optimización para Móviles**: Prioridad en la experiencia móvil con videos optimizados
4. **Seguridad y Compliance**: Verificación de edad robusta y etiquetado de contenido explícito

---

## 🏗️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Navegador/App)                  │
│                      Next.js 14 + TypeScript                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTPS/WSS
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                        CDN (CloudFront)                          │
│                   Caché de Assets Estáticos                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐          ┌────────────────────┐
│  Static Assets│          │   API Gateway      │
│  (Next.js SSG)│          │   Load Balancer    │
└───────────────┘          └────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ API Server 1 │ │ API Server 2 │ │ API Server N │
            │   Express    │ │   Express    │ │   Express    │
            │  TypeScript  │ │  TypeScript  │ │  TypeScript  │
            └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                   │                │                │
                   └────────────────┼────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │  PostgreSQL  │ │    Redis     │ │  S3/R2       │
            │   (Primary)  │ │   (Cache)    │ │  (Videos)    │
            └──────────────┘ └──────────────┘ └──────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  PostgreSQL  │
            │  (Read Replicas)│
            └──────────────┘

                    ┌──────────────────────┐
                    │ Background Workers   │
                    │ - Video Processing   │
                    │ - Transcoding        │
                    │ - Thumbnail Gen      │
                    │ - ML Recommendations │
                    └──────────────────────┘
```

---

## 🔄 Flujo de Datos Principal

### 1. **Carga de Video (Upload)**

```
Usuario → Frontend → API Server → S3 (Raw) → Queue → Worker
                                                        │
                                                        ▼
                                           ┌─────────────────────┐
                                           │ FFmpeg Processing   │
                                           │ - Transcodifica     │
                                           │ - Genera thumbnails │
                                           │ - Extrae metadata   │
                                           └──────────┬──────────┘
                                                      │
                                                      ▼
                                           S3 (Processed) + CDN
                                                      │
                                                      ▼
                                           Actualiza DB (URL, estado)
```

### 2. **Reproducción de Video (Streaming)**

```
Usuario → Frontend → CDN (Cache Hit) → Video
                       │
                       └─ (Cache Miss) → S3 → CDN → Video
```

### 3. **Feed de Videos (Infinite Scroll)**

```
Usuario → Frontend → API /videos/feed
                           │
                           ├─ Cache Check (Redis)
                           │  └─ Hit → Return Cached
                           │
                           └─ Miss → Query DB
                                       │
                                       ├─ Filter por edad (+18 flag)
                                       ├─ Algoritmo de recomendación
                                       ├─ Pagination
                                       └─ Cache result → Return
```

---

## 🗄️ Modelo de Datos (PostgreSQL)

### Diagrama Relacional

```
┌─────────────────┐         ┌─────────────────┐
│     users       │◄────────│     videos      │
│─────────────────│  1    N │─────────────────│
│ id (PK)         │         │ id (PK)         │
│ username        │         │ user_id (FK)    │
│ email           │         │ title           │
│ password_hash   │         │ description     │
│ is_verified     │         │ video_url       │
│ is_premium      │         │ thumbnail_url   │
│ age_verified    │◄───┐    │ duration        │
│ created_at      │    │    │ views_count     │
└─────────────────┘    │    │ is_nsfw         │
         ▲             │    │ status          │
         │             │    │ created_at      │
         │             │    └─────────────────┘
         │             │             ▲
         │             │             │
         │             │    ┌────────┴────────┐
         │             │    │                 │
┌────────┴────────┐   │  ┌─┴──────────────┐ ┌┴────────────────┐
│   comments      │   │  │  interactions  │ │   video_tags    │
│─────────────────│   │  │────────────────│ │─────────────────│
│ id (PK)         │   │  │ id (PK)        │ │ id (PK)         │
│ user_id (FK)    │───┘  │ user_id (FK)   │ │ video_id (FK)   │
│ video_id (FK)   │      │ video_id (FK)  │ │ tag_id (FK)     │
│ content         │      │ type           │ └─────────────────┘
│ created_at      │      │ created_at     │          │
└─────────────────┘      └────────────────┘          │
                                                      ▼
                                             ┌─────────────────┐
                                             │      tags       │
                                             │─────────────────│
                                             │ id (PK)         │
                                             │ name            │
                                             │ category        │
                                             │ is_nsfw         │
                                             └─────────────────┘
```

---

## 🔐 Seguridad y Autenticación

### Flujo de Autenticación JWT

```
1. Registro/Login
   Usuario → API /auth/register
          └─ Validar edad (is_adult: true/false)
          └─ Hash password (bcrypt)
          └─ Crear usuario
          └─ Retornar JWT (access + refresh tokens)

2. Acceso a Recursos Protegidos
   Usuario → API /videos + Authorization: Bearer <token>
          └─ Middleware: Verificar JWT
          └─ Middleware: Verificar edad (+18)
          └─ Procesar request

3. Renovación de Token
   Usuario → API /auth/refresh + Refresh Token
          └─ Validar refresh token
          └─ Generar nuevo access token
```

### Capas de Seguridad

1. **HTTPS Obligatorio** en todas las comunicaciones
2. **Rate Limiting** para prevenir abuso de API
3. **CORS** configurado estrictamente
4. **Helmet.js** para headers de seguridad HTTP
5. **Input Validation** con Zod/Joi
6. **SQL Injection Protection** vía Prisma ORM
7. **XSS Protection** con sanitización de inputs
8. **CSRF Tokens** para formularios críticos

---

## 📹 Procesamiento de Video

### Pipeline de Transcodificación

```
Video Original (upload)
    │
    ▼
┌──────────────────────┐
│ Validación           │
│ - Formato permitido  │
│ - Tamaño máximo      │
│ - Duración (30-180s) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ FFmpeg Processing    │
│ - 1080p (mobile)     │
│ - 720p (adaptive)    │
│ - 480p (low-data)    │
│ - Audio AAC 128kbps  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Thumbnail Generation │
│ - Frame @ 2s         │
│ - Frame @ 50%        │
│ - Frame @ 80%        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Upload to S3 + CDN   │
│ - Estructura:        │
│   videos/{id}/       │
│     - 1080p.mp4      │
│     - 720p.mp4       │
│     - 480p.mp4       │
│     - thumb.jpg      │
└──────────┬───────────┘
           │
           ▼
   Actualizar DB
   status: 'processing' → 'ready'
```

---

## 🚀 Escalabilidad

### Estrategias Implementadas

1. **Database Scaling**
   - Read replicas para queries de lectura pesadas (feed, búsqueda)
   - Connection pooling con PgBouncer
   - Indexación estratégica (user_id, created_at, tags, is_nsfw)

2. **Caching**
   - Redis para:
     - Sesiones de usuario
     - Feed de videos (cache de 5 min)
     - Contadores (views, likes) con batch updates
     - Rate limiting

3. **CDN y Assets**
   - Videos servidos desde CDN (CloudFront/CloudFlare)
   - Assets estáticos (Next.js) en Edge locations
   - Lazy loading de videos (load next 3 videos)

4. **API Scaling**
   - Stateless API servers (horizontal scaling)
   - Load balancer con health checks
   - Auto-scaling basado en CPU/memoria

5. **Background Jobs**
   - Queue system (Bull/BullMQ con Redis)
   - Workers separados para:
     - Video processing
     - Email notifications
     - Analytics aggregation
     - ML recommendations training

---

## 🎯 Algoritmo de Recomendaciones (MVP)

### V1 - Basado en Contenido

```javascript
function getRecommendedVideos(userId, limit = 20) {
  // 1. Obtener historial del usuario (últimos 50 videos vistos)
  const userHistory = getUserHistory(userId);

  // 2. Extraer tags más frecuentes
  const preferredTags = extractTopTags(userHistory);

  // 3. Query optimizada
  return db.videos.findMany({
    where: {
      AND: [
        { is_nsfw: user.age_verified },
        { status: 'ready' },
        { tags: { some: { name: { in: preferredTags } } } },
        { id: { notIn: userHistory.map(v => v.id) } }
      ]
    },
    orderBy: [
      { views_count: 'desc' },
      { created_at: 'desc' }
    ],
    take: limit
  });
}
```

### V2 - Machine Learning (Futuro)
- Collaborative Filtering
- Content-based filtering híbrido
- TensorFlow.js para edge predictions

---

## 📊 Monitoreo y Observabilidad

### Métricas Clave

1. **Performance**
   - API response time (p50, p95, p99)
   - Video load time
   - CDN hit rate

2. **Business**
   - Daily Active Users (DAU)
   - Videos uploaded per day
   - Average watch time
   - Engagement rate (likes/views)

3. **Infrastructure**
   - Server CPU/Memory
   - Database connections
   - Queue depth
   - Storage usage

### Herramientas Sugeridas
- **APM**: Datadog / New Relic
- **Logs**: ELK Stack / CloudWatch
- **Errors**: Sentry
- **Analytics**: Mixpanel / Amplitude

---

## 🔄 CI/CD Pipeline

```
GitHub Push → GitHub Actions
                    │
                    ├─ Lint (ESLint + Prettier)
                    ├─ Type Check (TypeScript)
                    ├─ Test (Jest + Playwright)
                    ├─ Build
                    │
                    ▼
               Docker Build
                    │
                    ├─ Backend Image
                    ├─ Frontend Image
                    ├─ Worker Image
                    │
                    ▼
            Push to Registry (ECR/Docker Hub)
                    │
                    ▼
            Deploy to Staging
                    │
                    ├─ Smoke Tests
                    ├─ Integration Tests
                    │
                    ▼
        Manual Approval → Deploy to Production
                              │
                              ├─ Blue-Green Deployment
                              ├─ Health Checks
                              └─ Rollback if needed
```

---

## 🚨 Verificación de Edad y Filtros NSFW

### Implementación Multi-Capa

#### 1. **Registro de Usuario**
```typescript
// Al registrar, verificar edad
interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  birthDate: Date; // Calcular edad >= 18
  agreedToTerms: boolean;
}
```

#### 2. **Middleware de API**
```typescript
// Proteger todas las rutas NSFW
app.use('/videos', verifyAge, nsfwFilter);

function nsfwFilter(req, res, next) {
  if (!req.user.age_verified) {
    return res.status(403).json({
      error: 'Age verification required'
    });
  }
  next();
}
```

#### 3. **Frontend - Modal de Verificación**
```typescript
// Mostrar en primera visita
<AgeGate onVerify={handleAgeVerify} />

// Persistir en localStorage + cookie
// Backend valida siempre con JWT claims
```

#### 4. **Etiquetado de Contenido**
```typescript
// Cada video tiene flag NSFW
interface Video {
  id: string;
  is_nsfw: boolean; // TRUE para contenido +18
  nsfw_level: 'soft' | 'moderate' | 'explicit';
  content_warnings: string[]; // ['violence', 'sexual_content']
}
```

#### 5. **Filtrado Automático**
- Videos sin verificación de edad → Solo contenido SFW (is_nsfw = false)
- Usuario verificado → Acceso completo con advertencias

---

## 💰 Modelo de Negocio (Futuro)

### Monetización Propuesta

1. **Freemium Model**
   - Free: Anuncios, límite de uploads
   - Premium: Sin anuncios, uploads ilimitados, badges especiales

2. **Creator Economy**
   - Tips/Donaciones a creadores
   - Suscripciones a creadores específicos
   - Revenue sharing (70/30)

3. **Advertising**
   - Pre-roll ads (usuarios free)
   - Banner ads (no intrusivos)

---

## 📱 Consideraciones Mobile-First

### Optimizaciones

1. **Video Adaptativo**
   - ABR (Adaptive Bitrate Streaming) con HLS
   - Preload siguiente video en background
   - Lazy load de thumbnails

2. **UI/UX**
   - Swipe gestures nativo
   - Virtual scrolling para feed infinito
   - Skeleton loaders durante carga

3. **Performance**
   - Code splitting por rutas
   - Image optimization (WebP, AVIF)
   - Service Worker para offline básico

---

## 📈 Roadmap Técnico

### Fase 1 - MVP (3 meses)
- ✅ Arquitectura base
- ✅ Sistema de autenticación
- ✅ Upload y procesamiento de video
- ✅ Feed básico
- ✅ Interacciones (like, comentar)

### Fase 2 - Mejoras (3-6 meses)
- 🔄 Algoritmo de recomendaciones ML
- 🔄 Notificaciones push
- 🔄 Chat en vivo en videos
- 🔄 Sistema de reportes de contenido

### Fase 3 - Escala (6-12 meses)
- 🔄 Multi-región deployment
- 🔄 App móvil nativa (React Native)
- 🔄 Live streaming
- 🔄 Advanced analytics dashboard

---

## 🛡️ Compliance Legal (IMPORTANTE)

### Consideraciones para Contenido Adulto

1. **Age Verification**
   - Implementar sistema robusto (no solo checkbox)
   - Considerar verificación por ID (futuro)
   - Logs de verificación para compliance

2. **Content Moderation**
   - Sistema de reportes de usuarios
   - Equipo de moderación manual
   - AI para detección de contenido ilegal

3. **GDPR / Privacy**
   - Consentimiento explícito
   - Right to be forgotten
   - Data export functionality

4. **Terms of Service**
   - Claramente especificar contenido permitido
   - Política de copyright (DMCA)
   - Reglas de la comunidad

5. **Payment Processing**
   - Proveedores que acepten contenido adulto
   - Cumplir con 2257 (USA) si aplicable

---

## 📚 Recursos y Dependencias

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "multer": "^1.4.5",
  "ioredis": "^5.3.0",
  "zod": "^3.22.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "rate-limiter-flexible": "^3.0.0"
}
```

### Frontend Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "react-query": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "video.js": "^8.6.0",
  "zustand": "^4.4.0",
  "axios": "^1.6.0"
}
```

---

## 🎬 Conclusión

Esta arquitectura proporciona una base sólida para AnimeShorts, balanceando:
- **Escalabilidad**: Diseño stateless y horizontal scaling
- **Performance**: CDN, caching, y optimizaciones de video
- **Seguridad**: Autenticación robusta y verificación de edad
- **Compliance**: Consideraciones legales para contenido adulto
- **Developer Experience**: TypeScript, tooling moderno, y documentación

El MVP puede estar listo en **3 meses** con un equipo de 3-4 desarrolladores full-stack.
