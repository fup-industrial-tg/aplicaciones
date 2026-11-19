import { h, norm, modal, confirmar, toast, uid, leerComoBuffer } from '../util.js';
import { db } from '../db.js';
import { opciones, formatos as cargarFormatos, getAjustesFormatos, setAjustesFormatos } from '../datos.js';
import { enlacesFormato } from './opciones.js';


export async function render({ ctx }) {
  const [ops, fmts, todos] = await Promise.all([opciones(), cargarFormatos(), cargarFormatos(true)]);
  const q = h('input', { class: 'i', type: 'search', placeholder: 'Buscar formato…', oninput: () => pintar() });
  const so = h('select', { class: 'i', onchange: () => pintar() }, [h('option', { value: '' }, 'Todas las opciones'), ...ops.map((o) => h('option', { value: o.id }, o.nombre))]);
  const st = h('select', { class: 'i', onchange: () => pintar() }, ['', ...new Set(fmts.map((f) => f.etapa))].map((x) => h('option', { value: x }, x || 'Todas las etapas')));
  const tp = h('select', { class: 'i', onchange: () => pintar() }, [['', 'Unificados e individuales'], ['Unificado', 'Unificados'], ['Individual', 'Individuales']].map(([v, t]) => h('option', { value: v }, t)));
  const cuerpo = h('tbody'); const cont = h('span', { class: 'nota' });
  const iconos = (f) => (f.opciones.length === ops.length ? 'Todas' : f.opciones.map((id) => ops.find((o) => o.id === id)?.icono).join(' '));
  function pintar() {
    const L = fmts.filter((f) => (!so.value || f.opciones.includes(so.value)) && (!st.value || f.etapa === st.value) && (!tp.value || f.tipo === tp.value) && (!q.value || norm(f.codigo + ' ' + f.nombre + ' ' + f.quien).includes(norm(q.value))));
    cont.textContent = L.length + ' formatos';
    cuerpo.replaceChildren(...L.map((f) => h('tr', h('td', h('b', f.codigo)), h('td', f.nombre, h('div', { class: 'nota' }, f.tipo + ' · ' + f.etapa + ' · ' + f.quien)), h('td', { class: 'ocultar-m' }, f.quien),
      h('td', { class: 'ocultar-m' }, iconos(f)), h('td', enlacesFormato(f)))));
  }
  const tab1 = h('div',
    h('details', { class: 'd' }, h('summary', 'Cómo se diligencian los formatos'), h('div', h('ul', { class: 'l' },
      h('li', 'Celda ', h('b', 'crema con texto azul'), ': se escribe. Celda ', h('b', 'gris'), ': se calcula sola. Azul claro: etiqueta. ', h('b', 'Amarillo'), ': valor sugerido por el programa.'),
      h('li', 'Cada formato tiene un panel al inicio que dice cuántos campos obligatorios faltan y si está «Listo para entregar».'),
      h('li', 'Las hojas están protegidas: solo se escriben las celdas crema. Trabaja siempre sobre una copia («Guardar como»).'),
      h('li', 'Los formatos 01 a 04 usan el filtro de Excel (flecha ▼ de la celda A12) para elegir la opción de grado.'))),
    ),
    h('div', { class: 'tarj', style: { margin: '8px 0' } }, h('div', { class: 'form' }, h('label', { class: 'campo' }, 'Buscar', q), h('label', { class: 'campo' }, 'Opción', so), h('label', { class: 'campo' }, 'Etapa', st), h('label', { class: 'campo' }, 'Tipo', tp))),
    h('div', { class: 'fila', style: { margin: '6px 0' } }, cont),
    h('div', { class: 'tabla-w' }, h('table', { class: 't' }, h('thead', h('tr', ['N.º', 'Formato', 'Quién lo diligencia', 'Opciones', 'Descargar'].map((x, i) => h('th', { class: [2, 3].includes(i) ? 'ocultar-m' : '' }, x)))), cuerpo)));

  // ------------------------------------------------------------ Administrar: quitar, editar, reemplazar o agregar formatos (solo en este dispositivo)
  async function guardarArchivos(files) { // guarda los archivos elegidos en la base local y devuelve [{nombre, blob}]
    const r = [];
    for (const f of files) { const id = 'fmt_' + uid(); await db.guardar('blobs', { id, tipo: f.type || 'application/octet-stream', nombre: f.name, datos: await leerComoBuffer(f) }); r.push({ nombre: f.name, blob: id }); }
    return r;
  }
  const borrarBlobs = async (archivos) => { for (const a of archivos || []) if (typeof a !== 'string') await db.borrar('blobs', a.blob); };

  async function formulario(f) { // f = formato a editar, o null para uno nuevo
    const nuevo = !f;
    const v = f || { codigo: '', nombre: '', tipo: 'Unificado', etapa: '', quien: '', opciones: ops.map((o) => o.id), estado: '', archivos: [] };
    const i = (val, extra = {}) => h('input', { class: 'i', value: val ?? '', ...extra });
    const codigo = i(v.codigo, { placeholder: 'Ej.: 25 o EC03' }), nombre = i(v.nombre), etapa = i(v.etapa, { placeholder: 'Ej.: Anteproyecto' }), quien = i(v.quien, { placeholder: 'Ej.: Estudiante' });
    const tipo = h('select', { class: 'i' }, ['Unificado', 'Individual'].map((x) => h('option', { value: x, selected: x === v.tipo }, x)));
    const archivos = h('input', { class: 'i', type: 'file', multiple: true, accept: '.xlsx,.docx' });
    const checks = ops.map((o) => ({ o, el: h('input', { type: 'checkbox', checked: v.opciones.includes(o.id) }) }));
    const caja = h('div', { class: 'form' }, checks.map(({ o, el }) => h('label', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, el, o.icono + ' ' + o.nombre)));
    const actual = v.archivos.length ? h('p', { class: 'nota' }, 'Archivo actual: ' + v.archivos.map((a) => (typeof a === 'string' ? a : a.nombre)).join(', ') + (nuevo ? '' : '. Elige uno nuevo solo si quieres reemplazarlo.')) : null;
    const cuerpoForm = h('div', h('div', { class: 'form' }, h('label', { class: 'campo' }, 'Código', codigo), h('label', { class: 'campo' }, 'Nombre del formato', nombre), h('label', { class: 'campo' }, 'Tipo', tipo),
      h('label', { class: 'campo' }, 'Etapa', etapa), h('label', { class: 'campo' }, 'Quién lo diligencia', quien)),
    h('div', { class: 'sep' }), h('b', 'Opciones de grado a las que aplica'), caja, h('div', { class: 'sep' }), h('label', { class: 'campo ancho' }, nuevo ? 'Archivo (Excel o Word)' : 'Reemplazar archivo (opcional)', archivos), actual);
    const r = await modal(nuevo ? 'Agregar un formato' : 'Editar el formato ' + v.codigo, cuerpoForm, [{ texto: 'Cancelar', clase: 'gris', valor: false },
      { texto: 'Guardar', valor: true, valida: async () => { if (!codigo.value.trim() || !nombre.value.trim()) { toast('Escribe el código y el nombre.', 'mal'); return false; } if (nuevo && !archivos.files.length) { toast('Elige el archivo del formato.', 'mal'); return false; } if (!checks.some((c) => c.el.checked)) { toast('Marca al menos una opción de grado.', 'mal'); return false; } return true; } }]);
    if (r !== true) return;
    const datos = { codigo: codigo.value.trim(), nombre: nombre.value.trim(), tipo: tipo.value, etapa: etapa.value.trim() || 'Otros', quien: quien.value.trim() || 'Estudiante', estado: '', opciones: checks.filter((c) => c.el.checked).map((c) => c.o.id) };
    const aj = await getAjustesFormatos(); const nuevosArch = archivos.files.length ? await guardarArchivos([...archivos.files]) : null;
    if (nuevo) aj.propios.push({ id: 'propio_' + uid(), carpeta: '', archivos: nuevosArch, ...datos });
    else if (f.propio) { const p = aj.propios.find((x) => x.id === f.id); Object.assign(p, datos); if (nuevosArch) { await borrarBlobs(p.archivos); p.archivos = nuevosArch; } }
    else { aj.editados[f.id] = datos; if (nuevosArch) { await borrarBlobs(aj.archivosNuevos[f.id]); aj.archivosNuevos[f.id] = nuevosArch; } }
    await setAjustesFormatos(aj); toast('Formato guardado', 'ok'); ctx.refrescar();
  }
  async function quitar(f) {
    const aj = await getAjustesFormatos();
    if (f.propio) { if (!(await confirmar(`Se eliminará el formato «${f.nombre}» de este dispositivo, junto con su archivo.`, 'Eliminar'))) return; const p = aj.propios.find((x) => x.id === f.id); await borrarBlobs(p.archivos); aj.propios = aj.propios.filter((x) => x.id !== f.id); }
    else { if (!(await confirmar(`«${f.nombre}» dejará de aparecer en la aplicación de este dispositivo. Podrás volver a mostrarlo cuando quieras.`, 'Ocultar'))) return; aj.ocultos = [...new Set([...aj.ocultos, f.id])]; }
    await setAjustesFormatos(aj); ctx.refrescar();
  }
  async function mostrar(f) { const aj = await getAjustesFormatos(); aj.ocultos = aj.ocultos.filter((x) => x !== f.id); await setAjustesFormatos(aj); ctx.refrescar(); }
  async function original(f) { // deshace la edición o el archivo reemplazado de un formato de fábrica
    const aj = await getAjustesFormatos(); await borrarBlobs(aj.archivosNuevos[f.id]); delete aj.archivosNuevos[f.id]; delete aj.editados[f.id]; await setAjustesFormatos(aj); toast('Formato restaurado', 'ok'); ctx.refrescar();
  }
  async function restaurarTodo() {
    if (!(await confirmar('Se borrarán los formatos que agregaste, los cambios y los ocultamientos de este dispositivo. Quedarán solo los formatos de fábrica.', 'Restaurar'))) return;
    const aj = await getAjustesFormatos(); for (const p of aj.propios) await borrarBlobs(p.archivos); for (const a of Object.values(aj.archivosNuevos)) await borrarBlobs(a);
    await setAjustesFormatos({ ocultos: [], editados: {}, propios: [], archivosNuevos: {} }); toast('Formatos de fábrica restaurados', 'ok'); ctx.refrescar();
  }
  const tab3 = h('div', { style: { display: 'none' } },
    h('div', { class: 'alerta' }, 'Aquí se agregan, editan, reemplazan u ocultan formatos ', h('b', 'solo en este dispositivo'), '. Para cambiar los formatos de fábrica de todas las instalaciones hay que actualizar la carpeta de formatos y volver a generar la aplicación (ver LEEME).'),
    h('div', { class: 'fila', style: { margin: '8px 0' } }, h('button', { class: 'btn', onclick: () => formulario(null) }, '+ Agregar un formato'), h('button', { class: 'btn gris', onclick: restaurarTodo }, 'Restaurar los formatos de fábrica')),
    h('div', { class: 'tabla-w' }, h('table', { class: 't' }, h('thead', h('tr', ['N.º', 'Formato', 'Origen', 'Acciones'].map((x) => h('th', x)))),
      h('tbody', todos.map((f) => h('tr', { style: f.oculto ? { opacity: '.55' } : null }, h('td', h('b', f.codigo)), h('td', f.nombre, h('div', { class: 'nota' }, f.tipo + ' · ' + f.etapa), f.oculto ? h('span', { class: 'chip gris' }, 'Oculto') : null),
        h('td', f.propio ? h('span', { class: 'chip ok' }, 'Agregado por ti') : f.modificado ? h('span', { class: 'chip aviso' }, 'De fábrica · modificado') : h('span', { class: 'chip gris' }, 'De fábrica')),
        h('td', h('div', { class: 'fila' }, h('button', { class: 'btn peq sec', onclick: () => formulario(f) }, 'Editar / reemplazar'),
          f.oculto ? h('button', { class: 'btn peq', onclick: () => mostrar(f) }, 'Mostrar') : h('button', { class: 'btn peq gris', onclick: () => quitar(f) }, f.propio ? 'Eliminar' : 'Ocultar'),
          f.modificado ? h('button', { class: 'btn peq gris', onclick: () => original(f) }, 'Volver al original') : null))))))));

  const T = [tab1, tab3];
  const bt = (t, n) => h('button', { class: n === 0 ? 'on' : '', onclick: (e) => { T.forEach((x, k) => { x.style.display = k === n ? '' : 'none'; }); [...e.target.parentNode.children].forEach((b, k) => b.classList.toggle('on', k === n)); } }, t);
  pintar(); return h('div', h('div', { class: 'tabs' }, bt('Catálogo', 0), bt('Administrar formatos', 1)), ...T);
}
