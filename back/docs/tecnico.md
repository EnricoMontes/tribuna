# Tribuna API · Documentación técnica

> Cómo está construido el back. Para qué hace cada cosa desde el punto de vista del usuario, ver [funcional.md](funcional.md).

## Stack

| Pieza | Uso |
|---|---|
| **NestJS 12** (TypeScript, ESM) | Framework del servidor: módulos, controllers, services e inyección de dependencias |
| **MongoDB Atlas** + **Mongoose 9** (`@nestjs/mongoose`) | Base de datos NoSQL en la nube y modelado con schemas |
| **class-validator** + `ValidationPipe` | Validación de los DTOs → `400` automático |
| **bcrypt** | Hash de contraseñas (10 rondas de salt) |
| **Multer** (`FileInterceptor`) + **Cloudinary** | Recepción del archivo y guardado de la imagen; en la base va solo la URL |
| **@nestjs/config** | Lectura del `.env` |
| Vitest + oxlint | Tests y lint |

## Arquitectura

```
Angular (Vercel) ──HTTP/JSON o multipart──▶ NestJS (Render) ──Mongoose──▶ MongoDB Atlas
                                                  │
                                                  └──upload_stream──▶ Cloudinary (devuelve la URL)
```

Cada petición sigue este recorrido:
1. **CORS**: solo se aceptan los orígenes de `FRONT_URL`.
2. **ValidationPipe**: valida el body contra el DTO.
3. **Controller**: recibe la petición y delega.
4. **Service**: aplica la lógica de negocio.
5. **Modelo de Mongoose**: guarda o lee en la base.

Si algo falla, el service tira una excepción de Nest (`ConflictException`, `UnauthorizedException`, etc.) y Nest la convierte en el status correcto.

### Módulos

| Módulo | Contenido | Relación |
|---|---|---|
| `AppModule` | `ConfigModule.forRoot({ isGlobal: true })` + `MongooseModule.forRootAsync` (lee `MONGO_URI`) | Importa a todos |
| `AuthModule` | `AuthController` y `AuthService` (registro y login) | Importa `UsuariosModule` y `ArchivosModule`. **No toca la base directo** |
| `UsuariosModule` | Schema `Usuario`, `UsuariosService` y `GET /usuarios/disponibilidad` | **Exporta** `UsuariosService` |
| `ArchivosModule` | `ArchivosService` (Cloudinary) y las opciones de Multer | Exporta `ArchivosService`; se reutiliza en el Sprint 2 |
| `PublicacionesModule` | Creado vacío | Se completa en el Sprint 2 |

## Endpoints (Sprint 1)

| Método | Ruta | Body | Respuestas |
|---|---|---|---|
| `GET` | `/` | — | `200` `{ estado: 'ok', api: 'Tribuna' }` |
| `POST` | `/auth/registro` | `multipart/form-data`: `nombre`, `apellido`, `correo`, `nombreUsuario`, `password`, `fechaNacimiento` (yyyy-mm-dd), `descripcion?`, archivo `fotoPerfil?` | `201` usuario · `400` · `409` · `413` |
| `POST` | `/auth/login` | JSON `{ identificador, password }` (identificador = correo **o** usuario) | `200` usuario · `400` · `401` |
| `GET` | `/usuarios/disponibilidad?campo=correo\|nombreUsuario&valor=...` | — | `200` `{ disponible }` · `400` |

Hay una colección de Postman con todos los casos en [`postman/Tribuna.postman_collection.json`](../postman/Tribuna.postman_collection.json).

## Modelo de datos: `usuarios`

| Campo | Tipo | Detalle |
|---|---|---|
| `nombre`, `apellido` | String | `required`, `trim` |
| `correo` | String | `required`, **`unique`**, `lowercase` |
| `nombreUsuario` | String | `required`, **`unique`**, `lowercase` |
| `password` | String | Hash bcrypt. **`select: false`**, y además `toJSON` la borra |
| `fechaNacimiento` | Date | `required` |
| `descripcion` | String | Default `''` |
| `fotoPerfil` | String \| null | URL de Cloudinary |
| `perfil` | `'usuario'` \| `'administrador'` | `enum`, default `'usuario'` |
| `createdAt`, `updatedAt` | Date | `timestamps: true` |

