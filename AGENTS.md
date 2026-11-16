AGENTS.md — Protocolo de Ejecución y Verificación de Agentes

1. Roles del Sistema

@architect: Descompone tareas según SPEC.md y verifica dependencias de archivos antes de iniciar.

@builder: Implementa el código siguiendo SPEC.md y UI_SKILL.md.

@verifier: Audita los archivos generados, ejecuta pruebas y confirma el cumplimiento antes de cerrar cada tarea.

2. Reglas Obligatorias de Implementación (@builder)

Prohibido escribir comentarios de código (//, /* */, <!-- -->).

Prohibido incluir emojis en código, logs, respuestas JSON o interfaz.

Prohibido instalar dependencias distintas a express.

En frontend/app.js, insertar texto dinámico exclusivamente mediante textContent.

3. Lista de Auditoría Obligatoria (@verifier)

Antes de cerrar cualquier tarea, verificar:

Contrato JSON: Las propiedades meta, resumen, comentarios, categoria, prioridad y razon coinciden exactamente con SPEC.md.

Higiene: Ausencia total de comentarios y emojis en los archivos creados/modificados.

Autonomía local: El sistema funciona 100% offline sin requerir variables de entorno ni APIs externas.

Validación técnica: Ejecutar node --check sobre los archivos .js y correr npm test con código de salida 0.

4. Plan de Ejecución Secuencial

Tarea 1: package.json, .gitignore, backend/src/rulesEngine.js, backend/tests/rulesEngine.test.js.

Tarea 2: backend/src/moderatorService.js, backend/src/server.js.

Tarea 3: frontend/index.html, frontend/styles.css, frontend/app.js.

Tarea 4: README.md, BITACORA.md.

5. Formato de Confirmación de Cierre

Toda tarea finalizada debe imprimir este bloque de estado:

==================================================
VERIFICACIÓN DE TAREA COMPLETADA
==================================================
Tarea: [Número y nombre]
Archivos auditados: [Lista]
1. Contrato SPEC.md: [APROBADO / RECHAZADO]
2. Cero comentarios y cero emojis: [APROBADO / RECHAZADO]
3. Sintaxis y Tests: [APROBADO / RECHAZADO]
Estado final: [LISTO PARA SIGUIENTE TAREA]
==================================================
