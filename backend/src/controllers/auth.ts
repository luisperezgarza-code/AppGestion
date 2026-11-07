import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { database } from "../config/database.js";
import { hashPassword, signAccessToken, verifyPassword } from "../config/security.js";
import { isRecord, isString } from "./validation.js";
import { asyncHandler } from "./asyncHandler.js";

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  password_hash: string;
  role: "owner" | "receptionist" | "trainer";
};

type PublicUserData = Pick<
  UserRow,
  "id" | "name" | "email" | "phone" | "avatar" | "role"
>;

function publicUser(user: PublicUserData) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatar: user.avatar ?? "",
    role: user.role,
  };
}

function validCredentials(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

export const register = asyncHandler(async (request, response) => {
  if (!validCredentials(request.body)) {
    response.status(400).json({ error: "Los datos de registro no son válidos." });
    return;
  }
  const { name, email, password } = request.body;
  if (
    !isString(name, 2, 120) ||
    !isString(email, 3, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 10 ||
    password.length > 72
  ) {
    response.status(400).json({
      error: "Nombre, correo válido y contraseña de 10 a 72 caracteres son obligatorios.",
    });
    return;
  }

  const connection = await database.getConnection();
  let lockAcquired = false;
  try {
    const [lockRows] = await connection.query<RowDataPacket[]>(
      "SELECT GET_LOCK('appgestion_initial_owner', 10) AS acquired",
    );
    lockAcquired = lockRows[0]?.acquired === 1;
    if (!lockAcquired) {
      response.status(503).json({ error: "No se pudo iniciar el registro. Inténtalo de nuevo." });
      return;
    }

    const [countRows] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM users",
    );
    if (Number(countRows[0]?.total) > 0) {
      response.status(403).json({
        error: "El registro público está cerrado. Solicita una cuenta al propietario.",
      });
      return;
    }

    const [result] = await connection.execute<ResultSetHeader>(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'owner')",
      [name.trim(), email.trim().toLowerCase(), await hashPassword(password)],
    );
    const user: PublicUserData = {
      id: result.insertId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: "",
      avatar: "",
      role: "owner",
    };
    response.status(201).json({
      token: signAccessToken(String(user.id)),
      user: publicUser(user),
    });
  } finally {
    if (lockAcquired) {
      await connection.query("SELECT RELEASE_LOCK('appgestion_initial_owner')");
    }
    connection.release();
  }
});

export const login = asyncHandler(async (request, response) => {
  if (!validCredentials(request.body)) {
    response.status(400).json({ error: "Correo y contraseña son obligatorios." });
    return;
  }
  const { email, password } = request.body;
  if (
    !isString(email, 3, 254) ||
    typeof password !== "string" ||
    password.length > 72
  ) {
    response.status(400).json({ error: "Correo o contraseña incorrectos." });
    return;
  }

  const [rows] = await database.execute<UserRow[]>(
    `SELECT id, name, email, phone, avatar, password_hash, role
     FROM users WHERE email = ? LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    response.status(401).json({ error: "Correo o contraseña incorrectos." });
    return;
  }

  response.json({
    token: signAccessToken(String(user.id)),
    user: publicUser(user),
  });
});

export const currentUser = asyncHandler(async (request, response) => {
  const userId = request.authUserId;
  if (!userId) {
    response.status(401).json({ error: "Se requiere iniciar sesión." });
    return;
  }
  const [rows] = await database.execute<UserRow[]>(
    `SELECT id, name, email, phone, avatar, password_hash, role
     FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );
  const user = rows[0];
  if (!user) {
    response.status(401).json({ error: "La cuenta asociada ya no existe." });
    return;
  }
  response.json(publicUser(user));
});
