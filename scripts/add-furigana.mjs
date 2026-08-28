// One-off migration: enriches the existing sentences.json (already fetched
// from Tatoeba) with per-chunk furigana, without hitting the network again.
// Run with: node scripts/add-furigana.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildTokenizer, toSegments } from './lib/furigana.mjs';

const DATA_PATH = path.resolve('src/data/sentences.json');

async function main() {
  const tokenizer = await buildTokenizer();
  const sentences = JSON.parse(await fs.readFile(DATA_PATH, 'utf-8'));

  const enriched = sentences.map((s) => ({
    ...s,
    tokens: s.tokens.map((chunk) => {
      const text = typeof chunk === 'string' ? chunk : chunk.text;
      return { text, segments: toSegments(tokenizer, text) };
    }),
  }));

  await fs.writeFile(DATA_PATH, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`Enriched ${enriched.length} sentences with furigana.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
