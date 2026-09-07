import type { Skill } from "@/lib/types";
import {
  ATTR_IN, CHAR_EN, Card, Character, RARITY, RARITY_IN, Supply, TYPE_IN,
  UNIT_CODE, UNIT_EN, cardView, loadModule, resolveCharacter, tsMs,
} from "./data";

const serverEnum = ["jp", "en", "tw", "kr", "cn"];
const str = (a: Record<string, unknown>, k: string) => (a[k] == null ? undefined : String(a[k]));
const num = (a: Record<string, unknown>, k: string) => {
  if (a[k] == null || a[k] === "") return undefined;
  const n = Number(a[k]);
  return Number.isFinite(n) ? n : undefined;
};
const bool = (a: Record<string, unknown>, k: string) => a[k] === true || a[k] === "true";
const serverOf = (a: Record<string, unknown>) => {
  const s = str(a, "server") || "jp";
  return serverEnum.includes(s) ? s : "jp";
};

async function context(server: string) {
  const [cards, chars, supplies, enCards] = await Promise.all([
    loadModule(server, "cards") as Promise<Card[]>,
    loadModule(server, "gameCharacters") as Promise<Character[]>,
    loadModule(server, "cardSupplies") as Promise<Supply[]>,
    server === "en" ? Promise.resolve([] as Card[]) : (loadModule("en", "cards") as Promise<Card[]>).catch(() => [] as Card[]),
  ]);
  const enMap: Record<number, Card> = {};
  for (const c of enCards) enMap[c.id] = c;
  return { cards, chars, supplies, enMap };
}

