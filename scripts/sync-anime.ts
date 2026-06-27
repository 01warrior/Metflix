// AniList Anime Sync - Extended Edition (500+ anime)
// AniList API: 100% free, no key, unlimited
import { db } from "../src/lib/db";

const AL = "https://graphql.anilist.co";
const F = `fragment M on Media{id idMal title{romaji english native}description(asHtml:false)coverImage{extraLarge large}bannerImage startDate{year}episodes averageScore popularity genres seasonYear studios{nodes{name isAnimationStudio}}}`;

// 15 queries: 4 trending + 6 popular + 5 top-rated = ~750 raw, ~500 unique
const Q: string[] = [];
for (let p = 1; p <= 4; p++) Q.push(`query{Page(page:${p},perPage:50){media(type:ANIME,sort:TRENDING_DESC,isAdult:false){...M}}}${F}`);
for (let p = 1; p <= 6; p++) Q.push(`query{Page(page:${p},perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){...M}}}${F}`);
for (let p = 1; p <= 5; p++) Q.push(`query{Page(page:${p},perPage:50){media(type:ANIME,sort:SCORE_DESC,isAdult:false){...M}}}${F}`);

// Genre queries (12 genres × 1 page = ~300 more)
const GENRES = ["Action","Adventure","Comedy","Drama","Fantasy","Romance","Sci-Fi","Horror","Thriller","Sports","Supernatural","Mystery"];
for (const g of GENRES) Q.push(`query($g:String){Page(page:1,perPage:25){media(type:ANIME,genre:$g,sort:POPULARITY_DESC,isAdult:false){...M}}}${F}`);

const GM: Record<string, string> = {
  Action:"Action",Adventure:"Aventure",Comedy:"Comédie",Drama:"Drame",Fantasy:"Fantasy",
  Horror:"Horreur",Mystery:"Mystère",Romance:"Romance","Sci-Fi":"Sci-Fi",
  "Slice of Life":"Slice of Life",Sports:"Sport",Supernatural:"Surnaturel",
  Thriller:"Thriller",Psychological:"Psychologique",
};

const TK: [string,number][] = [
  ["Naruto Shippuden",31911],["Naruto",45924],["One Piece",4995],
  ["Demon Slayer",85937],["Kimetsu no Yaiba",85937],["Jujutsu Kaisen",95479],
  ["My Hero Academia",71912],["Boku no Hero Academia",71912],
  ["Fullmetal Alchemist",46260],["Fairy Tail",37854],["Cowboy Bebop",1429],
  ["Bleach",27579],["Chainsaw Man",90908],["Hunter x Hunter",46261],
  ["Sword Art Online",85327],["One Punch Man",63926],["Gintama",42304],
  ["Seven Deadly Sins",60574],["Nanatsu no Taizai",60574],
  ["Dragon Ball Super",62104],["Dragon Ball Z",46862],["Vinland Saga",56760],
  ["Black Clover",76471],["Spy x Family",85283],["Frieren",194642],
  ["Solo Leveling",205809],["Kaiju No. 8",211273],["Dandadan",228903],
  ["Blue Lock",211584],["Wind Breaker",228172],["Sakamoto Days",251671],
  ["Shangri-La Frontier",208771],["Bocchi the Rock",115633],
  ["Oshi no Ko",204626],["Kaguya-sama",85512],["Horimiya",106670],
  ["My Dress-Up Darling",116008],["Sono Bisque Doll",116008],
  ["Fruits Basket",42415],["Toradora",94796],["Angel Beats",44015],
  ["Your Lie in April",62150],["Shigatsu wa Kimi",62150],
  ["Death Note",6214],["Code Geass",60574],["Steins;Gate",43669],
  ["Neon Genesis Evangelion",60524],["Evangelion",60524],
  ["Parasyte",61985],["Kiseijuu",61985],["Tokyo Ghoul",46260],
  ["KonoSuba",62104],["Konosuba",62104],["Re:Zero",62104],
  ["No Game No Life",62104],["Eminence in Shadow",198469],
  ["Dr. Stone",84958],["Mushoku Tensei",98071],["Attack on Titan",1429],
  ["Shingeki no Kyojin",1429],["Delicious in Dungeon",210581],
  ["Dungeon Meshi",210581],["Shikanoko",228173],
  ["Apothecary Diaries",228170],["Kusuriya no Hitorigoto",228170],
  ["Mob Psycho",85283],["Haikyuu",46260],["Slam Dunk",46260],
  ["Bleach",27579],["Berserk",46260],["Claymore",46260],
  ["Tokyo Revengers",46260],["Lookism",46260],
];

function tmdb(title: string): number | null {
  const l = title.toLowerCase();
  for (const [k, id] of TK) if (l.includes(k.toLowerCase())) return id;
  return null;
}

function clean(h: string | null): string {
  if (!h) return "";
  return h.replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]*>/g,"")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ")
    .replace(/\n{3,}/g,"\n\n").trim().slice(0,500);
}

function mg(gs: string[]): string { return gs.map(g=>GM[g]||g).filter(Boolean).join(","); }

const H = [
  {hp:"vidsrc",sn:"VidSrc"},{hp:"vidsrc_pro",sn:"VidSrc Pro"},
  {hp:"embed_su",sn:"Embed.su"},{hp:"autoembed",sn:"AutoEmbed"},
  {hp:"twoembed",sn:"2Embed"},
];

