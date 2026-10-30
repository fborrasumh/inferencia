/* ══ Núcleo PURO (sin DOM, sin IA): generadores de ejercicios con semilla y solución calculada por stats.js,
      diagnóstico de errores típicos por recálculo, modelo de dominio adaptativo, lectura de CSV, laboratorio de ANAVAR,
      croquis de aleatorización y script R equivalente. Se prueba en Node (tests/nucleo_test.js). ══ */

/* ── azar reproducible: misma semilla → mismo ejercicio (el profesorado reproduce cualquier ejercicio sin guardar nada) ── */
function hash32(s) { let h = 0x811c9dc5; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
const rngDe = semilla => { const r = mulberry32(hash32(semilla)); const o = {r, u: (a, b) => a + (b - a) * r(), i: (a, b) => Math.floor(a + (b - a + 1) * r()), pick: arr => arr[Math.floor(r() * arr.length)], normal: () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }}; o.shuffle = a => { const b = a.slice(); for (let k = b.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [b[k], b[j]] = [b[j], b[k]]; } return b; }; return o; };
const red = (v, d) => { const p = 10 ** d; return Math.round(v * p) / p; };
const ctxDe = id => CONTEXTOS.find(c => c.id === id);
/* valores de tabla con 3 decimales, como en los libros */
const tTab = (p, df) => red(qt(p, df), 3), fTab = (d1, d2) => red(qf(1 - ALFA, d1, d2), 2), qTab = (k, df) => red(qtukey(1 - ALFA, k, df), 2), rTab = (p, df) => red(rDuncan(ALFA, p, df), 2), dTab = (k, df) => red(qdunnett(ALFA, k, df), 2);
/* Hartley: P(Fmax ≤ x) con k varianzas de ν gl (integración numérica) y su valor crítico al 5 % */
function pHartley(x, k, nu) { const f = v => Math.exp((nu / 2 - 1) * Math.log(v) - v / 2 - (nu / 2) * Math.log(2) - lgam(nu / 2)); return k * simpson(v => f(v) * Math.pow(Math.max(0, pchisq(x * v, nu) - pchisq(v, nu)), k - 1), 1e-6, nu + 14 * Math.sqrt(2 * nu) + 10, 600); }
const hTab = (k, nu) => { const v = memoDe(`h|${k}|${nu}`, () => invierte(x => pHartley(x, k, nu), 1 - ALFA, 1, 400, 1e-7)); return red(v, v < 10 ? 2 : 1); };
const datoCtx = (R, C, mu, f = 1) => red(mu + R.normal() * C.sd * f, C.dec);
const dif = (a, b, tol) => Math.abs(a - b) > tol;   /* para evitar casos frontera en las decisiones */

/* ── generadores: devuelven DATOS (el enunciado se redacta al pintar, en el idioma activo) ──
   q: preguntas · sol: solución exacta · dec: decimales que se piden · tol: {abs, rel} · mut: errores típicos recalculados
   tipo 'opc': opción cerrada (sol = id de la opción) · diagOpc: diagnóstico según la opción elegida */
