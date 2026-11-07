export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "owner" | "receptionist" | "trainer";
  twoFactorEnabled?: boolean;
  twoFactorMethod?: "app" | null;
};

export type Session = {
  token: string;
  user: AppUser;
};

export type LoginChallenge = {
  requiresTwoFactor: true;
  challengeToken: string;
  method: "app";
};

export type TwoFactorSetup = {
  method: "app";
  qrCode: string;
};

export type MemberRecord = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  expiryDate: string;
  status: "Activo" | "Inactivo" | "Pendiente de Pago";
};

export type TransactionRecord = {
  id: string | number;
  client: string;
  concept: string;
  amount: number;
  method: string;
  date: string;
  status: "Completado" | "Pendiente";
};

export type TrainerRecord = {
  id: string | number;
  name: string;
  email: string;
  specialty: string;
  schedule: string;
  availability: "Disponible" | "En sesión" | "Fuera de horario";
  initials: string;
  color: string;
};

export type ClassRecord = {
  id: string | number;
  name: string;
  trainerId: number | null;
  trainerName: string | null;
  schedule: string;
  capacity: number;
};

export type AccountProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
};

const apiBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000/api";
const configuredMode = import.meta.env.VITE_API_MODE;
const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE;

export const apiMode: "local" | "remote" =
  configuredMode === "remote" || (!configuredMode && useLocalStorage === "false")
    ? "remote"
    : "local";

const tokenStorageKey = "appgestion.authToken";

export function setAccessToken(token: string | null) {
  try {
    if (token) {
      window.localStorage.setItem(tokenStorageKey, token);
    } else {
      window.localStorage.removeItem(tokenStorageKey);
    }
  } catch (error) {
    console.error("No se pudo guardar el token de acceso.", error);
    throw new Error("No se pudo guardar la sesión en este dispositivo.");
  }
}

function getAccessToken() {
  try {
    return window.localStorage.getItem(tokenStorageKey);
  } catch (error) {
    console.error("No se pudo leer el token de acceso.", error);
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error(`API request failed: ${path}`, error);
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `La solicitud falló (${response.status}).`;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : (JSON.parse(stored) as T);
  } catch (error) {
    console.error(`No se pudo leer el almacén local "${key}".`, error);
    throw new Error("No se pudieron leer los datos guardados.");
  }
}

function writeLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo escribir el almacén local "${key}".`, error);
    throw new Error("No se pudieron guardar los datos en este dispositivo.");
  }
}

type IdentifiedRecord = { id: string | number };

function localCollection<T extends IdentifiedRecord>(key: string) {
  return {
    async list(): Promise<T[]> {
      return readLocal<T[]>(key, []);
    },
    async create(value: Omit<T, "id">): Promise<T> {
      const item = { ...value, id: Date.now() } as T;
      writeLocal(key, [item, ...readLocal<T[]>(key, [])]);
      return item;
    },
    async update(id: string | number, value: Partial<T>): Promise<T> {
      const items = readLocal<T[]>(key, []);
      const current = items.find((item) => String(item.id) === String(id));
      if (!current) throw new Error("No se encontró el registro.");
      const updated = { ...current, ...value };
      writeLocal(
        key,
        items.map((item) =>
          String(item.id) === String(id) ? updated : item,
        ),
      );
      return updated;
    },
    async remove(id: string | number): Promise<void> {
      writeLocal(
        key,
        readLocal<T[]>(key, []).filter(
          (item) => String(item.id) !== String(id),
        ),
      );
    },
  };
}

function remoteCollection<T extends IdentifiedRecord>(
  path: string,
  localKey: string,
) {
  const local = localCollection<T>(localKey);
  return {
    async list() {
      if (apiMode === "local") return local.list();
      return (await request<{ data: T[] }>(path)).data;
    },
    async create(value: Omit<T, "id">) {
      if (apiMode === "local") return local.create(value);
      const response = await request<{ data: T }>(path, {
        method: "POST",
        body: JSON.stringify(value),
      });
      return response.data;
    },
    async update(id: string | number, value: Partial<T>) {
      if (apiMode === "local") return local.update(id, value);
      const response = await request<{ data: T }>(`${path}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(value),
      });
      return response.data;
    },
    async remove(id: string | number) {
      if (apiMode === "local") return local.remove(id);
      await request<void>(`${path}/${id}`, { method: "DELETE" });
    },
  };
}

type LocalAccount = {
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  role?: AppUser["role"];
};

