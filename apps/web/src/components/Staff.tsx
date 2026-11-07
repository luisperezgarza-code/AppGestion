import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { useLocalStorageState } from "./useLocalStorageState";
import type { ToastType } from "./Toast";
import { api, apiMode } from "../services/api";

type Availability =
  | "Disponible"
  | "Vacaciones"
  | "Incapacidad"
  | "Fuera de servicio";
type LegacyAvailability = "En sesión" | "Fuera de horario";

type Trainer = {
  id: number | string;
  name: string;
  email: string;
  specialty: string;
  schedule: string;
  availability: Availability | LegacyAvailability;
  initials: string;
  color: string;
};

type Shift = "morning" | "afternoon" | "custom";

const weekDays = [
  { value: "Lun", label: "Lunes" },
  { value: "Mar", label: "Martes" },
  { value: "Mié", label: "Miércoles" },
  { value: "Jue", label: "Jueves" },
  { value: "Vie", label: "Viernes" },
  { value: "Sáb", label: "Sábado" },
  { value: "Dom", label: "Domingo" },
];

function timeTo24Hour(value: string, meridiem?: string) {
  const [hoursText, minutes] = value.split(":");
  let hours = Number(hoursText);
  if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function scheduleFields(schedule?: string) {
  if (!schedule) {
    return {
      days: ["Lun", "Mar", "Mié", "Jue", "Vie"],
      start: "06:00",
      end: "14:00",
    };
  }
  const [daysText = "", timeText = ""] = schedule.split("·");
  const matches = [...daysText.matchAll(/Lun|Mar|Mié|Jue|Vie|Sáb|Dom/g)].map(
    ([day]) => day,
  );
  let days = [...new Set(matches)];
  if (days.length === 2 && /[–-]/.test(daysText)) {
    const first = weekDays.findIndex((day) => day.value === days[0]);
    const last = weekDays.findIndex((day) => day.value === days[1]);
    if (first >= 0 && last >= first) {
      days = weekDays.slice(first, last + 1).map((day) => day.value);
    }
  }
  const times = [...timeText.matchAll(/(\d{1,2}:\d{2})\s*(AM|PM)?/gi)];
  return {
    days: days.length ? days : ["Lun", "Mar", "Mié", "Jue", "Vie"],
    start: times[0] ? timeTo24Hour(times[0][1], times[0][2]) : "06:00",
    end: times[1] ? timeTo24Hour(times[1][1], times[1][2]) : "14:00",
  };
}

function formatSchedule(days: string[], start: string, end: string) {
  const orderedDays = weekDays
    .filter((day) => days.includes(day.value))
    .map((day) => day.value);
  return `${orderedDays.join(", ")} · ${start} – ${end}`;
}

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
    availability: "Vacaciones",
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
    availability: "Fuera de servicio",
    initials: "LM",
    color: "mint",
  },
];

const availabilityClass: Record<Availability, string> = {
  Disponible: "status-active",
  Vacaciones: "availability-vacation",
  Incapacidad: "availability-leave",
  "Fuera de servicio": "status-inactive",
};

