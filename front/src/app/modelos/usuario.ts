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
  perfil: Perfil;
  createdAt: string;
  updatedAt: string;
}
