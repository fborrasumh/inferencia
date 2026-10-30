# InferencIA

Laboratorio de estadística inferencial y diseño experimental agropecuario. Aplicación web de un solo fichero.

**Usar la app:** https://fborrasumh.github.io/inferencia/

**Idiomas:** español (por defecto), inglés, portugués; selector en la barra superior (o `?lang=en` / `?lang=pt` en la URL).

## Qué hace

- **Práctica autónoma corregida por código** de 19 habilidades vinculadas a siete resultados de aprendizaje (RA1–RA7):
  - intervalo de confianza;
  - pruebas t independiente y pareada;
  - W de Shapiro-Wilk, F máxima de Hartley y decisión según los supuestos;
  - elección del diseño y grados de libertad del error;
  - ANAVAR de DCA, DBCA y cuadrado latino;
  - efectos e interacción de factoriales 2ᵏ y sumas de cuadrados de factoriales 3²;
  - MDS, Tukey, Duncan y Dunnett;
  - regresión lineal y significación de r.
- **Ejercicios únicos y reproducibles.** Cada ejercicio se genera con una semilla (seudónimo + habilidad + número), con contextos agropecuarios simulados (maíz, papa, leche, pollos, pastos, haba). Los valores críticos (t, F, q de Tukey, rₚ de Duncan, Dunnett, Hartley) los calcula la app y se muestran como extracto de tabla. Las filas vecinas se incluyen a propósito: elegir los grados de libertad forma parte del ejercicio.
- **Diagnóstico de errores típicos por recálculo.** El código recalcula el ejercicio con los errores frecuentes y, si tu respuesta coincide con uno, te dice cuál. Algunos ejemplos:
  - z en vez de t;
  - olvidar √n o el 2 de √(2·CMe/r);
  - grados de libertad de otro diseño;
  - analizar un DBCA como DCA;
  - Welch en vez de varianzas combinadas;
  - dividir el contraste entre r·2ᵏ.
- **Ruta adaptativa explicable.** El dominio de cada habilidad se estima con los intentos recientes y decae con el tiempo. La siguiente actividad sigue reglas deterministas: repaso espaciado, refuerzo, contenido nuevo en el orden del sílabo e intercalado. La app siempre muestra por qué toca cada actividad. Tras dos intentos fallidos se puede ver la solución resuelta paso a paso.
- **Laboratorio con los datos del proyecto de aula** (formato largo, CSV):
  - ANAVAR de DCA, DBCA (con eficiencia relativa), cuadrado latino, factorial de dos factores con o sin bloques (efectos 2ᵏ incluidos) y cross-over 2×2 (SC ajustadas, efecto de arrastre);
  - regresión lineal simple;
  - CV, Shapiro-Wilk de los residuos y Levene centrado en la mediana;
  - comparaciones con letras de significación (Tukey-Kramer, Duncan, MDS) o Dunnett frente al testigo;
  - avisos de interacción, supuestos, pocos gl y desequilibrio.
- **Compruébalo en R.** La app escribe el script R equivalente (`aov`, `shapiro.test`, `car::leveneTest`, `agricolae::HSD.test` / `duncan.test` / `LSD.test`, `DescTools::DunnettTest`, `lm`) y el `datos.csv`, para auditar el resultado como pide el sílabo (§8).
- **Croquis de aleatorización** reproducible con semilla (DCA, DBCA, cuadrado latino).
- **Informe (RA8).** El estudiante redacta la interpretación. El código, sin IA, avisa de las cifras del texto que no coinciden con su análisis. La IA (opcional) comenta con cinco criterios y cita literalmente el texto; el código comprueba cada cita y baja a «parcial» lo que no tiene cita verificada.
- **Evidencia.** JSON con huella SHA-256, informe en Word y CSV de intentos, todo generado sin conexión.
- **Profesorado:**
  - carga las evidencias del grupo y detecta ficheros editados;
  - muestra la analítica por habilidad (acierto a la primera, error más frecuente, dominio medio) y propuestas de mejora que decide el profesor;
  - exporta un banco de variantes a **Moodle (GIFT)** con solución y tolerancia;
  - incluye la **autopsia del sílabo** con la sección de origen de cada hallazgo.
- Funciona **sin clave de IA y sin red**. Incluye un ejemplo completo con una estudiante ficticia y un grupo de ejemplo.

## Cómo se usa la IA

La IA es **opcional** y nunca calcula ni pone nota. Se usa con la clave propia de OpenAI, Google Gemini o Anthropic Claude, que se guarda solo en el navegador; no hace falta servidor. Tiene dos usos:

1. **Explicar un error sin dar el resultado.** La IA no recibe la solución, y el código elimina cualquier frase de su respuesta que contenga una cifra igual a la solución.
2. **Comentar la interpretación del informe con cinco criterios.** Recibe la tabla calculada por la app. Cada cita se comprueba contra el texto, y se señalan las cifras de las sugerencias que no están ni en el texto ni en el análisis.

