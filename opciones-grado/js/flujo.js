// Reglas del proceso de opciones de grado: etapas por opción, revisiones, alertas, carga de docentes y calendario.
import { CONFIG_DEF, formatosActivos } from './datos.js';
import { hoy, diasEntre, diasHabilesEntre, sumarMeses, sumarDias, mesesEntre, uid } from './util.js';

const E = (id, nombre, desc, formatos = [], extra = {}) => ({ id, nombre, desc, formatos, ...extra });
const BASE_INV = () => [
  E('inscripcion', 'Inscripción y requisitos', 'Verifica créditos, promedio e integrantes y pide la designación del Director.', ['15']),
  E('anteproyecto', 'Anteproyecto', 'Se redacta con el Director (asesorías) y se obtiene su aval para enviarlo a evaluación.', ['01', '05', '16']),
  E('eval_ante', 'Evaluación del anteproyecto', 'Dos evaluadores distintos del Director lo evalúan. Máximo 2 revisiones.', ['14', '02'], { revision: 'anteproyecto' }),
  E('pago', 'Pago de la opción de grado', 'Se notifica el pago y el estudiante entrega el recibo a Admisiones.', []),
  E('desarrollo', 'Desarrollo del trabajo', 'Asesorías periódicas con el Director e informes semestrales.', ['16', '24']),
  E('doc_final', 'Documento final', 'Entrega del documento final con los dos avales del Director.', ['06', '07']),
  E('eval_final', 'Evaluación del documento final', 'Dos evaluadores. Máximo 3 revisiones; reunión Director–Evaluadores antes de la tercera si persisten observaciones críticas.', ['03', '09'], { revision: 'final' }),
  E('sustentacion', 'Sustentación', 'Se programa, se publica la invitación con 15 días de anticipación y se sustenta.', ['17', '04', '18'], { evento: true }),
  E('cierre', 'Cierre y entrega', 'Acta firmada, cesión de derechos y entrega a Biblioteca y Secretaría General.', ['12', '23']),
];
const añadir = (etapas, id, cods) => { const e = etapas.find((x) => x.id === id); if (e) e.formatos = [...new Set([...e.formatos, ...cods])]; return etapas; };

