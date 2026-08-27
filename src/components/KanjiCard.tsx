import type { KanjiEntry } from '../types';

interface Props {
  entry: KanjiEntry;
  learned: boolean;
  onClick: () => void;
}

export default function KanjiCard({ entry, learned, onClick }: Props) {
  return (
    <button className={`kanji-card ${learned ? 'kanji-card-learned' : ''}`} onClick={onClick}>
      <span className="kanji-card-char">{entry.kanji}</span>
      <span className="kanji-card-meaning">{entry.meanings[0] ?? ''}</span>
    </button>
  );
}
