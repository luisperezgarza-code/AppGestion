import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { database } from "../config/database.js";
import { asyncHandler } from "./asyncHandler.js";
import { isRecord, isString, positiveId } from "./validation.js";

type Availability = "Disponible" | "En sesión" | "Fuera de horario";
type TrainerRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  specialty: string;
  schedule: string;
  availability: Availability;
  initials: string;
  color: string;
};

type TrainerInput = {
  name: string;
  email: string;
  specialty: string;
  schedule: string;
  availability?: Availability;
  initials?: string;
  color?: string;
};

function validTrainer(value: unknown): value is TrainerInput {
  if (!isRecord(value)) return false;
  return (
    isString(value.name, 2, 120) &&
    isString(value.email, 3, 254) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) &&
    isString(value.specialty, 1, 120) &&
    isString(value.schedule, 1, 120) &&
    (value.availability === undefined ||
      value.availability === "Disponible" ||
      value.availability === "En sesión" ||
      value.availability === "Fuera de horario") &&
    (value.initials === undefined || isString(value.initials, 1, 5)) &&
    (value.color === undefined || isString(value.color, 1, 40))
  );
}

export const listTrainers = asyncHandler(async (_request, response) => {
  const [trainers] = await database.query<TrainerRow[]>(
    `SELECT id, name, email, specialty, schedule, availability, initials, color
     FROM staff ORDER BY created_at DESC`,
  );
  response.json({ data: trainers });
});

export const createTrainer = asyncHandler(async (request, response) => {
  if (!validTrainer(request.body)) {
    response.status(400).json({ error: "Los datos del entrenador no son válidos." });
    return;
  }
  const { name, email, specialty, schedule, availability, initials, color } =
    request.body;
  const normalizedName = name.trim();
  const trainerInitials =
    initials ??
    normalizedName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const trainerColor = color ?? "lavender";
  const [result] = await database.execute<ResultSetHeader>(
    `INSERT INTO staff (name, email, specialty, schedule, availability, initials, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      normalizedName,
      email.trim().toLowerCase(),
      specialty.trim(),
      schedule.trim(),
      availability ?? "Disponible",
      trainerInitials,
      trainerColor,
    ],
  );
  response.status(201).json({
    data: {
      id: result.insertId,
      name: normalizedName,
      email: email.trim().toLowerCase(),
      specialty: specialty.trim(),
      schedule: schedule.trim(),
      availability: availability ?? "Disponible",
      initials: trainerInitials,
      color: trainerColor,
    },
  });
});

export const updateTrainer = asyncHandler(async (request, response) => {
  const id = positiveId(request.params.id);
  if (!id) {
    response.status(400).json({ error: "El identificador del entrenador no es válido." });
    return;
  }
  if (!isRecord(request.body)) {
    response.status(400).json({ error: "Los datos del entrenador no son válidos." });
    return;
  }
  const [rows] = await database.execute<TrainerRow[]>(
    `SELECT id, name, email, specialty, schedule, availability, initials, color
     FROM staff WHERE id = ? LIMIT 1`,
    [id],
  );
  const existing = rows[0];
  if (!existing) {
    response.status(404).json({ error: "No se encontró el entrenador." });
    return;
  }
  const values = {
    name: request.body.name ?? existing.name,
    email: request.body.email ?? existing.email,
    specialty: request.body.specialty ?? existing.specialty,
    schedule: request.body.schedule ?? existing.schedule,
    availability: request.body.availability ?? existing.availability,
    initials: request.body.initials ?? existing.initials,
    color: request.body.color ?? existing.color,
  };
  if (!validTrainer(values)) {
    response.status(400).json({ error: "Los datos del entrenador no son válidos." });
    return;
  }
  await database.execute(
    `UPDATE staff SET name = ?, email = ?, specialty = ?, schedule = ?,
     availability = ?, initials = ?, color = ? WHERE id = ?`,
    [
      values.name.trim(),
      values.email.trim().toLowerCase(),
      values.specialty.trim(),
      values.schedule.trim(),
      values.availability,
      values.initials,
      values.color,
      id,
    ],
  );
  response.json({ data: { id, ...values } });
});

export const deleteTrainer = asyncHandler(async (request, response) => {
  const id = positiveId(request.params.id);
  if (!id) {
    response.status(400).json({ error: "El identificador del entrenador no es válido." });
    return;
  }
  const [result] = await database.execute<ResultSetHeader>(
    "DELETE FROM staff WHERE id = ?",
    [id],
  );
  if (result.affectedRows === 0) {
    response.status(404).json({ error: "No se encontró el entrenador." });
    return;
  }
  response.status(204).end();
});
