// Secciones de la aplicación (las usan el menú y la sección «Más»). La aplicación es informativa: todos ven todo.
export const RUTAS = [
  { id: 'inicio', nombre: 'Inicio', ico: 'inicio', mod: './vistas/inicio.js', grupo: 'Principal', movil: true },
  { id: 'opciones', nombre: 'Opciones de grado', ico: 'opciones', mod: './vistas/opciones.js', grupo: 'Principal', movil: true },
  { id: 'formatos', nombre: 'Formatos', ico: 'formatos', mod: './vistas/formatos.js', grupo: 'Consulta', movil: true },
  { id: 'reglamento', nombre: 'Reglamento', ico: 'reglamento', mod: './vistas/reglamento.js', grupo: 'Consulta', movil: true },
  { id: 'diagramas', nombre: 'Procedimientos', ico: 'diagramas', mod: './vistas/diagramas.js', grupo: 'Consulta' },
  { id: 'calendario', nombre: 'Calendario', ico: 'calendario', mod: './vistas/calendario.js', grupo: 'Fechas y herramientas' },
  { id: 'fichas', nombre: 'Ficha de invitación', ico: 'fichas', mod: './vistas/fichas.js', grupo: 'Fechas y herramientas' },
  { id: 'ajustes', nombre: 'Ajustes y respaldo', ico: 'ajustes', mod: './vistas/ajustes.js', grupo: 'Fechas y herramientas' },
];