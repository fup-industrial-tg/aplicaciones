import { h, toast, descargar } from '../util.js';
import { db } from '../db.js';
import { opciones, formatos as cargarFormatos } from '../datos.js';
import { etapasDe } from '../flujo.js';


export function enlacesFormato(f) {
  if (!f.archivos.length) return h('span', { class: 'nota' }, 'sin archivo');
  return h('span', f.archivos.map((a) => {
    if (typeof a === 'string') return h('a', { class: 'btn peq gris', href: 'formatos/' + encodeURIComponent(a), download: a, style: { marginRight: '4px' } }, a.endsWith('.docx') ? 'Word' : 'Excel');
    // archivo agregado o reemplazado por el usuario: vive en la base de datos local de este dispositivo
    return h('a', { class: 'btn peq gris', href: '#', style: { marginRight: '4px' }, onclick: async (ev) => { ev.preventDefault(); const b = await db.uno('blobs', a.blob); if (!b) return toast('No se encontró el archivo guardado.', 'mal'); descargar(a.nombre, new Blob([b.datos], { type: b.tipo })); } }, a.nombre.toLowerCase().endsWith('.docx') ? 'Word' : 'Excel');
  }));
}

export async function render({ params, ir }) {
  const ops = await opciones();
  if (params[0]) return detalle(ops.find((o) => o.id === params[0]) || ops[0], ir);
  const grupos = [...new Set(ops.map((o) => o.grupo))];
  const tarjeta = (o) => h('a', { class: 'tarj link', href: '#/opciones/' + o.id },
    h('div', { class: 'fila' }, h('span', { style: { fontSize: '1.6rem' } }, o.icono), h('h3', { style: { margin: 0 } }, o.nombre)),
    h('p', { class: 'nota' }, o.resumen.length > 150 ? o.resumen.slice(0, 148) + '…' : o.resumen),
    h('div', { class: 'fila' }, h('span', { class: 'chip gris' }, o.articulos)));
  const seccion = (g) => h('section', h('h2', g), h('div', { class: 'rej' }, ops.filter((o) => o.grupo === g).map(tarjeta)), h('div', { class: 'sep' }));
  return h('div',
    h('p', { class: 'nota' }, 'Las 10 opciones de grado del programa.'),
    grupos.map(seccion));
}

async function detalle(o, ir) {
  const fmts = await cargarFormatos();
  const r = o.requisitos; const sec = (t, c) => h('section', { class: 'tarj', style: { marginBottom: '10px' } }, h('h3', t), c);
  const lista = (a) => h('ul', { class: 'l' }, a.map((x) => h('li', x)));
  const mios = o.formatos.map((c) => fmts.find((f) => f.codigo === c)).filter(Boolean);
  return h('div',
    h('a', { href: '#/opciones' }, '← Todas las opciones'),
    h('div', { class: 'fila', style: { margin: '8px 0' } }, h('span', { style: { fontSize: '2rem' } }, o.icono), h('h2', { style: { margin: 0 } }, o.nombre)),
    h('p', o.resumen),
    h('div', { class: 'fila' },
      o.diagrama ? h('a', { class: 'btn sec', href: '#/diagramas/' + o.diagrama }, 'Ver el procedimiento') : null),
    h('div', { class: 'sep' }),
    sec('Requisitos', h('div',
      h('div', { class: 'fila' },
        h('span', { class: 'chip' }, 'Créditos: ' + Math.round(r.creditos * 100) + ' %'),
        h('span', { class: 'chip' }, r.promedio != null ? 'Promedio mínimo: ' + r.promedio : 'Sin promedio mínimo'),
        r.integrantes != null ? h('span', { class: 'chip' }, r.integrantes === 1 ? 'Individual' : 'Máx. ' + r.integrantes + ' estudiantes') : null),
      h('p', { class: 'nota' }, r.fuente))),
    sec('Reglas de la opción', lista(o.reglas)),
    sec('Entregables', lista(o.entregables)),
    h('div', { class: 'rej2' },
      sec('Plazo', h('p', o.plazo)), sec('Evaluación', h('p', o.evaluacion)), sec('Evento final', h('p', o.evento)),
      o.revisiones ? sec('Revisiones', h('p', `Anteproyecto: máx. ${o.revisiones.anteproyecto}` + (o.revisiones.final ? ` · Documento final: máx. ${o.revisiones.final}` : ''))) : null),
    sec('Etapas del proceso', h('div', etapasDe(o.id).map((e, i) => h('div', { class: 'paso' }, h('div', { class: 'n' }, i + 1), h('div', h('b', e.nombre), h('div', { class: 'nota' }, e.desc),
      e.formatos.length ? h('div', { class: 'nota' }, 'Formatos: ' + e.formatos.join(', ')) : null))))),
    sec('Formatos de esta opción', h('div', { class: 'tabla-w' }, h('table', { class: 't' }, h('thead', h('tr', ['N.º', 'Formato', 'Quién lo diligencia', 'Descargar'].map((x) => h('th', x)))),
      h('tbody', mios.map((f) => h('tr', h('td', f.codigo), h('td', f.nombre), h('td', f.quien), h('td', enlacesFormato(f)))))))),
    h('p', { class: 'nota' }, 'Fundamento: ' + o.articulos + '.'));
}
