/* ══ InferencIA · interfaz. La lógica pura (ejercicios, corrección, dominio, laboratorio) está en nucleo.js y stats.js;
      el currículo, en curriculum.js. Aquí: pintar, guardar, exportar y la IA (opcional: explica y comenta, nunca calcula). ══ */
const VERSION = '1.0.0';
const STEPS = ['Inicio', 'Practicar', 'Laboratorio', 'Progreso'];
const HUBS = ['Profesorado'];
const NAV = [['Empezar', 'Prueba el ejemplo: no necesita clave ni conexión.'], ['Siguiente: laboratorio', 'La IA es opcional: todo se corrige sin ella.'], ['Siguiente: progreso', 'Analiza tus datos y compruébalo en R.'], ['Volver al inicio', 'Descarga tu evidencia para tu profesor.']];
const RENDER = {0: pintaInicio, 1: pintaPractica, 2: pintaLab, 3: pintaProgreso, 4: pintaProf};
const GLOS = [
  ['¿Qué es?', 'Un laboratorio de práctica autónoma de Estadística Inferencial y Diseño Experimental (UPEC). Cada ejercicio es único para ti y lo corrige el código, no la IA. En el laboratorio analizas los datos de tu proyecto de aula.'],
  ['¿Cómo se adapta?', 'Para cada habilidad se estima tu dominio con tus intentos recientes (los últimos pesan más; acertar a la primera cuenta 1, a la segunda 0,5). Con un dominio de 0,8 la habilidad está dominada; si pasan semanas sin practicarla, el dominio baja y vuelve como repaso. Una habilidad se abre cuando las previas llegan a 0,6.'],
  ['¿Por qué así?', 'La app aplica prácticas con evidencia sólida: recuperar lo aprendido practicando en vez de releer (Roediger y Karpicke, 2006, doi:10.1111/j.1467-9280.2006.01693.x), espaciar los repasos (Cepeda et al., 2006, doi:10.1037/0033-2909.132.3.354), intercalar tipos de problema (Rohrer y Taylor, 2007, doi:10.1007/s11251-007-9015-8) y estudiar ejemplos resueltos tras intentarlo (Atkinson et al., 2000, doi:10.3102/00346543070002181).'],
  ['Tablas de los ejercicios', 'Cada ejercicio trae un extracto de la tabla que necesitas (t, F, Tukey, Duncan, Dunnett o Hartley), calculado por la app con α = 0,05. Incluye filas vecinas a propósito: elegir bien los grados de libertad es parte del ejercicio.'],
  ['Errores típicos', 'El código recalcula tu ejercicio con los errores más frecuentes (z en vez de t, olvidar la raíz, grados de libertad equivocados, ignorar los bloques…). Si tu resultado coincide con uno, te dice cuál.'],
  ['Laboratorio', 'Calcula el ANAVAR de un DCA, un DBCA, un cuadrado latino, un factorial (con o sin bloques) o un cross-over 2×2, y la regresión lineal simple. Comprueba la normalidad de los residuos (Shapiro-Wilk) y la homogeneidad de varianzas (Levene, centrada en la mediana), y compara medias con MDS, Tukey, Duncan o Dunnett. Los cálculos se han contrastado con scipy; el script R te permite comprobarlos tú.'],
  ['La IA', 'Es opcional. Puede explicarte un error sin darte el resultado (el código elimina cualquier frase que lo contenga) y comentar tu interpretación con cinco criterios, citando literalmente tu texto. Nunca calcula ni pone nota.'],
  ['Privacidad', 'Todo se guarda solo en este navegador. A la IA solo sale lo que pides que comente, y antes del primer envío ves la muestra. El fichero de evidencia lo entregas tú.'],
  ['Límites', 'El dominio es una estimación para orientar tu estudio, no una nota. Los ejercicios usan datos simulados. Duncan y Dunnett con repeticiones desiguales usan la media armónica (aproximación). El cross-over se limita al diseño 2×2. Los RA1-RA8 son una propuesta de desglose del resultado del sílabo.'],
  ['Tu clave de IA', 'Funciona con OpenAI, Google Gemini o Anthropic Claude. La clave se guarda solo en este navegador y cada persona paga su propio uso.']
];
const CRITERIOS = [
  ['hipotesis', 'Plantea las hipótesis (H0 y H1) y el nivel de significación.'],
  ['anava', 'Informa el estadístico F con sus grados de libertad y el p-valor, y decide correctamente.'],
  ['supuestos', 'Comprueba los supuestos (normalidad de residuos y homogeneidad de varianzas) y dice qué implican.'],
  ['comparaciones', 'Interpreta las comparaciones múltiples (qué tratamientos difieren y cuáles no).'],
  ['agronomica', 'Extrae una conclusión agronómica prudente y reconoce las limitaciones del experimento.']
];
const NIVEL = {logrado: 'Logrado', parcial: 'Parcial', ausente: 'Ausente'};
const MOTIVO = {nueva: 'Te toca porque es la siguiente habilidad del curso que tienes abierta.', refuerzo: 'Te toca porque aún no la dominas: es la de menor dominio entre las que estás trabajando.', repaso: 'Repaso espaciado: la dominabas, pero hace días que no la practicas.', intercalado: 'Cambiamos de habilidad: intercalar ayuda a distinguir cuándo usar cada procedimiento.', mantener: 'Lo dominas todo: practicas lo que tiene menos dominio para mantenerlo.', elegida: 'La has elegido tú.'};
const ESTADO = {nueva: 'Nueva', curso: 'En curso', dominada: 'Dominada', repasar: 'Repasar', bloqueada: 'Bloqueada'};
/* diagnósticos: primero se busca «habilidad.clave» y después «clave» */
const DIAG = {
  'ic.z': 'Has usado z de la normal: con σ desconocida y n pequeño se usa t de Student con n − 1 grados de libertad.', 'ic.sinRaiz': 'Falta dividir s entre √n: el intervalo usa el error típico de la media, s/√n.',
  'ic.glN': 'Has tomado t con n grados de libertad: son n − 1.', 'ic.glN2': 'Has tomado t con n − 2 grados de libertad: para una media son n − 1.', 'ic.varianza': 'Has usado la varianza s² en lugar de la desviación típica s.',
  'tdos.mediaVar': 'Has promediado las dos varianzas sin ponderar: con n distintos, cada varianza pesa por sus grados de libertad (nᵢ − 1).', 'tdos.conN': 'Pondera por los grados de libertad (nᵢ − 1) y divide entre n₁ + n₂ − 2, no entre n₁ + n₂.',
  'tdos.conS': 'Has combinado desviaciones típicas: se combinan las varianzas (s²).', 'welch': 'Has usado el error típico de Welch (varianzas separadas). El ejercicio pide la prueba con varianzas combinadas.',
  'sinRaiz': 'Falta la raíz cuadrada en el denominador (error típico).', 'signo': 'El valor es correcto en magnitud, pero el signo está cambiado: respeta el orden de la resta del enunciado.',
  'independientes': 'Has tratado los datos como dos muestras independientes. Son pareados: trabaja con las diferencias de cada unidad.', 'sinRaizN': 'Falta dividir la desviación típica de las diferencias entre √n.', 'varianza': 'Has usado la varianza en lugar de la desviación típica.',
  'sinOrdenar': 'Hay que ordenar los datos de menor a mayor antes de emparejar x₍ₙ₊₁₋ᵢ₎ con x₍ᵢ₎.', 'bCuadrado': 'Eso es b²: el valor que se pide es b = Σ aᵢ (x₍ₙ₊₁₋ᵢ₎ − x₍ᵢ₎).', 'conVarianza': 'El denominador de W es la suma de cuadrados Σ(x − x̄)², no la varianza.', 'shapiro.sinCuadrado': 'Falta elevar b al cuadrado: W = b² / Σ(x − x̄)².',
  'fmax.sinCuadrado': 'Has dividido desviaciones típicas: Fmax es el cociente entre la varianza mayor y la menor (s²).', 'fmax.invertida': 'Has dividido la menor entre la mayor: Fmax = s²máx / s²mín (siempre ≥ 1).',
  ignoraP: 'Si p < 0,05 se rechaza la hipótesis nula del supuesto: el supuesto NO se cumple. Revisa los dos p-valores.', confundeSupuesto: 'Revisa qué supuesto evalúa cada prueba: Shapiro-Wilk evalúa la normalidad de los residuos; Levene, la homogeneidad de varianzas.', pAlReves: 'Con p ≥ 0,05 no hay evidencia contra el supuesto: se puede continuar con el ANAVAR.',
  faltaBloque: 'Hay una fuente de variación conocida que conviene controlar: con un gradiente se forman bloques (DBCA).', dosGradientes: 'Hay dos fuentes de variación que se cruzan (filas y columnas): eso pide un cuadrado latino.', mismoAnimal: 'Las mismas unidades reciben los tratamientos en periodos sucesivos: es un diseño cross-over.',
  dosFactores: 'Se estudian dos factores y todas sus combinaciones: es un experimento factorial.', bloqueInnecesario: 'Las unidades son homogéneas: no hay fuente de variación que bloquear, basta un DCA.', unGradiente: 'Solo hay un gradiente: basta con bloques (DBCA); el cuadrado latino controla dos.', noCrossover: 'Cada unidad recibe un solo tratamiento: no es un cross-over.', unFactor: 'Solo se estudia un factor: no es un factorial.',
  glTotal: 'Esos son los grados de libertad del total (N − 1), no los del error.', glDbca: 'Esa es la fórmula del error de otro diseño: revisa qué fuentes de variación se restan.', glTrat: 'Esos son los grados de libertad de tratamientos.', glDca: 'Has usado los grados de libertad del error de un DCA: este diseño resta también los bloques (o filas y columnas).', glInter: 'Esos son los grados de libertad de la interacción.', glSujetos: 'Esos son los grados de libertad entre sujetos: el error del cross-over es dentro de sujetos.',
  'dca.sinR': 'Has sumado los cuadrados de las desviaciones de las medias sin multiplicar por r (repeticiones por tratamiento).', sinC: 'Falta restar el término de corrección C = (Σy)² / N.', esSCE: 'Esa es la suma de cuadrados del error, no la de tratamientos.',
  'dca.glTotal': 'El CMe se obtiene dividiendo la SC del error entre sus grados de libertad, t(r − 1), no entre N − 1.', 'dca.glTrat': 'Has dividido la SC del error entre los gl de tratamientos: usa t(r − 1).', conN: 'Divide entre los grados de libertad, no entre N.', esCMT: 'Ese es el cuadrado medio de tratamientos, no el del error.',
  invertida: 'Has invertido el cociente: F = CM de tratamientos / CM del error.', sinCM: 'F se calcula con cuadrados medios (SC / gl), no con sumas de cuadrados.',
  divisorB: 'Cada total de bloque suma t observaciones: SC bloques = Σ Bⱼ² / t − C.', esSCT: 'Esa es la suma de cuadrados de tratamientos, no la de bloques.', sinBloques: 'Has analizado como DCA: al no quitar los bloques, su variación infla el error y la F baja.', FBloques: 'Esa es la F de bloques: se pide la de tratamientos.',
  sinColumnas: 'Has olvidado restar la variación de las columnas: en el cuadrado latino se restan filas y columnas.', FFilas: 'Esa es la F de filas: se pide la de tratamientos.',
  divisor2k: 'El efecto es el contraste dividido entre r·2ᵏ⁻¹ (la mitad de las observaciones), no entre r·2ᵏ.', sinDividir: 'Eso es el contraste: falta dividir entre r·2ᵏ⁻¹.', soloR: 'Divide el contraste entre r·2ᵏ⁻¹, no solo entre r.', 'f2k.sinR': 'Falta incluir r: el divisor es r·2ᵏ⁻¹ (o r·2ᵏ para la SC).', divisorSC: 'La SC de un efecto es contraste² / (r·2ᵏ), no / (r·2ᵏ⁻¹).', efectoCuad: 'Has elevado el efecto al cuadrado: SC = contraste² / (r·2ᵏ).',
  divisorR: 'Cada total de A suma b·r observaciones: divide Σ Aᵢ² entre b·r.', divisor3: 'Cada total de A suma b·r observaciones: divide entre b·r, no solo entre b.', sinRestar: 'Esa es la SC de las celdas (subtotales): falta restarle la SC de A y la de B.', soloA: 'Has restado solo la SC de A: a la SC de las celdas hay que restarle la de A y la de B.',
  sin2: 'Falta el 2: el error típico de una diferencia de dos medias es √(2·CMe / r).', unilateral: 'Has usado t unilateral: la MDS usa t con α/2 en cada cola.', 'mds.glTotal': 'Usa t con los grados de libertad del error, no los del total.',
  con2: 'En Tukey y Duncan el error típico es √(CMe / r), sin el 2 (ya está incluido en la tabla del rango studentizado).', kmal: 'Revisa la columna de la tabla: el número de medias (o de comparaciones) que corresponde.', pMal: 'Para el rango mayor, p es el número total de medias.',
  'regresion.invertida': 'Has hecho la regresión al revés: la respuesta (rendimiento) va en Y y la dosis en X.', invertidaInv: 'Has hecho la regresión al revés: la respuesta (rendimiento) va en Y y la dosis en X.', cociente: 'Has dividido las medias. La pendiente es b = Sxy / Sxx.', signoA: 'Revisa el signo de la ordenada en el origen.', aConMedias: 'La ordenada es a = ȳ − b · x̄ (se resta, no se suma).', esR: 'Has dado r; el coeficiente de determinación R² es su cuadrado.',
  raizN: 'Los grados de libertad de r son n − 2: t = r √(n − 2) / √(1 − r²).', raizN1: 'Los grados de libertad de r son n − 2, no n − 1.', 'correl.sinRaiz': 'Falta la raíz en el denominador: √(1 − r²).', conR2: 'En el numerador va r, no r².',
  decision: 'Compara el estadístico con el valor crítico de la tabla (con los grados de libertad correctos): si lo supera, se rechaza H0.', clase: 'Revisa el criterio de decisión.',
  escala: 'Las cifras están bien, pero la escala no: revisa las unidades o la coma decimal.', cerca: 'Estás muy cerca: revisa el redondeo o un paso intermedio (usa el valor de la tabla tal cual).', noNumero: 'Escribe un número (puedes usar coma o punto decimal).', otro: 'No coincide con la solución ni con ningún error típico conocido: revisa el planteamiento.'
};
const diagTxt = (sk, k) => t(DIAG[sk + '.' + k] || DIAG[k] || DIAG.otro);
const OPC = {rechaza: 'Se rechaza H0: la diferencia es significativa', noRechaza: 'No se rechaza H0: no hay diferencia significativa', homogeneas: 'Varianzas homogéneas (Fmax ≤ valor crítico)', heterogeneas: 'Varianzas heterogéneas (Fmax > valor crítico)',
  anava: 'Se cumplen ambos supuestos: continuar con el ANAVAR', normalidad: 'Falla la normalidad: transformar los datos o usar Kruskal-Wallis', varianzas: 'Fallan las varianzas: transformar los datos o usar el ANAVAR de Welch', ambos: 'Fallan ambos: transformar y volver a verificar, o usar una prueba no paramétrica',
  dca: 'Completamente al azar (DCA)', dbca: 'Bloques completos al azar (DBCA)', cl: 'Cuadrado latino', crossover: 'Cross-over (cambio)', factorial: 'Factorial'};

