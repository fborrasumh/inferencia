/* ══ Motor estadístico PURO (sin DOM, sin IA). Fuente única de todos los cálculos: ejercicios, soluciones resueltas,
      tablas de valores críticos y el laboratorio de ANAVAR. Se contrasta con scipy en tests/stats_oracle.py.
      Nada de lo que se calcula aquí lo calcula la IA. ══ */

/* ── funciones especiales ── */
function lgam(x) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgam(1 - x);
  let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); let ser = 1.000000000190015;
  for (const c of g) ser += c / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}
/* fracción continua de la beta incompleta (Lentz) */
function betacf(a, b, x) {
  const FPMIN = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
  for (let m = 1; m <= 400; m++) {
    const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-15) break;
  }
  return h;
}
/* beta incompleta regularizada I_x(a, b) */
function ibeta(x, a, b) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgam(a + b) - lgam(a) - lgam(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
/* normal estándar: Φ con el algoritmo de Hart (precisión doble; West, 2005) y cuantil de Acklam refinado con Newton */
function pnorm(z) {
  const x = Math.abs(z); let c;
  if (x > 37) c = 0;
  else {
    const e = Math.exp(-x * x / 2);
    if (x < 7.07106781186547) {
      let b = 3.52624965998911e-02 * x + 0.700383064443688; b = b * x + 6.37396220353165; b = b * x + 33.912866078383; b = b * x + 112.079291497871; b = b * x + 221.213596169931; b = b * x + 220.206867912376; c = e * b;
      b = 8.83883476483184e-02 * x + 1.75566716318264; b = b * x + 16.064177579207; b = b * x + 86.7807322029461; b = b * x + 296.564248779674; b = b * x + 637.333633378831; b = b * x + 793.826512519948; b = b * x + 440.413735824752; c /= b;
    } else { let b = x + 0.65; b = x + 4 / b; b = x + 3 / b; b = x + 2 / b; b = x + 1 / b; c = e / b / 2.506628274631; }
  }
  return z > 0 ? 1 - c : c;
}
const dnorm = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
function qnorm(p) {
  if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00],
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01],
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00],
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  let x; const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else if (p <= 1 - pl) { const q = p - 0.5, r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  else { const q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  for (let k = 0; k < 2; k++) { const e = pnorm(x) - p; x -= e / Math.max(dnorm(x), 1e-300); }
  return x;
}
/* t de Student: función de distribución y cola; F de Snedecor: cola superior (p-valor) */
function pt(t, df) { if (!Number.isFinite(df)) return pnorm(t); const x = df / (df + t * t), tail = 0.5 * ibeta(x, df / 2, 0.5); return t >= 0 ? 1 - tail : tail; }
const pt2 = (t, df) => 2 * (1 - pt(Math.abs(t), df));           /* p-valor bilateral */
function pfUpper(F, d1, d2) { if (!(F > 0)) return 1; if (!Number.isFinite(d2)) return 1 - pchisq(F * d1, d1); return ibeta(d2 / (d2 + d1 * F), d2 / 2, d1 / 2); }
function pchisq(x, k) { /* gamma incompleta regularizada inferior P(k/2, x/2) */
  if (x <= 0) return 0; const a = k / 2, z = x / 2;
  if (z < a + 1) { let sum = 1 / a, del = sum, ap = a; for (let n = 0; n < 500; n++) { ap++; del *= z / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; } return sum * Math.exp(-z + a * Math.log(z) - lgam(a)); }
  let b = z + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break; }
  return 1 - Math.exp(-z + a * Math.log(z) - lgam(a)) * h;
}
/* cuantil: Illinois (regula falsi modificada) sobre una función creciente f; pocas evaluaciones, para funciones caras */
function invierte(f, p, lo, hi, tol = 1e-9) {
  let flo = f(lo) - p, fhi = f(hi) - p, lado = 0;
  if (flo > 0) return lo; if (fhi < 0) return hi;
  for (let k = 0; k < 120; k++) {
    const m = hi - fhi * (hi - lo) / (fhi - flo), fm = f(m) - p;
    if (Math.abs(fm) < 1e-13 || hi - lo < tol * Math.max(1, Math.abs(m))) return m;
    if (fm > 0) { hi = m; fhi = fm; if (lado === -1) flo /= 2; lado = -1; } else { lo = m; flo = fm; if (lado === 1) fhi /= 2; lado = 1; }
  }
  return (lo + hi) / 2;
}
const memo = new Map(), memoDe = (clave, fn) => { if (!memo.has(clave)) memo.set(clave, fn()); return memo.get(clave); };
const qt = (p, df) => memoDe(`t|${p}|${df}`, () => invierte(x => pt(x, df), p, -1e3, 1e3, 1e-12));
const qf = (p, d1, d2) => memoDe(`f|${p}|${d1}|${d2}`, () => invierte(x => 1 - pfUpper(x, d1, d2), p, 0, 1e4, 1e-12));

