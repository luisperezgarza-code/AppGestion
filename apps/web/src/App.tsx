import { useCallback, useEffect, useState, type ReactNode } from "react";
import Account from "./components/Account";
import Auth from "./components/Auth/Auth";
import Finance from "./components/Finance";
import { Toast, type ToastNotification, type ToastType } from "./components/Toast";
import Members from "./components/Members";
import Settings from "./components/Settings";
import Staff from "./components/Staff";
import "./components/modules.css";
import {
  api,
  apiMode,
  type AppUser,
  type MemberRecord,
  type Session,
  type TransactionRecord,
} from "./services/api";

type IconName =
  | "overview"
  | "members"
  | "staff"
  | "finance"
  | "profile"
  | "settings"
  | "logout"
  | "menu"
  | "search"
  | "bell"
  | "arrow-up"
  | "arrow-down"
  | "calendar"
  | "more"
  | "plus"
  | "clock"
  | "check"
  | "moon"
  | "sun";

type SectionId =
  | "overview"
  | "members"
  | "staff"
  | "finance"
  | "profile"
  | "settings";

function roleLabel(role: AppUser["role"]) {
  switch (role) {
    case "receptionist":
      return "Recepcionista";
    case "trainer":
      return "Entrenador";
    default:
      return "Propietario";
  }
}

function roleModeLabel(role: AppUser["role"]) {
  return role === "owner" ? "Modo Administrador" : `Modo ${roleLabel(role)}`;
}

const icons: Record<IconName, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  members: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  staff: (
    <>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
      <path d="M3 8V5a2 2 0 0 1 2-2h3v4H5v2H3Zm18 0V5a2 2 0 0 0-2-2h-3v4h3v2h2ZM3 16v3a2 2 0 0 0 2 2h3v-4H5v-2H3Zm18 0v3a2 2 0 0 1-2 2h-3v-4h3v-2h2Z" />
    </>
  ),
  finance: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
  settings: (
    <>
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" />
    </>
  ),
  logout: (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  "arrow-up": (
    <>
      <path d="m7 14 5-5 5 5" />
      <path d="M12 19V9" />
    </>
  ),
  "arrow-down": (
    <>
      <path d="m7 10 5 5 5-5" />
      <path d="M12 5v10" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4L19 6" />
    </>
  ),
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </>
  ),
};

function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

const primaryNavigation: {
  id: SectionId;
  label: string;
  icon: IconName;
}[] = [
  { id: "overview", label: "Resumen", icon: "overview" },
  { id: "members", label: "Miembros", icon: "members" },
  { id: "staff", label: "Personal", icon: "staff" },
  { id: "finance", label: "Finanzas", icon: "finance" },
];

const secondaryNavigation: {
  id: SectionId;
  label: string;
  icon: IconName;
}[] = [
  { id: "profile", label: "Mi cuenta", icon: "profile" },
  { id: "settings", label: "Configuración", icon: "settings" },
];

const sectionContent: Record<
  Exclude<SectionId, "overview">,
  { title: string; description: string; icon: IconName; action: string }
> = {
  members: {
    title: "Miembros",
    description:
      "Administra las membresías, revisa el estado de tus clientes y da seguimiento a su actividad.",
    icon: "members",
    action: "Agregar miembro",
  },
  staff: {
    title: "Personal y entrenadores",
    description:
      "Consulta a tu equipo, organiza responsabilidades y mantén la información del personal al día.",
    icon: "staff",
    action: "Agregar personal",
  },
  finance: {
    title: "Finanzas",
    description:
      "Controla los ingresos, pagos pendientes y el desempeño financiero de tu negocio.",
    icon: "finance",
    action: "Registrar pago",
  },
  profile: {
    title: "Mi cuenta",
    description:
      "Administra tu información personal y las preferencias de tu cuenta.",
    icon: "profile",
    action: "Editar perfil",
  },
  settings: {
    title: "Configuración del sistema",
    description:
      "Personaliza las preferencias de tu negocio y la experiencia de administración.",
    icon: "settings",
    action: "Guardar cambios",
  },
};

const metrics: {
  label: string;
  value: string;
  change: string;
  direction: "up" | "down";
  icon: IconName;
  tone: string;
}[] = [
  {
    label: "Miembros activos",
    value: "1,284",
    change: "12.8%",
    direction: "up",
    icon: "members",
    tone: "violet",
  },
  {
    label: "Nuevos este mes",
    value: "86",
    change: "8.2%",
    direction: "up",
    icon: "plus",
    tone: "blue",
  },
  {
    label: "Ingresos del mes",
    value: "$28,450",
    change: "4.3%",
    direction: "up",
    icon: "finance",
    tone: "green",
  },
  {
    label: "Pagos pendientes",
    value: "24",
    change: "2.1%",
    direction: "down",
    icon: "clock",
    tone: "orange",
  },
];

const activities = [
  {
    initials: "MG",
    name: "María González",
    detail: "Nueva membresía mensual",
    time: "Hace 12 min",
    tone: "lavender",
  },
  {
    initials: "CR",
    name: "Carlos Ramírez",
    detail: "Renovó su membresía",
    time: "Hace 48 min",
    tone: "peach",
  },
  {
    initials: "AL",
    name: "Ana López",
    detail: "Completó un pago",
    time: "Hace 2 horas",
    tone: "mint",
  },
  {
    initials: "JP",
    name: "Jorge Pérez",
    detail: "Se registró como miembro",
    time: "Hace 3 horas",
    tone: "sky",
  },
];

function Sidebar({
  activeSection,
  onNavigate,
  isOpen,
  onClose,
  user,
  onLogout,
}: {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
  onLogout: () => void;
}) {
  const renderNavigation = (
    items: { id: SectionId; label: string; icon: IconName }[],
  ) =>
    items.map((item) => (
      <button
        className={`sidebar-link${activeSection === item.id ? " active" : ""}`}
        key={item.id}
        onClick={() => onNavigate(item.id)}
        type="button"
      >
        <Icon name={item.icon} size={19} />
        <span>{item.label}</span>
        {item.id === "finance" && <span className="nav-indicator" />}
      </button>
    ));

  return (
    <>
      {isOpen && (
        <button
          aria-label="Cerrar menú"
          className="sidebar-backdrop"
          onClick={onClose}
          type="button"
        />
      )}
      <aside className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
        <div className="brand">
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
          <button
            aria-label="Cerrar menú"
            className="sidebar-close"
            onClick={onClose}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>

        <div className="admin-badge">
          <span className="admin-badge-dot" />
          {roleModeLabel(user.role)}
        </div>

        <nav aria-label="Navegación principal" className="sidebar-navigation">
          <p className="nav-label">MENÚ PRINCIPAL</p>
          {renderNavigation(primaryNavigation)}
        </nav>

        <div className="sidebar-bottom">
          <p className="nav-label">PREFERENCIAS</p>
          {renderNavigation(secondaryNavigation)}
          <div className="sidebar-user">
            {user.avatar ? (
              <img alt="" className="avatar sidebar-avatar-image" src={user.avatar} />
            ) : (
              <div className="avatar avatar-owner">
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0] ?? "")
                  .join("")
                  .toLocaleUpperCase("es-MX")}
              </div>
            )}
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{roleLabel(user.role)}</span>
            </div>
            <button
              aria-label="Cerrar sesión"
              className="sidebar-user-logout"
              onClick={onLogout}
              title="Cerrar sesión"
              type="button"
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function MetricCard({
  label,
  value,
  change,
  direction,
  icon,
  tone,
}: (typeof metrics)[number]) {
  return (
    <article className="metric-card">
      <div className="metric-card-top">
        <span className={`metric-icon metric-icon-${tone}`}>
          <Icon name={icon} size={19} />
        </span>
        <span
          className={`metric-change ${direction === "down" ? "change-down" : ""}`}
        >
          <Icon
            name={direction === "up" ? "arrow-up" : "arrow-down"}
            size={14}
          />
          {change}
        </span>
      </div>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-footnote">
        <span>vs. mes anterior</span>
      </p>
    </article>
  );
}

