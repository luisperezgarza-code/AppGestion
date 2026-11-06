import "dotenv/config";
import app from "./app.js";
import { connectToDatabase } from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("Falta configurar la variable de entorno MONGODB_URI.");
}

try {
  await connectToDatabase(mongoUri);
  app.listen(port, () => {
    console.log(`API AppGestion escuchando en http://localhost:${port}`);
  });
} catch (error) {
  console.error("No se pudo iniciar la API.", error);
  process.exitCode = 1;
}
