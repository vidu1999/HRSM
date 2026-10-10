import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export function PageHeading({ title, description, action, date }: { title: ReactNode; description?: string; action?: ReactNode; date?: string }) {
  return (
    <div className={`page-heading${date ? " dashboard-heading" : ""}`}>
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {date ? <div className="date-display"><span>{date}</span><span className="date-icon"><Icon name="calendar" /></span></div> : action && <div className="page-actions">{action}</div>}
    </div>
  );
}

export function Metric({ label, value, tone = "blue", icon, note, trend }: { label: string; value: string | number; tone?: "blue" | "green" | "orange" | "violet" | "red"; icon: IconName; note?: string; trend?: string }) {
  return (
    <div className="metric-card">
      <div className="metric-top"><span className={`metric-icon ${tone}`}><Icon name={icon} /></span></div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {note && <small className="metric-note">{note}</small>}
      {trend && <span className="metric-trend">{trend}</span>}
    </div>
  );
}

export function Panel({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="panel-meta">{action}</div>}</header>
      {children}
    </section>
  );
}

export function Avatar({ name, index = 0, size }: { name: string; index?: number; size?: "large" }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return <span className={`avatar avatar-${index % 8}${size === "large" ? " avatar-large" : ""}`} aria-label={name}>{initials || "HR"}</span>;
}

export function StatusPill({ status }: { status: string }) {
  const statusClass: Record<string, string> = {
    ACTIVE: "", APPROVED: "", PRESENT: "", COMPLETED: "", ON_TRACK: "", HIRED: "",
    PENDING: "warning", OPEN: "warning", SCREENING: "info", INTERVIEW: "info", IN_PROGRESS: "info", ON_LEAVE: "info",
    REJECTED: "danger", DECLINED: "danger", LATE: "warning", AT_RISK: "danger", CLOSED: "neutral", CANCELLED: "neutral", DRAFT: "neutral", INACTIVE: "neutral", TERMINATED: "danger", ABSENT: "danger", OFFER: "info",
  };
  return <span className={`status-badge ${statusClass[status] ?? "neutral"}`}>{status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</span>;
}

export function EmptyState({ children, icon = "sparkles" }: { children: ReactNode; icon?: IconName }) {
  return <div className="module-empty"><span><Icon name={icon} /></span><p>{children}</p></div>;
}

export function SearchField({ name = "search", placeholder = "Search...", defaultValue = "" }: { name?: string; placeholder?: string; defaultValue?: string }) {
  return <label className="search-field"><Icon name="search" size={14} /><input name={name} type="search" placeholder={placeholder} defaultValue={defaultValue} /></label>;
}

export function ButtonIcon({ name, label, className = "row-action", onClick, type = "button" }: { name: IconName; label: string; className?: string; onClick?: () => void; type?: "button" | "submit" }) {
  return <button type={type} className={className} onClick={onClick} aria-label={label} title={label}><Icon name={name} size={14} /></button>;
}
