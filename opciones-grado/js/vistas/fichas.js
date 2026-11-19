// Cartel de invitación a la socialización o sustentación (PNG horizontal, mismo diseño del cartel institucional Cartel_Sustentacion_horizontal_v2),
// a partir de los datos escritos a mano.
import { h, hoy, fmtFecha, sumarDias, diasEntre, descargar } from '../util.js';
import { opciones, getConfig } from '../datos.js';

const W0 = 770, H0 = 595, ESC = 2; // el cartel se dibuja en 770 x 595 y se exporta al doble
const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const COL = { noche: '#05111f', dorado: '#b5893c', azul: '#00549a', claro: '#e4ecf6', agua: '#12a89a', celeste: '#7fd6e0', gris: '#555' };
const hora12 = (t) => { if (!t) return ''; const [hh, mm] = t.split(':').map(Number); return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'a. m.' : 'p. m.'}`; };
const palabras = (t) => String(t).trim().split(/\s+/).filter(Boolean);
function lineas(c, texto, ancho) { const L = []; let a = ''; palabras(texto).forEach((p) => { const t = a ? a + ' ' + p : p; if (c.measureText(t).width > ancho && a) { L.push(a); a = p; } else a = t; }); if (a) L.push(a); return L; }
const cargarImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

export async function render() {
  const [ops, cfg] = await Promise.all([opciones(), getConfig()]);
  const [logo, orn] = await Promise.all([cargarImg('iconos/logo_fup.png'), cargarImg('iconos/cartel_ornamento.png')]);
  const f = (v = '', t = 'text', ph = '') => h('input', { class: 'i', type: t, value: v, placeholder: ph });
  const ta = (ph) => h('textarea', { class: 'i', rows: 3, placeholder: ph });
  const sel = (L) => h('select', { class: 'i' }, L.map((x) => h('option', x)));
  const E = {
    acto: sel(['Sustentación', 'Socialización']), tit: f('', 'text', 'Título del trabajo de grado'), sem: f('', 'text', 'Semillero, grupo, empresa o seminario (opcional)'),
    est: f('', 'text', 'Estudiante 1 y Estudiante 2'), dir: f(), cod: f('', 'text', 'Si no aplica, déjalo vacío'),
    res: ta('Resumen del trabajo en máximo 80 palabras: problema, qué se hizo y qué se espera lograr.'), clv: f('', 'text', 'Tres palabras clave, separadas por comas'),
    jur: ta('Un jurado por línea: Nombre — entidad o dependencia (externo)'), inv: f('', 'text', 'Nombre (cargo o dependencia); nombre (cargo)'),
    fec: f('', 'date'), h1: f('', 'time'), h2: f('', 'time'), lugar: f('', 'text', 'Sala o auditorio · Bloque'), mod: sel(['Presencial', 'Virtual', 'Mixta']), enl: f('', 'text', 'Enlace (si es virtual o mixta)'),
    opc: h('select', { class: 'i' }, ops.map((o) => h('option', { value: o.id }, o.nombre))), prog: f('Ingeniería Industrial · Facultad de Ingeniería', 'text'), cor: f('', 'email', 'correo de contacto'), pub: f('', 'date'),
  };
  const lienzo = h('canvas', { class: 'cartel', style: { maxWidth: '100%', height: 'auto' } }); const aviso = h('div'); const cuenta = h('div', { class: 'nota' });
  Object.values(E).forEach((x) => x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', dibujar));
  function dibujar() {
    lienzo.width = W0 * ESC; lienzo.height = H0 * ESC; const c = lienzo.getContext('2d'); c.scale(ESC, ESC); c.textBaseline = 'alphabetic';
    const T = (txt, x, y, px, { color = '#000', b = false, i = false, al = 'center' } = {}) => { c.font = `${i ? 'italic ' : ''}${b ? 'bold ' : ''}${px}px Arial, sans-serif`; c.fillStyle = color; c.textAlign = al; c.fillText(txt, x, y); };
    const ajustado = (txt, x, y, px, ancho, o) => { let p = px; c.font = `${o?.b ? 'bold ' : ''}${p}px Arial`; while (c.measureText(txt).width > ancho && p > 8) { p -= 1; c.font = `${o?.b ? 'bold ' : ''}${p}px Arial`; } T(txt, x, y, p, o); };
    c.fillStyle = '#fff'; c.fillRect(0, 0, W0, H0);
    // ornamento del borde derecho (se recorta para conservar su proporción)
    if (orn) { const dw = 73, dh = 530, sw = orn.height * dw / dh; c.drawImage(orn, orn.width - sw, 0, sw, orn.height, W0 - dw, 0, dw, dh); }
    // encabezado
    if (logo) c.drawImage(logo, 55, 30, 70, 70);
    T('FUNDACIÓN UNIVERSITARIA DE POPAYÁN', 143, 68, 19, { b: true, color: '#111', al: 'left' }); T(E.prog.value || 'Programa académico · Facultad', 143, 88, 12, { color: COL.gris, al: 'left' });
    c.fillStyle = COL.dorado; c.fillRect(28, 122, 669, 8);
    // columna izquierda (fecha, hora y lugar)
    c.fillStyle = COL.noche; c.fillRect(28, 130, 242, 397); const cx = 149;
    const acto = E.acto.value.toUpperCase();
    T('TE INVITAMOS A LA', cx, 161, 12, { color: '#fff' }); ajustado(acto, cx, 198, 34, 224, { b: true, color: '#fff' }); T('DE TRABAJO DE GRADO', cx, 220, 10.5, { b: true, color: COL.celeste });
    ajustado(ops.find((o) => o.id === E.opc.value)?.nombre || 'Opción de grado', cx, 247, 14, 224, { b: true, color: '#fff' });
    const d = E.fec.value ? new Date(E.fec.value + 'T00:00') : null;
    T('FECHA', cx, 276, 10, { b: true, color: COL.celeste }); T(d ? String(d.getDate()) : '--', cx, 332, 54, { b: true, color: '#fff' });
    T(d ? `${MESES[d.getMonth()]} ${d.getFullYear()} · ${DIAS[d.getDay()]}` : '[MES AÑO · DÍA]', cx, 362, 11, { b: true, color: '#fff' });
    T('HORA', cx, 385, 10, { b: true, color: COL.celeste }); T(E.h1.value ? hora12(E.h1.value) : '[Hora]', cx, 414, 29, { b: true, color: '#fff' });
    if (E.h2.value) T('hasta las ' + hora12(E.h2.value), cx, 438, 10, { color: '#fff' });
    T('LUGAR', cx, 462, 10, { b: true, color: COL.celeste }); ajustado(E.lugar.value || '[Lugar]', cx, 480, 15, 224, { b: true, color: '#fff' });
    const mod = E.mod.value + (E.enl.value && E.mod.value !== 'Presencial' ? ' · ' + E.enl.value : ''); ajustado(mod, cx, 498, 10, 224, { color: '#fff' });
    // columna derecha (el trabajo)
    const x0 = 274, x1 = 690, mx = (x0 + x1) / 2; let y = 135;
    const titulo = '“' + (E.tit.value || 'Título del trabajo de grado') + '”'; c.font = 'italic bold 20px Arial';
    let Lt = [titulo], pxT = 20; if (c.measureText(titulo).width > x1 - x0 - 16) { pxT = 16; c.font = 'italic bold 16px Arial'; Lt = lineas(c, titulo, x1 - x0 - 16); if (Lt.length > 2) { Lt = Lt.slice(0, 2); Lt[1] = Lt[1].replace(/\s*\S*$/, '…”'); } }
    const hb = Lt.length > 1 ? 44 : 29; c.fillStyle = COL.claro; c.fillRect(x0, y, x1 - x0, hb);
    Lt.forEach((l, k) => T(l, mx, y + (Lt.length > 1 ? 18 + k * 18 : 21), pxT, { b: true, i: true, color: COL.azul }));
    y += hb + 12; if (E.sem.value) { ajustado(E.sem.value, mx, y, 9, x1 - x0 - 16, { i: true, color: COL.gris }); } y += 14;
    T('PRESENTAN', mx, y, 8, { b: true, color: COL.dorado }); y += 20;
    ajustado(E.est.value || 'Estudiante 1 y Estudiante 2', mx, y, 17, x1 - x0 - 16, { b: true, color: '#111' }); y += 20;
    const dc = ['Director(a): ' + (E.dir.value || 'Nombre del director(a)')]; if (E.cod.value) dc.push('Codirector(a): ' + E.cod.value);
    ajustado(dc.join('   ·   '), mx, y, 12, x1 - x0 - 16, { color: '#222' }); y += 20;
    const banda = (t) => { c.fillStyle = COL.azul; c.fillRect(x0, y, x1 - x0, 17); T(t, mx, y + 12.5, 10.5, { b: true, color: '#fff' }); y += 17; };
    banda('¿DE QUÉ SE TRATA?'); y += 6; c.font = '12px Arial';
    const pal = palabras(E.res.value); const resumen = pal.slice(0, 80).join(' ');
    cuenta.textContent = `Resumen: ${pal.length} de 80 palabras` + (pal.length > 80 ? ' — se recorta en el cartel.' : '.'); cuenta.style.color = pal.length > 80 ? 'var(--mal, #b00020)' : '';
    const Lr = lineas(c, resumen || 'Resumen del trabajo en máximo 80 palabras: problema, qué se hizo y qué se espera lograr.', x1 - x0 - 6);
    Lr.slice(0, 6).forEach((l) => { y += 15; T(l, x0 + 3, y, 12, { color: '#222', al: 'left' }); }); y += 14;
    if (E.clv.value) { ajustado('Palabras clave: ' + E.clv.value, mx, y, 8.5, x1 - x0 - 16, { i: true, color: COL.gris }); y += 12; }
    y += 8; banda('JURADOS EVALUADORES'); y += 4;
    const J = E.jur.value.split(/\n/).map((x) => x.trim()).filter(Boolean); (J.length ? J : ['Nombre del jurado 1 — entidad o dependencia', 'Nombre del jurado 2 — entidad o dependencia']).slice(0, 4).forEach((l) => { y += 18; ajustado(l, x0 + 6, y, 11, x1 - x0 - 16, { color: '#222', al: 'left' }); });
    if (E.inv.value) { y += 22; ajustado('Invitados: ' + E.inv.value, mx, y, 9, x1 - x0 - 16, { i: true, color: COL.azul }); }
    // pie
    c.fillStyle = COL.agua; c.fillRect(28, 530, 672, 7); c.fillStyle = COL.noche; c.fillRect(28, 537, 672, 25);
    T('ENTRADA LIBRE  ·  Acompaña a nuestros futuros ingenieros', 364, 554, 12, { b: true, color: '#fff' });
    const pie = [E.cor.value || 'correo de contacto', '#FUPIngenieriaIndustrial #TrabajosDeGrado', 'Publicado el: ' + (E.pub.value ? fmtFecha(E.pub.value) : 'fecha')].join('   ·   ');
    ajustado(pie, 364, 576, 8.5, 660, { color: COL.gris });
    // plazo de publicación
    if (E.fec.value) { const lim = sumarDias(E.fec.value, -cfg.diasInvitacion); const dd = diasEntre(hoy(), lim);
      aviso.replaceChildren(h('div', { class: 'alerta ' + (dd < 0 ? 'mal' : dd <= cfg.avisoDias ? 'aviso' : 'info') }, `La invitación se publica a más tardar el ${fmtFecha(lim)} (${cfg.diasInvitacion} días antes del evento) ` + (dd < 0 ? '— ya pasó esa fecha.' : `— faltan ${dd} días.`)));
    } else aviso.replaceChildren();
  }
  const campos = [['Tipo de acto', E.acto], ['Opción de grado', E.opc], ['Título del trabajo', E.tit, 'ancho'], ['Semillero, grupo o empresa', E.sem, 'ancho'], ['Estudiantes', E.est, 'ancho'], ['Director', E.dir], ['Codirector', E.cod],
    ['Resumen (máx. 80 palabras)', E.res, 'ancho'], ['Palabras clave', E.clv, 'ancho'], ['Jurados evaluadores (uno por línea)', E.jur, 'ancho'], ['Invitados', E.inv, 'ancho'],
    ['Fecha', E.fec], ['Hora de inicio', E.h1], ['Hora de finalización', E.h2], ['Lugar', E.lugar], ['Modalidad', E.mod], ['Enlace (si es virtual)', E.enl, 'ancho'], ['Programa y facultad', E.prog, 'ancho'], ['Correo de contacto', E.cor], ['Fecha de publicación', E.pub]];
  const v = h('div', h('p', { class: 'nota' }, 'Genera el cartel de invitación (formato 17) con el diseño institucional. Escribe los datos del trabajo y descarga la imagen para la cartelera o las redes.'),
    h('div', { class: 'rej2' }, h('div', { class: 'tarj' }, h('div', { class: 'form' }, campos.map(([t, el, cl]) => h('label', { class: 'campo ' + (cl || '') }, t, el))), cuenta),
      h('div', lienzo, aviso, h('div', { class: 'fila', style: { marginTop: '8px' } }, h('button', { class: 'btn', onclick: () => lienzo.toBlob((b) => descargar('cartel_' + E.acto.value.toLowerCase() + '.png', b)) }, 'Descargar PNG')))));
  dibujar(); return v;
}
