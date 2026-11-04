import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../modelos/usuario';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { EditarPerfil } from '../editar-perfil/editar-perfil';
import { ListaPublicaciones } from '../lista-publicaciones/lista-publicaciones';

@Component({
  imports: [RouterLink, DatePipe, ListaPublicaciones, EditarPerfil],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {
  private modal = inject(Modal);

  // Se abre la ventana de edición con el lápiz
  editando = signal(false);

  alGuardar(usuario: Usuario) {
    this.auth.actualizarUsuario(usuario); // el signal cambia -> el perfil y la navbar se actualizan solos
    this.editando.set(false);
    this.modal.exito('Perfil actualizado', 'Tus cambios ya se ven en la tribuna.');
  }

  // computed: se recalculan solos cuando cambia el signal auth.usuario()
  iniciales = computed(() => {
    const usuario = this.auth.usuario();
    return usuario ? `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase() : '';
  });

  edad = computed(() => {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return null;
    }
    const nacimiento = new Date(usuario.fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
    const yaCumplio =
      hoy.getUTCMonth() > nacimiento.getUTCMonth() ||
      (hoy.getUTCMonth() === nacimiento.getUTCMonth() &&
        hoy.getUTCDate() >= nacimiento.getUTCDate());
    if (!yaCumplio) {
      edad--;
    }
    return edad;
  });

  constructor(public auth: Auth) {}
}
