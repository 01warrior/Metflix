// Fast AniList sync - single file, minimal overhead
import { db } from "../src/lib/db";

const ANILIST = "https://graphql.anilist.co";
const FRAGMENT = `
  fragment M on Media {
    id idMal
    title { romaji english native }
    description(asHtml: false)
    coverImage { extraLarge large }
    bannerImage
    startDate { year }
    episodes averageScore popularity
    genres status format seasonYear
    studios { nodes { name isAnimationStudio } }
  }
`;

const QUERIES = [
  `query{Page(page:1,perPage:50){media(type:ANIME,sort:TRENDING_DESC,isAdult:false){...M}}}${FRAGMENT}`,
  `query{Page(page:1,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){...M}}}${FRAGMENT}`,
  `query{Page(page:2,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){...M}}}${FRAGMENT}`,
  `query{Page(page:1,perPage:50){media(type:ANIME,sort:SCORE_DESC,isAdult:false){...M}}}${FRAGMENT}`,
  `query{Page(page:2,perPage:50){media(type:ANIME,sort:SCORE_DESC,isAdult:false){...M}}}${FRAGMENT}`,
];

const GENRE_MAP: Record<string, string> = {
  Action: "Action", Adventure: "Aventure", Comedy: "Comédie", Drama: "Drame",
  Fantasy: "Fantasy", Horror: "Horreur", Mystery: "Mystère", Romance: "Romance",
  "Sci-Fi": "Sci-Fi", "Slice of Life": "Slice of Life", Sports: "Sport",
  Supernatural: "Surnaturel", Thriller: "Thriller", Psychological: "Psychologique",
};

const TITLE_KW: [string, number][] = [
  ["Naruto Shippuden", 31911], ["Naruto", 45924], ["One Piece", 4995],
  ["Demon Slayer", 85937], ["Kimetsu no Yaiba", 85937],
  ["Jujutsu Kaisen", 95479], ["My Hero Academia", 71912],
  ["Boku no Hero Academia", 71912], ["Fullmetal Alchemist", 46260],
  ["Fairy Tail", 37854], ["Cowboy Bebop", 1429], ["Bleach", 27579],
  ["Chainsaw Man", 90908], ["Hunter x Hunter", 46261],
  ["Sword Art Online", 85327], ["One Punch Man", 63926],
  ["Gintama", 42304], ["Seven Deadly Sins", 60574],
  ["Nanatsu no Taizai", 60574], ["Dragon Ball Super", 62104],
  ["Dragon Ball Z", 46862], ["Vinland Saga", 56760],
  ["Black Clover", 76471], ["Spy x Family", 85283],
  ["Frieren", 194642], ["Solo Leveling", 205809],
  ["Kaiju No. 8", 211273], ["Dandadan", 228903],
  ["Blue Lock", 211584], ["Wind Breaker", 228172],
  ["Sakamoto Days", 251671], ["Shangri-La Frontier", 208771],
  ["Bocchi the Rock", 115633], ["Oshi no Ko", 204626],
  ["Kaguya-sama", 85512], ["Horimiya", 106670],
  ["My Dress-Up Darling", 116008], ["Sono Bisque Doll", 116008],
  ["Fruits Basket", 42415], ["Toradora", 94796],
  ["Angel Beats", 44015], ["Your Lie in April", 62150],
  ["Shigatsu wa Kimi", 62150], ["Death Note", 6214],
  ["Code Geass", 60574], ["Steins;Gate", 43669],
  ["Neon Genesis Evangelion", 60524], ["Evangelion", 60524],
  ["Parasyte", 61985], ["Kiseijuu", 61985], ["Tokyo Ghoul", 46260],
  ["KonoSuba", 62104], ["Konosuba", 62104], ["Re:Zero", 62104],
  ["No Game No Life", 62104], ["Eminence in Shadow", 198469],
  ["Dr. Stone", 84958], ["Mushoku Tensei", 98071],
  ["Attack on Titan", 1429], ["Shingeki no Kyojin", 1429],
  ["Delicious in Dungeon", 210581], ["Dungeon Meshi", 210581],
  ["Shikanoko", 228173], ["Apothecary Diaries", 228170],
  ["Kusuriya no Hitorigoto", 228170], ["Mob Psycho", 85283],
  ["Haikyuu", 46260], ["Kuroko", 46260], ["Slam Dunk", 46260],
];

function resolveTmdb(title: string, _malId: number | null): number | null {
  const lower = title.toLowerCase();
  for (const [kw, id] of TITLE_KW) {
    if (lower.includes(kw.toLowerCase())) return id;
  }
  return null;
}

function cleanHtml(h: string | null): string {
  if (!h) return "";
  return h.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n").trim().slice(0, 500);
}

function mapGenres(gs: string[]): string {
  return gs.map(g => GENRE_MAP[g] || g).filter(Boolean).join(",");
}

