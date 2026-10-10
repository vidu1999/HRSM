"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export type NavItem = { href: string; label: string; icon: IconName; count?: number; badge?: number };
export type Notice = { id: string; title: string; message: string; href: string; kind: string; isRead: boolean; createdAt: string | Date };
type ToastInput = { title: string; message?: string; tone?: "success" | "error" | "info" };
type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function AppShell({
  children,
  user,
  items,
  notifications: initialNotifications,
}: {
  children: ReactNode;
  user: { name: string; role: string; email: string; initials: string };
  items: NavItem[];
  notifications: Notice[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const unread = notifications.filter((item) => !item.isRead).length;

  const toast = useCallback((item: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...item, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((candidate) => candidate.id !== id)), 3600);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", sidebarOpen);
    return () => document.body.classList.remove("sidebar-open");
  }, [sidebarOpen]);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 20);
  }, [searchOpen]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
        setNotificationOpen(false);
        setProfileOpen(false);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setSidebarOpen(false);
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const q = query.trim();
    setSelectedIndex(0);
    if (!q) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setSearchBusy(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then(async (response) => response.ok ? response.json() : { results: [] })
        .then((body) => setResults(body.results ?? []))
        .catch((error: unknown) => {
          if (error instanceof Error && error.name !== "AbortError") setResults([]);
        })
        .finally(() => setSearchBusy(false));
    }, 140);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchOpen]);

  useEffect(() => {
    setSidebarOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  async function markRead(id?: string) {
    setNotifications((current) => current.map((item) => !id || item.id === id ? { ...item, isRead: true } : item));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(id ? { id } : {}),
      });
    } catch {
      toast({ title: "Couldn't update notifications", message: "Please try again in a moment.", tone: "error" });
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  function openSearchResult(href: string) {
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <ToastContext.Provider value={toast}>
      <div className="app-shell">
        <aside className={`sidebar${sidebarOpen ? " is-open" : ""}`} id="sidebar" aria-label="Main navigation">
          <div className="brand-row">
            <Link className="brand" href="/" aria-label="HRMS dashboard">
              <span className="brand-mark" aria-hidden="true"><span>H</span></span><strong>HRMS</strong>
            </Link>
            <button className="sidebar-close icon-button" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><Icon name="close" /></button>
          </div>
          <nav className="primary-nav" aria-label="HRMS modules">
            {items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} className={`nav-item${active ? " is-active" : ""}`} href={item.href} aria-current={active ? "page" : undefined}>
                  <span className="nav-icon"><Icon name={item.icon} size={15} /></span>
                  <span>{item.label}</span>
                  {item.badge ? <span className="nav-pill">{item.badge > 99 ? "99+" : item.badge}</span> : null}
                  {item.count ? <span className="nav-count">{item.count.toLocaleString()}</span> : null}
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-footnote"><span className="footnote-dot" /><span>All systems operational</span></div>
            <div className="sidebar-version">HRMS Workspace <span>v2.4.0</span></div>
          </div>
        </aside>
        <button className={`mobile-scrim${sidebarOpen ? " is-visible" : ""}`} type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />

        <main className="main-area">
          <header className="topbar">
            <div className="topbar-left">
              <button className="menu-toggle icon-button" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Open navigation" aria-expanded={sidebarOpen}>
                <span /><span /><span />
              </button>
              <button className="search-trigger" type="button" onClick={() => setSearchOpen(true)} aria-label="Search anything">
                <span className="search-icon"><Icon name="search" /></span><span className="search-placeholder">Search anything...</span><kbd>⌘ K</kbd>
              </button>
            </div>
            <div className="topbar-actions">
              <div className="notification-wrap">
                <button className="top-icon-button notification-button" type="button" onClick={() => { setNotificationOpen((open) => !open); setProfileOpen(false); }} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={notificationOpen}>
                  <Icon name="bell" />{unread > 0 && <i className="notification-dot" />}
                </button>
                {notificationOpen && (
                  <div className="notification-popover" role="dialog" aria-label="Notifications">
                    <div className="notification-head"><strong>Notifications {unread > 0 && <span className="unread-count">{unread}</span>}</strong><button type="button" onClick={() => void markRead()}>Mark all as read</button></div>
                    {notifications.length ? notifications.map((notice) => (
                      <Link className={`notification-item${notice.isRead ? " is-read" : ""}`} key={notice.id} href={notice.href} onClick={() => { if (!notice.isRead) void markRead(notice.id); }}>
                        <span className={`notification-symbol ${notice.kind}`}><Icon name={notice.kind === "payroll" ? "wallet" : notice.kind === "leave" ? "calendar" : "people"} size={14} /></span>
                        <span><strong>{notice.title}</strong><small>{notice.message}</small><time>{relativeTime(notice.createdAt)}</time></span>
                        {!notice.isRead && <i className="notice-unread" />}
                      </Link>
                    )) : <div className="notification-empty">You're all caught up.</div>}
                    <Link className="notification-footer" href="/audit">View recent activity <Icon name="chevron" size={12} /></Link>
                  </div>
                )}
              </div>
              <div className="profile-wrap">
                <button className="user-menu" type="button" onClick={() => { setProfileOpen((open) => !open); setNotificationOpen(false); }} aria-expanded={profileOpen} aria-label="Open user menu">
                  <span className="user-avatar">{user.initials}</span><span className="user-copy"><strong>{user.name}</strong><small>{user.role}</small></span><span className="user-chevron"><Icon name="chevronDown" size={13} /></span>
                </button>
                {profileOpen && <div className="profile-popover"><div className="profile-popover-user"><span className="user-avatar large">{user.initials}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div><div className="profile-popover-role">Signed in as <strong>{user.role}</strong></div><button className="profile-logout" type="button" onClick={() => void signOut()}><Icon name="logout" size={14} /> Sign out</button></div>}
              </div>
            </div>
          </header>
          <div className="page-content" key={pathname}>{children}</div>
        </main>
      </div>

      <div className={`search-overlay${searchOpen ? " is-open" : ""}`} aria-hidden={!searchOpen}>
        <button className="search-backdrop" type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" />
        <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search HRMS" onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setSelectedIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1))); }
          if (event.key === "ArrowUp") { event.preventDefault(); setSelectedIndex((index) => Math.max(0, index - 1)); }
          if (event.key === "Enter" && results[selectedIndex]) openSearchResult(results[selectedIndex].href);
        }}>
          <div className="global-search-box"><Icon name="search" /><input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees, modules, or roles..." autoComplete="off" aria-label="Search HRMS" /><kbd>ESC</kbd></div>
          <div className="search-results">
            {!query.trim() ? <div className="search-empty"><Icon name="sparkles" size={17} /><span>Find a person or jump to a module.</span></div> : searchBusy ? <div className="search-empty">Searching your workspace…</div> : results.length ? results.map((result, index) => (
              <button key={result.id} className={`search-result${selectedIndex === index ? " selected" : ""}`} type="button" onMouseEnter={() => setSelectedIndex(index)} onClick={() => openSearchResult(result.href)}>
                <span className="result-icon"><Icon name={result.type === "Employee" ? "people" : iconForHref(result.href)} size={14} /></span><span><strong>{result.name}</strong><small>{result.detail}</small></span><i>{result.type}</i>
              </button>
            )) : <div className="search-empty">No results found for “{query}”.</div>}
          </div>
          <div className="search-foot"><span>↑ ↓ to navigate</span><span><kbd>↵</kbd> to open</span><span>Search this workspace</span></div>
        </section>
      </div>

      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((item) => <div key={item.id} className={`toast ${item.tone ?? "success"}`}><span className="toast-check"><Icon name={item.tone === "error" ? "close" : item.tone === "info" ? "sparkles" : "check"} size={13} /></span><span><strong>{item.title}</strong>{item.message && <small>{item.message}</small>}</span></div>)}
      </div>
    </ToastContext.Provider>
  );
}

type SearchResult = { id: string; name: string; detail: string; href: string; type: string };

function iconForHref(href: string): IconName {
  const icons: Record<string, IconName> = {
    "/": "dashboard", "/employees": "people", "/organization": "organization", "/attendance": "attendance", "/leave": "leave", "/payroll": "payroll", "/recruitment": "recruitment", "/performance": "performance", "/documents": "documents", "/reports": "reports", "/audit": "audit", "/settings": "settings",
  };
  return icons[href] ?? "documents";
}

function relativeTime(value: string | Date) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
