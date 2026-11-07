import { useState, type FormEvent } from "react";
import { api } from "../../services/api";

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirmPassword") ?? "")) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await api.auth.resetPassword(token, password);
      setSuccessMessage(result.message);
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo restablecer la contraseña.",
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
        <p className="eyebrow">SEGURIDAD DE LA CUENTA</p>
        <h1>Restablece tu contraseña</h1>
        <p className="auth-description">
          Elige una contraseña nueva de al menos 10 caracteres.
        </p>
        {!token ? (
          <p className="auth-error" role="alert">
            El enlace de recuperación no contiene un token válido.
          </p>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="reset-password">Nueva contraseña</label>
              <input
                autoComplete="new-password"
                autoFocus
                id="reset-password"
                maxLength={72}
                minLength={10}
                name="password"
                required
                type="password"
              />
            </div>
            <div className="form-field">
              <label htmlFor="reset-confirm-password">Confirma la contraseña</label>
              <input
                autoComplete="new-password"
                id="reset-confirm-password"
                maxLength={72}
                minLength={10}
                name="confirmPassword"
                required
                type="password"
              />
            </div>
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
              disabled={isSubmitting || Boolean(successMessage)}
              type="submit"
            >
              {isSubmitting ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}
        <a className="auth-text-link" href="/">
          Volver a iniciar sesión
        </a>
      </section>
    </main>
  );
}
