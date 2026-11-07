import "./environment.js";
import mysql, { type Pool } from "mysql2/promise";

export const database: Pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? process.env.DB_USER ?? "root",
  password: process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? "",
  database:
    process.env.MYSQL_DATABASE ??
    process.env.DB_NAME ??
    "appgestion_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true,
});

export async function connectToDatabase(): Promise<void> {
  await database.query("SELECT 1");
  console.log("Conexión a MySQL establecida.");
}
