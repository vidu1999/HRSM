import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/token";

// Fast, edge-side gate: verifies the JWT signature so anonymous visitors never
// reach protected pages. Authorization is still enforced server-side in every
// page and API handler, and the session is re-checked against the database.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = token ? (await verifySessionToken(token)) !== null : false;
  const isLogin = req.nextUrl.pathname === "/login";

  if (!valid && !isLogin) {
    const next = req.nextUrl.pathname !== "/" ? `?next=${encodeURIComponent(req.nextUrl.pathname)}` : "";
    return redirect(req, `/login${next}`);
  }
  if (valid && isLogin) return redirect(req, "/");
  return NextResponse.next();
}

function redirect(req: NextRequest, location: string) {
  return NextResponse.redirect(new URL(location, req.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
