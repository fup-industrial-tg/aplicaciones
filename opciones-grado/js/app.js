// Arranque de la aplicación: diseño, navegación por rutas, perfil local, instalación y modo sin conexión.
import { h, $, icono, toast, descargar, modoInstalado, getTema, setTema } from './util.js';
import { formatos, esAdmin } from './datos.js';
import { db } from './db.js';
import { RUTAS } from './rutas.js';

export const ctx = { ruta: null, refrescar: null };
let instalar = null;

function parsear() {
  const [r, ...p] = (location.hash.replace(/^#\/?/, '') || 'inicio').split('/');
  return { id: r || 'inicio', params: p.map(decodeURIComponent) };
}
export const ir = (ruta) => { location.hash = '#/' + ruta; };

let _turno = 0; // si se navega rápido, solo la última sección pedida se dibuja
async function pintar() {
  const turno = ++_turno;
  const { id, params } = parsear();
  const def = id === 'mas' ? { id: 'mas', nombre: 'Más secciones', mod: './vistas/mas.js' } : RUTAS.find((r) => r.id === id) || RUTAS[0];
  ctx.ruta = def;
  $('#vista-titulo').textContent = def.nombre;
  document.title = def.nombre + ' · Opciones de Grado FUP';
  document.querySelectorAll('[data-ruta]').forEach((a) => a.classList.toggle('on', a.dataset.ruta === def.id));
  const cont = $('#vista'); cont.replaceChildren(h('div', { class: 'vacio' }, 'Cargando…'));
  try {
    const m = await import(def.mod);
    const nodo = await m.render({ params, ctx, ir });
    if (turno !== _turno) return;
    cont.replaceChildren(nodo);
    window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    cont.replaceChildren(h('div', { class: 'alerta mal' }, 'No se pudo abrir esta sección: ' + e.message));
  }
}
ctx.refrescar = pintar;

function layout() {
  const nav = h('nav');
  let g = '';
  RUTAS.forEach((r) => {
    if (r.grupo !== g) { g = r.grupo; nav.append(h('div', { class: 'grupo' }, g)); }
    nav.append(h('a', { class: 'nav', href: '#/' + r.id, 'data-ruta': r.id }, icono(r.ico), r.nombre));
  });
  const lado = h('aside', { class: 'lado' },
    h('div', { class: 'marca' }, h('img', { src: 'iconos/logo_fup.png', alt: 'FUP' }), h('div', h('b', 'Opciones de Grado'), h('small', 'Ingeniería Industrial · FUP'))),
    nav,
    h('div', { class: 'pie', id: 'pie-perfil' }));
  const inf = h('nav', { class: 'inf', 'aria-label': 'Navegación principal' },
    ...RUTAS.filter((r) => r.movil).map((r) => h('a', { href: '#/' + r.id, 'data-ruta': r.id }, icono(r.ico), h('span', r.nombre.split(' ')[0]))),
    h('a', { href: '#/mas', 'data-ruta': 'mas' }, icono('mas'), h('span', 'Más')));
  const barra = h('header', { class: 'barra' }, h('h1', { id: 'vista-titulo' }, ''),
    h('span', { id: 'chip-rol', class: 'chip aviso', title: 'Modo administrador activo', style: { display: 'none' } }, 'Administrador'),
    h('button', { class: 'btn peq sec', id: 'btn-tema', title: 'Cambiar entre tema claro y oscuro', onclick: () => setTema(getTema() === 'oscuro' ? 'claro' : 'oscuro') }),
    h('button', { class: 'btn peq sec', id: 'btn-instalar', style: { display: 'none' }, onclick: async () => { if (instalar) { instalar.prompt(); await instalar.userChoice; instalar = null; $('#btn-instalar').style.display = 'none'; } } }, 'Instalar app'));
  $('#app').replaceChildren(h('div', { class: 'app' }, lado, h('div', { class: 'cuerpo' }, h('div', { id: 'aviso-red' }), barra, h('main', { class: 'principal', id: 'vista' })), inf));
}
export function pintarAdmin() { const c = $('#chip-rol'); if (c) c.style.display = esAdmin() ? '' : 'none'; const pie = $('#pie-perfil'); if (pie) pie.textContent = esAdmin() ? 'Modo administrador' : 'Información para estudiantes y docentes'; }

async function iniciar() {
  await formatos().catch(() => {}); // fija qué formatos están activos antes de calcular faltantes y alertas
  layout(); pintarAdmin(); document.addEventListener('admin', pintarAdmin);
  const botonTema = () => { const b = $('#btn-tema'); if (b) b.textContent = getTema() === 'oscuro' ? '☀ Claro' : '🌙 Oscuro'; };
  document.addEventListener('tema', botonTema); botonTema();
  window.addEventListener('hashchange', pintar);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); instalar = e; const b = $('#btn-instalar'); if (b) b.style.display = ''; });
  const red = () => { const a = $('#aviso-red'); if (a) a.replaceChildren(navigator.onLine ? '' : h('div', { class: 'offline' }, 'Sin conexión: puedes seguir trabajando; los datos se guardan en este dispositivo.')); };
  window.addEventListener('online', red); window.addEventListener('offline', red); red();
  db.persistente();
  if (modoInstalado() === 'android') { // los enlaces a formatos y PDF incluidos en la app se guardan con «Compartir»
    document.addEventListener('click', async (ev) => {
      const a = ev.target.closest && ev.target.closest('a[download], a[target=_blank]'); if (!a) return;
      const href = a.getAttribute('href') || ''; if (!href || href.startsWith('#') || /^(https?:|mailto:)/.test(href) && !href.startsWith(location.origin)) return;
      ev.preventDefault(); const r = await fetch(a.href); await descargar(a.getAttribute('download') || decodeURIComponent(href.split('/').pop()), await r.blob());
    });
  }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !modoInstalado() && location.hostname !== 'localhost.invalid') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Sin modo offline:', e));
  }
  await pintar();
}
iniciar().catch((e) => { document.body.prepend(h('pre', { style: { color: 'red', padding: '12px' } }, 'Error al iniciar: ' + e.message)); console.error(e); });
