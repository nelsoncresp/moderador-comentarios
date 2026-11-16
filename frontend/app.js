const state = {
  datos: null,
  vista: "dashboard",
  filtroCategoria: "todos",
  soloReportes: false,
  filtroPrioridad: "todas",
  busqueda: "",
  pagina: 1,
  porPagina: 8,
  decisionIds: [],
  decisionTrigger: null,
  scrollY: 0
};

const API_URL = "http://127.0.0.1:3000/api/comentarios";

const elements = {
  dashboard: document.querySelector("#dashboard-view"),
  comments: document.querySelector("#comments-view"),
  navLinks: document.querySelectorAll("[data-view]"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector("#theme-label"),
  estado: document.querySelector("#estado"),
  lista: document.querySelector("#lista-comentarios"),
  modal: document.querySelector("#decision-modal"),
  decisionForm: document.querySelector("#decision-form"),
  saveDecision: document.querySelector("#save-decision"),
  closeModal: document.querySelector("#close-modal"),
  cancelModal: document.querySelector("#cancel-modal"),
  decisionDescription: document.querySelector("#decision-description"),
  paginationStatus: document.querySelector("#pagination-status"),
  pageStatus: document.querySelector("#page-status"),
  previousPage: document.querySelector("#previous-page"),
  nextPage: document.querySelector("#next-page"),
  search: document.querySelector("#comment-search"),
  priorityFilter: document.querySelector("#priority-filter"),
  reportsFilter: document.querySelector("#solo-reportes"),
  filtros: document.querySelectorAll("[data-filter]"),
  kpis: {
    total: document.querySelector("#kpi-total"),
    revisar: document.querySelector("#kpi-revisar"),
    spam: document.querySelector("#kpi-spam"),
    ok: document.querySelector("#kpi-ok")
  },
  conteos: {
    todos: document.querySelector("[data-count='todos']"),
    revisar: document.querySelector("[data-count='revisar']"),
    spam: document.querySelector("[data-count='spam']"),
    ok: document.querySelector("[data-count='ok']")
  }
};

function formatCommentDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function setStatus(message, isError = false) {
  elements.estado.textContent = message;
  elements.estado.classList.toggle("is-error", isError);
}

function setSavingState(isSaving) {
  elements.estado.classList.toggle("is-saving", isSaving);
  elements.saveDecision.classList.toggle("is-saving", isSaving);
}

function setView(view) {
  state.vista = view;
  persistViewState();
  elements.dashboard.classList.toggle("is-hidden", view !== "dashboard");
  elements.comments.classList.toggle("is-hidden", view !== "comments");
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === view);
  });
  if (view === "comments") renderComments();
}

function persistViewState() {
  sessionStorage.setItem("moderation-view-state", JSON.stringify({
    vista: state.vista,
    filtroCategoria: state.filtroCategoria,
    soloReportes: state.soloReportes,
    filtroPrioridad: state.filtroPrioridad,
    busqueda: state.busqueda,
    pagina: state.pagina,
    scrollY: window.scrollY
  }));
}

function restoreViewState() {
  const savedState = sessionStorage.getItem("moderation-view-state");
  if (!savedState) return;
  try {
    const restored = JSON.parse(savedState);
    if (["dashboard", "comments"].includes(restored.vista)) state.vista = restored.vista;
    if (["todos", "revisar", "spam", "ok"].includes(restored.filtroCategoria)) state.filtroCategoria = restored.filtroCategoria;
    if (typeof restored.soloReportes === "boolean") state.soloReportes = restored.soloReportes;
    if (["todas", "alta", "media", "baja"].includes(restored.filtroPrioridad)) state.filtroPrioridad = restored.filtroPrioridad;
    if (typeof restored.busqueda === "string") state.busqueda = restored.busqueda;
    if (Number.isInteger(restored.pagina) && restored.pagina > 0) state.pagina = restored.pagina;
    if (Number.isFinite(restored.scrollY) && restored.scrollY >= 0) state.scrollY = restored.scrollY;
  } catch (error) {
    sessionStorage.removeItem("moderation-view-state");
  }
}

