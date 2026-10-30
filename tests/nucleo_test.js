/* Lógica pura en Node: generadores (miles de variantes), soluciones, errores típicos, determinismo, dominio,
   laboratorio y script R.  Uso: node tests/nucleo_test.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = path.join(__dirname, '..', 'src'), ctx = {console, Math, Date, JSON, Set, Map, Array, Object, String, Number, Infinity, NaN, isFinite, parseFloat};
vm.createContext(ctx);
for (const f of ['curriculum.js', 'stats.js', 'nucleo.js']) vm.runInContext(fs.readFileSync(path.join(R, f), 'utf8').replace(/^const /gm, 'var ').replace(/^let /gm, 'var '), ctx);
const {SKILLS, ejercicio, corrige, siguiente, mapaDominio, analizaLab, scriptR, croquis, leeCSV, filtraFugas, cifrasAjenas, red, adivinaRoles} = ctx;
let fallos = 0; const mal = (...m) => { fallos++; if (fallos < 40) console.log('  ✗', ...m); };
const fmt = (v, d) => d === 0 ? String(Math.round(v)) : v.toFixed(d).replace('.', ',');
const N = +(process.env.N || 250);
for (const s of SKILLS) {
  const t0 = Date.now(); let det = 0, mutTot = 0, mutDet = 0, opcDist = {};
  for (let k = 0; k < N; k++) {
    const e = ejercicio('prueba' + (k % 7), s.id, k);
    if (k < 3 && JSON.stringify(e) !== JSON.stringify(ejercicio('prueba' + (k % 7), s.id, k))) mal(s.id, 'no determinista');
    const resp = {};
    for (const q of e.q) {
      if (q.tipo === 'opc') { if (!q.opciones.includes(q.sol)) mal(s.id, q.id, 'sol no está en opciones', q.sol); resp[q.id] = q.sol; opcDist[q.sol] = (opcDist[q.sol] || 0) + 1; continue; }
      if (!Number.isFinite(q.sol)) { mal(s.id, q.id, 'solución no finita', JSON.stringify(e.d)); continue; }
      resp[q.id] = fmt(q.sol, q.dec);
    }
    const c = corrige(e, resp); c.forEach(r => { if (!r.ok) mal(s.id, r.id, 'la solución redondeada no se acepta', resp[r.id], e.q.find(x => x.id === r.id).sol); });
    for (const q of e.q) for (const m of q.mut || []) {
      if (!Number.isFinite(m.v) || Math.abs(m.v - q.sol) <= Math.max(q.tol.abs || 0, (q.tol.rel || 0) * Math.abs(q.sol)) * 3) continue;
      mutTot++; const r2 = corrige(e, {...resp, [q.id]: fmt(m.v, q.dec)}).find(x => x.id === q.id);
      if (r2.ok) mal(s.id, q.id, 'un error típico se acepta como correcto', m.k, m.v, q.sol); else if (r2.diag && r2.diag !== 'cerca' && r2.diag !== 'escala') mutDet++;
    }
    det++;
  }
  const ms = (Date.now() - t0) / N;
  console.log(`${s.id.padEnd(10)} ${det} variantes · ${ms.toFixed(1)} ms/ejercicio · errores típicos detectados ${mutTot ? Math.round(100 * mutDet / mutTot) : '—'} % de ${mutTot}${Object.keys(opcDist).length ? ' · opciones ' + JSON.stringify(opcDist) : ''}`);
  if (mutTot && mutDet / mutTot < 0.9) mal(s.id, 'detección de errores típicos baja', mutDet, mutTot);
  if (ms > 150) mal(s.id, 'generación lenta', ms);
  const o = Object.values(opcDist); if (o.length === 1 && N > 50 && !['supuestos'].includes(s.id)) mal(s.id, 'siempre la misma opción', JSON.stringify(opcDist));
}
/* modelo de dominio y ruta: deterministas, respetan prerrequisitos e intercalan */
const ahora = Date.UTC(2026, 9, 30), ev = [];
for (let k = 0; k < 400; k++) { const s = siguiente(ev, ahora + k * 3600e3); if (!s.sk) { mal('ruta vacía'); break; } const M = mapaDominio(ev, ahora + k * 3600e3); if (M[s.sk].bloqueada) mal('ruta elige bloqueada', s.sk); ev.push({sk: s.sk, t: ahora + k * 3600e3, ok: k % 4 ? 1 : 0.5, n: 1}); if (k > 2 && ev.slice(-3).every(e => e.sk === s.sk) && s.motivo !== 'repaso') mal('3 seguidas', s.sk); }
const vistas = new Set(ev.map(e => e.sk)); console.log('ruta: habilidades visitadas', vistas.size, 'de', SKILLS.length); if (vistas.size < SKILLS.length) mal('la ruta no recorre todo', [...SKILLS.map(s => s.id).filter(x => !vistas.has(x))]);
const e1 = JSON.stringify(siguiente(ev.slice(0, 40), ahora)), e2 = JSON.stringify(siguiente(ev.slice(0, 40), ahora)); if (e1 !== e2) mal('siguiente no determinista');
/* laboratorio: ejemplos con resultado conocido (verificados con scipy en stats_oracle.py) */
const csvDca = 'trat;rend\nT1;20,1\nT1;21,3\nT1;19,8\nT1;20,6\nT2;23,4\nT2;24,1\nT2;22,9\nT2;23,8\nT3;20,9\nT3;21,7\nT3;21,2\nT3;20,4';
let A = analizaLab(csvDca, 'dca', adivinaRoles(leeCSV(csvDca).cab, 'dca', leeCSV(csvDca).filas), {metodo: 'tukey'});
if (A.error) mal('lab dca', JSON.stringify(A)); else { console.log('lab DCA F =', A.tabla[0].F.toFixed(3), 'p =', A.tabla[0].p.toExponential(2), 'letras', A.letras.join(' '), 'SW p', A.sw.p.toFixed(3), 'Levene p', A.lev.p.toFixed(3)); if (A.letras[1] !== 'a' || A.letras[0] === A.letras[1]) mal('letras DCA', A.letras); }
const csvCL = 'fila;col;trt;y\n' + [['A','B','C','D'],['B','C','D','A'],['C','D','A','B'],['D','A','B','C']].flatMap((f, i) => f.map((tr, j) => `${i+1};${j+1};${tr};${(30 + i + 0.5 * j + 'ABCD'.indexOf(tr) * 1.5 + ((i * 7 + j * 3) % 5) * 0.2).toFixed(1).replace('.', ',')}`)).join('\n');
A = analizaLab(csvCL, 'cl', {fila: 0, col: 1, trt: 2, y: 3}, {metodo: 'duncan'}); if (A.error) mal('lab cl', JSON.stringify(A)); else console.log('lab CL gl error', A.glE, 'F trt', A.tabla[2].F.toFixed(2), 'letras', A.letras.join(' '));
const csvF = 'bloque;variedad;dosis;rend\n' + ['V1', 'V2'].flatMap((v, i) => ['N0', 'N1', 'N2'].flatMap((n, j) => [1, 2, 3].map(b => `B${b};${v};${n};${(5 + i * 0.4 + j * 0.8 + (i * j) * 0.3 + b * 0.2 + ((i + j * 2 + b) % 3) * 0.05).toFixed(2).replace('.', ',')}`))).join('\n');
A = analizaLab(csvF, 'factorial', {bloque: 0, A: 1, B: 2, y: 3}, {metodo: 'tukey'}); if (A.error) mal('lab fact', JSON.stringify(A)); else console.log('lab factorial:', A.tabla.map(f => f.fuente + ' gl ' + f.gl).join(' · '));
const csvX = 'animal;secuencia;periodo;dieta;leche\n' + [1, 2, 3, 4, 5, 6].flatMap(s => { const sec = s <= 3 ? 'AB' : 'BA', a = 18 + s * 0.3; return sec === 'AB' ? [`V${s};AB;1;A;${(a + 1.2).toFixed(1)}`, `V${s};AB;2;B;${(a - 0.3).toFixed(1)}`] : [`V${s};BA;1;B;${(a + 0.1).toFixed(1)}`, `V${s};BA;2;A;${(a + 0.8).toFixed(1)}`]; }).join('\n');
A = analizaLab(csvX, 'crossover', {sujeto: 0, sec: 1, periodo: 2, trt: 3, y: 4}, {}); if (A.error) mal('lab crossover', JSON.stringify(A)); else console.log('lab cross-over: efecto A−B', A.efecto.toFixed(3), 'gl error', A.glE);
const csvR = 'dosis;rend\n0;4,1\n30;4,9\n60;5,6\n90;6,0\n120;6,9\n150;7,2';
A = analizaLab(csvR, 'regresion', {x: 0, y: 1}, {}); if (A.error) mal('lab reg'); else console.log('lab regresión b', A.b.toFixed(4), 'R²', A.r2.toFixed(3));
for (const [d, csv, roles] of [['dca', csvDca, {trt: 0, y: 1}], ['cl', csvCL, {fila: 0, col: 1, trt: 2, y: 3}], ['factorial', csvF, {bloque: 0, A: 1, B: 2, y: 3}], ['crossover', csvX, {sujeto: 0, sec: 1, periodo: 2, trt: 3, y: 4}], ['regresion', csvR, {x: 0, y: 1}]]) { const s = scriptR(d, leeCSV(csv).cab, roles, {metodo: 'duncan', sep: ';'}); if (!/aov|lm\(/.test(s)) mal('script R', d); }
/* errores de entrada del laboratorio: no lanzan excepciones */
for (const [csv, d, roles] of [['', 'dca', {}], ['a;b\n1;x', 'dca', {y: 0, trt: 1}], [csvDca, 'dbca', {y: 1, trt: 0, bloque: 0}], [csvDca.split('\n').slice(0, 9).join('\n'), 'cl', {y: 1, trt: 0, fila: 0, col: 0}]]) { try { const r = analizaLab(csv, d, roles, {}); if (!r.error) mal('debía dar error', d); } catch (e) { mal('excepción en laboratorio', e.message); } }
/* croquis: cada tratamiento aparece r veces; en el cuadrado latino una vez por fila y columna */
const cq = croquis('cl', ['A', 'B', 'C', 'D', 'E'], 5, 'x'); if (cq.filas.some(f => new Set(f).size !== 5) || [0, 1, 2, 3, 4].some(j => new Set(cq.filas.map(f => f[j])).size !== 5)) mal('croquis CL no latino');
const cd = croquis('dbca', ['T1', 'T2', 'T3'], 4, 'x'); if (cd.filas.length !== 4 || cd.filas.some(f => new Set(f).size !== 3)) mal('croquis DBCA');
/* filtro de fugas y cifras ajenas */
const f = filtraFugas('El error está en el denominador. El resultado correcto es 3,87. Revisa la tabla de F con 2 y 9 gl.', [3.8712], [2, 9]); if (f.quitadas !== 1 || /3,87/.test(f.texto)) mal('filtro de fugas', JSON.stringify(f));
const aj = cifrasAjenas('El F fue 12,4 con p = 0,001 y R² de 0,95; la media 25,10', [12.41, 0.0012, 25.15]); if (!aj.includes(0.95) || aj.includes(12.4) || !aj.includes(25.1)) mal('cifras ajenas', aj);
console.log(fallos ? `FALLOS: ${fallos}` : 'OK · núcleo'); process.exit(fallos ? 1 : 0);
