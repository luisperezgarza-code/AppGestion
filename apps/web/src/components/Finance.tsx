import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { useLocalStorageState } from "./useLocalStorageState";
import type { ToastType } from "./Toast";
import { api, apiMode } from "../services/api";
import { exportReport, type ExportFormat } from "../services/export";

type Transaction = {
  id: number | string;
  client: string;
  concept: string;
  amount: number;
  method: string;
  date: string;
  status: "Completado" | "Pendiente";
};

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialTransactions: Transaction[] = [
  {
    id: 1,
    client: "María González",
    concept: "Membresía Premium",
    amount: 899,
    method: "Tarjeta",
    date: localDate(),
    status: "Completado",
  },
  {
    id: 2,
    client: "Carlos Ramírez",
    concept: "Membresía Básica",
    amount: 499,
    method: "Transferencia",
    date: localDate(),
    status: "Pendiente",
  },
  {
    id: 3,
    client: "Ana López",
    concept: "Plan anual",
    amount: 6999,
    method: "Tarjeta",
    date: localDate(-1),
    status: "Completado",
  },
  {
    id: 4,
    client: "Valentina Cruz",
    concept: "Membresía Básica",
    amount: 499,
    method: "Efectivo",
    date: localDate(-2),
    status: "Completado",
  },
  {
    id: 5,
    client: "Diego Torres",
    concept: "Membresía Premium",
    amount: 899,
    method: "Transferencia",
    date: localDate(-3),
    status: "Pendiente",
  },
  {
    id: 6,
    client: "Jorge Pérez",
    concept: "Renovación mensual",
    amount: 899,
    method: "Tarjeta",
    date: localDate(-5),
    status: "Completado",
  },
];

