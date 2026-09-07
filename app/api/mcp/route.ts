import { handleMcp, serverMeta } from "@/lib/mcp";
import type { JsonRpcRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,mcp-session-id,mcp-protocol-version",
  "access-control-expose-headers": "mcp-session-id",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET() {
  return json({
    ok: true,
    transport: "streamable-http",
    protocol: "2025-03-26",
    ...serverMeta(),
    hint: "POST JSON-RPC to this URL (initialize, tools/list, tools/call).",
  });
}

export async function DELETE() {
  return json({ ok: true });
}

export async function POST(req: Request) {
  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = (await req.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      400,
    );
  }
  const result = await handleMcp(body);
  if (result == null) return new Response(null, { status: 202, headers: cors });
  return json(result);
}
