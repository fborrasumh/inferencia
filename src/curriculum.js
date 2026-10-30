/* ══ Currículo como datos. Otra asignatura o universidad adapta la app cambiando ESTE fichero, no el código. ══
   Fuente: sílabo de Estadística Inferencial y Diseño Experimental, Carrera de Agropecuaria, nivel 06, UPEC, PAO 2026 B
   (código 0811BEIDE6UB-AJ2025; código del sílabo 0000011854). El sílabo declara un único resultado de aprendizaje
   (RA_OFICIAL, literal, §4). Los RA1-RA8 son una PROPUESTA de desglose observable de ese resultado, derivada de los
   contenidos planificados (§4) y de la evaluación (§5, §9); la app lo dice en la interfaz.
   _('…') marca un texto para traducir (se traduce al pintar con t()). */
const _ = s => s;
const SILABO = {asignatura: 'Estadística Inferencial y Diseño Experimental', codigo: '0811BEIDE6UB-AJ2025', carrera: 'Carrera de Agropecuaria · nivel 06', periodo: 'PAO 2026 B', universidad: 'Universidad Politécnica Estatal del Carchi (UPEC)', profesor: 'Jhon Jairo Peña Benitez'};
const RA_OFICIAL = 'Diseña y Analiza experimentos para el desarrollo de proyectos de investigación agropecuarios';
const RAS = [
  {id: 'RA1', c: '#1F6FB2', txt: _('Formula hipótesis estadísticas y las contrasta con intervalos de confianza y pruebas t.'), cuando: '18/08 – 25/08'},
  {id: 'RA2', c: '#0B7566', txt: _('Verifica los supuestos del análisis (normalidad y homogeneidad de varianzas) y decide qué hacer si no se cumplen.'), cuando: '01/09'},
  {id: 'RA3', c: '#6B4FD8', txt: _('Elige el diseño experimental adecuado a la fuente de variación y lo aleatoriza.'), cuando: '08/09 – 06/10'},
  {id: 'RA4', c: '#8F5D00', txt: _('Calcula e interpreta el ANAVAR de diseños completamente al azar, en bloques y en cuadrado latino.'), cuando: '15/09 – 29/09'},
  {id: 'RA5', c: '#B5371A', txt: _('Estima e interpreta efectos principales e interacciones en experimentos factoriales 2ᵏ y 3ᵏ.'), cuando: '20/10 – 27/10'},
  {id: 'RA6', c: '#5B4FA0', txt: _('Aplica e interpreta pruebas de comparaciones múltiples (MDS, Duncan, Tukey y Dunnett).'), cuando: '10/11 – 17/11'},
  {id: 'RA7', c: '#2E6B3A', txt: _('Ajusta e interpreta modelos de correlación y regresión lineal simple.'), cuando: '24/11'},
  {id: 'RA8', c: '#7A4A1E', txt: _('Comunica con rigor el análisis de un experimento en un informe técnico reproducible.'), cuando: _('informe del proyecto de aula')}
];
/* Habilidades practicables (en el orden del curso). pre = habilidades que deben llegar a DOMINIO.desbloqueo.
   RA8 no tiene ejercicios autocorregibles: se trabaja en el Laboratorio (informe con el análisis de los datos propios). */
