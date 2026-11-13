# Devlog: Harness² Benchmark Analysis

## El objetivo

El proyecto nació como una implementación de la especificación técnica del
dashboard Harness² Benchmark Analysis para `alulema/harness-benchmark`. Además
de mostrar resultados de ejecuciones de agentes, debía poder empaquetarse como
un demo estático e integrarse después en la infraestructura efímera de
`personal-website`.

La referencia visual fue el proyecto hermano `alulema/harness-playground`. La
integración debía respetar el contrato `DEMO_INTEGRATION.md` del sitio, incluir
una copia de ese contrato en este repositorio y dejar un handoff claro para el
Copilot que trabajara en `personal-website`.

## Bitácora

### Exploración y definición

- Se revisó la especificación técnica y se identificaron las vistas y métricas
  que debía ofrecer el dashboard.
- Se estudió el lenguaje visual de `harness-playground` para reutilizar sus
  tokens, estilos y convenciones de composición, en lugar de inventar una
  interfaz desconectada.
- Se obtuvo el contrato de integración desde el repositorio privado
  `personal-website`. Las URL públicas de raw content y la consulta anónima no
  funcionaban; la lectura sí se pudo hacer con la API de GitHub autenticada
  mediante `gh api`.
- Se guardaron en `docs/` copias de la especificación y del contrato de
  integración para que el proyecto y su futuro handoff fueran autocontenidos.

### Implementación del dashboard

- Se montó una aplicación estática con Astro y React, usando Tailwind y
  Recharts, siguiendo la línea tecnológica y visual del proyecto de referencia.
- Se construyeron filtros por benchmark, modo, modelo y presupuesto; tarjetas
  KPI; gráficos de convergencia, adopción de componentes, comparación de
  modelos y métricas de ejecución; y una tabla de ejecuciones con búsqueda,
  paginación, filas expandibles y exportación CSV.
- Se añadieron nueve ejecuciones de ejemplo. Se marcaron como datos
  **ilustrativos** tanto en los datos como en la interfaz para no presentarlos
  como mediciones reales.
- Se implementó `scripts/parse_harness_runs.py` para procesar archivos
  `runs/**/*.json`, normalizar variantes de nombres de campos y escalas de
  puntuación, validar los registros y producir JSON y CSV para la aplicación.
  Los campos de costo y latencia se incorporaron al modelo de datos, el
  parser, las métricas y la visualización.
- Se añadieron pruebas unitarias del parser, documentación de uso, un
  contenedor multi-stage con Nginx en el puerto 8080 y un workflow de GitHub
  Actions para publicar la imagen en GHCR.

### Integración y entrega

- Se conectó el tema y el panel informativo compartidos del sitio mediante
  `demo-theme.css`, `window.DEMO_INFO` bilingüe y `demo-panel.js`.
- Se creó `HANDOFF.md` en español con las instrucciones para integrar el demo
  en `personal-website`, incluido el slug `harness-benchmark`, el puerto, la
  ruta raíz, la naturaleza estática de la aplicación y las comprobaciones de
  aceptación.
- El trabajo se registró en el commit `004384e` y se subió en la rama
  `alulema-harness-benchmark-demo`. Se abrió el PR #2, que se integró en `main`
  el 22 de octubre de 2026.
- El merge activó el workflow de publicación. La imagen se publicó como
  `ghcr.io/alulema/harness-benchmark:latest` y con una etiqueta basada en el
  SHA del commit de merge:
  `ghcr.io/alulema/harness-benchmark:c42f567aed9487b1d1d6466df87721118813742c`.
- Se verificó que ambas referencias se pudieran inspeccionar con
  `docker manifest inspect`. El digest observado para `latest` fue
  `sha256:c7fdd24cc7f17173aef1115c38ffc78e135c247726acb91a902b1b334997e4df`.
