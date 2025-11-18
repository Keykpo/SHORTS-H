# 🗄️ Diseño de Base de Datos - AnimeShorts

Documentación completa del esquema de base de datos PostgreSQL para la plataforma AnimeShorts.

## 📊 Diagrama Entidad-Relación

```
┌─────────────────┐         ┌─────────────────┐
│     users       │◄────────│     videos      │
│─────────────────│  1    N │─────────────────│
│ id (PK)         │         │ id (PK)         │
│ username        │         │ user_id (FK)    │
│ email           │         │ title           │
│ password_hash   │         │ description     │
│ birth_date      │         │ video_url       │
│ is_age_verified │         │ thumbnail_url   │
│ is_premium      │         │ is_nsfw         │
│ created_at      │         │ nsfw_level      │
└─────────────────┘         │ views_count     │
         ▲                  │ likes_count     │
         │                  │ status          │
         │                  └─────────────────┘
         │                           ▲
         │                           │
         │                  ┌────────┴────────┐
         │                  │                 │
┌────────┴────────┐  ┌─────┴──────────┐ ┌───┴────────────┐
│   comments      │  │ interactions   │ │  video_tags    │
│─────────────────│  │────────────────│ │────────────────│
│ id (PK)         │  │ id (PK)        │ │ id (PK)        │
│ user_id (FK)    │  │ user_id (FK)   │ │ video_id (FK)  │
│ video_id (FK)   │  │ video_id (FK)  │ │ tag_id (FK)    │
│ content         │  │ type           │ └────────────────┘
│ created_at      │  │ created_at     │          │
└─────────────────┘  └────────────────┘          │
                                                  ▼
                                          ┌─────────────┐
                                          │    tags     │
                                          │─────────────│
                                          │ id (PK)     │
                                          │ name        │
                                          │ slug        │
                                          │ category    │
                                          │ is_nsfw     │
                                          └─────────────┘
```

## 📋 Tablas Principales

### 1. `users` - Usuarios

Almacena información de todos los usuarios registrados.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único del usuario |
| `username` | String(30) | UNIQUE, NOT NULL | Nombre de usuario |
| `email` | String(255) | UNIQUE, NOT NULL | Email del usuario |
| `password_hash` | String | NOT NULL | Contraseña hasheada (bcrypt) |
| `display_name` | String(50) | NULL | Nombre para mostrar |
| `bio` | String(500) | NULL | Biografía del usuario |
| `avatar_url` | String | NULL | URL del avatar |
| `banner_url` | String | NULL | URL del banner |
| `is_email_verified` | Boolean | DEFAULT false | Email verificado |
| `is_age_verified` | Boolean | DEFAULT false | Edad verificada (+18) |
| `birth_date` | Date | NULL | Fecha de nacimiento |
| `is_premium` | Boolean | DEFAULT false | Usuario premium |
| `is_active` | Boolean | DEFAULT true | Cuenta activa |
| `is_banned` | Boolean | DEFAULT false | Usuario baneado |
| `nsfw_filter_enabled` | Boolean | DEFAULT false | Filtro NSFW activado |
| `language` | String(5) | DEFAULT 'en' | Idioma preferido |
| `created_at` | DateTime | DEFAULT now() | Fecha de registro |
| `updated_at` | DateTime | AUTO | Última actualización |
| `last_login_at` | DateTime | NULL | Último login |

**Índices:**
- `username` (UNIQUE)
- `email` (UNIQUE)
- `created_at` (DESC)

**Validaciones de Negocio:**
- Username: 3-30 caracteres, solo alfanuméricos y guión bajo
- Email: Formato válido
- Password: Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
- Edad: Debe tener al menos 18 años para `is_age_verified = true`

---

### 2. `videos` - Videos

Almacena todos los videos subidos a la plataforma.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único del video |
| `user_id` | String | FK, NOT NULL | ID del creador |
| `title` | String(200) | NOT NULL | Título del video |
| `description` | String(5000) | NULL | Descripción |
| `video_url` | String | NOT NULL | URL del video original |
| `thumbnail_url` | String | NOT NULL | URL del thumbnail |
| `video_1080p_url` | String | NULL | URL versión 1080p |
| `video_720p_url` | String | NULL | URL versión 720p |
| `video_480p_url` | String | NULL | URL versión 480p |
| `duration` | Integer | NOT NULL | Duración en segundos |
| `width` | Integer | NULL | Ancho del video |
| `height` | Integer | NULL | Alto del video |
| `file_size` | BigInt | NULL | Tamaño en bytes |
| `is_nsfw` | Boolean | DEFAULT true | Contenido NSFW |
| `nsfw_level` | Enum | DEFAULT MODERATE | Nivel NSFW |
| `content_warnings` | String[] | DEFAULT [] | Advertencias de contenido |
| `status` | Enum | DEFAULT PROCESSING | Estado del video |
| `is_public` | Boolean | DEFAULT true | Video público |
| `allow_comments` | Boolean | DEFAULT true | Comentarios permitidos |
| `views_count` | Integer | DEFAULT 0 | Contador de vistas |
| `likes_count` | Integer | DEFAULT 0 | Contador de likes |
| `dislikes_count` | Integer | DEFAULT 0 | Contador de dislikes |
| `comments_count` | Integer | DEFAULT 0 | Contador de comentarios |
| `shares_count` | Integer | DEFAULT 0 | Contador de compartidos |
| `created_at` | DateTime | DEFAULT now() | Fecha de creación |
| `updated_at` | DateTime | AUTO | Última actualización |
| `published_at` | DateTime | NULL | Fecha de publicación |

**Enums:**

`NsfwLevel`:
- `SOFT`: Contenido sugestivo (ecchi)
- `MODERATE`: Desnudez parcial, temas sexuales
- `EXPLICIT`: Contenido sexual explícito (hentai)

`VideoStatus`:
- `UPLOADING`: Subiendo archivo
- `PROCESSING`: Procesando/transcodificando
- `READY`: Listo para visualización
- `FAILED`: Error en procesamiento
- `DELETED`: Marcado como eliminado

**Índices:**
- `user_id`
- `status`
- `is_nsfw`
- `created_at` (DESC)
- `views_count` (DESC)
- `likes_count` (DESC)
- Índice compuesto: `(user_id, created_at)`

**Relaciones:**
- Pertenece a `users` (user_id)
- Tiene muchos `comments`
- Tiene muchos `interactions`
- Tiene muchos `video_tags`

---

### 3. `tags` - Etiquetas

Sistema de etiquetado para categorización de videos.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único del tag |
| `name` | String(50) | UNIQUE, NOT NULL | Nombre del tag |
| `slug` | String(50) | UNIQUE, NOT NULL | Slug para URLs |
| `category` | Enum | NOT NULL | Categoría del tag |
| `description` | String(500) | NULL | Descripción |
| `is_nsfw` | Boolean | DEFAULT false | Tag NSFW |
| `is_official` | Boolean | DEFAULT false | Tag oficial/verificado |
| `usage_count` | Integer | DEFAULT 0 | Veces usado |
| `created_at` | DateTime | DEFAULT now() | Fecha de creación |

**Enums:**

`TagCategory`:
- `GENRE`: Género (hentai, yaoi, yuri, ecchi, etc.)
- `CHARACTER`: Personajes (waifu, husbando, loli, etc.)
- `STYLE`: Estilo visual (2D, 3D, animated, etc.)
- `THEME`: Temática (school, fantasy, sci-fi, etc.)
- `CONTENT`: Contenido (censored, uncensored, etc.)

**Índices:**
- `name` (UNIQUE)
- `slug` (UNIQUE)
- `category`
- `usage_count` (DESC)

**Ejemplos de Tags:**
- Género: `hentai`, `yaoi`, `yuri`, `ecchi`, `futanari`
- Personajes: `waifu`, `loli`, `milf`, `trap`
- Estilo: `2d`, `3d`, `animated`, `manga`
- Tema: `school`, `fantasy`, `tentacles`, `vanilla`
- Contenido: `censored`, `uncensored`, `english-sub`

---

### 4. `video_tags` - Relación Video-Tag

Tabla de unión many-to-many entre videos y tags.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único |
| `video_id` | String | FK, NOT NULL | ID del video |
| `tag_id` | String | FK, NOT NULL | ID del tag |
| `added_at` | DateTime | DEFAULT now() | Cuándo se agregó |

**Constraints:**
- UNIQUE (`video_id`, `tag_id`)

**Índices:**
- `video_id`
- `tag_id`

---

### 5. `interactions` - Interacciones de Usuario

Almacena todas las interacciones de usuarios con videos.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único |
| `user_id` | String | FK, NOT NULL | ID del usuario |
| `video_id` | String | FK, NOT NULL | ID del video |
| `type` | Enum | NOT NULL | Tipo de interacción |
| `watch_duration` | Integer | NULL | Segundos vistos |
| `created_at` | DateTime | DEFAULT now() | Fecha de interacción |
| `updated_at` | DateTime | AUTO | Última actualización |

**Enums:**

`InteractionType`:
- `VIEW`: Vista del video
- `LIKE`: Like
- `DISLIKE`: Dislike
- `FAVORITE`: Favorito
- `SHARE`: Compartido
- `WATCH_LATER`: Ver más tarde

**Constraints:**
- UNIQUE (`user_id`, `video_id`, `type`)

**Índices:**
- `user_id`
- `video_id`
- `type`
- `created_at`

**Uso:**
- Un usuario solo puede dar 1 like por video
- VIEW se actualiza con `watch_duration` cada vez que ve el video
- Se usa para generar recomendaciones

---

### 6. `comments` - Comentarios

Sistema de comentarios con soporte para replies anidados.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único |
| `user_id` | String | FK, NOT NULL | ID del usuario |
| `video_id` | String | FK, NOT NULL | ID del video |
| `parent_id` | String | FK, NULL | ID del comentario padre |
| `content` | String(2000) | NOT NULL | Contenido del comentario |
| `likes_count` | Integer | DEFAULT 0 | Likes del comentario |
| `is_edited` | Boolean | DEFAULT false | Comentario editado |
| `is_deleted` | Boolean | DEFAULT false | Comentario eliminado |
| `is_pinned` | Boolean | DEFAULT false | Comentario fijado |
| `created_at` | DateTime | DEFAULT now() | Fecha de creación |
| `updated_at` | DateTime | AUTO | Última actualización |

**Índices:**
- `user_id`
- `video_id`
- `parent_id`
- `created_at` (DESC)

**Estructura de Replies:**
```
Comment (parent_id = null)
  └─ Reply 1 (parent_id = comment.id)
  └─ Reply 2 (parent_id = comment.id)
      └─ Reply to Reply (parent_id = reply2.id)
```

---

### 7. `follows` - Sistema de Seguidores

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único |
| `follower_id` | String | FK, NOT NULL | Usuario que sigue |
| `following_id` | String | FK, NOT NULL | Usuario seguido |
| `created_at` | DateTime | DEFAULT now() | Fecha de follow |

**Constraints:**
- UNIQUE (`follower_id`, `following_id`)

**Índices:**
- `follower_id`
- `following_id`

---

### 8. `reports` - Reportes de Contenido

Sistema de moderación y reportes.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único |
| `reporter_id` | String | FK, NOT NULL | Usuario que reporta |
| `video_id` | String | FK, NULL | Video reportado |
| `reason` | Enum | NOT NULL | Razón del reporte |
| `description` | String(1000) | NULL | Descripción detallada |
| `status` | Enum | DEFAULT PENDING | Estado del reporte |
| `reviewed_by` | String | NULL | ID del moderador |
| `review_note` | String(1000) | NULL | Notas de revisión |
| `created_at` | DateTime | DEFAULT now() | Fecha de reporte |
| `reviewed_at` | DateTime | NULL | Fecha de revisión |

**Enums:**

`ReportReason`:
- `ILLEGAL_CONTENT`: Contenido ilegal
- `UNDERAGE_CONTENT`: Contenido con menores
- `SPAM`: Spam
- `HARASSMENT`: Acoso
- `COPYRIGHT`: Violación de copyright
- `MISLEADING`: Contenido engañoso
- `OTHER`: Otro

`ReportStatus`:
- `PENDING`: Pendiente
- `REVIEWING`: En revisión
- `RESOLVED`: Resuelto
- `DISMISSED`: Descartado

---

### 9. `notifications` - Notificaciones

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único |
| `user_id` | String | FK, NOT NULL | Usuario receptor |
| `type` | Enum | NOT NULL | Tipo de notificación |
| `title` | String(200) | NOT NULL | Título |
| `message` | String(500) | NOT NULL | Mensaje |
| `action_url` | String | NULL | URL de acción |
| `image_url` | String | NULL | Imagen asociada |
| `is_read` | Boolean | DEFAULT false | Notificación leída |
| `created_at` | DateTime | DEFAULT now() | Fecha de creación |
| `read_at` | DateTime | NULL | Fecha de lectura |

**Enums:**

`NotificationType`:
- `NEW_FOLLOWER`: Nuevo seguidor
- `NEW_COMMENT`: Nuevo comentario
- `COMMENT_REPLY`: Respuesta a comentario
- `VIDEO_LIKE`: Like en video
- `VIDEO_PROCESSED`: Video procesado
- `SYSTEM_ALERT`: Alerta del sistema

---

### 10. `sessions` - Sesiones JWT

Almacena sesiones activas de usuarios.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único |
| `user_id` | String | FK, NOT NULL | ID del usuario |
| `token` | String(500) | UNIQUE, NOT NULL | Access token |
| `refresh_token` | String(500) | UNIQUE, NULL | Refresh token |
| `user_agent` | String(500) | NULL | User agent del cliente |
| `ip_address` | String(45) | NULL | IP del cliente |
| `created_at` | DateTime | DEFAULT now() | Creación de sesión |
| `expires_at` | DateTime | NOT NULL | Expiración |
| `last_used_at` | DateTime | DEFAULT now() | Último uso |

**Índices:**
- `user_id`
- `token` (UNIQUE)
- `expires_at`

**Limpieza automática:**
- Eliminar sesiones expiradas periódicamente
- Limitar a N sesiones activas por usuario

---

### 11. `video_views` - Analytics de Vistas (Opcional)

Tabla para analytics detallado de vistas.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | String (cuid) | PK | ID único |
| `video_id` | String | NOT NULL | ID del video |
| `user_id` | String | NULL | ID del usuario (null = anónimo) |
| `watch_duration` | Integer | NOT NULL | Segundos vistos |
| `completion_rate` | Float | NOT NULL | % completado |
| `referrer` | String(500) | NULL | Origen de la visita |
| `device` | String(50) | NULL | Tipo de dispositivo |
| `created_at` | DateTime | DEFAULT now() | Fecha de vista |

**Índices:**
- `video_id`
- `user_id`
- `created_at`

---

## 🔍 Queries Comunes

### 1. Obtener Feed de Videos

```sql
SELECT v.*, u.username, u.avatar_url,
       COUNT(DISTINCT vt.id) as tag_count,
       COUNT(DISTINCT c.id) as comment_count
FROM videos v
INNER JOIN users u ON v.user_id = u.id
LEFT JOIN video_tags vt ON v.id = vt.video_id
LEFT JOIN comments c ON v.id = c.video_id
WHERE v.status = 'READY' AND v.is_public = true
  AND (v.is_nsfw = false OR $isAgeVerified = true)
GROUP BY v.id, u.username, u.avatar_url
ORDER BY v.created_at DESC
LIMIT 20 OFFSET 0;
```

### 2. Obtener Videos Recomendados para Usuario

```sql
WITH user_preferences AS (
  SELECT tag_id, COUNT(*) as tag_frequency
  FROM video_tags vt
  INNER JOIN interactions i ON vt.video_id = i.video_id
  WHERE i.user_id = $userId AND i.type = 'VIEW'
  GROUP BY tag_id
  ORDER BY tag_frequency DESC
  LIMIT 10
)
SELECT DISTINCT v.*
FROM videos v
INNER JOIN video_tags vt ON v.id = vt.video_id
INNER JOIN user_preferences up ON vt.tag_id = up.tag_id
WHERE v.status = 'READY'
  AND v.id NOT IN (
    SELECT video_id FROM interactions
    WHERE user_id = $userId AND type = 'VIEW'
  )
ORDER BY v.views_count DESC
LIMIT 20;
```

### 3. Obtener Estadísticas de Usuario

```sql
SELECT
  u.*,
  COUNT(DISTINCT v.id) as videos_count,
  COUNT(DISTINCT f1.id) as followers_count,
  COUNT(DISTINCT f2.id) as following_count,
  SUM(v.views_count) as total_views,
  SUM(v.likes_count) as total_likes
FROM users u
LEFT JOIN videos v ON u.id = v.user_id AND v.status = 'READY'
LEFT JOIN follows f1 ON u.id = f1.following_id
LEFT JOIN follows f2 ON u.id = f2.follower_id
WHERE u.id = $userId
GROUP BY u.id;
```

---

## 🔧 Optimizaciones

### Índices Recomendados

```sql
-- Videos más populares
CREATE INDEX idx_videos_popular ON videos(likes_count DESC, views_count DESC);

-- Feed temporal
CREATE INDEX idx_videos_feed ON videos(status, is_public, created_at DESC);

-- Búsqueda de usuarios
CREATE INDEX idx_users_search ON users(username, display_name);

-- Analytics de interacciones
CREATE INDEX idx_interactions_analytics ON interactions(type, created_at);
```

### Particionamiento (Escala Grande)

Para >10M de videos, considerar particionar `videos` por fecha:

```sql
-- Particionar por mes de creación
CREATE TABLE videos_2024_01 PARTITION OF videos
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Desnormalización para Performance

Contadores ya desnormalizados en `videos`:
- `views_count`
- `likes_count`
- `comments_count`

Actualizar con triggers o batch jobs.

---

## 📊 Estimación de Almacenamiento

Estimación para 1M de usuarios y 10M de videos:

| Tabla | Filas | Tamaño/Fila | Total |
|-------|-------|-------------|-------|
| users | 1M | ~2 KB | ~2 GB |
| videos | 10M | ~1 KB | ~10 GB |
| tags | 10K | ~500 B | ~5 MB |
| video_tags | 50M | ~100 B | ~5 GB |
| interactions | 500M | ~150 B | ~75 GB |
| comments | 100M | ~500 B | ~50 GB |
| sessions | 100K | ~300 B | ~30 MB |

**Total estimado: ~142 GB**

---

## 🛡️ Security Best Practices

1. **Passwords**: NUNCA almacenar en texto plano, siempre hasheados
2. **PII**: Encriptar datos sensibles (email, IP)
3. **Soft Delete**: Usar flags en vez de DELETE para cumplir GDPR
4. **Audit Logs**: Registrar cambios críticos
5. **Backups**: Backups diarios + replicación

---

**Base de datos diseñada para escalar hasta 100M+ videos y 10M+ usuarios**
