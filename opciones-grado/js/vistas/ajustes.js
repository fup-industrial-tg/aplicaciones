import { h, toast, confirmar, descargar, leerComoTexto, tamaño, hoy, getTema, setTema } from '../util.js';
import { db, exportarTodo, importarTodo } from '../db.js';
import { getConfig, setConfig, CONFIG_DEF, validarAdmin, esAdmin, setAdmin, cambiarCodigoAdmin, restablecerCodigoAdmin, codigoPersonalizado } from '../datos.js';

const PARAMS = [['revAnte', 'Revisiones máximas del anteproyecto'], ['revFinal', 'Revisiones máximas del documento final'], ['revProducto', 'Revisiones del producto (Trayectoria)'],
  ['plazoMeses', 'Plazo máximo (meses)'], ['prorrogaDias', 'Duración máxima de la prórroga (días)'], ['topeDocente', 'Carga que pone en rojo a un docente'], ['amarilloDesde', 'Carga que pone en amarillo'],
  ['slaHabiles', 'Días hábiles para responder un avance'], ['avisoDias', 'Aviso previo (días)'], ['diasInvitacion', 'Días de anticipación de la invitación'], ['diasSinAsesoria', 'Días sin asesoría para alertar'],
  ['semanasPractica', 'Semanas mínimas de la práctica extendida'], ['horasSemana', 'Horas semanales de la práctica'], ['permanenciaMeses', 'Permanencia mínima en Trayectoria (meses)']];

