import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { useLocalStorageState } from "./useLocalStorageState";
import type { ToastType } from "./Toast";
import { api, apiMode } from "../services/api";

type Availability = "Disponible" | "En sesión" | "Fuera de horario";

type Trainer = {
  id: number | string;
  name: string;
  email: string;
  specialty: string;
  schedule: string;
  availability: Availability;
  initials: string;
  color: string;
};

const initialTrainers: Trainer[] = [
  {
    id: 1,
    name: "Diego Ruiz",
    email: "diego.ruiz@appgestion.mx",
    specialty: "Entrenamiento funcional",
    schedule: "Lun – Vie · 7:00 AM – 3:00 PM",
    availability: "Disponible",
    initials: "DR",
    color: "lavender",
  },
  {
    id: 2,
    name: "Sofía Martínez",
    email: "sofia.martinez@appgestion.mx",
    specialty: "Yoga y movilidad",
    schedule: "Lun – Vie · 9:00 AM – 5:00 PM",
    availability: "En sesión",
    initials: "SM",
    color: "peach",
  },
  {
    id: 3,
    name: "Andrés Castillo",
    email: "andres.castillo@appgestion.mx",
    specialty: "Fuerza y acondicionamiento",
    schedule: "Mar – Sáb · 12:00 PM – 8:00 PM",
    availability: "Disponible",
    initials: "AC",
    color: "sky",
  },
  {
    id: 4,
    name: "Laura Méndez",
    email: "laura.mendez@appgestion.mx",
    specialty: "Pilates",
    schedule: "Lun – Jue · 8:00 AM – 4:00 PM",
    availability: "Fuera de horario",
    initials: "LM",
    color: "mint",
  },
];

const availabilityClass: Record<Availability, string> = {
  Disponible: "status-active",
  "En sesión": "availability-busy",
  "Fuera de horario": "status-inactive",
};

function isTrainerArray(value: unknown): value is Trainer[] {
  return (
    Array.isArray(value) &&
    value.every(
      (trainer) =>
        typeof trainer === "object" &&
        trainer !== null &&
        typeof trainer.id === "number" &&
        typeof trainer.name === "string" &&
        typeof trainer.email === "string" &&
        typeof trainer.specialty === "string" &&
        typeof trainer.schedule === "string" &&
        typeof trainer.initials === "string" &&
        typeof trainer.color === "string" &&
        (trainer.availability === "Disponible" ||
          trainer.availability === "En sesión" ||
          trainer.availability === "Fuera de horario"),
    )
  );
}

