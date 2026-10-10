import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { assertCan } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { createApplication, createJobPost, getRecruitmentSnapshot } from "@/lib/services/modules";

const jobSchema = z.object({
  kind: z.literal("job"),
  title: z.string().trim().min(3).max(140),
  departmentId: z.uuid(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  location: z.string().trim().min(2).max(120),
  description: z.string().max(2000).optional(),
});
const applicationSchema = z.object({
  kind: z.literal("application"),
  jobPostId: z.uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  source: z.string().trim().max(60).optional(),
});

export const GET = apiHandler(async () => {
  const session = await requireSession();
  assertCan(session, "recruitment:read");
  return NextResponse.json(await getRecruitmentSnapshot());
});

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const body = await readJson(req);
  if (body && typeof body === "object" && "kind" in body && body.kind === "job") {
    const input = jobSchema.parse(body);
    return NextResponse.json(await createJobPost(session, clientInfo(req), input), { status: 201 });
  }
  const input = applicationSchema.parse(body);
  return NextResponse.json(await createApplication(session, clientInfo(req), input), { status: 201 });
});