const DEC = ['rechaza', 'noRechaza'];
const GEN = {
  ic(R) {
    const C = R.pick(CONTEXTOS), n = R.i(6, 15), conf = R.pick([90, 95, 99]), m = red(C.base + R.u(-1, 1) * C.sd, C.dec), s = red(C.sd * R.u(0.7, 1.4), C.dec + 1);
    const p = 1 - (1 - conf / 100) / 2, tc = tTab(p, n - 1), ee = s / Math.sqrt(n), z = red(qnorm(p), 3), dd = Math.max(2, C.dec);
    const lim = (k, sg) => m + sg * k;
    const mut = sg => [{k: 'z', v: lim(z * ee, sg)}, {k: 'sinRaiz', v: lim(tc * s, sg)}, {k: 'glN', v: lim(tTab(p, n) * ee, sg)}, {k: 'glN2', v: lim(tTab(p, n - 2) * ee, sg)}, {k: 'varianza', v: lim(tc * s * s / Math.sqrt(n), sg)}];
    return {d: {ctx: C.id, n, conf, m, s, tabla: {dfs: [n - 2, n - 1, n], ps: [0.95, 0.975, 0.995]}}, q: [
      {id: 'li', sol: lim(tc * ee, -1), dec: dd, tol: {abs: 1.1 * 10 ** -dd, rel: 0.0015}, mut: mut(-1)},
      {id: 'ls', sol: lim(tc * ee, 1), dec: dd, tol: {abs: 1.1 * 10 ** -dd, rel: 0.0015}, mut: mut(1)}]};
  },
  tdos(R) {
    for (let it = 0; ; it++) {
      const C = R.pick(CONTEXTOS), n1 = R.i(5, 9), n2 = n1 + R.pick([1, 2, 3]), d0 = R.pick([0, 0.6, 1.2, 1.8]) * C.sd;
      const m1 = red(C.base + d0, C.dec), m2 = red(C.base, C.dec), s1 = red(C.sd * R.u(0.7, 1.3), C.dec + 1), s2 = red(C.sd * R.u(0.7, 1.3), C.dec + 1);
      const gl = n1 + n2 - 2, sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / gl, ee = Math.sqrt(sp2 * (1 / n1 + 1 / n2)), tv = (m1 - m2) / ee, tc = tTab(0.975, gl);
      if (dif(Math.abs(tv), tc, 0.15) || it > 40) {
        const spS = ((n1 - 1) * s1 + (n2 - 1) * s2) / gl, dp = Math.max(3, C.dec + 2);
        return {d: {ctx: C.id, n1, n2, m1, m2, s1, s2, tabla: {dfs: [gl - 1, gl, gl + 2], ps: [0.95, 0.975]}}, q: [
          {id: 'sp2', sol: sp2, dec: dp, tol: {rel: 0.004, abs: 10 ** -dp}, mut: [{k: 'mediaVar', v: (s1 * s1 + s2 * s2) / 2}, {k: 'conN', v: (n1 * s1 * s1 + n2 * s2 * s2) / (n1 + n2)}, {k: 'conS', v: spS}]},
          {id: 't', sol: tv, dec: 2, tol: {abs: 0.011, rel: 0.004}, mut: [{k: 'welch', v: (m1 - m2) / Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2)}, {k: 'sinRaiz', v: (m1 - m2) / (sp2 * (1 / n1 + 1 / n2))}, {k: 'conS', v: (m1 - m2) / (spS * Math.sqrt(1 / n1 + 1 / n2))}, {k: 'signo', v: -tv}]},
          {id: 'dec', tipo: 'opc', sol: Math.abs(tv) > tc ? 'rechaza' : 'noRechaza', opciones: DEC, mut: []}]};
      }
    }
  },
  tpar(R) {
    for (let it = 0; ; it++) {
      const C = R.pick(CONTEXTOS), n = R.i(6, 8), efe = R.pick([0, 0.5, 0.9]) * C.sd, xs = [], ys = [];
      for (let k = 0; k < n; k++) { const b = C.base + R.normal() * C.sd * 1.2; xs.push(red(b, C.dec)); ys.push(red(b + efe + R.normal() * C.sd * 0.35, C.dec)); }
      const d = ys.map((y, k) => y - xs[k]), dm = media(d), sd = sdM(d), tv = dm / (sd / Math.sqrt(n)), tc = tTab(0.975, n - 1);
      if (sd > 0 && (dif(Math.abs(tv), tc, 0.15) || it > 40)) {
        const sp = Math.sqrt((varM(xs) + varM(ys)) / 2), tInd = (media(ys) - media(xs)) / (sp * Math.sqrt(2 / n));
        return {d: {ctx: C.id, xs, ys, tabla: {dfs: [n - 1, n, 2 * n - 2], ps: [0.95, 0.975]}}, q: [
          {id: 'dm', sol: dm, dec: Math.max(2, C.dec), tol: {abs: 0.011, rel: 0.003}, mut: [{k: 'signo', v: -dm}]},
          {id: 't', sol: tv, dec: 2, tol: {abs: 0.011, rel: 0.004}, mut: [{k: 'independientes', v: tInd}, {k: 'sinRaizN', v: dm / sd}, {k: 'varianza', v: dm / (sd * sd / Math.sqrt(n))}, {k: 'signo', v: -tv}]},
          {id: 'dec', tipo: 'opc', sol: Math.abs(tv) > tc ? 'rechaza' : 'noRechaza', opciones: DEC, mut: []}]};
      }
    }
  },
  shapiro(R) {
    const C = R.pick(CONTEXTOS), n = R.i(5, 7), xs = []; const asim = R.r() < 0.4;
    for (let k = 0; k < n; k++) xs.push(red(C.base + (asim ? (R.r() ** 3 * 3 - 0.6) : R.normal()) * C.sd, C.dec));
    if (new Set(xs).size < 3) xs[0] = red(xs[0] + C.sd, C.dec);
    const a = swCoef(n).slice(1).map(v => red(v, 4)), s = xs.slice().sort((p, q) => p - q), mx = media(xs), ss = suma(xs.map(v => (v - mx) ** 2));
    const num = suma(a.map((ai, i) => ai * (s[n - 1 - i] - s[i]))), W = num * num / ss, numSin = Math.abs(suma(a.map((ai, i) => ai * (xs[n - 1 - i] - xs[i]))));
    return {d: {ctx: C.id, xs, a}, q: [
      {id: 'b', sol: num, dec: 3, tol: {abs: 0.006, rel: 0.003}, mut: [{k: 'sinOrdenar', v: numSin}, {k: 'bCuadrado', v: num * num}]},
      {id: 'W', sol: W, dec: 3, tol: {abs: 0.0021}, mut: [{k: 'sinOrdenar', v: numSin * numSin / ss}, {k: 'conVarianza', v: num * num / (ss / (n - 1))}, {k: 'sinCuadrado', v: num / ss}]}]};
  },
  fmax(R) {
    for (let it = 0; ; it++) {
      const C = R.pick(CONTEXTOS), k = R.i(3, 5), n = R.i(5, 8), het = R.r() < 0.45, sds = [];
      for (let j = 0; j < k; j++) sds.push(red(C.sd * (het && j === 0 ? R.u(2.6, 4) : R.u(0.7, 1.4)), C.dec + 1));
      const v = sds.map(s => s * s), F = Math.max(...v) / Math.min(...v), hc = hTab(k, n - 1);
      if (dif(F, hc, 0.4) || it > 30) return {d: {ctx: C.id, k, n, sds: R.shuffle(sds), hc}, q: [
        {id: 'F', sol: F, dec: 2, tol: {abs: 0.011, rel: 0.004}, mut: [{k: 'sinCuadrado', v: Math.max(...sds) / Math.min(...sds)}, {k: 'invertida', v: 1 / F}]},
        {id: 'dec', tipo: 'opc', sol: F > hc ? 'heterogeneas' : 'homogeneas', opciones: ['homogeneas', 'heterogeneas'], mut: []}]};
    }
  },
  supuestos(R) {
    const pS = R.r() < 0.5 ? red(R.u(0.002, 0.035), 3) : red(R.u(0.09, 0.85), 3), pL = R.r() < 0.5 ? red(R.u(0.002, 0.035), 3) : red(R.u(0.09, 0.85), 3);
    const W = pS < 0.05 ? red(R.u(0.80, 0.89), 3) : red(R.u(0.93, 0.98), 3), FL = pL < 0.05 ? red(R.u(3.8, 7.5), 2) : red(R.u(0.3, 1.9), 2), C = R.pick(CONTEXTOS), t = R.i(3, 5), r = R.i(4, 6);
    const sol = pS >= 0.05 && pL >= 0.05 ? 'anava' : pS < 0.05 && pL < 0.05 ? 'ambos' : pS < 0.05 ? 'normalidad' : 'varianzas';
    const diagOpc = {anava: 'ignoraP', normalidad: 'confundeSupuesto', varianzas: 'confundeSupuesto', ambos: 'confundeSupuesto'};
    if (sol === 'anava') Object.keys(diagOpc).forEach(k => { diagOpc[k] = 'pAlReves'; });
    return {d: {ctx: C.id, t, r, W, pS, FL, pL}, q: [{id: 'dec', tipo: 'opc', sol, opciones: ['anava', 'normalidad', 'varianzas', 'ambos'], diagOpc, mut: []}]};
  },
  diseno(R) {
    const tipo = R.pick(['dca', 'dbca', 'cl', 'crossover', 'factorial']), C = R.pick(CONTEXTOS), t = tipo === 'cl' ? R.i(4, 5) : R.i(3, 6), escena = R.i(0, 1);
    const diagOpc = {dca: 'faltaBloque', dbca: tipo === 'cl' ? 'dosGradientes' : tipo === 'crossover' ? 'mismoAnimal' : tipo === 'factorial' ? 'dosFactores' : 'bloqueInnecesario', cl: 'unGradiente', crossover: 'noCrossover', factorial: 'unFactor'};
    if (tipo === 'factorial') diagOpc.dca = 'dosFactores';
    if (tipo === 'crossover') diagOpc.dca = 'mismoAnimal';
    return {d: {tipo, ctx: C.id, t, esc: escena, a: R.i(2, 3), b: R.i(2, 4)}, q: [{id: 'dis', tipo: 'opc', sol: tipo, opciones: ['dca', 'dbca', 'cl', 'crossover', 'factorial'], diagOpc, mut: []}]};
  },
  gl(R) {
    const tipo = R.pick(['dca', 'dbca', 'cl', 'factorial', 'crossover']), t = R.i(3, 6), r = R.i(3, 6), a = R.i(2, 3), b = R.i(2, 4), n = R.i(5, 10);
    const casos = {
      dca: [t * (r - 1), [{k: 'glTotal', v: t * r - 1}, {k: 'glDbca', v: (t - 1) * (r - 1)}, {k: 'glTrat', v: t - 1}]],
      dbca: [(t - 1) * (r - 1), [{k: 'glDca', v: t * (r - 1)}, {k: 'glTotal', v: t * r - 1}, {k: 'glTrat', v: t - 1}]],
      cl: [(t - 1) * (t - 2), [{k: 'glDbca', v: (t - 1) * (t - 1)}, {k: 'glTotal', v: t * t - 1}, {k: 'glDca', v: t * (t - 1)}]],
      factorial: [a * b * (r - 1), [{k: 'glInter', v: (a - 1) * (b - 1)}, {k: 'glTotal', v: a * b * r - 1}, {k: 'glDbca', v: (a * b - 1) * (r - 1)}]],
      crossover: [2 * n - 2, [{k: 'glTotal', v: 4 * n - 1}, {k: 'glSujetos', v: 2 * n - 2 + 1}, {k: 'glDca', v: 4 * n - 2}]]
    };
    const [sol, mut] = casos[tipo];
    return {d: {tipo, t, r, a, b, n}, q: [{id: 'gl', sol, dec: 0, tol: {abs: 0.01}, mut: mut.filter(m => m.v !== sol)}]};
  },
  dca(R) {
    for (let it = 0; ; it++) {
      const C = R.pick(CONTEXTOS.filter(c => c.dec === 1)), t = R.i(3, 4), r = R.i(4, 5), signif = R.r() < 0.6, Y = [];
      for (let i = 0; i < t; i++) { const ti = signif ? (i - (t - 1) / 2) * C.sd * R.u(0.9, 1.6) : 0; Y.push([...Array(r)].map(() => datoCtx(R, C, C.base + ti))); }
      const datos = Y.flatMap((g, i) => g.map(y => ({trt: 'T' + (i + 1), y}))), A = dca(datos), N = t * r, fc = fTab(t - 1, N - t), F = A.tabla[0].F;
      if (dif(F, fc, 0.35) || it > 40) {
        const mg = A.mediaGeneral, sctr = A.tabla[0].sc, sce = A.tabla[1].sc, cmt = sctr / (t - 1), cme = A.cme;
        return {d: {ctx: C.id, Y, fc, fAlt: [fTab(t - 1, N - 1), fTab(t, N - t)], t, r}, a: A, q: [
          {id: 'sct', sol: sctr, dec: 2, tol: {rel: 0.004, abs: 0.011}, mut: [{k: 'sinR', v: suma(A.medias.map(m => (m - mg) ** 2))}, {k: 'sinC', v: sctr + A.N * mg * mg}, {k: 'esSCE', v: sce}]},
          {id: 'cme', sol: cme, dec: 3, tol: {rel: 0.004, abs: 0.0011}, mut: [{k: 'glTotal', v: sce / (N - 1)}, {k: 'glTrat', v: sce / (t - 1)}, {k: 'conN', v: sce / N}, {k: 'esCMT', v: cmt}]},
          {id: 'F', sol: F, dec: 2, tol: {rel: 0.006, abs: 0.011}, mut: [{k: 'invertida', v: 1 / F}, {k: 'sinCM', v: sctr / sce}]},
          {id: 'dec', tipo: 'opc', sol: F > fc ? 'rechaza' : 'noRechaza', opciones: DEC, mut: []}]};
      }
    }
  },
  dbca(R) {
    for (let it = 0; ; it++) {
      const C = R.pick(CONTEXTOS.filter(c => c.dec === 1)), t = R.i(3, 4), b = R.i(3, 5), signif = R.r() < 0.6, Y = [];
      const be = [...Array(b)].map((_, j) => (j - (b - 1) / 2) * C.sd * R.u(1.2, 2.2));
      for (let i = 0; i < t; i++) { const ti = signif ? (i - (t - 1) / 2) * C.sd * R.u(0.7, 1.3) : 0; Y.push(be.map(bj => datoCtx(R, C, C.base + ti + bj, 0.6))); }
      const datos = Y.flatMap((g, i) => g.map((y, j) => ({trt: 'T' + (i + 1), bloque: 'B' + (j + 1), y}))), A = dbca(datos), fc = fTab(t - 1, (t - 1) * (b - 1)), F = A.tabla[1].F;
      const Asin = dca(datos.map(x => ({trt: x.trt, y: x.y})));
      if (dif(F, fc, 0.35) || it > 40) {
        const G = suma(datos.map(x => x.y)), Cc = G * G / (t * b), Bj = [...Array(b)].map((_, j) => suma(Y.map(g => g[j])));
        return {d: {ctx: C.id, Y, fc, t, b}, a: A, q: [
          {id: 'scb', sol: A.tabla[0].sc, dec: 2, tol: {rel: 0.004, abs: 0.011}, mut: [{k: 'divisorB', v: suma(Bj.map(v => v * v)) / b - Cc}, {k: 'esSCT', v: A.tabla[1].sc}]},
          {id: 'F', sol: F, dec: 2, tol: {rel: 0.006, abs: 0.011}, mut: [{k: 'sinBloques', v: Asin.tabla[0].F}, {k: 'invertida', v: 1 / F}, {k: 'FBloques', v: A.tabla[0].F}]},
          {id: 'dec', tipo: 'opc', sol: F > fc ? 'rechaza' : 'noRechaza', opciones: DEC, mut: []}]};
      }
    }
  },
  cl(R) {
    for (let it = 0; ; it++) {
      const C = R.pick(CONTEXTOS.filter(c => c.dec === 1)), t = 4, signif = R.r() < 0.6, perm = R.shuffle([0, 1, 2, 3]), fe = [...Array(t)].map(() => R.normal() * C.sd), ce = [...Array(t)].map(() => R.normal() * C.sd), te = [...Array(t)].map((_, i) => signif ? (i - 1.5) * C.sd * R.u(0.8, 1.4) : 0);
      const sq = [...Array(t)].map((_, i) => [...Array(t)].map((_, j) => perm[(i + j) % t])), filasR = R.shuffle([0, 1, 2, 3]), colsR = R.shuffle([0, 1, 2, 3]);
      const L = filasR.map(i => colsR.map(j => sq[i][j])), Y = L.map((f, i) => f.map((tr, j) => datoCtx(R, C, C.base + fe[i] + ce[j] + te[tr], 0.5)));
      const datos = []; L.forEach((f, i) => f.forEach((tr, j) => datos.push({trt: 'ABCD'[tr], fila: 'F' + (i + 1), col: 'C' + (j + 1), y: Y[i][j]})));
      const A = cuadradoLatino(datos), fc = fTab(3, 6), F = A.tabla[2].F;
      if (dif(F, fc, 0.4) || it > 40) {
        const sinCol = dbca(datos.map(x => ({trt: x.trt, bloque: x.fila, y: x.y})));
        return {d: {ctx: C.id, L: L.map(f => f.map(tr => 'ABCD'[tr])), Y, fc}, a: A, q: [
          {id: 'gl', sol: 6, dec: 0, tol: {abs: 0.01}, mut: [{k: 'glDbca', v: 9}, {k: 'glTotal', v: 15}, {k: 'glDca', v: 12}]},
          {id: 'F', sol: F, dec: 2, tol: {rel: 0.006, abs: 0.011}, mut: [{k: 'sinColumnas', v: sinCol.tabla[1].F}, {k: 'invertida', v: 1 / F}, {k: 'FFilas', v: A.tabla[0].F}]},
          {id: 'dec', tipo: 'opc', sol: F > fc ? 'rechaza' : 'noRechaza', opciones: DEC, mut: []}]};
      }
    }
  },
  f2k(R) {
    const C = R.pick(CONTEXTOS), k = R.r() < 0.55 ? 2 : 3, r = k === 2 ? R.i(2, 4) : 2, ef = {A: R.u(-1.4, 1.4) * C.sd, B: R.u(-1.4, 1.4) * C.sd, C: R.u(-1, 1) * C.sd, AB: R.pick([0, 1, -1]) * R.u(0.6, 1.2) * C.sd};
    const combos = k === 2 ? ['(1)', 'a', 'b', 'ab'] : ['(1)', 'a', 'b', 'ab', 'c', 'ac', 'bc', 'abc'], tot = {};
    const sg = (cmb, l) => cmb.includes(l) ? 1 : -1;
    combos.forEach(cmb => { let s = 0; for (let j = 0; j < r; j++) s += datoCtx(R, C, C.base + (ef.A * sg(cmb, 'a') + ef.B * sg(cmb, 'b') + (k === 3 ? ef.C * sg(cmb, 'c') : 0) + ef.AB * sg(cmb, 'a') * sg(cmb, 'b')) / 2, 0.5); tot[cmb] = red(s, C.dec); });
    const con = letras_ => suma(combos.map(cmb => letras_.split('').reduce((p, l) => p * sg(cmb, l), 1) * tot[cmb])), div = r * 2 ** (k - 1), cA = con('a'), cAB = con('ab'), sc = cAB * cAB / (r * 2 ** k), dd = Math.max(2, C.dec + 1);
    return {d: {ctx: C.id, k, r, combos, tot}, q: [
      {id: 'A', sol: cA / div, dec: dd, tol: {abs: 1.1 * 10 ** -dd, rel: 0.003}, mut: [{k: 'divisor2k', v: cA / (r * 2 ** k)}, {k: 'sinDividir', v: cA}, {k: 'soloR', v: cA / r}, {k: 'signo', v: -cA / div}, {k: 'sinR', v: cA / 2 ** (k - 1)}]},
      {id: 'AB', sol: cAB / div, dec: dd, tol: {abs: 1.1 * 10 ** -dd, rel: 0.003}, mut: [{k: 'divisor2k', v: cAB / (r * 2 ** k)}, {k: 'sinDividir', v: cAB}, {k: 'signo', v: -cAB / div}, {k: 'sinR', v: cAB / 2 ** (k - 1)}]},
      {id: 'sc', sol: sc, dec: 3, tol: {rel: 0.004, abs: 0.0011}, mut: [{k: 'divisorSC', v: cAB * cAB / div}, {k: 'efectoCuad', v: (cAB / div) ** 2}, {k: 'sinR', v: cAB * cAB / 2 ** k}]}]};
  },
  f3k(R) {
    const C = R.pick(CONTEXTOS.filter(c => c.dec === 1)), r = R.i(2, 3), eA = [-1, 0, 1].map(x => x * C.sd * R.u(0.5, 1.5)), eB = [-1, 0, 1].map(x => x * C.sd * R.u(0.3, 1.2)), inter = R.r() < 0.5;
    const T = [0, 1, 2].map(i => [0, 1, 2].map(j => { let s = 0; for (let k = 0; k < r; k++) s += datoCtx(R, C, C.base + eA[i] + eB[j] + (inter ? (i - 1) * (j - 1) * C.sd : 0), 0.5); return red(s, C.dec); }));
    const N = 9 * r, G = suma(T.flat()), Cc = G * G / N, Ai = T.map(f => suma(f)), Bj = [0, 1, 2].map(j => suma(T.map(f => f[j])));
    const scA = suma(Ai.map(v => v * v)) / (3 * r) - Cc, scB = suma(Bj.map(v => v * v)) / (3 * r) - Cc, scCel = suma(T.flat().map(v => v * v)) / r - Cc, scAB = scCel - scA - scB;
    return {d: {ctx: C.id, r, T}, q: [
      {id: 'scA', sol: scA, dec: 2, tol: {rel: 0.004, abs: 0.011}, mut: [{k: 'divisorR', v: suma(Ai.map(v => v * v)) / r - Cc}, {k: 'sinC', v: suma(Ai.map(v => v * v)) / (3 * r)}, {k: 'divisor3', v: suma(Ai.map(v => v * v)) / 3 - Cc}]},
      {id: 'scAB', sol: scAB, dec: 2, tol: {rel: 0.004, abs: 0.011}, mut: [{k: 'sinRestar', v: scCel}, {k: 'soloA', v: scCel - scA}]}]};
  },
  mds(R) { return multiple(R, 'mds'); },
  tukey(R) { return multiple(R, 'tukey'); },
  duncan(R) { return multiple(R, 'duncan'); },
  dunnett(R) { return multiple(R, 'dunnett'); },
  regresion(R) {
    const n = R.i(6, 8), dosis = [0, 30, 60, 90, 120, 150, 180, 210].slice(0, n), b0 = red(R.u(3.8, 5.2), 2), b1 = red(R.u(0.012, 0.03), 4);
    const xs = dosis, ys = xs.map(x => red(b0 + b1 * x + R.normal() * 0.25, 2)), m = regresion(xs, ys), inv = regresion(ys, xs);
    return {d: {xs, ys}, m, q: [
      {id: 'b', sol: m.b, dec: 4, tol: {rel: 0.01, abs: 0.00015}, mut: [{k: 'invertida', v: inv.b}, {k: 'cociente', v: m.my / m.mx}, {k: 'invertidaInv', v: 1 / inv.b}]},
      {id: 'a', sol: m.a, dec: 2, tol: {abs: 0.021}, mut: [{k: 'signoA', v: -m.a}, {k: 'aConMedias', v: m.my + m.b * m.mx}]},
      {id: 'r2', sol: m.r2, dec: 2, tol: {abs: 0.011}, mut: [{k: 'esR', v: m.r}]}]};
  },
  correl(R) {
    for (let it = 0; ; it++) {
      const n = R.i(8, 20), r = red(R.pick([1, -1]) * R.u(0.2, 0.85), 2), tv = tCorrelacion(r, n), tc = tTab(0.975, n - 2), par = R.pick(['altura', 'nudos', 'lluvia', 'ph']);
      if (dif(Math.abs(tv), tc, 0.15) || it > 40) return {d: {n, r, par, tabla: {dfs: [n - 2, n - 1, n], ps: [0.95, 0.975]}}, q: [
        {id: 't', sol: tv, dec: 2, tol: {abs: 0.011, rel: 0.004}, mut: [{k: 'raizN', v: r * Math.sqrt(n) / Math.sqrt(1 - r * r)}, {k: 'sinRaiz', v: r * Math.sqrt(n - 2) / (1 - r * r)}, {k: 'conR2', v: r * r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r)}, {k: 'raizN1', v: r * Math.sqrt(n - 1) / Math.sqrt(1 - r * r)}]},
        {id: 'dec', tipo: 'opc', sol: Math.abs(tv) > tc ? 'rechaza' : 'noRechaza', opciones: DEC, mut: []}]};
    }
  }
};
/* comparaciones múltiples tras un ANAVAR de un DCA con r repeticiones (medias, CMe y gl dados) */
function multiple(R, met) {
  for (let it = 0; ; it++) {
    const C = R.pick(CONTEXTOS), t = R.i(4, 5), r = R.i(4, 6), gl = t * (r - 1), cme = red(C.sd * C.sd * R.u(0.6, 1.4), C.dec + 2);
    const medias = [...Array(t)].map((_, i) => red(C.base + (met === 'dunnett' && i === 0 ? -0.6 * C.sd : 0) + R.u(-1.6, 1.6) * C.sd, C.dec)), n = medias.map(() => r);
    const cmp = comparaciones(met, medias, n, cme, gl, ALFA, 0, false), dms = met === 'duncan' ? cmp.Rp[t] : met === 'dunnett' ? cmp.dms : cmp.pares[0].dms;
    /* sin pares frontera: ninguna diferencia a menos de un 2 % de su valor crítico */
    if (cmp.pares.every(p => Math.abs(Math.abs(p.dif) - p.dms) > 0.02 * p.dms) || it > 40) {
      const nsig = cmp.pares.filter(p => p.sig).length, ee = Math.sqrt(cme / r), dd = Math.max(2, C.dec + 1), tolD = {rel: 0.006, abs: 1.1 * 10 ** -dd};
      const d = {ctx: C.id, t, r, gl, cme, medias};
      if (met === 'mds') { const tc = tTab(0.975, gl); d.tabla = {dfs: [gl - 1, gl, t * r - 1], ps: [0.95, 0.975]}; return {d, q: [{id: 'dms', sol: tc * Math.sqrt(2 * cme / r), dec: dd, tol: tolD, mut: [{k: 'sin2', v: tc * ee}, {k: 'sinRaiz', v: tc * 2 * cme / r}, {k: 'unilateral', v: tTab(0.95, gl) * Math.sqrt(2 * cme / r)}, {k: 'glTotal', v: tTab(0.975, t * r - 1) * Math.sqrt(2 * cme / r)}]}, {id: 'nsig', sol: nsig, dec: 0, tol: {abs: 0.01}, mut: []}]}; }
      if (met === 'tukey') { const q = qTab(t, gl); d.qtab = {ks: [t - 1, t, t + 1], dfs: [gl - 2, gl, gl + 2]}; return {d, q: [{id: 'dms', sol: q * ee, dec: dd, tol: tolD, mut: [{k: 'con2', v: q * Math.sqrt(2 * cme / r)}, {k: 'kmal', v: qTab(t - 1, gl) * ee}, {k: 'sinRaiz', v: q * cme / r}]}, {id: 'nsig', sol: nsig, dec: 0, tol: {abs: 0.01}, mut: []}]}; }
      if (met === 'duncan') { d.rtab = {ps: [...Array(t - 1)].map((_, k) => k + 2), dfs: [gl - 2, gl, gl + 2]}; const r2 = rTab(2, gl), rt = rTab(t, gl); return {d, q: [{id: 'R2', sol: r2 * ee, dec: dd, tol: tolD, mut: [{k: 'con2', v: r2 * Math.sqrt(2 * cme / r)}, {k: 'sinRaiz', v: r2 * cme / r}]}, {id: 'Rt', sol: rt * ee, dec: dd, tol: tolD, mut: [{k: 'pMal', v: rTab(t - 1, gl) * ee}, {k: 'con2', v: rt * Math.sqrt(2 * cme / r)}]}, {id: 'nsig', sol: nsig, dec: 0, tol: {abs: 0.01}, mut: []}]}; }
      const dc = dTab(t - 1, gl); d.dtab = {ks: [t - 2, t - 1, t], dfs: [gl - 2, gl, gl + 2]};
      return {d, q: [{id: 'dms', sol: dc * Math.sqrt(2 * cme / r), dec: dd, tol: tolD, mut: [{k: 'sin2', v: dc * ee}, {k: 'kmal', v: dTab(t, gl) * Math.sqrt(2 * cme / r)}, {k: 'sinRaiz', v: dc * 2 * cme / r}]}, {id: 'nsig', sol: nsig, dec: 0, tol: {abs: 0.01}, mut: []}]};
    }
  }
}
/* ejercicio número k de la habilidad sk para esta persona: siempre el mismo */
function ejercicio(alias, sk, k) { const semilla = `${alias}|${sk}|${k}`, e = GEN[sk](rngDe(semilla)); return {sk, k, semilla, ...e}; }

