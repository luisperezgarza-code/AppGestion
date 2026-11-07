import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { database } from "../config/database.js";
import { asyncHandler } from "./asyncHandler.js";
import { isRecord, isString, positiveId } from "./validation.js";

type ClassRow = RowDataPacket & {
  id: number;
  name: string;
  trainerId: number | null;
  trainerName: string | null;
  schedule: string;
  capacity: number;
};

type ClassInput = {
  name: string;
  trainerId?: number | null;
  schedule: string;
  capacity: number;
};

function validClass(value: unknown): value is ClassInput {
  if (!isRecord(value)) return false;
  return (
    isString(value.name, 2, 120) &&
    (value.trainerId === null ||
      value.trainerId === undefined ||
      (typeof value.trainerId === "number" &&
        Number.isSafeInteger(value.trainerId) &&
        value.trainerId > 0)) &&
    isString(value.schedule, 1, 120) &&
    typeof value.capacity === "number" &&
    Number.isInteger(value.capacity) &&
    value.capacity > 0 &&
    value.capacity <= 500
  );
}

const classSelect = `SELECT c.id, c.name, c.trainer_id AS trainerId,
  s.name AS trainerName, c.schedule, c.capacity
  FROM classes c LEFT JOIN staff s ON s.id = c.trainer_id`;

export const listClasses = asyncHandler(async (_request, response) => {
  const [classes] = await database.query<ClassRow[]>(
    `${classSelect} ORDER BY c.id DESC`,
  );
  response.json({ data: classes });
});

export const createClass = asyncHandler(async (request, response) => {
  if (!validClass(request.body)) {
    response.status(400).json({ error: "Los datos de la clase no son válidos." });
    return;
  }
  const { name, trainerId, schedule, capacity } = request.body;
  const [result] = await database.execute<ResultSetHeader>(
    "INSERT INTO classes (name, trainer_id, schedule, capacity) VALUES (?, ?, ?, ?)",
    [name.trim(), trainerId ?? null, schedule.trim(), capacity],
  );
  response.status(201).json({
    data: {
      id: result.insertId,
      name: name.trim(),
      trainerId: trainerId ?? null,
      trainerName: null,
      schedule: schedule.trim(),
      capacity,
    },
  });
});

export const updateClass = asyncHandler(async (request, response) => {
  const id = positiveId(request.params.id);
  if (!id) {
    response.status(400).json({ error: "El identificador de la clase no es válido." });
    return;
  }
  if (!isRecord(request.body)) {
    response.status(400).json({ error: "Los datos de la clase no son válidos." });
    return;
  }
  const [rows] = await database.execute<ClassRow[]>(
    `${classSelect} WHERE c.id = ? LIMIT 1`,
    [id],
  );
  const existing = rows[0];
  if (!existing) {
    response.status(404).json({ error: "No se encontró la clase." });
    return;
  }
  const values = {
    name: request.body.name ?? existing.name,
    trainerId:
      request.body.trainerId === undefined
        ? existing.trainerId
        : request.body.trainerId,
    schedule: request.body.schedule ?? existing.schedule,
    capacity: request.body.capacity ?? existing.capacity,
  };
  if (!validClass(values)) {
    response.status(400).json({ error: "Los datos de la clase no son válidos." });
    return;
  }
  await database.execute(
    "UPDATE classes SET name = ?, trainer_id = ?, schedule = ?, capacity = ? WHERE id = ?",
    [values.name.trim(), values.trainerId, values.schedule.trim(), values.capacity, id],
  );
  response.json({ data: { id, ...values, trainerName: existing.trainerName } });
});

export const deleteClass = asyncHandler(async (request, response) => {
  const id = positiveId(request.params.id);
  if (!id) {
    response.status(400).json({ error: "El identificador de la clase no es válido." });
    return;
  }
  const [result] = await database.execute<ResultSetHeader>(
    "DELETE FROM classes WHERE id = ?",
    [id],
  );
  if (result.affectedRows === 0) {
    response.status(404).json({ error: "No se encontró la clase." });
    return;
  }
  response.status(204).end();
});