function updateSummary() {
  const summary = getSummary();
  elements.kpis.total.textContent = summary.total;
  elements.kpis.revisar.textContent = summary.revisar;
  elements.kpis.spam.textContent = summary.spam;
  elements.kpis.ok.textContent = summary.ok;
  elements.conteos.todos.textContent = summary.total;
  elements.conteos.revisar.textContent = summary.revisar;
  elements.conteos.spam.textContent = summary.spam;
  elements.conteos.ok.textContent = summary.ok;
  document.querySelector("#guidance-count").textContent = summary.revisar;
  renderActivityChart();
  const latestDate = state.datos.comentarios
    .map((comment) => new Date(comment.fecha))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a)[0];
  const validDates = state.datos.comentarios
    .map((comment) => new Date(comment.fecha))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);
  document.querySelector("#summary-updated").textContent = latestDate
    ? `Ultima actividad registrada: ${formatCommentDate(latestDate)}`
    : "Ultima actividad: fecha no disponible";
  document.querySelector("#summary-period").textContent = validDates.length
    ? `Periodo cubierto: ${formatCommentDate(validDates[0])} - ${formatCommentDate(validDates[validDates.length - 1])}`
    : "Periodo de datos: fecha no disponible";
}

function renderActivityChart() {
  const grouped = state.datos.comentarios.reduce((days, comment) => {
    const date = new Date(comment.fecha);
    if (Number.isNaN(date.getTime())) return days;
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
    days[key] = (days[key] || 0) + 1;
    return days;
  }, {});
  const entries = Object.entries(grouped).sort(([first], [second]) => first.localeCompare(second));
  const max = Math.max(...entries.map(([, count]) => count), 1);
  const chart = document.querySelector("#activity-chart");
  chart.replaceChildren();
  entries.forEach(([dateKey, count]) => {
    const date = new Date(`${dateKey}T12:00:00`);
    const column = document.createElement("div");
    column.className = "activity-column";
    const value = createTextElement("strong", "activity-value", `${count}`);
    const bar = document.createElement("span");
    bar.className = "activity-bar";
    bar.style.height = `${Math.max(14, count / max * 100)}%`;
    const label = createTextElement("small", "activity-label", new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short"
    }).format(date));
    column.append(value, bar, label);
    chart.append(column);
  });
  document.querySelector("#activity-total").textContent = `${state.datos.comentarios.length} comentarios`;
}

function getCategory(comment) {
  return String(comment.categoria).toLocaleLowerCase();
}

function getSummary() {
  return state.datos.comentarios.reduce((summary, comment) => {
    const category = getCategory(comment);
    summary.total += 1;
    summary[category] += 1;
    return summary;
  }, { total: 0, revisar: 0, spam: 0, ok: 0 });
}

function getFilteredComments() {
  const query = state.busqueda.trim().toLocaleLowerCase();
  return state.datos.comentarios.filter((comment) => {
    const matchesCategory = state.filtroCategoria === "todos" || getCategory(comment) === state.filtroCategoria;
    const matchesPriority = state.filtroPrioridad === "todas" || String(comment.prioridad).toLocaleLowerCase() === state.filtroPrioridad;
    const matchesReports = !state.soloReportes || Number(comment.reportes) > 0;
    const searchable = `${comment.usuario} ${comment.texto} ${comment.razon}`.toLocaleLowerCase();
    return matchesCategory && matchesPriority && matchesReports && (!query || searchable.includes(query));
  });
}

function updateActiveFilters() {
  elements.filtros.forEach((button) => {
    if (button.dataset.filter) button.classList.toggle("is-active", button.dataset.filter === state.filtroCategoria);
  });
}