/* ── corrección ── */
function parseNum(s) {
  let x = String(s ?? '').trim().replace(/\s| /g, '').replace(/%$/, '').replace(/−/g, '-'); if (!x) return NaN;
  const nP = (x.match(/\./g) || []).length, nC = (x.match(/,/g) || []).length;
  if (nP && nC) x = x.lastIndexOf(',') > x.lastIndexOf('.') ? x.replace(/\./g, '').replace(',', '.') : x.replace(/,/g, '');
  else if (nP > 1) x = x.replace(/\./g, '');
  else if (nC > 1) x = x.replace(/,/g, '');
  else x = x.replace(',', '.');
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(x) ? parseFloat(x) : NaN;
}
const cerca = (v, sol, tol) => Math.abs(v - sol) <= Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(sol));
/* por pregunta: {ok, diag}; diag = error típico detectado (o 'escala' / 'cerca' / 'noNumero' / null) */
function corrige(ej, resp) {
  return ej.q.map(q => {
    const r = resp[q.id];
    if (q.tipo === 'opc') return {id: q.id, ok: r === q.sol, diag: r && r !== q.sol ? ((q.diagOpc && q.diagOpc[r]) || (q.opciones === DEC ? 'decision' : 'clase')) : null, vacia: !r};
    const v = parseNum(r); if (Number.isNaN(v)) return {id: q.id, ok: false, diag: String(r ?? '').trim() ? 'noNumero' : null, vacia: !String(r ?? '').trim()};
    if (cerca(v, q.sol, q.tol)) return {id: q.id, ok: true, diag: null};
    const tolMut = {abs: Math.max(q.tol.abs ?? 0, q.dec === 0 ? 0.01 : 0.6 * 10 ** -q.dec), rel: Math.max(q.tol.rel ?? 0, 0.012)};
    const m = q.mut.find(mu => Number.isFinite(mu.v) && cerca(v, mu.v, tolMut) && !cerca(mu.v, q.sol, q.tol));
    if (m) return {id: q.id, ok: false, diag: m.k};
    if (q.dec > 0 && q.sol !== 0 && [10, 100, 1000, 0.1, 0.01, 0.001].some(f => cerca(v, q.sol * f, {rel: 0.012}))) return {id: q.id, ok: false, diag: 'escala'};
    if (q.dec > 0 && Math.abs(v - q.sol) <= 0.04 * Math.max(1, Math.abs(q.sol))) return {id: q.id, ok: false, diag: 'cerca'};
    return {id: q.id, ok: false, diag: null};
  });
}