function emb(tid: number, eps: number, sea: number) {
  const o: any[] = [];
  const ms = Math.min(sea, 5), me = Math.min(eps, 3);
  for (const h of H) for (let s = 1; s <= ms; s++) {
    const ec = s === 1 ? me : Math.min(3, eps);
    for (let e = 1; e <= ec; e++) {
      const u = h.hp==="vidsrc"?`https://vidsrc.xyz/embed/tv/${tid}/${s}/${e}`
        :h.hp==="vidsrc_pro"?`https://vidsrc.pro/embed/tv/${tid}/${s}/${e}`
        :h.hp==="embed_su"?`https://embed.su/embed/tv/${tid}/${s}/${e}`
        :h.hp==="autoembed"?`https://autoembed.cc/embed/tv/${tid}/${s}/${e}`
        :`https://2embed.cc/embed/${tid}&s=${s}&e=${e}`;
      o.push({serverName:h.sn,serverType:"embed",hostProvider:h.hp,url:u,lang:"vostfr",quality:"1080p",season:s,episode:e});
    }
  }
  return o;
}

async function fetchQ(q: string, vars?: Record<string,unknown>) {
  const r = await fetch(AL, {
    method: "POST",
    headers: {"Content-Type":"application/json", Accept:"application/json"},
    body: JSON.stringify({query: q, variables: vars}),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function main() {
  console.log("=== AniList Anime Sync (Extended) ===");
  const t0 = Date.now();

  // 1. Fetch all queries in parallel (batches of 8 to avoid overwhelming)
  console.log(`📡 Fetching ${Q.length} queries from AniList...`);
  const seen = new Map<number, any>();
  const BATCH = 8;

  for (let i = 0; i < Q.length; i += BATCH) {
    const batch = Q.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(q => fetchQ(q)));
    for (const r of results) {
      if (r.status !== "fulfilled" || !r.value?.data?.Page?.media) continue;
      for (const m of r.value.data.Page.media) {
        if (!seen.has(m.id)) seen.set(m.id, m);
      }
    }
    console.log(`  Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(Q.length/BATCH)}: ${seen.size} unique so far`);
  }

  const all = Array.from(seen.values());
  console.log(`✅ Total unique anime fetched: ${all.length}`);

  // 2. Prepare all DB operations
  let created = 0, updated = 0, skipped = 0, withEmbeds = 0, tmdbOk = 0;
  const embedBatch: any[] = [];

  for (const m of all) {
    try {
      const poster = m.coverImage?.extraLarge || m.coverImage?.large;
      if (!poster) { skipped++; continue; }

      const title = m.title?.english || m.title?.romaji || m.title?.native || "?";
      const tid = tmdb(title);
      if (tid) tmdbOk++;
      const eps = m.episodes || 0;
      const sea = eps > 0 ? Math.max(1, Math.ceil(eps / 12)) : 1;

      const existing = m.id ? await db.content.findUnique({ where: { anilistId: m.id } }).catch(() => null) : null;

      if (existing) {
        await db.content.update({
          where: { id: existing.id },
          data: {
            anilistId: m.id, tmdbId: tid || existing.tmdbId,
            title, overview: clean(m.description) || existing.overview,
            posterPath: poster, backdropPath: m.bannerImage || existing.backdropPath,
            rating: (m.averageScore || 0) / 10, year: m.startDate?.year || existing.year,
            genres: mg(m.genres) || existing.genres, seasons: sea,
          },
        });
        updated++;
        if (tid && eps > 0) {
          const cnt = await db.embedSource.count({ where: { contentId: existing.id } });
          if (cnt === 0) {
            const e = emb(tid, eps, sea);
            embedBatch.push(...e.map(x => ({ ...x, contentId: existing.id })));
            withEmbeds++;
          }
        }
      } else {
        const nc = await db.content.create({
          data: {
            anilistId: m.id, tmdbId: tid, title,
            overview: clean(m.description), posterPath: poster,
            backdropPath: m.bannerImage, rating: (m.averageScore || 0) / 10,
            voteCount: m.popularity || 100, type: "anime",
            year: m.startDate?.year, genres: mg(m.genres),
            seasons: sea, status: "published",
          },
        });
        created++;
        if (tid && eps > 0) {
          const e = emb(tid, eps, sea);
          embedBatch.push(...e.map(x => ({ ...x, contentId: nc.id })));
          withEmbeds++;
        }
      }
    } catch (err) {
      console.error(`  ⚠️ ${m.title?.english||"?"}: ${err}`);
    }
  }

  // 3. Batch insert all embeds
  if (embedBatch.length > 0) {
    console.log(`\n📦 Inserting ${embedBatch.length} embed sources in batches...`);
    const CHUNK = 500;
    for (let i = 0; i < embedBatch.length; i += CHUNK) {
      await db.embedSource.createMany({ data: embedBatch.slice(i, i + CHUNK) });
      console.log(`  ${Math.min(i + CHUNK, embedBatch.length)}/${embedBatch.length}`);
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const totalA = await db.content.count({ where: { type: "anime" } });
  const totalE = await db.embedSource.count({ where: { content: { type: "anime" } } });

  console.log(`\n=== DONE (${elapsed}s) ===`);
  console.log(`  Fetched: ${all.length} | Created: ${created} | Updated: ${updated} | Skipped: ${skipped}`);
  console.log(`  TMDB IDs resolved: ${tmdbOk}/${all.length}`);
  console.log(`  Anime with embeds: ${withEmbeds} | Total embeds added: ${embedBatch.length}`);
  console.log(`  ───────────────────────`);
  console.log(`  🎯 Total anime in DB: ${totalA}`);
  console.log(`  🎯 Total anime embeds: ${totalE}`);
  console.log(`  🎯 Total all content: ${await db.content.count()}`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });