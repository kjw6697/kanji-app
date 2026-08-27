import { useEffect, useRef, useState } from 'react';
import { loadKanjiVg, type ParsedKanjiSvg } from '../lib/kanjivg';

interface Props {
  svgUrl: string;
  showNumbers?: boolean;
}

const STROKE_DURATION_MS = 500;
const GAP_MS = 200;

export default function StrokeAnimation({ svgUrl, showNumbers = true }: Props) {
  const [parsed, setParsed] = useState<ParsedKanjiSvg | null>(null);
  const [playHead, setPlayHead] = useState(0); // fractional stroke progress
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    setParsed(null);
    setPlaying(true);
    loadKanjiVg(svgUrl).then((data) => {
      if (!cancelled) setParsed(data);
    });
    return () => {
      cancelled = true;
    };
  }, [svgUrl]);

  useEffect(() => {
    if (!parsed || !playing) return;
    const totalStrokes = parsed.strokes.length;
    startRef.current = performance.now() - playHead * (STROKE_DURATION_MS + GAP_MS);

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const head = elapsed / (STROKE_DURATION_MS + GAP_MS);
      if (head >= totalStrokes) {
        setPlayHead(totalStrokes);
        setPlaying(false);
        return;
      }
      setPlayHead(head);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, playing]);

  if (!parsed) {
    return <div className="stroke-anim-placeholder">불러오는 중...</div>;
  }

  const replay = () => {
    setPlayHead(0);
    setPlaying(true);
  };

  return (
    <div className="stroke-anim">
      <svg viewBox={parsed.viewBox} className="stroke-anim-svg">
        <g className="stroke-anim-grid">
          <line x1="50%" y1="0" x2="50%" y2="100%" />
          <line x1="0" y1="50%" x2="100%" y2="50%" />
        </g>
        {parsed.strokes.map((stroke, i) => {
          const strokeHead = Math.max(0, Math.min(1, playHead - i));
          const offset = stroke.length * (1 - strokeHead);
          return (
            <path
              key={i}
              d={stroke.d}
              className="stroke-anim-path"
              strokeDasharray={stroke.length}
              strokeDashoffset={offset}
            />
          );
        })}
        {showNumbers &&
          parsed.strokes.map((stroke, i) => {
            if (playHead < i) return null;
            const start = strokePointAt(stroke.d, 0);
            if (!start) return null;
            return (
              <text
                key={`n${i}`}
                x={start.x - 3}
                y={start.y - 3}
                className="stroke-anim-number"
              >
                {i + 1}
              </text>
            );
          })}
      </svg>
      <div className="stroke-anim-controls">
        <button onClick={replay}>{playing ? '재생 중...' : '다시 재생'}</button>
      </div>
    </div>
  );
}

function strokePointAt(d: string, _t: number): { x: number; y: number } | null {
  const match = d.match(/M\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/);
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}
