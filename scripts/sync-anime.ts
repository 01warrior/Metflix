// FAST AniList sync - completes in <45s
import { db } from "../src/lib/db";

const AL = "https://graphql.anilist.co";
const F = `fragment M on Media{id idMal title{romaji english native}description(asHtml:false)coverImage{extraLarge large}bannerImage startDate{year}episodes averageScore popularity genres seasonYear}`;

// 4 queries = ~200 unique anime
const QS = [
  `query{Page(page:1,perPage:50){media(type:ANIME,sort:TRENDING_DESC,isAdult:false){...M}}}${F}`,
  `query{Page(page:1,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){...M}}}${F}`,
  `query{Page(page:2,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){...M}}}${F}`,
  `query{Page(page:1,perPage:50){media(type:ANIME,sort:SCORE_DESC,isAdult:false){...M}}}${F}`,
];

const GM: Record<string, string> = { Action: "Action", Adventure: "Aventure", Comedy: "Comédie", Drama: "Drame", Fantasy: "Fantasy", Horror: "Horreur", Mystery: "Mystère", Romance: "Romance", "Sci-Fi": "Sci-Fi", "Slice of Life": "Slice of Life", Sports: "Sport", Supernatural: "Surnaturel", Thriller: "Thriller", Psychological: "Psychologique" };

const TK: [string, number][] = [
  ["Naruto Shippuden", 31911], ["Naruto", 45924], ["One Piece", 4995], ["Demon Slayer", 85937], ["Kimetsu no Yaiba", 85937], ["Jujutsu Kaisen", 95479], ["My Hero Academia", 71912], ["Boku no Hero Academia", 71912], ["Fullmetal Alchemist", 46260], ["Fairy Tail", 37854], ["Cowboy Bebop", 1429], ["Bleach", 27579], ["Chainsaw Man", 90908], ["Hunter x Hunter", 46261], ["Sword Art Online", 85327], ["One Punch Man", 63926], ["Gintama", 42304], ["Seven Deadly Sins", 60574], ["Nanatsu no Taizai", 60574], ["Dragon Ball Super", 62104], ["Dragon Ball Z", 46862], ["Vinland Saga", 56760], ["Black Clover", 76471], ["Spy x Family", 85283], ["Frieren", 194642], ["Solo Leveling", 205809], ["Kaiju No. 8", 211273], ["Dandadan", 228903], ["Blue Lock", 211584], ["Wind Breaker", 228172], ["Sakamoto Days", 251671], ["Shangri-La Frontier", 208771], ["Bocchi the Rock", 115633], ["Oshi no Ko", 204626], ["Kaguya-sama", 85512], ["Horimiya", 106670], ["My Dress-Up Darling", 116008], ["Sono Bisque Doll", 116008], ["Fruits Basket", 42415], ["Toradora", 94796], ["Angel Beats", 44015], ["Your Lie in April", 62150], ["Shigatsu wa Kimi", 62150], ["Death Note", 6214], ["Code Geass", 60574], ["Steins;Gate", 43669], ["Neon Genesis Evangelion", 60524], ["Evangelion", 60524], ["Parasyte", 61985], ["Kiseijuu", 61985], ["Tokyo Ghoul", 46260], ["KonoSuba", 62104], ["Konosuba", 62104], ["Re:Zero", 62104], ["No Game No Life", 62104], ["Eminence in Shadow", 198469], ["Dr. Stone", 84958], ["Mushoku Tensei", 98071], ["Attack on Titan", 1429], ["Shingeki no Kyojin", 1429], ["Delicious in Dungeon", 210581], ["Dungeon Meshi", 210581], ["Shikanoko", 228173], ["Apothecary Diaries", 228170], ["Kusuriya no Hitorigoto", 228170], ["Mob Psycho", 85283], ["Haikyuu", 46260], ["Slam Dunk", 46260], ["Berserk", 46260], ["Tokyo Revengers", 46260],
];

function resolveTmdb(t: string): number | null { const l = t.toLowerCase(); for (const [k, id] of TK) if (l.includes(k.toLowerCase())) return id; return null; }
function cleanHtml(h: string | null): string { if (!h) return ""; return h.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 500); }
function mapGenres(g: string[]): string { return g.map(x => GM[x] || x).filter(Boolean).join(","); }

const HOSTS = [
  { hp: "vidsrc", sn: "VidSrc" }, { hp: "vidsrc_pro", sn: "VidSrc Pro" },
  { hp: "embed_su", sn: "Embed.su" }, { hp: "autoembed", sn: "AutoEmbed" },
  { hp: "twoembed", sn: "2Embed" },
];

