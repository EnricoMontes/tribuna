# Tribuna · Documentación técnica (front)

> Cómo está construido el front. Para qué puede hacer el usuario, ver [funcional.md](funcional.md).

## Stack

| Pieza | Uso |
|---|---|
| **Angular 22** | Componentes **standalone** (sin NgModules), **zoneless** (sin zone.js) |
| **Signals** (`signal`, `computed`, `effect`) | Estado reactivo: sesión, modal, formulario de la foto |
| **Reactive Forms** | `FormGroup` / `FormControl` con validadores propios (de control, de grupo y asíncrono) |
| **HttpClient** (`withFetch`) + **RxJS** | Peticiones a la API de Nest como `Observable` |
| **Router** | Rutas con **lazy loading** (`loadComponent`) y `title` por pantalla |
| CSS propio | Variables CSS, sin framework. Tipografías Bebas Neue y Manrope. Responsive |
| Vitest | Tests |

## Arquitectura

```
Componente (pantalla) ──usa──▶ Servicio (@Service + inject) ──HttpClient──▶ API NestJS (Render)
      ▲                              │
      └──── signals ◀────────────────┘   (Auth.usuario, Modal.datos)
```

- Los **componentes** muestran la información y manejan los formularios.
- Los **servicios** hablan con la API y guardan el estado compartido en signals.
- Cuando un signal cambia, todos los componentes que lo leen se actualizan solos. Por ejemplo, al hacer login se actualizan el navbar y Mi perfil.

## Estructura

```
src/app/
├── app.routes.ts            rutas lazy (loadComponent) + title; '' → publicaciones; ** → 404
├── app.config.ts            provideRouter(withComponentInputBinding), provideHttpClient(withFetch, withInterceptors), es-AR
├── app.html                 <app-navbar> + <router-outlet> + pantalla de carga + <app-modal-mensaje> (una sola vez)
├── componentes/
│   ├── navbar/              links (routerLinkActive), avatar o iniciales (computed), Salir
│   ├── login/               form identificador + password, ver/ocultar contraseña
│   ├── registro/            form completo + foto con vista previa (URL.createObjectURL)
│   ├── publicaciones/       tablero + <app-lista-publicaciones> + partidos de la fecha (toSignal)
│   ├── lista-publicaciones/ orden, paginación (offset/limit), me gusta y eliminar; la reusan 3 pantallas
│   ├── tarjeta-publicacion/ UNA publicación: input() publicacion / output() meGusta y eliminar; versión grande y con comentarios
│   ├── pagina-publicacion/  /publicaciones/:id: la publicación grande + sus comentarios
│   ├── comentarios/         comentar, editar los míos y "cargar más" (offset = los que ya tengo)
│   ├── cargando/            spinner con el escudo animado (CSS); también la pantalla de carga
│   ├── partido/             /partidos/:id (el id llega como input) + lista filtrada por partido
│   ├── publicar/            form reactivo: partido (optgroup por liga), título, mensaje, foto
│   ├── mi-perfil/           datos + edad e iniciales (computed) + mis últimas 3 (la misma lista) + lápiz
│   ├── editar-perfil/       ventana de edición: input usuario / output guardado y cerrar; banner + foto con vista previa
│   ├── pagina-error/        404 "Fuera de juego"
│   └── modal-mensaje/       dibuja el modal; effect() le da foco; @HostListener para Escape
├── servicios/
│   ├── auth.ts              usuario = signal, logueado = computed, registro/login/cerrarSesion,
│   │                        verificarSesion (autorizar), refrescar y los timers de la sesión
│   ├── usuarios.ts          disponible(campo, valor) → Observable<boolean>
│   ├── modal.ts             datos = signal; exito / error / info / confirmar / cerrar
│   ├── publicaciones.ts     listar (HttpParams) / obtener / crear / eliminar / darMeGusta / quitarMeGusta
│   ├── comentarios.ts       listar (offset, limit) / crear / editar
│   ├── partidos.ts          GET /partidos
│   └── cuadros.ts           GET /cuadros (shareReplay)
├── interceptores/token.interceptor.ts   agrega el Bearer y, si hay 401, vuelve al login
├── guards/sesion.guard.ts   canActivate: espera la verificación inicial; sin sesión -> /login
├── validadores/registro.validadores.ts
├── utilidades/errores.ts    traduce el error de Nest ({statusCode, message}) a texto
└── modelos/                 usuario · cuadro · partido · publicacion · comentario
```

## Decisiones técnicas

### Signals vs variables comunes
- `Auth.usuario` es un `signal<Usuario | null>` y `logueado` es un `computed`.
- Una variable común no avisa cuando cambia. Como la app es **zoneless**, Angular no se enteraría y no redibujaría la vista. Un signal sí notifica a quienes lo leen.
- `computed` deriva valores (iniciales, edad) y se recalcula solo cuando cambia el signal del que depende.
- `effect` ejecuta un efecto secundario cuando cambia un signal: en el modal, pone el foco en el botón Aceptar.

### Formularios reactivos y validadores propios
| Validador | Tipo | Qué hace |
|---|---|---|
| `correoValidator` | De control | Exige dominio con punto y extensión de 2+ letras. Reemplaza a `Validators.email`, que acepta `hincha@gmail` porque la norma permite dominios sin punto (redes internas) |
| `passwordFuerteValidator` | De control | 8+ caracteres, una mayúscula y un número. Devuelve **un error por regla** para el checklist en vivo |
| `edadMinimaValidator(13)` | De control | La fecha no puede ser futura y la edad tiene que ser ≥ 13 |
| `clavesCoincidenValidator` | **De grupo** | Va en el `FormGroup` porque compara dos campos; se recalcula si cambia cualquiera de los dos |
| `disponibleValidator` | **Asíncrono** | Pregunta a la API si el correo o el usuario están libres. `timer(500)` + `switchMap`: espera a que el usuario deje de tipear y cancela la consulta anterior |

Validar en el front da feedback inmediato. El back **vuelve a validar todo**, porque cualquiera puede llamar a la API sin pasar por el front (por ejemplo, con Postman).

### Lista de cuadros (servicio `Cuadros`)
- Pide `GET /cuadros` al back (el back la arma con la API de promiedos, la cachea y tiene respaldo).
- `shareReplay(1)`: la primera vez hace la petición y después reutiliza la respuesta.
- `catchError` devuelve `[]`: como el cuadro es opcional, si falla el registro sigue andando.
- En el registro se usa `toSignal(...)` para pasar el observable a un signal. El `<select>` usa `<optgroup>` para separar Liga Profesional y Primera Nacional.

### HttpClient y Observables
- Los servicios devuelven `Observable`. La petición sale recién cuando el componente hace `subscribe({ next, error })` (patrón **Observer**).
- `tap` guarda la sesión sin modificar la respuesta. `map` transforma la respuesta (por ejemplo, `{ disponible }` → `boolean`).
- El registro manda un **`FormData`** (`multipart/form-data`) para que viajen juntos los datos y el archivo. `repetirPassword` no se envía.

### Inyección de dependencias
- Los servicios usan `@Service()` (Angular 22) y se obtienen con `inject()` o por el constructor.
- En `Registro` se usa `inject()` como propiedad porque el `FormGroup` necesita `Usuarios` al crearse.

### Ciclo de vida
- `Registro` implementa **`OnDestroy`**: al salir de la pantalla libera la URL temporal de la vista previa (`URL.revokeObjectURL`) para no dejar memoria tomada.

### Control flow y pipes
- Las plantillas usan `@if` / `@for`.
- `DatePipe` muestra la fecha en castellano gracias a `LOCALE_ID = 'es-AR'`.

### Modal propio (sin `alert()`)
- El servicio `Modal` guarda el mensaje en un signal y `<app-modal-mensaje>`, que está una sola vez en `app.html`, lo dibuja.
- Cualquier componente llama a `modal.exito(...)` o `modal.error(...)`, y se le puede pasar una acción para cuando se cierra.

### Sesión con token (JWT)
- Login y registro devuelven `{ usuario, token }`. Los dos se guardan en `localStorage` (`tribuna_usuario` y `tribuna_token`), así un F5 no cierra la sesión. El profe aceptó `localStorage`; la alternativa eran cookies.
- **Interceptor HTTP** (`interceptores/token.interceptor.ts`): es una función que Angular ejecuta en **cada** petición de `HttpClient`. Si hay token, **clona** la petición (porque las peticiones son inmutables) y le agrega `Authorization: Bearer <token>`. Se registra con `provideHttpClient(withInterceptors([tokenInterceptor]))`.
- Solo agrega el token a las peticiones a nuestra API (`environment.apiUrl`), no a otros sitios.
- Si hay usuario guardado pero no token (una sesión vieja del Sprint 1), se considera que no hay sesión.
- **Pantalla de carga (Sprint 3):** `App` llama a `auth.verificarSesion()` al iniciar y `app.html` muestra `<app-cargando pantallaCompleta>` mientras `auth.verificando()` es true.
  - `verificarSesion()` hace `POST /auth/autorizar` junto con un `timer(800)` (`forkJoin`), para que el spinner no sea un parpadeo, y usa `shareReplay(1)` para que la petición salga una sola vez aunque se suscriban App y el guard.
  - El **guard** devuelve ese Observable mientras se verifica (Angular espera a que emita): válido → entra; inválido → `UrlTree` al login.
- **Modal a los 10 minutos:** dos `setTimeout`, uno a los 10 minutos (abre `modal.confirmar` con "Extender sesión", que llama a `POST /auth/refrescar` y reprograma los timers) y otro a los 15 (cierra la sesión y vuelve al login con un aviso). Se cancelan con `clearTimeout` al salir.
  - El vencimiento se guarda como `Date.now() + (exp - iat) * 1000` (la duración del token, leída del payload con `atob`), no con `exp` directo: `exp` es la hora del servidor, y si la compu tiene la hora corrida el aviso saldría a destiempo.