export const api = {
  auth: {
    async login(email: string, password: string): Promise<Session | LoginChallenge> {
      if (apiMode === "remote") {
        const result = await request<Session | LoginChallenge>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if ("token" in result) setAccessToken(result.token);
        return result;
      }

      const accounts = readLocal<LocalAccount[]>("appgestion.localAccounts", []);
      const account = accounts.find(
        (item) => item.email.toLowerCase() === email.toLowerCase(),
      );
      if (!account) throw new Error("Correo o contraseña incorrectos.");
      const passwordHash = await hashLocalPassword(password, account.salt);
      if (passwordHash !== account.passwordHash) {
        throw new Error("Correo o contraseña incorrectos.");
      }
      const session = {
        token: "local-session",
        user: {
          id: account.email,
          name: account.name,
          email: account.email,
          role: account.role ?? "owner",
        },
      };
      setAccessToken(session.token);
      return session;
    },
    async forgotPassword(email: string) {
      return request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    async resetPassword(token: string, password: string) {
      return request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
    },
    async verifyLoginCode(code: string, challengeToken: string) {
      const session = await request<Session>("/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ code, challengeToken }),
      });
      setAccessToken(session.token);
      return session;
    },
    async setupTwoFactor(): Promise<TwoFactorSetup> {
      return request<TwoFactorSetup>("/auth/2fa/setup", {
        method: "POST",
      });
    },
    async verifyTwoFactor(code: string) {
      return request<{ enabled: true; method: "app" }>(
        "/auth/2fa/verify",
        { method: "POST", body: JSON.stringify({ code }) },
      );
    },
    async disableTwoFactor(password: string, code: string) {
      return request<{
        enabled?: false;
      }>(
        "/auth/2fa/disable",
        {
          method: "POST",
          body: JSON.stringify({ password, code }),
        },
      );
    },
    async register(
      name: string,
      email: string,
      password: string,
    ): Promise<Session> {
      if (apiMode === "remote") {
        const session = await request<Session>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setAccessToken(session.token);
        return session;
      }

      const accounts = readLocal<LocalAccount[]>("appgestion.localAccounts", []);
      if (accounts.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Ya existe una cuenta con ese correo.");
      }
      const salt = crypto.randomUUID();
      const passwordHash = await hashLocalPassword(password, salt);
      writeLocal("appgestion.localAccounts", [
        ...accounts,
        { name, email, salt, passwordHash, role: "owner" },
      ]);
      const session = {
        token: "local-session",
        user: { id: email, name, email, role: "owner" as const },
      };
      setAccessToken(session.token);
      return session;
    },
    async currentUser(): Promise<AppUser> {
      if (apiMode === "remote") {
        return request<AppUser>("/auth/me");
      }
      const session = readLocal<Session | null>("appgestion.session", null);
      if (!session) throw new Error("La sesión expiró. Inicia sesión de nuevo.");
      return session.user;
    },
    logout() {
      setAccessToken(null);
    },
  },
  members: remoteCollection<MemberRecord>("/members", "appgestion.members"),
  finance: remoteCollection<TransactionRecord>(
    "/finance",
    "appgestion.transactions",
  ),
  staff: remoteCollection<TrainerRecord>("/staff", "appgestion.trainers"),
  classes: remoteCollection<ClassRecord>("/classes", "appgestion.classes"),
  users: {
    async updateProfile(profile: AccountProfile) {
      if (apiMode === "local") {
        const session = readLocal<Session | null>("appgestion.session", null);
        const accounts = readLocal<LocalAccount[]>("appgestion.localAccounts", []);
        const currentAccount = session
          ? accounts.find(
              (item) =>
                item.email.toLowerCase() === session.user.email.toLowerCase(),
            )
          : undefined;
        if (
          accounts.some(
            (item) =>
              item.email.toLowerCase() === profile.email.toLowerCase() &&
              item.email.toLowerCase() !==
                session?.user.email.toLowerCase(),
          )
        ) {
          throw new Error("Ya existe una cuenta con ese correo.");
        }
        if (currentAccount) {
          writeLocal(
            "appgestion.localAccounts",
            accounts.map((item) =>
              item === currentAccount
                ? { ...item, name: profile.name, email: profile.email }
                : item,
            ),
          );
        }
        writeLocal("appgestion.profile", profile);
        return profile;
      }
      const response = await request<{ data: AccountProfile }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      return response.data;
    },
    async changePassword(currentPassword: string, newPassword: string) {
      if (apiMode === "local") {
        const session = readLocal<Session | null>("appgestion.session", null);
        if (!session) throw new Error("Inicia sesión para cambiar la contraseña.");
        const accounts = readLocal<LocalAccount[]>("appgestion.localAccounts", []);
        const account = accounts.find(
          (item) => item.email.toLowerCase() === session.user.email.toLowerCase(),
        );
        if (!account) throw new Error("No se encontró la cuenta.");
        if (
          (await hashLocalPassword(currentPassword, account.salt)) !==
          account.passwordHash
        ) {
          throw new Error("La contraseña actual es incorrecta.");
        }
        const salt = crypto.randomUUID();
        const passwordHash = await hashLocalPassword(newPassword, salt);
        writeLocal(
          "appgestion.localAccounts",
          accounts.map((item) =>
            item.email === account.email
              ? { ...item, salt, passwordHash }
              : item,
          ),
        );
        return;
      }
      await request<void>("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
  },
};

async function hashLocalPassword(password: string, salt: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