function formatCurrency(amount: number) {
  let currency = "MXN";
  try {
    const storedSettings = window.localStorage.getItem("appgestion.settings");
    if (storedSettings) {
      const settings: unknown = JSON.parse(storedSettings);
      if (
        typeof settings === "object" &&
        settings !== null &&
        "currency" in settings &&
        typeof settings.currency === "string" &&
        ["MXN", "USD", "EUR", "COP"].includes(settings.currency)
      ) {
        currency = settings.currency;
      }
    }
  } catch (error) {
    console.error("No se pudo leer la moneda configurada.", error);
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function isSameMonth(date: string, today: string) {
  return date.slice(0, 7) === today.slice(0, 7);
}

function isTransactionArray(value: unknown): value is Transaction[] {
  return (
    Array.isArray(value) &&
    value.every(
      (transaction) =>
        typeof transaction === "object" &&
        transaction !== null &&
        typeof transaction.id === "number" &&
        typeof transaction.client === "string" &&
        typeof transaction.concept === "string" &&
        typeof transaction.amount === "number" &&
        typeof transaction.method === "string" &&
        typeof transaction.date === "string" &&
        (transaction.status === "Completado" ||
          transaction.status === "Pendiente"),
    )
  );
}

export default function Finance({
  onNotify,
  searchTerm = "",
}: {
  onNotify: (message: string, type?: ToastType) => void;
  searchTerm?: string;
}) {
  const [transactions, setTransactions] = useLocalStorageState(
    "appgestion.transactions",
    apiMode === "local" ? initialTransactions : [],
    isTransactionArray,
    onNotify,
    apiMode === "local",
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    if (apiMode !== "remote") return;
    let active = true;
    api.finance
      .list()
      .then((data) => {
        if (active) setTransactions(data);
      })
      .catch((error: unknown) =>
        onNotify(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las transacciones.",
          "error",
        ),
      );
    return () => {
      active = false;
    };
  }, [onNotify, setTransactions]);

  useEffect(() => {
    setSearch(searchTerm);
  }, [searchTerm]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    if (!query) return transactions;
    return transactions.filter(
      (transaction) =>
        transaction.client.toLocaleLowerCase("es-MX").includes(query) ||
        transaction.concept.toLocaleLowerCase("es-MX").includes(query),
    );
  }, [search, transactions]);

  const summary = useMemo(() => {
    const today = localDate();
    return {
      monthlyRevenue: transactions
        .filter(
          (transaction) =>
            transaction.status === "Completado" &&
            isSameMonth(transaction.date, today),
        )
        .reduce((total, transaction) => total + transaction.amount, 0),
      pendingPayments: transactions
        .filter((transaction) => transaction.status === "Pendiente")
        .reduce((total, transaction) => total + transaction.amount, 0),
      todayCount: transactions.filter(
        (transaction) => transaction.date === today,
      ).length,
    };
  }, [transactions]);

  const registerPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const transactionData = {
      client: String(formData.get("client")).trim(),
      concept: String(formData.get("concept")).trim(),
      amount: Number(formData.get("amount")),
      method: String(formData.get("method")),
      date: String(formData.get("date")),
      status: "Completado" as const,
    };
    try {
      const transaction =
        apiMode === "remote"
          ? await api.finance.create(transactionData)
          : { id: Date.now(), ...transactionData };
      setTransactions((current) => [transaction, ...current]);
      setIsFormOpen(false);
      onNotify("El pago se registró correctamente.");
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : "No se pudo registrar el pago.",
        "error",
      );
    }
  };

  const deleteTransaction = async (transaction: Transaction) => {
    try {
      if (apiMode === "remote") await api.finance.remove(transaction.id);
      setTransactions((current) =>
        current.filter((item) => item.id !== transaction.id),
      );
      onNotify(`La transacción de ${transaction.client} se eliminó.`);
    } catch (error) {
      onNotify(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la transacción.",
        "error",
      );
    }
  };

  const exportTransactions = (format: ExportFormat) => {
    exportReport(
      "transacciones-appgestion",
      ["Cliente", "Concepto", "Monto", "Método de pago", "Fecha", "Estado"],
      transactions.map((transaction) => [
        transaction.client,
        transaction.concept,
        formatCurrency(transaction.amount),
        transaction.method,
        formatDate(transaction.date),
        transaction.status,
      ]),
      format,
    );
    setIsExportOpen(false);
    onNotify(`Se exportó el historial de finanzas a ${format.toUpperCase()}.`);
  };

  return (
    <section className="module-page">
      <div className="module-heading">
        <div>
          <p className="eyebrow">ADMINISTRACIÓN</p>
          <h1>Finanzas</h1>
          <p className="module-description">
            Supervisa los ingresos y mantén tus pagos al día.
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
                <button onClick={() => exportTransactions("csv")} type="button">
                  Descargar CSV
                </button>
                <button
                  onClick={() => exportTransactions("excel")}
                  type="button"
                >
                  Descargar Excel
                </button>
              </div>
            )}
          </div>
          <button
            className="primary-button"
            onClick={() => setIsFormOpen(true)}
            type="button"
          >
            <Icon name="plus" size={17} />
            Registrar pago
          </button>
        </div>
      </div>

      <section aria-label="Resumen financiero" className="finance-summary-grid">
        <article className="panel finance-summary-card">
          <span className="finance-summary-icon summary-violet">
            <Icon name="finance" size={19} />
          </span>
          <p>Ingresos totales del mes</p>
          <strong>{formatCurrency(summary.monthlyRevenue)}</strong>
          <span className="summary-caption">Pagos completados este mes</span>
        </article>
        <article className="panel finance-summary-card">
          <span className="finance-summary-icon summary-orange">
            <Icon name="clock" size={19} />
          </span>
          <p>Pagos pendientes</p>
          <strong>{formatCurrency(summary.pendingPayments)}</strong>
          <span className="summary-caption">
            {transactions.filter((item) => item.status === "Pendiente").length}{" "}
            pagos por confirmar
          </span>
        </article>
        <article className="panel finance-summary-card">
          <span className="finance-summary-icon summary-blue">
            <Icon name="credit-card" size={19} />
          </span>
          <p>Transacciones de hoy</p>
          <strong>{summary.todayCount}</strong>
          <span className="summary-caption">Movimientos registrados hoy</span>
        </article>
      </section>

      <section aria-label="Historial de transacciones" className="panel data-panel">
        <div className="module-panel-heading">
          <div>
            <h2>Historial de transacciones</h2>
            <p>Consulta los pagos recientes de tu negocio.</p>
          </div>
          <span className="transaction-count">
            {filteredTransactions.length} de {transactions.length} transacciones
          </span>
        </div>
        <div className="finance-table-search">
          <label className="table-search">
            <Icon name="search" size={17} />
            <input
              aria-label="Buscar transacciones"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente o concepto..."
              type="search"
              value={search}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="data-table finance-table">
            <thead>
              <tr>
                <th>CLIENTE</th>
                <th>CONCEPTO</th>
                <th>MONTO</th>
                <th>MÉTODO DE PAGO</th>
                <th>FECHA</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="table-primary-cell">{transaction.client}</td>
                  <td className="muted-cell">{transaction.concept}</td>
                  <td className="amount-cell">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td>
                    <span className="payment-method">
                      <Icon name="credit-card" size={15} />
                      {transaction.method}
                    </span>
                  </td>
                  <td className="muted-cell">{formatDate(transaction.date)}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        transaction.status === "Completado"
                          ? "status-active"
                          : "status-pending"
                      }`}
                    >
                      <span />
                      {transaction.status}
                    </span>
                  </td>
                  <td>
                    <button
                      aria-label={`Eliminar pago de ${transaction.client}`}
                      className="row-action row-action-danger"
                      onClick={() => deleteTransaction(transaction)}
                      title="Eliminar transacción"
                      type="button"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td className="empty-table" colSpan={7}>
                    No se encontraron transacciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          Mostrando <strong>{filteredTransactions.length}</strong> de{" "}
          <strong>{transactions.length}</strong> transacciones
        </div>
      </section>

      {isFormOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setIsFormOpen(false)}
        >
          <section
            aria-labelledby="payment-form-title"
            aria-modal="true"
            className="form-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">CONTROL DE FINANZAS</p>
                <h2 id="payment-form-title">Registrar pago</h2>
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
            <form className="module-form" onSubmit={registerPayment}>
              <div className="form-field">
                <label htmlFor="payment-client">Cliente</label>
                <input
                  autoFocus
                  id="payment-client"
                  name="client"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="payment-concept">Concepto</label>
                <input
                  id="payment-concept"
                  name="concept"
                  placeholder="Ej. Membresía mensual"
                  required
                />
              </div>
              <div className="form-grid-two">
                <div className="form-field">
                  <label htmlFor="payment-amount">Monto (MXN)</label>
                  <input
                    id="payment-amount"
                    min="0.01"
                    name="amount"
                    placeholder="0.00"
                    required
                    step="0.01"
                    type="number"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="payment-method">Método de pago</label>
                  <select id="payment-method" name="method">
                    <option>Tarjeta</option>
                    <option>Transferencia</option>
                    <option>Efectivo</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="payment-date">Fecha del pago</label>
                <input
                  defaultValue={localDate()}
                  id="payment-date"
                  name="date"
                  required
                  type="date"
                />
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
                  <Icon name="check" size={16} />
                  Guardar pago
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