function createCommentRow(comment) {
  const category = getCategory(comment);
  const categoryClass = `category-${category}`;
  const row = document.createElement("tr");
  row.dataset.commentId = comment.id;
  const content = document.createElement("td");
  content.append(createTextElement("strong", "author-name", `@${comment.usuario}`), createTextElement("small", "author-id", `Comentario #${comment.id}`), createTextElement("small", "author-date", formatCommentDate(comment.fecha)), createTextElement("p", "table-comment", comment.texto || "[Comentario sin contenido]"));
  const date = createTextElement("td", "comment-date-cell", formatCommentDate(comment.fecha));
  const reason = createTextElement("td", "reason-cell", comment.razon);
  const reports = createTextElement("td", comment.reportes > 0 ? "report-count has-reports" : "report-count", `${comment.reportes}`);
  const categoryCell = document.createElement("td");
  categoryCell.append(createTextElement("span", `category-badge ${categoryClass}`, category));
  const actions = document.createElement("td");
  actions.className = "row-actions";
  const button = createTextElement("button", "classify-button", "Decidir");
  button.type = "button";
  button.addEventListener("click", () => {
    state.decisionTrigger = button;
    openDecisionModal([comment.id]);
  });
  actions.append(button);
  row.append(content, date, reason, reports, categoryCell, actions);
  return row;
}

function patchRowInPlace(comment) {
  const existing = elements.lista.querySelector(`tr[data-comment-id="${comment.id}"]`);
  if (!existing) return null;
  const fresh = createCommentRow(comment);
  existing.replaceWith(fresh);
  return fresh;
}

function renderComments() {
  if (!state.datos) return;
  const filtered = getFilteredComments();
  const pages = Math.max(1, Math.ceil(filtered.length / state.porPagina));
  state.pagina = Math.min(state.pagina, pages);
  const start = (state.pagina - 1) * state.porPagina;
  const visible = filtered.slice(start, start + state.porPagina);
  persistViewState();
  elements.lista.replaceChildren();
  if (!visible.length) {
    const row = document.createElement("tr");
    const cell = createTextElement("td", "empty-table", "No hay comentarios que coincidan con los filtros.");
    cell.colSpan = 6;
    row.append(cell);
    elements.lista.append(row);
  } else {
    const fragment = document.createDocumentFragment();
    visible.forEach((comment) => fragment.append(createCommentRow(comment)));
    elements.lista.append(fragment);
  }
  elements.paginationStatus.textContent = `${filtered.length} comentarios mostrados`;
  elements.pageStatus.textContent = `${state.pagina} / ${pages}`;
  elements.previousPage.disabled = state.pagina === 1;
  elements.nextPage.disabled = state.pagina === pages;
}

function openDecisionModal(ids) {
  state.decisionIds = ids;
  elements.decisionDescription.textContent = ids.length === 1
    ? "Elige el resultado que debe conservar este comentario."
    : `Elige el resultado para los ${ids.length} comentarios seleccionados.`;
  elements.decisionForm.querySelectorAll("input[name='decision']").forEach((input) => {
    const comment = state.datos.comentarios.find((item) => String(item.id) === String(ids[0]));
    input.checked = comment && getCategory(comment) === input.value;
  });
  elements.modal.classList.add("is-open");
  elements.modal.setAttribute("aria-hidden", "false");
}

function closeDecisionModal() {
  elements.modal.classList.remove("is-open");
  elements.modal.setAttribute("aria-hidden", "true");
  if (state.decisionTrigger) {
    state.decisionTrigger.focus({ preventScroll: true });
    state.decisionTrigger = null;
  }
}