- Después de la publicación, se actualizó el handoff para reemplazar el estado
  de “imagen pendiente” por la ubicación real de GHCR y recomendar la etiqueta
  fija para despliegues reproducibles. Esa actualización de `HANDOFF.md` está
  en el worktree y no forma parte del commit `004384e`.

## Desafíos y cómo se resolvieron

### Acceso al contrato de integración

El repositorio de `personal-website` es privado, por lo que las rutas raw
públicas y las consultas anónimas devolvían 404. En vez de asumir el contenido
del contrato, se leyó el archivo por la API autenticada de GitHub y se añadió
una copia al repositorio del dashboard. Esto permitió diseñar la imagen y el
handoff contra los requisitos reales.

### Requisitos que aparecieron al contrastar la especificación

Durante una revisión de cobertura se detectó que costo y latencia no estaban
incluidos todavía. Se añadieron de extremo a extremo, desde la ingestión y el
tipo de datos hasta las tarjetas y gráficos, para que la implementación
respondiera a la especificación en vez de limitarse a una primera versión
visual.

### Tipos de Recharts y TypeScript

La verificación de Astro encontró incompatibilidades de tipos en componentes de
gráficos: las claves de datos del tooltip necesitaban convertirse explícitamente
a texto para usarse como claves de React, y algunos datos ordenados requerían
objetos tipados en vez de tuplas heterogéneas. Se corrigieron los tipos en los
componentes correspondientes y la comprobación quedó limpia.

### Diferencias de fecha entre servidor y navegador

Al ejecutar la aplicación localmente apareció una discrepancia de hidratación
en el pie de página. El formato con `toLocaleDateString()` puede variar entre
el entorno de renderizado y el navegador. Se cambió a una fecha ISO estable
(`toISOString().slice(0, 10)`), tras lo cual la página se renderizó
correctamente.

### Handoff confundido con otro demo

La primera revisión externa del handoff mencionó Ollama, asignaciones de CPU y
memoria, `LLM_NUM_THREAD` y `dreaming-agent`. Esos detalles correspondían a otro
demo, no a Harness², que es una aplicación estática de un solo contenedor y no
usa un LLM. Se mantuvieron fuera de este proyecto; sí se incorporó la
recomendación pertinente de fijar la imagen por SHA o digest.

### Publicación condicionada al merge

Inicialmente, la imagen solo existía en el Docker local: el workflow estaba
configurado para publicar al recibir cambios en `main`, tags `v*` o una
ejecución manual. Se aclaró esa dependencia en el handoff y se creó el PR. Una
vez integrado, el workflow terminó correctamente y publicó la imagen. La
verificación de visibilidad mediante la API de Packages devolvió 403 porque el
token disponible no tenía el scope `read:packages`; por eso se comprobó la
descarga anónima del manifest como alternativa práctica.

## Validación realizada

- `npm run check`: sin errores.
- `npm run build`: compilación de producción correcta.
- Pruebas unitarias de Python del parser: correctas.
- Construcción de la imagen Docker y smoke tests HTTP: correctos para `/`,
  `/projects/harness2-benchmark/`, el JSON de datos y el CSV.
- Ejecución local en el navegador: correcta después de resolver la
  discrepancia de hidratación; el servidor se detuvo cuando el usuario terminó
  de revisar el demo.
- Publicación de GHCR: workflow completado con éxito y manifest de la imagen
  publicado.

## Estado y decisiones útiles para el post

- **Stack:** Astro, React, Tailwind, Recharts, Python, Pandas, Pydantic y Nginx.
- **Salida:** dashboard estático, sin base de datos, secretos, persistencia,
  autenticación propia, inferencia ni sidecars.
- **Datos:** nueve registros ilustrativos, claramente etiquetados.
- **Imagen:** `ghcr.io/alulema/harness-benchmark`; para reproducibilidad,
  preferir la etiqueta SHA completa o el digest antes que `latest`.
- **Integración:** el handoff describe cómo registrar el demo en
  `personal-website`; este trabajo no modificó ni hizo commit en ese
  repositorio.
