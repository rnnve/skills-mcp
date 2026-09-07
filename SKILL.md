---
name: skills-mcp
description: >-
  Use when connecting to or calling the Skills MCP host (Streamable HTTP),
  looking up Project SEKAI data (cards, characters, events, music, gacha),
  or adding a new skill module to this modular MCP server.
---

# Skills MCP

Modular **Model Context Protocol** host. Skills are TypeScript folders under `skills/`; every enabled skill’s tools appear on one Streamable HTTP endpoint.

This file is a **Cursor/agent skill** (when/how to use the deployed MCP). Do not confuse it with folders under `skills/` — those are MCP skill *modules* registered in `lib/registry.ts`.

## When to use

- Call Project SEKAI (`pjsk_*`) tools for cards, characters, events, music, gacha, or counts
- Connect a client (Cursor, Claude, etc.) to this MCP host
- Inventory what’s enabled (`skills_list`)
- Add or register a new MCP skill module in this repo

## Endpoints

| Path | Role |
|---|---|
| `GET /` | Status page |
| `GET/POST /api/mcp` | MCP Streamable HTTP |
| `GET/POST /mcp` | Alias |
| `GET /api/health` | Health + skill list |

Protocol: JSON-RPC 2.0 (`initialize` → `tools/list` → `tools/call`). Stateless. CORS open.

## Connect a client

Point a Streamable HTTP MCP client at the deployment (or local) URL:

```json
{
  "mcpServers": {
    "skills": {
      "url": "https://YOUR-DEPLOYMENT.vercel.app/api/mcp"
    }
  }
}
```

Replace `YOUR-DEPLOYMENT` with the Vercel project hostname for **skills-mcp**.

## Tools (Project SEKAI)

| Tool | Use |
|---|---|
| `skills_list` | Host inventory |
| `pjsk_search` | Mixed query (e.g. `kohane 4 cute`) |
| `pjsk_card` | ID or filters |
| `pjsk_character` | Profile + rarity counts |
| `pjsk_event` | Current / id / name |
| `pjsk_music` | Songs |
| `pjsk_gacha` | Banners |
| `pjsk_counts` | Every character |

`server` defaults to `jp`. Also: `en`, `tw`, `kr`, `cn`.

Data is backed by the same master JSON [sekai.best](https://sekai.best) loads. First `pjsk_card` on a cold instance may be slow while `cards.json` is fetched and slimmed; later calls use memory + fetch cache.

## Local

```bash
npm install
npm run dev
# POST http://localhost:3000/api/mcp
```

## Add an MCP skill module

1. Copy `skills/_template` to `skills/<name>`.
2. Export a `Skill` (`id`, `title`, `description`, `version`, `tools[]`).
3. Each tool: `name`, `description`, JSON Schema `inputSchema`, `handler(args)`.
4. Register in `lib/registry.ts`.
5. Push to `main` (Vercel rebuilds).

Keep handlers small and return JSON; the host wraps results as MCP `text` content.