export default function Staff({
  onNotify,
}: {
  onNotify: (message: string, type?: ToastType) => void;
}) {
  const [trainers, setTrainers] = useLocalStorageState(
    "appgestion.trainers",
    apiMode === "local" ? initialTrainers : [],
    isTrainerArray,
    onNotify,
    apiMode === "local",
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  useEffect(() => {
    if (apiMode !== "remote") return;
    let active = true;
    api.staff
      .list()
      .then((data) => {
        if (active) setTrainers(data);
      })
      .catch((error: unknown) =>
        onNotify(
          error instanceof Error ? error.message : "No se pudo cargar el personal.",
          "error",
        ),
      );
    return () => {
      active = false;
    };
  }, [onNotify, setTrainers]);

  const addTrainer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const availability = String(
      formData.get("availability"),
    ) as Availability;
    const trainerData = {
      name,
      email: String(formData.get("email")).trim(),
      specialty: String(formData.get("specialty")).trim(),
      schedule: String(formData.get("schedule")).trim(),
      availability,
      initials: name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toLocaleUpperCase("es-MX") ?? "")
        .join(""),
      color: "lavender",
    };
    try {
      const trainer =
        apiMode === "remote"
          ? await api.staff.create(trainerData)
          : { id: Date.now(), ...trainerData };
      setTrainers((current) => [trainer, ...current]);
      setIsFormOpen(false);
      onNotify("El entrenador se agregó correctamente.");
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo agregar el entrenador.",
        "error",
      );
    }
  };

  const deleteTrainer = async (trainer: Trainer) => {
    try {
      if (apiMode === "remote") await api.staff.remove(trainer.id);
      setTrainers((current) => current.filter((item) => item.id !== trainer.id));
      onNotify(`${trainer.name} se eliminó del personal.`);
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo eliminar al entrenador.",
        "error",
      );
    }
  };

  return (
    <section className="module-page">
      <div className="module-heading">
        <div>
          <p className="eyebrow">ADMINISTRACIÓN</p>
          <h1>Personal y entrenadores</h1>
          <p className="module-description">
            Organiza tu equipo y consulta sus horarios y disponibilidad.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setIsFormOpen(true)}
          type="button"
        >
          <Icon name="user-plus" size={17} />
          Agregar entrenador
        </button>
      </div>

      <div className="staff-summary-row">
        <div className="staff-summary-item">
          <span className="staff-summary-icon staff-icon-violet">
            <Icon name="staff" size={18} />
          </span>
          <span>
            <strong>{trainers.length}</strong>
            <small>Entrenadores</small>
          </span>
        </div>
        <span className="staff-summary-separator" />
        <div className="staff-summary-item">
          <span className="staff-availability-dot" />
          <span>
            <strong>
              {
                trainers.filter(
                  (trainer) => trainer.availability === "Disponible",
                ).length
              }
            </strong>
            <small>Disponibles ahora</small>
          </span>
        </div>
      </div>

      <section aria-label="Lista de entrenadores" className="staff-grid">
        {trainers.map((trainer) => (
          <article className="panel trainer-card" key={trainer.id}>
            <div className="trainer-card-top">
              <span className={`trainer-avatar avatar-${trainer.color}`}>
                {trainer.initials}
              </span>
              <span className="trainer-card-actions">
                <span
                  className={`status-badge ${availabilityClass[trainer.availability]}`}
                >
                  <span />
                  {trainer.availability}
                </span>
                <button
                  aria-label={`Eliminar a ${trainer.name}`}
                  className="row-action row-action-danger"
                  onClick={() => deleteTrainer(trainer)}
                  title="Eliminar entrenador"
                  type="button"
                >
                  <Icon name="delete" size={16} />
                </button>
              </span>
            </div>
            <h2>{trainer.name}</h2>
            <p className="trainer-email">{trainer.email}</p>
            <div className="trainer-specialty">
              <span className="trainer-detail-label">ESPECIALIDAD</span>
              <strong>{trainer.specialty}</strong>
            </div>
            <div className="trainer-schedule">
              <Icon name="clock" size={16} />
              <span>{trainer.schedule}</span>
            </div>
          </article>
        ))}
      </section>

      {isFormOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setIsFormOpen(false)}
        >
          <section
            aria-labelledby="trainer-form-title"
            aria-modal="true"
            className="form-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">GESTIÓN DE PERSONAL</p>
                <h2 id="trainer-form-title">Agregar nuevo entrenador</h2>
              </div>
              <button
                aria-label="Cerrar formulario"
                className="modal-close"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                <Icon name="close" size={19} />
              </button>
            </div>
            <form className="module-form" onSubmit={addTrainer}>
              <div className="form-field">
                <label htmlFor="trainer-name">Nombre completo</label>
                <input
                  autoFocus
                  id="trainer-name"
                  name="name"
                  placeholder="Ej. Daniela Hernández"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="trainer-email">Correo electrónico</label>
                <input
                  id="trainer-email"
                  name="email"
                  placeholder="nombre@appgestion.mx"
                  required
                  type="email"
                />
              </div>
              <div className="form-field">
                <label htmlFor="trainer-specialty">Especialidad</label>
                <input
                  id="trainer-specialty"
                  name="specialty"
                  placeholder="Ej. Entrenamiento funcional"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="trainer-schedule">Horario asignado</label>
                <input
                  id="trainer-schedule"
                  name="schedule"
                  placeholder="Ej. Lun – Vie · 8:00 AM – 4:00 PM"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="trainer-availability">Disponibilidad</label>
                <select
                  defaultValue="Disponible"
                  id="trainer-availability"
                  name="availability"
                >
                  <option>Disponible</option>
                  <option>En sesión</option>
                  <option>Fuera de horario</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setIsFormOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button className="primary-button" type="submit">
                  <Icon name="user-plus" size={16} />
                  Agregar entrenador
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
