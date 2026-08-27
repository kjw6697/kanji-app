// One-time data build: pulls kanji metadata from kanji-data for the given
// JLPT levels, then downloads matching KanjiVG stroke-order SVGs.
// Run with: node scripts/build-data.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const kanji = require('kanji-data');
const hanjadict = require('@seyoungsong/hanjadict');

const LEVELS = [3, 4];
const OUT_DATA = path.resolve('src/data/kanji.json');
const OUT_SVG_DIR = path.resolve('public/kanjivg');
const KANJIVG_BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/';

async function main() {
  await fs.mkdir(OUT_SVG_DIR, { recursive: true });
  await fs.mkdir(path.dirname(OUT_DATA), { recursive: true });

  const entries = [];
  let downloaded = 0;
  let skipped = 0;
  const seen = new Set();

  for (const level of LEVELS) {
    const chars = kanji.getJlpt(level);
    console.log(`N${level} kanji count: ${chars.length}`);

    for (const char of chars) {
      if (seen.has(char)) continue;
      seen.add(char);

      const meta = kanji.get(char);
      if (!meta) {
        console.warn(`no metadata for ${char}`);
        continue;
      }
      const words = kanji.getWords(char).slice(0, 3).map((w) => ({
        written: w.variants?.[0]?.written ?? char,
        reading: w.variants?.[0]?.pronounced ?? '',
        meaning: w.meanings?.[0]?.glosses?.join('; ') ?? '',
      }));

      const unicodeHex = meta.unicode.toLowerCase().padStart(5, '0');
      const svgFile = `${unicodeHex}.svg`;
      const localSvgPath = path.join(OUT_SVG_DIR, svgFile);

      try {
        await fs.access(localSvgPath);
        skipped++;
      } catch {
        const res = await fetch(`${KANJIVG_BASE}${svgFile}`);
        if (!res.ok) {
          console.warn(`missing KanjiVG svg for ${char} (${svgFile}): ${res.status}`);
        } else {
          const text = await res.text();
          await fs.writeFile(localSvgPath, text, 'utf-8');
          downloaded++;
          process.stdout.write(`.`);
        }
      }

      entries.push({
        kanji: char,
        unicode: unicodeHex,
        jlpt: level,
        strokeCount: meta.stroke_count,
        meanings: meta.meanings,
        onReadings: meta.on_readings,
        kunReadings: meta.kun_readings,
        koreanHunEum: hanjadict.lookup(char),
        grade: meta.grade,
        words,
        svg: `/kanjivg/${svgFile}`,
      });
    }
  }

  console.log(`\nDownloaded ${downloaded} new SVGs, ${skipped} already present.`);
  await fs.writeFile(OUT_DATA, JSON.stringify(entries, null, 2), 'utf-8');
  console.log(`Wrote ${entries.length} kanji entries to ${OUT_DATA}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
