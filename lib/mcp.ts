import { allTools, findTool, skills } from "./registry";
import type { JsonRpcRequest } from "./types";

const PROTOCOL = "2025-03-26";
const SERVER_INFO = {
  name: "skills-mcp",
  version: "1.0.0",
  title: "Skills MCP",
};

function ok(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result };
}

function err(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0" as const, id: id ?? null, error: { code, message } };
}

export async function handleMcp(body: JsonRpcRequest | JsonRpcRequest[]) {
  if (Array.isArray(body)) {
    return Promise.all(body.map((m) => handleOne(m)));
  }
  return handleOne(body);
}

async function handleOne(req: JsonRpcRequest) {
  const id = req.id ?? null;
  const method = req.method || "";
  const params = (req.params || {}) as Record<string, unknown>;

  try {
    switch (method) {
      case "initialize":
        return ok(id, {
          protocolVersion: PROTOCOL,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions:
            "Modular skill host. Call skills_list first. Project SEKAI tools are prefixed pjsk_. Default server is jp.",
        });
      case "notifications/initialized":
      case "notifications/cancelled":
        return null;
      case "ping":
        return ok(id, {});
      case "tools/list":
        return ok(id, {
          tools: allTools().map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        });
      case "tools/call": {
        const name = String(params.name || "");
        const args = (params.arguments || {}) as Record<string, unknown>;
        const tool = findTool(name);
        if (!tool) return err(id, -32601, `Unknown tool: ${name}`);
        const data = await tool.handler(args);
        return ok(id, {
          content: [
            {
              type: "text",
              text:
                typeof data === "string" ? data : JSON.stringify(data, null, 2),
            },
          ],
        });
      }
      case "resources/list":
        return ok(id, { resources: [] });
      case "prompts/list":
        return ok(id, { prompts: [] });
      default:
        if (method.startsWith("notifications/")) return null;
        return err(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err(id, -32000, message);
  }
}

export function serverMeta() {
  return {
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    skills: skills.map((s) => ({
      id: s.id,
      title: s.title,
      tools: s.tools.length,
    })),
    endpoints: {
      mcp: "/api/mcp",
      alias: "/mcp",
      health: "/api/health",
    },
  };
}
