import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only allow same-site relative redirects.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-800 to-brand-700 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white">H</span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Sign in to HRMS</h1>
            <p className="text-sm text-slate-500">Human Resource Management System</p>
          </div>
        </div>
        <LoginForm next={safeNext} />
        <p className="mt-6 text-center text-xs text-slate-400">Demo accounts are listed in the project README.</p>
      </div>
    </main>
  );
}