- **Aprendizajes para contar:** copiar el contrato real antes de integrar,
  revisar la especificación de punta a punta, evitar fechas dependientes de
  locale en SSR y distinguir entre “imagen construida localmente” e “imagen
  publicada y descargable”.

## Referencias del repositorio

- `docs/HARNESS2_BENCHMARK_DASHBOARD_SPEC.md`: especificación técnica.
- `docs/DEMO_INTEGRATION.md`: contrato de integración.
- `HANDOFF.md`: instrucciones para el repositorio personal.
- `README.md`: ejecución local, parser, Docker y publicación.
- `scripts/parse_harness_runs.py` y `tests/test_parse_harness_runs.py`: pipeline
  y pruebas de ingestión.
- `.github/workflows/publish-image.yml`: publicación de la imagen.

## Piloto técnico de Harness² (2026-11-07)

### Corrección de referencia

Al preparar el piloto se confirmó que Harness² sí tiene un repositorio oficial
en [`google-research/harness2`](https://github.com/google-research/harness2) y
adaptadores nativos para LAB, JobBench y WorkBuddy-Bench. Por tanto, τ-bench no
es el punto de partida adecuado para demostrar este proyecto: sería otro
benchmark y requeriría un adaptador adicional. Se reorientó el piloto al demo y
los benchmarks del propio Harness². El repositorio oficial está bajo Apache
2.0; los benchmarks y sus dependencias conservan licencias propias.

### Ejecución sin costo de modelos

- Se obtuvo el commit `6868817518876de8fd170c6a8354daca273b6191` del repositorio
  oficial en `/tmp/harness2-pilot`, fuera del worktree del dashboard.
- Se instaló Python 3.12 en un entorno temporal con `uv` y se ejecutó
  `harness2-demo --output /tmp/harness2-pilot-runs --k 2 --mode both`.
- El demo determinista completó 2 de 2 tareas locales de contabilidad, con
  cero fallos, 28 ejecuciones Python y 32 llamadas a editores deterministas.
  No utilizó modelos ni API; por ello, no produjo resultados de benchmark
  empíricos ni sirve para inferir mejoras de calidad.
- El demo generó trazas, harnesses base y adoptados, decisiones de selección,
  reflexiones, resúmenes por tarea, bibliotecas por modo y un resumen global.
  Los resúmenes incluyen métricas de presupuesto y costo (`R`, `P`, `usd`,
  `rollout_usd`, `session_usd`), pero en este demo determinista todos los costos
  monetarios son cero.

### Preflight de benchmark real

- `harness2-setup jb --dry-run` mostró el plan de JobBench sin instalar ni
  descargar componentes. Usa revisiones fijadas para OpenCode y JobBench y
  descarga el dataset público de Hugging Face, sin requerir token ni aceptar
  condiciones de acceso.
- La guía oficial advierte que las rúbricas de JobBench también son públicas y
  un ejecutor con acceso web puede leerlas; antes de una evaluación real se
  debe restringir la salida de red del ejecutor a los hosts de tareas/rúbricas.
- La guía requiere Linux y Python 3.12/3.13 para benchmarks model-backed,
  además de Node.js, `uv` y Google Cloud CLI para la ruta predeterminada de
  Vertex AI. El entorno de trabajo era macOS con Python 3.11 por defecto; `uv`
  pudo ejecutar el demo con Python 3.12, pero no se configuró el entorno Linux
  de benchmark.
- La comprobación inicial no encontró Google Application Default Credentials
  ni credenciales de modelos. Después, a solicitud del usuario, se instaló
  Google Cloud CLI y se completó el inicio de sesión ADC. No se seleccionó un
  proyecto, no se configuraron IDs de modelo y no se realizaron llamadas
  facturables ni se inició una evaluación de JobBench/LAB/WorkBuddy. El inicio
  de sesión de otra nube, por sí solo, no configura el proveedor
  predeterminado de Harness².
- Docker Desktop está instalado y se intentó iniciar, pero el daemon todavía no
  respondía; por ello no se utilizó como host Linux de benchmark.

### Compatibilidad con el dashboard

- Se probó el parser actual contra el árbol de salida del demo. Falló con
  código de salida 1 porque recorre **todos** los `*.json` recursivamente y
  trata como ejecuciones los archivos de selección, adopción, reflexión y
  resumen; entre otras cosas, algunos contienen costos nulos. No es compatible
  con el formato nativo de Harness².
- Un adaptador real debe leer selectivamente los resúmenes por tarea, las
  selecciones, `judged.json`, `base_judged.json` y la configuración del
  experimento; no debe inferir scores a partir de las trazas sin juez.
- Las métricas nativas varían por benchmark: LAB informa crédito parcial y
  pase de todos los criterios; otros benchmarks reportan su score. El formato
  actual no expresa conteos de criterios, resultados sin calificar ni unidades
  de score, así que debe ampliarse para no convertir “ungraded” en cero.
- Harness² registra gastos de etapas de mejora, selección y ejecuciones del
  agente por separado. El reporte de consola llama explícitamente “improver
  spend” a una parte de ese gasto; el dashboard debe conservar y mostrar por
  separado costo total, rollouts y etapas de mejora.
- El resumen del sweep registra `started_at` y `finished_at`, pero no se
  encontró una métrica de latencia por ejecución en los resúmenes examinados.
  Para comparar latencia con rigor habrá que medir duración por tarea y por
  modo en el wrapper de ejecución.

### Evaluación de Azure AI Foundry como proveedor

- El usuario compartió una URL de Foundry que termina en `/models` y los
  nombres `gpt-5.5`, `gpt-chat`, `gpt-image-2`, `text-embedding` y
  `text-embedding-3-small`. No compartió claves.
- Después confirmó las rutas disponibles: un endpoint de Responses con
  `api-version=2025-04-01-preview` y un endpoint de Chat Completions para el
  deployment `gpt-chat` con `api-version=2025-01-01-preview`. El deployment
  `gpt-chat` queda confirmado; la ruta de Responses no incluye el nombre del
  deployment porque esa API lo recibe como `model`.
- Se verificó manualmente el endpoint de Responses desde la terminal del
  usuario con `gpt-5.5`: la respuesta terminó con `status: completed`, sin
  error, y devolvió `OK` (26 tokens reportados). Esto confirma conectividad,
  autenticación y uso básico del deployment desde esa terminal, pero aún no
  valida tool calling ni una ejecución de Harness².
- Se probó también una llamada de Responses con una herramienta de función
  requerida. `gpt-5.5` devolvió un `function_call` para `report_status` con
  argumentos JSON válidos y `status: completed` (68 tokens reportados). Esto
  confirma tool calling básico en el deployment; todavía no valida el formato
  exacto de herramientas del sustrato Codex ni una ejecución real de Harness².
- El usuario inició Docker Desktop y confirmó que el daemon responde con la
  versión 29.9.2. Docker ya no es un bloqueo para preparar el host Linux local.
- La documentación oficial acepta Azure OpenAI v1 en recursos con dominio
  `*.services.ai.azure.com`, usando la ruta `/openai/v1/`; por tanto, el endpoint
  de Responses para Codex se configura como la raíz del recurso más esa ruta,
  no usando `/models` ni la ruta preview con query string. La lista vigente de
  modelos para Responses incluye `gpt-5.5`. Esto hace viable probar el ejecutor
  Codex con `gpt-5.5` en la API v1, sujeto a que ese deployment exista y el
  recurso lo habilite.
- Harness² permite configurar por separado el endpoint, la clave y el nombre
  del modelo del juez de JobBench. OpenCode documenta un proveedor Azure, una
  posible ruta para ejecutor/mejorador con soporte de herramientas. El
  deployment `gpt-chat` tiene una ruta de Chat Completions disponible y puede
  evaluarse para juez/mejorador; aún se deben validar sus capacidades de
  tool/function calling. Estas rutas son una evaluación de compatibilidad de
  configuración, no una prueba end-to-end ya ejecutada.
- WorkBuddy sigue siendo una ruta específica de Gemini/Vertex en el setup
  oficial revisado; no se considera compatible con Foundry sin cambios o
  adaptación.
- Las variables/credenciales siguen sin estar disponibles en el entorno de
  ejecución del agente, aunque sí están configuradas en la terminal del
  usuario. No se debe compartir ninguna clave en el chat ni guardarla en el
  repositorio.
- Para continuar, hace falta configurar credenciales localmente y comprobar
  que `gpt-5.5` está desplegado y accesible por la API v1. Se mantiene el
  presupuesto objetivo previamente acordado de hasta US$5 para una tarea y
  `k=1`; Harness² no aplica un tope duro garantizado.

### Decisión para continuar

El piloto sin costo valida que el workflow recursivo y sus artefactos pueden
ejecutarse localmente; no valida el efecto de Harness² en modelos ni tareas
profesionales. Azure Foundry ya pasó pruebas manuales de texto y tool calling
básico mediante Responses API desde la terminal del usuario. Aún hace falta
ejecutar Harness² y su baseline en un host Linux, juzgar ambos resultados,
registrar duración/costos y revisar los artefactos antes de ampliar el número
de tareas o el presupuesto de iteraciones.

Referencias consultadas:

- [Repositorio Harness²](https://github.com/google-research/harness2)
- [Setup y credenciales](https://github.com/google-research/harness2/blob/main/docs/SETUP.md)
- [Guías de benchmarks y licencias](https://github.com/google-research/harness2/blob/main/docs/BENCHMARKS.md)
- [Diseño experimental, costo y riesgo de fuga de rúbricas](https://github.com/google-research/harness2/blob/main/docs/EXPERIMENTS.md)
- [Azure OpenAI v1 / Responses API](https://learn.microsoft.com/en-us/azure/foundry/openai/api-version-lifecycle?view=foundry-classic)
- [OpenCode providers](https://opencode.ai/docs/providers/)

## Análisis de resultados existentes de playground (2026-11-08)

Después de los intentos sin resultado útil en la NUC, se revisó
`alulema/harness-playground` antes de proponer otra ejecución. El playground ya
ejecuta localmente una implementación educativa inspirada en Harness² y
conserva experimentos; repetir desde cero una comparación básica con Ollama
habría duplicado trabajo. No se dispone aquí de los logs del intento en la NUC,
por lo que no se atribuye una causa concreta a su fallo.

El dashboard se amplió con una vista independiente del estudio exploratorio
`agi-futures-v2`, a partir de sus archivos públicos fijados al commit
`cad3f18a7092779c778127bde8c4264da8267a8d`. No se ejecutó ningún modelo ni
se modificó el repositorio de playground. El adaptador verifica los hashes y
las referencias entre los archivos; conserva 24 pares Qwen, 8 tareas y el
fallo de desarrollo de Gemma. Los resultados incluyen 48 streams completados,
lo que no implica que todas las respuestas estén completas.

Se reproducen como **inspección manual documentada en el estudio original**
los controles aritméticos: 4/6 correctos para el caso base y 2/6 para el
candidato. No son resultados calculados de nuevo por el dashboard, ni miden
las preguntas cualitativas. La revisión humana cualitativa seguía pendiente en
la revisión fijada. La interfaz separa estos hechos del benchmark ilustrativo,
advierte que la vista de respuestas no es ciega y no copia el paquete de
revisión ni su clave. El repositorio de origen no declaraba licencia al
consultarlo; acceso público no equivale a permiso general de reutilización.

Esto permite contar cómo interpretar una evaluación y sus limitaciones; no
demuestra que Harness² oficial haya mejorado un modelo. No se volvió a
desplegar la imagen GHCR al desarrollar esta vista.
