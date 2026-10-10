"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "./icon";

const DEMO_USERS = [
  { label: "HR administrator", email: "hr@hrms.example" },
  { label: "Super admin", email: "admin@hrms.example" },
  { label: "Manager", email: "manager@hrms.example" },
  { label: "Employee", email: "employee@hrms.example" },
];

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("hr@hrms.example");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Sign-in failed");
      router.replace(next);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="login-form">
        <label>Email address<input type="email" name="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
        <label>Password<input type="password" name="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="button-primary" type="submit" disabled={loading}>{loading ? "Signing in…" : <>Sign in securely <Icon name="chevron" size={14} /></>}</button>
      </form>
      <div className="login-demo-accounts"><strong>Explore a demo role</strong><div className="demo-account-buttons">{DEMO_USERS.map((account) => <button key={account.email} type="button" onClick={() => { setEmail(account.email); setPassword("Password123!"); setError(null); }}>{account.label}</button>)}</div><p>Demo password: <code>Password123!</code></p></div>
    </>
  );
}
