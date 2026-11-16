SPEC.md — Sistema de Moderación de Comentarios (Motor de Reglas)

1. Propósito y Alcance

Aplicación web ligera en Node.js y HTML/CSS/JS puro para una comunidad de soporte técnico que lee data/comentarios.json, clasifica cada comentario en una de tres categorías (ok, spam, revisar) mediante un motor de reglas deterministas y heurísticas, calcula métricas por categoría y permite filtrar los resultados en una interfaz web.

Restricciones Técnicas

Backend: Node.js + Express (backend/src/server.js).

Frontend: HTML5, CSS3 y Vanilla JavaScript (frontend/). Sin React, Angular, Vue, Tailwind CDN ni bundlers.

Cero dependencias externas de IA: Todo el procesamiento es local, determinista y offline.

Estándar de Código: Sin comentarios en el código fuente y sin emojis en código, logs o UI.

2. Estructura de Directorios

moderador-comentarios/
├── backend/
│   ├── data/
│   │   └── comentarios.json
│   ├── src/
│   │   ├── rulesEngine.js
│   │   ├── moderatorService.js
│   │   └── server.js
│   └── tests/
│       └── rulesEngine.test.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .gitignore
├── package.json
├── SPEC.md
├── AGENTS.md
├── UI_SKILL.md
├── README.md
└── BITACORA.md


3. Contratos de Datos

3.1 Entrada (backend/data/comentarios.json)

[
  {
    "id": 1,
    "usuario": "laura_m",
    "fecha": "2026-11-02T08:14:00",
    "texto": "Actualicé el driver y el problema del ventilador se solucionó.",
    "reportes": 0
  }
]


3.2 Salida (GET /api/comentarios)

Debe retornar HTTP 200 con este esquema exacto:

{
  "meta": {
    "motorActivo": "reglas-locales",
    "timestamp": "2026-11-16T13:00:00.000Z"
  },
  "resumen": {
    "total": 20,
    "ok": 0,
    "revisar": 0,
    "spam": 0
  },
  "comentarios": [
    {
      "id": 1,
      "usuario": "laura_m",
      "fecha": "2026-11-02T08:14:00",
      "texto": "Actualicé el driver y el problema del ventilador se solucionó.",
      "reportes": 0,
      "categoria": "ok",
      "prioridad": "baja",
      "razon": "Aporte técnico válido sin reportes ni enlaces sospechosos."
    }
  ]
}


Valores permitidos para categoria: "ok", "revisar", "spam".

Valores permitidos para prioridad: "alta", "media", "baja".

4. Motor de Reglas de Clasificación (backend/src/rulesEngine.js)

Las reglas se evalúan en cascada estricta (la primera coincidencia determina la clasificación):

Texto vacío (spam):

Condición: !comentario.texto || comentario.texto.trim().length === 0

Salida: categoria: "spam", prioridad: "baja", razon: "Comentario vacío sin contenido."

Amenaza o intimidación directa (revisar):

Condición: /te voy a encontrar|vas a ver lo que te pasa/i

Salida: categoria: "revisar", prioridad: "alta", razon: "Posible amenaza directa; requiere intervención inmediata."

Cuenta oficial de moderación (ok):

Condición: comentario.usuario.startsWith("moderador_") && comentario.reportes === 0

Salida: categoria: "ok", prioridad: "baja", razon: "Mensaje oficial del equipo de moderación."

Publicidad y enlaces promocionales (spam):

Condición: Contiene dominios sospechosos (/(\.xyz|dinero-facil|ofertas-hoy)/i) combinados con intención comercial (/gana dinero|oferta|descuento|cup[oó]n|compra seguidores/i), o promoción explícita de ventas por WhatsApp (/compra seguidores.*whatsapp/i).

Salida: categoria: "spam", prioridad: "baja", razon: "Contenido promocional o enlace comercial no solicitado."

Consulta sobre posible estafa (revisar):

Condición: Menciona dominios sospechosos o estafas en tono de pregunta (/ser[aá] verdad|estafa/i).

Salida: categoria: "revisar", prioridad: "media", razon: "Usuario consulta sobre legitimidad de un enlace externo."

Lenguaje ofensivo o insultos (revisar):

Condición: /\b(idiota|ignorantes|basura)\b/i

Salida: categoria: "revisar", prioridad: "alta", razon: "Posible lenguaje ofensivo o descalificación hacia otros usuarios."

Exposición de datos personales (revisar):

Condición: Contiene números telefónicos (/(?:\+?\d{1,3}[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{4}/).

Salida: categoria: "revisar", prioridad: "media", razon: "Contiene número telefónico personal; revisar por privacidad."

Sarcasmo técnico (revisar):

Condición: /excelente.*rompe|genial trabajo.*rompe/i

Salida: categoria: "revisar", prioridad: "media", razon: "Posible queja sarcástica sobre actualización o funcionamiento."

Comentario de prueba (revisar):

Condición: /comentario de prueba|por favor ignorar/i

Salida: categoria: "revisar", prioridad: "baja", razon: "Comentario marcado como prueba por el autor."

Umbral de reportes acumulados (revisar):

Condición: comentario.reportes >= 2

Salida: categoria: "revisar", prioridad: comentario.reportes >= 4 ? "alta" : "media", razon: "Múltiples reportes de la comunidad; requiere verificación manual."

Enlace educativo o recurso externo (ok):

Condición: Contiene youtube.com o youtu.be y comentario.reportes === 0

Salida: categoria: "ok", prioridad: "baja", razon: "Enlace a recurso técnico externo sin reportes."

Regla por defecto (ok):

Condición: Supera todas las reglas anteriores.

Salida: categoria: "ok", prioridad: "baja", razon: "Comentario válido dentro de las normas de la comunidad."

5. Pruebas Unitarias (backend/tests/rulesEngine.test.js)

Ejecutable con npm test usando node:test y node:assert/strict:

T01: Texto vacío ("") -> categoria: "spam".

T02: Usuario moderador_ana con URL oficial y 0 reportes -> categoria: "ok".

T03: Amenaza directa -> categoria: "revisar", prioridad: "alta".

T04: Texto benigno con reportes: 6 -> categoria: "revisar", prioridad: "alta".

T05: Consulta sobre si un enlace .xyz es estafa -> categoria: "revisar".

T06: Publicidad con enlace .xyz -> categoria: "spam".

T07: Pregunta técnica en inglés con 0 reportes -> categoria: "ok".

T08: Número de teléfono pidiendo ayuda -> categoria: "revisar".

T09: Queja sarcástica sobre actualización -> categoria: "revisar".

6. Entregables Documentales

README.md: Instrucciones para instalar (npm install), ejecutar (npm start) y correr pruebas (npm test).

BITACORA.md: Máximo 1 página respondiendo:

¿Qué no sabías antes de empezar y cómo lo aprendiste?

¿Para qué usaste la IA? ¿En qué se equivocó o qué tuviste que corregir de lo que te propuso?

¿Qué comentarios te costó clasificar y qué decidiste?

¿Qué mejorarías si tuvieras una semana más?