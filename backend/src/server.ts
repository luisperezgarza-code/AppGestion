import "dotenv/config";
import app from "./app.js";
import { connectToDatabase } from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un puerto válido.");
}
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("Falta configurar JWT_SECRET con al menos 32 caracteres.");
}

try {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`API AppGestion escuchando en http://localhost:${port}`);
  });
} catch (error) {
  console.error("No se pudo iniciar la API.", error);
  process.exitCode = 1;
}
