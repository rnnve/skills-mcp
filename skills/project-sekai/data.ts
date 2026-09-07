const BASES: Record<string, string> = {
  jp: "https://sekai-world.github.io/sekai-master-db-diff",
  en: "https://sekai-world.github.io/sekai-master-db-en-diff",
  tw: "https://sekai-world.github.io/sekai-master-db-tc-diff",
  kr: "https://sekai-world.github.io/sekai-master-db-kr-diff",
  cn: "https://sekai-world.github.io/sekai-master-db-cn-diff",
};

const ASSET: Record<string, string> = {
  jp: "https://storage.sekai.best/sekai-jp-assets",
  en: "https://storage.sekai.best/sekai-en-assets",
  tw: "https://storage.sekai.best/sekai-tc-assets",
  kr: "https://storage.sekai.best/sekai-kr-assets",
  cn: "https://storage.sekai.best/sekai-cn-assets",
};

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 12 * 60 * 60 * 1000;

const CARD_KEEP = [
  "id", "seq", "characterId", "cardRarityType", "attr", "supportUnit",
  "skillId", "cardSkillName", "prefix", "assetbundleName", "releaseAt", "cardSupplyId",
] as const;

export async function loadModule(server: string, module: string): Promise<unknown> {
  const key = `${server}:${module}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const url = `${BASES[server] || BASES.jp}/${module}.json`;
  const res = await fetch(url, { headers: { "user-agent": "skills-mcp/1.0" }, next: { revalidate: 43200 } });
  if (!res.ok) throw new Error(`fetch ${module} ${server} failed: ${res.status}`);
  let data: unknown = await res.json();
  if (module === "cards" && Array.isArray(data)) {
    data = data.map((c: Record<string, unknown>) => {
      const slim: Record<string, unknown> = {};
      for (const k of CARD_KEEP) slim[k] = c[k];
      return slim;
    });
  }
  if (module === "gachas" && Array.isArray(data)) {
    data = data.map((g: Record<string, unknown>) => {
      const pickups = (g.gachaPickups as { cardId?: number }[]) || [];
      return { id: g.id, name: g.name, gachaType: g.gachaType, startAt: g.startAt, endAt: g.endAt, pickupCardIds: pickups.map((p) => p.cardId).filter(Boolean) };
    });
  }
  if (module === "events" && Array.isArray(data)) {
    data = data.map((e: Record<string, unknown>) => {
      const { eventRankingRewardRanges: _drop, ...rest } = e;
      return rest;
    });
  }
  cache.set(key, { at: Date.now(), data });
  return data;
}

export function assetBase(server: string) {
  return ASSET[server] || ASSET.jp;
}

export function tsMs(ms?: number | null) {
  if (!ms) return null;
  const d = new Date(ms + 9 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} JST`;
}

export const UNIT_EN: Record<string, string> = {
  light_sound: "Leo/need", idol: "MORE MORE JUMP!", street: "Vivid BAD SQUAD",
  theme_park: "WonderlandsxShowtime", school_refusal: "25-ji, Nightcord de.", piapro: "VIRTUAL SINGER", none: "-",
};

export const UNIT_CODE: Record<string, string> = {
  ln: "light_sound", "l/n": "light_sound", leo: "light_sound", leoneed: "light_sound",
  mmj: "idol", vbs: "street", vivid: "street", wxs: "theme_park", wonderlands: "theme_park",
  n25: "school_refusal", niigo: "school_refusal", nightcord: "school_refusal", "25ji": "school_refusal",
  vs: "piapro", virtual: "piapro", piapro: "piapro",
  light_sound: "light_sound", idol: "idol", street: "street", theme_park: "theme_park", school_refusal: "school_refusal",
};

export const RARITY: Record<string, string> = {
  rarity_1: "1*", rarity_2: "2*", rarity_3: "3*", rarity_4: "4*", rarity_birthday: "Birthday",
};

export const RARITY_IN: Record<string, string> = {
  "1": "rarity_1", "2": "rarity_2", "3": "rarity_3", "4": "rarity_4", bd: "rarity_birthday", birthday: "rarity_birthday",
};

export const ATTR_IN: Record<string, string> = {
  cute: "cute", cool: "cool", pure: "pure", happy: "happy", mysterious: "mysterious",
};

export const TYPE_IN: Record<string, string> = {
  permanent: "normal", perm: "normal", normal: "normal", limited: "term_limited", lim: "term_limited",
  birthday: "birthday", bd: "birthday", cafes: "colorful_festival_limited", colorful: "colorful_festival_limited",
  bloomfes: "bloom_festival_limited", bloom: "bloom_festival_limited", unit: "unit_event_limited", collab: "collaboration_limited",
};

