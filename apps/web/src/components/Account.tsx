import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  api,
  apiMode,
  type AccountProfile,
  type AppUser,
} from "../services/api";
import { Icon } from "./Icon";
import type { ToastType } from "./Toast";

type Props = {
  user: AppUser;
  onUserUpdated: (user: AppUser) => void;
  onNotify: (message: string, type?: ToastType) => void;
};

function readProfile(user: AppUser): AccountProfile {
  if (apiMode === "remote") {
    return {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      avatar: user.avatar ?? "",
    };
  }
  try {
    const stored = window.localStorage.getItem("appgestion.profile");
    if (stored) {
      const profile: unknown = JSON.parse(stored);
      if (
        typeof profile === "object" &&
        profile !== null &&
        "name" in profile &&
        "email" in profile &&
        "phone" in profile &&
        "avatar" in profile &&
        typeof profile.name === "string" &&
        typeof profile.email === "string" &&
        typeof profile.phone === "string" &&
        typeof profile.avatar === "string"
      ) {
        return {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          avatar: profile.avatar,
        };
      }
    }
  } catch (error) {
    console.error("No se pudo leer el perfil guardado.", error);
  }
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatar: user.avatar ?? "",
  };
}

export default function Account({ user, onUserUpdated, onNotify }: Props) {
  const [profile, setProfile] = useState(() => readProfile(user));
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updatedProfile = await api.users.updateProfile(profile);
      const updatedUser = {
        ...user,
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        avatar: updatedProfile.avatar,
      };
      onUserUpdated(updatedUser);
      onNotify("Tu perfil se actualizó correctamente.");
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo actualizar el perfil.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword"));
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));
    if (newPassword !== confirmPassword) {
      onNotify("Las contraseñas nuevas no coinciden.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await api.users.changePassword(currentPassword, newPassword);
      form.reset();
      onNotify("Tu contraseña se actualizó correctamente.");
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onNotify("Selecciona un archivo de imagen válido.", "error");
      return;
    }
    if (file.size > 1_000_000) {
      onNotify("La imagen debe ser menor a 1 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const avatar = reader.result;
      if (typeof avatar === "string")
        setProfile((current) => ({ ...current, avatar }));
    };
    reader.onerror = () => onNotify("No se pudo leer la imagen.", "error");
    reader.readAsDataURL(file);
  };

  const initials = profile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toLocaleUpperCase("es-MX");

  return (
    <section className="module-page">
      <div className="module-heading">
        <div>
          <p className="eyebrow">PREFERENCIAS</p>
          <h1>Mi cuenta</h1>
          <p className="module-description">
            Actualiza tu información personal y la seguridad de tu cuenta.
          </p>
        </div>
      </div>
      <div className="account-grid">
        <section className="panel account-panel">
          <div className="module-panel-heading">
            <div>
              <h2>Información personal</h2>
              <p>Estos datos identifican tu cuenta de administrador.</p>
            </div>
          </div>
          <form className="module-form account-form" onSubmit={saveProfile}>
            <div className="account-avatar-picker">
              {profile.avatar ? (
                <img alt="" className="account-avatar-image" src={profile.avatar} />
              ) : (
                <span className="account-avatar-fallback">{initials || "LP"}</span>
              )}
              <div>
                <label className="secondary-button avatar-upload-button">
                  Cambiar foto
                  <input
                    accept="image/*"
                    aria-label="Cambiar foto de perfil"
                    className="visually-hidden"
                    onChange={uploadAvatar}
                    type="file"
                  />
                </label>
                <span className="summary-caption">JPG, PNG o GIF · máximo 1 MB</span>
              </div>
            </div>
            <div className="form-grid-two">
              <div className="form-field">
                <label htmlFor="account-name">Nombre completo</label>
                <input
                  id="account-name"
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  value={profile.name}
                />
              </div>
              <div className="form-field">
                <label htmlFor="account-email">Correo electrónico</label>
                <input
                  id="account-email"
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                  type="email"
                  value={profile.email}
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="account-phone">Teléfono</label>
              <input
                id="account-phone"
                onChange={(event) =>
                  setProfile((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="55 1234 5678"
                type="tel"
                value={profile.phone}
              />
            </div>
            <div className="modal-actions">
              <button className="primary-button" disabled={isSaving} type="submit">
                <Icon name="check" size={16} />
                Guardar perfil
              </button>
            </div>
          </form>
        </section>

        <section className="panel account-panel">
          <div className="module-panel-heading">
            <div>
              <h2>Seguridad</h2>
              <p>Usa una contraseña segura y única.</p>
            </div>
          </div>
          <form className="module-form account-form" onSubmit={changePassword}>
            <div className="form-field">
              <label htmlFor="current-password">Contraseña actual</label>
              <input
                autoComplete="current-password"
                id="current-password"
                minLength={8}
                name="currentPassword"
                required
                type="password"
              />
            </div>
            <div className="form-field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                autoComplete="new-password"
                id="new-password"
                minLength={10}
                name="newPassword"
                required
                type="password"
              />
            </div>
            <div className="form-field">
              <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
              <input
                autoComplete="new-password"
                id="confirm-password"
                minLength={10}
                name="confirmPassword"
                required
                type="password"
              />
            </div>
            <div className="modal-actions">
              <button className="primary-button" disabled={isSaving} type="submit">
                Actualizar contraseña
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}
