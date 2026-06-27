// Mapping of popular anime to their TMDB IDs
// Key: MAL ID (MyAnimeList) -> TMDB ID
// Used to generate embed URLs for AniList-sourced anime

const MAL_TO_TMDB: Record<number, number> = {
  // === Shounen / Action ===
  20: 45924,       // Naruto
  1735: 31911,     // Naruto Shippuden
  21: 4995,        // One Piece
  1535: 6214,      // Death Note
  16498: 85937,    // Demon Slayer
  40748: 95479,    // Jujutsu Kaisen
  31964: 71912,    // My Hero Academia
  5114: 46260,     // Fullmetal Alchemist: Brotherhood
  11757: 37854,    // Fairy Tail
  1: 1429,         // Cowboy Bebop
  36474: 85283,    // Spy x Family
  38000: 90908,    // Chainsaw Man
  11741: 46261,    // Hunter x Hunter (2011)
  22319: 85327,    // Sword Art Online
  30276: 63926,    // One Punch Man
  9969: 42304,     // Gintama
  22535: 60574,    // Seven Deadly Sins
  24401: 56760,    // Vinland Saga
  21540: 62104,    // Dragon Ball Super
  34572: 76471,    // Black Clover
  30: 60524,       // Neon Genesis Evangelion
  431: 60924,      // Dragon Ball
  11061: 46862,    // Dragon Ball Z

  // === 2024-2025 Hits ===
  50265: 194642,   // Frieren: Beyond Journey's End
  52991: 205809,   // Solo Leveling
  51009: 211273,   // Kaiju No. 8
  55215: 228903,   // Dandadan
  54847: 227329,   // Blue Lock S2
  49387: 228172,   // Wind Breaker
  56765: 251671,   // Sakamoto Days
  51535: 208771,   // Shangri-La Frontier
  47598: 115633,   // Bocchi the Rock!
  52853: 212261,   // Oshi no Ko S2
  51400: 204626,   // Oshi no Ko

  // === Sequels / Extra Seasons ===
  37510: 94605,    // Mob Psycho 100 III
  37509: 85283,    // Mob Psycho 100
  34096: 77010,    // MHA S4
  37991: 82563,    // MHA S5
  41467: 90187,    // MHA S6
  50865: 197194,   // Jujutsu Kaisen S2
  28851: 85512,    // Kaguya-sama S1
  34599: 103328,   // Kaguya-sama S2
  44511: 115086,   // Dr. Stone: New World
  40356: 84958,    // Dr. Stone S1
  48583: 98071,    // Mushoku Tensei S1
  49890: 208768,   // Mushoku Tensei S2
  33486: 76120,    // Konosuba S2
  21459: 62104,    // Konosuba S1
  42938: 112589,   // Fruits Basket: The Final

  // === Romance / Drama ===
  43608: 106670,   // Horimiya
  47778: 116008,   // My Dress-Up Darling
  37521: 94796,    // Toradora!
  2167: 6214,      // Clannad
  4181: 44015,     // Angel Beats!
  28977: 60574,    // No Game No Life
  19815: 44015,    // No Game No Life (dup, same TMDB entry)
  198469: 198469,  // The Eminence in Shadow
  93326: 93326,    // Mairimashita! Iruma-kun

  // === Sci-Fi / Thriller ===
  6214: 6214,      // Death Note (TMDB)
  43669: 43669,    // Steins;Gate
  61985: 61985,    // Parasyte
  53580: 211584,   // Blue Lock
};

// Title keyword -> TMDB ID fallback
const TITLE_KEYWORDS: [string, number][] = [
  ["Naruto Shippuden", 31911],
  ["Naruto Shippuuden", 31911],
  ["Naruto", 45924],
  ["One Piece", 4995],
  ["Demon Slayer", 85937],
  ["Kimetsu no Yaiba", 85937],
  ["Jujutsu Kaisen", 95479],
  ["My Hero Academia", 71912],
  ["Boku no Hero Academia", 71912],
  ["Fullmetal Alchemist", 46260],
  ["Fairy Tail", 37854],
  ["Cowboy Bebop", 1429],
  ["Bleach", 27579],
  ["Chainsaw Man", 90908],
  ["Hunter x Hunter", 46261],
  ["Sword Art Online", 85327],
  ["One Punch Man", 63926],
  ["Gintama", 42304],
  ["Seven Deadly Sins", 60574],
  ["Nanatsu no Taizai", 60574],
  ["Dragon Ball Super", 62104],
  ["Dragon Ball Z", 46862],
  ["Vinland Saga", 56760],
  ["Black Clover", 76471],
  ["Spy x Family", 85283],
  ["Frieren", 194642],
  ["Solo Leveling", 205809],
  ["Kaiju No. 8", 211273],
  ["Dandadan", 228903],
  ["Blue Lock", 211584],
  ["Wind Breaker", 228172],
  ["Sakamoto Days", 251671],
  ["Shangri-La Frontier", 208771],
  ["Bocchi the Rock", 115633],
  ["Oshi no Ko", 204626],
  ["Kaguya-sama", 85512],
  ["Horimiya", 106670],
  ["My Dress-Up Darling", 116008],
  ["Sono Bisque Doll", 116008],
  ["Fruits Basket", 42415],
  ["Toradora", 94796],
  ["Clannad", 6214],
  ["Angel Beats", 44015],
  ["Your Lie in April", 62150],
  ["Shigatsu wa Kimi", 62150],
  ["Death Note", 6214],
  ["Code Geass", 60574],
  ["Steins;Gate", 43669],
  ["Neon Genesis Evangelion", 60524],
  ["Evangelion", 60524],
  ["Psycho-Pass", 46260],
  ["Parasyte", 61985],
  ["Kiseijuu", 61985],
  ["Tokyo Ghoul", 46260],
  ["KonoSuba", 62104],
  ["Konosuba", 62104],
  ["Re:Zero", 62104],
  ["No Game No Life", 62104],
  ["Eminence in Shadow", 198469],
  ["Dr. Stone", 84958],
  ["Mushoku Tensei", 98071],
  ["Attack on Titan", 1429],
  ["Shingeki no Kyojin", 1429],
  ["Delicious in Dungeon", 210581],
  ["Dungeon Meshi", 210581],
  ["Shikanoko", 228173],
  ["Apothecary Diaries", 228170],
  ["Kusuriya no Hitorigoto", 228170],
];

/**
 * Resolve TMDB ID for an anime using MAL ID and/or title
 */
export function resolveTmdbId(title: string, malId: number | null): number | null {
  // 1. Try MAL ID lookup (most reliable)
  if (malId && MAL_TO_TMDB[malId]) {
    return MAL_TO_TMDB[malId];
  }

  // 2. Try exact title match in keywords
  const lower = title.toLowerCase();
  for (const [keyword, tmdbId] of TITLE_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      return tmdbId;
    }
  }

  return null;
}