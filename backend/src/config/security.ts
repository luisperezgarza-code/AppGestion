import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";

const tokenLifetimeSeconds = 8 * 60 * 60;
const bcryptRounds = 12;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET debe configurarse con al menos 32 caracteres.");
  }
  return secret;
}

function base64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, bcryptRounds);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(userId: string) {
  return signPurposeToken(userId, null, tokenLifetimeSeconds);
}

export function signPurposeToken(
  userId: string,
  purpose: string | null,
  lifetimeSeconds: number,
) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const claims: Record<string, string | number> = {
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + lifetimeSeconds,
  };
  if (purpose) claims.purpose = purpose;
  const payload = base64Url(JSON.stringify(claims));
  const content = `${header}.${payload}`;
  const signature = createHmac("sha256", getJwtSecret())
    .update(content)
    .digest();
  return `${content}.${base64Url(signature)}`;
}

export function verifyAccessToken(token: string): string | null {
  const claims = verifySignedToken(token);
  return claims && !claims.purpose ? claims.sub : null;
}

export function verifyPurposeToken(
  token: string,
  purpose: string,
): string | null {
  const claims = verifySignedToken(token);
  return claims?.purpose === purpose ? claims.sub : null;
}

type TokenClaims = { sub: string; exp: number; purpose?: string };

function verifySignedToken(token: string): TokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const header: unknown = JSON.parse(
      Buffer.from(headerPart, "base64url").toString("utf8"),
    );
    const payload: unknown = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8"),
    );
    if (
      typeof header !== "object" ||
      header === null ||
      !("alg" in header) ||
      header.alg !== "HS256" ||
      typeof payload !== "object" ||
      payload === null ||
      !("sub" in payload) ||
      typeof payload.sub !== "string" ||
      !/^[1-9]\d*$/.test(payload.sub) ||
      !("exp" in payload) ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    if ("purpose" in payload && typeof payload.purpose !== "string") {
      return null;
    }

    const expected = createHmac("sha256", getJwtSecret())
      .update(`${headerPart}.${payloadPart}`)
      .digest();
    const received = Buffer.from(signaturePart, "base64url");
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      exp: payload.exp,
      purpose:
        "purpose" in payload && typeof payload.purpose === "string"
          ? payload.purpose
          : undefined,
    };
  } catch {
    return null;
  }
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
