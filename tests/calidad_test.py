"""Calidad: accesibilidad WCAG 2.2 AA con axe-core en cada pantalla e idioma, navegación con teclado, funcionamiento sin red
   y rendimiento en gama baja (CPU ×4, móvil).   Uso: AXE=/ruta/axe.min.js python3 tests/calidad_test.py"""
import asyncio, os, sys, pathlib, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from forja_test import Harness
ROOT = pathlib.Path(__file__).resolve().parent.parent
AXE = pathlib.Path(os.environ.get('AXE', '/home/claude/tools/node_modules/axe-core/axe.min.js')).read_text()

async def main():
    ok = True
    def check(nombre, cond, extra=''):
        nonlocal ok; ok &= bool(cond); print(('✓' if cond else '✕'), nombre, ('· ' + str(extra)[:600]) if extra and not cond else '')
    async with Harness(ROOT/'index.html') as h:
        p = h.page; await p.add_script_tag(content=AXE)
        prep = {0: '', 1: "S.alias='a11y';nuevaActividad('dbca','elegida');", 2: "aplicaEjemplo();", 3: "aplicaEjemplo();", 4: "$('btnProfEj').click();"}
        viol = []
        for l in ('es', 'en', 'pt'):
            await h.idioma(l)
            for pant, js in prep.items():
                await p.evaluate(f"{js}go({pant})"); await p.wait_for_timeout(700); await p.evaluate("$('toast').classList.remove('on')"); await p.wait_for_timeout(350)
                r = await p.evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(r=>r.violations.map(v=>v.id+' ('+v.nodes.length+'): '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | ')))")
                if r: viol.append(f'{l}/{pant}: {r}')
            # modales
            for m in ('mHelp', 'mIA'):
                await p.evaluate(f"$('{m}').classList.add('on')"); await p.wait_for_timeout(200)
                r = await p.evaluate("axe.run(document.getElementById('" + m + "'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r=>r.violations.map(v=>v.id))")
                if r: viol.append(f'{l}/{m}: {r}')
                await p.evaluate(f"$('{m}').classList.remove('on')")
        check('axe-core WCAG 2.2 AA: cero infracciones en 5 pantallas × 3 idiomas y los modales', not viol, viol)
        await h.idioma('es')
        # teclado: practicar un ejercicio entero sin ratón
        await p.evaluate("S=nuevoS();guarda();go(1)"); await p.focus('#alias'); await p.keyboard.type('teclado-01'); await p.keyboard.press('Enter'); await p.wait_for_timeout(300)
        await p.evaluate("nuevaActividad('gl','elegida');pintaPractica()")
        sol = await p.evaluate("ej().q[0].sol"); await p.focus('#r_gl'); await p.keyboard.type(str(sol)); await p.keyboard.press('Tab')
        foco = await p.evaluate("document.activeElement.id"); await p.keyboard.press('Enter'); await p.wait_for_timeout(300)
        check('teclado: escribir, tabular hasta «Comprobar» y validar sin ratón', foco == 'btnComprobar' and await p.evaluate("S.act.fin && S.act.okFinal===1"), foco)
        check('teclado: el foco pasa a «Siguiente actividad»', await p.evaluate("document.activeElement.id") == 'btnSig')
        # foco visible
        out = await p.evaluate("getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).boxShadow")
        check('foco visible en botones', 'none none' not in out, out)
        # Escape cierra los modales
        await p.click('#btnHelp'); await p.keyboard.press('Escape'); check('Escape cierra la ayuda', not await p.evaluate("$('mHelp').classList.contains('on')"))
        # sin red: tras cargar, la práctica, el laboratorio y las descargas funcionan
        await h.ctx.set_offline(True)
        await p.evaluate("nuevaActividad('tukey','elegida');pintaPractica()"); txt = await p.inner_text('#cardEj')
        await p.evaluate("go(2)"); await p.select_option('#labDis', 'cl'); await p.click('#btnDatosEj'); await p.click('#btnLab'); await h.esp("S.lab.res && S.lab.res.diseno==='cl'")
        await p.evaluate("go(3)"); dl = await h.descarga('#btnWord', '/tmp/offline.docx')
        check('sin red: práctica, laboratorio y Word funcionan', len(txt) > 100 and not await p.evaluate("S.lab.res.error") and pathlib.Path('/tmp/offline.docx').stat().st_size > 2000)
        await h.ctx.set_offline(False)
        # tamaño
        tam = (ROOT/'index.html').stat().st_size; check(f'HTML < 1,5 MB ({tam/1e6:.2f} MB)', tam < 1.5e6)
        # gama baja: CPU ×4 y móvil
        ctx = await h.browser.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True); await ctx.route('**/*', h._route)
        pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        t0 = time.time(); await pg.goto((ROOT/'index.html').as_uri()); await pg.wait_for_selector('#btnStart', state='visible'); t1 = time.time() - t0
        t0 = time.time(); await pg.evaluate("S.alias='lento';go(1)"); await pg.wait_for_selector('#btnComprobar'); t2 = time.time() - t0
        t0 = time.time(); await pg.evaluate("go(2)"); await pg.select_option('#labDis', 'dca'); await pg.click('#btnDatosEj'); await pg.select_option('#labMet', 'duncan'); await pg.click('#btnLab')
        for _ in range(100):
            if await pg.evaluate("!!(S.lab.res && S.lab.res.diseno==='dca')"): break
            await pg.wait_for_timeout(100)
        t3 = time.time() - t0; await ctx.close()
        check(f'gama baja (CPU ×4, móvil): portada útil en {t1:.2f} s (< 3 s)', t1 < 3)
        check(f'gama baja: primer ejercicio en {t2:.2f} s y ANAVAR con Duncan en {t3:.2f} s (< 3 s)', t2 < 3 and t3 < 3)
        check('sin errores de página', h.errors == [], h.errors)
    print('\n' + ('TODO OK' if ok else 'HAY FALLOS')); return ok

if __name__ == '__main__': sys.exit(0 if asyncio.run(main()) else 1)