let S = {alias: '', eventos: [], act: null, lab: {dis: 'dbca', csv: '', roles: {}, met: 'tukey', testigo: '', res: null}, inf: {texto: '', fb: null}, incluirInf: false, esEjemplo: false};
let ENVIO_OK = false, PROF = [];
const nuevoS = () => ({alias: '', eventos: [], act: null, lab: {dis: 'dbca', csv: '', roles: {}, met: 'tukey', testigo: '', res: null}, inf: {texto: '', fb: null}, incluirInf: false, esEjemplo: false});
const skillDe = id => SKILLS.find(s => s.id === id), raDe = id => RAS.find(r => r.id === id);
const fx = (v, d = 2) => Number.isFinite(v) ? v.toLocaleString(locale(), {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const ent = n => Math.round(n).toLocaleString(locale());
const pct = v => Number.isFinite(v) ? Math.round(v * 100) + ' %' : '—';
const fp = p => !Number.isFinite(p) ? '—' : p < 0.0001 ? '< ' + fx(0.0001, 4) : fx(p, 4);
const ctxTxt = id => { const c = ctxDe(id); return {v: t(c.var), va: t(c.va), u: c.u, trt: t(c.trt), dec: c.dec}; };

/* ── portada ── */
function pintaInicio() {
  $('listaRA').innerHTML = RAS.map(r => `<li><span class="ag-ra" style="--c:${r.c}">${r.id}</span> ${esc(t(r.txt))} <small class="muted">· ${esc(t(r.cuando))}</small></li>`).join('');
  $('inicioProj').innerHTML = S.alias && S.eventos.length && !S.esEjemplo ? `${esc(t('Tienes {0} ejercicios hechos como «{1}».', S.eventos.length, S.alias))} <button class="btn btn-ghost btn-sm" id="btnCont" type="button">${esc(t('Seguir practicando'))}</button>` : '';
}
$('btnStart').onclick = () => go(1);
$('btnProf').onclick = () => go(4);
document.addEventListener('click', e => { if (e.target.closest('#btnCont')) go(1); });

/* ── ejemplo (sin clave y sin red): una estudiante ficticia con tres semanas de práctica, un DBCA analizado y su interpretación ── */
const EJ_CSV = 'bloque;variedad;rendimiento\nB1;Superchola;25,4\nB1;Capiro;29,0\nB1;Gabriela;23,9\nB1;Victoria;25,6\nB2;Superchola;26,4\nB2;Capiro;28,8\nB2;Gabriela;24,6\nB2;Victoria;27,2\nB3;Superchola;28,1\nB3;Capiro;28,7\nB3;Gabriela;26,3\nB3;Victoria;28,0\nB4;Superchola;29,0\nB4;Capiro;31,0\nB4;Gabriela;25,8\nB4;Victoria;29,4';
const EJ_INF = {
  es: 'Planteamos H0: las cuatro variedades de papa tienen el mismo rendimiento medio, frente a H1: al menos una difiere, con α = 0,05. El ANAVAR del DBCA dio F = 23,82 con 3 y 9 grados de libertad (p = 0,0001), por lo que se rechaza H0. Los bloques también fueron significativos, así que bloquear la pendiente fue útil. Los residuos son normales según Shapiro-Wilk (p = 0,88). Según Tukey, Capiro rindió más que las demás y Gabriela fue la de menor rendimiento. Recomendamos Capiro para la zona, aunque es un solo ciclo y una sola localidad.',
  en: 'We stated H0: the four potato varieties have the same mean yield, against H1: at least one differs, with α = 0.05. The RCBD ANOVA gave F = 23.82 with 3 and 9 degrees of freedom (p = 0.0001), so H0 is rejected. Blocks were also significant, so blocking the slope was useful. The residuals are normal according to Shapiro-Wilk (p = 0.88). According to Tukey, Capiro yielded more than the others and Gabriela had the lowest yield. We recommend Capiro for the area, although it is a single season and a single site.',
  pt: 'Formulámos H0: as quatro variedades de batata têm o mesmo rendimento médio, contra H1: pelo menos uma difere, com α = 0,05. A ANOVA do DBCA deu F = 23,82 com 3 e 9 graus de liberdade (p = 0,0001), pelo que se rejeita H0. Os blocos também foram significativos, por isso bloquear o declive foi útil. Os resíduos são normais segundo Shapiro-Wilk (p = 0,88). Segundo Tukey, a Capiro rendeu mais do que as outras e a Gabriela teve o menor rendimento. Recomendamos a Capiro para a zona, embora seja um só ciclo e um só local.'
};
const EJ_FB = {
  es: [['hipotesis', 'logrado', 'al menos una difiere, con α = 0,05', 'Bien planteadas.'], ['anava', 'logrado', 'con 3 y 9 grados de libertad', 'Añade el coeficiente de variación para valorar la precisión del experimento.'], ['supuestos', 'parcial', 'Los residuos son normales según Shapiro-Wilk', 'Informa también la homogeneidad de varianzas (Levene) con su p-valor.'], ['comparaciones', 'logrado', 'Capiro rindió más que las demás', 'Indica qué variedades no difieren entre sí (letras compartidas).'], ['agronomica', 'logrado', 'es un solo ciclo y una sola localidad', 'Podrías proponer repetir el ensayo en otra campaña.']],
  en: [['hipotesis', 'logrado', 'at least one differs, with α = 0.05', 'Well stated.'], ['anava', 'logrado', 'with 3 and 9 degrees of freedom', 'Add the coefficient of variation to judge the precision of the experiment.'], ['supuestos', 'parcial', 'The residuals are normal according to Shapiro-Wilk', 'Also report homogeneity of variances (Levene) with its p-value.'], ['comparaciones', 'logrado', 'Capiro yielded more than the others', 'State which varieties do not differ from each other (shared letters).'], ['agronomica', 'logrado', 'it is a single season and a single site', 'You could propose repeating the trial in another season.']],
  pt: [['hipotesis', 'logrado', 'pelo menos uma difere, com α = 0,05', 'Bem formuladas.'], ['anava', 'logrado', 'com 3 e 9 graus de liberdade', 'Acrescente o coeficiente de variação para avaliar a precisão da experiência.'], ['supuestos', 'parcial', 'Os resíduos são normais segundo Shapiro-Wilk', 'Indique também a homogeneidade de variâncias (Levene) com o seu p-valor.'], ['comparaciones', 'logrado', 'a Capiro rendeu mais do que as outras', 'Indique que variedades não diferem entre si (letras partilhadas).'], ['agronomica', 'logrado', 'seja um só ciclo e um só local', 'Poderia propor repetir o ensaio noutra campanha.']]
};
function eventosEjemplo() {
  const t0 = Date.now() - 21 * DIA, ev = [], plan = [['ic', 0, 'z'], ['ic', 1], ['tdos', 0.5], ['ic', 1], ['tdos', 0, 'mediaVar'], ['shapiro', 1], ['tdos', 1], ['fmax', 0, 'sinCuadrado'], ['tpar', 1], ['fmax', 1], ['diseno', 1], ['supuestos', 0, 'confundeSupuesto'],
    ['dca', 0, 'sinR'], ['diseno', 1], ['dca', 1], ['gl', 0.5], ['supuestos', 1], ['dca', 1], ['dbca', 0, 'sinBloques'], ['gl', 1], ['dbca', 1], ['mds', 0, 'sin2'], ['f2k', 0.5], ['dbca', 1], ['mds', 1], ['cl', 1], ['tukey', 0, 'con2'], ['f2k', 1], ['regresion', 1], ['tukey', 0.5]];
  plan.forEach(([sk, ok, err], k) => ev.push({sk, t: t0 + Math.round(k * 20.5 / plan.length * DIA), ok, n: ok === 1 ? 1 : ok ? 2 : 3, err: err || null, sol: ok === 0}));
  return ev;
}
function aplicaEjemplo() {
  const fb = (EJ_FB[LANG] || EJ_FB.es).map(([id, nivel, cita, sug]) => ({id, nivel, cita, sug}));
  S = nuevoS(); S.alias = 'demo-ana'; S.eventos = eventosEjemplo(); S.esEjemplo = true; S.incluirInf = true;
  S.lab = {dis: 'dbca', csv: EJ_CSV, roles: {bloque: 0, trt: 1, y: 2}, met: 'tukey', testigo: '', res: null};
  S.lab.res = resumenLab(analizaLab(S.lab.csv, 'dbca', S.lab.roles, {metodo: 'tukey'}));
  S.inf = {texto: EJ_INF[LANG] || EJ_INF.es, fb: null}; S.inf.fb = procesaFb({criterios: fb}, S.inf.texto, true);
}
window.addEventListener('langchange', () => { if (S.esEjemplo) { aplicaEjemplo(); guarda(); } });
$('btnEjemplo').onclick = () => { aplicaEjemplo(); guarda(); go(2); toast(t('Ejemplo de demostración con una estudiante ficticia: no usa la IA')); };

/* ── practicar ── */
$('btnAlias').onclick = () => {
  const a = $('alias').value.trim().replace(/\s+/g, ' '); if (a.length < 3) return toast(t('Escribe un seudónimo de al menos 3 caracteres'));
  if (S.esEjemplo) S = nuevoS();
  if (S.alias && a !== S.alias && S.eventos.length && !confirm(t('Cambiar de seudónimo cambia tus ejercicios. Tu progreso se conserva. ¿Seguir?'))) return;
  S.alias = a; S.act = null; guarda(); pintaPractica();
};
$('alias').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnAlias').click(); });
function nuevaActividad(sk, motivo) {
  if (!sk) { const s = siguiente(S.eventos); sk = s.sk; motivo = s.motivo; }
  const k = S.eventos.filter(e => e.sk === sk).length;
  S.act = {sk, k, motivo, intentos: 0, resp: {}, res: null, diag1: null, visto: false, fin: false, okFinal: null, ia: null};
  guarda();
}
function pintaPractica() {
  const conAlias = !!S.alias && !S.esEjemplo;
  $('cardAlias').hidden = conAlias; $('zonaPractica').hidden = !conAlias; $('alias').value = S.esEjemplo ? '' : S.alias;
  if (!conAlias) return;
  if (!S.act) nuevaActividad();
  const M = mapaDominio(S.eventos);
  $('quien').innerHTML = `${esc(t('Practicas como «{0}»', S.alias))} · <button class="ag-link" id="btnCambiaAlias" type="button">${esc(t('cambiar'))}</button>`;
  $('selSkill').innerHTML = SKILLS.map(s => `<option value="${s.id}" ${M[s.id].bloqueada ? 'disabled' : ''}>${esc(s.ra + ' · ' + t(s.nombre))} · ${esc(t(M[s.id].bloqueada ? 'bloqueada' : ESTADO[M[s.id].estado]))}</option>`).join('');
  $('selSkill').value = S.act.sk;
  pintaEjercicio();
}
document.addEventListener('click', e => { if (e.target.closest('#btnCambiaAlias')) { $('cardAlias').hidden = false; $('alias').focus(); } });
$('btnElegir').onclick = () => { const sk = $('selSkill').value; if (!sk) return; nuevaActividad(sk, 'elegida'); pintaPractica(); $('ejTit')?.focus?.(); };

let _ejCache = null;
const ej = () => { const key = `${S.alias}|${S.act.sk}|${S.act.k}`; if (!_ejCache || _ejCache.key !== key) _ejCache = {key, e: ejercicio(S.alias, S.act.sk, S.act.k)}; return _ejCache.e; };
const tabla = (cab, filas, cls = 'ag-datos') => `<div class="table-wrap"><table class="${cls}"><thead><tr>${cab.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${filas.map(f => `<tr>${f.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const capT = txt => `<p class="help" style="margin:8px 0 0">${esc(txt)}</p>`;
/* extractos de tablas estadísticas (calculadas por la app, α = 0,05) */
function tablaT(tb) { return capT(t('Tabla t de Student (valores críticos; α es bilateral)')) + tabla(['gl', ...tb.ps.map(p => `α = ${fx(2 * (1 - p), 2)}`)], tb.dfs.map(df => [String(df), ...tb.ps.map(p => fx(tTab(p, df), 3))]), 'ag-tabcrit'); }
function tablaF(pares) { return capT(t('Tabla F de Snedecor (α = 0,05)')) + tabla([esc(t('gl numerador')), esc(t('gl denominador')), 'F'], pares.map(([a, b]) => [String(a), String(b), fx(fTab(a, b), 2)]), 'ag-tabcrit'); }
function tablaCruz(titulo, colTit, cols, dfs, fn) { return capT(titulo) + tabla([`gl \\ ${colTit}`, ...cols.map(String)], dfs.map(df => [String(df), ...cols.map(c => fx(fn(c, df), 2))]), 'ag-tabcrit'); }
function enunciado(e) {
  const d = e.d, c = d.ctx ? ctxTxt(d.ctx) : null, P = s => `<p>${esc(s)}</p>`;
  switch (e.sk) {
    case 'ic': return P(t('Se midió {0} en {1} parcelas elegidas al azar: media {2} {3} y desviación típica {4} {3}. Calcula el intervalo de confianza del {5} % para la media poblacional.', c.va, d.n, fx(d.m, c.dec), c.u, fx(d.s, c.dec + 1), d.conf)) + tablaT(d.tabla);
    case 'tdos': return P(t('Se compara {0} con dos {1} en parcelas independientes. Grupo 1: n = {2}, media {3}, s = {4}. Grupo 2: n = {5}, media {6}, s = {7} ({8}). Contrasta H0: μ₁ = μ₂ frente a H1: μ₁ ≠ μ₂ con α = 0,05, usando la prueba t con varianzas combinadas (t = (x̄₁ − x̄₂) / √(s²p (1/n₁ + 1/n₂))).', c.va, c.trt, d.n1, fx(d.m1, c.dec), fx(d.s1, c.dec + 1), d.n2, fx(d.m2, c.dec), fx(d.s2, c.dec + 1), c.u)) + tablaT(d.tabla);
    case 'tpar': return P(t('En {0} unidades experimentales se midió {1} ({2}) antes y después de aplicar un tratamiento. Con d = después − antes, contrasta H0: μd = 0 frente a H1: μd ≠ 0 con α = 0,05.', d.xs.length, c.va, c.u)) + tabla([esc(t('Unidad')), esc(t('Antes')), esc(t('Después'))], d.xs.map((x, k) => ['U' + (k + 1), fx(x, c.dec), fx(d.ys[k], c.dec)])) + tablaT(d.tabla);
    case 'shapiro': return P(t('Antes de un ANAVAR quieres comprobar la normalidad de estos {0} valores de {1} ({2}). Ordénalos, calcula b = Σ aᵢ (x₍ₙ₊₁₋ᵢ₎ − x₍ᵢ₎) con los coeficientes de la tabla y después W = b² / Σ(x − x̄)².', d.xs.length, c.v, c.u)) + tabla([esc(t('Valores')), ...d.xs.map((_, k) => String(k + 1))], [['x', ...d.xs.map(v => fx(v, c.dec))]]) + capT(t('Coeficientes aᵢ de Shapiro-Wilk para n = {0}', d.xs.length)) + tabla(['i', ...d.a.map((_, k) => String(k + 1))], [['aᵢ', ...d.a.map(v => fx(v, 4))]], 'ag-tabcrit');
    case 'fmax': return P(t('En un experimento con {0} tratamientos y {1} repeticiones por tratamiento, las desviaciones típicas de {2} ({3}) fueron: {4}. Calcula la F máxima de Hartley y decide si las varianzas son homogéneas. Valor crítico de Hartley (α = 0,05; k = {0}; gl = {5}): {6}.', d.k, d.n, c.v, c.u, d.sds.map(s => fx(s, c.dec + 1)).join(' · '), d.n - 1, fx(d.hc, d.hc < 10 ? 2 : 1)));
    case 'supuestos': return P(t('En un DCA con {0} tratamientos y {1} repeticiones sobre {2}, el análisis de los residuos dio: Shapiro-Wilk W = {3} (p = {4}); Levene F = {5} (p = {6}). Con α = 0,05, ¿qué haces?', d.t, d.r, c.va, fx(d.W, 3), fx(d.pS, 3), fx(d.FL, 2), fx(d.pL, 3)));
    case 'diseno': return P(escenario(d)) + `<p class="help">${esc(t('Elige el diseño que mejor controla la variación descrita.'))}</p>`;
    case 'gl': return P(textoGl(d));
    case 'dca': return P(t('Se evaluaron {0} {1} sobre {2} ({3}) en un diseño completamente al azar con {4} repeticiones. Calcula el ANAVAR y contrasta H0: todas las medias son iguales (α = 0,05).', d.t, c.trt, c.va, c.u, d.r)) + tabla([esc(t('Tratamiento')), ...d.Y[0].map((_, j) => 'R' + (j + 1))], d.Y.map((g, i) => ['T' + (i + 1), ...g.map(v => fx(v, c.dec))])) + tablaF([[d.t - 1, d.t * d.r - d.t], [d.t - 1, d.t * d.r - 1], [d.t, d.t * d.r - d.t]]);
    case 'dbca': return P(t('Se evaluaron {0} {1} sobre {2} ({3}) en {4} bloques completos al azar (los bloques siguen la pendiente del terreno). Calcula el ANAVAR y contrasta H0: todas las medias de tratamiento son iguales (α = 0,05).', d.t, c.trt, c.va, c.u, d.b)) + tabla([esc(t('Tratamiento')), ...d.Y[0].map((_, j) => 'B' + (j + 1))], d.Y.map((g, i) => ['T' + (i + 1), ...g.map(v => fx(v, c.dec))])) + tablaF([[d.t - 1, (d.t - 1) * (d.b - 1)], [d.t - 1, d.t * (d.b - 1)], [d.b - 1, (d.t - 1) * (d.b - 1)]]);
    case 'cl': return P(t('Se evaluaron 4 {0} (A, B, C, D) sobre {1} ({2}) en un cuadrado latino 4 × 4: las filas siguen la pendiente y las columnas, la distancia al canal de riego. Cada celda muestra el tratamiento y su valor. Calcula los grados de libertad del error y la F de tratamientos, y decide (α = 0,05).', c.trt, c.va, c.u)) + tabla(['', ...d.L[0].map((_, j) => 'C' + (j + 1))], d.L.map((f, i) => ['F' + (i + 1), ...f.map((tr, j) => `<b>${tr}</b> ${fx(d.Y[i][j], c.dec)}`)])) + tablaF([[3, 6], [3, 9], [3, 12]]);
    case 'f2k': return P(t('Experimento factorial 2^{0} con {1} repeticiones por combinación sobre {2} ({3}). La tabla da el TOTAL de las {1} repeticiones de cada combinación, en notación de Yates (la letra indica que ese factor está en su nivel alto).', d.k, d.r, c.va, c.u)) + tabla([esc(t('Combinación')), ...d.combos], [[esc(t('Total')), ...d.combos.map(cb => fx(d.tot[cb], c.dec))]]);
    case 'f3k': return P(t('Factorial 3 × 3 (A: tres variedades; B: tres dosis) en un DCA con {0} repeticiones sobre {1} ({2}). La tabla da el TOTAL de las {0} repeticiones de cada combinación.', d.r, c.va, c.u)) + tabla(['', 'B1', 'B2', 'B3'], d.T.map((f, i) => ['A' + (i + 1), ...f.map(v => fx(v, c.dec))]));
    case 'mds': case 'tukey': case 'duncan': case 'dunnett': {
      const intro = P(t('Tras un ANAVAR significativo de un DCA con {0} tratamientos y {1} repeticiones sobre {2} ({3}), el CMe fue {4} con {5} gl. Medias:', d.t, d.r, c.va, c.u, fx(d.cme, c.dec + 2), d.gl)) + tabla(d.medias.map((_, i) => (e.sk === 'dunnett' && i === 0 ? t('T1 (testigo)') : 'T' + (i + 1))), [d.medias.map(m => fx(m, c.dec))]);
      if (e.sk === 'mds') return intro + P(t('Calcula la mínima diferencia significativa (α = 0,05) y cuenta cuántos pares de medias difieren significativamente.')) + tablaT(d.tabla);
      if (e.sk === 'tukey') return intro + P(t('Calcula la diferencia honestamente significativa de Tukey (α = 0,05) y cuenta cuántos pares de medias difieren significativamente.')) + tablaCruz(t('Rango studentizado q (α = 0,05) · columnas: número de medias'), 'k', d.qtab.ks, d.qtab.dfs, (k, df) => qTab(k, df));
      if (e.sk === 'duncan') return intro + P(t('Calcula los rangos mínimos significativos de Duncan R₂ (medias contiguas) y R{0} (medias extremas) con α = 0,05, y cuenta cuántos pares de medias difieren significativamente.', d.t)) + tablaCruz(t('Rangos significativos de Duncan rₚ (α = 0,05) · columnas: p, número de medias abarcadas'), 'p', d.rtab.ps, d.rtab.dfs, (p, df) => rTab(p, df));
      return intro + P(t('Calcula la diferencia mínima de Dunnett (bilateral, α = 0,05) frente al testigo T1 y cuenta cuántos tratamientos difieren significativamente del testigo.')) + tablaCruz(t('Valores críticos de Dunnett bilaterales (α = 0,05) · columnas: número de tratamientos sin contar el testigo'), 'k', d.dtab.ks, d.dtab.dfs, (k, df) => dTab(k, df));
    }
    case 'regresion': return P(t('Ensayo de respuesta del maíz al nitrógeno: dosis (kg N/ha) y rendimiento (t/ha). Ajusta por mínimos cuadrados la recta rendimiento = a + b · dosis y calcula R².')) + tabla([esc(t('Dosis (kg N/ha)')), esc(t('Rendimiento (t/ha)'))], d.xs.map((x, k) => [String(x), fx(d.ys[k])]));
    case 'correl': return P(t('En {0} parcelas, el coeficiente de correlación de Pearson entre {1} y el rendimiento fue r = {2}. Calcula el estadístico t para contrastar H0: ρ = 0 y decide con α = 0,05.', d.n, t(PAR[d.par]), fx(d.r))) + tablaT(d.tabla);
  }
  return '';
}
const PAR = {altura: 'la altura de planta', nudos: 'el número de nudos', lluvia: 'la precipitación acumulada', ph: 'el pH del suelo'};
function escenario(d) {
  const c = ctxTxt(d.ctx);
  const E = {
    dca: ['Se comparan {0} {1} sobre {2} en macetas dentro de un invernadero con temperatura, luz y sustrato homogéneos.', 'Se comparan {0} {1} sobre {2} en jaulas idénticas de una misma nave con ambiente controlado; los animales son de la misma edad y peso.'],
    dbca: ['Se comparan {0} {1} sobre {2} en un lote con una pendiente marcada de norte a sur que cambia la humedad del suelo.', 'Se comparan {0} {1} sobre {2} en animales de cuatro edades distintas; la edad influye en la respuesta.'],
    cl: ['Se comparan {0} {1} sobre {2} en un lote con pendiente de norte a sur y, a la vez, un gradiente de riego de este a oeste. Hay {0} × {0} parcelas.', 'Se comparan {0} {1} sobre {2}; las parcelas varían por la pendiente (filas) y por la sombra de una cortina rompevientos (columnas). Hay {0} × {0} parcelas.'],
    crossover: ['Se comparan 2 suplementos sobre la producción de leche: cada vaca recibe un suplemento en un primer periodo y el otro en un segundo periodo, con un descanso entre ambos.', 'Se comparan 2 dietas sobre la ganancia de peso: cada animal pasa por las dos dietas en dos periodos sucesivos, en orden sorteado.'],
    factorial: ['Se estudia el efecto de {3} variedades y {4} dosis de abono, y de su interacción, sobre {2}: se ensayan todas las combinaciones en un invernadero homogéneo.', 'Se estudia el efecto de {3} tipos de riego y {4} densidades de siembra, y de su interacción, sobre {2}: se ensayan todas las combinaciones en parcelas homogéneas.']
  };
  return t(E[d.tipo][d.esc], d.t, c.trt, c.v, d.a, d.b);
}
function textoGl(d) {
  const T = {
    dca: ['Diseño completamente al azar con {0} tratamientos y {1} repeticiones. ¿Cuántos grados de libertad tiene el error?', d.t, d.r],
    dbca: ['Diseño en bloques completos al azar con {0} tratamientos y {1} bloques. ¿Cuántos grados de libertad tiene el error?', d.t, d.r],
    cl: ['Cuadrado latino de {0} × {0} ({0} tratamientos). ¿Cuántos grados de libertad tiene el error?', d.t],
    factorial: ['Factorial {0} × {1} en un diseño completamente al azar con {2} repeticiones por combinación. ¿Cuántos grados de libertad tiene el error?', d.a, d.b, d.r],
    crossover: ['Cross-over 2 × 2 con {0} animales en cada secuencia (AB y BA). ¿Cuántos grados de libertad tiene el error (dentro de animales)?', d.n]
  }[d.tipo];
  return t(...T);
}
/* etiquetas de las respuestas: [texto, unidad] (la unidad «ctx» es la del contexto del ejercicio) */
const ETQ = {ic: {li: ['Límite inferior', 'ctx'], ls: ['Límite superior', 'ctx']}, tdos: {sp2: ['Varianza combinada s²p', ''], t: ['Estadístico t', ''], dec: ['Decisión', '']}, tpar: {dm: ['Media de las diferencias d̄', 'ctx'], t: ['Estadístico t', ''], dec: ['Decisión', '']},
  shapiro: {b: ['b = Σ aᵢ (x₍ₙ₊₁₋ᵢ₎ − x₍ᵢ₎)', ''], W: ['W', '']}, fmax: {F: ['Fmax', ''], dec: ['Decisión', '']}, supuestos: {dec: ['¿Qué haces?', '']}, diseno: {dis: ['Diseño', '']}, gl: {gl: ['Grados de libertad del error', '']},
  dca: {sct: ['SC de tratamientos', ''], cme: ['CM del error', ''], F: ['F calculada', ''], dec: ['Decisión', '']}, dbca: {scb: ['SC de bloques', ''], F: ['F de tratamientos', ''], dec: ['Decisión', '']}, cl: {gl: ['Grados de libertad del error', ''], F: ['F de tratamientos', ''], dec: ['Decisión', '']},
  f2k: {A: ['Efecto principal de A', 'ctx'], AB: ['Efecto de la interacción AB', 'ctx'], sc: ['SC de la interacción AB', '']}, f3k: {scA: ['SC del factor A', ''], scAB: ['SC de la interacción A × B', '']},
  mds: {dms: ['MDS', 'ctx'], nsig: ['Pares que difieren', '']}, tukey: {dms: ['DHS de Tukey', 'ctx'], nsig: ['Pares que difieren', '']}, duncan: {R2: ['R₂', 'ctx'], Rt: ['Rango del extremo (p = t)', 'ctx'], nsig: ['Pares que difieren', '']}, dunnett: {dms: ['Diferencia mínima de Dunnett', 'ctx'], nsig: ['Tratamientos que difieren del testigo', '']},
  regresion: {b: ['Pendiente b', 't/ha por kg N'], a: ['Ordenada en el origen a', 't/ha'], r2: ['R²', '']}, correl: {t: ['Estadístico t', ''], dec: ['Decisión', '']}};
const decTxt = d => d === 0 ? t('número entero') : t('{0} decimales', d);
function resuelto(e) {
  const d = e.d, q = id => e.q.find(x => x.id === id).sol, c = d.ctx ? ctxTxt(d.ctx) : null, L = [], f4 = v => fx(v, 4);
  switch (e.sk) {
    case 'ic': { const p = 1 - (1 - d.conf / 100) / 2, tc = tTab(p, d.n - 1); L.push(`gl = n − 1 = ${d.n - 1} → t = ${fx(tc, 3)}`, `s/√n = ${fx(d.s, c.dec + 1)} / √${d.n} = ${f4(d.s / Math.sqrt(d.n))}`, `${fx(d.m, c.dec)} ± ${fx(tc, 3)} · ${f4(d.s / Math.sqrt(d.n))} → [<b>${fx(q('li'), e.q[0].dec)}</b> ; <b>${fx(q('ls'), e.q[0].dec)}</b>]`); break; }
    case 'tdos': { const gl = d.n1 + d.n2 - 2, tc = tTab(0.975, gl); L.push(`s²p = [(${d.n1} − 1)·${fx(d.s1, c.dec + 1)}² + (${d.n2} − 1)·${fx(d.s2, c.dec + 1)}²] / ${gl} = <b>${fx(q('sp2'), e.q[0].dec)}</b>`, `t = (${fx(d.m1, c.dec)} − ${fx(d.m2, c.dec)}) / √(${f4(q('sp2'))} · (1/${d.n1} + 1/${d.n2})) = <b>${fx(q('t'))}</b>`, esc(t('|t| {0} t crítico ({1} gl) = {2} → {3}', Math.abs(q('t')) > tc ? '>' : '≤', gl, fx(tc, 3), t(OPC[q('dec')])))); break; }
    case 'tpar': { const n = d.xs.length, dd = d.ys.map((y, k) => y - d.xs[k]), tc = tTab(0.975, n - 1); L.push(`d = ${dd.map(v => fx(v, c.dec)).join(' · ')}`, `d̄ = <b>${fx(q('dm'), e.q[0].dec)}</b> · s_d = ${f4(sdM(dd))}`, `t = d̄ / (s_d / √${n}) = <b>${fx(q('t'))}</b>`, esc(t('|t| {0} t crítico ({1} gl) = {2} → {3}', Math.abs(q('t')) > tc ? '>' : '≤', n - 1, fx(tc, 3), t(OPC[q('dec')])))); break; }
    case 'shapiro': { const s = d.xs.slice().sort((a, b) => a - b), n = s.length, m = media(d.xs); L.push(`${esc(t('Ordenados'))}: ${s.map(v => fx(v, c.dec)).join(' · ')}`, d.a.map((a, i) => `${fx(a, 4)}·(${fx(s[n - 1 - i], c.dec)} − ${fx(s[i], c.dec)})`).join(' + ') + ` = <b>${fx(q('b'), 3)}</b>`, `Σ(x − x̄)² = ${f4(suma(d.xs.map(v => (v - m) ** 2)))} → W = ${fx(q('b'), 3)}² / ${f4(suma(d.xs.map(v => (v - m) ** 2)))} = <b>${fx(q('W'), 3)}</b>`); break; }
    case 'fmax': { const v = d.sds.map(s => s * s); L.push(`s² = ${v.map(x => f4(x)).join(' · ')}`, `Fmax = ${f4(Math.max(...v))} / ${f4(Math.min(...v))} = <b>${fx(q('F'))}</b>`, esc(t('{0} {1} {2} → {3}', fx(q('F')), q('F') > d.hc ? '>' : '≤', fx(d.hc, d.hc < 10 ? 2 : 1), t(OPC[q('dec')])))); break; }
    case 'supuestos': L.push(esc(t('Shapiro-Wilk: p = {0} → {1}.', fx(d.pS, 3), d.pS < ALFA ? t('se rechaza la normalidad') : t('no se rechaza la normalidad'))), esc(t('Levene: p = {0} → {1}.', fx(d.pL, 3), d.pL < ALFA ? t('las varianzas no son homogéneas') : t('no se rechaza la homogeneidad'))), `<b>${esc(t(OPC[q('dec')]))}</b>`); break;
    case 'diseno': L.push(`<b>${esc(t(OPC[q('dis')]))}</b>`, esc(t({dca: 'Unidades homogéneas: la aleatorización completa basta.', dbca: 'Una fuente de variación conocida (un gradiente): se agrupan las unidades en bloques homogéneos y cada bloque recibe todos los tratamientos.', cl: 'Dos fuentes de variación que se cruzan: filas y columnas, con cada tratamiento una vez por fila y por columna (t × t parcelas).', crossover: 'Cada animal recibe los dos tratamientos en periodos distintos, en secuencias AB y BA: el animal es su propio control.', factorial: 'Dos factores con todas sus combinaciones: se estiman sus efectos principales y su interacción.'}[q('dis')]))); break;
    case 'gl': L.push({dca: `t(r − 1) = ${d.t}·(${d.r} − 1) = <b>${q('gl')}</b>`, dbca: `(t − 1)(b − 1) = ${d.t - 1}·${d.r - 1} = <b>${q('gl')}</b>`, cl: `(t − 1)(t − 2) = ${d.t - 1}·${d.t - 2} = <b>${q('gl')}</b>`, factorial: `ab(r − 1) = ${d.a}·${d.b}·(${d.r} − 1) = <b>${q('gl')}</b>`, crossover: `n₁ + n₂ − 2 = ${d.n} + ${d.n} − 2 = <b>${q('gl')}</b>`}[d.tipo]); break;
    case 'dca': case 'dbca': case 'cl': { const A = e.a, g = A.tabla; L.push(`C = (Σy)² / N = ${fx(A.mediaGeneral * A.mediaGeneral * A.N, 3)}`); g.filter(f => f.fuente !== 'Total').forEach(f => L.push(`${esc(t(f.fuente))}: SC = ${fx(f.sc, 3)} · gl = ${f.gl}${Number.isFinite(f.cm) ? ' · CM = ' + fx(f.cm, 4) : ''}${Number.isFinite(f.F) ? ' · F = ' + fx(f.F, 3) : ''}`));
      const Ft = e.sk === 'dca' ? g[0] : e.sk === 'dbca' ? g[1] : g[2]; L.push(esc(t('F = {0} {1} F crítico = {2} → {3}', fx(Ft.F), Ft.F > d.fc ? '>' : '≤', fx(d.fc), t(OPC[q('dec')])))); break; }
    case 'f2k': { const div = d.r * 2 ** (d.k - 1), con = l => suma(d.combos.map(cb => l.split('').reduce((p, x) => p * (cb.includes(x) ? 1 : -1), 1) * d.tot[cb])); L.push(`${esc(t('Contraste'))} A = ${d.combos.map(cb => (cb.includes('a') ? '+' : '−') + cb).join(' ')} = ${fx(con('a'), 3)}`, `${esc(t('Efecto'))} A = ${fx(con('a'), 3)} / (${d.r}·2^${d.k - 1}) = <b>${fx(q('A'), e.q[0].dec)}</b>`, `${esc(t('Contraste'))} AB = ${fx(con('ab'), 3)} → ${esc(t('efecto'))} = <b>${fx(q('AB'), e.q[0].dec)}</b>`, `SC AB = ${fx(con('ab'), 3)}² / (${d.r}·2^${d.k}) = <b>${fx(q('sc'), 3)}</b>`); break; }
    case 'f3k': { const N = 9 * d.r, G = suma(d.T.flat()), C = G * G / N, Ai = d.T.map(f => suma(f)); L.push(`C = ${fx(G, 1)}² / ${N} = ${fx(C, 3)}`, `SC A = (${Ai.map(v => fx(v, 1) + '²').join(' + ')}) / ${3 * d.r} − C = <b>${fx(q('scA'))}</b>`, `${esc(t('SC celdas'))} = Σ T²ᵢⱼ / ${d.r} − C; SC A×B = SC celdas − SC A − SC B = <b>${fx(q('scAB'))}</b>`); break; }
    case 'mds': case 'tukey': case 'duncan': case 'dunnett': {
      const ee = Math.sqrt(d.cme / d.r), dd = e.q[0].dec;
      if (e.sk === 'mds') { const tc = tTab(0.975, d.gl); L.push(`MDS = t(${d.gl}) · √(2·CMe / r) = ${fx(tc, 3)} · √(2·${fx(d.cme, 4)} / ${d.r}) = <b>${fx(q('dms'), dd)}</b>`); }
      if (e.sk === 'tukey') { const qq = qTab(d.t, d.gl); L.push(`DHS = q(${d.t}; ${d.gl}) · √(CMe / r) = ${fx(qq)} · ${f4(ee)} = <b>${fx(q('dms'), dd)}</b>`); }
      if (e.sk === 'duncan') L.push(`R₂ = r₂ · √(CMe / r) = ${fx(rTab(2, d.gl))} · ${f4(ee)} = <b>${fx(q('R2'), dd)}</b>`, `R${d.t} = ${fx(rTab(d.t, d.gl))} · ${f4(ee)} = <b>${fx(q('Rt'), dd)}</b>`);
      if (e.sk === 'dunnett') L.push(`D = d(${d.t - 1}; ${d.gl}) · √(2·CMe / r) = ${fx(dTab(d.t - 1, d.gl))} · √(2·${fx(d.cme, 4)} / ${d.r}) = <b>${fx(q('dms'), dd)}</b>`);
      const cmp = comparaciones(e.sk, d.medias, d.medias.map(() => d.r), d.cme, d.gl, ALFA, 0, false);
      L.push(cmp.pares.map(p => `T${p.i + 1}−T${p.j + 1}: |${fx(p.dif, dd)}| ${p.sig ? '>' : '≤'} ${fx(p.dms, dd)}${p.sig ? ' ✓' : ''}`).join(' · '), `${esc(t('Pares que difieren'))}: <b>${q('nsig')}</b>`); break;
    }
    case 'regresion': { const m = e.m; L.push(`x̄ = ${fx(m.mx, 2)} · ȳ = ${fx(m.my, 4)}`, `b = Sxy / Sxx = ${fx(m.sxy, 3)} / ${fx(m.sxx, 1)} = <b>${fx(m.b, 4)}</b>`, `a = ȳ − b · x̄ = <b>${fx(m.a)}</b>`, `r = ${fx(m.r, 4)} → R² = <b>${fx(m.r2)}</b>`); break; }
    case 'correl': { const tc = tTab(0.975, d.n - 2); L.push(`t = ${fx(d.r)} · √(${d.n} − 2) / √(1 − ${fx(d.r)}²) = <b>${fx(q('t'))}</b>`, esc(t('|t| {0} t crítico ({1} gl) = {2} → {3}', Math.abs(q('t')) > tc ? '>' : '≤', d.n - 2, fx(tc, 3), t(OPC[q('dec')])))); break; }
  }
  return L.map(l => `<li>${l}</li>`).join('');
}
function pintaEjercicio() {
  const A = S.act, e = ej(), sk = skillDe(A.sk), ra = raDe(sk.ra), Dm = mapaDominio(S.eventos)[A.sk], c = e.d.ctx ? ctxTxt(e.d.ctx) : null;
  const campos = e.q.map(q => {
    const [et, u0] = ETQ[A.sk][q.id], u = u0 === 'ctx' ? (c ? c.u : '') : u0, r = A.res && A.res.find(x => x.id === q.id), cls = r ? (r.ok ? 'ok' : 'mal') : '';
    if (q.tipo === 'opc') return `<fieldset class="ag-opc ${cls}" ${A.fin ? 'disabled' : ''}><legend>${esc(t(et))}</legend>${q.opciones.map(o => `<label><input type="radio" name="r_${q.id}" value="${o}" ${A.resp[q.id] === o ? 'checked' : ''}> ${esc(t(OPC[o]))}</label>`).join('')}</fieldset>`;
    return `<div class="field ag-resp ${cls}"><label for="r_${q.id}">${esc(t(et))}${u ? ` (${esc(t(u))})` : ''} <small class="muted">· ${esc(decTxt(q.dec))}</small></label><input type="text" inputmode="decimal" id="r_${q.id}" autocomplete="off" value="${esc(A.resp[q.id] || '')}" ${A.fin ? 'readonly' : ''} aria-describedby="fbEj"></div>`;
  }).join('');
  const fbHtml = A.res ? A.res.map(r => { const [et] = ETQ[A.sk][r.id]; return `<li class="${r.ok ? 'ok' : 'mal'}"><b>${r.ok ? '✓' : '✗'} ${esc(t(et))}</b>${r.ok ? '' : ' · ' + esc(diagTxt(A.sk, r.diag || 'otro'))}</li>`; }).join('') : '';
  const puedeVer = A.intentos >= 2 && !A.fin, quedan = DOMINIO.maxIntentos - A.intentos;
  $('cardEj').innerHTML = `<div class="ag-ej-cab"><span class="ag-ra" style="--c:${ra.c}">${ra.id}</span><h3 id="ejTit" class="ag-h3" tabindex="-1">${esc(t(sk.nombre))}</h3><span class="fa-chip">${esc(t(ESTADO[Dm.estado]))} · ${esc(t('dominio'))} ${fx(Dm.mEff)}</span></div>
    <p class="ag-motivo"><svg class="i"><use href="#i-compass"/></svg> ${esc(t(MOTIVO[A.motivo] || MOTIVO.nueva))}</p>
    <div class="ag-enun">${enunciado(e)}</div>
    <div class="ag-campos">${campos}</div>
    <ul class="ag-fb" id="fbEj" aria-live="polite">${fbHtml}${A.fin ? `<li class="${A.okFinal ? 'ok' : ''}"><b>${esc(A.okFinal === 1 ? t('¡Correcto a la primera!') : A.okFinal ? t('Correcto al segundo intento.') : A.visto ? t('Has visto la solución: esta habilidad volverá pronto.') : t('Sin intentos: aquí tienes la solución resuelta.'))}</b></li>` : ''}</ul>
    ${A.fin || A.visto ? `<div class="ag-sol"><h4>${esc(t('Solución resuelta'))}</h4><ol>${resuelto(e)}</ol></div>` : ''}
    ${A.ia ? `<div class="ag-ia"><h4>${esc(t('Explicación de la IA'))}</h4><p>${esc(A.ia.texto)}</p>${A.ia.quitadas ? `<p class="help">${esc(t('Se eliminaron {0} frase(s) que revelaban el resultado.', A.ia.quitadas))}</p>` : ''}</div>` : ''}
    <div class="actions">${A.fin ? `<button class="btn btn-primary" id="btnSig" type="button">${ico('right')}<span>${esc(t('Siguiente actividad'))}</span></button>` : `<button class="btn btn-primary" id="btnComprobar" type="button">${ico('check')}<span>${esc(t('Comprobar'))}</span></button>`}
      ${!A.fin && A.intentos > 0 && A.res && A.res.some(r => !r.ok) ? `<button class="btn btn-ghost" id="btnExplica" type="button">${ico('sparkles')}<span>${esc(t('Explícame mi error (IA)'))}</span></button>` : ''}
      ${puedeVer ? `<button class="btn btn-ghost" id="btnVer" type="button">${ico('eye')}<span>${esc(t('Ver la solución resuelta'))}</span></button>` : ''}</div>
    ${!A.fin && A.intentos ? `<p class="help">${esc(t('Te quedan {0} intento(s).', quedan))}</p>` : ''}<p class="help" id="estadoEj" role="status"></p>`;
}
function leeResp() { const A = S.act, e = ej(); e.q.forEach(q => { if (q.tipo === 'opc') { const c = document.querySelector(`input[name="r_${q.id}"]:checked`); A.resp[q.id] = c ? c.value : ''; } else A.resp[q.id] = ($('r_' + q.id) || {}).value || ''; }); }
function cierra(okFinal) { const A = S.act; A.fin = true; A.okFinal = okFinal; S.eventos.push({sk: A.sk, t: Date.now(), ok: okFinal, n: A.intentos, err: A.diag1, sol: A.visto}); }
document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b || !$('cardEj').contains(b)) return; const A = S.act;
  if (b.id === 'btnComprobar') {
    leeResp(); const ex = ej(); if (ex.q.some(q => !String(A.resp[q.id] || '').trim())) return toast(t('Responde todas las preguntas'));
    A.intentos++; A.res = corrige(ex, A.resp); A.ia = null; const todo = A.res.every(r => r.ok);
    if (A.intentos === 1 && !todo) A.diag1 = (A.res.find(r => !r.ok) || {}).diag || 'otro';
    if (todo) cierra(A.intentos === 1 ? 1 : A.intentos === 2 ? 0.5 : 0); else if (A.intentos >= DOMINIO.maxIntentos) { A.visto = true; cierra(0); }
    await guardaYa(); pintaEjercicio(); const f = $('btnSig') || $('btnComprobar'); f && f.focus();
  } else if (b.id === 'btnVer') { A.visto = true; cierra(0); await guardaYa(); pintaEjercicio(); }
  else if (b.id === 'btnSig') { nuevaActividad(); pintaPractica(); $('ejTit')?.focus?.(); window.scrollTo({top: 0}); }
  else if (b.id === 'btnExplica') explicaIA();
});

