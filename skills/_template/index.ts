/**
 * Copy this folder to skills/<your-skill-id>/ and export a Skill.
 * Then import it in lib/registry.ts and push it into the `skills` array.
 *
 * import type { Skill } from "@/lib/types";
 *
 * export const mySkill: Skill = {
 *   id: "my-skill",
 *   title: "My Skill",
 *   description: "What it does.",
 *   version: "1.0.0",
 *   tools: [
 *     {
 *       name: "my_tool",
 *       description: "Does a thing.",
 *       inputSchema: {
 *         type: "object",
 *         properties: { q: { type: "string" } },
 *         required: ["q"],
 *       },
 *       handler: async (args) => ({ ok: true, q: args.q }),
 *     },
 *   ],
 * };
 */
export {};
