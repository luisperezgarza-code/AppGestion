import { randomBytes } from "node:crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { database } from "../config/database.js";
import { sendPasswordResetEmail } from "../config/delivery.js";
import {
  hashPassword,
  hashResetToken,
  signAccessToken,
  signPurposeToken,
  verifyAccessToken,
  verifyPassword,
  verifyPurposeToken,
} from "../config/security.js";
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
  two_factor_secret: string | null;
  two_factor_enabled: number;
  two_factor_method: "app" | null;
};

type PublicUserData = Pick<
  UserRow,
  "id" | "name" | "email" | "phone" | "avatar" | "role"
> &
  Partial<Pick<UserRow, "two_factor_enabled" | "two_factor_method">>;

function publicUser(user: PublicUserData) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatar: user.avatar ?? "",
    role: user.role,
    twoFactorEnabled: Boolean(user.two_factor_enabled),
    twoFactorMethod: user.two_factor_method,
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
    `SELECT id, name, email, phone, avatar, password_hash, role,
            two_factor_secret, two_factor_enabled, two_factor_method
     FROM users WHERE email = ? LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    response.status(401).json({ error: "Correo o contraseña incorrectos." });
    return;
  }

  if (user.two_factor_enabled) {
    if (user.two_factor_method !== "app" || !user.two_factor_secret) {
      response.status(409).json({
        error: "La configuración de autenticación en dos pasos no es válida. Contacta al administrador.",
      });
      return;
    }
    const challengeToken = signPurposeToken(
      String(user.id),
      "two-factor-login",
      5 * 60,
    );
    response.status(202).json({
      requiresTwoFactor: true,
      challengeToken,
      method: "app",
    });
    return;
  }

  response.json({
    token: signAccessToken(String(user.id)),
    user: publicUser(user),
  });
});

  export const forgotPassword = asyncHandler(async (request, response) => {
    if (!isRecord(request.body) || !isString(request.body.email, 3, 254)) {
      response.status(400).json({ error: "Ingresa un correo electrónico válido." });
      return;
    }
    const email = request.body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      response.status(400).json({ error: "Ingresa un correo electrónico válido." });
      return;
    }
    const [users] = await database.execute<Array<RowDataPacket & { id: number; email: string }>>(
      "SELECT id, email FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const user = users[0];
    if (user) {
      const token = randomBytes(32).toString("hex");
      await database.execute(
        `UPDATE users SET reset_password_token = ?,
         reset_password_expires = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)
         WHERE id = ?`,
        [hashResetToken(token), user.id],
      );
      const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
      const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (error) {
        await database.execute(
          "UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
          [user.id],
        );
        throw error;
      }
    }
    response.json({
      message: "Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña.",
    });
  });

  export const resetPassword = asyncHandler(async (request, response) => {
    if (
      !isRecord(request.body) ||
      !isString(request.body.token, 32, 256) ||
      typeof request.body.password !== "string" ||
      request.body.password.length < 10 ||
      request.body.password.length > 72
    ) {
      response.status(400).json({
        error: "El enlace o la contraseña no son válidos. Usa una contraseña de 10 a 72 caracteres.",
      });
      return;
    }
    const [result] = await database.execute<ResultSetHeader>(
      `UPDATE users SET password_hash = ?, reset_password_token = NULL,
       reset_password_expires = NULL WHERE reset_password_token = ?
       AND reset_password_expires > UTC_TIMESTAMP()`,
      [
        await hashPassword(request.body.password),
        hashResetToken(request.body.token),
      ],
    );
    if (result.affectedRows === 0) {
      response.status(400).json({
        error: "El enlace de recuperación no es válido o ya expiró.",
      });
      return;
    }
    response.json({ message: "Tu contraseña se actualizó. Ya puedes iniciar sesión." });
  });

  export const setupTwoFactor = asyncHandler(async (request, response) => {
    const userId = request.authUserId;
    if (!userId) {
      response.status(401).json({ error: "Inicia sesión para configurar la verificación." });
      return;
    }
    const [rows] = await database.execute<UserRow[]>(
      `SELECT id, email, two_factor_enabled
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );
    const user = rows[0];
    if (!user) {
      response.status(404).json({ error: "No se encontró la cuenta." });
      return;
    }
    if (user.two_factor_enabled) {
      response.status(409).json({
        error: "Desactiva la verificación actual antes de configurarla de nuevo.",
      });
      return;
    }

    const secret = speakeasy.generateSecret({
      name: `AppGestion (${user.email})`,
      issuer: "AppGestion",
      length: 20,
    });
    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error("No se pudo generar la clave para la aplicación autenticadora.");
    }
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    await database.execute(
      `UPDATE users SET two_factor_secret = ?, two_factor_method = 'app',
       two_factor_enabled = 0 WHERE id = ?`,
      [secret.base32, user.id],
    );
    response.json({ method: "app", qrCode });
  });

  export const verifyTwoFactor = asyncHandler(async (request, response) => {
    if (!isRecord(request.body) || !/^\d{6}$/.test(String(request.body.code ?? ""))) {
      response.status(400).json({ error: "Ingresa un código válido de 6 dígitos." });
      return;
    }
    const code = String(request.body.code);
    const challengeToken =
      typeof request.body.challengeToken === "string"
        ? request.body.challengeToken
        : null;
    if (challengeToken) {
      const userId = verifyPurposeToken(challengeToken, "two-factor-login");
      if (!userId) {
        response.status(401).json({ error: "El reto de verificación expiró. Inicia sesión de nuevo." });
        return;
      }
      const [rows] = await database.execute<UserRow[]>(
        `SELECT id, name, email, phone, avatar, role, password_hash,
                two_factor_secret, two_factor_enabled, two_factor_method
         FROM users WHERE id = ? LIMIT 1`,
        [userId],
      );
      const user = rows[0];
      if (
        !user?.two_factor_enabled ||
        user.two_factor_method !== "app" ||
        !user.two_factor_secret
      ) {
        response.status(401).json({ error: "La verificación en dos pasos ya no está activa." });
        return;
      }
      const valid = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: "base32",
        token: code,
        window: 1,
      });
      if (!valid) {
        response.status(401).json({ error: "El código es incorrecto o expiró." });
        return;
      }
      response.json({
        token: signAccessToken(String(user.id)),
        user: publicUser(user),
      });
      return;
    }

    const userId = request.authUserId;
    if (!userId) {
      response.status(401).json({ error: "Inicia sesión para verificar el código." });
      return;
    }
    const [rows] = await database.execute<UserRow[]>(
      `SELECT id, two_factor_secret, two_factor_enabled, two_factor_method
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );
    const user = rows[0];
    if (
      !user ||
      user.two_factor_enabled ||
      user.two_factor_method !== "app" ||
      !user.two_factor_secret
    ) {
      response.status(400).json({ error: "No hay una configuración pendiente para verificar." });
      return;
    }
    const valid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) {
      response.status(400).json({ error: "El código es incorrecto o expiró." });
      return;
    }
    const [result] = await database.execute<ResultSetHeader>(
      `UPDATE users SET two_factor_enabled = 1
       WHERE id = ? AND two_factor_enabled = 0 AND two_factor_method = 'app'`,
      [user.id],
    );
    if (!result.affectedRows) {
      response.status(409).json({ error: "La configuración ya cambió. Inténtalo de nuevo." });
      return;
    }
    response.json({ enabled: true, method: user.two_factor_method });
  });

  export const disableTwoFactor = asyncHandler(async (request, response) => {
    const userId = request.authUserId;
    if (!userId || !isRecord(request.body)) {
      response.status(400).json({ error: "Ingresa tu contraseña y código de verificación." });
      return;
    }
    const { password, code } = request.body;
    if (
      typeof password !== "string" ||
      typeof code !== "string" ||
      !/^\d{6}$/.test(code)
    ) {
      response.status(400).json({ error: "Ingresa tu contraseña y código de 6 dígitos." });
      return;
    }
    const [rows] = await database.execute<UserRow[]>(
      `SELECT id, password_hash, two_factor_secret, two_factor_enabled,
              two_factor_method
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );
    const user = rows[0];
    if (
      !user?.two_factor_enabled ||
      user.two_factor_method !== "app" ||
      !user.two_factor_secret ||
      !(await verifyPassword(password, user.password_hash))
    ) {
      response.status(401).json({ error: "La contraseña actual no es válida o la verificación ya está desactivada." });
      return;
    }
    const valid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) {
      response.status(401).json({ error: "El código es incorrecto o expiró." });
      return;
    }
    const [result] = await database.execute<ResultSetHeader>(
      `UPDATE users SET two_factor_secret = NULL, two_factor_enabled = 0,
       two_factor_method = NULL WHERE id = ? AND two_factor_enabled = 1
       AND two_factor_method = 'app'`,
      [user.id],
    );
    if (!result.affectedRows) {
      response.status(409).json({ error: "No se pudo cambiar la configuración de seguridad." });
      return;
    }
    response.json({ enabled: false });
  });
export const currentUser = asyncHandler(async (request, response) => {
  const userId = request.authUserId;
  if (!userId) {
    response.status(401).json({ error: "Se requiere iniciar sesión." });
    return;
  }
  const [rows] = await database.execute<UserRow[]>(
    `SELECT id, name, email, phone, avatar, password_hash, role,
            two_factor_enabled, two_factor_method
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
