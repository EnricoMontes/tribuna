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
- en Mi perfil, el escudo del cuadro, "Hincha de ..." y el número de camiseta (si los cargó);
- la tarjeta roja en los errores y el banderín del línea en el 404 ("Fuera de juego").

## Pantallas

| Pantalla | Qué se ve y qué se puede hacer |
|---|---|
| **Crear cuenta** (`/registro`) | Formulario completo con foto de perfil y vista previa. Avisa en vivo si algún dato está mal |
| **Ingresar** (`/login`) | Ingreso con correo **o** nombre de usuario, más la contraseña. Botón para ver u ocultar la contraseña |
| **Publicaciones** (`/publicaciones`) | Todas las publicaciones, de a 5 por página. Se ordenan por **más nuevas** (por defecto) o por **más me gusta**. Cada una muestra el autor, el texto, la foto y, **al costado, el partido** (escudos, liga y horario): al tocarlo se entra a ese partido. Al lado de la lista están los **partidos de la fecha** |
| **Publicación** (`/publicaciones/:id`) | Una publicación **grande**, con sus **comentarios** abajo: los 5 más nuevos y un botón **"Cargar más"** que trae los siguientes sin borrar los que ya se ven. Se puede **comentar** y **editar mis comentarios** (los editados dicen "(editado)"). Se entra tocando el título o "N comentarios" en cualquier tarjeta. Botón **← Volver** |
| **Partido** (`/partidos/:id`) | El partido como un marcador (escudos, VS, día y hora) y **todas las publicaciones de ese partido**, con el mismo orden y las mismas páginas. Botón para publicar de ese partido y botón **← Todas las publicaciones** |
| **Publicar** (`/publicar`) | Se elige el **partido de la fecha** (Liga Profesional o Primera Nacional), se escribe un título y un mensaje, y se puede agregar una foto con vista previa |
| **Mi perfil** (`/mi-perfil`) | Foto (o iniciales si no subió), nombre, @usuario, correo, fecha de nacimiento y edad, descripción, tipo de perfil, cuadro y número. Arriba, la **portada** (mi banner o la azul). Con el **lápiz** se abre una ventana para editar nombre, apellido, descripción, cuadro, número, foto y portada, con vista previa. Abajo, **mis últimas 3 publicaciones con sus comentarios** |
| **Fuera de juego** (404) | Si se entra a una dirección que no existe |

- **Barra de navegación:** links a todas las pantallas, avatar y @usuario de quien está logueado, y botón **Salir**.
- **Me gusta:** se toca el corazón para darlo y otra vez para sacarlo. Cada hincha puede dar uno solo por publicación.
- **Eliminar:** aparece solo en **mis** publicaciones (o en todas si soy administrador) y pide confirmación en un modal.
- Publicaciones, Publicación, Partido, Publicar y Mi perfil piden **haber ingresado**: si no, la app manda al login.
- **Pantalla de carga:** al abrir la app aparece el escudo animado ("Entrando a la cancha...") mientras se verifica que la sesión guardada siga sirviendo. Si sirve, entra a Publicaciones (o a la pantalla donde estaba, si se recargó con F5); si no, va al login.
- **Sesión de 15 minutos:** a los **10 minutos** aparece un aviso *"Tu sesión vence en 5 minutos"* con el botón **Extender sesión** (da 15 minutos más). Si no se extiende, a los 15 minutos la app vuelve al login y avisa *"Tu sesión venció"*. Si el servidor responde que la sesión no es válida, también vuelve al login.
- Al recargar la página (F5) la sesión se mantiene.
- Se puede usar desde el celular (diseño adaptable).

## Registro: reglas y mensajes

| Campo | Regla | Mensaje si falla |
|---|---|---|
| Nombre / Apellido | Obligatorios, hasta 50 caracteres | "Ingresá tu nombre" / "Máximo 50 caracteres" |
| Correo | Obligatorio, formato completo `usuario@dominio.ext` (`hincha@gmail` **no** es válido) y **que no esté registrado** | El formato se marca mientras escribís, apenas ponés el `@`; si ya existe también se avisa |
| Nombre de usuario | 3 a 20 caracteres (letras, números, `_` o `.`) y **que no esté registrado** | Se avisa mientras escribís si ya existe |
| Contraseña | **8+ caracteres, una mayúscula y un número** | Checklist en vivo que marca cada regla cumplida |
| Cuadro (opcional) | Se elige de una lista dividida en **Liga Profesional** y **Primera Nacional** | Al elegirlo aparece su escudo al lado y en el carnet de socio |
| N.º de camiseta (opcional) | Número entero del 1 al 99 | "Tiene que ser un número entero del 1 al 99". Se ve en el carnet (si no hay, muestra el 12) |
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
| 4 | Panel de administración y estadísticas; la app se va a poder instalar (PWA) |
