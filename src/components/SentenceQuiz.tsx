import { useMemo, useState } from 'react';
import sentenceData from '../data/sentences.json';

interface SentenceItem {
  ja: string;
  ko: string;
  tokens: string[];
  sourceKanji: string;
}

const SENTENCES = sentenceData as SentenceItem[];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickSentence(excludeJa?: string): SentenceItem {
  let candidate = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
  if (SENTENCES.length > 1) {
    while (candidate.ja === excludeJa) {
      candidate = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    }
  }
  return candidate;
}

interface Tile {
  id: number;
  text: string;
}

function makePool(sentence: SentenceItem): Tile[] {
  return shuffle(sentence.tokens.map((text, id) => ({ id, text })));
}

export default function SentenceQuiz() {
  const [current, setCurrent] = useState<SentenceItem>(() => pickSentence());
  const [pool, setPool] = useState<Tile[]>(() => makePool(current));
  const [answer, setAnswer] = useState<Tile[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const correctOrder = useMemo(
    () => current.tokens.map((text, id) => ({ id, text })),
    [current],
  );

  function moveToAnswer(tile: Tile) {
    if (result) return;
    setPool((p) => p.filter((t) => t.id !== tile.id));
    setAnswer((a) => {
      const next = [...a, tile];
      if (next.length === correctOrder.length) {
        checkAnswer(next);
      }
      return next;
    });
  }

  function moveToPool(tile: Tile) {
    if (result) return;
    setAnswer((a) => a.filter((t) => t.id !== tile.id));
    setPool((p) => [...p, tile]);
  }

  function checkAnswer(finalAnswer: Tile[]) {
    const ok = finalAnswer.every((t, i) => t.id === correctOrder[i].id);
    setResult(ok ? 'correct' : 'wrong');
    setStats((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  }

  function nextQuestion() {
    const next = pickSentence(current.ja);
    setCurrent(next);
    setPool(makePool(next));
    setAnswer([]);
    setResult(null);
  }

  if (SENTENCES.length === 0) {
    return <p className="empty-state">아직 예문 데이터가 없습니다.</p>;
  }

  return (
    <div className="sentence-quiz">
      <div className="sentence-quiz-stats">
        맞춘 문제 {stats.correct} / {stats.total}
      </div>

      <p className="sentence-quiz-prompt">다음 뜻에 맞게 문장을 순서대로 배열하세요.</p>
      <p className="sentence-quiz-ko">{current.ko}</p>

      <div className={`sentence-quiz-answer ${result ? `is-${result}` : ''}`}>
        {answer.length === 0 && <span className="sentence-quiz-placeholder">아래 조각을 눌러 문장을 완성하세요</span>}
        {answer.map((tile) => (
          <button key={tile.id} className="sentence-tile placed" onClick={() => moveToPool(tile)}>
            {tile.text}
          </button>
        ))}
      </div>

      <div className="sentence-quiz-pool">
        {pool.map((tile) => (
          <button key={tile.id} className="sentence-tile" onClick={() => moveToAnswer(tile)}>
            {tile.text}
          </button>
        ))}
      </div>

      {result && (
        <div className="sentence-quiz-feedback">
          {result === 'correct' ? (
            <p className="feedback-correct">정답입니다! 🎉</p>
          ) : (
            <p className="feedback-wrong">아쉬워요. 정답: {current.tokens.join(' ')}</p>
          )}
          <button className="sentence-quiz-next" onClick={nextQuestion}>
            다음 문제 →
          </button>
        </div>
      )}
    </div>
  );
}
