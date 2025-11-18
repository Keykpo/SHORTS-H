# AnimeShorts Backend API

API backend para la plataforma AnimeShorts, construida con Express.js, TypeScript y Prisma.

## 🚀 Quick Start

### Prerequisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Instalación

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Setup de la base de datos**
```bash
# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Seed con datos de prueba
npm run prisma:seed
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

El servidor estará corriendo en http://localhost:5000

## 📁 Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma       # Schema de la base de datos
│   ├── migrations/         # Migraciones
│   └── seed.ts            # Datos de prueba
│
├── src/
│   ├── config/            # Configuración
│   │   ├── index.ts       # Config general
│   │   ├── database.ts    # Prisma client
│   │   └── redis.ts       # Redis client
│   │
│   ├── controllers/       # Controladores
│   │   ├── auth.controller.ts
│   │   └── video.controller.ts
│   │
│   ├── middlewares/       # Middlewares
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── routes/           # Rutas
│   │   ├── auth.routes.ts
│   │   ├── video.routes.ts
│   │   └── index.ts
│   │
│   ├── services/         # Lógica de negocio
│   │   ├── auth.service.ts
│   │   └── video.service.ts
│   │
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   │
│   └── server.ts         # Entry point
│
├── .env.example          # Ejemplo de variables de entorno
├── tsconfig.json         # Config de TypeScript
└── package.json
```

## 🗄️ Database Schema

### Modelos Principales

- **User**: Usuarios de la plataforma
- **Video**: Videos subidos
- **Tag**: Tags para categorización
- **VideoTag**: Relación many-to-many entre videos y tags
- **Interaction**: Likes, favorites, views
- **Comment**: Comentarios en videos
- **Follow**: Sistema de followers
- **Report**: Reportes de contenido
- **Notification**: Notificaciones
- **Session**: Sesiones JWT

Ver `prisma/schema.prisma` para el schema completo.

## 🔌 API Endpoints

### Authentication

#### POST `/api/auth/register`
Registrar nuevo usuario

**Body:**
```json
{
  "username": "usuario123",
  "email": "user@example.com",
  "password": "Password123!",
  "birthDate": "1995-05-15",
  "agreedToTerms": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "cuid...",
      "username": "usuario123",
      "email": "user@example.com",
      "isAgeVerified": true,
      "isPremium": false
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### POST `/api/auth/login`
Login de usuario

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### POST `/api/auth/refresh`
Renovar access token

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

#### POST `/api/auth/logout`
Logout (requiere autenticación)

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/api/auth/profile`
Obtener perfil del usuario actual

**Headers:**
```
Authorization: Bearer <access_token>
```

### Videos

#### GET `/api/videos/feed`
Obtener feed de videos

**Query Params:**
- `page`: número de página (default: 1)
- `limit`: videos por página (default: 20, max: 100)
- `tags`: filtrar por tags (separados por coma)
- `nsfwOnly`: solo NSFW (true/false)
- `sortBy`: `recent`, `popular`, `trending`

**Response:**
```json
{
  "success": true,
  "data": {
    "videos": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

#### GET `/api/videos/:id`
Obtener video por ID

#### POST `/api/videos/upload`
Subir nuevo video (requiere autenticación + age verification)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "title": "Mi Video",
  "description": "Descripción del video",
  "isNsfw": true,
  "nsfwLevel": "MODERATE",
  "tags": ["hentai", "ecchi", "romance"],
  "contentWarnings": ["sexual_content"]
}
```

#### POST `/api/videos/:id/view`
Registrar vista de video

**Body:**
```json
{
  "watchDuration": 30
}
```

#### POST `/api/videos/:id/like`
Toggle like en video (requiere autenticación)

#### GET `/api/videos/user/:userId`
Obtener videos de un usuario

**Query Params:**
- `page`: número de página
- `limit`: videos por página

## 🔐 Authentication

La API usa JWT (JSON Web Tokens) para autenticación.

### Flow de Autenticación

1. Usuario se registra o hace login
2. API retorna `accessToken` (15 min) y `refreshToken` (7 días)
3. Cliente incluye `accessToken` en header `Authorization: Bearer <token>`
4. Cuando `accessToken` expira, usar `refreshToken` para obtener uno nuevo

### Middlewares de Autenticación

- `authenticate`: Requiere token válido
- `optionalAuth`: Token opcional, agrega user si existe
- `requireAgeVerification`: Requiere que el usuario tenga edad verificada
- `requirePremium`: Requiere suscripción premium

## 🛡️ Security Features

### Input Validation

Todos los endpoints usan Zod para validación de inputs:

```typescript
import { validate, schemas } from './middlewares/validation.middleware';

router.post('/register', validate(schemas.register), AuthController.register);
```

### Rate Limiting

Configurado en `server.ts`:
- 100 requests por 15 minutos por IP
- Configurable via `RATE_LIMIT_MAX_REQUESTS` y `RATE_LIMIT_WINDOW_MS`

### Password Hashing

- bcrypt con 12 rounds
- Configurable via `BCRYPT_ROUNDS`

### CORS

Configurado para aceptar solo requests del frontend:
- Configurable via `FRONTEND_URL`

### Helmet.js

Headers de seguridad HTTP automáticos.

## 📊 Database Operations

### Migraciones

```bash
# Crear nueva migración
npm run prisma:migrate

# Resetear base de datos (¡cuidado!)
npx prisma migrate reset

# Aplicar migraciones (producción)
npx prisma migrate deploy
```

### Prisma Studio

Explorar la base de datos visualmente:

```bash
npm run prisma:studio
```

Abre en http://localhost:5555

### Seed Database

```bash
npm run prisma:seed
```

Crea usuarios y videos de prueba.

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📝 Logging

Los logs se manejan con Morgan:
- Desarrollo: formato `dev`
- Producción: formato `combined`

## 🚀 Deployment

### Build

```bash
npm run build
```

Genera código compilado en `/dist`

### Production Start

```bash
npm start
```

### Variables de Entorno Críticas

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="cambiar-en-produccion"
JWT_REFRESH_SECRET="cambiar-en-produccion"
FRONTEND_URL="https://tu-dominio.com"
```

### Docker

```bash
# Build
docker build -t animeshorts-backend .

# Run
docker run -p 5000:5000 --env-file .env animeshorts-backend
```

## 🔧 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
npm run prisma:generate
```

### Error de conexión a PostgreSQL

Verificar:
1. PostgreSQL está corriendo
2. `DATABASE_URL` es correcta
3. Database existe y usuario tiene permisos

### Error de conexión a Redis

Verificar:
1. Redis está corriendo: `redis-cli ping`
2. `REDIS_URL` es correcta

### JWT Token Expired

Normal después de 15 minutos. Usar el refresh token endpoint:
```bash
POST /api/auth/refresh
```

## 📚 Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Documentation](https://zod.dev)

## 🤝 Contributing

Ver el README principal del proyecto.

---

**Made with ❤️ using TypeScript and Express**
