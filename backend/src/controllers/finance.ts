import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { database } from "../config/database.js";
import { asyncHandler } from "./asyncHandler.js";
import { isIsoDate, isRecord, isString, positiveId } from "./validation.js";

type TransactionStatus = "Completado" | "Pendiente";
type TransactionMethod = "Tarjeta" | "Transferencia" | "Efectivo";
type TransactionRow = RowDataPacket & {
  id: number;
  client: string;
  concept: string;
  amount: number;
  method: TransactionMethod;
  date: string;
  status: TransactionStatus;
};

type TransactionInput = {
  client: string;
  concept: string;
  amount: number;
  method: TransactionMethod;
  date: string;
  status?: TransactionStatus;
};

function validTransaction(value: unknown): value is TransactionInput {
  if (!isRecord(value)) return false;
  return (
    isString(value.client, 1, 120) &&
    isString(value.concept, 1, 160) &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    (value.method === "Tarjeta" ||
      value.method === "Transferencia" ||
      value.method === "Efectivo") &&
    isIsoDate(value.date) &&
    (value.status === undefined ||
      value.status === "Completado" ||
      value.status === "Pendiente")
  );
}

export const listTransactions = asyncHandler(async (_request, response) => {
  const [transactions] = await database.query<TransactionRow[]>(
    `SELECT id, client, concept, amount, method, transaction_date AS date, status
     FROM transactions ORDER BY transaction_date DESC, created_at DESC`,
  );
  response.json({ data: transactions });
});

export const createTransaction = asyncHandler(async (request, response) => {
  if (!validTransaction(request.body)) {
    response.status(400).json({ error: "Los datos de la transacción no son válidos." });
    return;
  }
  const { client, concept, amount, method, date, status } = request.body;
  const [result] = await database.execute<ResultSetHeader>(
    `INSERT INTO transactions (client, concept, amount, method, transaction_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [client.trim(), concept.trim(), amount, method, date, status ?? "Completado"],
  );
  response.status(201).json({
    data: {
      id: result.insertId,
      client: client.trim(),
      concept: concept.trim(),
      amount,
      method,
      date,
      status: status ?? "Completado",
    },
  });
});

export const updateTransaction = asyncHandler(async (request, response) => {
  const id = positiveId(request.params.id);
  if (!id) {
    response.status(400).json({ error: "El identificador de la transacción no es válido." });
    return;
  }
  if (!isRecord(request.body)) {
    response.status(400).json({ error: "Los datos de la transacción no son válidos." });
    return;
  }
  const [rows] = await database.execute<TransactionRow[]>(
    `SELECT id, client, concept, amount, method, transaction_date AS date, status
     FROM transactions WHERE id = ? LIMIT 1`,
    [id],
  );
  const existing = rows[0];
  if (!existing) {
    response.status(404).json({ error: "No se encontró la transacción." });
    return;
  }
  const values = {
    client: request.body.client ?? existing.client,
    concept: request.body.concept ?? existing.concept,
    amount: request.body.amount ?? existing.amount,
    method: request.body.method ?? existing.method,
    date: request.body.date ?? existing.date,
    status: request.body.status ?? existing.status,
  };
  if (!validTransaction(values)) {
    response.status(400).json({ error: "Los datos de la transacción no son válidos." });
    return;
  }
  await database.execute(
    `UPDATE transactions SET client = ?, concept = ?, amount = ?, method = ?,
     transaction_date = ?, status = ? WHERE id = ?`,
    [
      values.client.trim(),
      values.concept.trim(),
      values.amount,
      values.method,
      values.date,
      values.status,
      id,
    ],
  );
  response.json({ data: { id, ...values } });
});

export const deleteTransaction = asyncHandler(async (request, response) => {
  const id = positiveId(request.params.id);
  if (!id) {
    response.status(400).json({ error: "El identificador de la transacción no es válido." });
    return;
  }
  const [result] = await database.execute<ResultSetHeader>(
    "DELETE FROM transactions WHERE id = ?",
    [id],
  );
  if (result.affectedRows === 0) {
    response.status(404).json({ error: "No se encontró la transacción." });
    return;
  }
  response.status(204).end();
});
