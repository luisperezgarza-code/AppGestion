import { useState, type FormEvent } from "react";
import { api, apiMode, type Session } from "../../services/api";

export default function Auth({
  onAuthenticated,
  initialError = "",
}: {
  onAuthenticated: (session: Session) => void;
  initialError?: string;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));

    try {
      const session =
        mode === "login"
          ? await api.auth.login(email, password)
          : await api.auth.register(
              String(formData.get("name")).trim(),
              email,
              password,
            );
      onAuthenticated(session);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo iniciar sesión.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1>{mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h1>
        <p className="auth-description">
          {mode === "login"
            ? "Inicia sesión para administrar tu negocio."
            : "Registra una cuenta para comenzar a gestionar tu negocio."}
        </p>
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
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
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
          <div className="form-field">
            <label htmlFor="auth-email">Correo electrónico</label>
            <input
              autoComplete="email"
              autoFocus={mode === "login"}
              id="auth-email"
              name="email"
              placeholder="nombre@correo.com"
              required
              type="email"
            />
          </div>
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
          {errorMessage && (
            <p className="auth-error" role="alert">
              {errorMessage}
            </p>
          )}
          <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Procesando..."
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>
        <p className="auth-security-note">
          {apiMode === "local"
            ? "Modo local: la cuenta se guarda únicamente en este navegador."
            : "Conexión segura con el servidor de AppGestion."}
        </p>
      </section>
    </main>
  );
}
