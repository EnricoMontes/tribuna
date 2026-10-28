# Tribuna · Front

**Tribuna** es una red social futbolera: los hinchas opinan de cada partido, suben fotos de cancha y
reaccionan a lo que publica el resto. TP #2 de Programación IV (UTN FRA, 2026 C2).
La API en NestJS está en el repo `tribuna-back`.

| | |
|---|---|
| Stack | Angular 22 (standalone, zoneless, signals) · Reactive Forms · HttpClient · CSS propio |
| Deploy | Vercel |
| Estado | **Sprint 1** — registro, login, navegación, Mi perfil |

## Cómo correrlo

```bash
npm install
npm start                 # http://localhost:4200 (usa la API en http://localhost:3000)
```

`npm run build` genera `dist/tribuna-front/browser`; `npm test` corre los tests con Vitest.

La URL de la API está en `src/environments/`:
- `environment.development.ts` es para `ng serve`.
- `environment.ts` es para el build de producción, con la URL de Render.

## Requerimientos del Sprint 1 (funcional)

| Requerimiento | Dónde |
|---|---|
| Pantallas Registro, Login, Publicaciones y Mi perfil | `componentes/registro`, `login`, `publicaciones`, `mi-perfil` |
| Navegación entre componentes, sin restricciones de acceso | `app.routes.ts` (lazy loading, sin guards) + `navbar` |
| Favicon propio | `public/favicon.svg` (pelota sobre césped) |
| Login con validaciones y mensajes | por correo **o** nombre de usuario; contraseña de 8+ caracteres, con una mayúscula y un número |
| Registro con nombre, apellido, correo, usuario, contraseña, repetir contraseña, fecha de nacimiento, descripción y foto (file) | `componentes/registro` |
| Correo y usuario únicos | validador asíncrono que consulta a la API mientras se escribe; el back responde `409` si igual se repite |
| Perfil "usuario" por defecto (puede pasar a "administrador") | lo asigna el back; se muestra en Mi perfil |
| Sin `alert()`: mensajes en modales | servicio `Modal` + componente `modal-mensaje` |
| Diseño trabajado y uniforme | tema "cancha de noche": `styles.css` con variables, tipografías Bebas Neue y Barlow, responsive |

## Estructura (técnico)

```
src/app/
├── app.routes.ts            rutas con loadComponent (lazy) + títulos de pestaña
├── app.config.ts            provideRouter, provideHttpClient, locale es-AR
├── componentes/
│   ├── navbar/              links + usuario logueado + Salir
│   ├── login/  registro/  publicaciones/  mi-perfil/  pagina-error/ (404)
│   └── modal-mensaje/       ventana de mensajes (reemplaza a alert)
├── servicios/
│   ├── auth.ts              registro / login / cerrar sesión; usuario en un signal
│   ├── usuarios.ts          consulta de disponibilidad de correo y usuario
│   └── modal.ts             estado del modal (signal) para toda la app
├── validadores/registro.validadores.ts   password fuerte, claves coinciden, edad mínima, disponible (async)
├── utilidades/errores.ts    traduce el error HTTP de Nest a un mensaje
└── modelos/usuario.ts       interfaz Usuario
```

## Decisiones técnicas

- **Componentes standalone, sin NgModules.** Cada componente declara sus `imports`, como en las clases (Angular 22).
- **Signals para el estado.**
  - `Auth.usuario` es un `signal`: el navbar y Mi perfil se actualizan solos al iniciar o cerrar sesión.
  - `computed` calcula las iniciales del avatar y la edad.
- **Reactive Forms.**
  - Validadores propios: contraseña fuerte, con un error por regla para el checklist en vivo; edad mínima de 13 años.
  - Validador de **grupo** para "las contraseñas coinciden": se recalcula si cambia cualquiera de los dos campos.
  - Validador **asíncrono** con `timer(500)` + `switchMap`: consulta a la API cuando el usuario deja de tipear.
- **HttpClient + Observables.**
  - Los servicios devuelven `Observable` y los componentes se suscriben con `next`/`error`.
  - `tap` guarda la sesión.
  - La foto viaja en un `FormData` (`multipart/form-data`).
- **Mensajes con modal propio.** Cualquier componente llama a `modal.exito(...)` o `modal.error(...)`. Se cierra con Aceptar, con Escape o clickeando afuera.
- **Sesión del Sprint 1.**
  - El usuario se guarda en `localStorage` para que un F5 no lo deslogue.
  - En el Sprint 3 se reemplaza por el **token JWT**.
- **Lazy loading.** Cada pantalla es un chunk aparte que se descarga recién al visitarla.
- **`vercel.json`.** Reescribe cualquier ruta a `index.html`, para que recargar en `/mi-perfil` no dé 404.

## Deploy en Vercel

1. Importar el repo en Vercel. Detecta Angular solo.
2. Revisar el Output Directory: `dist/tribuna-front/browser`.
3. Antes de deployar, poner la URL de Render en `src/environments/environment.ts`.
4. Agregar la URL de Vercel a `FRONT_URL` en el back (CORS).