export function etapasDe(opId) {
  switch (opId) {
    case 'proyecto': return BASE_INV();
    case 'monografia': return añadir(BASE_INV(), 'anteproyecto', ['M01']);
    case 'caso': { const e = BASE_INV(); añadir(e, 'inscripcion', ['EC02']); añadir(e, 'anteproyecto', ['EC01', '22']); return e; }
    case 'emprendimiento': { const e = BASE_INV(); Object.assign(e[0], { desc: 'Verifica 80 % de créditos, promedio de 3.0, máximo 2 estudiantes y que la idea sea nueva (no un negocio con más de año y medio).' });
      Object.assign(e[1], { nombre: 'Anteproyecto: Estudio de Mercado', desc: 'El anteproyecto es el Estudio de Mercado, con sustento estadístico y técnico de la viabilidad de la idea.' });
      Object.assign(e[5], { nombre: 'Documento final y producto mínimo viable', desc: 'Documento con los cuatro estudios (Técnico, Administrativo y Legal, Financiero, Social y Ambiental) y un Producto Mínimo Viable demostrable.', formatos: ['06', '07', 'E01'] }); return e; }
    case 'trayectoria': return [
      E('vinculacion', 'Vinculación al semillero', 'Ingreso tras el 30 % de créditos y permanencia mínima de 1,5 años en un proyecto avalado (SIDI/CIDI).', ['T01']),
      E('anteproyecto', 'Formalización y anteproyecto', 'Al llegar al 80 % de créditos formaliza la opción y presenta el anteproyecto (alcance individual y cronograma).', ['15', '01', '05', '16']),
      E('eval_ante', 'Evaluación del anteproyecto', 'Dos evaluadores. Máximo 2 revisiones.', ['14', '02'], { revision: 'anteproyecto' }),
      E('pago', 'Pago de la opción de grado', 'Pago de la opción de grado ante Admisiones.', []),
      E('producto', 'Producto de la Trayectoria', 'Producto MinCiencias avalado (o acta de aval del SIDI/CIDI) en lugar del informe técnico.', ['T02', '16', '24', '07']),
      E('eval_producto', 'Evaluación del producto', 'Dos evaluadores evalúan el producto.', ['03'], { revision: 'producto' }),
      E('socializacion', 'Socialización', 'Acto formativo de reconocimiento al proceso; ficha de invitación con 15 días de anticipación.', ['17', '04', '18', '21'], { evento: true }),
      E('cierre', 'Cierre y entrega', 'Acta, cesión de derechos y entrega a Biblioteca.', ['12', '23']),
    ];
    case 'practica_ext': return [
      E('inscripcion', 'Inscripción y requisitos', 'Verifica 100 % de créditos, promedio de 3.5, opción individual y que sea la misma empresa del semestre de industria.', ['15']),
      E('anteproyecto', 'Anteproyecto', 'Se radica un mes antes de terminar el semestre de industria. Debe enfocarse en implementación, estandarización o aplicación, no en un diagnóstico.', ['01', '05', '16']),
      E('eval_ante', 'Evaluación del anteproyecto', 'Se asignan evaluadores. Máximo 2 revisiones.', ['14', '02'], { revision: 'anteproyecto' }),
      E('inicio', 'Inicio de la práctica', 'Acta de compromiso con la empresa, afiliación a la ARL durante todo el periodo y convenio vigente.', ['P01', '08', '11', '22']),
      E('desarrollo', 'Desarrollo de la práctica', 'Mínimo 24 semanas a 40 h semanales. Informes de avance.', ['10', '16', '24']),
      E('informe_final', 'Informe técnico final', 'Informe técnico con el aval del Director y la certificación final de la empresa.', ['06', '07']),
      E('eval_tripartita', 'Evaluación tripartita', 'Director, Coordinador Profesional de la empresa y Unidad Académica (Art. 42).', ['P02']),
      E('sustentacion', 'Sustentación', 'Sustentación ante jurado.', ['17', '04', '18'], { evento: true }),
      E('cierre', 'Cierre y entrega', 'Cesión de derechos y entrega a Biblioteca.', ['12', '23']),
    ];
    case 'pasantia': return [
      E('inscripcion', 'Inscripción y requisitos', 'Propuesta aprobada por el Comité y la entidad, con convenio.', ['15']),
      E('inicio', 'Inicio de la pasantía', 'Afiliación a la ARL y datos de la empresa.', ['08', '11']),
      E('desarrollo', 'Desarrollo', 'Dos informes parciales (Art. 45).', ['10', '16', '24']),
      E('informe_final', 'Informe final', 'Informe final con aval del Director.', ['06']),
      E('eval_tripartita', 'Evaluación tripartita', 'Acta del Art. 42.', ['P02']),
      E('socializacion', 'Socialización', 'Socialización pública (Art. 46).', ['17', '18'], { evento: true }),
      E('cierre', 'Cierre y entrega', 'Cesión de derechos y entrega.', ['12', '23']),
    ];
    case 'seminario_inv': return [
      E('inscripcion', 'Inscripción', 'Verifica 90 % de créditos, promedio de 3.5 y máximo 2 estudiantes por equipo.', ['15']),
      E('anteproyecto', 'Anteproyecto', 'Resumen del anteproyecto (objetivos y metodología) con concepto en 15 días: Aprobado, No aprobado o Recomendaciones.', ['01']),
      E('modulos', 'Módulos del seminario', 'Cumplir el 100 % de objetivos y actividades de cada módulo.', ['SI01', '16']),
      E('producto', 'Artículo científico', 'Artículo aprobado o aceptado para publicación, o recibido en una revista externa con el visto bueno del tutor. Sin informe técnico.', ['SI02', '24']),
      E('evaluacion', 'Evaluación', 'Aprobado / No aprobado.', ['SI01']),
      E('socializacion', 'Socialización o sustentación', 'Acto final ante jurados.', ['17', '04', '18'], { evento: true }),
      E('cierre', 'Cierre y entrega', 'Cesión de derechos y entrega.', ['12', '23']),
    ];
    case 'seminario_int': return [
      E('inscripcion', 'Inscripción y aval', 'Convenio vigente y aval de Internacionalización.', ['15', 'SN01']),
      E('seminario', 'Seminario en el exterior', 'Asiste y reúne la certificación de la universidad.', ['16']),
      E('sistematizacion', 'Sistematización de la experiencia', 'Documento de mínimo 10 hojas.', ['06', '07']),
      E('evaluacion', 'Evaluación', 'Revisión de la sistematización y de la certificación.', ['03']),
      E('cierre', 'Cierre y entrega', 'Cesión de derechos y entrega.', ['12', '23']),
    ];
    case 'exencion': return [
      E('solicitud', 'Postulación', '100 % de créditos, promedio acumulado ≥ 4.5 y récord sin reprobadas, habilitaciones, cursos repetidos ni sanciones. El estudiante pide la certificación de calificaciones y radica su postulación.', ['15', 'X01']),
      E('constancia', 'Constancia de la dirección de programa', 'Constancia motivada (Art. 63).', []),
      E('documento', 'Documento final', 'Se homologa el documento final del Semestre de Industria o se entrega la Ficha Resumen Final Estandarizada.', ['X02']),
      E('decision', 'Decisión del Comité', 'Aval del Comité y del Consejo Académico.', []),
      E('cierre', 'Cierre y entrega', 'Paz y salvo y entrega.', ['12', '23']),
    ];
    default: return BASE_INV();
  }
}
export const maxRevisiones = (clave, cfg) => ({ anteproyecto: cfg.revAnte, final: cfg.revFinal, producto: cfg.revProducto }[clave] ?? 2);