/* ── integración: Simpson compuesto ── */
function simpson(f, a, b, n) { if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let k = 1; k < n; k++) s += (k % 2 ? 4 : 2) * f(a + k * h); return s * h / 3; }
/* densidad de s = √(χ²_ν/ν)  (escala del error estimado) */
function dS(s, nu) { if (s <= 0) return 0; return Math.exp(Math.log(2) + (nu / 2) * Math.log(nu / 2) - lgam(nu / 2) + (nu - 1) * Math.log(s) - nu * s * s / 2); }
function sRango(nu) { const sd = 1 / Math.sqrt(2 * nu); return [Math.max(1e-9, 1 - 14 * sd), nu <= 6 ? 7 : 1 + 14 * sd]; }
function integraS(g, nu) { if (!Number.isFinite(nu)) return g(1); const [a, b] = sRango(nu); return simpson(s => dS(s, nu) * g(s), a, b, nu < 5 ? 400 : 96); }

/* ── rango studentizado (Tukey, Duncan): P(Q ≤ q; k medias, ν gl) por integración numérica directa ── */
function prango(w, k) { /* P(rango de k normales estándar ≤ w) */
  if (w <= 0) return 0;
  return k * simpson(z => dnorm(z) * Math.pow(Math.max(0, pnorm(z) - pnorm(z - w)), k - 1), -8, 8, 128);
}
const ptukey = (q, k, nu) => integraS(s => prango(q * s, k), nu);
const qtukey = (p, k, nu) => memoDe(`qt|${p}|${k}|${nu}`, () => invierte(q => ptukey(q, k, nu), p, 0.01, 40, 1e-8));
/* Duncan: valor de rango significativo r_p = q(1 − (1 − α)^(p−1); p, ν) */
const rDuncan = (alfa, p, nu) => qtukey(Math.pow(1 - alfa, p - 1), p, nu);
/* ── Dunnett bilateral con n iguales (correlación 0,5): P(max|Tᵢ| ≤ d) para k tratamientos frente a un testigo ── */
function pdunnett(d, k, nu) { return integraS(s => simpson(z => dnorm(z) * Math.pow(Math.max(0, pnorm(z + d * s * Math.SQRT2) - pnorm(z - d * s * Math.SQRT2)), k), -8, 8, 128), nu); }
const qdunnett = (alfa, k, nu) => memoDe(`qd|${alfa}|${k}|${nu}`, () => invierte(d => pdunnett(d, k, nu), 1 - alfa, 0.01, 30, 1e-8));

/* ── descriptivos ── */
const suma = a => a.reduce((s, x) => s + x, 0);
const media = a => suma(a) / a.length;
const varM = a => { const m = media(a); return suma(a.map(x => (x - m) ** 2)) / (a.length - 1); };
const sdM = a => Math.sqrt(varM(a));
const mediana = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

