import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { database } from "../config/database.js";
import { hashPassword } from "../config/security.js";
import { asyncHandler } from "./asyncHandler.js";
import { isRecord, isString, positiveId } from "./validation.js";

type Availability =
  | "Disponible"
  | "Vacaciones"
  | "Incapacidad"
  | "Fuera de servicio";
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
  password?: string;
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
      value.availability === "Vacaciones" ||
      value.availability === "Incapacidad" ||
      value.availability === "Fuera de servicio") &&
    (value.initials === undefined || isString(value.initials, 1, 5)) &&
    (value.color === undefined || isString(value.color, 1, 40))
  );
}

function validOptionalPassword(value: unknown): value is string | undefined {
  return (
    value === undefined ||
    (typeof value === "string" && value.length >= 10 && value.length <= 72)
  );
}

async function updateTrainerLogin(
  connection: PoolConnection,
  name: string,
  email: string,
  previousEmail: string,
  password?: string,
) {
  const [users] = await connection.execute<
    Array<RowDataPacket & { id: number; role: string }>
  >(
    "SELECT id, role FROM users WHERE email IN (?, ?) FOR UPDATE",
    [previousEmail, email],
  );
  if (users.length > 1 || users.some((user) => user.role !== "trainer")) {
    return false;
  }
  const passwordHash = password ? await hashPassword(password) : null;
  const user = users[0];
  if (user) {
    await connection.execute(
      `UPDATE users SET name = ?, email = ?,
       password_hash = COALESCE(?, password_hash) WHERE id = ?`,
      [name, email, passwordHash, user.id],
    );
  } else if (passwordHash) {
    await connection.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'trainer')",
      [name, email, passwordHash],
    );
  }
  return true;
}

export const listTrainers = asyncHandler(async (_request, response) => {
  const [trainers] = await database.query<TrainerRow[]>(
    `SELECT id, name, email, specialty, schedule, availability, initials, color
     FROM staff ORDER BY created_at DESC`,
  );
  response.json({ data: trainers });
});

export const createTrainer = asyncHandler(async (request, response) => {
  if (
    !validTrainer(request.body) ||
    !validOptionalPassword(request.body.password)
  ) {
    response.status(400).json({ error: "Los datos del entrenador no son válidos." });
    return;
  }
  const {
    name,
    email,
    specialty,
    schedule,
    availability,
    initials,
    color,
    password,
  } = request.body;
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
  const normalizedEmail = email.trim().toLowerCase();
  const connection = await database.getConnection();
  let insertedId: number;
  try {
    await connection.beginTransaction();
    const loginUpdated = await updateTrainerLogin(
      connection,
      normalizedName,
      normalizedEmail,
      normalizedEmail,
      password,
    );
    if (!loginUpdated) {
      await connection.rollback();
      response.status(409).json({
        error: "El correo ya está asociado a una cuenta que no es de entrenador.",
      });
      return;
    }
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO staff (name, email, specialty, schedule, availability, initials, color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizedName,
        normalizedEmail,
        specialty.trim(),
        schedule.trim(),
        availability ?? "Disponible",
        trainerInitials,
        trainerColor,
      ],
    );
    insertedId = result.insertId;
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  response.status(201).json({
    data: {
      id: insertedId,
      name: normalizedName,
      email: normalizedEmail,
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
  if (!validOptionalPassword(request.body.password)) {
    response.status(400).json({
      error: "La contraseña debe tener entre 10 y 72 caracteres.",
    });
    return;
  }
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<TrainerRow[]>(
      `SELECT id, name, email, specialty, schedule, availability, initials, color
       FROM staff WHERE id = ? LIMIT 1 FOR UPDATE`,
      [id],
    );
    const existing = rows[0];
    if (!existing) {
      await connection.rollback();
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
      await connection.rollback();
      response.status(400).json({ error: "Los datos del entrenador no son válidos." });
      return;
    }
    const normalizedName = values.name.trim();
    const normalizedEmail = values.email.trim().toLowerCase();
    const loginUpdated = await updateTrainerLogin(
      connection,
      normalizedName,
      normalizedEmail,
      existing.email,
      request.body.password,
    );
    if (!loginUpdated) {
      await connection.rollback();
      response.status(409).json({
        error: "El correo ya está asociado a una cuenta que no es de entrenador.",
      });
      return;
    }
    await connection.execute(
      `UPDATE staff SET name = ?, email = ?, specialty = ?, schedule = ?,
       availability = ?, initials = ?, color = ? WHERE id = ?`,
      [
        normalizedName,
        normalizedEmail,
        values.specialty.trim(),
        values.schedule.trim(),
        values.availability,
        values.initials,
        values.color,
        id,
      ],
    );
    await connection.commit();
    response.json({
      data: {
        id,
        ...values,
        name: normalizedName,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
