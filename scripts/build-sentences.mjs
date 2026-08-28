// One-time data build: pulls Japanese example sentences (with Korean
// translations) from the Tatoeba API for each kanji in our dataset, then
// segments each sentence into phrase-level chunks for the sentence-building
// quiz. Run with: node scripts/build-sentences.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadDefaultJapaneseParser } from 'budoux';

const KANJI_DATA = path.resolve('src/data/kanji.json');
const OUT_DATA = path.resolve('src/data/sentences.json');
const DELAY_MS = 150;
const MAX_SENTENCES = 400;
const MIN_TOKENS = 2;
const MAX_TOKENS = 6;

const parser = loadDefaultJapaneseParser();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tokenize(ja) {
  const tokens = parser.parse(ja).map((t) => t.trim()).filter(Boolean);
  return tokens;
}

async function fetchCandidates(kanjiChar) {
  const url = `https://tatoeba.org/en/api_v0/search?from=jpn&to=kor&query=${encodeURIComponent(kanjiChar)}&sort=words_count`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

async function main() {
  const kanjiEntries = JSON.parse(await fs.readFile(KANJI_DATA, 'utf-8'));
  const seenText = new Set();
  const sentences = [];

  for (const entry of kanjiEntries) {
    if (sentences.length >= MAX_SENTENCES) break;

    let results;
    try {
      results = await fetchCandidates(entry.kanji);
    } catch (err) {
      console.warn(`fetch failed for ${entry.kanji}: ${err.message}`);
      await sleep(DELAY_MS);
      continue;
    }

    for (const r of results) {
      const ja = r.text?.trim();
      if (!ja || seenText.has(ja)) continue;
      const koCandidates = r.translations?.[0] ?? [];
      const ko = koCandidates.find((t) => t.lang === 'kor')?.text?.trim();
      if (!ko) continue;

      const tokens = tokenize(ja);
      if (tokens.length < MIN_TOKENS || tokens.length > MAX_TOKENS) continue;

      seenText.add(ja);
      sentences.push({ ja, ko, tokens, sourceKanji: entry.kanji });
      break;
    }

    process.stdout.write('.');
    await sleep(DELAY_MS);
  }

  console.log(`\nCollected ${sentences.length} sentences.`);
  await fs.writeFile(OUT_DATA, JSON.stringify(sentences, null, 2), 'utf-8');
  console.log(`Wrote ${OUT_DATA}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
