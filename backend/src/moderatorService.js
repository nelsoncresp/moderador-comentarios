import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyComment } from "./rulesEngine.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const commentsPath = path.join(currentDirectory, "..", "data", "comentarios.json");

async function loadComments() {
  const fileContent = await fs.readFile(commentsPath, "utf8");
  const comments = JSON.parse(fileContent);

  if (!Array.isArray(comments)) {
    throw new TypeError("El archivo de comentarios debe contener un arreglo.");
  }

  return comments;
}

async function moderateComments() {
  const comments = await loadComments();
  const classifiedComments = comments.map((comment) => ({
    ...comment,
    ...getClassification(comment)
  }));
  const resumen = classifiedComments.reduce(
    (summary, comment) => {
      summary.total += 1;
      summary[comment.categoria] += 1;
      return summary;
    },
    { total: 0, ok: 0, revisar: 0, spam: 0 }
  );

  return {
    meta: {
      motorActivo: "reglas-locales",
      timestamp: new Date().toISOString()
    },
    resumen,
    comentarios: classifiedComments
  };
}

function getClassification(comment) {
  const automaticClassification = classifyComment(comment);
  if (!["ok", "revisar", "spam"].includes(comment.decisionModerador)) {
    return automaticClassification;
  }

  return {
    ...automaticClassification,
    categoria: comment.decisionModerador,
    razon: "Clasificación confirmada por un moderador."
  };
}

async function updateCommentClassification(id, categoria) {
  if (!["ok", "revisar", "spam"].includes(categoria)) {
    throw new TypeError("La categoría debe ser ok, revisar o spam.");
  }

  const comments = await loadComments();
  const comment = comments.find((item) => String(item.id) === String(id));
  if (!comment) {
    return null;
  }

  comment.decisionModerador = categoria;
  await fs.writeFile(commentsPath, `${JSON.stringify(comments, null, 2)}\n`, "utf8");
  return moderateComments();
}

export {
  loadComments,
  moderateComments,
  updateCommentClassification
};
