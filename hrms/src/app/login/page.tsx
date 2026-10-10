import type { ReactNode } from "react";
import { LoginForm } from "@/components/login-form";
import { Icon } from "@/components/icon";

const features: { icon: "shield" | "chart" | "people"; text: string }[] = [
  { icon: "shield", text: "Sensitive people data protected by role-based access" },
  { icon: "chart", text: "Live workforce insights from your PostgreSQL database" },
  { icon: "people", text: "Connected HR workflows, from hiring to payroll" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <a className="brand" href="/login"><span className="brand-mark"><span>H</span></span><strong>HRMS</strong></a>
        <div className="login-brand-copy">
          <div className="eyebrow"><Icon name="sparkles" size={13} /> The people operations workspace</div>
          <h2>Great work starts with a better people experience.</h2>
          <p>One secure workspace for your people, teams, time, and talent. Bring every HR workflow into focus.</p>
          <div className="login-feature-list">{features.map((feature) => <div className="login-feature" key={feature.text}><Icon name={feature.icon} size={15} />{feature.text}</div>)}</div>
        </div>
        <div className="login-brand-foot">© 2026 HRMS Workspace · Built for people-first teams</div>
      </section>
      <section className="login-form-side">
        <div className="login-card">
          <div className="login-brand-small"><span className="brand-mark"><span>H</span></span><span><strong>HRMS Workspace</strong><small>Human resources, all in one place</small></span></div>
          <h1>Welcome back</h1>
          <p>Sign in to your organization’s secure workspace.</p>
          <LoginForm next={safeNext} />
        </div>
      </section>
    </main>
  );
}
