import test from "node:test";
import assert from "node:assert/strict";
import { classifyComment, DICCIONARIO_REGLAS, normalizarTexto } from "../src/rulesEngine.js";

test("T01: clasifica texto vacío como spam", () => {
  assert.equal(classifyComment({ texto: "" }).categoria, "spam");
});

test("T02: mantiene un comentario de moderador limpio como ok sin privilegios especiales", () => {
  const result = classifyComment({
    usuario: "moderador_ana",
    texto: "Consulta la URL oficial de soporte.",
    reportes: 0
  });

  assert.equal(result.categoria, "ok");
  assert.equal(result.razon, "Comentario válido dentro de las normas de la comunidad.");
});

test("T03: detecta amenazas directas con prioridad alta", () => {
  for (const texto of ["Te voy a encontrar.", "VAS A VER LO QUE TE PASA"]) {
    const result = classifyComment({ texto });
    assert.equal(result.categoria, "revisar");
    assert.equal(result.prioridad, "alta");
  }
});

test("T04: usa seis reportes como indicador de revisión prioritaria, no como spam", () => {
  const result = classifyComment({
    texto: "La solución funcionó correctamente.",
    reportes: 6
  });

  assert.equal(result.categoria, "revisar");
  assert.equal(result.prioridad, "alta");
});

test("T05: separa una consulta sobre estafa de la publicidad", () => {
  const result = classifyComment({
    texto: "¿Será verdad este enlace dinero-facil.xyz o es estafa?"
  });

  assert.equal(result.categoria, "revisar");
  assert.equal(result.prioridad, "media");
});

test("T06: clasifica publicidad con dominio sospechoso como spam", () => {
  const result = classifyComment({
    texto: "Gana dinero con esta oferta en dinero-facil.xyz."
  });

  assert.equal(result.categoria, "spam");
});

test("T07: clasifica una pregunta técnica en inglés como ok", () => {
  assert.equal(classifyComment({
    texto: "Does anyone know how to reset the BIOS password?"
  }).categoria, "ok");
});

test("T07b: detecta señales de riesgo en inglés sin marcar una pregunta técnica", () => {
  assert.equal(classifyComment({
    texto: "You are an idiot."
  }).categoria, "revisar");
  assert.equal(classifyComment({
    texto: "Make money from home, enter today at dinero-facil.xyz"
  }).categoria, "spam");
  assert.equal(classifyComment({
    texto: "Is it a scam? Can I trust dinero-facil.xyz?"
  }).categoria, "revisar");
});

test("T08: detecta un teléfono cuando existe contexto personal", () => {
  const result = classifyComment({
    texto: "Mi número es 310 555 1234, llámenme que tengo el mismo problema."
  });

  assert.equal(result.categoria, "revisar");
  assert.equal(result.prioridad, "media");
});

test("T09: detecta sarcasmo técnico contextual", () => {
  assert.equal(classifyComment({
    texto: "Excelente, otra actualización que rompe todo."
  }).categoria, "revisar");
});

test("T10: conserva como ok una crítica legítima a un producto", () => {
  assert.equal(classifyComment({
    texto: "Este producto es una basura, llevo semanas esperando el reembolso."
  }).categoria, "ok");
});

test("T11: detecta insultos dirigidos a personas o grupos", () => {
  assert.equal(classifyComment({ texto: "Eres un idiota." }).categoria, "revisar");
  assert.equal(classifyComment({
    texto: "Los que compran esta marca son unos ignorantes."
  }).categoria, "revisar");
});

test("T12: reconoce dominios xyz con HTTPS, subdominio, ruta y parámetros", () => {
  const textos = [
    "https://sitio.xyz",
    "https://sub.sitio.xyz/ruta",
    "https://sub.sitio.xyz/ruta?codigo=1"
  ];

  for (const texto of textos) {
    assert.equal(classifyComment({
      texto: `${texto} es una estafa, ¿puedo confiar?`
    }).categoria, "revisar");
  }
});

test("T13: no confunde una coincidencia parcial con un insulto", () => {
  assert.equal(classifyComment({
    texto: "El término idiotario aparece en la documentación."
  }).categoria, "ok");
});

test("T14: detecta venta promocional por WhatsApp", () => {
  assert.equal(classifyComment({
    texto: "Compra seguidores baratos y escríbeme al WhatsApp."
  }).categoria, "spam");
});

test("T15: una queja normal no se clasifica como sarcasmo", () => {
  assert.equal(classifyComment({
    texto: "La actualización es más lenta y necesito una solución."
  }).categoria, "ok");
});

test("T16: evita falsos positivos en comentarios de prueba", () => {
  assert.equal(classifyComment({
    texto: "Ignorar los mensajes antiguos de este hilo."
  }).categoria, "ok");
  assert.equal(classifyComment({
    texto: "Comentario de prueba, por favor ignorar."
  }).categoria, "revisar");
});

test("T17: distingue cantidades de reportes", () => {
  assert.equal(classifyComment({ texto: "Aporte útil.", reportes: 0 }).categoria, "ok");
  assert.equal(classifyComment({ texto: "Aporte útil.", reportes: 1 }).categoria, "ok");
  assert.equal(classifyComment({ texto: "Aporte útil.", reportes: 2 }).prioridad, "media");
  assert.equal(classifyComment({ texto: "Aporte útil.", reportes: 4 }).prioridad, "alta");
});

test("T18: maneja entradas inválidas y conserva el contrato", () => {
  for (const input of [null, undefined, [], "texto"]) {
    const result = classifyComment(input);
    assert.deepEqual(Object.keys(result), ["categoria", "prioridad", "razon"]);
    assert.equal(result.categoria, "revisar");
  }
});

test("T19: normaliza tildes, mayúsculas y espacios", () => {
  assert.equal(normalizarTexto("  ¿SERÁ  VERDAD?  "), "¿sera verdad?");
  assert.equal(classifyComment({
    texto: "¿SERÁ VERDAD este enlace https://sitio.xyz?"
  }).categoria, "revisar");
});

test("T20: reconoce enlaces educativos sin convertirlos en spam", () => {
  const result = classifyComment({
    texto: "El tutorial está en https://www.youtube.com/watch?v=ejemplo."
  });

  assert.equal(result.categoria, "ok");
  assert.equal(result.prioridad, "baja");
});

test("T21: el prefijo de moderador no anula una amenaza", () => {
  assert.equal(classifyComment({
    usuario: "moderador_ana",
    texto: "Te voy a encontrar.",
    reportes: 0
  }).categoria, "revisar");
});

test("T22: expone un diccionario ampliable por categorías", () => {
  for (const categoria of [
    "amenazas",
    "insultos",
    "spam",
    "dominios_sospechosos",
    "consultas_estafa",
    "quejas",
    "comentarios_prueba"
  ]) {
    assert.ok(DICCIONARIO_REGLAS[categoria]);
  }
});
