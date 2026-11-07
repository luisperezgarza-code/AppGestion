import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import type { ToastType } from "./Toast";

type GymSettings = {
  businessName: string;
  currency: string;
  openingTime: string;
  closingTime: string;
  notifyExpiringMemberships: boolean;
  notifyPayments: boolean;
};

const defaultSettings: GymSettings = {
  businessName: "AppGestion Fitness",
  currency: "MXN",
  openingTime: "06:00",
  closingTime: "22:00",
  notifyExpiringMemberships: true,
  notifyPayments: true,
};

function readSettings(): GymSettings {
  try {
    const stored = window.localStorage.getItem("appgestion.settings");
    if (!stored) return defaultSettings;
    const value: unknown = JSON.parse(stored);
    if (
      typeof value === "object" &&
      value !== null &&
      "businessName" in value &&
      "currency" in value &&
      "openingTime" in value &&
      "closingTime" in value &&
      "notifyExpiringMemberships" in value &&
      "notifyPayments" in value &&
      typeof value.businessName === "string" &&
      typeof value.currency === "string" &&
      typeof value.openingTime === "string" &&
      typeof value.closingTime === "string" &&
      typeof value.notifyExpiringMemberships === "boolean" &&
      typeof value.notifyPayments === "boolean"
    ) {
      return {
        businessName: value.businessName,
        currency: value.currency,
        openingTime: value.openingTime,
        closingTime: value.closingTime,
        notifyExpiringMemberships: value.notifyExpiringMemberships,
        notifyPayments: value.notifyPayments,
      };
    }
    throw new Error("El formato de configuración no es válido.");
  } catch (error) {
    console.error("No se pudo leer la configuración del negocio.", error);
    return defaultSettings;
  }
}

export default function Settings({
  onNotify,
}: {
  onNotify: (message: string, type?: ToastType) => void;
}) {
  const [settings, setSettings] = useState(readSettings);

  const updateSetting = <K extends keyof GymSettings>(
    key: K,
    value: GymSettings[K],
  ) => setSettings((current) => ({ ...current, [key]: value }));

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      window.localStorage.setItem(
        "appgestion.settings",
        JSON.stringify(settings),
      );
      onNotify("La configuración del negocio se guardó.");
    } catch (error) {
      console.error("No se pudo guardar la configuración del negocio.", error);
      onNotify("No se pudo guardar la configuración.", "error");
    }
  };

  return (
    <section className="module-page">
      <div className="module-heading">
        <div>
          <p className="eyebrow">PREFERENCIAS</p>
          <h1>Configuración del sistema</h1>
          <p className="module-description">
            Personaliza los datos y avisos de tu gimnasio.
          </p>
        </div>
      </div>
      <section className="panel settings-panel">
        <div className="module-panel-heading">
          <div>
            <h2>Datos del negocio</h2>
            <p>Se usarán en los reportes y notificaciones.</p>
          </div>
        </div>
        <form className="module-form settings-form" onSubmit={saveSettings}>
          <div className="form-grid-two">
            <div className="form-field">
              <label htmlFor="business-name">Nombre del negocio</label>
              <input
                id="business-name"
                onChange={(event) =>
                  updateSetting("businessName", event.target.value)
                }
                required
                value={settings.businessName}
              />
            </div>
            <div className="form-field">
              <label htmlFor="business-currency">Moneda</label>
              <select
                id="business-currency"
                onChange={(event) => updateSetting("currency", event.target.value)}
                value={settings.currency}
              >
                <option value="MXN">Peso mexicano (MXN)</option>
                <option value="USD">Dólar estadounidense (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="COP">Peso colombiano (COP)</option>
              </select>
            </div>
          </div>
          <div>
            <p className="settings-section-label">Horario de atención</p>
            <div className="form-grid-two">
              <div className="form-field">
                <label htmlFor="opening-time">Apertura</label>
                <input
                  id="opening-time"
                  onChange={(event) =>
                    updateSetting("openingTime", event.target.value)
                  }
                  required
                  type="time"
                  value={settings.openingTime}
                />
              </div>
              <div className="form-field">
                <label htmlFor="closing-time">Cierre</label>
                <input
                  id="closing-time"
                  onChange={(event) =>
                    updateSetting("closingTime", event.target.value)
                  }
                  required
                  type="time"
                  value={settings.closingTime}
                />
              </div>
            </div>
          </div>
          <div className="settings-notifications">
            <div>
              <h3>Notificaciones automáticas</h3>
              <p>Elige qué avisos quieres ver en el panel.</p>
            </div>
            <label className="toggle-setting">
              <span>
                <strong>Membresías por vencer</strong>
                <small>Aviso antes de la fecha de vencimiento</small>
              </span>
              <input
                checked={settings.notifyExpiringMemberships}
                onChange={(event) =>
                  updateSetting(
                    "notifyExpiringMemberships",
                    event.target.checked,
                  )
                }
                type="checkbox"
              />
            </label>
            <label className="toggle-setting">
              <span>
                <strong>Pagos registrados</strong>
                <small>Aviso cuando se registra un pago nuevo</small>
              </span>
              <input
                checked={settings.notifyPayments}
                onChange={(event) =>
                  updateSetting("notifyPayments", event.target.checked)
                }
                type="checkbox"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button className="primary-button" type="submit">
              <Icon name="check" size={16} />
              Guardar configuración
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
