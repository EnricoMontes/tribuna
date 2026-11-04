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
                                                  ├──upload_stream──▶ Cloudinary (devuelve la URL)
                                                  └──fetch + X-VER──▶ API de promiedos (cuadros y partidos)
```

Cada petición sigue este recorrido:
1. **CORS**: solo se aceptan los orígenes de `FRONT_URL`.
2. **AuthGuard** (en las rutas protegidas): lee el token del header `Authorization: Bearer ...`; si falta o venció → `401`.
3. **ValidationPipe**: valida el body o la query contra el DTO.
4. **Controller**: recibe la petición y delega.
5. **Service**: aplica la lógica de negocio.
6. **Modelo de Mongoose**: guarda o lee en la base.

Si algo falla, el service tira una excepción de Nest (`ConflictException`, `UnauthorizedException`, etc.) y Nest la convierte en el status correcto.

### Módulos

| Módulo | Contenido | Relación |
|---|---|---|
| `AppModule` | `ConfigModule.forRoot({ isGlobal: true })` + `MongooseModule.forRootAsync` (lee `MONGO_URI`) | Importa a todos |
| `AuthModule` | `AuthController`, `AuthService` (registro y login), `AuthGuard` y el decorador `@UsuarioActual()`. Registra `JwtModule` como **global** | Importa `UsuariosModule`, `ArchivosModule` y `CuadrosModule`. **No toca la base directo** |
| `UsuariosModule` | Schema `Usuario`, `UsuariosService` y `GET /usuarios/disponibilidad` | **Exporta** `UsuariosService` |
| `ArchivosModule` | `ArchivosService` (Cloudinary) y las opciones de Multer | Exporta `ArchivosService`; se reutiliza en el Sprint 2 |
| `PromiedosModule` | `PromiedosService`: consulta la API de promiedos (header `X-VER`) y cachea 10 min por liga | Lo usan `CuadrosModule` y `PartidosModule` |
| `CuadrosModule` | `GET /cuadros` + `CuadrosService` (con lista de respaldo) | Exporta `CuadrosService` (valida el cuadro del registro) |
| `PartidosModule` | `GET /partidos` + `PartidosService` (fecha actual de las dos ligas) | Exporta `PartidosService` (valida el partido de una publicación) |
| `PublicacionesModule` | Schema `Publicacion`, `PublicacionesService` y las rutas `/publicaciones` | Importa `ArchivosModule` y `PartidosModule` |

## Endpoints

| Método | Ruta | Body | Respuestas |
|---|---|---|---|
| `GET` | `/` | — | `200` `{ estado: 'ok', api: 'Tribuna' }` |
| `POST` | `/auth/registro` | `multipart/form-data`: `nombre`, `apellido`, `correo`, `nombreUsuario`, `password`, `fechaNacimiento` (yyyy-mm-dd), `descripcion?`, `cuadroId?` (id de promiedos), `numeroCamiseta?` (1 a 99), archivo `fotoPerfil?` | `201` `{ usuario, token }` · `400` · `409` · `413` |
| `POST` | `/auth/login` | JSON `{ identificador, password }` (identificador = correo **o** usuario) | `200` `{ usuario, token }` · `400` · `401` |
| `GET` | `/usuarios/disponibilidad?campo=correo\|nombreUsuario&valor=...` | — | `200` `{ disponible }` · `400` |
| `GET` | `/cuadros` | — | `200` `[{ nombre: 'Liga Profesional' \| 'Primera Nacional', cuadros: [{ id, nombre, escudo }] }]` |

**Con token** (`Authorization: Bearer <token>`; sin token o vencido → `401`):

| Método | Ruta | Body / query | Respuestas |
|---|---|---|---|
| `GET` | `/partidos` | — | `200` partidos de la fecha actual: `[{ id, liga, fecha, local, visitante, inicio, estado }]` |
| `POST` | `/publicaciones` | `multipart/form-data`: `titulo`, `mensaje`, `partidoId` + archivo `imagen?` | `201` publicación · `400` (datos o partido inválido) · `413` |
| `GET` | `/publicaciones` | `?orden=fecha\|meGusta&offset=0&limit=10&usuario=<id>&partido=<id>` | `200` `{ total, offset, limit, publicaciones }` · `400` |
| `DELETE` | `/publicaciones/:id` | — | `200` (baja lógica) · `400` (id mal formado) · `403` (no es autor ni admin) · `404` |
| `POST` | `/publicaciones/:id/me-gusta` | — | `201` `{ cantidadMeGusta, meGustaMio }` · `404` · `409` (ya lo había dado) |
| `DELETE` | `/publicaciones/:id/me-gusta` | — | `200` · `404` · `409` (no lo había dado) |

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
| `cuadro` | `{ id, nombre, escudo }` \| null | Opcional. Copia del cuadro elegido (así el perfil no depende de promiedos) |
| `numeroCamiseta` | Number \| null | Opcional, de 1 a 99 |
| `perfil` | `'usuario'` \| `'administrador'` | `enum`, default `'usuario'` |
| `createdAt`, `updatedAt` | Date | `timestamps: true` |

## Modelo de datos: `publicaciones`

| Campo | Tipo | Detalle |
|---|---|---|
| `titulo`, `mensaje` | String | `required`, `trim` (máx. 80 y 500 en el DTO) |
| `imagen` | String \| null | URL de Cloudinary (carpeta `tribuna/publicaciones`) |
| `autor` | ObjectId | `ref: 'Usuario'`. Al listar se hace `populate` con nombre, apellido, usuario, foto y cuadro |
| `partido` | Objeto | **Copia** del partido al publicar: `id`, `liga`, `fecha`, `local` y `visitante` (`id`, `nombre`, `escudo`), `inicio` |
| `meGusta` | ObjectId[] | Quiénes dieron me gusta (no se manda al front) |
| `cantidadMeGusta` | Number | Contador para poder ordenar por me gusta |
| `activa` | Boolean | Baja lógica: `false` = eliminada |
| `createdAt`, `updatedAt` | Date | `timestamps: true` |

La colección se llama `publicaciones` porque se indica en `@Schema({ collection })`. Si no, Mongoose pluraliza en inglés y la llamaría `publicacions`.

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
- **JWT (adelantado del Sprint 3, solo lo mínimo).**
  - `JwtModule.registerAsync({ global: true })` con el secreto de `JWT_SECRET` y `expiresIn: '15m'`.
  - Login y registro devuelven `{ usuario, token }`. El token lleva `sub` (el `_id`), `nombreUsuario` y `perfil`.
  - `AuthGuard` es manual, como el del profe: `extractToken` + `jwtService.verify`, y pone los datos en `request.usuario`. El decorador `@UsuarioActual()` los lee en el controller.
  - El autor de una publicación y quién da me gusta **salen del token**, nunca del body. Así nadie puede hacerse pasar por otro.
  - Quedan para el Sprint 3: `POST /auth/autorizar`, `POST /auth/refrescar`, la pantalla de carga y el modal de los 10 minutos.
- **Publicaciones.**
  - **Paginación** con `skip(offset)` y `limit(limit)`. El `countDocuments` se hace en paralelo (`Promise.all`) para devolver el `total`.
  - **Orden por me gusta**: Mongo no ordena por el largo de un array con un `sort` simple. Por eso existe el contador `cantidadMeGusta`, que se actualiza en la misma operación que agrega o saca el me gusta.
  - **Un me gusta por usuario**: `findOneAndUpdate({ _id, meGusta: { $ne: usuario } }, { $push, $inc: +1 })` es **atómico**. Si el usuario ya estaba, no actualiza nada y responde `409`. Para quitar es al revés, con `$pull` y `$inc: -1`.
  - **Baja lógica**: `activa: false`. Primero `404` si no existe y después `403` si no es el autor ni un administrador.
  - **Horarios:** promiedos devuelve el horario como texto (`"05-11-2026 15:00"`) en la zona horaria **de quien pregunta**, según su IP. Desde Argentina contesta en hora argentina, pero a Render (EE.UU.) le contesta en hora de allá. Por eso `PROMIEDOS_ZONA_HORARIA` dice en qué zona viene el texto, y `PartidosService` lo convierte a un instante exacto (`Date`, en UTC) con `Intl.DateTimeFormat`. El front lo muestra en la hora del navegador.
  - El **partido** se valida contra la fecha actual de promiedos y se guarda una **copia**: si la API cambia de fecha o se cae, la publicación sigue mostrando su partido.

### Cuadros desde la API de promiedos (`cuadros/`)
- `CuadrosService` consulta `https://api.promiedos.com.ar/league/tables_and_fixtures/{liga}` para la Liga Profesional (`hc`) y la Primera Nacional (`ebj`). Esa API no es pública: pide el header `X-VER` (la versión de su web).
- Un equipo aparece en varias tablas (Apertura, Clausura y grupos): se usa un `Map` por id para sacar los repetidos.
- **Caché en memoria de 24 h**: la lista casi no cambia, así que no se consulta en cada registro.
- **Respaldo:** si promiedos no responde (timeout de 5 s o error), se usa `cuadros.respaldo.ts`, una copia de la lista. El registro nunca se rompe por un servicio externo.
- El escudo es la URL `https://api.promiedos.com.ar/images/team/{id}/3`.
- En el registro, `AuthService` valida el `cuadroId` contra esa lista (si no existe → **400**) y guarda una copia de `{ id, nombre, escudo }` en el usuario.
- `numeroCamiseta` llega como texto (multipart): `@Type(() => Number)` de class-transformer lo convierte y `@IsInt`, `@Min(1)` y `@Max(99)` lo validan.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `PORT` | Puerto (Render lo define solo) |
| `MONGO_URI` | Cadena de conexión de Atlas (`.../tribuna?...`: `tribuna` es el nombre de la base) |
| `FRONT_URL` | Orígenes permitidos por CORS, separados por coma, sin `/` final |
| `PROMIEDOS_ZONA_HORARIA` | Opcional. Zona horaria en la que contesta promiedos, que la deduce por la IP del servidor. Por defecto es `America/Argentina/Buenos_Aires`; en Render, `America/New_York` |
| `JWT_SECRET` | Secreto para firmar los tokens. Texto largo y aleatorio (en Render: botón "Generate") |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Credenciales de Cloudinary |
| `DNS_SERVERS` | Opcional, solo si Atlas tira `querySrv ECONNREFUSED` |

## Deploy en Render

1. New → **Web Service** → conectar el repo `tribuna` (rama `main`, con auto-deploy en cada push).
2. Configurar el servicio:
   - **Root Directory: `back`** (el repo es un monorepo: Render solo mira esta carpeta y solo redeploya si cambia algo acá)
   - Build: `npm install && npm run build`
   - Start: `npm run start:prod`
3. Environment: `MONGO_URI`, `FRONT_URL`, `JWT_SECRET`, las 3 de Cloudinary y `NODE_VERSION=24.16.0`.
4. En MongoDB Atlas → Network Access → `0.0.0.0/0`, porque Render no tiene IP fija.

> El plan gratis "duerme" el servicio sin uso: la primera petición tarda unos 50 segundos.
