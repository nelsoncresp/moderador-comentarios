# Moderador de comentarios

Aplicación local para ayudar a moderar comentarios de una comunidad de soporte técnico. Lee un archivo JSON, clasifica cada comentario como `ok`, `revisar` o `spam` y presenta la información en una interfaz web con resumen, filtros y detalle.

La clasificación se realiza con reglas locales. Esto permite ejecutar el proyecto sin conexión, sin cuentas y sin claves de servicios externos.

## Requisitos

- Node.js 18 o una versión superior.
- npm.

## Instalación

Desde la carpeta principal del proyecto, ejecuta:

```bash
npm install
```

La única dependencia de producción es Express.

## Ejecución

Inicia el servidor con:

```bash
npm start
```

Puedes usar cualquiera de estas dos opciones:

### Opción 1: servidor integrado

Después de ejecutar `npm start`, abre [http://localhost:3000](http://localhost:3000) en el navegador. Express sirve la interfaz y la API desde el mismo servidor.

### Opción 2: Live Server

Si utilizas la extensión **Live Server** de Visual Studio Code:

1. Ejecuta `npm start` para levantar la API de Express.
2. En Visual Studio Code, abre `frontend/index.html`.
3. Haz clic derecho sobre el archivo y selecciona **Open with Live Server**.
4. Abre la dirección que muestre Live Server, normalmente [http://127.0.0.1:5500/frontend/index.html](http://127.0.0.1:5500/frontend/index.html).

En este modo, Live Server sirve los archivos del frontend y Express atiende las solicitudes de la API en `http://127.0.0.1:3000`. Ambos procesos deben permanecer ejecutándose al mismo tiempo.

La aplicación carga los datos de [comentarios.json](./backend/data/comentarios.json) y muestra:

- Total de comentarios.
- Cantidad de comentarios por categoría.
- Prioridad de cada caso.
- Fecha, usuario, texto y número de reportes.
- Filtros por categoría y búsqueda.
- Gráfica de actividad agrupada por fecha.
- Formulario para guardar una decisión manual.
- Diseño responsivo para escritorio, tablet y móvil.

Si el puerto 3000 está ocupado, detén el proceso que lo está utilizando antes de iniciar la aplicación.

## Diseño responsivo

La interfaz se adapta a distintos tamaños de pantalla:

- En tablet, las tarjetas del resumen se reorganizan y los paneles principales pasan a una sola columna.
- En móvil, el aside se compacta a una barra lateral de iconos y el navbar ajusta su contenido.
- La tabla conserva todas sus columnas mediante desplazamiento horizontal para no ocultar información.
- Los encabezados, botones y filtros se reorganizan para facilitar su uso en pantallas estrechas.

## Categorías

- `ok`: comentario que puede publicarse según las reglas actuales.
- `revisar`: comentario que necesita criterio de un moderador.
- `spam`: publicidad, contenido basura o un comentario vacío.

La clasificación automática no reemplaza la decisión de un moderador. Es una ayuda para priorizar los casos que requieren atención.

## Cómo funciona la clasificación

Las reglas están centralizadas en `DICCIONARIO_REGLAS`, dentro de [rulesEngine.js](./backend/src/rulesEngine.js). El motor:

1. Valida la entrada.
2. Convierte el texto a minúsculas.
3. Elimina tildes y espacios innecesarios para comparar expresiones.
4. Diferencia palabras completas de coincidencias parciales.
5. Revisa el contexto antes de clasificar.
6. Prioriza amenazas, consultas sobre posibles estafas, publicidad, insultos dirigidos, datos personales y comentarios de prueba.
7. Usa el número de reportes como una señal adicional para enviar un comentario a revisión.

El diccionario incluye expresiones en español y algunos patrones en inglés para amenazas, insultos, publicidad y consultas sobre estafas. No es un traductor: reconoce únicamente las expresiones que estén contempladas en las reglas.

Las críticas negativas no se clasifican automáticamente como insultos. Por ejemplo, una queja contra un producto puede permanecer en `ok` si no está dirigida contra una persona.

## Decisiones manuales

Desde la tabla, el moderador puede abrir la acción de un comentario y seleccionar `ok`, `revisar` o `spam`. La decisión se guarda en el campo `decisionModerador` dentro del archivo JSON y se muestra como una clasificación confirmada por un moderador.

Esta persistencia está pensada para una aplicación local de prueba. En un sistema con varios moderadores sería preferible usar una base de datos y conservar un historial de cambios.

## API

### Obtener comentarios clasificados

```http
GET /api/comentarios
```

Devuelve un objeto con:

- `meta`: información del motor y momento de la consulta.
- `resumen`: total y cantidades por categoría.
- `comentarios`: comentarios originales junto con su clasificación.

### Guardar una clasificación manual

```http
PATCH /api/comentarios/:id/clasificacion
Content-Type: application/json
```

Ejemplo de cuerpo:

```json
{
  "categoria": "revisar"
}
```

Las categorías permitidas son `ok`, `revisar` y `spam`.

## Pruebas

Ejecuta:

```bash
npm test
```

Las pruebas usan `node:test` y cubren, entre otros casos:

- Comentarios vacíos.
- Amenazas e insultos dirigidos.
- Publicidad y dominios sospechosos.
- Consultas sobre posibles estafas.
- Preguntas técnicas en inglés.
- Críticas legítimas.
- Números telefónicos.
- Sarcasmo.
- Tildes, mayúsculas y espacios.
- Entradas inválidas.
- Las tres categorías y sus prioridades.

## Estructura del proyecto

```text
backend/
├── data/
│   └── comentarios.json
├── src/
│   ├── moderatorService.js
│   ├── rulesEngine.js
│   └── server.js
└── tests/
    └── rulesEngine.test.js
frontend/
├── app.js
├── index.html
└── styles.css
package.json
README.md
bitacora.md
```

## Limitaciones y mejoras posibles

La aplicación funciona con reglas locales. Por eso algunos casos, como el sarcasmo, los errores de escritura o las expresiones nuevas, pueden requerir revisión manual. Las pruebas con los comentarios originales pasan correctamente, aunque las variaciones adicionales pueden revelar falsos negativos en expresiones nuevas, especialmente en inglés o en consultas de estafa sin un dominio. El inglés tiene cobertura para expresiones concretas, pero no se traduce automáticamente.

Como mejora, separaría las decisiones automáticas de las manuales, guardaría un historial, mostraría las señales detectadas y ampliaría la cobertura de idiomas y pruebas sin convertir cualquier consulta en una alerta.