export const SUPPLY: Record<string, string> = {
  normal: "Permanent", birthday: "Birthday", term_limited: "Limited",
  colorful_festival_limited: "Colorful Festival", bloom_festival_limited: "Bloom Festival",
  unit_event_limited: "Unit Limited", collaboration_limited: "Collaboration",
};

export const CHAR_EN: Record<number, string> = {
  1: "Hoshino Ichika", 2: "Tenma Saki", 3: "Mochizuki Honami", 4: "Hinomori Shiho",
  5: "Hanasato Minori", 6: "Kiritani Haruka", 7: "Momoi Airi", 8: "Hinomori Shizuku",
  9: "Azusawa Kohane", 10: "Shiraishi An", 11: "Shinonome Akito", 12: "Aoyagi Toya",
  13: "Tenma Tsukasa", 14: "Otori Emu", 15: "Kusanagi Nene", 16: "Kamishiro Rui",
  17: "Yoisaki Kanade", 18: "Asahina Mafuyu", 19: "Shinonome Ena", 20: "Akiyama Mizuki",
  21: "Hatsune Miku", 22: "Kagamine Rin", 23: "Kagamine Len", 24: "Megurine Luka",
  25: "MEIKO", 26: "KAITO",
};

export const CHAR_ALIAS: Record<string, number> = {
  ichika: 1, ichi: 1, saki: 2, honami: 3, hona: 3, shiho: 4,
  minori: 5, mino: 5, haruka: 6, haru: 6, airi: 7, shizuku: 8, shizu: 8,
  kohane: 9, koha: 9, an: 10, akito: 11, aki: 11, toya: 12, touya: 12,
  tsukasa: 13, emu: 14, nene: 15, rui: 16, kanade: 17, kana: 17,
  mafuyu: 18, mafu: 18, yuki: 18, ena: 19, mizuki: 20,
  miku: 21, rin: 22, len: 23, luka: 24, ruka: 24, meiko: 25, kaito: 26,
};

export type Card = {
  id: number; characterId: number; cardRarityType: string; attr: string;
  supportUnit?: string; cardSkillName?: string; prefix?: string;
  assetbundleName?: string; releaseAt?: number; cardSupplyId?: number;
};
export type Character = { id: number; firstName?: string; givenName?: string; unit?: string };
export type Supply = { id: number; cardSupplyType: string };

export function resolveCharacter(token: string | undefined, chars: Character[]): number | undefined {
  if (!token) return undefined;
  const t = token.trim();
  if (/^\d+$/.test(t)) return Number(t);
  const key = t.toLowerCase();
  if (CHAR_ALIAS[key] != null) return CHAR_ALIAS[key];
  const compact = key.replace(/[^a-z0-9]/g, "");
  for (const [alias, id] of Object.entries(CHAR_ALIAS)) {
    if (alias.replace(/[^a-z0-9]/g, "") === compact) return id;
  }
  for (const ch of chars) {
    const names = [CHAR_EN[ch.id] || "", `${ch.firstName || ""}${ch.givenName || ""}`, ch.givenName || ""];
    if (names.some((n) => n.toLowerCase().replace(/[^a-z0-9]/g, "").includes(compact))) return ch.id;
  }
  return undefined;
}

export function cardView(c: Card, chars: Character[], supplies: Supply[], server: string, en?: Record<number, Card>) {
  const ch = chars.find((x) => x.id === c.characterId);
  const st = supplies.find((s) => s.id === (c.cardSupplyId || 1))?.cardSupplyType || "normal";
  const asset = c.assetbundleName || "";
  const base = assetBase(server);
  return {
    id: c.id,
    title_jp: server === "jp" ? c.prefix : en?.[c.id]?.prefix || c.prefix,
    title_en: server === "en" ? c.prefix : en?.[c.id]?.prefix || "",
    character: CHAR_EN[c.characterId],
    character_jp: `${ch?.firstName || ""}${ch?.givenName || ""}`.trim(),
    unit: UNIT_EN[ch?.unit || ""] || ch?.unit,
    support_unit: UNIT_EN[c.supportUnit || "none"] || c.supportUnit || "-",
    rarity: RARITY[c.cardRarityType] || c.cardRarityType,
    attr: (c.attr || "").replace(/^\w/, (s) => s.toUpperCase()),
    type: SUPPLY[st] || st,
    skill: c.cardSkillName,
    release: tsMs(c.releaseAt),
    page: `https://sekai.best/card/${c.id}`,
    thumb: asset ? `${base}/thumbnail/chara/${asset}_normal.webp` : null,
  };
}
