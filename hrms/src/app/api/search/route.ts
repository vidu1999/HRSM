import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/http";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { searchWorkspace } from "@/lib/services/modules";

export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const query = new URL(req.url).searchParams.get("q") ?? "";
  const items = await searchWorkspace(session, query);
  const visible = items.filter((item) => {
    if (item.href === "/payroll") return can(session, "payroll:read");
    if (item.href === "/recruitment") return can(session, "recruitment:read");
    if (item.href === "/reports") return can(session, "reports:read");
    if (item.href === "/audit") return can(session, "audit:read");
    if (item.href === "/settings") return can(session, "settings:read");
    return true;
  });
  return NextResponse.json({ results: visible });
});
