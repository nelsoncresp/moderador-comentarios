const DICCIONARIO_REGLAS = {
  amenazas: {
    frases: [
      "te voy a encontrar",
      "vas a ver lo que te pasa",
      "te voy a hacer dano",
      "i will find you",
      "you will see what happens"
    ]
  },
  insultos: {
    palabras: ["idiota", "ignorante", "ignorantes", "basura", "imbecil", "idiot", "ignorant"],
    contextoDirigido: [
      /\beres(?: un| una)?\s+(?:\w+\s+){0,2}(?:idiota|ignorante|basura|imbecil)\b/,
      /\b(?:son|somos) unos?\s+(?:\w+\s+){0,2}(?:ignorante|basura|imbecil)s?\b/,
      /\b(?:tu|usted|ustedes|ellos|ellas)\s+(?:\w+\s+){0,2}(?:idiota|ignorante|basura|imbecil)s?\b/,
      /\byou are an?\s+(?:idiot|ignorant)\b/,
      /\b(?:they|those who)\s+(?:\w+\s+){0,2}(?:are\s+)?(?:idiots?|ignorant)\b/
    ]
  },
  spam: {
    intencionesComerciales: [
      /\bgana(?:r)? dinero\b/,
      /\boferta(?:s)?\b/,
      /\bdescuento(?:s)?\b/,
      /\bcupon(?:es)?\b/,
      /\bcompra seguidores\b/,
      /\b(?:dinero|ganancias) desde casa\b/,
      /\b(?:make|earn) money from home\b/,
      /\bbuy cheap followers\b/
    ],
    llamadasAccion: [
      /\bentra(?:r)?\b/,
      /\bempieza hoy\b/,
      /\bescrib(?:e|eme|ir)\b/,
      /\bcompra\b/,
      /\baprovecha\b/,
      /\b(?:enter|start today|buy|contact me)\b/
    ],
    ventasWhatsapp: /compra seguidores.*whatsapp/,
    promocionesEnganosas: [
      /\bregalamos?\b.*\bequipos?\b/,
      /\b(?:gratis|gratuito)\b.*\b(?:premio|equipos?|dinero)\b/
    ]
  },
  dominios_sospechosos: [
    /(?:^|[\s(["'])https?:\/\/(?:[\w-]+\.)+xyz(?:[/?#:)\s]|$)/,
    /(?:^|[\s(["'])(?:[\w-]+\.)+xyz(?:[/?#:)\s]|$)/,
    /\bdinero-facil(?:\.|\/|\b)/,
    /\bofertas-hoy(?:\.|\/|\b)/
  ],
  consultas_estafa: [
    /\bsera verdad\b/,
    /\bes(?: una)? estafa\b/,
    /\bpodria ser una estafa\b/,
    /\bes confiable\b/,
    /\bes seguro\b/,
    /\bpuedo confiar\b/,
    /\bis it (?:a )?scam\b/,
    /\bcan i trust\b/,
    /\bis it safe\b/
  ],
  quejas: {
    sarcasmo: [
      /\bexcelente\b.*\b(?:rompe|fall[oa]|arruino)\b/,
      /\bgenial trabajo\b.*\b(?:rompe|fall[oa]|arruino)\b/,
      /\bgran actualizacion\b.*\b(?:rompe|fall[oa])\b/,
      /\b(?:otra|una mas)\s+actualizacion\b.*\brompe\b/
    ]
  },
  comentarios_prueba: [
    /\bcomentario de prueba\b/,
    /\bmensaje de prueba\b/,
    /\bpor favor ignorar(?:lo)?\b/,
    /\bno tener en cuenta este comentario\b/
  ],
  telefonos: {
    formatos: [
      /\b\d{3}[\s-]\d{3}[\s-]\d{4}\b/,
      /\b\d{3}[\s-]\d{3}[\s-]\d{3}\b/,
      /\+\d{1,3}[\s-]\d{3}[\s-]\d{3}[\s-]\d{4}\b/
    ],
    contextoPersonal: [
      /\bmi numero\b/,
      /\bllam(?:a|ame|enme)\b/,
      /\bcontact(?:ame|enme)\b/,
      /\bwhatsapp\b/,
      /\btelefono\b/
    ]
  },
  enlacesEducativos: [
    /(?:^|[\s/])youtube\.com(?:[/?#]|$)/,
    /(?:^|[\s/])youtu\.be(?:[/?#]|$)/
  ]
};

function normalizarTexto(texto) {
  return typeof texto === "string"
    ? texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
    : "";
}

function contieneAlgunaFrase(texto, patrones) {
  const listaPatrones = Array.isArray(patrones) ? patrones : [patrones];
  return listaPatrones.some((patron) =>
    typeof patron === "string" ? texto.includes(patron) : patron.test(texto)
  );
}

function contieneDominioSospechoso(texto) {
  return contieneAlgunaFrase(texto, DICCIONARIO_REGLAS.dominios_sospechosos);
}

function contieneInsultoDirigido(texto) {
  const contieneInsulto = DICCIONARIO_REGLAS.insultos.palabras
    .some((palabra) => new RegExp(`\\b${palabra}\\b`).test(texto));
  return contieneInsulto && contieneAlgunaFrase(texto, DICCIONARIO_REGLAS.insultos.contextoDirigido);
}

function contieneTelefonoPersonal(texto) {
  const contieneFormato = contieneAlgunaFrase(texto, DICCIONARIO_REGLAS.telefonos.formatos);
  const tieneContexto = contieneAlgunaFrase(texto, DICCIONARIO_REGLAS.telefonos.contextoPersonal);
  return contieneFormato && tieneContexto;
}

function esEntradaValida(comentario) {
  return comentario !== null && typeof comentario === "object" && !Array.isArray(comentario);
}

function resultado(categoria, prioridad, razon) {
  return { categoria, prioridad, razon };
}

function classifyComment(comment) {
  if (!esEntradaValida(comment)) {
    return resultado("revisar", "media", "Entrada inválida; requiere verificación manual.");
  }

  const text = normalizarTexto(comment.texto);
  const reports = Number.isFinite(comment.reportes) && comment.reportes >= 0
    ? comment.reportes
    : 0;
  const hasSuspiciousDomain = contieneDominioSospechoso(text);
  const hasScamQuery = contieneAlgunaFrase(text, DICCIONARIO_REGLAS.consultas_estafa);
  const hasCommercialIntent = contieneAlgunaFrase(text, DICCIONARIO_REGLAS.spam.intencionesComerciales);
  const hasCallToAction = contieneAlgunaFrase(text, DICCIONARIO_REGLAS.spam.llamadasAccion);

  if (text.length === 0) {
    return resultado("spam", "baja", "Comentario vacío sin contenido.");
  }

  if (contieneAlgunaFrase(text, DICCIONARIO_REGLAS.amenazas.frases)) {
    return resultado("revisar", "alta", "Posible amenaza directa; requiere intervención inmediata.");
  }

  if (hasSuspiciousDomain && hasScamQuery) {
    return resultado("revisar", "media", "Usuario consulta sobre legitimidad de un enlace externo.");
  }

  const isPromotional = (hasSuspiciousDomain && hasCommercialIntent) ||
    (hasCommercialIntent && hasCallToAction) ||
    contieneAlgunaFrase(text, DICCIONARIO_REGLAS.spam.ventasWhatsapp) ||
    contieneAlgunaFrase(text, DICCIONARIO_REGLAS.spam.promocionesEnganosas);

  if (isPromotional) {
    return resultado("spam", "baja", "Contenido promocional o enlace comercial no solicitado.");
  }

  if (hasSuspiciousDomain) {
    return resultado("revisar", "media", "Contiene un dominio sospechoso; requiere verificación manual.");
  }

  if (contieneInsultoDirigido(text)) {
    return resultado("revisar", "alta", "Posible lenguaje ofensivo o descalificación hacia otros usuarios.");
  }

  if (contieneTelefonoPersonal(text)) {
    return resultado("revisar", "media", "Contiene número telefónico personal; revisar por privacidad.");
  }

  if (contieneAlgunaFrase(text, DICCIONARIO_REGLAS.quejas.sarcasmo)) {
    return resultado("revisar", "media", "Posible queja sarcástica sobre actualización o funcionamiento.");
  }

  if (contieneAlgunaFrase(text, DICCIONARIO_REGLAS.comentarios_prueba)) {
    return resultado("revisar", "baja", "Comentario marcado como prueba por el autor.");
  }

  if (reports >= 2) {
    return resultado(
      "revisar",
      reports >= 4 ? "alta" : "media",
      "Múltiples reportes de la comunidad; requiere verificación manual."
    );
  }

  if (contieneAlgunaFrase(text, DICCIONARIO_REGLAS.enlacesEducativos)) {
    return resultado("ok", "baja", "Enlace a recurso técnico externo sin reportes.");
  }

  return resultado("ok", "baja", "Comentario válido dentro de las normas de la comunidad.");
}

export {
  DICCIONARIO_REGLAS,
  classifyComment,
  normalizarTexto
};
