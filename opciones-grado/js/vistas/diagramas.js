import { h, cargarScript, descargar } from '../util.js';
import { diagramas as cargar } from '../datos.js';

let n = 0;
export async function render({ params }) {
  const ds = await cargar(); let actual = ds.find((d) => d.id === params[0]) || ds[0]; let esc = 1;
  const lienzo = h('div', { style: { transformOrigin: 'top left' } }); const zv = h('span', { class: 'nota' }, '100 %');
  const sel = h('select', { class: 'i', style: { width: 'auto' }, onchange: () => { actual = ds.find((d) => d.id === sel.value); pintar(); } }, ds.map((d) => h('option', { value: d.id, selected: d.id === actual.id }, d.nombre)));
  const z = (d) => { esc = Math.max(.3, Math.min(2.5, esc + d)); lienzo.style.transform = `scale(${esc})`; zv.textContent = Math.round(esc * 100) + ' %'; };
  async function pintar() {
    lienzo.replaceChildren(h('div', { class: 'vacio' }, 'Dibujando…'));
    try {
      await cargarScript('vendor/mermaid.min.js');
      window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', sequence: { useMaxWidth: false } });
      const { svg } = await window.mermaid.render('mer' + (++n), actual.mermaid); lienzo.innerHTML = svg;
    } catch (e) { lienzo.replaceChildren(h('div', { class: 'alerta mal' }, 'No se pudo dibujar el diagrama: ' + e.message), h('pre', { class: 'mer' }, actual.mermaid)); }
  }
  const v = h('div', h('p', { class: 'nota' }, 'Diagramas de secuencia del procedimiento (Estudiante, Director, Coordinación de TG, Evaluadores y Comité). Cada paso indica el formato que se usa.'),
    h('div', { class: 'fila', style: { marginBottom: '8px' } }, sel, h('button', { class: 'btn peq gris', onclick: () => z(-.1) }, '−'), h('button', { class: 'btn peq gris', onclick: () => z(.1) }, '+'), zv,
      h('button', { class: 'btn peq sec', onclick: () => { const s = lienzo.querySelector('svg'); if (s) descargar(actual.id + '.svg', new XMLSerializer().serializeToString(s), 'image/svg+xml'); } }, 'Descargar SVG'),
      h('button', { class: 'btn peq sec', onclick: () => descargar(actual.id + '.mmd', actual.mermaid, 'text/plain') }, 'Código Mermaid')),
    h('div', { class: 'tarj', style: { overflow: 'auto', maxHeight: '75vh' } }, lienzo));
  z(-.2); pintar(); return v;
}
