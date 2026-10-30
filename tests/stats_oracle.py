"""Contrasta el motor estadístico (src/stats.js) con scipy: distribuciones, valores críticos de tablas,
Shapiro-Wilk, Levene, ANAVAR (DCA, DBCA, cuadrado latino, factorial) y regresión.  Uso: python3 tests/stats_oracle.py"""
import json, subprocess, sys, pathlib, random
import numpy as np
from scipy import stats
R = pathlib.Path(__file__).resolve().parent.parent
def js(expr):
    code = f"const S=require('{R}/src/stats.js');console.log(JSON.stringify({expr}))"
    return json.loads(subprocess.run(['node', '-e', code], capture_output=True, text=True, check=True).stdout)
fallos = []
def chk(nombre, a, b, rel=1e-4, absol=1e-6):
    ok = abs(a - b) <= max(absol, rel * abs(b))
    if not ok: fallos.append(f'{nombre}: js={a} scipy={b}')
    return ok
# distribuciones
casos = [(t, df) for t in (-3.1, -0.4, 0.7, 2.2, 5.0) for df in (2, 5, 12, 30, 120)]
v = js('[' + ','.join(f'S.pt({t},{df})' for t, df in casos) + ']')
for (t, df), x in zip(casos, v): chk(f'pt({t},{df})', x, stats.t.cdf(t, df), 1e-7, 1e-9)
casos = [(p, df) for p in (0.9, 0.95, 0.975, 0.995) for df in (2, 4, 9, 20, 60)]
v = js('[' + ','.join(f'S.qt({p},{df})' for p, df in casos) + ']')
for (p, df), x in zip(casos, v): chk(f'qt({p},{df})', x, stats.t.ppf(p, df), 1e-6)
casos = [(F, a, b) for F in (0.3, 1.5, 4.2, 12.0) for a in (1, 3, 5) for b in (4, 12, 40)]
v = js('[' + ','.join(f'S.pfUpper({F},{a},{b})' for F, a, b in casos) + ']')
for (F, a, b), x in zip(casos, v): chk(f'pf({F},{a},{b})', x, stats.f.sf(F, a, b), 1e-6, 1e-10)
casos = [(a, b) for a in (1, 2, 3, 4, 6) for b in (6, 10, 15, 24, 60)]
v = js('[' + ','.join(f'S.qf(0.95,{a},{b})' for a, b in casos) + ']')
for (a, b), x in zip(casos, v): chk(f'qf(.95,{a},{b})', x, stats.f.ppf(0.95, a, b), 1e-6)
v = js('[' + ','.join(f'S.qnorm({p})' for p in (0.001, 0.025, 0.3, 0.5, 0.9, 0.9999)) + ']')
for p, x in zip((0.001, 0.025, 0.3, 0.5, 0.9, 0.9999), v): chk(f'qnorm({p})', x, stats.norm.ppf(p), 1e-8, 1e-9)
# rango studentizado (Tukey) y Duncan
casos = [(k, df) for k in (2, 3, 4, 5, 6, 8) for df in (4, 6, 10, 12, 20, 30, 60)]
v = js('[' + ','.join(f'S.qtukey(0.95,{k},{df})' for k, df in casos) + ']')
for (k, df), x in zip(casos, v): chk(f'qtukey(.95,{k},{df})', x, stats.studentized_range.ppf(0.95, k, df), 2e-4)
casos = [(p, df) for p in (2, 3, 4, 5, 6) for df in (6, 12, 20, 40)]
v = js('[' + ','.join(f'S.rDuncan(0.05,{p},{df})' for p, df in casos) + ']')
for (p, df), x in zip(casos, v): chk(f'rDuncan({p},{df})', x, stats.studentized_range.ppf(0.95 ** (p - 1), p, df), 2e-4)
casos = [(q, k, df) for q in (2.0, 3.5, 4.8) for k in (3, 5) for df in (5, 15, 40)]
v = js('[' + ','.join(f'S.ptukey({q},{k},{df})' for q, k, df in casos) + ']')
for (q, k, df), x in zip(casos, v): chk(f'ptukey({q},{k},{df})', x, stats.studentized_range.cdf(q, k, df), 2e-4, 2e-5)
# Dunnett bilateral con n iguales: P(max|T| <= d) con t multivariante (rho = 0,5)
from scipy.stats import multivariate_t
casos = [(k, df) for k in (1, 2, 3, 4, 5) for df in (10, 20, 40)]
v = js('[' + ','.join(f'S.qdunnett(0.05,{k},{df})' for k, df in casos) + ']')
for (k, df), d in zip(casos, v):
    if k == 1: chk(f'qdunnett(k=1,{df})', d, stats.t.ppf(0.975, df), 1e-5); continue
    S = np.full((k, k), 0.5); np.fill_diagonal(S, 1)
    p = multivariate_t(shape=S, df=df, seed=1).cdf(np.full(k, d), lower_limit=np.full(k, -d), maxpts=2_000_000)
    chk(f'P dunnett(d={d:.4f},k={k},{df})', p, 0.95, 1.5e-3)
