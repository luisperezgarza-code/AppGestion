import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { useLocalStorageState } from "./useLocalStorageState";
import type { ToastType } from "./Toast";
import { api, apiMode } from "../services/api";
import { exportReport, type ExportFormat } from "../services/export";

type MemberStatus = "Activo" | "Inactivo" | "Pendiente de Pago";

type Member = {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  expiryDate: string;
  status: MemberStatus;
};

const initialMembers: Member[] = [
  {
    id: 1,
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "55 1234 5678",
    plan: "Premium",
    expiryDate: "2026-12-15",
    status: "Activo",
  },
  {
    id: 2,
    name: "Carlos Ramírez",
    email: "carlos.ramirez@email.com",
    phone: "55 8765 4321",
    plan: "Básico",
    expiryDate: "2026-11-28",
    status: "Pendiente de Pago",
  },
  {
    id: 3,
    name: "Ana López",
    email: "ana.lopez@email.com",
    phone: "55 2468 1357",
    plan: "Anual",
    expiryDate: "2027-03-10",
    status: "Activo",
  },
  {
    id: 4,
    name: "Jorge Pérez",
    email: "jorge.perez@email.com",
    phone: "55 3691 2468",
    plan: "Premium",
    expiryDate: "2026-10-30",
    status: "Inactivo",
  },
  {
    id: 5,
    name: "Valentina Cruz",
    email: "valentina.cruz@email.com",
    phone: "55 1122 3344",
    plan: "Básico",
    expiryDate: "2026-12-02",
    status: "Activo",
  },
  {
    id: 6,
    name: "Diego Torres",
    email: "diego.torres@email.com",
    phone: "55 5566 7788",
    plan: "Premium",
    expiryDate: "2026-11-20",
    status: "Pendiente de Pago",
  },
];

const emptyMember: Omit<Member, "id" | "status"> = {
  name: "",
  email: "",
  phone: "",
  plan: "Básico",
  expiryDate: "",
};

const statusClass: Record<MemberStatus, string> = {
  Activo: "status-active",
  Inactivo: "status-inactive",
  "Pendiente de Pago": "status-pending",
};

function isMemberArray(value: unknown): value is Member[] {
  return (
    Array.isArray(value) &&
    value.every(
      (member) =>
        typeof member === "object" &&
        member !== null &&
        typeof member.id === "number" &&
        typeof member.name === "string" &&
        typeof member.email === "string" &&
        typeof member.phone === "string" &&
        typeof member.plan === "string" &&
        typeof member.expiryDate === "string" &&
        (member.status === "Activo" ||
          member.status === "Inactivo" ||
          member.status === "Pendiente de Pago"),
    )
  );
}

