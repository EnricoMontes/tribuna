import { DatePipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {
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
      (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() >= nacimiento.getUTCDate());
    if (!yaCumplio) {
      edad--;
    }
    return edad;
  });

  constructor(public auth: Auth) {}
}