function RevenueChart() {
  return (
    <div className="chart-wrap">
      <div className="chart-y-labels" aria-hidden="true">
        <span>$30k</span>
        <span>$20k</span>
        <span>$10k</span>
        <span>$0</span>
      </div>
      <svg
        aria-label="Gráfica de ingresos: tendencia ascendente durante la semana"
        className="revenue-chart"
        role="img"
        viewBox="0 0 660 220"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7764e8" stopOpacity=".2" />
            <stop offset="100%" stopColor="#7764e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="chart-grid"
          d="M0 20H660M0 78H660M0 136H660M0 194H660"
        />
        <path
          d="M0 160 C38 151 52 143 84 150 S135 132 166 138 S216 107 248 119 S298 97 330 111 S382 76 414 91 S465 71 496 79 S548 49 578 61 S626 36 660 42 V200 H0Z"
          fill="url(#chart-fill)"
        />
        <path
          className="chart-line"
          d="M0 160 C38 151 52 143 84 150 S135 132 166 138 S216 107 248 119 S298 97 330 111 S382 76 414 91 S465 71 496 79 S548 49 578 61 S626 36 660 42"
        />
        <circle className="chart-point" cx="660" cy="42" r="5" />
      </svg>
      <div className="chart-x-labels" aria-hidden="true">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
        <span>Dom</span>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">VISTA GENERAL</p>
          <h1>Resumen</h1>
          <p className="page-description">
            Aquí tienes lo que está pasando en tu negocio.
          </p>
        </div>
        <button className="date-filter" type="button">
          <Icon name="calendar" size={17} />
          <span>Últimos 7 días</span>
          <span className="filter-chevron" />
        </button>
      </div>

      <section aria-label="Métricas del negocio" className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Ingresos</h2>
              <p>Rendimiento de tu negocio</p>
            </div>
            <button aria-label="Más opciones de ingresos" className="icon-button" type="button">
              <Icon name="more" size={20} />
            </button>
          </div>
          <div className="revenue-summary">
            <span className="revenue-total">$28,450</span>
            <span className="metric-change">
              <Icon name="arrow-up" size={14} />
              12.5%
            </span>
            <span className="revenue-period">vs. semana anterior</span>
          </div>
          <RevenueChart />
        </article>

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Actividad reciente</h2>
              <p>Últimos movimientos de miembros</p>
            </div>
            <button aria-label="Más opciones de actividad" className="icon-button" type="button">
              <Icon name="more" size={20} />
            </button>
          </div>
          <div className="activity-list">
            {activities.map((activity) => (
              <div className="activity-item" key={activity.name}>
                <div className={`avatar avatar-${activity.tone}`}>
                  {activity.initials}
                </div>
                <div className="activity-info">
                  <span className="activity-name">{activity.name}</span>
                  <span className="activity-detail">{activity.detail}</span>
                </div>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
          <button className="text-link" type="button">
            Ver toda la actividad <span aria-hidden="true">→</span>
          </button>
        </article>
      </section>

      <section className="panel classes-panel">
        <div className="panel-heading">
          <div>
            <h2>Próximas clases</h2>
            <p>Lo que viene en tu agenda</p>
          </div>
          <button className="text-link" type="button">
            Ver calendario <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="class-list">
          <div className="class-item">
            <div className="class-time">
              <span>09:00</span>
              <span>AM</span>
            </div>
            <div className="class-color class-color-purple" />
            <div className="class-info">
              <span className="class-name">Entrenamiento funcional</span>
              <span className="class-meta">Sala principal · 12 miembros</span>
            </div>
            <div className="class-instructor">
              <div className="avatar avatar-sky">DR</div>
              <span>Diego Ruiz</span>
            </div>
            <span className="class-status">En 30 min</span>
          </div>
          <div className="class-item">
            <div className="class-time">
              <span>10:30</span>
              <span>AM</span>
            </div>
            <div className="class-color class-color-green" />
            <div className="class-info">
              <span className="class-name">Yoga para principiantes</span>
              <span className="class-meta">Estudio B · 8 miembros</span>
            </div>
            <div className="class-instructor">
              <div className="avatar avatar-peach">SM</div>
              <span>Sofía Martínez</span>
            </div>
            <span className="class-status status-upcoming">Próxima</span>
          </div>
        </div>
      </section>
    </>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const stored = window.localStorage.getItem("appgestion.session");
      if (!stored) return null;
      const value: unknown = JSON.parse(stored);
      if (
        typeof value === "object" &&
        value !== null &&
        "token" in value &&
        typeof value.token === "string" &&
        "user" in value &&
        typeof value.user === "object" &&
        value.user !== null &&
        "id" in value.user &&
        typeof value.user.id === "string" &&
        "name" in value.user &&
        typeof value.user.name === "string" &&
        "email" in value.user &&
        typeof value.user.email === "string"
      ) {
        return {
          token: value.token,
          user: {
            id: value.user.id,
            name: value.user.name,
            email: value.user.email,
            role:
              "role" in value.user &&
              (value.user.role === "owner" ||
                value.user.role === "receptionist" ||
                value.user.role === "trainer")
                ? value.user.role
                : "owner",
            phone:
              "phone" in value.user && typeof value.user.phone === "string"
                ? value.user.phone
                : undefined,
            avatar:
              "avatar" in value.user && typeof value.user.avatar === "string"
                ? value.user.avatar
                : undefined,
          },
        };
      }
      throw new Error("El formato de sesión guardada no es válido.");
    } catch (error) {
      console.error("No se pudo leer la sesión guardada.", error);
      return null;
    }
  });
  const [isCheckingSession, setIsCheckingSession] = useState(
    apiMode === "remote" && Boolean(session),
  );
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (apiMode !== "remote" || !session) return;
    api.auth
      .currentUser()
      .then((user) => {
        const validSession = { ...session, user };
        setSession(validSession);
        window.localStorage.setItem(
          "appgestion.session",
          JSON.stringify(validSession),
        );
      })
      .catch((error: unknown) => {
        console.error("No se pudo validar la sesión.", error);
        api.auth.logout();
        window.localStorage.removeItem("appgestion.session");
        setSession(null);
        setAuthError(
          error instanceof Error ? error.message : "La sesión expiró.",
        );
      })
      .finally(() => setIsCheckingSession(false));
  }, []);

  const handleAuthenticated = (newSession: Session) => {
    try {
      window.localStorage.setItem(
        "appgestion.session",
        JSON.stringify(newSession),
      );
      setSession(newSession);
      setAuthError("");
    } catch (error) {
      console.error("No se pudo guardar la sesión.", error);
      throw new Error("No se pudo guardar la sesión en este dispositivo.");
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    window.localStorage.removeItem("appgestion.session");
    setSession(null);
  };

  if (isCheckingSession) {
    return (
      <main className="auth-page">
        <p className="auth-description">Verificando sesión...</p>
      </main>
    );
  }

  if (!session) {
    return <Auth onAuthenticated={handleAuthenticated} initialError={authError} />;
  }

  return (
    <AdminDashboard
      session={session}
      onLogout={handleLogout}
      onSessionUpdated={handleAuthenticated}
    />
  );
}