- **401:** el interceptor llama a `auth.sesionVencida()` (cierra sesión, va al login y avisa). El 401 de `/auth/autorizar` lo resuelve el guard, sin aviso.

### Publicaciones: componentes que se comunican
- **`TarjetaPublicacion`** (la consigna pide que cada publicación sea un componente) recibe la publicación con **`input.required()`** y avisa con **`output()`** cuando se toca me gusta o eliminar. **No llama a la API**: solo muestra y avisa. Así sirve igual en el listado, en el partido y en Mi perfil.
- **`ListaPublicaciones`** escucha esos outputs y llama al servicio. Recibe inputs (`partido`, `usuario`, `porPagina`, `conControles`) para usarse en las tres pantallas.
  - Un **`effect()`** vuelve a pedir la página cuando cambia el orden, la página, el partido o el usuario (son signals).
  - Al dar me gusta se actualiza **solo esa publicación** en el signal (`update` + `map`), sin volver a pedir la página.
  - **Paginación**: `offset = (página - 1) * porPágina`, y `totalPaginas` es un `computed` sobre el `total` que manda la API.
  - El estado vacío lo pone cada pantalla con **`<ng-content select="[vacio]">`** (proyección de contenido).
- **Rutas con parámetros como input**: con `withComponentInputBinding()`, el `:id` de `/partidos/:id` y el `?partido=` de `/publicar` llegan directo como `input()`.
- **Confirmación sin `confirm()`**: `modal.confirmar(titulo, mensaje, textoBoton, alConfirmar)` muestra dos botones; la acción se ejecuta solo si se acepta.
- **Guard `sesionGuard`** (`canActivate`): si no hay sesión, devuelve un `UrlTree` al login. Con `canMatch` el chunk lazy ni siquiera se descargaría.

### Comentarios (Sprint 3)
- `Comentarios` recibe `publicacionId` y `porPagina` (`input()`) y avisa el total nuevo con `output()` `totalCambio`.
- **"Cargar más"**: pide `offset = comentarios().length` y **suma** lo que llega al final del signal (`update`), filtrando repetidos por `_id`. `hayMas` es un `computed` (`length < total`).
- Comentar agrega el nuevo **arriba** (la API ordena del más reciente al más viejo). Editar reemplaza solo ese comentario, que vuelve con `modificado: true` y se muestra "(editado)".
- Validación del textarea: `required`, `maxLength(500)` y `pattern(/\S/)` (no solo espacios).
- Los forms usan `(submit)="$event.preventDefault(); …"` y no `(ngSubmit)`: `ngSubmit` lo emite un form con `[formGroup]`, y acá cada form tiene un `FormControl` suelto.
- La tarjeta guarda la cantidad en un **`linkedSignal`**: toma el valor del input, se puede cambiar al comentar y vuelve a tomar el del input si cambia la publicación.

### Spinner con el escudo (`app-cargando`)
- El SVG del escudo va escrito en el template (no como `<img>`) para que el CSS pueda animar cada parte: la pelota gira (`transform-box: fill-box`), una luz recorre el borde (`stroke-dasharray` + `stroke-dashoffset`, con `pathLength="100"`) y el escudo late.
- Cada instancia genera ids propios para el gradiente y el `clipPath`: si dos spinners compartieran id, el segundo usaría el recorte del primero.
- Con `prefers-reduced-motion` solo queda la luz del borde, más lenta.

### Editar perfil
- `EditarPerfil` recibe el usuario con `input.required()` y en **`ngOnInit`** carga el formulario: en el constructor los inputs todavía no tienen valor.
- Avisa con `output()`: `guardado` (con el usuario que devolvió la API) y `cerrar`. Mi perfil llama a `auth.actualizarUsuario(...)`, y como `usuario` es un signal, el perfil y la navbar se actualizan solos.
- Las vistas previas usan `URL.createObjectURL` y se liberan en **`ngOnDestroy`**.

### Horarios en hora argentina
- `DATE_PIPE_DEFAULT_OPTIONS` con `timezone: '-0300'`: el pipe `date` muestra siempre la hora argentina, aunque la compu del usuario tenga otra zona horaria configurada. Argentina no tiene horario de verano, así que `-0300` sirve todo el año.

### Lazy loading
- Cada pantalla es un chunk aparte que se descarga recién al visitarla. Así la carga inicial es más liviana.

## Entornos

| Archivo | Se usa en | `apiUrl` |
|---|---|---|
| `environment.development.ts` | `ng serve` | `http://localhost:3000` |
| `environment.ts` | `ng build` (Vercel) | `https://tribuna-back-zeyk.onrender.com` |

## Deploy en Vercel

1. Importar el repo `tribuna` en Vercel con **Root Directory: `front`** (el repo es un monorepo). Detecta Angular solo (con auto-deploy en cada push a `main`).
2. Output Directory: `dist/tribuna-front/browser` (relativo a `front/`).
3. `vercel.json` reescribe todas las rutas a `index.html`, para que recargar en `/mi-perfil` no dé 404.
4. La URL de Vercel tiene que estar en `FRONT_URL` del back (CORS).