/* ── modelo de dominio: media ponderada (recientes pesan más) con prior pesimista + olvido con el tiempo ──
   eventos: [{sk, t (ms), ok (1 a la primera · 0,5 a la segunda · 0), n (intentos), err, sol (vio la solución)}] */
const DIA = 86400000;
function dominio(sk, eventos, ahora = Date.now()) {
  const ev = eventos.filter(e => e.sk === sk); if (!ev.length) return {m: 0, mEff: 0, n: 0, dias: null, estado: 'nueva'};
  let sw = DOMINIO.pseudo, s = 0; ev.slice().reverse().forEach((e, k) => { const w = DOMINIO.decaimiento ** k; sw += w; s += w * (+e.ok || 0); });
  const m = s / sw, dias = (ahora - ev[ev.length - 1].t) / DIA, mEff = m * 0.5 ** (Math.max(0, dias - DOMINIO.graciaDias) / DOMINIO.vidaMediaDias);
  const estado = mEff >= DOMINIO.umbral ? 'dominada' : m >= DOMINIO.umbral ? 'repasar' : 'curso';
  return {m, mEff, n: ev.length, dias, estado};
}
function mapaDominio(eventos, ahora = Date.now()) {
  const M = {}; SKILLS.forEach(s => { M[s.id] = dominio(s.id, eventos, ahora); });
  SKILLS.forEach(s => { M[s.id].bloqueada = s.pre.some(p => M[p].mEff < DOMINIO.desbloqueo); M[s.id].faltan = s.pre.filter(p => M[p].mEff < DOMINIO.desbloqueo); });
  return M;
}
function dominioRA(M) { const o = {}; RAS.forEach(r => { const sk = SKILLS.filter(s => s.ra === r.id); o[r.id] = sk.length ? sk.reduce((a, s) => a + M[s.id].mEff, 0) / sk.length : null; }); return o; }
/* siguiente habilidad: repaso espaciado → refuerzo de lo empezado → nueva en el orden del curso; intercalado: no más de 2 seguidas de la misma */
function siguiente(eventos, ahora = Date.now()) {
  const M = mapaDominio(eventos, ahora), ab = SKILLS.filter(s => !M[s.id].bloqueada), ult = eventos.slice(-2).map(e => e.sk);
  const repetida = ult.length === 2 && ult[0] === ult[1] ? ult[0] : null, orden = s => SKILLS.indexOf(s);
  const elige = (lista, motivo) => { const l = lista.filter(s => s.id !== repetida); if (l.length) return {sk: l[0].id, motivo}; if (lista.length) return {sk: lista[0].id, motivo}; return null; };
  const rep = ab.filter(s => M[s.id].estado === 'repasar').sort((a, b) => M[a.id].mEff - M[b.id].mEff);
  const cur = ab.filter(s => M[s.id].estado === 'curso').sort((a, b) => M[a.id].mEff - M[b.id].mEff || orden(a) - orden(b));
  const nue = ab.filter(s => M[s.id].estado === 'nueva');
  let r = elige(rep, 'repaso') || null;
  if (!r && cur.length) { const c = elige(cur, 'refuerzo'); if (c && repetida && c.sk !== repetida && cur[0].id === repetida) c.motivo = 'intercalado'; r = c; }
  if (r && r.motivo !== 'repaso' && repetida && r.sk === repetida && nue.length) r = {sk: nue[0].id, motivo: 'intercalado'};
  if (!r && nue.length) r = {sk: nue[0].id, motivo: 'nueva'};
  if (!r) { const dom = ab.slice().sort((a, b) => M[a.id].mEff - M[b.id].mEff); r = elige(dom, 'mantener'); }
  if (r && repetida && r.sk === repetida && r.motivo !== 'repaso') { const otra = ab.filter(s => s.id !== repetida).sort((a, b) => M[a.id].mEff - M[b.id].mEff)[0]; if (otra) r = {sk: otra.id, motivo: 'intercalado'}; }
  return {...r, M};
}

