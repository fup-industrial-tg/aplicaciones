// Acceso a los datos de la app (JSON generados desde el proyecto) y a la configuración.
import { db } from './db.js';
const _c = {};
export const cargar = (n) => (_c[n] ??= fetch(`datos/${n}.json`).then((r) => { if (!r.ok) throw new Error('No se pudo leer ' + n); return r.json(); }));
export const opciones = () => cargar('opciones');
// ---- Formatos: los de fábrica (datos/formatos.json, generados desde la carpeta de formatos vigentes) + los ajustes locales de este dispositivo
// (formatos ocultos, datos editados, archivos reemplazados y formatos propios agregados desde «Formatos → Administrar»).
export const formatosActivos = { set: null }; // códigos visibles; flujo.js los usa para no exigir formatos que ya no existen
const AJ_DEF = { ocultos: [], editados: {}, propios: [], archivosNuevos: {} };
export const getAjustesFormatos = async () => ({ ...AJ_DEF, ...(await db.kv('formatosAjustes', {})) });
export const setAjustesFormatos = (a) => db.setKv('formatosAjustes', a);
export async function formatos(todos = false) {
  const base = await cargar('formatos'); const aj = await getAjustesFormatos();
  const l = [...base.map((f) => ({ ...f, propio: false, ...(aj.editados[f.id] || {}), archivos: aj.archivosNuevos[f.id] || f.archivos, oculto: aj.ocultos.includes(f.id), modificado: !!(aj.editados[f.id] || aj.archivosNuevos[f.id]) })),
    ...aj.propios.map((f) => ({ ...f, propio: true, oculto: aj.ocultos.includes(f.id) }))];
  const visibles = l.filter((f) => !f.oculto);
  formatosActivos.set = new Set(visibles.map((f) => f.codigo));
  return todos ? l : visibles;
}
export const reglamento = () => cargar('reglamento');
export const diagramas = () => cargar('diagramas');
export async function opcion(id) { return (await opciones()).find((o) => o.id === id); }

// Parámetros que la coordinación puede ajustar (valores iniciales = acuerdos del Comité del 05/10/2026 y propuestas marcadas)
export const CONFIG_DEF = {
  revAnte: 2,            // Comité 05/10/2026
  revFinal: 3,           // Comité 05/10/2026
  revProducto: 2,        // propuesta
  plazoMeses: 12,        // Art. 14 (máximo 1 año)
  prorrogaDias: 183,     // propuesta: un periodo académico
  topeDocente: 5,        // SRS: rojo desde 5 estudiantes
  amarilloDesde: 3,
  slaHabiles: 8,         // SRS: 8 días hábiles para responder un avance
  avisoDias: 5,          // SRS: alerta T-5 días
  diasInvitacion: 15,    // Comité 05/10/2026
  diasSinAsesoria: 30,   // propuesta
  semanasPractica: 24,   // Comité 05/10/2026
  horasSemana: 40,       // Comité 05/10/2026
  permanenciaMeses: 18,  // Comité 05/10/2026
};
export const CONCEPTOS = ['Aprobado sin modificaciones', 'Aprobado con modificaciones', 'Segunda revisión', 'Rechazado'];
export async function getConfig() { return { ...CONFIG_DEF, ...(await db.kv('config', {})) }; }
export const setConfig = (c) => db.setKv('config', c);
// ---- Modo administrador: único que puede editar los parámetros y el calendario. Solo se guarda la huella SHA-256 del código (sin distinguir mayúsculas).
const ADMIN_HUELLA = 'b2396aa787dda8aeec59c02dc41ec16f4646712f0159164b6a2ccecd561ff7f1';
export async function huella(txt) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
// El código de fábrica va en el programa; el administrador puede cambiarlo desde Ajustes y el nuevo se guarda (solo su huella) en este dispositivo, fuera de la base de datos para que no viaje en los respaldos.
const LS_HUELLA = 'adm_huella';
const huellaVigente = () => { try { return localStorage.getItem(LS_HUELLA) || ADMIN_HUELLA; } catch (e) { return ADMIN_HUELLA; } };
const normCodigo = (c) => String(c).trim().toUpperCase();
export async function validarAdmin(codigo) { return (await huella(normCodigo(codigo))) === huellaVigente(); }
export const codigoPersonalizado = () => { try { return !!localStorage.getItem(LS_HUELLA); } catch (e) { return false; } };
export async function cambiarCodigoAdmin(actual, nuevo, repetido) {
  if (!(await validarAdmin(actual))) return { ok: false, msg: 'El código actual no es correcto.' };
  const n = normCodigo(nuevo);
  if (n.length < 8) return { ok: false, msg: 'El código nuevo debe tener al menos 8 caracteres.' };
  if (!/[A-Z]/.test(n) || !/[0-9]/.test(n)) return { ok: false, msg: 'El código nuevo debe tener letras y números.' };
  if (n !== normCodigo(repetido)) return { ok: false, msg: 'El código nuevo y su repetición no coinciden.' };
  if (n === normCodigo(actual)) return { ok: false, msg: 'El código nuevo debe ser distinto del actual.' };
  try { localStorage.setItem(LS_HUELLA, await huella(n)); } catch (e) { return { ok: false, msg: 'Este dispositivo no permite guardar el código.' }; }
  return { ok: true, msg: 'Código cambiado. Úsalo la próxima vez que entres como administrador.' };
}
export function restablecerCodigoAdmin() { try { localStorage.removeItem(LS_HUELLA); } catch (e) { /* sin almacenamiento */ } }
export const esAdmin = () => { try { return sessionStorage.getItem('adm') === '1'; } catch (e) { return false; } };
export const setAdmin = (v) => { try { v ? sessionStorage.setItem('adm', '1') : sessionStorage.removeItem('adm'); } catch (e) { /* sin sessionStorage */ } document.dispatchEvent(new Event('admin')); };

// ---- Calendario: fechas de recepción de anteproyectos y de sustentación o socialización.
// Lo que viene de fábrica está en datos/calendario.json; el administrador puede editarlo en este dispositivo y exportar el archivo para actualizar la aplicación.
export const TIPOS_FECHA = { anteproyectos: 'Recepción de anteproyectos', sustentacion: 'Sustentación o socialización' };
export async function getCalendario() { const local = await db.kv('calendario', null); return local || (await cargar('calendario').catch(() => [])); }
export const setCalendario = (l) => db.setKv('calendario', l);