// ---------------------------------------------------------------- expediente
export function nuevoExpediente(opId, d = {}) {
  const ahora = new Date().toISOString();
  return {
    id: uid(), opcion: opId, titulo: d.titulo || '', estudiantes: d.estudiantes || [{ nombre: '', codigo: '', correo: '', creditos: null, promedio: null }],
    director: d.director || '', codirector: d.codirector || '', evaluadores: d.evaluadores || ['', ''], empresa: d.empresa || '', linea: d.linea || '',
    facultad: 'Facultad de Ingeniería y Arquitectura', programa: 'Ingeniería Industrial', etapa: 0, estado: 'activo', creado: ahora, actualizado: ahora, fechaInicio: hoy(),
    inicioDesarrollo: null, prorroga: null, formatos: {}, revisiones: {}, bitacora: [], documentos: [], evento: null, pago: 'pendiente', historial: [], ejemplo: !!d.ejemplo,
    permanenciaDesde: d.permanenciaDesde || null, practica: d.practica || null,
  };
}
export const tocar = (exp) => { exp.actualizado = new Date().toISOString(); return exp; };
export function evento(exp, tipo, texto, autor = {}, extra = {}) {
  exp.bitacora.push({ id: uid(), fecha: hoy(), creado: new Date().toISOString(), tipo, texto, autor: autor.nombre || '', rol: autor.rol || '', ...extra }); return tocar(exp);
}
export const consolidado = (conceptos) => {
  const c = conceptos.filter(Boolean); if (!c.length) return '';
  return c.every((x) => x === c[0]) ? c[0] : 'Los conceptos difieren: decide el Comité Curricular';
};
export function estadoRevision(exp, clave, max) {
  const revs = (exp.revisiones[clave] || []).slice().sort((a, b) => a.n - b.n);
  const ult = revs[revs.length - 1];
  const c = ult ? (ult.decisionComite || ult.consolidado) : '';
  return { revs, n: revs.length, max, ultimo: c, aprobado: c.startsWith('Aprobado'), rechazado: c === 'Rechazado', pendienteComite: c.startsWith('Los conceptos difieren'), siguiente: revs.length + 1,
    puedeOtra: !c.startsWith('Aprobado') && c !== 'Rechazado' && revs.length < max };
}
// Valida y registra una revisión. conceptos: [{evaluador, concepto}]
export function registrarRevision(exp, clave, datos, max) {
  const est = estadoRevision(exp, clave, max);
  const [e1, e2] = exp.evaluadores;
  if (!e1 || !e2) return { ok: false, error: 'Primero designa los dos evaluadores (formato 14).' };
  if ([e1, e2].some((e) => [exp.director, exp.codirector].filter(Boolean).map((x) => x.trim().toLowerCase()).includes(e.trim().toLowerCase()))) return { ok: false, error: 'El Director no puede ser Evaluador del mismo trabajo (Art. 7, par.).' };
  if (e1.trim().toLowerCase() === e2.trim().toLowerCase()) return { ok: false, error: 'Los dos evaluadores deben ser personas distintas.' };
  if (est.aprobado || est.rechazado) return { ok: false, error: 'La evaluación ya tiene concepto definitivo.' };
  if (est.pendienteComite) return { ok: false, error: 'Los conceptos difieren: primero registra la decisión del Comité.' };
  if (est.n >= max) return { ok: false, error: `Ya se hicieron las ${max} revisiones permitidas.` };
  const cons = consolidado(datos.conceptos.map((x) => x.concepto));
  if (!cons) return { ok: false, error: 'Elige el concepto de cada evaluador.' };
  const n = est.n + 1;
  if (n === max && cons === 'Segunda revisión') return { ok: false, error: `La revisión ${max} es la última: el concepto debe ser definitivo (Aprobado o Rechazado).` };
  (exp.revisiones[clave] ||= []).push({ id: uid(), n, fecha: datos.fecha || hoy(), conceptos: datos.conceptos, obs: datos.obs || '', consolidado: cons });
  tocar(exp);
  return { ok: true, n, consolidado: cons, reunion: clave === 'final' && n === max - 1 && cons === 'Segunda revisión' };
}