const SKILLS = [
  {id: 'ic', ra: 'RA1', pre: [], nombre: _('Intervalo de confianza para una media')},
  {id: 'tdos', ra: 'RA1', pre: [], nombre: _('Prueba t para dos muestras independientes')},
  {id: 'tpar', ra: 'RA1', pre: ['tdos'], nombre: _('Prueba t para datos pareados')},
  {id: 'shapiro', ra: 'RA2', pre: [], nombre: _('Estadístico W de Shapiro-Wilk')},
  {id: 'fmax', ra: 'RA2', pre: [], nombre: _('Homogeneidad de varianzas (F máxima de Hartley)')},
  {id: 'supuestos', ra: 'RA2', pre: ['fmax'], nombre: _('Decidir qué hacer según los supuestos')},
  {id: 'diseno', ra: 'RA3', pre: [], nombre: _('Elegir el diseño experimental')},
  {id: 'gl', ra: 'RA3', pre: ['diseno'], nombre: _('Grados de libertad del error de un diseño')},
  {id: 'dca', ra: 'RA4', pre: [], nombre: _('ANAVAR de un diseño completamente al azar')},
  {id: 'dbca', ra: 'RA4', pre: ['dca'], nombre: _('ANAVAR de un diseño en bloques completos al azar')},
  {id: 'cl', ra: 'RA4', pre: ['dbca'], nombre: _('ANAVAR de un cuadrado latino')},
  {id: 'f2k', ra: 'RA5', pre: ['dca'], nombre: _('Efectos e interacción en un factorial 2ᵏ')},
  {id: 'f3k', ra: 'RA5', pre: ['f2k'], nombre: _('Sumas de cuadrados de un factorial 3²')},
  {id: 'mds', ra: 'RA6', pre: ['dca'], nombre: _('Mínima diferencia significativa (MDS)')},
  {id: 'tukey', ra: 'RA6', pre: ['mds'], nombre: _('Prueba de Tukey (DHS)')},
  {id: 'duncan', ra: 'RA6', pre: ['tukey'], nombre: _('Prueba de rango múltiple de Duncan')},
  {id: 'dunnett', ra: 'RA6', pre: ['mds'], nombre: _('Prueba de Dunnett frente al testigo')},
  {id: 'regresion', ra: 'RA7', pre: [], nombre: _('Regresión lineal simple')},
  {id: 'correl', ra: 'RA7', pre: ['regresion'], nombre: _('Significación de un coeficiente de correlación')}
];
/* Parámetros del modelo de dominio (documentados en la ayuda; el profesorado puede cambiarlos aquí). */
const DOMINIO = {decaimiento: 0.75, pseudo: 0.5, umbral: 0.8, desbloqueo: 0.6, graciaDias: 3, vidaMediaDias: 30, maxIntentos: 3};
/* Nivel de significación de los ejercicios y del laboratorio */
const ALFA = 0.05;
/* Contextos agropecuarios de los ejercicios (variables y unidades). Datos SIMULADOS. */
const CONTEXTOS = [
  {id: 'maiz', var: _('rendimiento de maíz'), va: _('el rendimiento de maíz'), u: 't/ha', base: 6.5, sd: 0.5, dec: 2, trt: _('dosis de nitrógeno')},
  {id: 'papa', var: _('rendimiento de papa'), va: _('el rendimiento de papa'), u: 't/ha', base: 28, sd: 2.2, dec: 1, trt: _('variedades de papa')},
  {id: 'leche', var: _('producción de leche'), va: _('la producción de leche'), u: 'L/día', base: 18, sd: 1.6, dec: 1, trt: _('suplementos alimenticios')},
  {id: 'pollos', var: _('ganancia de peso de pollos'), va: _('la ganancia de peso de pollos'), u: 'g/día', base: 52, sd: 3.5, dec: 1, trt: _('dietas')},
  {id: 'pasto', var: _('materia seca de pasto'), va: _('la materia seca de pasto'), u: 't/ha', base: 4.2, sd: 0.35, dec: 2, trt: _('mezclas forrajeras')},
  {id: 'haba', var: _('altura de planta de haba'), va: _('la altura de planta de haba'), u: 'cm', base: 62, sd: 4.0, dec: 1, trt: _('bioestimulantes')}
];
/* Bibliografía del sílabo (§10), tal cual; solo el artículo tiene DOI (comprobado). */
const BIBLIO = [
  'Gutiérrez Pulido, H. y De La Vara Salazar, R. Análisis y diseño de experimentos (2.ª ed.).',
  'Montgomery, D. Diseño y análisis de experimentos (2.ª ed.).',
  'Kuehl, R. O. (2001). Diseño de experimentos: principios estadísticos de diseño y análisis de investigación. Thomson Learning.',
  'Cochran, W. y Cox, G. (1999). Diseños experimentales. Trillas.',
  'Bettany-Saltikov, J. y Whittaker, V. J. (2014). Selecting the most appropriate inferential statistical test for your quantitative research study. Journal of Clinical Nursing, 23(11-12), 1520-1531. https://doi.org/10.1111/jocn.12343'
];