# Shapiro-Wilk
rng = np.random.default_rng(7)
for n in (3, 4, 5, 6, 8, 11, 12, 20, 37, 80, 250):
    for dist in ('norm', 'exp'):
        x = (rng.normal(10, 2, n) if dist == 'norm' else rng.exponential(3, n)).round(3).tolist()
        o = js(f'S.shapiro({json.dumps(x)})'); W, p = stats.shapiro(x)
        chk(f'SW W n={n} {dist}', o['W'], W, 1e-5); chk(f'SW p n={n} {dist}', o['p'], p, 2e-3, 1e-6)
# Levene (mediana)
for _ in range(5):
    g = [rng.normal(5, s, m).round(2).tolist() for s, m in ((1, 6), (2, 5), (1.5, 7))]
    o = js(f'S.levene({json.dumps(g)})'); F, p = stats.levene(*g)
    chk('levene F', o['F'], F, 1e-8); chk('levene p', o['p'], p, 1e-6)
# ANAVAR DCA frente a f_oneway
for _ in range(5):
    g = [rng.normal(m, 1.2, rng.integers(3, 7)).round(2).tolist() for m in (10, 11, 12.5, 10.7)]
    datos = [{'trt': f'T{i}', 'y': y} for i, gg in enumerate(g) for y in gg]
    o = js(f'S.dca({json.dumps(datos)})'); F, p = stats.f_oneway(*g)
    chk('DCA F', o['tabla'][0]['F'], F, 1e-9); chk('DCA p', o['tabla'][0]['p'], p, 1e-6)
# DBCA, cuadrado latino y factorial frente a mínimos cuadrados (numpy) con variables indicadoras
def sc_modelo(X, y): b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; return float(r @ r)
def dummies(v):
    niv = sorted(set(v)); return np.array([[1.0 if x == l else 0.0 for l in niv[1:]] for x in v])
for _ in range(3):
    t, b = 4, 5; datos = []; 
    for i in range(t):
        for j in range(b): datos.append({'trt': f'T{i}', 'bloque': f'B{j}', 'y': round(20 + i + 2 * j + rng.normal(0, 1), 2)})
    o = js(f'S.dbca({json.dumps(datos)})'); y = np.array([d['y'] for d in datos])
    one = np.ones((len(y), 1)); Xb = np.hstack([one, dummies([d['bloque'] for d in datos])]); Xbt = np.hstack([Xb, dummies([d['trt'] for d in datos])])
    sce = sc_modelo(Xbt, y); sctr = sc_modelo(Xb, y) - sce
    chk('DBCA SCe', o['tabla'][2]['sc'], sce, 1e-8); chk('DBCA SCtrt', o['tabla'][1]['sc'], sctr, 1e-8)
for t in (4, 5):
    perm = rng.permutation(t); datos = []
    for i in range(t):
        for j in range(t): datos.append({'trt': f'T{perm[(i + j) % t]}', 'fila': f'F{i}', 'col': f'C{j}', 'y': round(30 + perm[(i + j) % t] + i + rng.normal(0, 1), 2)})
    o = js(f'S.cuadradoLatino({json.dumps(datos)})'); y = np.array([d['y'] for d in datos]); one = np.ones((len(y), 1))
    Xfc = np.hstack([one, dummies([d['fila'] for d in datos]), dummies([d['col'] for d in datos])]); Xall = np.hstack([Xfc, dummies([d['trt'] for d in datos])])
    sce = sc_modelo(Xall, y); chk(f'CL{t} SCe', o['tabla'][3]['sc'], sce, 1e-8); chk(f'CL{t} SCtrt', o['tabla'][2]['sc'], sc_modelo(Xfc, y) - sce, 1e-8)
for (a, b, r, bloques) in ((2, 2, 3, False), (3, 3, 2, False), (2, 3, 4, True), (3, 2, 3, True)):
    datos = []
    for i in range(a):
        for j in range(b):
            for k in range(r): datos.append({'f': [f'A{i}', f'B{j}'], 'bloque': f'R{k}', 'y': round(10 + i + 0.5 * j + 0.8 * i * j + 0.6 * k + rng.normal(0, 1), 2)})
    o = js(f"S.factorial({json.dumps(datos)},['A','B'],{str(bloques).lower()})"); y = np.array([d['y'] for d in datos]); one = np.ones((len(y), 1))
    base = [one] + ([dummies([d['bloque'] for d in datos])] if bloques else [])
    XA, XB = dummies([d['f'][0] for d in datos]), dummies([d['f'][1] for d in datos]); XAB = np.hstack([XA[:, [p]] * XB[:, [q]] for p in range(XA.shape[1]) for q in range(XB.shape[1])])
    sce = sc_modelo(np.hstack(base + [XA, XB, XAB]), y); scab = sc_modelo(np.hstack(base + [XA, XB]), y) - sce
    off = 1 if bloques else 0
    chk(f'Fact{a}x{b} SCe', o['tabla'][off + 3]['sc'], sce, 1e-8); chk(f'Fact{a}x{b} SCAB', o['tabla'][off + 2]['sc'], scab, 1e-8)