function formatDate(date: string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function Members({
  onNotify,
  searchTerm = "",
}: {
  onNotify: (message: string, type?: ToastType) => void;
  searchTerm?: string;
}) {
  const [members, setMembers] = useLocalStorageState(
    "appgestion.members",
    apiMode === "local" ? initialMembers : [],
    isMemberArray,
    onNotify,
    apiMode === "local",
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    if (apiMode !== "remote") return;
    let active = true;
    api.members
      .list()
      .then((data) => {
        if (active) setMembers(data);
      })
      .catch((error: unknown) =>
        onNotify(
          error instanceof Error ? error.message : "No se pudieron cargar miembros.",
          "error",
        ),
      );
    return () => {
      active = false;
    };
  }, [onNotify, setMembers]);

  useEffect(() => {
    setSearch(searchTerm);
  }, [searchTerm]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLocaleLowerCase("es-MX").includes(query) ||
        member.email.toLocaleLowerCase("es-MX").includes(query);
      const matchesStatus =
        statusFilter === "Todos los estados" || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const openNewForm = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const openEditForm = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const saveMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const memberData = {
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      phone: String(formData.get("phone")).trim(),
      plan: String(formData.get("plan")),
      expiryDate: String(formData.get("expiryDate")),
    };

    try {
      if (editingMember) {
        const updated = { ...editingMember, ...memberData };
        if (apiMode === "remote") {
          await api.members.update(editingMember.id, memberData);
        }
        setMembers((current) =>
          current.map((member) =>
            member.id === editingMember.id ? updated : member,
          ),
        );
        onNotify("Los datos del miembro se actualizaron correctamente.");
      } else {
        const member =
          apiMode === "remote"
            ? await api.members.create({ ...memberData, status: "Activo" })
            : { id: Date.now(), ...memberData, status: "Activo" as const };
        setMembers((current) => [member, ...current]);
        onNotify("El nuevo miembro se registró correctamente.");
      }
      closeForm();
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo guardar el miembro.",
        "error",
      );
    }
  };

  const toggleMemberStatus = async (member: Member) => {
    const nextStatus: MemberStatus =
      member.status === "Activo" ? "Inactivo" : "Activo";
    try {
      if (apiMode === "remote") {
        await api.members.update(member.id, { status: nextStatus });
      }
    setMembers((current) =>
      current.map((item) =>
        item.id === member.id ? { ...item, status: nextStatus } : item,
      ),
    );
    onNotify(`Estado de ${member.name}: ${nextStatus}.`);
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo cambiar el estado.",
        "error",
      );
    }
  };

  const deleteMember = async (member: Member) => {
    try {
      if (apiMode === "remote") await api.members.remove(member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      onNotify(`${member.name} se eliminó de la lista.`);
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo eliminar al miembro.",
        "error",
      );
    }
  };

  const exportMembers = (format: ExportFormat) => {
    exportReport(
      "miembros-appgestion",
      ["Nombre", "Correo", "Teléfono", "Plan", "Vencimiento", "Estado"],
      members.map((member) => [
        member.name,
        member.email,
        member.phone,
        member.plan,
        formatDate(member.expiryDate),
        member.status,
      ]),
      format,
    );
    setIsExportOpen(false);
    onNotify(`Se exportó el reporte de miembros a ${format.toUpperCase()}.`);
  };

  return (
    <section className="module-page">
      <div className="module-heading">
        <div>
          <p className="eyebrow">ADMINISTRACIÓN</p>
          <h1>Miembros</h1>
          <p className="module-description">
            Administra las membresías y la información de tus clientes.
          </p>
        </div>
        <div className="module-heading-actions">
          <div className="export-menu-wrap">
            <button
              aria-expanded={isExportOpen}
              className="secondary-button export-trigger"
              onClick={() => setIsExportOpen((open) => !open)}
              type="button"
            >
              Exportar
              <span className="filter-chevron" />
            </button>
            {isExportOpen && (
              <div className="export-menu">
                <button onClick={() => exportMembers("csv")} type="button">
                  Descargar CSV
                </button>
                <button onClick={() => exportMembers("excel")} type="button">
                  Descargar Excel
                </button>
              </div>
            )}
          </div>
          <button className="primary-button" onClick={openNewForm} type="button">
            <Icon name="plus" size={17} />
            Registrar nuevo miembro
          </button>
        </div>
      </div>

      <div className="module-summary-row">
        <span className="module-count">
          <strong>{members.length}</strong> miembros registrados
        </span>
        <span className="module-count-secondary">
          {members.filter((member) => member.status === "Activo").length} activos
        </span>
      </div>

      <section aria-label="Lista de miembros" className="panel data-panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Icon name="search" size={17} />
            <input
              aria-label="Buscar por nombre o correo"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o correo..."
              type="search"
              value={search}
            />
          </label>
          <label className="filter-select-wrap">
            <span className="filter-label">Estado</span>
            <select
              aria-label="Filtrar por estado"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option>Todos los estados</option>
              <option>Activo</option>
              <option>Inactivo</option>
              <option>Pendiente de Pago</option>
            </select>
          </label>
        </div>

        <div className="table-scroll">
          <table className="data-table members-table">
            <thead>
              <tr>
                <th>MIEMBRO</th>
                <th>TELÉFONO</th>
                <th>PLAN</th>
                <th>VENCIMIENTO</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="table-person">
                      <span className="table-avatar">
                        {member.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <span className="table-person-copy">
                        <strong>{member.name}</strong>
                        <span>{member.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="muted-cell">{member.phone}</td>
                  <td>
                    <span className="plan-label">{member.plan}</span>
                  </td>
                  <td className="muted-cell">{formatDate(member.expiryDate)}</td>
                  <td>
                    <div className="member-status-control">
                      <button
                        aria-label={
                          member.status === "Activo"
                            ? `Desactivar ${member.name}`
                            : `Activar ${member.name}`
                        }
                        aria-pressed={member.status === "Activo"}
                        className={`member-toggle transition-all duration-300 ${
                          member.status === "Activo" ? "is-active" : ""
                        }`}
                        onClick={() => toggleMemberStatus(member)}
                        title={
                          member.status === "Activo"
                            ? "Desactivar miembro"
                            : "Activar miembro"
                        }
                        type="button"
                      >
                        <span className="member-toggle-track">
                          <span className="member-toggle-thumb" />
                        </span>
                        <span className="member-toggle-label">
                          {member.status === "Activo" ? "Activo" : "Inactivo"}
                        </span>
                      </button>
                      {member.status === "Pendiente de Pago" && (
                        <span className={`status-badge ${statusClass[member.status]}`}>
                          <span />
                          Pendiente de Pago
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        aria-label={`Editar ${member.name}`}
                        className="row-action"
                        onClick={() => openEditForm(member)}
                        title="Editar miembro"
                        type="button"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        aria-label={`Eliminar ${member.name}`}
                        className="row-action row-action-danger"
                        onClick={() => deleteMember(member)}
                        title="Eliminar miembro"
                        type="button"
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td className="empty-table" colSpan={6}>
                    No se encontraron miembros con esos criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          Mostrando <strong>{filteredMembers.length}</strong> de{" "}
          <strong>{members.length}</strong> miembros
        </div>
      </section>

      {isFormOpen && (
        <div className="modal-backdrop" onMouseDown={closeForm}>
          <section
            aria-labelledby="member-form-title"
            aria-modal="true"
            className="form-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">GESTIÓN DE MIEMBROS</p>
                <h2 id="member-form-title">
                  {editingMember ? "Editar miembro" : "Registrar nuevo miembro"}
                </h2>
              </div>
              <button
                aria-label="Cerrar formulario"
                className="modal-close"
                onClick={closeForm}
                type="button"
              >
                <Icon name="close" size={19} />
              </button>
            </div>
            <form className="module-form" onSubmit={saveMember}>
              <div className="form-field">
                <label htmlFor="member-name">Nombre completo</label>
                <input
                  autoFocus
                  defaultValue={editingMember?.name ?? emptyMember.name}
                  id="member-name"
                  name="name"
                  placeholder="Ej. Daniela Hernández"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="member-email">Correo electrónico</label>
                <input
                  defaultValue={editingMember?.email ?? emptyMember.email}
                  id="member-email"
                  name="email"
                  placeholder="nombre@correo.com"
                  required
                  type="email"
                />
              </div>
              <div className="form-field">
                <label htmlFor="member-phone">Teléfono</label>
                <input
                  defaultValue={editingMember?.phone ?? emptyMember.phone}
                  id="member-phone"
                  name="phone"
                  placeholder="55 1234 5678"
                  required
                  type="tel"
                />
              </div>
              <div className="form-grid-two">
                <div className="form-field">
                  <label htmlFor="member-plan">Plan de membresía</label>
                  <select
                    defaultValue={editingMember?.plan ?? emptyMember.plan}
                    id="member-plan"
                    name="plan"
                  >
                    <option>Básico</option>
                    <option>Premium</option>
                    <option>Anual</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="member-expiry">Fecha de vencimiento</label>
                  <input
                    defaultValue={
                      editingMember?.expiryDate ?? emptyMember.expiryDate
                    }
                    id="member-expiry"
                    name="expiryDate"
                    required
                    type="date"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="secondary-button" onClick={closeForm} type="button">
                  Cancelar
                </button>
                <button className="primary-button" type="submit">
                  {editingMember ? "Guardar cambios" : "Registrar miembro"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