/* aviso previo al envío: muestra lo que sale (ya enmascarado) y pide confirmación una vez por sesión */
let envioRes = null;
function pideEnvio(textoEnviado, masks) {
  if (ENVIO_OK) return Promise.resolve(true);
  $('envioInfo').innerHTML = `<p class="sub" style="margin-top:0">${esc(t('Se enviarán unos {0} caracteres a {1}. Se han enmascarado {2} dato(s) personales.', nf(textoEnviado.length), PROV[getProv()].n, masks))}</p><p class="help">${esc(t('Muestra del envío:'))}</p>`;
  $('envioTxt').textContent = textoEnviado.slice(0, 3000) + (textoEnviado.length > 3000 ? '\n…' : '');
  $('envioOk').checked = false; $('envioSi').disabled = true; $('mEnvio').classList.add('on');
  return new Promise(r => { envioRes = r; });
}
function cierraEnvio(v) { $('mEnvio').classList.remove('on'); if (envioRes) { const r = envioRes; envioRes = null; if (v) ENVIO_OK = true; r(v); } }
_cierres.mEnvio = () => cierraEnvio(false);
$('envioOk').onchange = () => { $('envioSi').disabled = !$('envioOk').checked; };
$('envioSi').onclick = () => cierraEnvio(true); $('envioNo').onclick = () => cierraEnvio(false);

