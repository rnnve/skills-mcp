import type { Skill, SkillTool } from "./types";
import { projectSekaiSkill } from "@/skills/project-sekai";

/**
 * Register skills here. Drop a folder under /skills and import it.
 * Tools from every enabled skill are merged onto one MCP server.
 */
export const skills: Skill[] = [projectSekaiSkill];

export function allTools(): SkillTool[] {
  const host: SkillTool = {
    name: "skills_list",
    description:
      "List skills registered on this MCP host and the tools each skill exposes.",
    inputSchema: { type: "object", properties: {} },
    handler: async () =>
      skills.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        version: s.version,
        tools: s.tools.map((t) => t.name),
      })),
  };
  return [host, ...skills.flatMap((s) => s.tools)];
}

export function findTool(name: string): SkillTool | undefined {
  return allTools().find((t) => t.name === name);
}
