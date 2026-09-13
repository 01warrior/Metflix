/* eslint-disable no-console */
// Seeds the free French TV channels table (upserts by name).
// Run: npm run db:seed-channels
// NOTE: stream URLs below are public HLS (m3u8) endpoints provided by the
// broadcasters themselves. They can change/geoblock at any time — re-run this
// script (or adjust URLs) to refresh the list.
import { db } from "../src/lib/db";

const CHANNELS = [
  {
    name: "France 24 FR",
    url: "https://static.france24.com/live/F24_FR_HI_HLS/live_web.m3u8",
    category: "Infos",
    order: 10,
  },
  {
    name: "Euronews FR",
    url: "https://euronews-fr-hls-euronews-fr.stream.fl.freecaster.net/euronews-fr/live.m3u8",
    category: "Infos",
    order: 20,
  },
  {
    name: "France 24 English",
    url: "https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8",
    category: "International",
    order: 10,
  },
  {
    name: "France 24 Español",
    url: "https://static.france24.com/live/F24_ES_HI_HLS/live_web.m3u8",
    category: "International",
    order: 20,
  },
  {
    name: "France 24 عربي",
    url: "https://static.france24.com/live/F24_AR_HI_HLS/live_web.m3u8",
    category: "International",
    order: 30,
  },
  {
    name: "DW English",
    url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    category: "International",
    order: 40,
  },
  {
    name: "Al Jazeera Arabic",
    url: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8",
    category: "International",
    order: 50,
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const ch of CHANNELS) {
    const existing = await db.channel.findFirst({ where: { name: ch.name } });
    if (existing) {
      await db.channel.update({
        where: { id: existing.id },
        data: {
          url: ch.url,
          category: ch.category,
          order: ch.order,
          isActive: true,
        },
      });
      updated++;
    } else {
      await db.channel.create({ data: ch });
      created++;
    }
  }

  console.log(`Channels: ${created} created, ${updated} updated.`);
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