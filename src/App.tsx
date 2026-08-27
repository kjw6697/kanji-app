import { useMemo, useState } from 'react';
import kanjiData from './data/kanji.json';
import type { KanjiEntry } from './types';
import { useProgress } from './hooks/useProgress';
import KanjiCard from './components/KanjiCard';
import KanjiDetail from './components/KanjiDetail';
import './App.css';

const ALL_KANJI = kanjiData as KanjiEntry[];
const LEVELS = [4, 3] as const;

type Filter = 'all' | 'learned' | 'unlearned';
type LevelFilter = 'all' | 4 | 3;

function App() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [selected, setSelected] = useState<KanjiEntry | null>(null);
  const { learned, isLearned, toggleLearned } = useProgress();

  const filtered = useMemo(() => {
    const q = query.trim();
    return ALL_KANJI.filter((entry) => {
      if (level !== 'all' && entry.jlpt !== level) return false;
      if (filter === 'learned' && !isLearned(entry.kanji)) return false;
      if (filter === 'unlearned' && isLearned(entry.kanji)) return false;
      if (!q) return true;
      return (
        entry.kanji.includes(q) ||
        entry.meanings.some((m) => m.toLowerCase().includes(q.toLowerCase())) ||
        entry.onReadings.some((r) => r.includes(q)) ||
        entry.kunReadings.some((r) => r.includes(q)) ||
        (entry.koreanHunEum?.includes(q) ?? false)
      );
    });
  }, [query, filter, level, isLearned]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>JLPT 漢字</h1>
        <p className="app-subtitle">
          획순 애니메이션과 따라쓰기로 배우는 일본어 한자 · 총 {ALL_KANJI.length}자 · 학습 완료{' '}
          {learned.size}자
        </p>
      </header>

      <div className="app-controls">
        <input
          className="search-input"
          placeholder="한자, 뜻, 읽기로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-tabs">
          <button className={level === 'all' ? 'active' : ''} onClick={() => setLevel('all')}>
            전체
          </button>
          {LEVELS.map((lv) => (
            <button key={lv} className={level === lv ? 'active' : ''} onClick={() => setLevel(lv)}>
              N{lv}
            </button>
          ))}
        </div>
        <div className="filter-tabs">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            전체
          </button>
          <button
            className={filter === 'unlearned' ? 'active' : ''}
            onClick={() => setFilter('unlearned')}
          >
            미학습
          </button>
          <button
            className={filter === 'learned' ? 'active' : ''}
            onClick={() => setFilter('learned')}
          >
            학습 완료
          </button>
        </div>
      </div>

      <main className="kanji-grid">
        {filtered.map((entry) => (
          <KanjiCard
            key={entry.kanji}
            entry={entry}
            learned={isLearned(entry.kanji)}
            onClick={() => setSelected(entry)}
          />
        ))}
        {filtered.length === 0 && <p className="empty-state">검색 결과가 없습니다.</p>}
      </main>

      {selected && (
        <KanjiDetail
          entry={selected}
          learned={isLearned(selected.kanji)}
          onToggleLearned={() => toggleLearned(selected.kanji)}
          onClose={() => setSelected(null)}
        />
      )}

      <footer className="app-footer">
        획순 데이터: <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer">KanjiVG</a>{' '}
        (CC BY-SA 3.0) · 한자 정보: <a href="https://kanjiapi.dev/" target="_blank" rel="noreferrer">kanjiapi.dev</a>{' '}
        / EDRDG KANJIDIC·JMdict
      </footer>
    </div>
  );
}

export default App;
