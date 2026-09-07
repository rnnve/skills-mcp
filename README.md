# Skills MCP

Modular **Model Context Protocol** host. Skills are folders. Tools from every enabled skill show up on one MCP endpoint.

First skill: **Project SEKAI** (`pjsk_*`), backed by the same master JSON [sekai.best](https://sekai.best) loads.

## Endpoints

| Path | Role |
|---|---|
| `GET /` | Status page |
| `GET/POST /api/mcp` | MCP Streamable HTTP |
| `GET/POST /mcp` | Alias |
| `GET /api/health` | Health + skill list |

Protocol: JSON-RPC 2.0, `initialize` → `tools/list` → `tools/call`. Stateless. CORS open.

## Connect a client

Cursor / Claude / any Streamable HTTP client:

```json
{
  "mcpServers": {
    "skills": {
      "url": "https://YOUR-DEPLOYMENT.vercel.app/api/mcp"
    }
  }
}
```

## Add a skill (not related to Sekai)

1. Copy `skills/_template` to `skills/<id>`.
2. Export a `Skill` object (`id`, `title`, `description`, `version`, `tools[]`).
3. Each tool needs `name`, `description`, JSON Schema `inputSchema`, and `handler(args)`.
4. Register it in `lib/registry.ts`:

```ts
import { mySkill } from "@/skills/my-skill";

export const skills: Skill[] = [projectSekaiSkill, mySkill];
```

5. Push to `main`. Vercel rebuilds.

Keep handlers small and return JSON. The host wraps the result as MCP `text` content.

## Project SEKAI tools

| Tool | Use |
|---|---|
| `skills_list` | Host inventory |
| `pjsk_search` | Mixed query (`kohane 4 cute`) |
| `pjsk_card` | ID or filters |
| `pjsk_character` | Profile + rarity counts |
| `pjsk_event` | Current / id / name |
| `pjsk_music` | Songs |
| `pjsk_gacha` | Banners |
| `pjsk_counts` | Every character |

`server` defaults to `jp`. Also `en`, `tw`, `kr`, `cn`.

## Local

```bash
npm install
npm run dev
# POST http://localhost:3000/api/mcp
```

```bash
curl -s http://localhost:3000/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Deploy

GitHub → Vercel (this repo). Production URL is the MCP base. First `pjsk_card` call on a cold instance may take a few seconds while `cards.json` is fetched and slimmed; later calls hit memory + fetch cache.