function bindEvents() {
  elements.navLinks.forEach((link) => link.addEventListener("click", () => setView(link.dataset.view)));
  window.addEventListener("scroll", persistViewState, { passive: true });
  elements.themeToggle.addEventListener("click", () => {
    const light = document.documentElement.classList.toggle("light-theme");
    localStorage.setItem("moderation-theme", light ? "light" : "dark");
    elements.themeLabel.textContent = light ? "Modo oscuro" : "Modo claro";
  });
  elements.filtros.forEach((button) => button.addEventListener("click", () => {
    state.filtroCategoria = button.dataset.filter;
    state.pagina = 1;
    persistViewState();
    updateActiveFilters();
    renderComments();
  }));
  elements.search.addEventListener("input", (event) => {
    state.busqueda = event.target.value;
    state.pagina = 1;
    persistViewState();
    renderComments();
  });
  elements.priorityFilter.addEventListener("change", (event) => {
    state.filtroPrioridad = event.target.value;
    state.pagina = 1;
    persistViewState();
    renderComments();
  });
  elements.reportsFilter.addEventListener("change", (event) => {
    state.soloReportes = event.target.checked;
    state.pagina = 1;
    persistViewState();
    renderComments();
  });
  elements.previousPage.addEventListener("click", () => {
    if (state.pagina > 1) {
      state.pagina -= 1;
      persistViewState();
      renderComments();
    }
  });
  elements.nextPage.addEventListener("click", () => {
    const pages = Math.max(1, Math.ceil(getFilteredComments().length / state.porPagina));
    if (state.pagina < pages) {
      state.pagina += 1;
      persistViewState();
      renderComments();
    }
  });
  elements.closeModal.addEventListener("click", closeDecisionModal);
  elements.cancelModal.addEventListener("click", closeDecisionModal);
  elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) closeDecisionModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.modal.classList.contains("is-open")) closeDecisionModal();
  });
  elements.saveDecision.addEventListener("click", async (event) => {
    event.preventDefault();
    const selected = elements.decisionForm.querySelector("input[name='decision']:checked");
    if (!selected) return;
    const savedScrollY = window.scrollY;
    elements.saveDecision.disabled = true;
    setSavingState(true);
    setStatus("Guardando decision...");
    try {
      let updatedData = state.datos;
      for (const id of state.decisionIds) {
        const response = await fetch(`${API_URL}/${id}/clasificacion`, {
          method: "PATCH",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ categoria: selected.value })
        });
        if (!response.ok) {
          let details = `El servidor respondio con HTTP ${response.status}.`;
          try {
            const errorBody = await response.json();
            if (errorBody.error) details = errorBody.error;
          } catch (parseError) {
            console.error("No fue posible leer el error del servidor:", parseError);
          }
          throw new Error(details);
        }
        updatedData = await response.json();
      }
      state.datos = updatedData;
      state.scrollY = savedScrollY;
      persistViewState();
      state.decisionTrigger = null;
      elements.modal.classList.remove("is-open");
      elements.modal.setAttribute("aria-hidden", "true");
      updateSummary();
      updateActiveFilters();
      let lastNewRow = null;
      for (const id of state.decisionIds) {
        const updated = state.datos.comentarios.find((c) => c.id === id);
        if (updated) lastNewRow = patchRowInPlace(updated);
      }
      if (lastNewRow) {
        const newBtn = lastNewRow.querySelector(".classify-button");
        if (newBtn) newBtn.focus({ preventScroll: true });
      }
      window.scrollTo(0, savedScrollY);
      setStatus("Decision guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar la decision:", error);
      setStatus(`No fue posible guardar la decision: ${error.message}`, true);
    } finally {
      setSavingState(false);
      elements.saveDecision.disabled = false;
    }
  });
}

async function loadComments() {
  setStatus("Cargando comentarios...");
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("La respuesta del servidor no fue valida.");
    state.datos = await response.json();
    updateSummary();
    updateActiveFilters();
    elements.search.value = state.busqueda;
    elements.priorityFilter.value = state.filtroPrioridad;
    elements.reportsFilter.checked = state.soloReportes;
    renderComments();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, state.scrollY));
    });
    setStatus(`${state.datos.comentarios.length} comentarios cargados.`);
  } catch (error) {
    console.error("Error al cargar comentarios:", error);
    setStatus("No fue posible conectar con el servicio de moderacion.", true);
  }
}

if (localStorage.getItem("moderation-theme") === "light") {
  elements.themeLabel.textContent = "Modo oscuro";
}
restoreViewState();
bindEvents();
setView(state.vista);
loadComments();
