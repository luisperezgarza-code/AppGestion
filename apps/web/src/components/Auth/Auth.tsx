import { useState, type FormEvent } from "react";
import {
  api,
  apiMode,
  type LoginChallenge,
  type Session,
} from "../../services/api";

export default function Auth({
  onAuthenticated,
  initialError = "",
}: {
  onAuthenticated: (session: Session) => void;
  initialError?: string;
}) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      if (mode === "forgot") {
        const result = await api.auth.forgotPassword(email);
        setSuccessMessage(result.message);
        return;
      }

      const password = String(formData.get("password") ?? "");
      if (challenge) {
        const session = await api.auth.verifyLoginCode(
          String(formData.get("code") ?? ""),
          challenge.challengeToken,
        );
        onAuthenticated(session);
        return;
      }

      const result =
        mode === "login"
          ? await api.auth.login(email, password)
          : await api.auth.register(
              String(formData.get("name") ?? "").trim(),
              email,
              password,
            );
      if ("requiresTwoFactor" in result) {
        setChallenge(result);
      } else {
        onAuthenticated(result);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo completar la solicitud.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = challenge
    ? "Verifica tu identidad"
    : mode === "forgot"
      ? "Recupera tu contraseña"
      : mode === "login"
        ? "Bienvenido de nuevo"
        : "Crea tu cuenta";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="brand-copy">
            <span className="brand-name">AppGestion</span>
            <span className="brand-tag">ADMINISTRACIÓN</span>
          </div>
        </div>
        <p className="eyebrow">PANEL DE ADMINISTRACIÓN</p>
        <h1>{title}</h1>
        <p className="auth-description">
          {challenge
            ? "Abre tu aplicación Authenticator e ingresa el código actual."
            : mode === "forgot"
              ? "Te enviaremos instrucciones si existe una cuenta con ese correo."
              : mode === "login"
                ? "Inicia sesión para administrar tu negocio."
                : "Registra una cuenta para comenzar a gestionar tu negocio."}
        </p>

        {!challenge && mode !== "forgot" && (
          <div aria-label="Tipo de acceso" className="auth-tabs" role="tablist">
            <button
              aria-selected={mode === "login"}
              className={mode === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setMode("login");
                setErrorMessage("");
              }}
              role="tab"
              type="button"
            >
              Iniciar sesión
            </button>
            <button
              aria-selected={mode === "register"}
              className={mode === "register" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setMode("register");
                setErrorMessage("");
              }}
              role="tab"
              type="button"
            >
              Crear cuenta
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && !challenge && (
            <div className="form-field">
              <label htmlFor="auth-name">Nombre completo</label>
              <input
                autoComplete="name"
                autoFocus
                id="auth-name"
                name="name"
                placeholder="Ej. Luis Pérez"
                required
              />
            </div>
          )}
          {(!challenge || mode === "forgot") && (
            <div className="form-field">
              <label htmlFor="auth-email">Correo electrónico</label>
              <input
                autoComplete="email"
                autoFocus={mode === "login" || mode === "forgot"}
                id="auth-email"
                name="email"
                placeholder="nombre@correo.com"
                required
                type="email"
              />
            </div>
          )}
          {!challenge && mode !== "forgot" && (
            <div className="form-field">
              <label htmlFor="auth-password">Contraseña</label>
              <input
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                id="auth-password"
                minLength={mode === "register" ? 10 : 1}
                maxLength={72}
                name="password"
                placeholder={mode === "register" ? "Mínimo 10 caracteres" : ""}
                required
                type="password"
              />
            </div>
          )}
          {challenge && (
            <div className="form-field">
              <label htmlFor="auth-two-factor-code">Código de verificación</label>
              <input
                autoComplete="one-time-code"
                autoFocus
                id="auth-two-factor-code"
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                name="code"
                pattern="[0-9]{6}"
                placeholder="000000"
                required
              />
            </div>
          )}
          {errorMessage && (
            <p className="auth-error" role="alert">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="auth-success" role="status">
              {successMessage}
            </p>
          )}
          <button
            className="primary-button auth-submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Procesando..."
              : challenge
                ? "Verificar código"
                : mode === "forgot"
                  ? "Enviar enlace"
                  : mode === "login"
                    ? "Iniciar sesión"
                    : "Crear cuenta"}
          </button>
        </form>

        {mode === "login" && !challenge && (
          <button
            className="auth-text-link"
            onClick={() => {
              setMode("forgot");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            type="button"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}
        {(mode === "forgot" || challenge) && (
          <button
            className="auth-text-link"
            onClick={() => {
              setMode("login");
              setChallenge(null);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            type="button"
          >
            Volver a iniciar sesión
          </button>
        )}
        <p className="auth-security-note">
          {apiMode === "local"
            ? "Modo local: la cuenta se guarda únicamente en este navegador."
            : "Conexión segura con el servidor de AppGestion."}
        </p>
      </section>
    </main>
  );
}
