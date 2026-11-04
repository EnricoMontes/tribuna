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
| Cuadro del que es hincha | Opcional. Tiene que ser uno de la lista de la Liga Profesional o de la Primera Nacional |
| Número de camiseta | Opcional, un número entero del 1 al 99 |

- Toda cuenta nueva tiene el perfil **"usuario"**. Nadie puede registrarse como "administrador": ese perfil solo lo asigna la administración.
- Correo y nombre de usuario no distinguen mayúsculas: `Juan@Mail.com` y `juan@mail.com` son la misma cuenta.
- La contraseña se guarda **encriptada**: ni siquiera el administrador de la base puede leerla.

### 2. Ingresar (login)

- Se puede ingresar con el **correo o con el nombre de usuario**, más la contraseña.
- Si los datos son correctos, devuelve todos los datos de la cuenta, **nunca la contraseña**.
- Si el usuario no existe o la contraseña está mal, el mensaje es el mismo, *"Usuario o contraseña incorrectos"*, para no darle pistas a nadie que quiera adivinar cuentas.

### 3. Lista de cuadros

La app pide la lista de cuadros para que el hincha elija el suyo. La lista, con el escudo de cada uno, se arma con los datos
de [promiedos.com.ar](https://www.promiedos.com.ar) (Liga Profesional y Primera Nacional). Si ese sitio no responde, se usa
una copia guardada, así que el registro siempre funciona.

### 4. Consultar si un correo o usuario está libre

Mientras alguien completa el registro, la app pregunta si el correo o el nombre de usuario ya existen,
para avisarle antes de enviar el formulario.

### 5. Editar Mi perfil

Cada hincha puede cambiar su **nombre, apellido, descripción, cuadro, número de camiseta, foto de perfil** y una **foto de portada (banner)**. El banner solo se carga desde el perfil, no en el registro; si no hay banner se ve la portada azul. También se pueden sacar la foto, el banner, el cuadro o el número. El correo, el nombre de usuario, la contraseña y la fecha de nacimiento no se cambian.

### 6. Partidos y publicaciones (Sprint 2)

Para todo lo que sigue hay que **haber ingresado**: el login devuelve un "pase" (token) que vence a los 15 minutos.

- **Partidos:** la app muestra los partidos **ya jugados** del torneo actual de la **Liga Profesional**, del más reciente al más viejo, con los escudos, el **resultado** y el horario. Salen de promiedos. Son ya jugados para que la gente suba sus fotos del partido.
- **Publicar:** título, mensaje, el **partido** del que se habla y, si querés, una foto (JPG, PNG o WEBP de hasta 2 MB). El partido tiene que ser uno ya jugado del torneo actual.
- **Ver publicaciones:** de a una página por vez, ordenadas por **fecha** (las más nuevas primero) o por **cantidad de me gusta**. Se pueden ver solo las de un partido o solo las de un usuario.
- **Me gusta:** cada hincha puede dar **un solo** me gusta por publicación, y sacarlo si quiere.
- **Eliminar:** cada uno puede borrar **sus** publicaciones, y un administrador puede borrar cualquiera. La publicación no se borra de la base: se oculta (baja lógica).

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
| Pedir partidos o publicaciones sin haber ingresado (o con la sesión vencida) | ❌ **401** |
| Borrar la publicación de otro sin ser administrador | ❌ **403** Prohibido |
| La publicación no existe o ya se borró | ❌ **404** No encontrado |
| Dar me gusta dos veces, o sacar uno que no se había dado | ❌ **409** Conflicto |
| Correo o nombre de usuario ya registrados | ❌ **409** Conflicto |
| Foto de más de 2 MB | ❌ **413** Archivo demasiado grande |

Todos los mensajes de error están en castellano y la app los muestra en un modal.

## Lo que viene

| Sprint | Funcionalidad |
|---|---|
| 3 | Comentarios. Validar la sesión al abrir la app y poder extenderla antes de que venza |
| 4 | Panel de administración de usuarios y estadísticas con gráficos |