function filterCards(cards: Card[], chars: Character[], supplies: Supply[], args: Record<string, unknown>) {
  const id = num(args, "id");
  const cid = resolveCharacter(str(args, "character"), chars);
  const unitTok = str(args, "unit");
  const unit = unitTok ? UNIT_CODE[unitTok.toLowerCase()] : undefined;
  const rarity = str(args, "rarity") ? RARITY_IN[String(args.rarity).toLowerCase()] : undefined;
  const attr = str(args, "attr") ? ATTR_IN[String(args.attr).toLowerCase()] : undefined;
  const typ = str(args, "type") ? TYPE_IN[String(args.type).toLowerCase()] : undefined;
  const q = (str(args, "q") || "").toLowerCase();
  return cards.filter((c) => {
    if (id != null && c.id !== id) return false;
    if (cid != null && c.characterId !== cid) return false;
    if (unit && chars.find((x) => x.id === c.characterId)?.unit !== unit) return false;
    if (rarity && c.cardRarityType !== rarity) return false;
    if (attr && c.attr !== attr) return false;
    if (typ && supplies.find((s) => s.id === (c.cardSupplyId || 1))?.cardSupplyType !== typ) return false;
    if (q && !`${c.prefix || ""} ${c.cardSkillName || ""} ${CHAR_EN[c.characterId] || ""}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => b.id - a.id);
}

async function handleCard(args: Record<string, unknown>) {
  const server = serverOf(args);
  const ctx = await context(server);
  const hits = filterCards(ctx.cards, ctx.chars, ctx.supplies, args);
  const limit = num(args, "limit") ?? (num(args, "id") != null ? hits.length : 15);
  return { server, total_matches: hits.length, returned: Math.min(hits.length, limit),
    cards: hits.slice(0, limit).map((c) => cardView(c, ctx.chars, ctx.supplies, server, ctx.enMap)) };
}

async function handleCharacter(args: Record<string, unknown>) {
  const server = serverOf(args);
  const ctx = await context(server);
  const cid = resolveCharacter(str(args, "name") || "", ctx.chars);
  if (cid == null) return { error: `unknown character: ${str(args, "name")}` };
  const ch = ctx.chars.find((x) => x.id === cid)!;
  const mine = ctx.cards.filter((c) => c.characterId === cid);
  const by: Record<string, number> = {};
  for (const c of mine) { const k = RARITY[c.cardRarityType] || c.cardRarityType; by[k] = (by[k] || 0) + 1; }
  const latest = mine.sort((a, b) => b.id - a.id)[0];
  return { id: cid, name: CHAR_EN[cid], name_jp: `${ch.firstName || ""}${ch.givenName || ""}`.trim(),
    unit: UNIT_EN[ch.unit || ""] || ch.unit, page: `https://sekai.best/chara/${cid}`,
    card_total: mine.length, by_rarity: by,
    latest: latest ? cardView(latest, ctx.chars, ctx.supplies, server, ctx.enMap) : null };
}

async function handleCounts(args: Record<string, unknown>) {
  const server = serverOf(args);
  const { cards, chars } = await context(server);
  const by = new Map<number, Card[]>();
  for (const c of cards) { const list = by.get(c.characterId) || []; list.push(c); by.set(c.characterId, list); }
  return { server, total_cards: cards.length, characters: [...by.keys()].sort((a,b)=>a-b).map((cid) => {
    const lst = by.get(cid)!; const ch = chars.find((x) => x.id === cid);
    return { id: cid, character: CHAR_EN[cid], character_jp: `${ch?.firstName || ""}${ch?.givenName || ""}`.trim(),
      unit: UNIT_EN[ch?.unit || ""] || ch?.unit, total: lst.length,
      r4: lst.filter((x) => x.cardRarityType === "rarity_4").length,
      birthday: lst.filter((x) => x.cardRarityType === "rarity_birthday").length,
      r3: lst.filter((x) => x.cardRarityType === "rarity_3").length,
      r2: lst.filter((x) => x.cardRarityType === "rarity_2").length,
      r1: lst.filter((x) => x.cardRarityType === "rarity_1").length };
  }) };
}

async function handleEvent(args: Record<string, unknown>) {
  const server = serverOf(args);
  const events = (await loadModule(server, "events")) as { id: number; name: string; eventType: string; unit?: string; startAt?: number; aggregateAt?: number; closedAt?: number }[];
  const now = Date.now();
  const view = (e: (typeof events)[0]) => ({ id: e.id, name: e.name, type: e.eventType, unit: UNIT_EN[e.unit || "none"] || e.unit, start: tsMs(e.startAt), aggregate: tsMs(e.aggregateAt), end: tsMs(e.closedAt), page: `https://sekai.best/event/${e.id}` });
  if (bool(args, "current")) {
    const live = events.filter((e) => (e.startAt || 0) <= now && now <= (e.closedAt || 0));
    if (live.length) return { server, current: live.map(view) };
    const upcoming = events.filter((e) => (e.startAt || 0) > now).sort((a,b)=>(a.startAt||0)-(b.startAt||0));
    const past = events.filter((e) => (e.closedAt || 0) < now).sort((a,b)=>(a.closedAt||0)-(b.closedAt||0));
    return { server, current: null, next: upcoming[0] ? view(upcoming[0]) : null, previous: past.length ? view(past[past.length-1]) : null };
  }
  let hits = events;
  const id = num(args, "id"); const q = (str(args, "q") || "").toLowerCase();
  if (id != null) hits = events.filter((e) => e.id === id);
  else if (q) hits = events.filter((e) => (e.name || "").toLowerCase().includes(q));
  hits = hits.sort((a,b)=>b.id-a.id).slice(0, num(args, "limit") ?? 10);
  return { server, total: events.length, events: hits.map(view) };
}

async function handleMusic(args: Record<string, unknown>) {
  const server = serverOf(args);
  const musics = (await loadModule(server, "musics")) as { id: number; title: string; pronunciation?: string; lyricist?: string; composer?: string; arranger?: string; publishedAt?: number; isNewlyWrittenMusic?: boolean }[];
  let hits = musics;
  const id = num(args, "id"); const q = (str(args, "q") || "").toLowerCase();
  if (id != null) hits = musics.filter((m) => m.id === id);
  else if (q) hits = musics.filter((m) => [m.title, m.pronunciation, m.composer, m.lyricist].join(" ").toLowerCase().includes(q));
  hits = hits.sort((a,b)=>b.id-a.id).slice(0, num(args, "limit") ?? 10);
  return { server, total: musics.length, musics: hits.map((m) => ({ id: m.id, title: m.title, pronunciation: m.pronunciation, lyricist: m.lyricist, composer: m.composer, arranger: m.arranger, published: tsMs(m.publishedAt), original: !!m.isNewlyWrittenMusic, page: `https://sekai.best/music/${m.id}` })) };
}

async function handleGacha(args: Record<string, unknown>) {
  const server = serverOf(args);
  const gachas = (await loadModule(server, "gachas")) as { id: number; name: string; gachaType: string; startAt?: number; endAt?: number; pickupCardIds?: number[] }[];
  const now = Date.now();
  let hits = gachas;
  if (bool(args, "current")) hits = gachas.filter((g) => (g.startAt || 0) <= now && now <= (g.endAt || 0));
  else if (num(args, "id") != null) hits = gachas.filter((g) => g.id === num(args, "id"));
  else if (str(args, "q")) { const q = str(args, "q")!.toLowerCase(); hits = gachas.filter((g) => (g.name || "").toLowerCase().includes(q)); }
  hits = hits.sort((a,b)=>(b.startAt||0)-(a.startAt||0)).slice(0, num(args, "limit") ?? 8);
  return { server, gachas: hits.map((g) => ({ id: g.id, name: g.name, type: g.gachaType, start: tsMs(g.startAt), end: tsMs(g.endAt), pickup_card_ids: g.pickupCardIds || [], page: `https://sekai.best/gacha/${g.id}` })) };
}

async function handleSearch(args: Record<string, unknown>) {
  const query = str(args, "query") || "";
  const parts = query.split(/\s+/).filter(Boolean);
  const parsed: Record<string, unknown> = { server: serverOf(args), limit: num(args, "limit") ?? 10 };
  const leftover: string[] = [];
  for (const p of parts) {
    const pl = p.toLowerCase();
    if (RARITY_IN[pl] && !parsed.rarity) parsed.rarity = pl;
    else if (ATTR_IN[pl] && !parsed.attr) parsed.attr = pl;
    else if (TYPE_IN[pl] && !parsed.type) parsed.type = pl;
    else if (UNIT_CODE[pl] && !parsed.unit) parsed.unit = pl;
    else if (/^\d+$/.test(pl) && Number(pl) >= 10 && parsed.id == null) parsed.id = Number(pl);
    else leftover.push(p);
  }
  const { chars } = await context(serverOf(args));
  if (leftover.length) {
    const cid = resolveCharacter(leftover.join(" "), chars);
    if (cid != null) parsed.character = String(cid); else parsed.q = leftover.join(" ");
  }
  const card = await handleCard(parsed);
  const extra: Record<string, unknown> = { query, parsed, card };
  if (leftover.length && !parsed.character) {
    extra.event = await handleEvent({ server: parsed.server, q: leftover.join(" "), limit: 5 });
    extra.music = await handleMusic({ server: parsed.server, q: leftover.join(" "), limit: 5 });
  }
  return extra;
}

const serverProp = { type: "string" as const, enum: serverEnum, description: "Master-data region. jp is the lead server.", default: "jp" };

export const projectSekaiSkill: Skill = {
  id: "project-sekai",
  title: "Project SEKAI",
  description: "Cards, characters, events, songs, and gacha from sekai.best / Sekai-World master data.",
  version: "1.0.0",
  tools: [
    { name: "pjsk_search", description: "Smart search. Mixed queries like 'kohane 4 cute' or a song title.", inputSchema: { type: "object", properties: { query: { type: "string" }, server: serverProp, limit: { type: "number", default: 10 } }, required: ["query"] }, handler: handleSearch },
    { name: "pjsk_card", description: "Look up a card by id or filter by character, unit, rarity, attribute, type.", inputSchema: { type: "object", properties: { id: { type: "number" }, character: { type: "string" }, unit: { type: "string" }, rarity: { type: "string" }, attr: { type: "string" }, type: { type: "string" }, q: { type: "string" }, server: serverProp, limit: { type: "number", default: 15 } } }, handler: handleCard },
    { name: "pjsk_character", description: "Character profile and card counts by rarity.", inputSchema: { type: "object", properties: { name: { type: "string" }, server: serverProp }, required: ["name"] }, handler: handleCharacter },
    { name: "pjsk_event", description: "Current, named, or numbered event.", inputSchema: { type: "object", properties: { id: { type: "number" }, q: { type: "string" }, current: { type: "boolean", default: false }, server: serverProp } }, handler: handleEvent },
    { name: "pjsk_music", description: "Look up songs by id, title, or composer.", inputSchema: { type: "object", properties: { id: { type: "number" }, q: { type: "string" }, server: serverProp, limit: { type: "number", default: 10 } } }, handler: handleMusic },
    { name: "pjsk_gacha", description: "Current or named gacha banners and pickup card ids.", inputSchema: { type: "object", properties: { id: { type: "number" }, q: { type: "string" }, current: { type: "boolean", default: false }, server: serverProp } }, handler: handleGacha },
    { name: "pjsk_counts", description: "Card counts for every character.", inputSchema: { type: "object", properties: { server: serverProp } }, handler: handleCounts },
  ],
};