## Exactitud de los cálculos

Todo lo calcula `src/stats.js` y se contrasta con scipy en `tests/stats_oracle.py`:

- distribuciones t, F y normal;
- rango studentizado y rₚ de Duncan;
- Dunnett, comparado con la t multivariante;
- Shapiro-Wilk (algoritmo AS R94, el de R) y Levene;
- ANAVAR de DCA, DBCA, cuadrado latino, factoriales y cross-over, comparado con mínimos cuadrados;
- regresión y Tukey-Kramer.

Los valores de Hartley coinciden con las tablas publicadas (p. ej. Fmax₀,₀₅(3; 4) = 15,5).

## Privacidad

El progreso, los datos del experimento y la interpretación se guardan solo en el navegador (IndexedDB). Hacia el proveedor de IA solo sale lo que se pide comentar: el enunciado y la respuesta, o la interpretación (con correos, teléfonos y el seudónimo enmascarados) y la tabla de resultados. Antes del primer envío se muestra lo que sale. Se recomienda un seudónimo en lugar del nombre. El fichero de evidencia lo entrega el propio estudiante; en el modo profesorado, los ficheros se leen en el navegador y no se guardan.

## Límites

- El dominio es una **estimación** para orientar el estudio, no una nota.
- El sílabo declara un único resultado de aprendizaje («Diseña y Analiza experimentos para el desarrollo de proyectos de investigación agropecuarios»). Los RA1–RA8 son una **propuesta de desglose**, pendiente de validación por el profesor de la asignatura.
- Los ejercicios usan **datos simulados**.
- Duncan y Dunnett con repeticiones desiguales usan la media armónica de n (aproximación; se avisa). El cross-over se limita al 2×2. El factorial del laboratorio exige diseño equilibrado.
- No incluye pruebas no paramétricas (Kruskal-Wallis) ni ANAVAR de Welch: se recomiendan cuando fallan los supuestos, pero hay que hacerlas en R.
- La huella SHA-256 detecta ediciones del fichero de evidencia, pero no es infalible: quien sepa puede recalcularla.
- **Sin evidencia de eficacia todavía.** Medir su efecto en el aprendizaje exige un estudio con aprobación ética, consentimiento informado y, idealmente, un grupo de comparación.
- Las traducciones al inglés y al portugués (pt-PT) conviene revisarlas con hablantes nativos.
- Las pruebas se hicieron con IA simulada, **no con una clave real**.

## Pruebas

```bash
python3 tests/stats_oracle.py       # motor estadístico frente a scipy
node tests/nucleo_test.js           # 19 generadores (miles de variantes), errores típicos, dominio, laboratorio, script R
python3 tests/flujo_test.py         # flujo completo con IA simulada que miente, 6 diseños, exportaciones, profesorado, idiomas, móvil
python3 tests/calidad_test.py       # axe-core WCAG 2.2 AA (5 pantallas × 3 idiomas), teclado, sin red, CPU ×4
```

## Adaptar a otra asignatura o universidad

Los resultados de aprendizaje, las habilidades y sus prerrequisitos, los contextos agropecuarios, α y los parámetros del modelo de dominio están en `src/curriculum.js`. Los generadores de ejercicios están en `src/nucleo.js` y los cálculos en `src/stats.js`. Para adaptarla:

1. Cambia `curriculum.js`.
2. Traduce los textos nuevos en `src/i18n.js`.
3. Ejecuta `python3 build.py` y las pruebas.
4. Publica como versión nueva.

## Autoría

Fernando Borrás Rocher (Universidad Miguel Hernández de Elche) y Jhon Jairo Peña Benitez (Universidad Politécnica Estatal del Carchi (UPEC), Ecuador). Ambos aceptan publicar su aportación bajo licencia MIT.

Contribuciones (CRediT):

- **Jhon Jairo Peña Benitez:** conceptualización (sílabo, contenidos y metodología de la asignatura) y recursos.
- **Fernando Borrás Rocher:** conceptualización de la app, software, validación y redacción.

## Origen de la idea

A partir del sílabo de Estadística Inferencial y Diseño Experimental (Carrera de Agropecuaria, nivel 06, UPEC, PAO 2026 B, código 0811BEIDE6UB-AJ2025) del profesor Jhon Jairo Peña Benitez.

ORCID: Fernando Borrás Rocher [0000-0002-5519-4573](https://orcid.org/0000-0002-5519-4573) · Jhon Jairo Peña Benitez [0000-0002-0064-1436](https://orcid.org/0000-0002-0064-1436)

## Cómo citar

Borrás Rocher, F. y Peña Benitez, J. J. (2026). *InferencIA* (v1.0.0) [Software].

## Licencia

MIT. Véase [LICENSE](LICENSE).
