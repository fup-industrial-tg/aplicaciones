// Reglamento y acuerdos: cada documento se lee como en el original (sus páginas se muestran como hojas, sin usar un visor de PDF) y se puede descargar.
import { h, norm, resaltar } from '../util.js';
import { reglamento as cargar } from '../datos.js';

const limpio = (t) => String(t).replace(/^[ \t]*#{1,6}[ \t]*/gm, '').replace(/\*\*|__|^[ \t]*[-*_]{3,}[ \t]*$/gm, '').replace(/^[ \t]*>[ \t]?/gm, '').replace(/\s+/g, ' ').trim();
const snippet = (t, claves, largo = 280) => {
  const x = limpio(t); const n = norm(x); let p = -1; for (const c of claves) { p = n.indexOf(c); if (p >= 0) break; }
  const ini = Math.max(0, (p < 0 ? 0 : p) - 80); return (ini > 0 ? '…' : '') + x.slice(ini, ini + largo) + (ini + largo < x.length ? '…' : '');
};
const pagina = (d, n) => `normativa/paginas/${d.id}/${String(n).padStart(3, '0')}.jpg`;

export async function render({ params }) {
  const { docs, trozos } = await cargar(); const porId = Object.fromEntries(docs.map((d) => [d.id, d]));
  if (params[0] && porId[params[0]]) return visor(porId[params[0]], trozos.filter((t) => t.d === params[0]), Number(params[1]) || 1);
  const q = h('input', { class: 'i', type: 'search', placeholder: 'Busca una palabra o una frase: prórroga, jurado, 80 %, ARL…', oninput: () => buscar() });
  const res = h('div');
  function buscar() {
    const claves = norm(q.value).split(/\s+/).filter((x) => x.length > 1);
    if (!claves.length) return res.replaceChildren();
    const L = trozos.map((t) => ({ t, s: claves.reduce((s, c) => { const k = norm(t.t + ' ' + t.a).split(c).length - 1; return k ? s + k + (norm(t.a).includes(c) ? 3 : 0) : s - 100; }, 0) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 40);
    res.replaceChildren(h('p', { class: 'nota' }, L.length + (L.length === 40 ? '+' : '') + ' resultados'), ...(L.length ? [] : [h('div', { class: 'vacio' }, 'Sin resultados. Prueba con otra palabra.')]),
      ...L.map(({ t }) => h('a', { class: 'tarj link', style: { display: 'block', marginBottom: '8px' }, href: `#/reglamento/${t.d}/${t.p || 1}` },
        h('div', { class: 'fila' }, h('span', { class: 'chip' }, t.a), h('span', { class: 'nota' }, porId[t.d].nombre + (t.p ? ' · página ' + t.p : ''))),
        h('div', { html: resaltar(snippet(t.t, claves), claves), style: { marginTop: '4px' } }))));
  }
  const tarjeta = (d) => h('a', { class: 'tarj link', href: '#/reglamento/' + d.id }, h('div', { style: { fontSize: '1.6rem' } }, '📜'), h('b', d.nombre), h('div', { class: 'nota' }, d.paginas ? d.paginas + ' páginas' : 'Documento'));
  return h('div', h('div', { class: 'tarj' }, h('div', { class: 'form' }, h('label', { class: 'campo ancho' }, 'Buscar en el reglamento', q))), res,
    h('div', { class: 'sep' }), h('h2', 'Documentos'), h('div', { class: 'rej' }, docs.map(tarjeta)));
}

function visor(d, frag, ir) {
  const hojas = Array.from({ length: d.paginas }, (_, i) => {
    const n = i + 1; const img = h('img', { src: pagina(d, n), alt: `${d.nombre}, página ${n}`, loading: n <= 3 ? 'eager' : 'lazy', decoding: 'async', class: 'hoja-img' });
    return h('figure', { class: 'hoja', id: 'pag-' + n }, img, h('figcaption', `Página ${n} de ${d.paginas}`));
  });
  const arts = frag.filter((t) => t.p);
  const indice = arts.length ? h('select', { class: 'i', style: { width: 'auto', maxWidth: '100%' }, onchange: (e) => { const el = document.getElementById('pag-' + e.target.value); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
    [h('option', { value: '' }, 'Ir a…'), ...arts.map((t) => h('option', { value: t.p }, `${t.a} · pág. ${t.p}`))]) : null;
  const ir_pag = h('input', { class: 'i', type: 'number', min: 1, max: d.paginas, placeholder: 'Página', style: { width: '90px' }, onchange: (e) => { const el = document.getElementById('pag-' + e.target.value); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  const visorEl = h('div', { class: 'visor' }, hojas); let esc = 1; const zv = h('span', { class: 'nota', style: { minWidth: '42px', textAlign: 'center' } }, '100 %');
  const z = (nuevo) => {
    esc = Math.max(.5, Math.min(4, nuevo)); const base = Math.min(900, visorEl.clientWidth * .96 || 900);
    visorEl.style.setProperty('--ancho', Math.round(base * esc) + 'px'); zv.textContent = Math.round(esc * 100) + ' %';
  };
  visorEl.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); z(esc * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); } }, { passive: false });
  let d0 = 0, e0 = 1; const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  visorEl.addEventListener('touchstart', (e) => { if (e.touches.length === 2) { d0 = dist(e.touches); e0 = esc; } }, { passive: true });
  visorEl.addEventListener('touchmove', (e) => { if (e.touches.length === 2 && d0) { e.preventDefault(); z(e0 * dist(e.touches) / d0); } }, { passive: false });
  visorEl.addEventListener('touchend', () => { d0 = 0; });
  const v = h('div', h('a', { href: '#/reglamento' }, '← Todos los documentos'),
    h('div', { class: 'barra-doc' }, h('h2', { style: { margin: '6px 0' } }, d.nombre),
      h('div', { class: 'fila' }, d.pdf ? h('a', { class: 'btn', href: 'normativa/' + encodeURIComponent(d.pdf), download: d.pdf }, 'Descargar documento (PDF)') : null, indice, ir_pag,
        h('button', { class: 'btn peq gris', title: 'Alejar', onclick: () => z(esc - .25) }, '−'), zv, h('button', { class: 'btn peq gris', title: 'Acercar', onclick: () => z(esc + .25) }, '+'),
        h('button', { class: 'btn peq gris', onclick: () => z(1) }, 'Ajustar'), h('span', { class: 'nota' }, d.paginas + ' páginas'))),
    visorEl);
  if (ir > 1) setTimeout(() => document.getElementById('pag-' + ir)?.scrollIntoView({ block: 'start' }), 350);
  return v;
}