const HOSTS = [
  { hp: "vidsrc", sn: "VidSrc" }, { hp: "vidsrc_pro", sn: "VidSrc Pro" },
  { hp: "embed_su", sn: "Embed.su" }, { hp: "autoembed", sn: "AutoEmbed" },
  { hp: "twoembed", sn: "2Embed" },
];

function makeEmbeds(tmdbId: number, eps: number, seasons: number) {
  const out: any[] = [];
  const maxS = Math.min(seasons, 5);
  const maxE = Math.min(eps, 3);
  for (const h of HOSTS) {
    for (let s = 1; s <= maxS; s++) {
      const eCount = s === 1 ? maxE : Math.min(3, eps);
      for (let e = 1; e <= eCount; e++) {
        const url = h.hp === "vidsrc" ? `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`
          : h.hp === "vidsrc_pro" ? `https://vidsrc.pro/embed/tv/${tmdbId}/${s}/${e}`
          : h.hp === "embed_su" ? `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`
          : h.hp === "autoembed" ? `https://autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`
          : `https://2embed.cc/embed/${tmdbId}&s=${s}&e=${e}`;
        out.push({ serverName: h.sn, serverType: "embed", hostProvider: h.hp, url, lang: "vostfr", quality: "1080p", season: s, episode: e });
      }
    }
  }
  return out;
}

async function fetchPage(query: string) {
  const r = await fetch(ANILIST, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function main() {
  console.log("=== AniList Anime Sync ===");
  const t0 = Date.now();

  // Fetch all pages in parallel
  console.log("📡 Fetching from AniList (5 queries)...");
  const results = await Promise.allSettled(QUERIES.map(q => fetchPage(q)));
  const seen = new Map<number, any>();

  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value?.data?.Page?.media) continue;
    for (const m of r.value.data.Page.media) {
      if (!seen.has(m.id)) seen.set(m.id, m);
    }
  }

  const all = Array.from(seen.values());
  console.log(`✅ Got ${all.length} unique anime`);

  let created = 0, updated = 0, skipped = 0, withEmbeds = 0, tmdbOk = 0;

  for (const m of all) {
    try {
      const poster = m.coverImage?.extraLarge || m.coverImage?.large;
      if (!poster) { skipped++; continue; }

      const title = m.title?.english || m.title?.romaji || m.title?.native || "?";
      const tmdbId = resolveTmdb(title, m.idMal);
      if (tmdbId) tmdbOk++;

      const eps = m.episodes || 0;
      const seasons = eps > 0 ? Math.max(1, Math.ceil(eps / 12)) : 1;

      const existing = m.id ? await db.content.findUnique({ where: { anilistId: m.id } }).catch(() => null) : null;

      if (existing) {
        await db.content.update({
          where: { id: existing.id },
          data: {
            anilistId: m.id, tmdbId: tmdbId || existing.tmdbId,
            title, overview: cleanHtml(m.description) || existing.overview,
            posterPath: poster, backdropPath: m.bannerImage || existing.backdropPath,
            rating: (m.averageScore || 0) / 10, year: m.startDate?.year || existing.year,
            genres: mapGenres(m.genres) || existing.genres, seasons,
          },
        });
        updated++;
        if (tmdbId && eps > 0) {
          const cnt = await db.embedSource.count({ where: { contentId: existing.id } });
          if (cnt === 0) {
            const embeds = makeEmbeds(tmdbId, eps, seasons);
            if (embeds.length > 0) { await db.embedSource.createMany({ data: embeds.map(e => ({ ...e, contentId: existing.id })) }); withEmbeds++; }
          }
        }
      } else {
        const nc = await db.content.create({
          data: {
            anilistId: m.id, tmdbId: tmdbId, title,
            overview: cleanHtml(m.description), posterPath: poster,
            backdropPath: m.bannerImage, rating: (m.averageScore || 0) / 10,
            voteCount: m.popularity || 100, type: "anime",
            year: m.startDate?.year, genres: mapGenres(m.genres),
            seasons, status: "published",
          },
        });
        created++;
        if (tmdbId && eps > 0) {
          const embeds = makeEmbeds(tmdbId, eps, seasons);
          if (embeds.length > 0) { await db.embedSource.createMany({ data: embeds.map(e => ({ ...e, contentId: nc.id })) }); withEmbeds++; }
        }
      }
    } catch (err) {
      console.error(`  ⚠️ ${m.title?.english || "?"}: ${err}`);
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const totalA = await db.content.count({ where: { type: "anime" } });
  const totalE = await db.embedSource.count({ where: { content: { type: "anime" } } });

  console.log(`\n=== Done (${elapsed}s) ===`);
  console.log(`  New: ${created} | Updated: ${updated} | Skipped: ${skipped}`);
  console.log(`  TMDB resolved: ${tmdbOk}/${all.length}`);
  console.log(`  With embeds: ${withEmbeds}`);
  console.log(`  Total anime: ${totalA} | Total embeds: ${totalE}`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });