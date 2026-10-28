# Tribuna · API (back)

API REST de **Tribuna**, la red social futbolera del TP #2 de Programación IV (UTN FRA, 2026 C2).
El front en Angular está en el repo `tribuna-front`.

| | |
|---|---|
| Stack | NestJS 12 · MongoDB Atlas + Mongoose 9 · bcrypt · Multer + Cloudinary · class-validator |
| Deploy | Render (Web Service) |
| Estado | **Sprint 1** — registro y login |

## Cómo correrlo

```bash
npm install
cp .env.example .env      # completar MONGO_URI y las credenciales de Cloudinary
npm run start:dev         # http://localhost:3000
```

Otros scripts: `npm run build` · `npm run start:prod` · `npm test` · `npm run lint` · `npm run format`.

### Variables de entorno

| Variable | Para qué |
|---|---|
| `PORT` | Puerto (Render lo define solo) |
| `MONGO_URI` | Cadena de conexión de MongoDB Atlas (`.../tribuna?...` = nombre de la base) |
| `FRONT_URL` | Orígenes permitidos por CORS, separados por coma (`http://localhost:4200,https://tribuna.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Para guardar las fotos |
| `DNS_SERVERS` | Opcional. Solo si Atlas tira `querySrv ECONNREFUSED` |

## Endpoints (Sprint 1)

| Método | Ruta | Body | Respuestas |
|---|---|---|---|
| `GET` | `/` | — | `200` estado de la API |
| `POST` | `/auth/registro` | `multipart/form-data`: `nombre`, `apellido`, `correo`, `nombreUsuario`, `password`, `fechaNacimiento` (yyyy-mm-dd), `descripcion?`, archivo `fotoPerfil?` | `201` usuario creado · `400` datos inválidos / imagen no permitida / menor de 13 · `409` correo o usuario en uso · `413` imagen > 2 MB |
| `POST` | `/auth/login` | JSON `{ identificador, password }` (identificador = correo **o** nombre de usuario) | `200` datos del usuario · `400` faltan datos · `401` usuario o contraseña incorrectos |
| `GET` | `/usuarios/disponibilidad?campo=correo\|nombreUsuario&valor=...` | — | `200` `{ disponible: boolean }` · `400` campo inválido |

Las respuestas **nunca** incluyen la contraseña.

## Estructura

```
src/
├── main.ts                 CORS, ValidationPipe global, puerto
├── app.module.ts           ConfigModule (.env) + conexión a Mongo + módulos
├── auth/                   Módulo Autenticación
│   ├── auth.controller.ts  POST /auth/registro · POST /auth/login
│   ├── auth.service.ts     validar edad, unicidad, subir foto, hashear, comparar
│   └── dto/                registro.dto.ts · login.dto.ts (class-validator)
├── usuarios/               Módulo Usuarios
│   ├── entities/usuario.entity.ts   schema de Mongoose
│   ├── usuarios.service.ts          acceso a la colección (lo usa Auth)
│   └── usuarios.controller.ts       GET /usuarios/disponibilidad
├── publicaciones/          Módulo Publicaciones (creado; rutas en el sprint 2)
└── archivos/               Subida de imágenes a Cloudinary (reutilizable)
```

## Decisiones técnicas

- **Módulos separados por responsabilidad.** `AuthModule` no toca la base: usa `UsuariosService`, que `UsuariosModule` exporta.
- **Validación en dos capas.**
  - Los DTOs con `class-validator` + `ValidationPipe` global dan `400` automáticos.
    - `whitelist` + `forbidNonWhitelisted`: si alguien manda `perfil: "administrador"` en el registro, se rechaza. El perfil por defecto es `usuario`.
  - El schema de Mongoose suma `required`, `unique` y `enum`.
- **Contraseña.**
  - Se hashea con `bcrypt` (10 rondas, con salt aleatorio).
  - En el login, `bcrypt.compare` encripta la contraseña recibida con el mismo salt y compara.
  - En el schema tiene `select: false` y `toJSON` la borra, así que nunca sale en una respuesta.
- **Status HTTP correctos.**
  - `201` registro; `200` login (`@HttpCode`, porque no crea nada).
  - `400` validación; `401` credenciales; `409` duplicados (también se captura el error `11000` del índice único de Mongo); `413` archivo pesado.
  - Mismo mensaje para "usuario inexistente" y "contraseña incorrecta", para no darle pistas a un atacante.
- **Imágenes.**
  - `FileInterceptor` + `memoryStorage`: el archivo queda en memoria y se manda a Cloudinary con `upload_stream`. En la base se guarda solo la URL.
  - Se valida el tipo (jpg/png/webp) y el tamaño (2 MB).
  - La foto se sube **después** de validar los datos, para no dejar imágenes huérfanas.
- **Login** por correo **o** nombre de usuario. Los dos son únicos y se guardan en minúsculas.
- **Credenciales en `.env`**, que no se sube al repo; ver `.env.example`.

## Deploy en Render

1. New → **Web Service** → conectar este repo.
2. Configurar el servicio:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
3. Environment: cargar `MONGO_URI`, `FRONT_URL` (la URL de Vercel) y las 3 de Cloudinary.
4. En MongoDB Atlas → Network Access: permitir `0.0.0.0/0`, porque Render no tiene IP fija.

> El plan gratis de Render "duerme" el servicio sin uso: la primera petición tarda unos 30 s.
