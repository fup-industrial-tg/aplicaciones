import { h, icono } from '../util.js';
import { RUTAS } from '../rutas.js';

export async function render() {
  const grupos = [...new Set(RUTAS.map((r) => r.grupo))];
  return h('div', grupos.map((g) => h('section', h('h2', g), h('div', { class: 'rej' }, RUTAS.filter((r) => r.grupo === g).map((r) => h('a', { class: 'tarj link', href: '#/' + r.id }, h('div', { class: 'fila' }, icono(r.ico), h('b', r.nombre))))), h('div', { class: 'sep' }))));
}
