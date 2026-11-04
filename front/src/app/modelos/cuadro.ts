// Lo que devuelve GET /cuadros (el back lo arma con la API de promiedos)
export interface Cuadro {
  id: string;
  nombre: string;
  escudo: string; // URL de la imagen del escudo
}

export interface Categoria {
  nombre: string; // "Liga Profesional" o "Primera Nacional"
  cuadros: Cuadro[];
}