// ---------------------------------------------------------------- plazos y alertas
export function vencimiento(exp, cfg = CONFIG_DEF) {
  if (exp.prorroga && exp.prorroga.nueva) return exp.prorroga.nueva;
  if (exp.vencimiento) return exp.vencimiento;
  return exp.inicioDesarrollo ? sumarMeses(exp.inicioDesarrollo, cfg.plazoMeses) : null;
}
export function ultimaAsesoria(exp) { const a = exp.bitacora.filter((b) => b.tipo === 'asesoria').map((b) => b.fecha).sort(); return a[a.length - 1] || null; }
export const horasAsesoria = (exp) => exp.bitacora.filter((b) => b.tipo === 'asesoria').reduce((s, b) => s + (Number(b.horas) || 0), 0);
export function alertasDe(exp, cfg = CONFIG_DEF, op = null) {
  const A = []; const t = hoy(); const et = etapasDe(exp.opcion)[exp.etapa];
  if (exp.estado !== 'activo') return A;
  const venc = vencimiento(exp, cfg);
  if (venc && exp.opcion !== 'trayectoria') {
    const d = diasEntre(t, venc);
    if (d < 0) A.push({ nivel: 'mal', texto: `Plazo vencido hace ${-d} días${exp.prorroga ? ' (ya usó la prórroga)' : ': solo cabía solicitarla antes del vencimiento (Art. 14)'}.`, fecha: venc });
    else if (d <= 30) A.push({ nivel: 'aviso', texto: `El plazo vence en ${d} días (${venc}).${exp.prorroga ? '' : ' La prórroga es única y debe pedirse antes.'}`, fecha: venc });
  }
  const ua = ultimaAsesoria(exp);
  if (['desarrollo', 'producto', 'anteproyecto', 'modulos'].includes(et?.id)) {
    const base = ua || exp.fechaInicio; const d = diasEntre(base, t);
    if (d > cfg.diasSinAsesoria) A.push({ nivel: 'aviso', texto: `Hace ${d} días sin sesión de asesoría registrada.` });
  }
  // respuesta pendiente: avance subido por el estudiante sin respuesta posterior
  const resp = exp.bitacora.filter((b) => ['comentario', 'observacion', 'asesoria', 'revision'].includes(b.tipo) && b.rol !== 'estudiante').map((b) => b.creado || b.fecha).sort();
  const avances = exp.documentos.filter((d) => d.autorRol === 'estudiante').map((d) => d.creado).sort();
  const ultAv = avances[avances.length - 1];
  if (ultAv && !resp.some((r) => r > ultAv)) {
    const hab = diasHabilesEntre(ultAv.slice(0, 10), t);
    if (hab > cfg.slaHabiles) A.push({ nivel: 'aviso', texto: `El último documento subido hace ${hab} días hábiles no tiene respuesta del Director o los Evaluadores (límite ${cfg.slaHabiles}).` });
  }
  if (et?.evento && exp.evento?.fecha) {
    const lim = sumarDias(exp.evento.fecha, -cfg.diasInvitacion); const d = diasEntre(t, lim);
    if (!exp.evento.invitacionPublicada) {
      if (d < 0 && diasEntre(t, exp.evento.fecha) >= 0) A.push({ nivel: 'mal', texto: `La invitación debía publicarse antes del ${lim} (${cfg.diasInvitacion} días antes del evento).`, fecha: lim });
      else if (d <= cfg.avisoDias) A.push({ nivel: 'aviso', texto: `Publicar la invitación a más tardar el ${lim}.`, fecha: lim });
    }
  }
  if (et?.evento && !exp.evento?.fecha && exp.etapa > 0) A.push({ nivel: 'info', texto: 'Falta registrar la fecha del evento final.' });
  if (['inicio', 'desarrollo'].includes(et?.id) && ['practica_ext', 'pasantia'].includes(exp.opcion)) {
    if (!['entregado', 'aprobado'].includes(exp.formatos['08']?.estado)) A.push({ nivel: 'mal', texto: 'Falta la verificación de la ARL (formato 08): sin ARL no se autoriza el inicio de la práctica.' });
    const p = exp.practica;
    if (exp.opcion === 'practica_ext' && p?.inicio && p?.fin) {
      const sem = diasEntre(p.inicio, p.fin) / 7;
      if (sem < cfg.semanasPractica) A.push({ nivel: 'mal', texto: `La práctica dura ${sem.toFixed(1)} semanas; el mínimo es ${cfg.semanasPractica}. Se reconduce a Estudio de Caso.` });
    }
  }
  if (exp.opcion === 'trayectoria' && et?.id === 'vinculacion' && exp.permanenciaDesde) {
    const m = mesesEntre(exp.permanenciaDesde, t);
    A.push(m >= cfg.permanenciaMeses ? { nivel: 'ok', texto: `Permanencia de ${m} meses (mínimo ${cfg.permanenciaMeses}).` } : { nivel: 'info', texto: `Lleva ${m} meses en el proyecto; faltan ${cfg.permanenciaMeses - m} para el mínimo.` });
  }
  const rv = et?.revision ? estadoRevision(exp, et.revision, maxRevisiones(et.revision, cfg)) : null;
  if (rv?.pendienteComite) A.push({ nivel: 'aviso', texto: 'Los evaluadores no coinciden: falta la decisión del Comité Curricular.' });
  if (rv?.rechazado) A.push({ nivel: 'mal', texto: 'Concepto «Rechazado»: el estudiante debe generar una nueva propuesta.' });
  return A;
}
export const progreso = (exp) => { const n = etapasDe(exp.opcion).length; return exp.estado === 'cerrado' ? 1 : Math.min(1, exp.etapa / (n - 1 || 1)); };
export const faltantes = (exp, etapa) => etapa.formatos.filter((c) => (!formatosActivos.set || formatosActivos.set.has(c)) && !['entregado', 'aprobado'].includes(exp.formatos[c]?.estado));

