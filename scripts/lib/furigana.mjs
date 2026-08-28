import kuromoji from 'kuromoji';

const KANJI_RE = /[一-鿿]/;

export function buildTokenizer() {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
}

function katakanaToHiragana(str) {
  return str.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

// Splits `text` into segments, attaching a hiragana reading to any
// segment that contains at least one kanji character.
export function toSegments(tokenizer, text) {
  const morphemes = tokenizer.tokenize(text);
  return morphemes.map((m) => {
    const segment = { text: m.surface_form };
    if (KANJI_RE.test(m.surface_form) && m.reading) {
      segment.reading = katakanaToHiragana(m.reading);
    }
    return segment;
  });
}