/* ── CSV: separador ; , o tabulador (con ; la coma es decimal) ── */
function leeCSV(txt) {
  const lineas = String(txt || '').replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean); if (!lineas.length) return {cab: [], filas: []};
  const sep = (lineas[0].match(/;/g) || []).length ? ';' : (lineas[0].match(/\t/g) || []).length ? '\t' : ',';
  const trozos = l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
  const p0 = trozos(lineas[0]), cabecera = p0.some(c => Number.isNaN(parseNum(c)));
  const cab = cabecera ? p0 : p0.map((_, k) => 'col' + (k + 1)), filas = (cabecera ? lineas.slice(1) : lineas).map(trozos);
  return {cab, filas, sep};
}

/* ── laboratorio: roles de columnas por diseño, análisis completo y avisos ── */
const ROLES = {
  dca: ['y', 'trt'], dbca: ['y', 'trt', 'bloque'], cl: ['y', 'trt', 'fila', 'col'], factorial: ['y', 'A', 'B', 'bloque?'],
  crossover: ['y', 'trt', 'sujeto', 'sec', 'periodo'], regresion: ['y', 'x']
};
const PISTAS = {y: /^(y|resp|rend|peso|altura|valor|produc|biomasa|ms|kg|t_?ha|leche|ganancia|yield)/i, trt: /^(trat|trt|tratamiento|variedad|dieta|suplemento|dosis|t$)/i, bloque: /^(bloq|block|rep|repet)/i, fila: /^(fila|row)/i, col: /^(col|column)/i, A: /^(a$|factor_?a|fa$|variedad)/i, B: /^(b$|factor_?b|fb$|dosis|nivel)/i, sujeto: /^(suj|animal|vaca|id)/i, sec: /^(sec|secuencia|seq)/i, periodo: /^(per|periodo|period)/i, x: /^(x|dosis|n_?kg|nitro|edad|tiempo)/i};
function adivinaRoles(cab, diseno, filas = []) {
  const usados = new Set(), o = {}, rs = ROLES[diseno].map(r => r.replace('?', ''));
  const numerica = k => filas.length ? filas.filter(f => Number.isFinite(parseNum(f[k]))).length >= 0.8 * filas.length : true;
  rs.forEach(r => { const k = cab.findIndex((c, i) => !usados.has(i) && PISTAS[r] && PISTAS[r].test(c) && (r !== 'y' && r !== 'x' || numerica(i))); if (k >= 0) { o[r] = k; usados.add(k); } });
  /* la respuesta: la última columna numérica libre (suele ir al final) */
  if (o.y === undefined) { for (let k = cab.length - 1; k >= 0; k--) if (!usados.has(k) && numerica(k)) { o.y = k; usados.add(k); break; } }
  ROLES[diseno].forEach(rol => { const r = rol.replace('?', ''); if (o[r] === undefined && !rol.endsWith('?')) { const k = cab.findIndex((_, i) => !usados.has(i) && (r !== 'x' || numerica(i))); if (k >= 0) { o[r] = k; usados.add(k); } } });
  return o;
}
function analizaLab(csv, diseno, roles, opc = {}) {
  const {cab, filas} = leeCSV(csv), descartadas = [], datos = [], col = r => roles[r];
  if (!cab.length) return {error: 'vacio'};
  for (const r of ROLES[diseno]) if (!r.endsWith('?') && !(roles[r] >= 0)) return {error: 'rol', rol: r};
  const usados = ROLES[diseno].map(r => r.replace('?', '')).filter(r => roles[r] >= 0);
  if (new Set(usados.map(r => roles[r])).size !== usados.length) return {error: 'repetida'};
  filas.forEach((f, k) => {
    const y = parseNum(f[col('y')]); if (!Number.isFinite(y)) { descartadas.push(k + 2); return; }
    const o = {y}; let ok = true;
    usados.filter(r => r !== 'y').forEach(r => { const v = (f[roles[r]] ?? '').trim(); if (r === 'x') { o.x = parseNum(v); if (!Number.isFinite(o.x)) ok = false; } else { if (!v) ok = false; o[r] = v; } });
    if (ok) datos.push(o); else descartadas.push(k + 2);
  });
  if (datos.length < 4) return {error: 'pocos', n: datos.length, descartadas};
  let A;
  if (diseno === 'regresion') { const m = regresion(datos.map(d => d.x), datos.map(d => d.y)); A = {...m, diseno, residuos: m.res}; }
  else if (diseno === 'dca') A = dca(datos);
  else if (diseno === 'dbca') A = dbca(datos);
  else if (diseno === 'cl') A = cuadradoLatino(datos);
  else if (diseno === 'factorial') A = factorial(datos.map(d => ({f: [d.A, d.B], bloque: d.bloque, y: d.y})), [cab[roles.A] || 'A', cab[roles.B] || 'B'], roles.bloque >= 0);
  else if (diseno === 'crossover') A = crossover(datos);
  if (A.error) return {...A, descartadas};
  A.n_obs = datos.length; A.descartadas = descartadas; A.cab = cab; A.datos = datos;
  /* supuestos: normalidad de los residuos (Shapiro-Wilk) y homogeneidad (Levene, mediana) entre tratamientos */
  A.sw = A.residuos.length >= 3 ? shapiro(A.residuos.map(v => red(v, 10))) : null;
  if (diseno !== 'regresion' && A.grupos && A.grupos.every(g => g.length >= 2)) A.lev = levene(A.grupos);
  if (diseno !== 'regresion') {
    A.cv = 100 * Math.sqrt(A.cme) / A.mediaGeneral;
    const met = opc.metodo || 'tukey', testigo = Math.max(0, A.niveles.indexOf(opc.testigo || A.niveles[0]));
    if (A.niveles.length >= 2 && A.niveles.length <= 30) { A.comp = comparaciones(met, A.medias, A.n, A.cme, A.glE, ALFA, testigo); if (met !== 'dunnett') A.letras = letras(A.medias, A.comp.pares); }
    /* en el factorial con interacción no significativa, las comparaciones útiles son las de cada factor */
    if (diseno === 'factorial') A.compFactor = A.L.map((l, j) => l.length >= 2 ? (() => { const n = l.map(() => A.N / l.length), c = comparaciones(met === 'dunnett' ? 'tukey' : met, A.medFactor[j], n, A.cme, A.glE, ALFA); return {c, letras: letras(A.medFactor[j], c.pares)}; })() : null);
  }
  A.avisos = avisosLab(A, diseno);
  return A;
}
function avisosLab(A, diseno) {
  const av = [];
  if (A.descartadas.length) av.push(['descartadas', A.descartadas.join(', ')]);
  if (A.sw && Number.isFinite(A.sw.p) && A.sw.p < ALFA) av.push(['normalidad', A.sw.p]);
  if (A.lev && A.lev.p < ALFA) av.push(['varianzas', A.lev.p]);
  if (A.glE !== undefined && A.glE < 6) av.push(['pocosGl', A.glE]);
  if (A.gl !== undefined && A.gl < 4) av.push(['pocosGl', A.gl]);
  if (A.comp && A.comp.desequilibrado && (A.comp.metodo === 'duncan' || A.comp.metodo === 'dunnett')) av.push(['desequilibrio', A.comp.metodo]);
  if (A.cv !== undefined && A.cv > 30) av.push(['cv', A.cv]);
  if (diseno === 'factorial') { const inter = A.tabla.find(f => f.fuente.includes('×')); if (inter && inter.p < ALFA) av.push(['interaccion', inter.p]); }
  if (diseno === 'dbca' && A.eficiencia !== undefined && A.eficiencia < 1) av.push(['bloquesInutiles', A.eficiencia]);
  if (diseno === 'crossover') { const s = A.tabla[0]; if (s.p < 0.10) av.push(['arrastre', s.p]); }
  return av;
}