export async function render({ ctx }) {
  const cfg = await getConfig(); const adm = esAdmin();
  const campos = PARAMS.map(([k, t]) => ({ k, el: h('input', { class: 'i', type: 'number', min: 0, value: cfg[k], disabled: !adm }), t }));
  const codigo = h('input', { class: 'i', type: 'password', placeholder: 'Código del administrador', autocomplete: 'off' });
  const entrar = async () => { if (await validarAdmin(codigo.value)) { setAdmin(true); toast('Modo administrador activado', 'ok'); ctx.refrescar(); } else toast('Código incorrecto.', 'mal'); };
  codigo.addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
  const arch = h('input', { type: 'file', accept: '.json', style: { display: 'none' }, onchange: async (e) => { try { const o = JSON.parse(await leerComoTexto(e.target.files[0])); await importarTodo(o, false); toast('Respaldo restaurado.', 'ok'); ctx.refrescar(); } catch (er) { toast('No se pudo importar: ' + er.message, 'mal'); } } });
  const ojo = (inp) => h('div', { class: 'fila', style: { flexWrap: 'nowrap', gap: '6px' } }, inp,
    h('button', { type: 'button', class: 'btn peq gris', title: 'Mostrar u ocultar lo que escribes', onclick: (e) => { const ver = inp.type === 'password'; inp.type = ver ? 'text' : 'password'; e.currentTarget.textContent = ver ? 'Ocultar' : 'Mostrar'; } }, 'Mostrar'));
  const pw = (t) => h('input', { class: 'i', type: 'password', placeholder: t, autocomplete: 'off' });
  const cAct = pw('Código actual'), cNue = pw('Código nuevo (mín. 8, con letras y números)'), cRep = pw('Repite el código nuevo');
  const cambiar = async () => { const r = await cambiarCodigoAdmin(cAct.value, cNue.value, cRep.value); toast(r.msg, r.ok ? 'ok' : 'mal'); if (r.ok) ctx.refrescar(); };
  const sec = (t, ...c) => h('section', { class: 'tarj', style: { marginBottom: '12px' } }, h('h3', t), ...c);
  return h('div',
    sec('Manual de uso', h('p', { class: 'nota' }, 'Guía completa de esta aplicación: qué hace cada sección, paso a paso. Después de abrirlo una vez, queda disponible sin conexión.'),
      h('div', { class: 'fila' }, h('a', { class: 'btn', href: 'manual/Manual_de_Uso_Opciones_de_Grado.pdf', target: '_blank', rel: 'noopener' }, 'Abrir el manual (PDF)'),
        h('a', { class: 'btn sec', href: 'manual/Manual_de_Uso_Opciones_de_Grado.pdf', download: 'Manual_de_Uso_Opciones_de_Grado.pdf' }, 'Descargar'))),
    sec('Apariencia', h('p', { class: 'nota' }, 'Claro es el tema por defecto. También puedes cambiarlo con el botón de la barra superior. Se recuerda solo en este dispositivo.'),
      h('div', { class: 'fila' }, [['claro', '☀ Claro'], ['oscuro', '🌙 Oscuro'], ['auto', 'Automático (el del dispositivo)']].map(([v, t]) => h('button', { class: 'btn ' + (getTema() === v ? '' : 'sec'), onclick: () => { setTema(v); ctx.refrescar(); } }, t)))),
    sec('Administrador', adm
      ? h('div', h('p', { class: 'nota' }, 'Modo administrador activo: puedes editar las fechas del calendario y los parámetros del proceso. Se desactiva al cerrar la aplicación.'), h('button', { class: 'btn sec', onclick: () => { setAdmin(false); ctx.refrescar(); } }, 'Salir del modo administrador'))
      : h('div', h('p', { class: 'nota' }, 'Solo el administrador puede editar el calendario y los parámetros del proceso. Escribe el código para entrar.'), h('div', { class: 'fila' }, ojo(codigo), h('button', { class: 'btn sec', onclick: entrar }, 'Entrar como administrador')))),
    adm ? sec('Cambiar el código del administrador', h('p', { class: 'nota' }, 'El código nuevo se guarda solo en este dispositivo; en otro equipo sigue valiendo el código con el que se instaló la aplicación. Si lo olvidas, reinstala la aplicación o borra sus datos y vuelve a valer el código original.'),
      h('div', { class: 'form' }, h('label', { class: 'campo' }, 'Código actual', ojo(cAct)), h('label', { class: 'campo' }, 'Código nuevo', ojo(cNue)), h('label', { class: 'campo' }, 'Repite el código nuevo', ojo(cRep))),
      h('div', { class: 'fila', style: { marginTop: '10px' } }, h('button', { class: 'btn', onclick: cambiar }, 'Cambiar código'),
        codigoPersonalizado() ? h('button', { class: 'btn gris', onclick: async () => { if (await confirmar('Se volverá a usar el código con el que se instaló la aplicación.', 'Restablecer')) { restablecerCodigoAdmin(); toast('Código original restablecido', 'ok'); ctx.refrescar(); } } }, 'Volver al código original') : null)) : null,
    sec('Parámetros del proceso', h('p', { class: 'nota' }, adm ? 'Puedes modificar estos valores; se guardan en este dispositivo.' : 'Estos valores solo los puede cambiar el administrador.'),
      h('div', { class: 'form' }, campos.map((c) => h('label', { class: 'campo' }, c.t, c.el))),
      adm ? h('div', { style: { marginTop: '10px' } }, h('div', { class: 'fila' },
        h('button', { class: 'btn', onclick: async () => { const n = {}; campos.forEach((c) => { n[c.k] = Number(c.el.value); }); await setConfig(n); toast('Parámetros guardados', 'ok'); } }, 'Guardar parámetros'),
        h('button', { class: 'btn gris', onclick: async () => { await setConfig({ ...CONFIG_DEF }); toast('Valores iniciales restaurados', 'ok'); ctx.refrescar(); } }, 'Restaurar valores iniciales'))) : null),
    adm ? sec('Respaldo de los cambios de este dispositivo', h('p', { class: 'nota' }, 'Guarda en un archivo las fechas del calendario, los parámetros y los formatos que modificaste aquí, o restáuralos.'),
      h('div', { class: 'fila' }, h('button', { class: 'btn', onclick: async () => { descargar(`respaldo_opciones_grado_${hoy()}.json`, JSON.stringify(await exportarTodo(true)), 'application/json'); } }, 'Descargar respaldo'),
        h('button', { class: 'btn sec', onclick: () => arch.click() }, 'Restaurar desde un respaldo'), arch),
      h('div', { class: 'sep' }), h('button', { class: 'btn mal', onclick: async () => { if (await confirmar('Se borrarán los cambios guardados en este dispositivo (fechas, parámetros y formatos propios). Haz antes un respaldo.', 'Borrar')) { for (const s of ['expedientes', 'docentes', 'blobs', 'kv']) await db.vaciar(s); toast('Cambios borrados', 'ok'); ctx.refrescar(); } } }, 'Borrar los cambios de este dispositivo')) : null,
    h('p', { class: 'nota' }, 'Opciones de Grado · Ingeniería Industrial · FUP. Pasantía de Claudia Ximena Franco Velarde. Versión 1.4.6.'));
}