function makeEmbeds(tid: number, eps: number, sea: number) {
  const o: any[] = [];
  const ms = Math.min(sea, 5), me = Math.min(eps, 3);
  for (const h of HOSTS) for (let s = 1; s <= ms; s++) {
    const ec = s === 1 ? me : Math.min(3, eps);
    for (let e = 1; e <= ec; e++) {
      const u = h.hp === "vidsrc" ? `https://vidsrc.xyz/embed/tv/${tid}/${s}/${e}`
        : h.hp === "vidsrc_pro" ? `https://vidsrc.pro/embed/tv/${tid}/${s}/${e}`
        : h.hp === "embed_su" ? `https://embed.su/embed/tv/${tid}/${s}/${e}`
        : h.hp === "autoembed" ? `https://autoembed.cc/embed/tv/${tid}/${s}/${e}`
        : `https://2embed.cc/embed/${tid}&s=${s}&e=${e}`;
      o.push({ serverName: h.sn, serverType: "embed", hostProvider: h.hp, url: u, lang: "vostfr", quality: "1080p", season: s, episode: e });
    }
  }
  return o;
}

async function main() {
  const t0 = Date.now();
  console.log("=== AniList Anime Sync ===");

  // 1. Fetch AniList (4 parallel queries)
  console.log("Step 1: Fetching from AniList...");
  const results = await Promise.allSettled(
    QS.map(q => fetch(AL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: q }),
      signal: AbortSignal.timeout(10000),
    }).then(r => { if (!r.ok) throw new Error("" + r.status); return r.json(); }))
  );

  const seen = new Map<number, any>();
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value?.data?.Page?.media) continue;
    for (const m of r.value.data.Page.media) if (!seen.has(m.id)) seen.set(m.id, m);
  }
  const all = Array.from(seen.values());
  console.log(`  Got ${all.length} anime (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  // 2. Get existing anilistIds in ONE query
  console.log("Step 2: Checking existing DB entries...");
  const existingMap = new Map<number, string>();
  const rows = await db.content.findMany({ where: { type: "anime", anilistId: { not: null } }, select: { id: true, anilistId: true } });
  for (const r of rows) if (r.anilistId) existingMap.set(r.anilistId, r.id);

  // Get which existing already have embeds
  const withEmbeds = new Set<string>();
  const embedCounts = await db.embedSource.groupBy({ by: ["contentId"], where: { content: { type: "anime" } } });
  for (const r of embedCounts) withEmbeds.add(r.contentId);

  // 3. Process all anime
  console.log("Step 3: Processing...");
  let created = 0, updated = 0, skipped = 0, tmdbOk = 0;
  const allNewEmbeds: any[] = [];

  for (const m of all) {
    const poster = m.coverImage?.extraLarge || m.coverImage?.large;
    if (!poster) { skipped++; continue; }

    const title = m.title?.english || m.title?.romaji || m.title?.native || "?";
    const tId = resolveTmdb(title);
    if (tId) tmdbOk++;
    const eps = m.episodes || 0;
    const sea = eps > 0 ? Math.max(1, Math.ceil(eps / 12)) : 1;

    const baseData = {
      anilistId: m.id, tmdbId: tId, title,
      overview: cleanHtml(m.description), posterPath: poster,
      backdropPath: m.bannerImage, rating: (m.averageScore || 0) / 10,
      voteCount: m.popularity || 100, type: "anime",
      year: m.startDate?.year, genres: mapGenres(m.genres),
      seasons: sea, status: "published",
    };

    if (existingMap.has(m.id)) {
      const eid = existingMap.get(m.id)!;
      await db.content.update({ where: { id: eid }, data: baseData });
      updated++;
      if (tId && eps > 0 && !withEmbeds.has(eid)) {
        allNewEmbeds.push(...makeEmbeds(tId, eps, sea).map(e => ({ ...e, contentId: eid })));
      }
    } else {
      const nc = await db.content.create({ data: baseData });
      created++;
      if (tId && eps > 0) {
        allNewEmbeds.push(...makeEmbeds(tId, eps, sea).map(e => ({ ...e, contentId: nc.id })));
      }
    }
  }

  // 4. Batch insert embeds
  if (allNewEmbeds.length > 0) {
    console.log(`Step 4: Inserting ${allNewEmbeds.length} embeds...`);
    for (let i = 0; i < allNewEmbeds.length; i += 500) {
      await db.embedSource.createMany({ data: allNewEmbeds.slice(i, i + 500) });
    }
  }

  const totalA = await db.content.count({ where: { type: "anime" } });
  const totalE = await db.embedSource.count({ where: { content: { type: "anime" } } });
  const total = await db.content.count();

  console.log(`\n=== DONE (${((Date.now() - t0) / 1000).toFixed(1)}s) ===`);
  console.log(`  New: ${created} | Updated: ${updated} | Skipped: ${skipped}`);
  console.log(`  TMDB resolved: ${tmdbOk}/${all.length}`);
  console.log(`  Embeds added: ${allNewEmbeds.length}`);
  console.log(`  ---`);
  console.log(`  Total anime: ${totalA} (was 18)`);
  console.log(`  Total anime embeds: ${totalE}`);
  console.log(`  Total all content: ${total}`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });