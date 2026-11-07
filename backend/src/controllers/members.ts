import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { database } from "../config/database.js";
import { asyncHandler } from "./asyncHandler.js";
import { isIsoDate, isRecord, isString, positiveId } from "./validation.js";

type MemberStatus = "Activo" | "Inactivo" | "Pendiente de Pago";
type MemberRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  expiryDate: string;
  status: MemberStatus;
};

type MemberInput = {
  name: string;
  email: string;
  phone: string;
  plan: string;
  expiryDate: string;
  status?: MemberStatus;
};

function validMember(value: unknown): value is MemberInput {
  if (!isRecord(value)) return false;
  return (
    isString(value.name, 2, 120) &&
    isString(value.email, 3, 254) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) &&
    isString(value.phone, 1, 40) &&
    isString(value.plan, 1, 80) &&
    isIsoDate(value.expiryDate) &&
    (value.status === undefined ||
      value.status === "Activo" ||
      value.status === "Inactivo" ||
      value.status === "Pendiente de Pago")
  );
}

export const listMembers = asyncHandler(async (_request, response) => {
  const [members] = await database.query<MemberRow[]>(
    `SELECT id, name, email, phone, plan, expiry_date AS expiryDate, status
     FROM members ORDER BY created_at DESC`,
  );
  response.json({ data: members });
});

export const createMember = asyncHandler(async (request, response) => {
  if (!validMember(request.body)) {
    response.status(400).json({ error: "Los datos del miembro no son válidos." });
    return;
  }
  const { name, email, phone, plan, expiryDate, status } = request.body;
  const [result] = await database.execute<ResultSetHeader>(
    `INSERT INTO members (name, email, phone, plan, expiry_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      plan.trim(),
      expiryDate,
      status ?? "Activo",
    ],
  );
  response.status(201).json({
    data: {
      id: result.insertId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      plan: plan.trim(),
      expiryDate,
      status: status ?? "Activo",
    },
  });
});

export const updateMember = asyncHandler(async (request, response) => {
  const id = positiveId(request.params.id);
  if (!id) {
    response.status(400).json({ error: "El identificador del miembro no es válido." });
    return;
  }
  if (!isRecord(request.body)) {
    response.status(400).json({ error: "Los datos del miembro no son válidos." });
    return;
  }
  const [existingRows] = await database.execute<MemberRow[]>(
    `SELECT id, name, email, phone, plan, expiry_date AS expiryDate, status
     FROM members WHERE id = ? LIMIT 1`,
    [id],
  );
  const existing = existingRows[0];
  if (!existing) {
    response.status(404).json({ error: "No se encontró el miembro." });
    return;
  }

  const values = {
    name: request.body.name ?? existing.name,
    email: request.body.email ?? existing.email,
    phone: request.body.phone ?? existing.phone,
    plan: request.body.plan ?? existing.plan,
    expiryDate: request.body.expiryDate ?? existing.expiryDate,
    status: request.body.status ?? existing.status,
  };
  if (!validMember(values)) {
    response.status(400).json({ error: "Los datos del miembro no son válidos." });
    return;
  }
  await database.execute(
    `UPDATE members SET name = ?, email = ?, phone = ?, plan = ?,
     expiry_date = ?, status = ? WHERE id = ?`,
    [
      values.name.trim(),
      values.email.trim().toLowerCase(),
      values.phone.trim(),
      values.plan.trim(),
      values.expiryDate,
      values.status,
      id,
    ],
  );
  response.json({ data: { ...values, id } });
});

export const deleteMember = asyncHandler(async (request, response) => {
  const id = positiveId(request.params.id);
  if (!id) {
    response.status(400).json({ error: "El identificador del miembro no es válido." });
    return;
  }
  const [result] = await database.execute<ResultSetHeader>(
    "DELETE FROM members WHERE id = ?",
    [id],
  );
  if (result.affectedRows === 0) {
    response.status(404).json({ error: "No se encontró el miembro." });
    return;
  }
  response.status(204).end();
});
