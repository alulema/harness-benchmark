# Handoff: integrar Harness² Benchmark en personal-website

Este documento da contexto e instrucciones al Copilot que trabaje en `alulema/personal-website`. El objetivo es registrar y conectar el demo existente; no reimplementar su dashboard.

## Solicitud para Copilot

Integra el demo **Harness² Benchmark Analysis** de `alulema/harness-benchmark` en la infraestructura de demos efímeros de `personal-website`, siguiendo los patrones ya existentes en ese repositorio y el contrato `infrastructure/DEMO_INTEGRATION.md` (o la ruta vigente equivalente). Antes de editar, inspecciona cómo se registran otros demos de producto: sus IDs, imágenes, slots, secretos, navegación y configuración de Container Apps. Aplica esos mismos patrones al nuevo demo, sin modificar demos ajenos ni duplicar infraestructura.

## Datos confirmados del demo

- Repositorio: `https://github.com/alulema/harness-benchmark`
- Imagen prevista: `ghcr.io/alulema/harness-benchmark:latest`
- Puerto HTTP del contenedor: **8080**, escuchando en `0.0.0.0`
- La aplicación se sirve desde `/`, sin prefijo requerido.
- También existe la ruta local `/projects/harness2-benchmark/`; la integración pública debe usar la raíz del demo.
- Es una aplicación estática Astro + React servida por Nginx. No necesita base de datos, almacenamiento persistente, secretos, inferencia de modelos ni autenticación propia.
- Es un único contenedor sin LLM ni sidecars. No declara requisitos especiales de CPU o memoria: usa el perfil mínimo válido de Container Apps (Consumption) que la plantilla común ya ofrezca.
- `PROJECT_ID` y `DEMO_SLOT` pueden estar presentes, pero el demo no necesita leerlos para funcionar.
- El HTML ya carga `https://alexisalulema.com/demo-theme.css`, define `window.DEMO_INFO` en inglés y español, y carga `https://alexisalulema.com/demo-panel.js`.
- El dashboard contiene nueve ejecuciones de **datos ilustrativos**, identificadas claramente como tales; no presentarlas como resultados medidos.

## Importante sobre publicación de la imagen

La imagen se ha construido y probado localmente, pero **no está publicada en GHCR todavía**. El repositorio del demo incluye `.github/workflows/publish-image.yml`, que publica `latest` y una etiqueta con el SHA del commit al hacer push a `main` o a un tag `v*` (también admite ejecución manual).

Antes de activar el registro o aprovisionamiento:

1. Comprueba que `ghcr.io/alulema/harness-benchmark:latest` exista y se pueda descargar sin autenticación.
2. Si todavía no existe, deja clara esa dependencia y no supongas que el workflow ya se ejecutó: la imagen debe publicarse desde el repositorio del demo después de integrar sus cambios en `main` o ejecutar el workflow.
3. Comprueba que el paquete de GHCR tenga visibilidad **Public**, tal como exige el contrato de la infraestructura.
4. Para despliegues reproducibles, prefiere la etiqueta con SHA o un digest en lugar de `:latest`, si la plantilla lo permite.

No construyas una imagen alternativa dentro de `personal-website` ni cambies el nombre del repositorio/tag esperado sin coordinarlo con el repositorio del demo.

## Pasos de integración

1. Lee el contrato completo de demos y la configuración actual del sitio. Identifica el mecanismo canónico para registrar un demo efímero y úsalo; no inventes un formato o una ruta paralela.
2. Registra un demo con el nombre visible **Harness² Benchmark Analysis** y el slug/ID `harness-benchmark`, salvo que las convenciones actuales del sitio requieran una transformación distinta. Si ese identificador ya está ocupado, detente y documenta el conflicto en lugar de sobrescribirlo.
3. Configura la imagen `ghcr.io/alulema/harness-benchmark:latest`, el puerto de destino `8080` y la ruta raíz `/`, respetando los valores predeterminados y requisitos de health check que use el sitio.
4. No declares secretos: el dashboard es estático y no consume ninguno. Mantén la autenticación en el gateway; no añadas login, JWT ni TLS dentro del contenedor.
5. Añade la tarjeta/enlace o entrada de navegación que corresponda en `personal-website`, siguiendo la presentación existente de los demos y apuntando al slug asignado por la infraestructura.
6. Revisa y ejecuta las validaciones apropiadas del repositorio del sitio. Si la infraestructura requiere publicar la imagen antes de desplegar, señala ese bloqueo en el resultado y no simules un aprovisionamiento exitoso.

## Criterios de aceptación

- El demo está registrado siguiendo el patrón existente, con la imagen, puerto y raíz correctos.
- La entrada pública dirige al demo a través del gateway efímero (sin URL local ni prefijo de aplicación).
- No se agregaron autenticación, secretos ni persistencia innecesarios.
- El paquete de la imagen es público y la etiqueta configurada está disponible, o se documenta explícitamente como bloqueo pendiente.
- El dashboard muestra su aviso de datos ilustrativos.
- Las comprobaciones del sitio pasan y el handoff final indica los archivos cambiados y cualquier paso externo pendiente.

## Contrato autocontenido

El repositorio del demo incluye una copia completa en [`docs/DEMO_INTEGRATION.md`](docs/DEMO_INTEGRATION.md). Úsala como referencia si no tienes a mano la copia del contrato en `personal-website`.