// ---------------------------------------------------------------- docentes
export function cargaDocentes(expedientes, docentes, cfg = CONFIG_DEF) {
  const m = new Map();
  const fila = (n) => { const k = n.trim(); if (!k) return null; if (!m.has(k.toLowerCase())) m.set(k.toLowerCase(), { nombre: k, dir: 0, codir: 0, eval: 0, total: 0 }); return m.get(k.toLowerCase()); };
  docentes.forEach((d) => fila(d.nombre));
  expedientes.filter((e) => e.estado === 'activo').forEach((e) => {
    fila(e.director || '') && (fila(e.director).dir++);
    if (e.codirector) fila(e.codirector).codir++;
    (e.evaluadores || []).filter(Boolean).forEach((x) => { fila(x).eval++; });
  });
  return [...m.values()].map((f) => { f.total = f.dir + f.codir + f.eval; f.sem = f.total >= cfg.topeDocente ? 'r' : f.total >= cfg.amarilloDesde ? 'a' : 'v'; return f; }).sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
}
export function sugerirDocentes(docentes, cargas, linea, excluir = []) {
  const ex = excluir.filter(Boolean).map((x) => x.trim().toLowerCase());
  return docentes.filter((d) => !ex.includes(d.nombre.trim().toLowerCase())).map((d) => {
    const c = cargas.find((x) => x.nombre.toLowerCase() === d.nombre.trim().toLowerCase()) || { total: 0, sem: 'v' };
    const afin = linea && d.linea && d.linea.toLowerCase().includes(linea.toLowerCase());
    return { ...d, total: c.total, sem: c.sem, afin: !!afin };
  }).sort((a, b) => (b.afin - a.afin) || ({ v: 0, a: 1, r: 2 }[a.sem] - { v: 0, a: 1, r: 2 }[b.sem]) || a.total - b.total);
}

