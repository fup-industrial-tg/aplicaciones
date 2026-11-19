// Service worker: deja la aplicación y sus datos disponibles sin conexión.
const VERSION = 'v-ae0cc99a14'; // lo reemplaza construir_app.py con la huella de los archivos
const NUCLEO = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/app.js', 'js/util.js', 'js/db.js', 'js/datos.js', 'js/flujo.js', 'js/rutas.js', 'js/vistas/mas.js',
  'js/vistas/inicio.js', 'js/vistas/opciones.js', 'js/vistas/calendario.js', 'js/vistas/formatos.js',
  'js/vistas/reglamento.js', 'js/vistas/diagramas.js', 'js/vistas/fichas.js', 'js/vistas/ajustes.js',
  'datos/opciones.json', 'datos/formatos.json', 'datos/diagramas.json', 'datos/reglamento.json', 'datos/calendario.json', 'iconos/logo_fup.png', 'iconos/cartel_ornamento.png','iconos/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(NUCLEO)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== VERSION && x !== 'pesados').map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const pesado = /\/(vendor|formatos|normativa|ejemplos|py)\//.test(r.url);
  e.respondWith((async () => {
    const cache = await caches.open(pesado ? 'pesados' : VERSION); const hit = await cache.match(r);
    if (pesado && hit) return hit;                       // los archivos pesados: primero la copia guardada
    try { const res = await fetch(r, { cache: 'no-cache' }); if (res.ok) cache.put(r, res.clone()); return res; }   // lo demás: primero la red, para ver cambios
    catch (err) { if (hit) return hit; const alt = await caches.match(r, { ignoreSearch: true }); if (alt) return alt; if (r.mode === 'navigate') return caches.match('index.html'); throw err; }
  })());
});
