import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { database } from "../config/database.js";
import { hashPassword, verifyPassword } from "../config/security.js";
import { asyncHandler } from "./asyncHandler.js";
import { isRecord, isString } from "./validation.js";

type UserRole = "owner" | "receptionist" | "trainer";
type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  password_hash?: string;
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

export const listUsers = asyncHandler(async (_request, response) => {
  const [users] = await database.query<UserRow[]>(
    "SELECT id, name, email, phone, avatar, role FROM users ORDER BY id",
  );
  response.json({ data: users.map(publicUser) });
});

export const createUser = asyncHandler(async (request, response) => {
  if (!isRecord(request.body)) {
    response.status(400).json({ error: "Los datos del usuario no son válidos." });
    return;
  }
  const { name, email, password, role } = request.body;
  if (
    !isString(name, 2, 120) ||
    !isString(email, 3, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 10 ||
    password.length > 72 ||
    (role !== "receptionist" && role !== "trainer")
  ) {
    response.status(400).json({
      error: "Nombre, correo, contraseña de 10 a 72 caracteres y rol válido son obligatorios.",
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [result] = await database.execute<ResultSetHeader>(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name.trim(), normalizedEmail, await hashPassword(password), role],
  );
  response.status(201).json({
    data: publicUser({
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      phone: "",
      avatar: "",
      role,
    }),
  });
});

export const updateProfile = asyncHandler(async (request, response) => {
  if (!isRecord(request.body)) {
    response.status(400).json({ error: "Los datos del perfil no son válidos." });
    return;
  }
  const { name, email, phone, avatar } = request.body;
  if (
    !isString(name, 2, 120) ||
    !isString(email, 3, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof phone !== "string" ||
    phone.length > 40 ||
    typeof avatar !== "string" ||
    avatar.length > 3_000_000
  ) {
    response.status(400).json({ error: "Los datos del perfil no son válidos." });
    return;
  }

  const userId = request.authUserId;
  if (!userId) {
    response.status(401).json({ error: "Se requiere iniciar sesión." });
    return;
  }
  const [result] = await database.execute<ResultSetHeader>(
    `UPDATE users SET name = ?, email = ?, phone = ?, avatar = ?
     WHERE id = ?`,
    [
      name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      avatar,
      userId,
    ],
  );
  if (result.affectedRows === 0) {
    response.status(404).json({ error: "No se encontró la cuenta." });
    return;
  }
  response.json({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      avatar,
    },
  });
});

export const changePassword = asyncHandler(async (request, response) => {
  if (!isRecord(request.body)) {
    response.status(400).json({ error: "Los datos de contraseña no son válidos." });
    return;
  }
  const { currentPassword, newPassword } = request.body;
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < 10 ||
    newPassword.length > 72
  ) {
    response.status(400).json({
      error: "La contraseña nueva debe tener entre 10 y 72 caracteres.",
    });
    return;
  }

  const userId = request.authUserId;
  if (!userId) {
    response.status(401).json({ error: "Se requiere iniciar sesión." });
    return;
  }
  const [users] = await database.execute<UserRow[]>(
    "SELECT id, name, email, phone, avatar, role, password_hash FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  const user = users[0];
  if (!user?.password_hash) {
    response.status(404).json({ error: "No se encontró la cuenta." });
    return;
  }
  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    response.status(400).json({ error: "La contraseña actual es incorrecta." });
    return;
  }

  await database.execute(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [await hashPassword(newPassword), userId],
  );
  response.status(204).end();
});