const textoPlano = html => { const d = document.createElement('div'); d.innerHTML = html.replace(/<\/(p|tr|li)>/g, '\n').replace(/<\/t[dh]>/g, ' | '); return d.textContent.replace(/[ \t]+\n/g, '\n').trim(); };
const numsHtml = html => (textoPlano(html).match(/-?\d+(?:[.,]\d+)?/g) || []).map(parseNum).filter(Number.isFinite);
async function explicaIA() {
  const A = S.act, e = ej(); if (!pideClave()) return;
  const enun = textoPlano(enunciado(e)), resp = e.q.map(q => `${t(ETQ[A.sk][q.id][0])}: ${q.tipo === 'opc' ? (A.resp[q.id] ? t(OPC[A.resp[q.id]]) : '—') : (A.resp[q.id] || '—')}`).join('\n');
  const diag = A.res.filter(r => !r.ok).map(r => diagTxt(A.sk, r.diag || 'otro')).join(' ');
  const user = `EJERCICIO (${t(skillDe(A.sk).nombre)}):\n${enun}\n\nRESPUESTA DEL ESTUDIANTE:\n${resp}\n\nDIAGNÓSTICO DEL CORRECTOR AUTOMÁTICO:\n${diag}\n\nExplica en un máximo de 120 palabras qué concepto falla y da una pista para el siguiente intento. NO des el resultado ni valores intermedios que no aparezcan en el enunciado; no rehagas el cálculo completo.\n${INSTR_IDIOMA()}`;
  if (!(await pideEnvio(user, 0))) return;
  $('estadoEj').innerHTML = '<span class="spin"></span> ' + esc(t('Pidiendo una explicación…'));
  try {
    const out = await llm([{role: 'system', content: 'Eres tutor de estadística inferencial y diseño experimental agropecuario. Ayudas a entender el error sin dar nunca el resultado numérico.'}, {role: 'user', content: user}], {max: 600});
    const sols = e.q.filter(q => q.tipo !== 'opc').map(q => q.sol), f = filtraFugas(out, sols, numsHtml(enunciado(e)));
    A.ia = {texto: f.texto || diagTxt(A.sk, (A.res.find(r => !r.ok) || {}).diag || 'otro'), quitadas: f.quitadas}; await guardaYa(); pintaEjercicio();
  } catch (er) { $('estadoEj').textContent = er.message; toast(er.message, 8000); }
}