// ---------------------------------------------------------------- requisitos (verificador, igual que el formato 15)
export function verificar(op, est, nIntegrantes, extra = {}) {
  const r = op.requisitos, out = [];
  const ok = (texto, estado, detalle = '') => out.push({ texto, estado, detalle });
  if (est.creditos == null || est.creditos === '') ok('Créditos aprobados', 'pend', `Se exige ${Math.round(r.creditos * 100)} %.`);
  else ok('Créditos aprobados', est.creditos >= r.creditos ? 'ok' : 'mal', `Tiene ${Math.round(est.creditos * 100)} %; se exige ${Math.round(r.creditos * 100)} %.`);
  if (r.promedio != null) {
    if (est.promedio == null || est.promedio === '') ok('Promedio acumulado', 'pend', `Mínimo ${r.promedio}.`);
    else ok('Promedio acumulado', est.promedio >= r.promedio ? 'ok' : 'mal', `Tiene ${est.promedio}; mínimo ${r.promedio}.`);
  } else ok('Promedio acumulado', 'ok', 'Sin promedio mínimo.');
  if (r.integrantes != null) ok('Número de integrantes', nIntegrantes <= r.integrantes ? 'ok' : 'mal', `Máximo ${r.integrantes}.`);
  else ok('Número de integrantes', 'pend', 'Sin límite fijado.');
  if (op.id === 'trayectoria') {
    if (extra.ingreso != null) ok('Ingreso al semillero tras el ciclo básico', extra.ingreso >= r.ingreso ? 'ok' : 'mal', `Ingresó con ${Math.round(extra.ingreso * 100)} %; se exige ${Math.round(r.ingreso * 100)} %.`);
    if (extra.meses != null) ok('Permanencia en el proyecto', extra.meses >= r.meses_permanencia ? 'ok' : 'mal', `${extra.meses} meses; mínimo ${r.meses_permanencia}.`);
  }
  return out;
}

// ---------------------------------------------------------------- calendario
export function eventosDe(expedientes, cfg = CONFIG_DEF) {
  const L = [];
  expedientes.filter((e) => e.estado === 'activo').forEach((e) => {
    const t = e.titulo || '(sin título)'; const v = vencimiento(e, cfg);
    if (v && e.opcion !== 'trayectoria') L.push({ fecha: v, tipo: 'Vencimiento', exp: e, texto: `Vence el plazo: ${t}` });
    if (e.evento?.fecha) {
      L.push({ fecha: e.evento.fecha, tipo: 'Evento final', exp: e, texto: `${e.evento.tipo || 'Evento'}: ${t}${e.evento.lugar ? ' · ' + e.evento.lugar : ''}` });
      if (!e.evento.invitacionPublicada) L.push({ fecha: sumarDias(e.evento.fecha, -cfg.diasInvitacion), tipo: 'Publicar invitación', exp: e, texto: `Publicar invitación: ${t}` });
    }
    if (e.practica?.fin) L.push({ fecha: e.practica.fin, tipo: 'Fin de práctica', exp: e, texto: `Termina la práctica: ${t}` });
  });
  return L.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ---------------------------------------------------------------- unir expedientes (importar paquete de otro dispositivo)
export function unirExpedientes(local, remoto) {
  if (!local) return { exp: remoto, nuevo: true, cambios: 0 };
  const base = local.actualizado >= remoto.actualizado ? local : remoto; const otro = base === local ? remoto : local; let cambios = 0;
  const m = structuredClone(base);
  const unir = (a, b, clave = 'id') => { const ids = new Set(a.map((x) => x[clave])); b.forEach((x) => { if (!ids.has(x[clave])) { a.push(x); cambios++; } }); return a; };
  unir(m.bitacora, otro.bitacora); unir(m.documentos, otro.documentos);
  for (const k of Object.keys(otro.revisiones || {})) { m.revisiones[k] = unir(m.revisiones[k] || [], otro.revisiones[k]); m.revisiones[k].sort((x, y) => x.n - y.n); }
  for (const [c, v] of Object.entries(otro.formatos || {})) if (!m.formatos[c] || (v.fecha || '') > (m.formatos[c].fecha || '')) { m.formatos[c] = v; }
  unir(m.historial, otro.historial || []);
  m.bitacora.sort((x, y) => (x.creado || x.fecha).localeCompare(y.creado || y.fecha));
  return { exp: m, nuevo: false, cambios };
}
