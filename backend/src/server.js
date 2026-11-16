import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { moderateComments, updateCommentClassification } from "./moderatorService.js";

const app = express();
const port = process.env.PORT || 3000;
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

app.use((request, response, next) => {
  const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ];
  const requestOrigin = request.headers.origin;

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    response.setHeader("Access-Control-Allow-Origin", requestOrigin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
});

app.use(express.static(path.join(currentDirectory, "..", "..", "frontend")));
app.use(express.json());

app.get("/api/comentarios", async (request, response, next) => {
  try {
    const result = await moderateComments();
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/comentarios/:id/clasificacion", async (request, response, next) => {
  try {
    const result = await updateCommentClassification(request.params.id, request.body?.categoria);
    if (!result) {
      response.status(404).json({ error: "Comentario no encontrado." });
      return;
    }
    response.status(200).json(result);
  } catch (error) {
    if (error instanceof TypeError) {
      response.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  response.status(500).json({
    error: "No fue posible cargar los comentarios."
  });
});

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  app.listen(port, () => {
    process.stdout.write(`Servidor iniciado en http://localhost:${port}\n`);
  });
}

export default app;
