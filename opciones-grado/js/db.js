// Base de datos local (IndexedDB). Todo se guarda en ESTE dispositivo; no hay servidor.
import { aBase64, deBase64 } from './util.js';
const NOMBRE = 'fupTG', STORES = ['expedientes', 'docentes', 'blobs', 'kv'];
let _db, _mem = null; // _mem: respaldo en memoria si IndexedDB no está disponible

function abrir() {
  if (_db) return Promise.resolve(_db);
  return new Promise((ok, no) => {
    if (!('indexedDB' in window)) return no(new Error('sin IndexedDB'));
    const r = indexedDB.open(NOMBRE, 1);
    r.onupgradeneeded = () => { const d = r.result; STORES.forEach((s) => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: s === 'kv' ? 'k' : 'id' }); }); };
    r.onsuccess = () => { _db = r.result; ok(_db); };
    r.onerror = () => no(r.error);
  });
}
async function tx(store, modo, fn) {
  try {
    const d = await abrir();
    return await new Promise((ok, no) => { const t = d.transaction(store, modo); const s = t.objectStore(store); const r = fn(s); t.oncomplete = () => ok(r && r.result !== undefined ? r.result : undefined); t.onerror = () => no(t.error); t.onabort = () => no(t.error); });
  } catch (e) {
    _mem = _mem || Object.fromEntries(STORES.map((s) => [s, new Map()]));
    console.warn('IndexedDB no disponible; se usa memoria temporal', e);
    return memFallback(store, modo, fn);
  }
}
function memFallback(store, modo, fn) { // implementación mínima para no romper la app (los datos no persisten)
  const m = _mem[store];
  const s = { getAll: () => ({ result: [...m.values()] }), get: (k) => ({ result: m.get(k) }), put: (v) => { m.set(v.id ?? v.k, v); return {}; }, delete: (k) => { m.delete(k); return {}; }, clear: () => { m.clear(); return {}; } };
  return fn(s).result;
}
export const db = {
  todos: (s) => tx(s, 'readonly', (st) => st.getAll()).then((x) => x || []),
  uno: (s, id) => tx(s, 'readonly', (st) => st.get(id)),
  guardar: (s, v) => tx(s, 'readwrite', (st) => st.put(v)),
  borrar: (s, id) => tx(s, 'readwrite', (st) => st.delete(id)),
  vaciar: (s) => tx(s, 'readwrite', (st) => st.clear()),
  async kv(k, def) { const r = await db.uno('kv', k); return r ? r.v : def; },
  setKv: (k, v) => db.guardar('kv', { k, v }),
  persistente: async () => { try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; } catch { return false; } },
  async uso() { try { const e = await navigator.storage.estimate(); return { usado: e.usage || 0, cuota: e.quota || 0 }; } catch { return null; } },
};

// ---- respaldo completo (JSON). Incluye los archivos adjuntos en base64 si conBlobs.
export async function exportarTodo(conBlobs = true) {
  const out = { app: 'fupTG', version: 1, fecha: new Date().toISOString(), expedientes: await db.todos('expedientes'), docentes: await db.todos('docentes'), kv: await db.todos('kv'), blobs: [] };
  if (conBlobs) for (const b of await db.todos('blobs')) out.blobs.push({ id: b.id, tipo: b.tipo, nombre: b.nombre, b64: aBase64(b.datos) });
  return out;
}
export async function importarTodo(obj, reemplazar = false) {
  if (!obj || obj.app !== 'fupTG') throw new Error('El archivo no es un respaldo de esta aplicación.');
  if (reemplazar) for (const s of STORES) await db.vaciar(s);
  for (const e of obj.expedientes || []) await db.guardar('expedientes', e);
  for (const d of obj.docentes || []) await db.guardar('docentes', d);
  for (const k of obj.kv || []) await db.guardar('kv', k);
  for (const b of obj.blobs || []) await db.guardar('blobs', { id: b.id, tipo: b.tipo, nombre: b.nombre, datos: deBase64(b.b64) });
  return { expedientes: (obj.expedientes || []).length, docentes: (obj.docentes || []).length, blobs: (obj.blobs || []).length };
}
