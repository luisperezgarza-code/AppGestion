import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import classesRouter from "./routes/classes.js";
import financeRouter from "./routes/finance.js";
import authRouter from "./routes/auth.js";
import healthRouter from "./routes/health.js";
import membersRouter from "./routes/members.js";
import staffRouter from "./routes/staff.js";
import usersRouter from "./routes/users.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "3mb" }));
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/members", membersRouter);
app.use("/api/finance", financeRouter);
app.use("/api/staff", staffRouter);
app.use("/api/classes", classesRouter);

app.use((_request, response) => {
  response.status(404).json({ error: "No se encontró el recurso solicitado." });
});

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  ) {
    response.status(409).json({ error: "Ya existe un registro con esos datos." });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "El cuerpo JSON de la solicitud no es válido." });
    return;
  }

  console.error("Error al procesar la solicitud de la API.", error);
  response.status(500).json({ error: "Ocurrió un error interno en la API." });
};

app.use(errorHandler);

export default app;
