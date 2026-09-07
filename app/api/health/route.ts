import { serverMeta } from "@/lib/mcp";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, ...serverMeta() });
}