/* ── Shapiro-Wilk (algoritmo AS R94 de Royston, 1995: el mismo que shapiro.test de R y scipy) ── */
function polyH(cc, x) { let r = cc[cc.length - 1]; for (let j = cc.length - 2; j >= 0; j--) r = r * x + cc[j]; return r; }
function swCoef(n) {
  const nn2 = Math.floor(n / 2), a = new Array(nn2 + 1).fill(0);
  if (n === 3) { a[1] = Math.SQRT1_2; return a; }
  const an25 = n + 0.25, m = [0]; let summ2 = 0;
  for (let i = 1; i <= nn2; i++) { m[i] = qnorm((i - 0.375) / an25); summ2 += m[i] * m[i]; }
  summ2 *= 2; const ssumm2 = Math.sqrt(summ2), rsn = 1 / Math.sqrt(n);
  const c1 = [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056], c2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
  const a1 = polyH(c1, rsn) - m[1] / ssumm2; let i1, fac;
  if (n > 5) { i1 = 3; const a2 = -m[2] / ssumm2 + polyH(c2, rsn); fac = Math.sqrt((summ2 - 2 * m[1] * m[1] - 2 * m[2] * m[2]) / (1 - 2 * a1 * a1 - 2 * a2 * a2)); a[2] = a2; }
  else { i1 = 2; fac = Math.sqrt((summ2 - 2 * m[1] * m[1]) / (1 - 2 * a1 * a1)); }
  a[1] = a1; for (let i = i1; i <= nn2; i++) a[i] = -m[i] / fac;
  return a;   /* a[1..n/2], positivos, para (x₍ₙ₊₁₋ᵢ₎ − x₍ᵢ₎) */
}
function shapiro(xs) {
  const x = xs.slice().sort((p, q) => p - q), n = x.length;
  if (n < 3) return {n, W: NaN, p: NaN};
  if (n > 5000) return {n, W: NaN, p: NaN, error: 'n>5000'};
  const a = swCoef(n), mx = media(x), ss = suma(x.map(v => (v - mx) ** 2));
  if (ss < 1e-19) return {n, W: NaN, p: NaN, error: 'constante'};
  let num = 0; for (let i = 1; i <= a.length - 1; i++) num += a[i] * (x[n - i] - x[i - 1]);
  let W = num * num / ss; if (W > 1) W = 1;
  let p;
  if (n === 3) { p = Math.max(0, 6 / Math.PI * (Math.asin(Math.sqrt(W)) - Math.PI / 3)); return {n, W, p, a}; }
  const w1 = Math.log(1 - W);
  if (n <= 11) {
    const gamma = polyH([-2.273, 0.459], n);
    if (w1 >= gamma) return {n, W, p: 1e-99, a};
    const y = -Math.log(gamma - w1), mm = polyH([0.544, -0.39978, 0.025054, -6.714e-4], n), s = Math.exp(polyH([1.3822, -0.77857, 0.062767, -0.0020322], n));
    p = 1 - pnorm((y - mm) / s);
  } else {
    const xx = Math.log(n), mm = polyH([-1.5861, -0.31082, -0.083751, 0.0038915], xx), s = Math.exp(polyH([-0.4803, -0.082676, 0.0030302], xx));
    p = 1 - pnorm((w1 - mm) / s);
  }
  return {n, W, p, a};
}

/* ── Levene centrado en la mediana (Brown-Forsythe; como car::leveneTest y scipy.stats.levene por defecto) ── */
function levene(grupos) {
  const z = grupos.map(g => { const md = mediana(g); return g.map(v => Math.abs(v - md)); });
  const r = anovaUnFactor(z); return {F: r.F, df1: r.glT, df2: r.glE, p: r.p};
}

/* ── ANAVAR ── tabla: [{fuente, gl, sc, cm, F, p}] ; el CMe y su gl van aparte para las comparaciones múltiples */
const fila = (fuente, gl, sc, errCM, errGL) => { const cm = gl > 0 ? sc / gl : NaN, F = errCM ? cm / errCM : NaN; return {fuente, gl, sc, cm, F, p: errCM && gl > 0 ? pfUpper(F, gl, errGL) : NaN}; };
function anovaUnFactor(grupos) {
  const todos = grupos.flat(), N = todos.length, C = suma(todos) ** 2 / N, sct = suma(todos.map(v => v * v)) - C;
  const sctr = suma(grupos.map(g => suma(g) ** 2 / g.length)) - C, sce = sct - sctr, glT = grupos.length - 1, glE = N - grupos.length;
  const cme = sce / glE, F = (sctr / glT) / cme;
  return {sct, sctr, sce, glT, glE, cme, F, p: pfUpper(F, glT, glE), N, C};
}
/* DCA: datos [{trt, y}] (n por tratamiento puede variar) */
function dca(datos) {
  const niv = nivelesDe(datos.map(d => d.trt)), grupos = niv.map(l => datos.filter(d => d.trt === l).map(d => d.y));
  const r = anovaUnFactor(grupos), res = datos.map(d => d.y - media(grupos[niv.indexOf(d.trt)]));
  return {diseno: 'dca', niveles: niv, grupos, medias: grupos.map(media), n: grupos.map(g => g.length), cme: r.cme, glE: r.glE, N: r.N,
    tabla: [fila('Tratamientos', r.glT, r.sctr, r.cme, r.glE), {fuente: 'Error', gl: r.glE, sc: r.sce, cm: r.cme}, {fuente: 'Total', gl: r.N - 1, sc: r.sct}],
    residuos: res, mediaGeneral: media(datos.map(d => d.y))};
}
/* DBCA: datos [{trt, bloque, y}]; exige una observación por tratamiento y bloque */
function dbca(datos) {
  const T = nivelesDe(datos.map(d => d.trt)), B = nivelesDe(datos.map(d => d.bloque)), t = T.length, b = B.length;
  const celda = (i, j) => datos.filter(d => d.trt === T[i] && d.bloque === B[j]);
  for (let i = 0; i < t; i++) for (let j = 0; j < b; j++) if (celda(i, j).length !== 1) return {error: 'incompleto', trt: T[i], bloque: B[j], n: celda(i, j).length};
  const y = (i, j) => celda(i, j)[0].y, N = t * b, G = suma(datos.map(d => d.y)), C = G * G / N;
  const sct = suma(datos.map(d => d.y * d.y)) - C, Ti = T.map((_, i) => suma(B.map((_, j) => y(i, j)))), Bj = B.map((_, j) => suma(T.map((_, i) => y(i, j))));
  const sctr = suma(Ti.map(v => v * v)) / b - C, scb = suma(Bj.map(v => v * v)) / t - C, sce = sct - sctr - scb, glE = (t - 1) * (b - 1), cme = sce / glE;
  const res = datos.map(d => { const i = T.indexOf(d.trt), j = B.indexOf(d.bloque); return d.y - Ti[i] / b - Bj[j] / t + G / N; });
  return {diseno: 'dbca', niveles: T, bloques: B, medias: Ti.map(v => v / b), n: T.map(() => b), cme, glE, N,
    tabla: [fila('Bloques', b - 1, scb, cme, glE), fila('Tratamientos', t - 1, sctr, cme, glE), {fuente: 'Error', gl: glE, sc: sce, cm: cme}, {fuente: 'Total', gl: N - 1, sc: sct}],
    residuos: res, grupos: T.map((_, i) => B.map((_, j) => y(i, j))), mediaGeneral: G / N, eficiencia: eficienciaBloques(scb, sce, t, b)};
}
/* eficiencia relativa del DBCA frente al DCA (Cochran y Cox): ER = [(b−1)CMb + b(t−1)CMe] / [(bt−1)CMe] */
function eficienciaBloques(scb, sce, t, b) { const cmb = scb / (b - 1), cme = sce / ((t - 1) * (b - 1)); return ((b - 1) * cmb + b * (t - 1) * cme) / ((b * t - 1) * cme); }
/* Cuadrado latino: datos [{trt, fila, col, y}] con t filas, t columnas y t tratamientos, cada uno una vez por fila y columna */
function cuadradoLatino(datos) {
  const T = nivelesDe(datos.map(d => d.trt)), F = nivelesDe(datos.map(d => d.fila)), Cc = nivelesDe(datos.map(d => d.col)), t = T.length;
  if (F.length !== t || Cc.length !== t || datos.length !== t * t) return {error: 'dimension', t, filas: F.length, cols: Cc.length, n: datos.length};
  for (const f of F) { const tr = datos.filter(d => d.fila === f).map(d => d.trt); if (new Set(tr).size !== t) return {error: 'nolatino', fila: f}; }
  for (const c of Cc) { const tr = datos.filter(d => d.col === c).map(d => d.trt); if (new Set(tr).size !== t) return {error: 'nolatino', col: c}; }
  const N = t * t, G = suma(datos.map(d => d.y)), C = G * G / N, sct = suma(datos.map(d => d.y * d.y)) - C;
  const tot = (key, L) => L.map(l => suma(datos.filter(d => d[key] === l).map(d => d.y)));
  const Tt = tot('trt', T), Tf = tot('fila', F), Tc = tot('col', Cc);
  const sctr = suma(Tt.map(v => v * v)) / t - C, scf = suma(Tf.map(v => v * v)) / t - C, scc = suma(Tc.map(v => v * v)) / t - C;
  const sce = sct - sctr - scf - scc, glE = (t - 1) * (t - 2), cme = sce / glE;
  const res = datos.map(d => d.y - Tt[T.indexOf(d.trt)] / t - Tf[F.indexOf(d.fila)] / t - Tc[Cc.indexOf(d.col)] / t + 2 * G / N);
  return {diseno: 'cl', niveles: T, medias: Tt.map(v => v / t), n: T.map(() => t), cme, glE, N,
    tabla: [fila('Filas', t - 1, scf, cme, glE), fila('Columnas', t - 1, scc, cme, glE), fila('Tratamientos', t - 1, sctr, cme, glE), {fuente: 'Error', gl: glE, sc: sce, cm: cme}, {fuente: 'Total', gl: N - 1, sc: sct}],
    residuos: res, grupos: T.map(l => datos.filter(d => d.trt === l).map(d => d.y)), mediaGeneral: G / N};
}
/* Factorial equilibrado (2, 3 o 4 factores, todas las interacciones), opcionalmente en bloques completos.
   datos: [{f: [nivelA, nivelB, …], bloque?, y}] · SC de cada efecto por inclusión-exclusión de los totales marginales */
function factorial(datos, nombres, conBloques) {
  const k = nombres.length, L = nombres.map((_, j) => nivelesDe(datos.map(d => d.f[j]))), celdas = {};
  datos.forEach(d => { const c = d.f.join('\u0001'); (celdas[c] = celdas[c] || []).push(d.y); });
  const nCeldas = L.reduce((p, l) => p * l.length, 1), ns = Object.values(celdas).map(v => v.length);
  if (Object.keys(celdas).length !== nCeldas) return {error: 'faltanCeldas', esperadas: nCeldas, hay: Object.keys(celdas).length};
  if (new Set(ns).size !== 1) return {error: 'desequilibrado', ns: [...new Set(ns)]};
  const r = ns[0], N = datos.length, G = suma(datos.map(d => d.y)), C = G * G / N, sct = suma(datos.map(d => d.y * d.y)) - C;
  const M = sub => { if (!sub.length) return C; const tot = {}; datos.forEach(d => { const key = sub.map(j => d.f[j]).join('\u0001'); tot[key] = (tot[key] || 0) + d.y; }); const n = N / sub.reduce((p, j) => p * L[j].length, 1); return suma(Object.values(tot).map(v => v * v)) / n; };
  const subconj = []; for (let m = 1; m < 1 << k; m++) subconj.push([...Array(k).keys()].filter(j => m >> j & 1));
  subconj.sort((a, b) => a.length - b.length || a.join() .localeCompare(b.join()));
  const efectos = subconj.map(S => { let sc = 0; for (let m = 0; m < 1 << S.length; m++) { const T = S.filter((_, i) => m >> i & 1); sc += ((S.length - T.length) % 2 ? -1 : 1) * M(T); } return {S, nombre: S.map(j => nombres[j]).join(' × '), gl: S.reduce((p, j) => p * (L[j].length - 1), 1), sc}; });
  let scb = 0, glb = 0, B = [];
  if (conBloques) { B = nivelesDe(datos.map(d => d.bloque)); if (B.length !== r) return {error: 'bloques', bloques: B.length, r}; scb = suma(B.map(b => suma(datos.filter(d => d.bloque === b).map(d => d.y)) ** 2)) / (N / B.length) - C; glb = B.length - 1; }
  const sce = sct - scb - suma(efectos.map(e => e.sc)), glE = N - 1 - glb - suma(efectos.map(e => e.gl)), cme = sce / glE;
  if (glE <= 0) return {error: 'singl', glE};
  const tabla = [], mediaCelda = c => media(celdas[c]);
  if (conBloques) tabla.push(fila('Bloques', glb, scb, cme, glE));
  efectos.forEach(e => tabla.push(fila(e.nombre, e.gl, e.sc, cme, glE)));
  tabla.push({fuente: 'Error', gl: glE, sc: sce, cm: cme}, {fuente: 'Total', gl: N - 1, sc: sct});
  const blMed = conBloques ? Object.fromEntries(B.map(b => [b, media(datos.filter(d => d.bloque === b).map(d => d.y))])) : null;
  const residuos = datos.map(d => d.y - mediaCelda(d.f.join('\u0001')) - (conBloques ? blMed[d.bloque] - G / N : 0));
  /* medias de los niveles de cada factor y de las combinaciones (para comparaciones) */
  const medFactor = L.map((l, j) => l.map(v => media(datos.filter(d => d.f[j] === v).map(d => d.y))));
  const combos = Object.keys(celdas).map(c => ({nivel: c.split('\u0001').join(':'), media: mediaCelda(c), n: r}));
  /* efectos 2ᵏ (todos los factores a dos niveles): efecto = contraste / (r·2^(k−1)) con el primer nivel como «−» */
  let efectos2k = null;
  if (L.every(l => l.length === 2)) efectos2k = efectos.map(e => { let con = 0; datos.forEach(d => { con += e.S.reduce((s, j) => s * (d.f[j] === L[j][0] ? -1 : 1), 1) * d.y; }); return {nombre: e.nombre, contraste: con, efecto: con / (N / 2)}; });
  return {diseno: 'factorial', nombres, L, r, cme, glE, N, tabla, residuos, medFactor, combos, efectos2k, mediaGeneral: G / N,
    niveles: combos.map(c => c.nivel), medias: combos.map(c => c.media), n: combos.map(() => r), grupos: Object.values(celdas)};
}
/* Cross-over 2×2 (AB/BA): datos [{sujeto, sec, periodo, trt, y}]; SC de tratamiento y periodo ajustadas (tipo III) */
function crossover(datos) {
  const S = nivelesDe(datos.map(d => d.sujeto)), sec = nivelesDe(datos.map(d => d.sec)), per = nivelesDe(datos.map(d => d.periodo)), trt = nivelesDe(datos.map(d => d.trt));
  if (sec.length !== 2 || per.length !== 2 || trt.length !== 2) return {error: 'no2x2', sec: sec.length, per: per.length, trt: trt.length};
  const suj = S.map(s => { const o = datos.filter(d => d.sujeto === s); if (o.length !== 2) return null; const p1 = o.find(d => d.periodo === per[0]), p2 = o.find(d => d.periodo === per[1]); if (!p1 || !p2 || p1.sec !== p2.sec || p1.trt === p2.trt) return null; return {s, sec: p1.sec, y1: p1.y, y2: p2.y, trt1: p1.trt}; });
  if (suj.some(x => !x)) return {error: 'sujetos', malos: S.filter((_, i) => !suj[i])};
  const g = sec.map(q => suj.filter(x => x.sec === q)); if (g.some(x => x.length < 2)) return {error: 'pocos'};
  /* orientación: en la secuencia g[0] el tratamiento del periodo 1 es «A» */
  const A = g[0][0].trt1; if (g[0].some(x => x.trt1 !== A) || g[1].some(x => x.trt1 === A)) return {error: 'secuencia'};
  const N = datos.length, G = suma(datos.map(d => d.y)), C = G * G / N, sct = suma(datos.map(d => d.y * d.y)) - C;
  const n1 = g[0].length, n2 = g[1].length, Tsuj = suj.map(x => x.y1 + x.y2), scSuj = suma(Tsuj.map(v => v * v)) / 2 - C;
  const scSec = suma(g.map(gg => suma(gg.map(x => x.y1 + x.y2)) ** 2 / (2 * gg.length))) - C, scSujSec = scSuj - scSec;
  const d = g.map(gg => gg.map(x => x.y1 - x.y2)), dm = d.map(media), v = 2 * (1 / n1 + 1 / n2);
  const scTrt = (dm[0] - dm[1]) ** 2 / v, scPer = (dm[0] + dm[1]) ** 2 / v, sce = suma(d.map((dd, k) => suma(dd.map(x => (x - dm[k]) ** 2)))) / 2;
  const glE = n1 + n2 - 2, cme = sce / glE, glS = n1 + n2 - 2, cmS = scSujSec / glS;
  const tabla = [fila('Secuencia (arrastre)', 1, scSec, cmS, glS), {fuente: 'Sujetos(secuencia)', gl: glS, sc: scSujSec, cm: cmS}, fila('Periodo', 1, scPer, cme, glE), fila('Tratamientos', 1, scTrt, cme, glE), {fuente: 'Error', gl: glE, sc: sce, cm: cme}, {fuente: 'Total', gl: N - 1, sc: sct}];
  const B = trt.find(x => x !== A), efecto = (dm[0] - dm[1]) / 2;   /* τ_A − τ_B */
  const mA = media(datos.filter(x => x.trt === A).map(x => x.y)), mB = media(datos.filter(x => x.trt === B).map(x => x.y));
  const residuos = suj.flatMap((x, i) => { const k = x.sec === sec[0] ? 0 : 1, e = (d[k][g[k].indexOf(x)] - dm[k]) / 2; return [e, -e]; });
  return {diseno: 'crossover', A, B, efecto, ee: Math.sqrt(cme * v / 4), cme, glE, N, tabla, niveles: [A, B], medias: [mA, mB], n: [n1 + n2, n1 + n2], residuos, mediaGeneral: G / N, grupos: [datos.filter(x => x.trt === A).map(x => x.y), datos.filter(x => x.trt === B).map(x => x.y)]};
}
function nivelesDe(arr) { const v = [...new Set(arr.map(x => String(x)))]; const num = v.every(x => /^-?\d+(\.\d+)?$/.test(x)); return num ? v.sort((a, b) => +a - +b) : v.sort((a, b) => a.localeCompare(b, 'es', {numeric: true})); }

/* ── comparaciones múltiples (α bilateral) ── medias, n, cme, gl → {pares: [{i, j, dif, dms, sig}], dms…}
   Tukey-Kramer y MDS admiten n distintos; Duncan y Dunnett usan la media armónica de n si hay desequilibrio (se avisa) */
const nArm = n => n.length / suma(n.map(x => 1 / x));
function comparaciones(metodo, medias, n, cme, gl, alfa = 0.05, testigo = 0, conP = true) {
  const k = medias.length, pares = [], desequilibrado = new Set(n).size > 1;
  if (metodo === 'mds') { const tc = qt(1 - alfa / 2, gl); for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { const dms = tc * Math.sqrt(cme * (1 / n[i] + 1 / n[j])), dif = medias[i] - medias[j]; pares.push({i, j, dif, dms, sig: Math.abs(dif) > dms, p: pt2(dif / Math.sqrt(cme * (1 / n[i] + 1 / n[j])), gl)}); } return {metodo, critico: tc, pares, desequilibrado}; }
  if (metodo === 'tukey') { const q = qtukey(1 - alfa, k, gl); for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { const ee = Math.sqrt(cme / 2 * (1 / n[i] + 1 / n[j])), dms = q * ee, dif = medias[i] - medias[j]; pares.push({i, j, dif, dms, sig: Math.abs(dif) > dms, p: conP ? 1 - ptukey(Math.abs(dif) / ee, k, gl) : null}); } return {metodo, critico: q, pares, desequilibrado}; }
  if (metodo === 'duncan') {
    const nh = nArm(n), orden = medias.map((m, i) => i).sort((a, b) => medias[b] - medias[a]), pos = []; orden.forEach((ix, p) => { pos[ix] = p; });
    const rp = [], Rp = []; for (let p = 2; p <= k; p++) { rp[p] = rDuncan(alfa, p, gl); Rp[p] = rp[p] * Math.sqrt(cme / nh); }
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { const p = Math.abs(pos[i] - pos[j]) + 1, dif = medias[i] - medias[j]; pares.push({i, j, dif, dms: Rp[p], p: null, rango: p, sig: Math.abs(dif) > Rp[p]}); }
    return {metodo, rp, Rp, pares, desequilibrado, nh};
  }
  if (metodo === 'dunnett') {
    const nh = nArm(n), d = qdunnett(alfa, k - 1, gl), dms = d * Math.sqrt(2 * cme / nh);
    for (let i = 0; i < k; i++) if (i !== testigo) { const dif = medias[i] - medias[testigo]; pares.push({i, j: testigo, dif, dms, sig: Math.abs(dif) > dms, p: null}); }
    return {metodo, critico: d, dms, pares, desequilibrado, nh, testigo};
  }
  return null;
}
/* letras de significación (algoritmo de inserción y absorción de Piepho, 2004): medias con una letra común no difieren */
function letras(medias, pares) {
  const k = medias.length; let cols = [new Set([...Array(k).keys()])];
  pares.filter(p => p.sig).forEach(({i, j}) => {
    const nuevas = [];
    cols.forEach(c => { if (c.has(i) && c.has(j)) { const a = new Set(c), b = new Set(c); a.delete(i); b.delete(j); nuevas.push(a, b); } else nuevas.push(c); });
    cols = nuevas.filter((c, x) => c.size && !nuevas.some((o, y) => y !== x && [...c].every(e => o.has(e)) && (o.size > c.size || y < x)));
  });
  /* letras en orden: «a» para el grupo que contiene la media mayor */
  const orden = [...Array(k).keys()].sort((a, b) => medias[b] - medias[a]);
  cols.sort((A, B) => Math.min(...[...A].map(e => orden.indexOf(e))) - Math.min(...[...B].map(e => orden.indexOf(e))));
  return [...Array(k).keys()].map(i => cols.map((c, x) => c.has(i) ? String.fromCharCode(97 + x) : '').join(''));
}

/* ── regresión lineal simple y correlación ── */
function regresion(xs, ys) {
  const n = xs.length, mx = media(xs), my = media(ys);
  let sxy = 0, sxx = 0, syy = 0; for (let k = 0; k < n; k++) { sxy += (xs[k] - mx) * (ys[k] - my); sxx += (xs[k] - mx) ** 2; syy += (ys[k] - my) ** 2; }
  const b = sxy / sxx, a = my - b * mx, r = sxy / Math.sqrt(sxx * syy), screg = b * sxy, scres = syy - screg, gl = n - 2, cme = scres / gl;
  const eeb = Math.sqrt(cme / sxx), eea = Math.sqrt(cme * (1 / n + mx * mx / sxx)), tb = b / eeb, tc = qt(0.975, gl);
  const F = screg / cme, res = xs.map((x, k) => ys[k] - a - b * x);
  return {n, a, b, r, r2: r * r, sxx, sxy, syy, mx, my, eeb, eea, tb, pb: pt2(tb, gl), ta: a / eea, pa: pt2(a / eea, gl), gl, cme, F, pF: pfUpper(F, 1, gl), icb: [b - tc * eeb, b + tc * eeb], res,
    tabla: [fila('Regresión', 1, screg, cme, gl), {fuente: 'Residual', gl, sc: scres, cm: cme}, {fuente: 'Total', gl: n - 1, sc: syy}]};
}
const tCorrelacion = (r, n) => r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);

if (typeof module !== 'undefined') module.exports = {lgam, ibeta, pnorm, qnorm, pt, pt2, qt, pfUpper, qf, pchisq, ptukey, qtukey, rDuncan, pdunnett, qdunnett, suma, media, varM, sdM, mediana,
  shapiro, swCoef, levene, anovaUnFactor, dca, dbca, cuadradoLatino, factorial, crossover, eficienciaBloques, comparaciones, letras, regresion, tCorrelacion, nivelesDe, nArm};
