import { h, fmtFecha, diasEntre, hoy, textoPlazo } from '../util.js';
import { opciones, getCalendario, TIPOS_FECHA } from '../datos.js';

export async function render() {
  const [ops, cal] = await Promise.all([opciones(), getCalendario()]);
  const prox = cal.filter((x) => x.fecha >= hoy()).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5);
  const acc = (t, d, href, ico) => h('a', { class: 'tarj link', href }, h('div', { style: { fontSize: '1.5rem' } }, ico), h('b', t), h('div', { class: 'nota' }, d));
  return h('div',
    h('div', { class: 'tarj', style: { background: 'var(--lado)', color: '#fff', marginBottom: '12px' } },
      h('h2', { style: { margin: 0 } }, 'Opciones de grado · Ingeniería Industrial'),
      h('p', { style: { margin: '4px 0 0' } }, 'Información del programa para estudiantes y docentes: las ' + ops.length + ' opciones de grado, sus requisitos, los formatos, el reglamento, los procedimientos y las fechas importantes.')),
    h('div', { class: 'rej' }, acc('Opciones de grado', 'Qué es cada opción, qué se exige y cómo es el proceso.', '#/opciones', '🎓'), acc('Formatos', 'Descarga los formatos que necesitas diligenciar.', '#/formatos', '📄'),
      acc('Reglamento', 'Lee y busca en los acuerdos de la Fundación.', '#/reglamento', '📖'), acc('Procedimientos', 'Diagramas paso a paso de cada etapa.', '#/diagramas', '🗺️'),
      acc('Calendario', 'Recepción de anteproyectos y sustentaciones.', '#/calendario', '📅'), acc('Ficha de invitación', 'Crea el cartel de la sustentación o socialización.', '#/fichas', '🖼️')),
    h('div', { class: 'sep' }),
    h('section', { class: 'tarj' }, h('h3', 'Próximas fechas'),
      prox.length ? prox.map((x) => h('div', { class: 'paso' }, h('div', { class: 'n' }, new Date(x.fecha + 'T00:00').getDate()), h('div', h('b', TIPOS_FECHA[x.tipo] || x.tipo), x.titulo ? h('div', { class: 'nota' }, x.titulo) : null, h('div', { class: 'nota' }, fmtFecha(x.fecha) + ' · ' + textoPlazo(diasEntre(hoy(), x.fecha))))))
        : h('p', { class: 'nota' }, 'Aún no hay fechas publicadas.'), h('a', { href: '#/calendario' }, 'Ver calendario')));
}