function currentAvailability(value: Trainer["availability"]): Availability {
  if (value === "En sesión") return "Disponible";
  if (value === "Fuera de horario") return "Fuera de servicio";
  return value;
}

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
          trainer.availability === "Vacaciones" ||
          trainer.availability === "Incapacidad" ||
          trainer.availability === "Fuera de servicio" ||
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
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [shift, setShift] = useState<Shift>("morning");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("14:00");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Lun",
    "Mar",
    "Mié",
    "Jue",
    "Vie",
  ]);
  const [isSavingTrainer, setIsSavingTrainer] = useState(false);
  useEffect(() => {
    setTrainers((current) => {
      if (
        current.every(
          (trainer) =>
            trainer.availability !== "En sesión" &&
            trainer.availability !== "Fuera de horario",
        )
      ) {
        return current;
      }
      return current.map((trainer) => ({
        ...trainer,
        availability: currentAvailability(trainer.availability),
      }));
    });
  }, [setTrainers]);
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

  const openTrainerForm = (trainer?: Trainer) => {
    const schedule = scheduleFields(trainer?.schedule);
    setEditingTrainer(trainer ?? null);
    setSelectedDays(schedule.days);
    setStartTime(schedule.start);
    setEndTime(schedule.end);
    setShift(
      schedule.start === "06:00" && schedule.end === "14:00"
        ? "morning"
        : schedule.start === "14:00" && schedule.end === "22:00"
          ? "afternoon"
          : "custom",
    );
    setIsFormOpen(true);
  };

  const closeTrainerForm = () => {
    setIsFormOpen(false);
    setEditingTrainer(null);
  };

  const saveTrainer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const days = formData.getAll("days").map(String);
    if (!days.length || startTime >= endTime) {
      onNotify(
        !days.length
          ? "Selecciona al menos un día de trabajo."
          : "La hora de fin debe ser posterior a la hora de inicio.",
        "error",
      );
      return;
    }
    const password = String(formData.get("password") ?? "");
    const trainerData = {
      name,
      email: String(formData.get("email")).trim(),
      specialty: String(formData.get("specialty")).trim(),
      schedule: formatSchedule(days, startTime, endTime),
      availability: editingTrainer
        ? currentAvailability(editingTrainer.availability)
        : "Disponible" as const,
      initials: name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toLocaleUpperCase("es-MX") ?? "")
        .join(""),
      color: "lavender",
    };
    setIsSavingTrainer(true);
    try {
      if (editingTrainer) {
        const updated =
          apiMode === "remote"
            ? await api.staff.update(editingTrainer.id, {
                ...trainerData,
                ...(password ? { password } : {}),
              })
            : { ...editingTrainer, ...trainerData };
        setTrainers((current) =>
          current.map((item) =>
            item.id === editingTrainer.id ? updated : item,
          ),
        );
        onNotify("Los datos del entrenador se actualizaron.");
      } else {
        const trainer =
          apiMode === "remote"
            ? await api.staff.create({
                ...trainerData,
                ...(password ? { password } : {}),
              })
            : { id: Date.now(), ...trainerData };
        setTrainers((current) => [trainer, ...current]);
        onNotify("El entrenador se agregó correctamente.");
      }
      closeTrainerForm();
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo agregar el entrenador.",
        "error",
      );
    } finally {
      setIsSavingTrainer(false);
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

  const changeAvailability = async (
    trainer: Trainer,
    availability: Availability,
  ) => {
    try {
      const updated = await api.staff.update(trainer.id, { availability });
      setTrainers((current) =>
        current.map((item) =>
          item.id === trainer.id
            ? { ...item, availability: updated.availability }
            : item,
        ),
      );
      onNotify(`Disponibilidad de ${trainer.name} actualizada.`);
    } catch (error) {
      onNotify(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la disponibilidad.",
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
          onClick={() => openTrainerForm()}
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
                <label
                  className={`status-badge trainer-status-control ${availabilityClass[currentAvailability(trainer.availability)]}`}
                >
                  <span />
                  <select
                    aria-label={`Cambiar disponibilidad de ${trainer.name}`}
                    className="trainer-status-select"
                    onChange={(event) =>
                      changeAvailability(
                        trainer,
                        event.target.value as Availability,
                      )
                    }
                    value={currentAvailability(trainer.availability)}
                  >
                    <option>Disponible</option>
                    <option>Vacaciones</option>
                    <option>Incapacidad</option>
                    <option>Fuera de servicio</option>
                  </select>
                </label>
                <button
                  aria-label={`Editar a ${trainer.name}`}
                  className="row-action"
                  onClick={() => openTrainerForm(trainer)}
                  title="Editar entrenador"
                  type="button"
                >
                  <Icon name="edit" size={16} />
                </button>
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
          onMouseDown={closeTrainerForm}
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
                <h2 id="trainer-form-title">
                  {editingTrainer ? "Editar entrenador" : "Agregar nuevo entrenador"}
                </h2>
              </div>
              <button
                aria-label="Cerrar formulario"
                className="modal-close"
                onClick={closeTrainerForm}
                type="button"
              >
                <Icon name="close" size={19} />
              </button>
            </div>
            <form className="module-form" onSubmit={saveTrainer}>
              <div className="form-field">
                <label htmlFor="trainer-name">Nombre completo</label>
                <input
                  autoFocus
                  id="trainer-name"
                  name="name"
                  placeholder="Ej. Daniela Hernández"
                  required
                  defaultValue={editingTrainer?.name ?? ""}
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
                  defaultValue={editingTrainer?.email ?? ""}
                />
              </div>
              <div className="form-field">
                <label htmlFor="trainer-specialty">Especialidad</label>
                <input
                  id="trainer-specialty"
                  name="specialty"
                  placeholder="Ej. Entrenamiento funcional"
                  required
                  defaultValue={editingTrainer?.specialty ?? ""}
                />
              </div>
              {apiMode === "remote" && (
                <div className="form-field">
                  <label htmlFor="trainer-password">
                    Contraseña de acceso (opcional)
                  </label>
                  <input
                    autoComplete="new-password"
                    id="trainer-password"
                    maxLength={72}
                    minLength={10}
                    name="password"
                    placeholder="Mínimo 10 caracteres"
                    type="password"
                  />
                  <small>
                    Al guardarla, crea o actualiza el acceso del entrenador.
                  </small>
                </div>
              )}
              <div className="form-field">
                <label htmlFor="trainer-shift">Turno asignado</label>
                <select
                  id="trainer-shift"
                  onChange={(event) => {
                    const value = event.target.value as Shift;
                    setShift(value);
                    if (value === "morning") {
                      setStartTime("06:00");
                      setEndTime("14:00");
                    } else if (value === "afternoon") {
                      setStartTime("14:00");
                      setEndTime("22:00");
                    }
                  }}
                  value={shift}
                >
                  <option value="morning">Matutino: 06:00 - 14:00</option>
                  <option value="afternoon">Vespertino: 14:00 - 22:00</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div className="schedule-time-grid">
                <div className="form-field">
                  <label htmlFor="trainer-start-time">Hora de inicio</label>
                  <input
                    id="trainer-start-time"
                    onChange={(event) => {
                      setStartTime(event.target.value);
                      setShift("custom");
                    }}
                    required
                    type="time"
                    value={startTime}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="trainer-end-time">Hora de fin</label>
                  <input
                    id="trainer-end-time"
                    onChange={(event) => {
                      setEndTime(event.target.value);
                      setShift("custom");
                    }}
                    required
                    type="time"
                    value={endTime}
                  />
                </div>
              </div>
              <fieldset className="schedule-days-field">
                <legend>Días de la semana</legend>
                <div className="schedule-days-grid">
                  {weekDays.map((day) => (
                    <label className="schedule-day-option" key={day.value}>
                      <input
                        checked={selectedDays.includes(day.value)}
                        name="days"
                        onChange={(event) =>
                          setSelectedDays((current) =>
                            event.target.checked
                              ? [...current, day.value]
                              : current.filter((value) => value !== day.value),
                          )
                        }
                        type="checkbox"
                        value={day.value}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={closeTrainerForm}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="primary-button"
                  disabled={isSavingTrainer}
                  type="submit"
                >
                  <Icon
                    name={editingTrainer ? "check" : "user-plus"}
                    size={16}
                  />
                  {isSavingTrainer
                    ? "Guardando..."
                    : editingTrainer
                      ? "Guardar cambios"
                      : "Agregar entrenador"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
