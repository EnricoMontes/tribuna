// Partido de la fecha actual (GET /partidos, el back lo arma con la API de promiedos).
// La misma forma viene adentro de cada publicación (es la copia que se guardó al publicar).
export interface Equipo {
  id: string;
  nombre: string;
  escudo: string;
}

export interface Partido {
  id: string;
  liga: string; // "Liga Profesional" | "Primera Nacional"
  fecha: string; // "Fecha 16", "Octavos de Final"...
  local: Equipo;
  visitante: Equipo;
  inicio: string; // fecha y hora en formato ISO (UTC); el pipe date la muestra en hora local
  estado?: string; // "Prog.", "Final"... (solo en GET /partidos)
}