## Estructura

```
src/
├── main.ts                 CORS (FRONT_URL), ValidationPipe global, DNS_SERVERS opcional, puerto
├── app.module.ts           ConfigModule + conexión a Mongo + módulos
├── auth/
│   ├── auth.controller.ts  POST /auth/registro (FileInterceptor) · POST /auth/login (@HttpCode 200)
│   ├── auth.service.ts     edad mínima, unicidad (409), subir foto, bcrypt.hash/compare, error 11000
│   └── dto/                registro.dto.ts · login.dto.ts
├── usuarios/
│   ├── entities/usuario.entity.ts
│   ├── dto/disponibilidad.dto.ts
│   ├── usuarios.service.ts
│   └── usuarios.controller.ts
├── archivos/
│   ├── archivos.service.ts upload_stream a Cloudinary
│   └── imagen.filtro.ts    memoryStorage, límite de 2 MB, solo jpg/png/webp
└── publicaciones/          (Sprint 2)
```

## Decisiones técnicas

- **Separación de responsabilidades.**
  - El controller solo recibe y responde; la lógica está en los services.
  - `AuthService` usa `UsuariosService` (inyección de dependencias) en lugar de acceder al modelo directo.
- **Validación en dos capas.**
  - **DTO**: `ValidationPipe` global con `whitelist` + `forbidNonWhitelisted`. Si alguien manda `perfil: "administrador"`, recibe `400`.
    - Usa `transform` y `stopAtFirstError`, así hay un mensaje por campo.
  - **Schema**: `required`, `unique` y `enum`.
  - Las reglas que un DTO no puede chequear solo (la edad mínima y que la fecha no sea futura) están en `AuthService`.
- **Contraseñas con bcrypt.**
  - `hash(password, 10)` genera un salt aleatorio. El hash no se puede revertir.
  - En el login, `bcrypt.compare` hashea la contraseña recibida con el salt guardado y compara.
- **Status HTTP correctos.**
  - `201` en el registro (es el default de `@Post`). `200` en el login con `@HttpCode(HttpStatus.OK)`, porque no crea un recurso.
  - `409` por duplicado. Además se captura el error `11000` del índice único, por si llegan dos registros simultáneos.
  - Mismo `401` para "no existe" y "contraseña incorrecta".
- **Imágenes.**
  - Multer con `memoryStorage` deja el archivo en un buffer y `upload_stream` lo manda a Cloudinary sin guardarlo en disco.
  - La foto se sube **después** de validar los datos, para no dejar imágenes huérfanas.
- **Configuración.**
  - Las credenciales están en `.env`, que está en el `.gitignore`; ver `.env.example`.
  - `MongooseModule.forRootAsync` espera a que `ConfigService` haya cargado el `.env` antes de conectar.
- **CORS.** El front vive en otro dominio (Vercel). Sin `enableCors`, el navegador bloquea las respuestas.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `PORT` | Puerto (Render lo define solo) |
| `MONGO_URI` | Cadena de conexión de Atlas (`.../tribuna?...`: `tribuna` es el nombre de la base) |
| `FRONT_URL` | Orígenes permitidos por CORS, separados por coma, sin `/` final |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Credenciales de Cloudinary |
| `DNS_SERVERS` | Opcional, solo si Atlas tira `querySrv ECONNREFUSED` |

## Deploy en Render

1. New → **Web Service** → conectar el repo `tribuna` (rama `main`, con auto-deploy en cada push).
2. Configurar el servicio:
   - **Root Directory: `back`** (el repo es un monorepo: Render solo mira esta carpeta y solo redeploya si cambia algo acá)
   - Build: `npm install && npm run build`
   - Start: `npm run start:prod`
3. Environment: `MONGO_URI`, `FRONT_URL`, las 3 de Cloudinary y `NODE_VERSION=24.16.0`.
4. En MongoDB Atlas → Network Access → `0.0.0.0/0`, porque Render no tiene IP fija.

> El plan gratis "duerme" el servicio sin uso: la primera petición tarda unos 50 segundos.
