export type Perfil = 'usuario' | 'administrador';

// Lo que devuelve la API en /auth/registro y /auth/login (nunca incluye la contraseña)
export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  fotoPerfil: string | null;
  banner?: string | null; // foto de portada (se carga desde Mi perfil)
  perfil: Perfil;
  habilitado?: boolean; // Sprint 4: baja lógica (false = un admin lo deshabilitó). Sin el campo = habilitado
  cuadro: { id: string; nombre: string; escudo: string } | null;
  numeroCamiseta: number | null;
  createdAt: string;
  updatedAt: string;
}

// GET /usuarios/perfil/:nombreUsuario: lo que se puede ver del perfil de OTRO usuario
// (sin correo ni fecha de nacimiento)
export type UsuarioPublico = Pick<
  Usuario,
  | '_id'
  | 'nombre'
  | 'apellido'
  | 'nombreUsuario'
  | 'fotoPerfil'
  | 'banner'
  | 'descripcion'
  | 'cuadro'
  | 'numeroCamiseta'
  | 'perfil'
  | 'createdAt'
>;
