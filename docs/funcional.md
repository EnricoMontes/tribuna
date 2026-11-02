# Tribuna API · Documentación funcional

> Qué hace el servidor desde el punto de vista del usuario y del cliente, sin entrar en el código.
> Para el detalle técnico, ver [tecnico.md](tecnico.md).

## ¿Qué es Tribuna?

Una red social de fútbol. Cada hincha tiene una cuenta con su perfil y su foto, y desde el Sprint 2 va a poder
publicar opiniones y fotos de cancha, dar "me gusta" y comentar.
Esta API es el **servidor**: guarda los datos, verifica quién es cada usuario y valida todo lo que llega.

## Lo que se puede hacer hoy (Sprint 1)

### 1. Crear una cuenta (registro)

El hincha manda sus datos:

| Dato | Regla |
|---|---|
| Nombre y apellido | Obligatorios, hasta 50 caracteres cada uno |
| Correo | Obligatorio, con formato válido, **no puede estar usado por otra cuenta** |
| Nombre de usuario | De 3 a 20 caracteres: letras, números, `_` o `.`. **No puede estar usado por otra cuenta** |
| Contraseña | Mínimo **8 caracteres, una mayúscula y un número** |
| Fecha de nacimiento | Obligatoria, no puede ser futura, hay que tener **13 años o más** |
| Descripción breve | Opcional, hasta 200 caracteres |
| Foto de perfil | Opcional: JPG, PNG o WEBP de hasta 2 MB |

- Toda cuenta nueva tiene el perfil **"usuario"**. Nadie puede registrarse como "administrador": ese perfil solo lo asigna la administración.
- Correo y nombre de usuario no distinguen mayúsculas: `Juan@Mail.com` y `juan@mail.com` son la misma cuenta.
- La contraseña se guarda **encriptada**: ni siquiera el administrador de la base puede leerla.

### 2. Ingresar (login)

- Se puede ingresar con el **correo o con el nombre de usuario**, más la contraseña.
- Si los datos son correctos, devuelve todos los datos de la cuenta, **nunca la contraseña**.
- Si el usuario no existe o la contraseña está mal, el mensaje es el mismo, *"Usuario o contraseña incorrectos"*, para no darle pistas a nadie que quiera adivinar cuentas.

### 3. Consultar si un correo o usuario está libre

Mientras alguien completa el registro, la app pregunta si el correo o el nombre de usuario ya existen,
para avisarle antes de enviar el formulario.

## Qué responde el servidor en cada caso

| Situación | Respuesta |
|---|---|
| Cuenta creada | ✅ **201** Creado |
| Ingreso correcto | ✅ **200** OK |
| Faltan datos o algún dato no cumple las reglas | ❌ **400**, con un mensaje por cada campo mal cargado |
| Intentar registrarse como administrador | ❌ **400** |
| Menor de 13 años o fecha futura | ❌ **400** |
| Foto que no es JPG/PNG/WEBP | ❌ **400** |
| Correo o contraseña incorrectos en el ingreso | ❌ **401** No autorizado |
| Correo o nombre de usuario ya registrados | ❌ **409** Conflicto |
| Foto de más de 2 MB | ❌ **413** Archivo demasiado grande |

Todos los mensajes de error están en castellano y la app los muestra en un modal.

## Lo que viene

| Sprint | Funcionalidad |
|---|---|
| 2 | Publicaciones con imagen, "me gusta", orden por fecha o por me gusta, paginación, borrar las propias |
| 3 | Comentarios, sesión con token (JWT) que vence y se puede extender |
| 4 | Panel de administración de usuarios y estadísticas con gráficos |