/* ── croquis de aleatorización (reproducible con la semilla) ── */
function croquis(diseno, trts, r, semilla) {
  const R = rngDe('croquis|' + semilla), t = trts.length;
  if (diseno === 'dca') { const u = R.shuffle(trts.flatMap(x => Array(r).fill(x))); return {diseno, filas: [...Array(r)].map((_, i) => u.slice(i * t, i * t + t))}; }
  if (diseno === 'dbca') return {diseno, filas: [...Array(r)].map(() => R.shuffle(trts))};
  if (diseno === 'cl') { const base = [...Array(t)].map((_, i) => [...Array(t)].map((_, j) => (i + j) % t)), fr = R.shuffle([...Array(t).keys()]), cr = R.shuffle([...Array(t).keys()]), tr = R.shuffle(trts); return {diseno, filas: fr.map(i => cr.map(j => tr[base[i][j]]))}; }
  return null;
}

/* ── script R equivalente: para comprobar el análisis en R (agricolae, car, DescTools) ── */
function scriptR(diseno, cab, roles, opc = {}) {
  const q = c => '`' + String(c).replace(/`/g, '') + '`', y = q(cab[roles.y]), v = r => q(cab[roles[r]]), met = opc.metodo || 'tukey', sep = opc.sep || ';';
  const L = ['# Script generado por InferencIA: reproduce el análisis en R para comprobarlo', '# install.packages(c("agricolae", "car", "DescTools"))  # una sola vez', 'library(agricolae); library(car)',
    `d <- read.csv("datos.csv", sep = "${sep === '\t' ? '\\t' : sep}", dec = "${sep === ';' ? ',' : '.'}", check.names = FALSE)`];
  const fac = rs => rs.forEach(r => L.push(`d[[${JSON.stringify(cab[roles[r]])}]] <- factor(d[[${JSON.stringify(cab[roles[r]])}]])`));
  if (diseno === 'regresion') { L.push(`modelo <- lm(${y} ~ ${v('x')}, data = d)`, 'summary(modelo)      # a, b, R², pruebas t', 'anova(modelo)', `cor.test(d[[${JSON.stringify(cab[roles.x])}]], d[[${JSON.stringify(cab[roles.y])}]])`, 'shapiro.test(residuals(modelo))', 'plot(modelo, which = 1:2)'); return L.join('\n'); }
  const trt = diseno === 'factorial' ? null : v('trt');
  if (diseno === 'dca') { fac(['trt']); L.push(`modelo <- aov(${y} ~ ${trt}, data = d)`); }
  if (diseno === 'dbca') { fac(['trt', 'bloque']); L.push(`modelo <- aov(${y} ~ ${v('bloque')} + ${trt}, data = d)`); }
  if (diseno === 'cl') { fac(['trt', 'fila', 'col']); L.push(`modelo <- aov(${y} ~ ${v('fila')} + ${v('col')} + ${trt}, data = d)`); }
  if (diseno === 'factorial') { fac(['A', 'B'].concat(roles.bloque >= 0 ? ['bloque'] : [])); L.push(`modelo <- aov(${y} ~ ${roles.bloque >= 0 ? v('bloque') + ' + ' : ''}${v('A')} * ${v('B')}, data = d)`); }
  if (diseno === 'crossover') { fac(['trt', 'sujeto', 'sec', 'periodo']); L.push(`modelo <- aov(${y} ~ ${v('sec')} + ${v('periodo')} + ${trt} + Error(${v('sujeto')}), data = d)`, 'summary(modelo)', '# Supuestos con el modelo de efectos fijos equivalente:', `modelo_f <- aov(${y} ~ ${v('sec')} + ${v('sujeto')} + ${v('periodo')} + ${trt}, data = d)`, 'shapiro.test(residuals(modelo_f))'); return L.join('\n'); }
  L.push('summary(modelo)', 'cv.model(modelo)       # coeficiente de variación (%)', 'shapiro.test(residuals(modelo))   # normalidad de los residuos');
  if (diseno === 'factorial') { L.push(`leveneTest(${y} ~ ${v('A')} * ${v('B')}, data = d)   # homogeneidad (centro = mediana)`); const f = `"${cab[roles.A]}"`, g = `"${cab[roles.B]}"`;
    const fn = {tukey: 'HSD.test', mds: 'LSD.test', duncan: 'duncan.test', dunnett: 'HSD.test'}[met]; L.push(`${fn}(modelo, ${f}, console = TRUE)`, `${fn}(modelo, ${g}, console = TRUE)`, `${fn}(modelo, c(${f}, ${g}), console = TRUE)   # combinaciones (si hay interacción)`); return L.join('\n'); }
  L.push(`leveneTest(${y} ~ ${trt}, data = d)   # homogeneidad (centro = mediana)`);
  const T = JSON.stringify(cab[roles.trt]);
  if (met === 'tukey') L.push(`HSD.test(modelo, ${T}, console = TRUE)`);
  if (met === 'mds') L.push(`LSD.test(modelo, ${T}, p.adj = "none", console = TRUE)`);
  if (met === 'duncan') L.push(`duncan.test(modelo, ${T}, console = TRUE)`);
  if (met === 'dunnett') L.push('library(DescTools)', `DunnettTest(${y} ~ ${trt}, data = d, control = ${JSON.stringify(opc.testigo || '')})`);
  return L.join('\n');
}

/* ── filtro de fugas: frases del tutor IA con una cifra igual a una solución (y que no está en el enunciado) se eliminan ── */
function filtraFugas(texto, sols, enunciadoNums) {
  const numsEn = new Set(enunciadoNums.map(v => red(v, 3)));
  const fuga = n => sols.some(s => Number.isFinite(s) && Math.abs(s) > 1e-9 && [1, 10, 100, 0.1, 0.01].some(f => Math.abs(n - s * f) <= 0.007 * Math.max(1, Math.abs(s * f)) || Math.abs(Math.abs(n) - Math.abs(s * f)) <= 0.007 * Math.max(0.01, Math.abs(s * f)))) && !numsEn.has(red(n, 3));
  const frases = String(texto || '').split(/(?<=[.!?\n])\s+/); let quitadas = 0;
  const ok = frases.filter(fr => { const ns = (fr.match(/-?\d+(?:[.,]\d+)?/g) || []).map(parseNum).filter(Number.isFinite); if (ns.some(fuga)) { quitadas++; return false; } return true; });
  return {texto: ok.join(' ').trim(), quitadas};
}
/* cifras que la IA menciona sobre el análisis y que NO aparecen en el resultado calculado (para el comentario del informe) */
function cifrasAjenas(texto, valores) {
  /* una cifra del texto «está» en el análisis si es algún valor calculado redondeado a los decimales con que se escribe */
  const toks = String(texto || '').match(/-?\d+(?:[.,]\d+)?/g) || [], fuera = [];
  toks.forEach(tok => { const n = parseNum(tok), d = (tok.split(/[.,]/)[1] || '').length; if (!Number.isFinite(n) || Math.abs(n) < 0.0005) return;
    const esta = valores.some(v => Number.isFinite(v) && (Math.abs(n - v) <= 0.5 * 10 ** -d + 1e-9 || Math.abs(Math.abs(n) - Math.abs(v)) <= 0.5 * 10 ** -d + 1e-9));
    if (!esta && !fuera.includes(n)) fuera.push(n); });
  return fuera;
}
if (typeof module !== 'undefined') module.exports = {hash32, rngDe, red, GEN, ejercicio, parseNum, corrige, cerca, dominio, mapaDominio, dominioRA, siguiente, leeCSV, analizaLab, adivinaRoles, ROLES, croquis, scriptR, filtraFugas, cifrasAjenas, pHartley, hTab, tTab, fTab, qTab, rTab, dTab, DEC};
