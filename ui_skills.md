UI_SKILL.md — Especificación de Interfaz Editorial (Tema Claro)

1. Tokens CSS (frontend/styles.css)

:root {
  --bg-page: #F8FAFC;
  --bg-card: #FFFFFF;
  --bg-muted: #F1F5F9;
  --border-light: #E2E8F0;
  --border-medium: #CBD5E1;

  --text-main: #0F172A;
  --text-body: #334155;
  --text-muted: #64748B;

  --brand-primary: #0F172A;
  --brand-hover: #1E293B;

  --ok-bg: #DCFCE7;
  --ok-text: #166534;
  --ok-border: #BBF7D0;

  --revisar-bg: #FEF3C7;
  --revisar-text: #92400E;
  --revisar-border: #FDE68A;

  --spam-bg: #FEE2E2;
  --spam-text: #991B1B;
  --spam-border: #FECACA;

  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace;

  --radius-sm: 6px;
  --radius-md: 8px;
}


2. Reglas Visuales

Tema claro limpio sin gradientes ni sombras pesadas (box-shadow máximo: 0 1px 2px rgba(15, 23, 42, 0.04)).

Contenedor centrado: max-width: 1024px, margin: 0 auto, padding: 24px 20px.

Tipografía: --font-sans para títulos, textos y razones; --font-mono para #id, @usuario, fechas, reportes e indicador de motor.

3. Estructura HTML (frontend/index.html)

<header>: Título Consola de Moderación — Soporte Técnico a la izquierda; píldora #motor-badge (Motor: Reglas Locales) a la derecha.

<section class="kpi-grid">: Grid de 4 tarjetas clicables (Total, Revisar, Spam, OK) que filtran al hacer clic.

<section class="toolbar">: Botones de filtro (Todos, Revisar, Spam, OK) con conteo + checkbox Solo con reportes (> 0).

<main id="lista-comentarios">: Tarjetas .comment-card con borde izquierdo de 3px según categoría:

Cabecera: #ID, @usuario, fecha formateada y badge Reportes: N (resaltado si N > 0).

Cuerpo: Texto del comentario ([Comentario sin contenido] en cursiva si está vacío).

Pie: Badge de categoría + Criterio: + razon.

4. Lógica de Cliente (frontend/app.js)

Obtener datos vía fetch('/api/comentarios') al cargar el DOM.

Mantener estado local (datos, filtroCategoria, soloReportes) y re-renderizar al interactuar con filtros o tarjetas KPI.

Renderizar texto de usuario exclusivamente con textContent.

Mostrar estados de carga y error de conexión en pantalla.