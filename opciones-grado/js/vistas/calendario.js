// Calendario informativo: fechas de recepción de anteproyectos y de sustentación o socialización. Solo el administrador las edita.
import { h, hoy, fmtFecha, diasEntre, textoPlazo, descargar, modal, toast, confirmar, uid } from '../util.js';
import { getCalendario, setCalendario, TIPOS_FECHA, esAdmin } from '../datos.js';

export async function render({ ctx }) {
  let lista = await getCalendario(); const adm = esAdmin();
  const vista = h('select', { class: 'i', style: { width: 'auto' }, onchange: () => pintar() }, [['prox', 'Próximas'], ['todo', 'Todas'], ['pas', 'Pasadas']].map(([v, t]) => h('option', { value: v }, t)));
  const tipo = h('select', { class: 'i', style: { width: 'auto' }, onchange: () => pintar() }, [['', 'Todos los tipos'], ...Object.entries(TIPOS_FECHA)].map(([v, t]) => h('option', { value: v }, t)));
  const lst = h('div');
  const guardar = async (l) => { lista = l; await setCalendario(l); pintar(); };
  async function editar(x) {
    const f = { tipo: h('select', { class: 'i' }, Object.entries(TIPOS_FECHA).map(([v, t]) => h('option', { value: v, selected: v === x?.tipo }, t))), fecha: h('input', { class: 'i', type: 'date', value: x?.fecha || '' }),
      titulo: h('input', { class: 'i', value: x?.titulo || '', placeholder: 'Ej.: Primera recepción del semestre 2027-1' }), detalle: h('input', { class: 'i', value: x?.detalle || '', placeholder: 'Hora, lugar o aclaración (opcional)' }) };
    const r = await modal(x ? 'Editar fecha' : 'Nueva fecha', h('div', { class: 'form' }, h('label', { class: 'campo' }, 'Tipo', f.tipo), h('label', { class: 'campo' }, 'Fecha', f.fecha), h('label', { class: 'campo ancho' }, 'Título', f.titulo), h('label', { class: 'campo ancho' }, 'Detalle', f.detalle)),
      [{ texto: 'Cancelar', clase: 'gris', valor: false }, { texto: 'Guardar', valor: true, valida: () => { if (!f.fecha.value) { toast('Elige la fecha.', 'mal'); return false; } return true; } }]);
    if (r !== true) return;
    const nuevo = { id: x?.id || uid(), tipo: f.tipo.value, fecha: f.fecha.value, titulo: f.titulo.value.trim(), detalle: f.detalle.value.trim() };
    await guardar(x ? lista.map((y) => (y.id === x.id ? nuevo : y)) : [...lista, nuevo]);
  }
  function pintar() {
    const t = hoy(); const L = lista.filter((x) => (!tipo.value || x.tipo === tipo.value) && (vista.value === 'todo' || (vista.value === 'prox' ? x.fecha >= t : x.fecha < t))).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (vista.value === 'pas') L.reverse();
    const mes = {}; L.forEach((x) => (mes[x.fecha.slice(0, 7)] ||= []).push(x));
    lst.replaceChildren(...(L.length ? Object.entries(mes).map(([m, arr]) => h('section', h('h3', new Date(m + '-15T00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })),
      arr.map((x) => h('div', { class: 'tarj', style: { marginBottom: '6px' } }, h('div', { class: 'fila', style: { justifyContent: 'space-between' } },
        h('span', h('span', { class: 'chip ' + (x.tipo === 'sustentacion' ? 'ok' : '') }, TIPOS_FECHA[x.tipo] || x.tipo), ' ', x.titulo || ''), h('b', fmtFecha(x.fecha))),
        x.detalle ? h('div', { class: 'nota' }, x.detalle) : null, h('div', { class: 'nota' }, textoPlazo(diasEntre(t, x.fecha))),
        adm ? h('div', { class: 'fila', style: { marginTop: '6px' } }, h('button', { class: 'btn peq sec', onclick: () => editar(x) }, 'Editar'),
          h('button', { class: 'btn peq gris', onclick: async () => { if (await confirmar('¿Quitar esta fecha del calendario?', 'Quitar')) guardar(lista.filter((y) => y.id !== x.id)); } }, 'Quitar')) : null)))) : [h('div', { class: 'vacio' }, 'No hay fechas en esta vista.')]));
  }
  const ics = () => {
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FUP Opciones de Grado//ES'];
    lista.forEach((x, i) => { L.push('BEGIN:VEVENT', `UID:${x.id || i}@fup-opciones-grado`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${x.fecha.replace(/-/g, '')}`, `SUMMARY:${(TIPOS_FECHA[x.tipo] || x.tipo) + (x.titulo ? ': ' + x.titulo : '')}`.replace(/[,;]/g, ' '), 'END:VEVENT'); });
    L.push('END:VCALENDAR'); descargar('calendario_opciones_de_grado.ics', L.join('\r\n'), 'text/calendar');
  };
  const barra = h('div', { class: 'fila', style: { marginBottom: '10px' } }, vista, tipo, h('button', { class: 'btn sec', disabled: !lista.length, onclick: ics }, 'Agregar a mi calendario (.ics)'),
    ...(adm ? [h('button', { class: 'btn', onclick: () => editar(null) }, '+ Nueva fecha'), h('button', { class: 'btn sec', onclick: () => descargar('calendario.json', JSON.stringify(lista, null, 1), 'application/json') }, 'Exportar calendario')] : []));
  const aviso = adm ? h('div', { class: 'alerta info' }, 'Modo administrador: puedes agregar, editar y quitar fechas. Los cambios quedan en este dispositivo; para que lleguen a todos, exporta el calendario y envíalo para incluirlo en la próxima versión de la aplicación.')
    : h('p', { class: 'nota' }, 'Fechas de recepción de anteproyectos y de sustentación o socialización. Solo el administrador puede modificarlas (Ajustes y respaldo).');
  const v = h('div', aviso, barra, lst); pintar(); return v;
}