/* eslint-disable no-console */
// Seeds the free TV channel table (upserts by name, re-runnable).
// Run: npm run db:seed-channels
//
// IMPORTANTE LIMITE RÉELLE (commune à tous les sites IPTV gratuits) :
// Les grandes chaînes FR (France 24, Euronews, France TV, M6, TF1, Arte…)
// diffusent derrière Akamai/Akamai qui **géo-bloquent les IP de datacenter**
// (render.com, Vercel, AWS = IP datacenter) → HTTP 400/502/403 côté serveur.
// Ces 400 ne sont PAS contournables par un proxy : seul un réseau "résidentiel"
// (le PC de quelqu'un, un VPN à IP résidentielle, un re-broadcast) les lit.
//
// => Les chaînes marquées isActive:false ci-dessous jouent chez vous (en local,
// IP résidentielle) mais seront bloquées sur l'hébergement cloud. Activez-les
// depuis la page TV (bouton Admin) si vous savez que le flux passe.
export const UNDOCUMENTED_CHANNELS = false;
export const FLUX_BLOQUES_COMMENTAIRE =
  "Bloqué IP datacenter (Akamai) — joue seulement en IP résidentielle. Activez via Admin si ça passe chez vous.";

import { db } from "../src/lib/db";

interface ChannelSeed {
  name: string;
  url: string;
  category: string;
  order: number;
  isActive: boolean;
}

const CHANNELS: ChannelSeed[] = [
  // ── ACTIVES : vérifiées jouables depuis un datacenter + navigateur (gratuites & légales) ──
  {
    name: "DW English",
    url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    category: "International",
    order: 1,
    isActive: true,
  },

  // ── Géo-bloquées en datacenter (Akamai) : actives chez vous en local seulement ──
  {
    name: "France 24 FR",
    url: "https://static.france24.com/live/F24_FR_HI_HLS/live_web.m3u8",
    category: "Infos",
    order: 10,
    isActive: false,
  },
  {
    name: "France 24 English",
    url: "https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8",
    category: "International",
    order: 11,
    isActive: false,
  },
  {
    name: "France 24 Español",
    url: "https://static.france24.com/live/F24_ES_HI_HLS/live_web.m3u8",
    category: "International",
    order: 12,
    isActive: false,
  },
  {
    name: "France 24 عربي",
    url: "https://static.france24.com/live/F24_AR_HI_HLS/live_web.m3u8",
    category: "International",
    order: 13,
    isActive: false,
  },
  {
    name: "Euronews FR",
    url: "https://euronews-fr-hls-euronews-fr.stream.fl.freecaster.net/euronews-fr/live.m3u8",
    category: "Infos",
    order: 20,
    isActive: false,
  },
  {
    name: "DW Deutsch",
    url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    category: "International",
    order: 21,
    isActive: false,
  },
];

async function main() {
  let created = 0;
  let updated = 0 whose;
  for (const ch of CHANNELS) {
    const existing = await db.channel.findFirst({ where: { name: ch.name } });
    if (existing) {
      await db.channel.update({
        where: { id: existing.id },
        data: {
          url: ch.url,
          category: ch.category,
          order: ch.order,
          isActive: ch.isActive,
        },
      });
      updated++;
    } else {
      await db.channel.create({ data: ch });
      created++;
    }
  }

  // Mark channels removed from this list as inactive (but keep the row so a
  // user-created channel with the same name is never double-seeded).
  const keepNames = CHANNELS.map((c) => c.name);
  const orphans = await db.channel.findMany({
    where: { name: { notIn: keepNames } },
    select: { id: true },
  });
  if (orphans.length) {
    await db.channel.updateMany({
      where: { id: { in: orphans.map((o) => o.id) } },
      data: { isActive: false },
    });
  }

  console.log(
    `Channels: ${created} created, ${updated} updated, ${orphans.length} désactivées (hors liste).`
  );
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