# 2^3: efectos frente al contraste clásico
datos = []; ef = {'A': 3.0, 'B': -1.2, 'C': 0.6}
for i in range(2):
    for j in range(2):
        for k in range(2):
            for rep in range(2): datos.append({'f': [f'a{i}', f'b{j}', f'c{k}'], 'y': round(20 + ef['A'] * i + ef['B'] * j + ef['C'] * k + 1.5 * i * j + rng.normal(0, 0.5), 2)})
o = js(f"S.factorial({json.dumps(datos)},['A','B','C'],false)")
y = np.array([d['y'] for d in datos]); sg = lambda d, j: 1 if d['f'][j].endswith('1') else -1
for nombre, js_ in (('A', [0]), ('A × B', [0, 1]), ('A × B × C', [0, 1, 2])):
    con = sum(np.prod([sg(d, j) for j in js_]) * d['y'] for d in datos)
    e = next(x for x in o['efectos2k'] if x['nombre'] == nombre); chk(f'2^3 efecto {nombre}', e['efecto'], con / 8, 1e-9)
    row = next(x for x in o['tabla'] if x['fuente'] == nombre); chk(f'2^3 SC {nombre}', row['sc'], con ** 2 / 16, 1e-9)
# regresión
for _ in range(4):
    x = np.round(rng.uniform(0, 120, 9), 1); yv = np.round(2.1 + 0.035 * x + rng.normal(0, 0.4, 9), 2)
    o = js(f'S.regresion({json.dumps(x.tolist())},{json.dumps(yv.tolist())})'); L = stats.linregress(x, yv)
    chk('reg b', o['b'], L.slope, 1e-10); chk('reg a', o['a'], L.intercept, 1e-9); chk('reg r', o['r'], L.rvalue, 1e-10); chk('reg p', o['pb'], L.pvalue, 1e-6, 1e-12)
# comparaciones: Tukey-Kramer frente a scipy.stats.tukey_hsd
g = [rng.normal(m, 1, n).round(2).tolist() for m, n in ((10, 5), (11.5, 5), (12, 6), (10.4, 4))]
datos = [{'trt': f'T{i}', 'y': y} for i, gg in enumerate(g) for y in gg]
o = js(f"(()=>{{const a=S.dca({json.dumps(datos)});return S.comparaciones('tukey',a.medias,a.n,a.cme,a.glE)}})()")
th = stats.tukey_hsd(*g)
for pr in o['pares']: chk(f"tukey p {pr['i']}-{pr['j']}", pr['p'], th.pvalue[pr['i'], pr['j']], 2e-3, 2e-4)
# Dunnett frente a scipy.stats.dunnett (n iguales): decisiones coherentes con los p-valores
g = [rng.normal(m, 1, 6).round(2).tolist() for m in (10, 10.4, 11.6, 12.3)]
datos = [{'trt': f'T{i}', 'y': y} for i, gg in enumerate(g) for y in gg]
o = js(f"(()=>{{const a=S.dca({json.dumps(datos)});return S.comparaciones('dunnett',a.medias,a.n,a.cme,a.glE,0.05,0)}})()")
dn = stats.dunnett(*g[1:], control=g[0])
for pr, p in zip(o['pares'], dn.pvalue):
    if abs(p - 0.05) > 0.003 and pr['sig'] != (p < 0.05): fallos.append(f"dunnett decisión {pr['i']}: js={pr['sig']} p={p}")
# cross-over 2x2 (n desiguales): SC de tratamiento y periodo ajustadas frente a mínimos cuadrados
datos = []
for s_ in range(10):
    sec = 'AB' if s_ < 4 else 'BA'; base = 18 + rng.normal(0, 1.5)
    for per in (1, 2):
        trt = sec[per - 1]; datos.append({'sujeto': f'S{s_}', 'sec': sec, 'periodo': str(per), 'trt': trt, 'y': round(base + (1.0 if trt == 'A' else 0) + (0.4 if per == 2 else 0) + rng.normal(0, 0.5), 2)})
o = js(f'S.crossover({json.dumps(datos)})'); y = np.array([d['y'] for d in datos]); one = np.ones((len(y), 1))
Sx, Px, Tx = (dummies([d[k] for d in datos]) for k in ('sujeto', 'periodo', 'trt'))
full = sc_modelo(np.hstack([one, Sx, Px, Tx]), y)
chk('crossover SCe', o['tabla'][4]['sc'], full, 1e-8); chk('crossover SCtrt', o['tabla'][3]['sc'], sc_modelo(np.hstack([one, Sx, Px]), y) - full, 1e-8); chk('crossover SCper', o['tabla'][2]['sc'], sc_modelo(np.hstack([one, Sx, Tx]), y) - full, 1e-8)
print(f'{"OK" if not fallos else "FALLOS"} · comprobaciones contra scipy')
for f in fallos: print('  ✗', f)
sys.exit(1 if fallos else 0)