/* ── laboratorio ── */
const DIS = ['dca', 'dbca', 'cl', 'factorial', 'crossover', 'regresion'];
const DIS_TXT = {dca: 'Completamente al azar (DCA)', dbca: 'Bloques completos al azar (DBCA)', cl: 'Cuadrado latino', factorial: 'Factorial de dos factores (con o sin bloques)', crossover: 'Cross-over 2 × 2', regresion: 'Regresión lineal simple'};
const ROL_TXT = {y: 'Variable respuesta', trt: 'Tratamiento', bloque: 'Bloque', fila: 'Fila', col: 'Columna', A: 'Factor A', B: 'Factor B', sujeto: 'Sujeto (animal o unidad)', sec: 'Secuencia (AB / BA)', periodo: 'Periodo', x: 'Variable explicativa (X)'};
const MET_TXT = {tukey: 'Tukey (DHS)', duncan: 'Duncan', mds: 'MDS (Fisher)', dunnett: 'Dunnett (frente al testigo)'};
const FUENTE = {'Tratamientos': 'Tratamientos', 'Bloques': 'Bloques', 'Error': 'Error', 'Total': 'Total', 'Filas': 'Filas', 'Columnas': 'Columnas', 'Regresión': 'Regresión', 'Residual': 'Residual', 'Periodo': 'Periodo', 'Secuencia (arrastre)': 'Secuencia (arrastre)', 'Sujetos(secuencia)': 'Sujetos(secuencia)'};
const EJ_LAB = {
  dca: 'tratamiento;rendimiento\nT1;20,1\nT1;21,3\nT1;19,8\nT1;20,6\nT2;23,4\nT2;24,1\nT2;22,9\nT2;23,8\nT3;20,9\nT3;21,7\nT3;21,2\nT3;20,4',
  dbca: EJ_CSV,
  cl: 'fila;columna;tratamiento;rendimiento\nF1;C1;A;31,2\nF1;C2;B;33,0\nF1;C3;C;34,1\nF1;C4;D;36,4\nF2;C1;B;33,9\nF2;C2;C;35,2\nF2;C3;D;37,3\nF2;C4;A;32,6\nF3;C1;C;35,8\nF3;C2;D;37,6\nF3;C3;A;33,4\nF3;C4;B;35,1\nF4;C1;D;38,7\nF4;C2;A;34,0\nF4;C3;B;36,0\nF4;C4;C;37,4',
  factorial: 'bloque;variedad;dosis;rendimiento\nB1;V1;N0;5,1\nB1;V1;N60;5,9\nB1;V1;N120;6,6\nB1;V2;N0;5,4\nB1;V2;N60;6,5\nB1;V2;N120;7,6\nB2;V1;N0;5,3\nB2;V1;N60;6,1\nB2;V1;N120;6,7\nB2;V2;N0;5,6\nB2;V2;N60;6,8\nB2;V2;N120;7,9\nB3;V1;N0;5,5\nB3;V1;N60;6,2\nB3;V1;N120;7,0\nB3;V2;N0;5,7\nB3;V2;N60;6,9\nB3;V2;N120;8,1',
  crossover: 'vaca;secuencia;periodo;suplemento;leche\nV1;AB;1;A;19,6\nV1;AB;2;B;18,1\nV2;AB;1;A;20,4\nV2;AB;2;B;18,6\nV3;AB;1;A;18,9\nV3;AB;2;B;17,8\nV4;AB;1;A;21,0\nV4;AB;2;B;19,5\nV5;BA;1;B;18,2\nV5;BA;2;A;19,4\nV6;BA;1;B;19,0\nV6;BA;2;A;20,6\nV7;BA;1;B;17,6\nV7;BA;2;A;19,1\nV8;BA;1;B;18,8\nV8;BA;2;A;20,3',
  regresion: 'dosis_N;rendimiento\n0;4,1\n30;4,9\n60;5,6\n90;6,0\n120;6,9\n150;7,2\n180;7,3'
};
function rolesUI() {
  const {cab, filas} = leeCSV(S.lab.csv), rs = ROLES[S.lab.dis];
  if (!cab.length) { $('labRoles').innerHTML = `<p class="help" style="grid-column:1/-1">${esc(t('Pega tus datos o carga el ejemplo para elegir las columnas.'))}</p>`; return; }
  const guess = adivinaRoles(cab, S.lab.dis, filas); rs.forEach(r0 => { const r = r0.replace('?', ''); if (!(S.lab.roles[r] >= 0 && S.lab.roles[r] < cab.length) && guess[r] !== undefined) S.lab.roles[r] = guess[r]; });
  $('labRoles').innerHTML = rs.map(r0 => { const r = r0.replace('?', ''), opc = r0.endsWith('?'); return `<div class="field" style="margin:0"><label for="rol_${r}">${esc(t(ROL_TXT[r]))}${opc ? ' ' + esc(t('(opcional)')) : ''}</label><select id="rol_${r}" data-rol="${r}">${opc ? `<option value="-1">${esc(t('— ninguna —'))}</option>` : ''}${cab.map((c, k) => `<option value="${k}" ${S.lab.roles[r] === k ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>`; }).join('');
  if (rs.includes('bloque?') && !(S.lab.roles.bloque >= 0)) $('rol_bloque').value = '-1';
  pintaTestigo();
}
function pintaTestigo() {
  const {filas} = leeCSV(S.lab.csv), k = S.lab.roles.trt, niv = k >= 0 ? nivelesDe(filas.map(f => (f[k] || '').trim()).filter(Boolean)) : [];
  $('labTestigo').innerHTML = niv.map(n => `<option ${n === S.lab.testigo ? 'selected' : ''}>${esc(n)}</option>`).join('');
  $('boxTestigo').hidden = S.lab.met !== 'dunnett' || S.lab.dis === 'regresion' || S.lab.dis === 'factorial';
  $('labMet').disabled = S.lab.dis === 'regresion' || S.lab.dis === 'crossover';
}
function pintaLab() {
  $('labDis').innerHTML = DIS.map(d => `<option value="${d}" ${S.lab.dis === d ? 'selected' : ''}>${esc(t(DIS_TXT[d]))}</option>`).join('');
  $('labMet').innerHTML = Object.keys(MET_TXT).map(m => `<option value="${m}" ${S.lab.met === m ? 'selected' : ''}>${esc(t(MET_TXT[m]))}</option>`).join('');
  $('crDis').innerHTML = ['dca', 'dbca', 'cl'].map(d => `<option value="${d}">${esc(t(DIS_TXT[d]))}</option>`).join('');
  $('csvLab').value = S.lab.csv; rolesUI(); pintaResLab(); pintaCroq();
  $('listaCrit').innerHTML = CRITERIOS.map(c => `<li>${esc(t(c[1]))}</li>`).join('');
  $('informe').value = S.inf.texto; pintaFb();
}
$('labDis').onchange = e => { S.lab.dis = e.target.value; S.lab.roles = {}; S.lab.res = null; guarda(); rolesUI(); pintaResLab(); };
$('labMet').onchange = e => { S.lab.met = e.target.value; guarda(); pintaTestigo(); };
$('labTestigo').onchange = e => { S.lab.testigo = e.target.value; guarda(); };
$('labRoles').addEventListener('change', e => { const s = e.target.closest('select[data-rol]'); if (!s) return; S.lab.roles[s.dataset.rol] = +s.value; guarda(); pintaTestigo(); });
$('csvLab').addEventListener('input', e => { S.lab.csv = e.target.value; S.esEjemplo = false; guarda(); clearTimeout(rolesUI._t); rolesUI._t = setTimeout(rolesUI, 400); });
$('fileCsv').onchange = async e => { const f = e.target.files[0]; if (!f) return; if (f.size > 2e6) return toast(t('El fichero es demasiado grande (máx. 2 MB)')); S.lab.csv = await f.text(); S.lab.roles = {}; S.esEjemplo = false; $('csvLab').value = S.lab.csv; rolesUI(); guarda(); e.target.value = ''; };
['lblFile', 'lblEvid'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $(id === 'lblFile' ? 'fileCsv' : 'fileEvid').click(); } }));
$('btnDatosEj').onclick = () => { S.lab.csv = EJ_LAB[S.lab.dis]; S.lab.roles = {}; S.lab.res = null; $('csvLab').value = S.lab.csv; rolesUI(); guarda(); toast(t('Datos de ejemplo ficticios')); };
/* el resultado se guarda resumido (sin funciones ni datos repetidos) y se repinta en el idioma activo */
function resumenLab(A) { if (!A || A.error) return A; return JSON.parse(JSON.stringify(A, (k, v) => k === 'a' && Array.isArray(v) ? undefined : v)); }
$('btnLab').onclick = () => {
  $('estadoLab').innerHTML = '<span class="spin"></span> ' + esc(t('Calculando…'));
  setTimeout(() => {
    S.lab.testigo = $('labTestigo').value || S.lab.testigo;
    const A = analizaLab(S.lab.csv, S.lab.dis, S.lab.roles, {metodo: S.lab.met, testigo: S.lab.testigo});
    S.lab.res = resumenLab(A); S.esEjemplo = false; guarda(); $('estadoLab').textContent = ''; pintaResLab(); if (!A.error) $('resLab').scrollIntoView({behavior: 'smooth', block: 'start'});
  }, 30);
};
const ERR_LAB = {vacio: 'No hay datos: pega una tabla con cabecera.', rol: 'Falta asignar la columna «{0}».', repetida: 'Has asignado la misma columna a dos papeles distintos.', pocos: 'Hacen falta al menos 4 filas válidas. Filas válidas: {0}.',
  incompleto: 'El DBCA necesita una observación por tratamiento y bloque; «{0}» en «{1}» tiene {2}.', dimension: 'Un cuadrado latino de {0} tratamientos necesita {0} filas, {0} columnas y {0}² observaciones.', nolatino: 'No es un cuadrado latino: algún tratamiento se repite en una fila o una columna.',
  faltanCeldas: 'Faltan combinaciones de los factores: se esperaban {0} y hay {1}.', desequilibrado: 'El factorial debe ser equilibrado (mismo número de repeticiones por combinación).', bloques: 'El número de bloques ({0}) debe coincidir con las repeticiones por combinación ({1}).', singl: 'No quedan grados de libertad para el error.',
  no2x2: 'El cross-over de la app es 2 × 2: dos secuencias, dos periodos y dos tratamientos.', sujetos: 'Cada sujeto debe tener una observación en cada periodo, con tratamientos distintos.', secuencia: 'Las secuencias no son coherentes (AB / BA) con los tratamientos de cada periodo.'};
const ftab = f => t(FUENTE[f] || f);
function tablaAnova(A) {
  return `<div class="table-wrap"><table class="ag-tab ag-anova"><caption class="help" style="text-align:left;caption-side:top">${esc(t('Tabla de análisis de varianza'))}</caption><thead><tr><th scope="col">${esc(t('Fuente'))}</th><th scope="col">gl</th><th scope="col">SC</th><th scope="col">CM</th><th scope="col">F</th><th scope="col">p</th></tr></thead><tbody>${A.tabla.map(f => `<tr class="${f.fuente === 'Total' ? 'tot' : ''}"><td>${esc(ftab(f.fuente))}</td><td>${f.gl}</td><td>${fx(f.sc, 4)}</td><td>${Number.isFinite(f.cm) ? fx(f.cm, 4) : ''}</td><td>${Number.isFinite(f.F) ? fx(f.F, 3) : ''}</td><td class="${f.p < ALFA ? 'sig' : ''}">${Number.isFinite(f.p) ? fp(f.p) + (f.p < ALFA ? ' *' : '') : ''}</td></tr>`).join('')}</tbody></table></div><p class="help">${esc(t('* significativo con α = 0,05.'))}</p>`;
}
function grafMedias(niv, medias, letrasArr, titulo) {
  const W = 560, H = 260, M = 44, n = niv.length, max = Math.max(...medias) * 1.12 || 1, bw = Math.min(70, (W - M - 20) / n * 0.6), x = i => M + (i + 0.5) * (W - M - 16) / n, y = v => H - 34 - v / max * (H - 60);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max);
  return `<svg class="ag-svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="gmT gmD"><title id="gmT">${esc(titulo)}</title><desc id="gmD">${esc(niv.map((l, i) => `${l}: ${fx(medias[i], 2)}${letrasArr ? ' ' + letrasArr[i] : ''}`).join('; '))}</desc>
    ${ticks.map(v => `<line x1="${M}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" stroke="#E8EEF4"/><text x="${M - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#4A5F75">${fx(v, 1)}</text>`).join('')}
    ${niv.map((l, i) => `<rect x="${x(i) - bw / 2}" y="${y(medias[i])}" width="${bw}" height="${H - 34 - y(medias[i])}" rx="5" fill="#0B7566"/><text x="${x(i)}" y="${y(medias[i]) - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="#3B2E86">${letrasArr ? esc(letrasArr[i]) : ''}</text><text x="${x(i)}" y="${H - 16}" text-anchor="middle" font-size="11.5" fill="#0F2237">${esc(String(l).slice(0, 14))}</text>`).join('')}</svg>`;
}
function dispersion(A, nx, ny) {
  const W = 520, H = 290, M = 46, xs = A.datos ? A.datos.map(d => d.x) : A.xs, ys = A.datos ? A.datos.map(d => d.y) : A.ys, x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), py = (y1 - y0) * 0.1 || 1;
  const sx = x => M + (x - x0) / ((x1 - x0) || 1) * (W - M - 16), sy = y => H - M + 10 - (y - y0 + py) / ((y1 - y0 + 2 * py) || 1) * (H - M - 10);
  return `<svg class="ag-svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="dsT dsD"><title id="dsT">${esc(t('{0} frente a {1}', ny, nx))}</title><desc id="dsD">${esc(t('{0} puntos; recta ajustada {1} = {2} + {3} · {4}; R² = {5}.', A.n, ny, fx(A.a, 3), fx(A.b, 4), nx, fx(A.r2, 3)))}</desc>
    <line x1="${sx(x0)}" y1="${sy(A.a + A.b * x0)}" x2="${sx(x1)}" y2="${sy(A.a + A.b * x1)}" stroke="#C9441F" stroke-width="2.5"/>
    ${xs.map((x, k) => `<circle cx="${sx(x)}" cy="${sy(ys[k])}" r="5.5" fill="#0B7566" stroke="#fff" stroke-width="1.5"/>`).join('')}
    ${[x0, (x0 + x1) / 2, x1].map(v => `<text x="${sx(v)}" y="${H - M + 26}" text-anchor="middle" font-size="11" fill="#4A5F75">${fx(v, 1)}</text>`).join('')}${[y0, (y0 + y1) / 2, y1].map(v => `<text x="${M - 6}" y="${sy(v) + 4}" text-anchor="end" font-size="11" fill="#4A5F75">${fx(v, 2)}</text>`).join('')}
    <text x="${(W + M) / 2}" y="${H - 4}" text-anchor="middle" font-size="12" fill="#0F2237">${esc(nx)}</text><text x="12" y="${H / 2}" transform="rotate(-90 12 ${H / 2})" text-anchor="middle" font-size="12" fill="#0F2237">${esc(ny)}</text></svg>`;
}
const AVISO = {descartadas: 'Filas sin datos válidos, no usadas: {0}.', normalidad: 'Los residuos no parecen normales (Shapiro-Wilk p = {0}): revisa valores atípicos o transforma la variable (logaritmo, raíz) antes de concluir.', varianzas: 'Las varianzas no parecen homogéneas (Levene p = {0}): considera transformar la variable o usar un ANAVAR de Welch.',
  pocosGl: 'Pocos grados de libertad en el error ({0}): las pruebas tienen poca potencia.', desequilibrio: 'Repeticiones desiguales: {0} usa la media armónica de n (aproximación).', cv: 'Coeficiente de variación alto ({0} %): el experimento es poco preciso.',
  interaccion: 'La interacción es significativa (p = {0}): interpreta las combinaciones, no los efectos principales por separado.', bloquesInutiles: 'La eficiencia relativa de los bloques es {0} (< 1): bloquear no mejoró la precisión.', arrastre: 'La secuencia (efecto de arrastre) tiene p = {0} (< 0,10): el efecto de tratamiento podría estar sesgado; revisa el periodo de descanso.'};
function fmtAviso([k, v]) { return t(AVISO[k], k === 'descartadas' ? v : k === 'desequilibrio' ? t(MET_TXT[v]) : k === 'pocosGl' ? v : k === 'cv' ? fx(v, 1) : k === 'bloquesInutiles' ? fx(v, 2) : fp(v)); }
function pintaResLab() {
  const A = S.lab.res, cab = A && A.cab ? A.cab : leeCSV(S.lab.csv).cab;
  if (!A) { $('resLab').innerHTML = ''; return; }
  if (A.error) { $('resLab').innerHTML = `<div class="card"><div class="aviso">${esc(t(ERR_LAB[A.error] || 'No se pudo analizar.', A.error === 'rol' ? t(ROL_TXT[A.rol]) : A.error === 'incompleto' ? A.trt : A.error === 'dimension' ? A.t : A.error === 'pocos' ? A.n : A.error === 'faltanCeldas' ? A.esperadas : A.error === 'bloques' ? A.bloques : '', A.error === 'incompleto' ? A.bloque : A.error === 'faltanCeldas' ? A.hay : A.error === 'bloques' ? A.r : '', A.error === 'incompleto' ? A.n : ''))}</div></div>`; return; }
  const ny = cab[S.lab.roles.y] || 'y', av = A.avisos && A.avisos.length ? `<ul class="ag-avisos">${A.avisos.map(a => `<li>${esc(fmtAviso(a))}</li>`).join('')}</ul>` : '';
  const sup = `<div class="ag-sup">${A.sw ? `<div class="${A.sw.p < ALFA ? 'mal' : 'ok'}"><b>${esc(t('Normalidad de los residuos'))}</b>Shapiro-Wilk W = ${fx(A.sw.W, 4)} · p = ${fp(A.sw.p)}<br>${esc(A.sw.p < ALFA ? t('Se rechaza la normalidad (α = 0,05).') : t('No se rechaza la normalidad (α = 0,05).'))}</div>` : ''}${A.lev ? `<div class="${A.lev.p < ALFA ? 'mal' : 'ok'}"><b>${esc(t('Homogeneidad de varianzas'))}</b>Levene F(${A.lev.df1}, ${A.lev.df2}) = ${fx(A.lev.F, 3)} · p = ${fp(A.lev.p)}<br>${esc(A.lev.p < ALFA ? t('Las varianzas no son homogéneas (α = 0,05).') : t('No se rechaza la homogeneidad (α = 0,05).'))}</div>` : ''}</div>`;
  let cuerpo = '';
  if (A.diseno === 'regresion') {
    const nx = cab[S.lab.roles.x] || 'x';
    cuerpo = `<div class="ag-campo"><div>${dispersion(A, nx, ny)}</div><div><dl class="ag-dl"><dt>${esc(t('Modelo'))}</dt><dd>${esc(ny)} = ${fx(A.a, 4)} ${A.b < 0 ? '−' : '+'} ${fx(Math.abs(A.b), 5)} · ${esc(nx)}</dd><dt>n</dt><dd>${A.n}</dd><dt>r</dt><dd>${fx(A.r, 4)}</dd><dt>R²</dt><dd>${fx(A.r2, 4)}</dd>
      <dt>b</dt><dd>${fx(A.b, 5)} (EE ${fx(A.eeb, 5)}; t = ${fx(A.tb, 3)}; p = ${fp(A.pb)})</dd><dt>${esc(t('IC 95 % de b'))}</dt><dd>[${fx(A.icb[0], 5)} ; ${fx(A.icb[1], 5)}]</dd><dt>a</dt><dd>${fx(A.a, 4)} (t = ${fx(A.ta, 3)}; p = ${fp(A.pa)})</dd></dl></div></div>${tablaAnova(A)}`;
  } else {
    const met = A.comp ? A.comp.metodo : null;
    let comp = '';
    if (A.comp && met !== 'dunnett') comp = `<h4 class="ag-h4">${esc(t('Comparaciones múltiples: {0}', t(MET_TXT[met])))}</h4>${tabla([esc(t('Tratamiento')), esc(t('Media')), 'n', esc(t('Grupo'))], A.niveles.map((l, i) => [i, l]).sort((a, b) => A.medias[b[0]] - A.medias[a[0]]).map(([i, l]) => [esc(l), fx(A.medias[i], 3), String(A.n[i]), `<span class="ag-letra">${esc(A.letras[i])}</span>`]), 'ag-tab')}<p class="help">${esc(t('Medias con una letra en común no difieren significativamente (α = 0,05).'))}${met === 'duncan' ? ' ' + esc(t('Rangos de Duncan: {0}.', A.comp.Rp.map((v, p) => v ? `R${p} = ${fx(v, 3)}` : '').filter(Boolean).join(' · '))) : ` ${esc(t('Valor crítico'))}: ${fx(A.comp.critico, 4)}${new Set(A.n).size === 1 ? ` · ${esc(t('diferencia mínima'))} = ${fx(A.comp.pares[0] ? A.comp.pares[0].dms : NaN, 4)}` : ''}`}</p>${grafMedias(A.niveles, A.medias, A.letras, t('Medias de {0} por tratamiento', ny))}`;
    if (A.comp && met === 'dunnett') comp = `<h4 class="ag-h4">${esc(t('Comparaciones múltiples: {0}', t(MET_TXT[met])))}</h4>${tabla([esc(t('Tratamiento')), esc(t('Diferencia con el testigo')), esc(t('Diferencia mínima')), esc(t('¿Difiere?'))], A.comp.pares.map(p => [esc(A.niveles[p.i]), fx(p.dif, 3), fx(p.dms, 3), p.sig ? '✓ ' + esc(t('sí')) : esc(t('no'))]), 'ag-tab')}<p class="help">${esc(t('Testigo: {0} · d de Dunnett = {1}', A.niveles[A.comp.testigo], fx(A.comp.critico, 4)))}</p>${grafMedias(A.niveles, A.medias, null, t('Medias de {0} por tratamiento', ny))}`;
    let extra = '';
    if (A.diseno === 'dbca') extra = `<p class="help">${esc(t('Eficiencia relativa del DBCA frente a un DCA: {0} (> 1: los bloques mejoraron la precisión).', fx(A.eficiencia, 2)))}</p>`;
    if (A.diseno === 'crossover') extra = `<p>${esc(t('Efecto estimado {0} − {1} = {2} (EE {3}).', A.A, A.B, fx(A.efecto, 3), fx(A.ee, 3)))}</p>`;
    if (A.diseno === 'factorial') extra = A.compFactor.map((cf, j) => cf ? `<h4 class="ag-h4">${esc(t('Medias del factor {0}', A.nombres[j]))}</h4>${tabla([esc(A.nombres[j]), esc(t('Media')), esc(t('Grupo'))], A.L[j].map((l, i) => [esc(l), fx(A.medFactor[j][i], 3), `<span class="ag-letra">${esc(cf.letras[i])}</span>`]), 'ag-tab')}` : '').join('') + (A.efectos2k ? `<h4 class="ag-h4">${esc(t('Efectos (factorial 2ᵏ)'))}</h4>${tabla([esc(t('Efecto')), esc(t('Contraste')), esc(t('Estimación'))], A.efectos2k.map(e => [esc(e.nombre), fx(e.contraste, 3), fx(e.efecto, 4)]), 'ag-tab')}` : '');
    cuerpo = `${tablaAnova(A)}<p class="help">${esc(t('Media general {0} · CV = {1} %', fx(A.mediaGeneral, 3), fx(A.cv, 2)))}</p>${extra}${comp}`;
  }
  $('resLab').innerHTML = `<div class="card"><h3>${esc(t('Resultado: {0}', t(DIS_TXT[A.diseno])))}${S.esEjemplo ? ` <span class="fa-chip">${esc(t('ejemplo'))}</span>` : ''}</h3>${av}${cuerpo}<h4 class="ag-h4">${esc(t('Supuestos'))}</h4>${sup}</div>
    <div class="card"><h3>${esc(t('Compruébalo en R'))}</h3><p class="help" style="margin-top:0">${esc(t('Guarda tus datos como datos.csv (botón de abajo) en la carpeta de trabajo de R y ejecuta este script. Si un resultado no coincide, avisa a tu profesor: auditar es parte del trabajo.'))}</p>
      <pre class="fa-pre ag-code" id="scriptR">${esc(scriptR(A.diseno, cab, S.lab.roles, {metodo: S.lab.met, testigo: S.lab.testigo, sep: leeCSV(S.lab.csv).sep}))}</pre>
      <div class="actions"><button class="btn btn-ghost btn-sm" id="btnCopyR" type="button">${ico('copy')}<span>${esc(t('Copiar el script'))}</span></button><button class="btn btn-ghost btn-sm" id="btnDlR" type="button">${ico('download')}<span>${esc(t('Descargar el script (.R)'))}</span></button><button class="btn btn-ghost btn-sm" id="btnDlDatos" type="button">${ico('download')}<span>${esc(t('Descargar datos.csv'))}</span></button></div></div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'btnCopyR') { try { await navigator.clipboard.writeText($('scriptR').textContent); toast(t('Script copiado')); } catch { toast(t('No se pudo copiar: selecciona el texto y cópialo a mano')); } }
  if (b.id === 'btnDlR') dl('inferencia_analisis.R', $('scriptR').textContent, 'text/plain;charset=utf-8');
  if (b.id === 'btnDlDatos') dl('datos.csv', '﻿' + S.lab.csv.replace(/^﻿/, ''), 'text/csv;charset=utf-8');
});
/* croquis */
function pintaCroq() {
  const c = S.croq; if (!c) { $('resCroq').innerHTML = ''; return; }
  $('resCroq').innerHTML = `<div class="table-wrap"><table class="ag-croq" aria-label="${esc(t('Croquis de aleatorización'))}"><tbody>${c.filas.map((f, i) => `<tr><th scope="row">${esc(c.diseno === 'dbca' ? t('Bloque {0}', i + 1) : c.diseno === 'cl' ? t('Fila {0}', i + 1) : t('Fila {0}', i + 1))}</th>${f.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="help">${esc(t('Semilla «{0}». En R, design.crd, design.rcbd o design.lsd de agricolae sortean otro croquis igual de válido.', c.semilla))}</p>`;
}
$('btnCroq').onclick = () => {
  const trts = $('crTrt').value.split(/[,;]/).map(x => x.trim()).filter(Boolean), r = Math.max(2, Math.min(12, +$('crR').value || 4)), dis = $('crDis').value, sem = $('crSem').value.trim() || '1';
  if (trts.length < 2 || new Set(trts).size !== trts.length) return toast(t('Escribe al menos dos tratamientos distintos'));
  if (dis === 'cl' && trts.length > 10) return toast(t('El cuadrado latino admite hasta 10 tratamientos'));
  S.croq = {...croquis(dis, trts, r, sem), semilla: sem}; guarda(); pintaCroq();
};
/* interpretación (informe) con IA: cinco criterios, citas comprobadas y cifras contrastadas con el análisis */
$('informe').addEventListener('input', e => { S.inf.texto = e.target.value; S.inf.fb = null; S.esEjemplo = false; guarda(); });
const valoresLab = A => { if (!A || A.error) return []; const v = []; (A.tabla || []).forEach(f => v.push(f.gl, f.sc, f.cm, f.F, f.p)); if (A.sw) v.push(A.sw.W, A.sw.p); if (A.lev) v.push(A.lev.F, A.lev.p, A.lev.df1, A.lev.df2); ['medias', 'medFactor'].forEach(k => A[k] && v.push(...[].concat(...[A[k]].flat(2)))); ['cv', 'mediaGeneral', 'eficiencia', 'efecto', 'ee', 'a', 'b', 'r', 'r2', 'n', 'N', 'n_obs'].forEach(k => Number.isFinite(A[k]) && v.push(A[k])); if (A.comp) { v.push(A.comp.critico); (A.comp.pares || []).forEach(p => v.push(p.dif, Math.abs(p.dif), p.dms)); (A.comp.Rp || []).forEach(x => Number.isFinite(x) && v.push(x)); } if (A.datos) A.datos.forEach(d => v.push(d.y)); v.push(ALFA, 0.05, 95, 100, 0.0001, 0.001, 0.01, 1, 2, 3, 4, 5); return v.filter(Number.isFinite); };
function procesaFb(j, texto, ejemplo = false) {
  const crit = CRITERIOS.map(([id]) => { const c = (j.criterios || []).find(x => String(x.id) === id) || {}; const cita = String(c.cita || '').trim(), ok = cita.length >= 8 && esFiel(texto, cita), nivel = ['logrado', 'parcial', 'ausente'].includes(c.nivel) ? c.nivel : 'ausente'; return {id, nivel: nivel === 'logrado' && !ok ? 'parcial' : nivel, nivelIA: nivel, cita, ok, sug: String(c.sug || '').slice(0, 400), recontado: nivel === 'logrado' && !ok}; });
  const vals = valoresLab(S.lab.res).concat((String(texto).match(/-?\d+(?:[.,]\d+)?/g) || []).map(parseNum)), sugNuevas = cifrasAjenas(crit.map(c => c.sug).join(' '), vals).map(v => fx(v, Math.min(4, (String(v).split('.')[1] || '').length)));
  return {crit, sugNuevas, ejemplo, fecha: new Date().toISOString()};
}
function pintaFb() {
  const F = S.inf.fb, A = S.lab.res && !S.lab.res.error ? S.lab.res : null, ajenas = A && S.inf.texto ? cifrasAjenas(S.inf.texto, valoresLab(A)) : [];
  const local = S.inf.texto ? `<div class="${ajenas.length ? 'aviso' : 'okbox'}" style="margin-top:12px">${A ? esc(ajenas.length ? t('Cifras de tu texto que no aparecen en tu análisis (comprobado por el código, sin IA): {0}. Revísalas o explica de dónde salen.', ajenas.map(v => fx(v, Math.min(4, (String(v).split('.')[1] || '').length))).join(' · ')) : t('Todas las cifras de tu texto coinciden con tu análisis (comprobado por el código, sin IA).')) : esc(t('Analiza tus datos para que el código compruebe las cifras de tu texto.'))}</div>` : '';
  if (!F) { $('fbInf').innerHTML = local; return; }
  $('fbInf').innerHTML = local + `<h4 class="ag-h4" style="margin-top:14px">${esc(t('Comentarios por criterio'))}${F.ejemplo ? ` <span class="fa-chip">${esc(t('ejemplo: no generado por la IA'))}</span>` : ''}</h4><ul class="ag-fbplan">${F.crit.map((c, k) => `<li><b>${esc(t(CRITERIOS[k][1]))}</b><br><span class="fa-chip ${c.nivel === 'logrado' ? 'ok' : c.nivel === 'parcial' ? 'aviso' : 'error'}">${esc(t(NIVEL[c.nivel]))}</span> ${c.cita ? (c.ok ? `✓ «${esc(c.cita)}»` : `⚠ ${esc(t('Cita no encontrada en tu texto'))}: «${esc(c.cita)}»`) : ''}${c.recontado ? `<br><small class="muted">${esc(t('Rebajado por el código a «parcial»: la IA no aportó una cita literal de tu texto.'))}</small>` : ''}<br>${esc(c.sug)}</li>`).join('')}</ul>${F.sugNuevas.length ? `<p class="help">${esc(t('Las sugerencias mencionan cifras que no están ni en tu texto ni en tu análisis: {0}.', F.sugNuevas.join(', ')))}</p>` : ''}<p class="help">${esc(t('Comentarios orientativos: no son una nota. Decide tu profesor.'))}</p>`;
}
$('btnInfIA').onclick = async () => {
  const tx = S.inf.texto.trim(); if (wc(tx) < 30) return toast(t('Escribe al menos 30 palabras'));
  if (!pideClave()) return;
  const sc = scrub(tx, S.alias), A = S.lab.res && !S.lab.res.error ? S.lab.res : null;
  const resumen = A ? (A.tabla || []).map(f => `${f.fuente}: gl=${f.gl}; SC=${red(f.sc, 4)}${Number.isFinite(f.F) ? `; F=${red(f.F, 3)}; p=${f.p < 1e-4 ? '<0.0001' : red(f.p, 4)}` : ''}`).join('\n') + (A.sw ? `\nShapiro-Wilk W=${red(A.sw.W, 4)} p=${red(A.sw.p, 4)}` : '') + (A.lev ? `\nLevene F=${red(A.lev.F, 3)} p=${red(A.lev.p, 4)}` : '') + (A.letras ? '\n' + A.niveles.map((l, i) => `${l}: media=${red(A.medias[i], 3)} grupo=${A.letras[i]}`).join('\n') : '') : 'Sin análisis disponible.';
  const user = `Comenta la interpretación de un estudiante sobre el análisis estadístico de su experimento agropecuario. Valora cada criterio con «logrado», «parcial» o «ausente», copia una CITA LITERAL del texto del estudiante que lo justifique (vacía si no hay) y da una sugerencia concreta de mejora (máximo 40 palabras). No pongas nota ni puntuación.\nCRITERIOS:\n${CRITERIOS.map(c => `- ${c[0]}: ${c[1]}`).join('\n')}\n\nRESULTADOS CALCULADOS POR LA APP (correctos):\n${resumen}\n\nTEXTO DEL ESTUDIANTE:\n${sc.t}\n\nDevuelve JSON: {"criterios":[{"id":"hipotesis","nivel":"logrado|parcial|ausente","cita":"…","sug":"…"}, …]}\n${INSTR_IDIOMA()}`;
  if (!(await pideEnvio(user, sc.n))) return;
  $('estadoInf').innerHTML = '<span class="spin"></span> ' + esc(t('Pidiendo comentarios…'));
  try {
    const j = await llmJSON([{role: 'system', content: 'Eres profesor de estadística inferencial y diseño experimental agropecuario. Das comentarios formativos, concretos y sin nota.'}, {role: 'user', content: user}], {max: 1800});
    S.inf.fb = procesaFb(j, tx); await guardaYa(); $('estadoInf').textContent = ''; pintaFb();
  } catch (er) { $('estadoInf').textContent = er.message; toast(er.message, 8000); }
};

/* ── progreso ── */
const resumenSkill = sk => { const ev = S.eventos.filter(e => e.sk === sk), errs = {}; ev.forEach(e => { if (e.err) errs[e.err] = (errs[e.err] || 0) + 1; }); const top = Object.entries(errs).sort((a, b) => b[1] - a[1])[0]; return {n: ev.length, prim: ev.length ? ev.filter(e => e.ok === 1).length / ev.length : NaN, err: top ? top[0] : null}; };
function pintaProgreso() {
  const M = mapaDominio(S.eventos), R = dominioRA(M);
  $('cardRA').innerHTML = `<h3>${esc(t('Dominio por resultado de aprendizaje'))}${S.esEjemplo ? ` <span class="fa-chip">${esc(t('ejemplo'))}</span>` : ''}</h3>${S.alias ? `<p class="help" style="margin-top:0">${esc(t('Seudónimo: {0} · {1} ejercicios', S.alias, S.eventos.length))}</p>` : ''}
    <div class="ag-bars">${RAS.map(r => R[r.id] === null ? `<div class="ag-bar"><span class="ag-ra" style="--c:${r.c}">${r.id}</span><div class="ag-bar-t"><span>${esc(t(r.txt))}</span><small class="muted">${esc(t('Se trabaja en el laboratorio (paso 2), con comentarios y sin dominio calculado.'))}${S.inf.texto ? ' · ' + esc(t('Interpretación redactada: {0} palabras.', wc(S.inf.texto))) : ''}</small></div></div>`
      : `<div class="ag-bar"><span class="ag-ra" style="--c:${r.c}">${r.id}</span><div class="ag-bar-t"><span>${esc(t(r.txt))}</span><div class="ag-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(R[r.id] * 100)}" aria-label="${esc(t('Dominio de {0}', r.id))}"><i style="width:${Math.round(R[r.id] * 100)}%;background:${r.c}"></i></div></div><b class="ag-pct">${pct(R[r.id])}</b></div>`).join('')}</div>`;
  $('tablaSk').innerHTML = `<table class="ag-tab"><thead><tr><th scope="col">${esc(t('Habilidad'))}</th><th scope="col">${esc(t('Estado'))}</th><th scope="col">${esc(t('Dominio'))}</th><th scope="col">${esc(t('Ejercicios'))}</th><th scope="col">${esc(t('A la primera'))}</th><th scope="col">${esc(t('Error más frecuente'))}</th></tr></thead><tbody>${SKILLS.map(s => { const d = M[s.id], r = resumenSkill(s.id), st = d.bloqueada && !d.n ? 'bloqueada' : d.estado; return `<tr><td><span class="ag-ra sm" style="--c:${raDe(s.ra).c}">${s.ra}</span> ${esc(t(s.nombre))}</td><td><span class="fa-chip ${st === 'dominada' ? 'ok' : st === 'repasar' ? 'aviso' : ''}">${esc(t(ESTADO[st]))}</span></td><td>${fx(d.mEff)}</td><td>${r.n}</td><td>${pct(r.prim)}</td><td>${r.err ? esc(diagTxt(s.id, r.err)) : '—'}</td></tr>`; }).join('')}</tbody></table>`;
  $('chkInf').checked = !!S.incluirInf;
}
$('chkInf').onchange = e => { S.incluirInf = e.target.checked; guarda(); };
async function evidencia() {
  const M = mapaDominio(S.eventos), R = dominioRA(M), A = S.lab.res && !S.lab.res.error ? S.lab.res : null;
  const o = {formato: 'inferencia/1', version: VERSION, asignatura: SILABO.codigo, alias: S.alias, ejemplo: !!S.esEjemplo, generado: new Date().toISOString(), lang: LANG,
    eventos: S.eventos.map(e => ({sk: e.sk, t: new Date(e.t).toISOString(), ok: e.ok, n: e.n, err: e.err || null, sol: !!e.sol})),
    dominio: Object.fromEntries(SKILLS.map(s => [s.id, red(M[s.id].mEff, 3)])), ra: Object.fromEntries(RAS.map(x => [x.id, R[x.id] === null ? null : red(R[x.id], 3)])),
    laboratorio: A ? {diseno: A.diseno, n: A.n_obs, tabla: A.tabla.map(f => ({fuente: f.fuente, gl: f.gl, sc: red(f.sc, 5), F: Number.isFinite(f.F) ? red(f.F, 4) : null, p: Number.isFinite(f.p) ? red(f.p, 6) : null})), shapiro_p: A.sw ? red(A.sw.p, 5) : null, levene_p: A.lev ? red(A.lev.p, 5) : null} : null,
    informe: S.incluirInf ? {texto: S.inf.texto, palabras: wc(S.inf.texto)} : {palabras: wc(S.inf.texto)}};
  if (S.incluirInf && S.lab.csv) o.datos_csv = S.lab.csv;
  o.huella = await sha256(canon(o)); return o;
}
const nombreFich = ext => `inferencia_${slug(S.alias || 'sin_alias')}_${new Date().toISOString().slice(0, 10)}.${ext}`;
$('btnEvid').onclick = async () => { if (!S.eventos.length) return toast(t('Aún no has hecho ningún ejercicio')); dl(nombreFich('json'), JSON.stringify(await evidencia(), null, 1), 'application/json'); };
$('btnCsv').onclick = () => { if (!S.eventos.length) return toast(t('Aún no has hecho ningún ejercicio')); dl(nombreFich('csv'), csvDe([t('fecha'), 'RA', t('habilidad'), t('puntuación'), t('intentos'), t('primer error'), t('vio la solución')], S.eventos.map(e => { const s = skillDe(e.sk); return [new Date(e.t).toLocaleString(locale()), s.ra, t(s.nombre), String(e.ok).replace('.', locale().startsWith('en') ? '.' : ','), e.n, e.err ? diagTxt(e.sk, e.err) : '', e.sol ? t('sí') : t('no')]; })), 'text/csv;charset=utf-8'); };
$('btnWord').onclick = async () => {
  if (!S.eventos.length && !S.inf.texto && !S.lab.res) return toast(t('Aún no hay nada que informar'));
  const M = mapaDominio(S.eventos), R = dominioRA(M), A = S.lab.res && !S.lab.res.error ? S.lab.res : null, x = [];
  x.push(wPara(t('Informe de práctica autónoma'), {h: 1}), wPara(`${SILABO.asignatura} · ${SILABO.codigo} · ${SILABO.universidad}`, {plain: true}), wPara(t('Seudónimo: {0} · {1} ejercicios · {2}', S.alias || '—', S.eventos.length, new Date().toLocaleDateString(locale())), {plain: true}));
  if (S.esEjemplo) x.push(wPara(t('Ejemplo de demostración con una estudiante ficticia.'), {plain: true, i: true}));
  x.push(wPara(t('Dominio por resultado de aprendizaje'), {h: 2}), wTabla([[t('RA'), t('Resultado de aprendizaje'), t('Dominio')], ...RAS.map(a => [a.id, t(a.txt), R[a.id] === null ? t('laboratorio') : pct(R[a.id])])]));
  x.push(wPara(t('Habilidades'), {h: 2}), wTabla([[t('Habilidad'), t('Estado'), t('Ejercicios'), t('A la primera')], ...SKILLS.map(s => { const d = M[s.id], q = resumenSkill(s.id); return [t(s.nombre), t(ESTADO[d.bloqueada && !d.n ? 'bloqueada' : d.estado]), String(q.n), pct(q.prim)]; })]));
  if (A) {
    x.push(wPara(t('Análisis de los datos del experimento: {0}', t(DIS_TXT[A.diseno])), {h: 2}), wTabla([[t('Fuente'), 'gl', 'SC', 'CM', 'F', 'p'], ...A.tabla.map(f => [ftab(f.fuente), String(f.gl), fx(f.sc, 4), Number.isFinite(f.cm) ? fx(f.cm, 4) : '', Number.isFinite(f.F) ? fx(f.F, 3) : '', Number.isFinite(f.p) ? fp(f.p) : ''])]));
    if (A.sw) x.push(wPara(`Shapiro-Wilk: W = ${fx(A.sw.W, 4)}; p = ${fp(A.sw.p)}${A.lev ? ` · Levene: F = ${fx(A.lev.F, 3)}; p = ${fp(A.lev.p)}` : ''}`, {plain: true}));
    if (A.letras) x.push(wTabla([[t('Tratamiento'), t('Media'), t('Grupo')], ...A.niveles.map((l, i) => [i, l]).sort((a, b) => A.medias[b[0]] - A.medias[a[0]]).map(([i, l]) => [l, fx(A.medias[i], 3), A.letras[i]])]));
  }
  if (S.inf.texto) { x.push(wPara(t('Interpretación'), {h: 2})); S.inf.texto.split(/\n+/).forEach(p => x.push(wPara(p, {plain: true}))); }
  if (S.inf.fb) x.push(wPara(t('Comentarios por criterio'), {h: 3}), wTabla([[t('Criterio'), t('Nivel'), t('Cita verificada'), t('Sugerencia')], ...S.inf.fb.crit.map((c, k) => [t(CRITERIOS[k][1]), t(NIVEL[c.nivel]), c.ok ? '«' + c.cita + '»' : '—', c.sug])]));
  x.push(wPara(t('El dominio es una estimación para orientar el estudio, no una nota. Los ejercicios y el análisis los calcula el código; la IA no pone nota. Generado con {0} {1}.', APP_NAME, VERSION), {plain: true, i: true, s: 18}));
  try { dl(nombreFich('docx'), await wordDeXml(x.join(''), {creador: APP_NAME, titulo: t('Informe de práctica autónoma')})); } catch (e) { toast(e.message, 7000); }
};
$('btnBorrar').onclick = async () => { if (!confirm(t('¿Borrar tu progreso, tus datos y tu interpretación de este navegador? No se puede deshacer.'))) return; S = nuevoS(); await guardaYa(); go(0); toast(t('Progreso borrado')); };

/* ── profesorado: agrega evidencias, verifica huellas, propone mejoras (decide el profesor), GIFT y autopsia ── */
async function leeEvidencia(txt, nombre) {
  let o; try { o = JSON.parse(txt); } catch { return {nombre, error: t('No es un JSON válido')}; }
  if (!o || o.formato !== 'inferencia/1' || !Array.isArray(o.eventos)) return {nombre, error: t('No es una evidencia de esta app')};
  const {huella, ...resto} = o, integra = huella === await sha256(canon(resto));
  return {nombre, o, integra};
}
$('fileEvid').onchange = async e => { const fs = [...e.target.files]; for (const f of fs) PROF.push(await leeEvidencia(await f.text(), f.name)); e.target.value = ''; pintaProf(); };
$('btnProfEj').onclick = async () => {
  PROF = []; const t0 = Date.UTC(2026, 9, 1);
  for (let k = 0; k < 12; k++) {
    const alias = 'grupo-' + String(k + 1).padStart(2, '0'), R = rngDe('prof|' + k), ev = [], hab = 0.55 + 0.035 * k;
    for (let j = 0; j < 60 + R.i(0, 50); j++) { const s = siguiente(ev, t0 + j * DIA / 4), dif = {tdos: 0.15, dca: 0.2, dbca: 0.2, f2k: 0.25, duncan: 0.2, cl: 0.15}[s.sk] || 0, ok = R.u(0, 1) < hab - dif ? 1 : R.u(0, 1) < 0.4 ? 0.5 : 0, errs = (ejercicio(alias, s.sk, 0).q.find(q => q.mut && q.mut.length) || {mut: []}).mut.map(m => m.k);
      ev.push({sk: s.sk, t: t0 + j * DIA / 4, ok, n: ok === 1 ? 1 : ok ? 2 : 3, err: ok === 1 ? null : (errs.length && R.u(0, 1) < 0.7 ? errs[0] : 'otro'), sol: ok === 0}); }
    const M = mapaDominio(ev, t0 + 20 * DIA), RA = dominioRA(M);
    const o = {formato: 'inferencia/1', version: VERSION, asignatura: SILABO.codigo, alias, ejemplo: true, generado: new Date(t0 + 20 * DIA).toISOString(), lang: 'es', eventos: ev.map(e => ({...e, t: new Date(e.t).toISOString()})), dominio: Object.fromEntries(SKILLS.map(s => [s.id, red(M[s.id].mEff, 3)])), ra: Object.fromEntries(RAS.map(x => [x.id, RA[x.id] === null ? null : red(RA[x.id], 3)])), laboratorio: null, informe: {palabras: 0}};
    o.huella = await sha256(canon(o)); if (k === 11) o.dominio.ic = 1;   // una evidencia editada a mano: la huella no cuadra
    PROF.push({nombre: alias + '.json', o, integra: k !== 11});
  }
  pintaProf(); toast(t('Grupo de ejemplo con 12 estudiantes ficticios'));
};
function agrega() {
  const val = PROF.filter(p => p.o), por = {};
  SKILLS.forEach(s => { por[s.id] = {n: 0, prim: 0, est: 0, sol: 0, errs: {}, dom: []}; });
  val.forEach(p => { const vistos = new Set(); p.o.eventos.forEach(e => { const a = por[e.sk]; if (!a) return; a.n++; if (e.ok === 1) a.prim++; if (e.sol) a.sol++; if (e.err) a.errs[e.err] = (a.errs[e.err] || 0) + 1; vistos.add(e.sk); }); Object.keys(por).forEach(sk => { if (vistos.has(sk)) por[sk].est++; if (p.o.dominio && Number.isFinite(p.o.dominio[sk])) por[sk].dom.push(p.o.dominio[sk]); }); });
  const prop = [];
  const nadie = SKILLS.filter(s => val.length && !por[s.id].n).map(s => s.id); if (nadie.length) prop.push(['nadie', nadie]);
  SKILLS.forEach(s => { const a = por[s.id]; if (!val.length || !a.n) return; { const pr = a.prim / a.n, top = Object.entries(a.errs).sort((x, y) => y[1] - x[1])[0]; if (pr < 0.5 && a.n >= 5) prop.push(['dificil', s.id, pr]); if (top && top[0] !== 'otro' && top[1] / a.n >= 0.25) prop.push(['error', s.id, top[0], top[1] / a.n]); if (a.sol / a.n > 0.3) prop.push(['solucion', s.id, a.sol / a.n]); } });
  return {val, por, prop};
}
const AUTOPSIA = [
  ['§4', 'Un único resultado de aprendizaje («Diseña y Analiza experimentos…») para 13 temas: no permite saber qué parte se domina. Propuesta: los RA1-RA8 observables de esta app, a validar por el profesor.'],
  ['§1 · §4 · §9', 'El componente práctico-experimental figura con 0 horas (§1), pero §4 le asigna ejercicios y talleres y §9 le da el 25 % de la nota. Conviene asignarle horas o reubicar esas actividades.'],
  ['§9', 'Cuatro componentes de 25 % sin criterios ni rúbricas; el de contacto con el docente aparece mezclado con categorías de herramientas de IA. Propuesta: rúbrica del informe con los cinco criterios del laboratorio.'],
  ['§4 · §6', 'La metodología declarada es el aprendizaje basado en problemas, pero el contacto con el docente se describe como exposición magistral; la práctica autónoma con retroalimentación inmediata de esta app acerca ambas.'],
  ['§8', 'Se exige que el estudiante audite la exactitud de la IA, pero no hay una actividad que lo entrene. El laboratorio genera el script R equivalente para contrastar cada resultado.'],
  ['§10', 'Bibliografía antigua (Canavos 1988, Cochran y Cox 1999, Kuehl 2001); la guía FAO no tiene año ni URL. El único artículo con DOI (Bettany-Saltikov y Whittaker, 2014, doi:10.1111/jocn.12343) es del ámbito de enfermería. Conviene añadir manuales recientes de diseño experimental agrícola con R.'],
  ['§4', 'Pruebas de normalidad (01/09) antes del ANAVAR (08/09) y comparaciones múltiples al final del curso: la app permite practicarlas intercaladas desde el principio.']
];
function pintaProf() {
  const P = DOMINIO; $('paramDom').innerHTML = `<p class="help">${esc(t('Parámetros actuales: umbral de dominio {0}; desbloqueo {1}; peso de cada intento anterior ×{2}; olvido con vida media de {3} días tras {4} días de gracia; {5} intentos por ejercicio; α = {6}.', fx(P.umbral, 2), fx(P.desbloqueo, 2), fx(P.decaimiento, 2), P.vidaMediaDias, P.graciaDias, P.maxIntentos, fx(ALFA, 2)))}</p>`;
  $('autopsia').innerHTML = AUTOPSIA.map(([sec, txt]) => `<li>${esc(t(txt))} <small>(${esc(t('sílabo'))} ${esc(sec)})</small></li>`).join('');
  if (!PROF.length) { $('resProf').innerHTML = ''; return; }
  const {val, por, prop} = agrega(), malos = PROF.filter(p => p.error), editados = val.filter(p => !p.integra);
  const PROP = {nadie: L => t('Nadie ha practicado todavía: {0}. ¿Falta tiempo o un enlace desde clase?', L.map(s => '«' + t(skillDe(s).nombre) + '»').join(', ')), dificil: (s, pr) => t('«{0}» solo se acierta a la primera el {1}: conviene trabajarla en un taller.', t(skillDe(s).nombre), pct(pr)), error: (s, er, f) => t('En «{0}» se repite este error ({1} de los intentos): {2}', t(skillDe(s).nombre), pct(f), diagTxt(s, er)), solucion: (s, f) => t('En «{0}» se consulta la solución en el {1} de los intentos: quizá falta un ejemplo resuelto en clase.', t(skillDe(s).nombre), pct(f))};
  $('resProf').innerHTML = `<div class="card"><h3>${esc(t('Grupo'))}</h3><p style="margin-top:0">${esc(t('{0} evidencias válidas · {1} ejercicios en total.', val.length, val.reduce((s, p) => s + p.o.eventos.length, 0)))}</p>
      ${editados.length ? `<div class="aviso">${esc(t('La huella no coincide (el fichero se editó después de generarse): {0}.', editados.map(p => p.o.alias).join(', ')))}</div>` : ''}${malos.length ? `<div class="aviso">${esc(t('Ficheros no válidos: {0}.', malos.map(p => p.nombre + ' (' + p.error + ')').join(', ')))}</div>` : ''}
      <div class="table-wrap"><table class="ag-tab"><thead><tr><th scope="col">${esc(t('Seudónimo'))}</th>${RAS.filter(r => SKILLS.some(s => s.ra === r.id)).map(r => `<th scope="col">${r.id}</th>`).join('')}<th scope="col">${esc(t('Ejercicios'))}</th><th scope="col">${esc(t('Huella'))}</th></tr></thead><tbody>${val.map(p => `<tr><td>${esc(p.o.alias)}</td>${RAS.filter(r => SKILLS.some(s => s.ra === r.id)).map(r => `<td>${p.o.ra && p.o.ra[r.id] !== null && p.o.ra[r.id] !== undefined ? pct(p.o.ra[r.id]) : '—'}</td>`).join('')}<td>${p.o.eventos.length}</td><td>${p.integra ? '✓' : '⚠'}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><h3>${esc(t('Habilidades del grupo'))}</h3><div class="table-wrap"><table class="ag-tab"><thead><tr><th scope="col">${esc(t('Habilidad'))}</th><th scope="col">${esc(t('Estudiantes'))}</th><th scope="col">${esc(t('Ejercicios'))}</th><th scope="col">${esc(t('A la primera'))}</th><th scope="col">${esc(t('Dominio medio'))}</th><th scope="col">${esc(t('Error más frecuente'))}</th></tr></thead><tbody>${SKILLS.map(s => { const a = por[s.id], top = Object.entries(a.errs).sort((x, y) => y[1] - x[1])[0]; return `<tr><td><span class="ag-ra sm" style="--c:${raDe(s.ra).c}">${s.ra}</span> ${esc(t(s.nombre))}</td><td>${a.est}</td><td>${a.n}</td><td>${a.n ? pct(a.prim / a.n) : '—'}</td><td>${a.dom.length ? fx(a.dom.reduce((x, y) => x + y, 0) / a.dom.length) : '—'}</td><td>${top ? esc(diagTxt(s.id, top[0])) : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>
    <div class="card"><h3>${esc(t('Propuestas de mejora'))}</h3><p class="help" style="margin-top:0">${esc(t('Reglas automáticas sobre los datos del grupo. Son propuestas: tú decides si las aplicas, y cada cambio en la app se publica como versión nueva.'))}</p>${prop.length ? `<ul class="fa-ul">${prop.map(p => `<li>${esc(PROP[p[0]](...p.slice(1)))}</li>`).join('')}</ul>` : `<p>${esc(t('Sin propuestas: ninguna regla se ha activado.'))}</p>`}</div>`;
}
$('btnProfCsv').onclick = () => { if (!PROF.length) return toast(t('Carga antes las evidencias')); const {por} = agrega(); dl('inferencia_grupo.csv', csvDe([t('habilidad'), 'RA', t('estudiantes'), t('ejercicios'), t('a la primera'), t('dominio medio')], SKILLS.map(s => { const a = por[s.id]; return [t(s.nombre), s.ra, a.est, a.n, a.n ? (a.prim / a.n).toFixed(3) : '', a.dom.length ? (a.dom.reduce((x, y) => x + y, 0) / a.dom.length).toFixed(3) : '']; })), 'text/csv;charset=utf-8'); };
/* GIFT (Moodle): preguntas numéricas con su tolerancia; las de opción cerrada, como opción múltiple */
const giftEsc = s => String(s).replace(/([~=#{}:\\])/g, '\\$1');
function giftDe(n) {
  const L = ['// InferencIA ' + VERSION + ' · ' + SILABO.asignatura + ' · ' + new Date().toISOString().slice(0, 10), '// ' + t('Soluciones calculadas por el código; tolerancia absoluta equivalente a la de la app.'), ''];
  SKILLS.forEach(s => { L.push(`$CATEGORY: InferencIA/${s.ra}/${giftEsc(t(s.nombre))}`, ''); for (let k = 0; k < n; k++) { const e = ejercicio('moodle', s.id, k), enun = textoPlano(enunciado(e)).replace(/\n{2,}/g, '\n');
    e.q.forEach((q, qi) => { const tit = `${s.id}-${k + 1}-${q.id}`, et = t(ETQ[s.id][q.id][0]);
      if (q.tipo === 'opc') L.push(`::${tit}::[markdown]${giftEsc(enun)}\n\n**${giftEsc(et)}** {`, ...q.opciones.map(o => `  ${o === q.sol ? '=' : '~'}${giftEsc(t(OPC[o]))}`), '}', '');
      else { const tol = Math.max(q.tol.abs || 0, (q.tol.rel || 0) * Math.abs(q.sol)); L.push(`::${tit}::[markdown]${giftEsc(enun)}\n\n**${giftEsc(et)}** {#${red(q.sol, Math.max(q.dec, 4))}:${red(tol, 6)}}`, ''); } }); } });
  return L.join('\n');
}
$('btnGift').onclick = () => { const n = Math.max(1, Math.min(50, +$('giftN').value || 5)); dl('inferencia_moodle_gift.txt', giftDe(n), 'text/plain;charset=utf-8'); toast(t('{0} variantes por habilidad exportadas', n)); };

/* ── arranque ── */
(async () => { const p = await cargaEstado(); if (p) S = {...nuevoS(), ...p, lab: {...nuevoS().lab, ...(p.lab || {})}, inf: {...nuevoS().inf, ...(p.inf || {})}}; iniciaUI(); if (S.esEjemplo) aplicaEjemplo(); go(0); })();
