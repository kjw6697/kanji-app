import { useState } from 'react';
import type { KanjiEntry } from '../types';
import StrokeAnimation from './StrokeAnimation';
import StrokeTracing from './StrokeTracing';

interface Props {
  entry: KanjiEntry;
  learned: boolean;
  onToggleLearned: () => void;
  onClose: () => void;
}

type Tab = 'animation' | 'tracing' | 'info';

export default function KanjiDetail({ entry, learned, onToggleLearned, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('animation');
  const [tracingKey, setTracingKey] = useState(0);

  return (
    <div className="kanji-detail-overlay" onClick={onClose}>
      <div className="kanji-detail" onClick={(e) => e.stopPropagation()}>
        <div className="kanji-detail-header">
          <div>
            <span className="kanji-detail-char">{entry.kanji}</span>
            <span className="kanji-detail-strokes">N{entry.jlpt} · {entry.strokeCount}획</span>
          </div>
          <div className="kanji-detail-header-actions">
            <button
              className={`learned-toggle ${learned ? 'active' : ''}`}
              onClick={onToggleLearned}
            >
              {learned ? '학습 완료 ✓' : '학습 완료로 표시'}
            </button>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="kanji-detail-readings">
          <div>
            <strong>음독</strong> {entry.onReadings.join('、') || '-'}
          </div>
          <div>
            <strong>훈독</strong> {entry.kunReadings.join('、') || '-'}
          </div>
          <div>
            <strong>뜻</strong> {entry.meanings.join(', ')}
          </div>
        </div>

        <div className="kanji-detail-tabs">
          <button className={tab === 'animation' ? 'active' : ''} onClick={() => setTab('animation')}>
            획순 보기
          </button>
          <button
            className={tab === 'tracing' ? 'active' : ''}
            onClick={() => {
              setTab('tracing');
              setTracingKey((k) => k + 1);
            }}
          >
            따라쓰기 연습
          </button>
          <button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>
            예문
          </button>
        </div>

        <div className="kanji-detail-body">
          {tab === 'animation' && <StrokeAnimation svgUrl={entry.svg} />}
          {tab === 'tracing' && (
            <StrokeTracing key={tracingKey} svgUrl={entry.svg} kanji={entry.kanji} />
          )}
          {tab === 'info' && (
            <ul className="word-list">
              {entry.words.length === 0 && <li>등록된 예문이 없습니다.</li>}
              {entry.words.map((w, i) => (
                <li key={i}>
                  <span className="word-written">{w.written}</span>
                  <span className="word-reading">{w.reading}</span>
                  <span className="word-meaning">{w.meaning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
