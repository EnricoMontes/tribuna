# Tribuna · Documentación funcional

> Qué puede hacer el usuario en la aplicación, explicado sin código.
> Para el detalle técnico, ver [tecnico.md](tecnico.md).

## ¿Qué es Tribuna?

Una red social para hinchas de fútbol. Cada usuario tiene su perfil con foto y descripción, y desde el Sprint 2 va a poder
publicar opiniones y fotos de cancha, dar "me gusta" y comentar. El diseño tiene estética de club de fútbol:
azul noche, títulos en mayúsculas y una cinta con frases de la hinchada en el pie. También tiene:
- un **escudo** propio como logo y favicon;
- líneas de cancha reglamentarias en las cabeceras;
- un tablero de estadio y la cancha vacía en Publicaciones;
- un **carnet de socio** que se completa en vivo en el registro;
- la camiseta con el 12 en Mi perfil;
- la tarjeta roja en los errores y el banderín del línea en el 404 ("Fuera de juego").

## Pantallas (Sprint 1)

| Pantalla | Qué se ve y qué se puede hacer |
|---|---|
| **Crear cuenta** (`/registro`) | Formulario completo con foto de perfil y vista previa. Avisa en vivo si algún dato está mal |
| **Ingresar** (`/login`) | Ingreso con correo **o** nombre de usuario, más la contraseña. Botón para ver u ocultar la contraseña |
| **Publicaciones** (`/publicaciones`) | Pantalla de inicio con saludo al usuario. El listado de publicaciones llega en el Sprint 2 |
| **Mi perfil** (`/mi-perfil`) | Foto (o iniciales si no subió), nombre, @usuario, correo, fecha de nacimiento y edad, descripción y tipo de perfil |
| **Fuera de juego** (404) | Si se entra a una dirección que no existe |

- **Barra de navegación:** links a todas las pantallas, avatar y @usuario de quien está logueado, y botón **Salir**.
- En el Sprint 1 todas las pantallas son accesibles sin restricciones, como pide la consigna.
- Al recargar la página (F5) la sesión se mantiene.
- Se puede usar desde el celular (diseño adaptable).

## Registro: reglas y mensajes

| Campo | Regla | Mensaje si falla |
|---|---|---|
| Nombre / Apellido | Obligatorios, hasta 50 caracteres | "Ingresá tu nombre" / "Máximo 50 caracteres" |
| Correo | Obligatorio, formato completo `usuario@dominio.ext` (`hincha@gmail` **no** es válido) y **que no esté registrado** | El formato se marca mientras escribís, apenas ponés el `@`; si ya existe también se avisa |
| Nombre de usuario | 3 a 20 caracteres (letras, números, `_` o `.`) y **que no esté registrado** | Se avisa mientras escribís si ya existe |
| Contraseña | **8+ caracteres, una mayúscula y un número** | Checklist en vivo que marca cada regla cumplida |
| Repetir contraseña | Igual a la contraseña | "Las contraseñas no coinciden" |
| Fecha de nacimiento | No futura, **13 años o más** | Mensaje según el caso |
| Descripción | Opcional, hasta 200 caracteres | Contador de caracteres |
| Foto de perfil | Opcional: JPG, PNG o WEBP de hasta 2 MB | "La foto tiene que ser JPG, PNG o WEBP" / "no puede pesar más de 2 MB" |

- Toda cuenta nueva se crea con el perfil **usuario**. El perfil **administrador** lo asigna la administración.
- Si el registro sale bien, aparece un **modal de bienvenida** y, al aceptarlo, la app te lleva a Publicaciones con la sesión iniciada.

## Ingreso

- La contraseña tiene que cumplir las mismas reglas que en el registro. El formulario lo valida antes de enviar.
- Si los datos son incorrectos: modal con *"Usuario o contraseña incorrectos"*.

## Mensajes

La app **no usa ventanas `alert()` del navegador**. Todos los avisos (éxito, error, sin conexión con el servidor)
aparecen en un **modal propio** que se cierra con **Aceptar**, con la tecla **Escape** o haciendo clic afuera.

## Lo que viene

| Sprint | Funcionalidad |
|---|---|
| 2 | Listado de publicaciones (por fecha o por me gusta, paginado), crear con imagen, me gusta, borrar las propias; Mi perfil con mis últimas 3 publicaciones |
| 3 | Ver una publicación con sus comentarios ("cargar más"), editar comentarios, sesión con token y pantalla de carga |
| 4 | Panel de administración y estadísticas; la app se va a poder instalar (PWA) |
