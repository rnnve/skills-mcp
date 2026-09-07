export type JsonSchema = {
  type: string;
  properties?: Record<string, JsonSchema & { description?: string; default?: unknown; enum?: string[] }>;
  required?: string[];
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: JsonSchema;
};

export type SkillTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

export type Skill = {
  id: string;
  title: string;
  description: string;
  version: string;
  tools: SkillTool[];
};

export type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

export type McpContent = { type: "text"; text: string };