function AdminDashboard({
  session,
  onLogout,
  onSessionUpdated,
}: {
  session: Session;
  onLogout: () => void;
  onSessionUpdated: (session: Session) => void;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMembers, setSearchMembers] = useState<MemberRecord[]>([]);
  const [searchTransactions, setSearchTransactions] = useState<
    TransactionRecord[]
  >([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; detail: string; tone: string }[]
  >([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem("appgestion.theme") === "dark";
    } catch (error) {
      console.error("No se pudo leer la preferencia del tema.", error);
      return false;
    }
  });
  const [notification, setNotification] = useState<ToastNotification | null>(
    null,
  );

  const notify = useCallback(
    (message: string, type: ToastType = "success") => {
      setNotification({ id: Date.now(), message, type });
    },
    [],
  );

  const dismissNotification = useCallback(() => setNotification(null), []);

  const navigateTo = (section: SectionId) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (!isSearchOpen || !searchQuery.trim()) {
      setSearchMembers([]);
      setSearchTransactions([]);
      return;
    }
    let active = true;
    const query = searchQuery.trim().toLocaleLowerCase("es-MX");
    Promise.all([api.members.list(), api.finance.list()])
      .then(([members, transactions]) => {
        if (!active) return;
        setSearchMembers(
          members
            .filter(
              (member) =>
                member.name.toLocaleLowerCase("es-MX").includes(query) ||
                member.email.toLocaleLowerCase("es-MX").includes(query),
            )
            .slice(0, 5),
        );
        setSearchTransactions(
          transactions
            .filter(
              (transaction) =>
                transaction.client.toLocaleLowerCase("es-MX").includes(query) ||
                transaction.concept.toLocaleLowerCase("es-MX").includes(query),
            )
            .slice(0, 5),
        );
      })
      .catch((error: unknown) => {
        if (active) {
          notify(
            error instanceof Error
              ? error.message
              : "No se pudo completar la búsqueda.",
            "error",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [isSearchOpen, notify, searchQuery]);

  const loadNotifications = async () => {
    try {
      const [members, transactions] = await Promise.all([
        api.members.list(),
        api.finance.list(),
      ]);
      const today = new Date();
      const upcoming = members
        .map((member) => {
          const expiry = new Date(`${member.expiryDate}T00:00:00`);
          const daysUntil = Math.ceil(
            (expiry.getTime() - today.getTime()) / 86_400_000,
          );
          return { member, daysUntil };
        })
        .filter(({ member, daysUntil }) => {
          const enabled = window.localStorage.getItem("appgestion.settings");
          const notifyEnabled =
            !enabled ||
            (JSON.parse(enabled) as { notifyExpiringMemberships?: boolean })
              .notifyExpiringMemberships !== false;
          return (
            notifyEnabled &&
            member.status === "Activo" &&
            daysUntil >= 0 &&
            daysUntil <= 30
          );
        })
        .slice(0, 4)
        .map(({ member, daysUntil }) => ({
          id: `member-${member.id}`,
          title: "Membresía próxima a vencer",
          detail: `${member.name} · vence en ${daysUntil} día${daysUntil === 1 ? "" : "s"}`,
          tone: "notification-warning",
        }));
      const settings = window.localStorage.getItem("appgestion.settings");
      const paymentsEnabled =
        !settings ||
        (JSON.parse(settings) as { notifyPayments?: boolean }).notifyPayments !==
          false;
      const recentPayments = paymentsEnabled
        ? transactions
            .filter((transaction) => {
              const age = Math.floor(
                (today.getTime() -
                  new Date(`${transaction.date}T00:00:00`).getTime()) /
                  86_400_000,
              );
              return age >= 0 && age < 3;
            })
            .slice(0, 4)
            .map((transaction) => ({
              id: `transaction-${transaction.id}`,
              title: "Pago registrado",
              detail: `${transaction.client} · $${transaction.amount.toLocaleString("es-MX")}`,
              tone: "notification-success",
            }))
        : [];
      setNotifications([...recentPayments, ...upcoming].slice(0, 7));
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las notificaciones.",
        "error",
      );
    }
  };

  const toggleNotifications = () => {
    const shouldOpen = !isNotificationsOpen;
    setIsNotificationsOpen(shouldOpen);
    setIsProfileMenuOpen(false);
    setIsSearchOpen(false);
    if (shouldOpen) void loadNotifications();
  };

  const navigateFromProfile = (section: SectionId) => {
    navigateTo(section);
    setIsProfileMenuOpen(false);
  };

  const updateSessionUser = (user: AppUser) => {
    onSessionUpdated({ ...session, user });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "appgestion.theme",
        isDarkMode ? "dark" : "light",
      );
    } catch (error) {
      console.error("No se pudo guardar la preferencia del tema.", error);
      notify("No se pudo guardar la preferencia de tema.", "error");
    }
  }, [isDarkMode, notify]);

  return (
    <div className={`app-shell${isDarkMode ? " dark" : ""}`}>
      <Sidebar
        activeSection={activeSection}
        onNavigate={navigateTo}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={session.user}
        onLogout={onLogout}
      />
      <main className="main-content">
        <header className="topbar">
          <button
            aria-label="Abrir menú"
            className="mobile-menu-button"
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            <Icon name="menu" size={21} />
          </button>
          <div className="breadcrumb">
            <span>AppGestion</span>
            <span className="breadcrumb-separator">/</span>
            <strong>
              {activeSection === "overview"
                ? "Resumen"
                : sectionContent[activeSection].title}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              aria-label={
                isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
              }
              aria-pressed={isDarkMode}
              className="icon-button theme-toggle"
              onClick={() => setIsDarkMode((current) => !current)}
              title={isDarkMode ? "Modo claro" : "Modo oscuro"}
              type="button"
            >
              <Icon name={isDarkMode ? "sun" : "moon"} size={19} />
            </button>
            <div className="topbar-popover-wrap search-popover-wrap">
              <button
                aria-expanded={isSearchOpen}
                aria-label="Buscar"
                className="icon-button search-button"
                onClick={() => {
                  setIsSearchOpen((open) => !open);
                  setIsNotificationsOpen(false);
                  setIsProfileMenuOpen(false);
                }}
                type="button"
              >
                <Icon name="search" size={19} />
              </button>
              {isSearchOpen && (
                <div className="topbar-popover global-search-popover">
                  <label className="table-search global-search-input">
                    <Icon name="search" size={17} />
                    <input
                      autoFocus
                      aria-label="Buscar miembros o transacciones"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Buscar miembros o transacciones..."
                      type="search"
                      value={searchQuery}
                    />
                    <button
                      aria-label="Cerrar búsqueda"
                      className="popover-close"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      type="button"
                    >
                      ×
                    </button>
                  </label>
                  {searchQuery.trim() ? (
                    <div className="global-search-results">
                      {searchMembers.length > 0 && (
                        <>
                          <p className="popover-section-label">MIEMBROS</p>
                          {searchMembers.map((member) => (
                            <button
                              className="global-search-result"
                              key={`member-${member.id}`}
                              onClick={() => {
                                navigateTo("members");
                                setSearchQuery(member.name);
                                setIsSearchOpen(false);
                              }}
                              type="button"
                            >
                              <span className="search-result-icon">
                                <Icon name="members" size={16} />
                              </span>
                              <span>
                                <strong>{member.name}</strong>
                                <small>{member.email}</small>
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                      {searchTransactions.length > 0 && (
                        <>
                          <p className="popover-section-label">TRANSACCIONES</p>
                          {searchTransactions.map((transaction) => (
                            <button
                              className="global-search-result"
                              key={`transaction-${transaction.id}`}
                              onClick={() => {
                                navigateTo("finance");
                                setSearchQuery(
                                  transaction.client || transaction.concept,
                                );
                                setIsSearchOpen(false);
                              }}
                              type="button"
                            >
                              <span className="search-result-icon search-result-finance">
                                <Icon name="finance" size={16} />
                              </span>
                              <span>
                                <strong>{transaction.client}</strong>
                                <small>
                                  {transaction.concept} · $
                                  {transaction.amount.toLocaleString("es-MX")}
                                </small>
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                      {searchMembers.length === 0 &&
                        searchTransactions.length === 0 && (
                          <p className="popover-empty">
                            No se encontraron coincidencias.
                          </p>
                        )}
                    </div>
                  ) : (
                    <p className="search-hint">
                      Busca por nombre, correo o concepto de pago.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="topbar-popover-wrap">
              <button
                aria-expanded={isNotificationsOpen}
                aria-label="Notificaciones"
                className="icon-button notification-button"
                onClick={toggleNotifications}
                type="button"
              >
                <Icon name="bell" size={19} />
                {notifications.length > 0 && <span className="notification-dot" />}
              </button>
              {isNotificationsOpen && (
                <div className="topbar-popover notifications-popover">
                  <div className="popover-heading">
                    <div>
                      <strong>Notificaciones</strong>
                      <small>Actividad reciente del negocio</small>
                    </div>
                    <button
                      aria-label="Cerrar notificaciones"
                      className="popover-close"
                      onClick={() => setIsNotificationsOpen(false)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length ? (
                      notifications.map((item) => (
                        <div className="notification-item" key={item.id}>
                          <span className={`notification-item-icon ${item.tone}`}>
                            <Icon
                              name={
                                item.tone === "notification-warning"
                                  ? "clock"
                                  : "check"
                              }
                              size={15}
                            />
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>{item.detail}</small>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="popover-empty">No hay alertas recientes.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="topbar-divider" />
            <div className="topbar-popover-wrap profile-popover-wrap">
              <button
                aria-expanded={isProfileMenuOpen}
                aria-label="Menú de perfil"
                className="topbar-profile profile-trigger"
                onClick={() => {
                  setIsProfileMenuOpen((open) => !open);
                  setIsNotificationsOpen(false);
                  setIsSearchOpen(false);
                }}
                type="button"
              >
                {session.user.avatar ? (
                  <img
                    alt=""
                    className="avatar sidebar-avatar-image"
                    src={session.user.avatar}
                  />
                ) : (
                  <div className="avatar avatar-owner">
                    {session.user.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0] ?? "")
                      .join("")
                      .toLocaleUpperCase("es-MX")}
                  </div>
                )}
                <div className="topbar-profile-info">
                  <span>{session.user.name}</span>
                  <span>{roleLabel(session.user.role)}</span>
                </div>
                <span className="profile-chevron" />
              </button>
              {isProfileMenuOpen && (
                <div className="topbar-popover profile-menu">
                  <div className="profile-menu-user">
                    <strong>{session.user.name}</strong>
                    <small>{session.user.email}</small>
                  </div>
                  <button
                    onClick={() => navigateFromProfile("profile")}
                    type="button"
                  >
                    <Icon name="profile" size={17} />
                    Mi cuenta
                  </button>
                  <button
                    onClick={() => navigateFromProfile("settings")}
                    type="button"
                  >
                    <Icon name="settings" size={17} />
                    Configuración
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeSection === "overview" && <Dashboard />}
          <div hidden={activeSection !== "members"}>
            <Members onNotify={notify} searchTerm={searchQuery} />
          </div>
          <div hidden={activeSection !== "finance"}>
            <Finance onNotify={notify} searchTerm={searchQuery} />
          </div>
          <div hidden={activeSection !== "staff"}>
            <Staff onNotify={notify} />
          </div>
          {activeSection === "profile" && (
            <Account
              onNotify={notify}
              onUserUpdated={updateSessionUser}
              user={session.user}
            />
          )}
          {activeSection === "settings" && (
            <Settings onNotify={notify} />
          )}
          <footer className="page-footer">
            <span>© 2025 AppGestion</span>
            <span>Hecho para hacer crecer tu negocio</span>
          </footer>
        </div>
      </main>
      {notification && (
        <Toast
          notification={notification}
          onDismiss={dismissNotification}
        />
      )}
    </div>
  );
}

export default App;
