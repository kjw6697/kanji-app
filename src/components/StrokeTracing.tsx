import { useEffect, useMemo, useRef, useState } from 'react';
import { loadKanjiVg, type ParsedKanjiSvg } from '../lib/kanjivg';
import { checkStroke, sampleReferencePath, type Point } from '../lib/strokeMatch';

interface Props {
  svgUrl: string;
  kanji: string;
  onComplete?: (stats: { mistakes: number; hintsUsed: number }) => void;
}

const MAX_ATTEMPTS_BEFORE_HINT = 3;

export default function StrokeTracing({ svgUrl, kanji, onComplete }: Props) {
  const [parsed, setParsed] = useState<ParsedKanjiSvg | null>(null);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [userPoints, setUserPoints] = useState<Point[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [done, setDone] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    setParsed(null);
    resetAll();
    loadKanjiVg(svgUrl).then((data) => {
      if (!cancelled) setParsed(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgUrl]);

  function resetAll() {
    setStrokeIndex(0);
    setUserPoints([]);
    setAttempts(0);
    setHintsUsed(0);
    setTotalMistakes(0);
    setFlash(null);
    setDone(false);
  }

  const viewBoxDiagonal = useMemo(() => {
    if (!parsed) return 154;
    const parts = parsed.viewBox.split(/\s+/).map(Number);
    const w = parts[2] ?? 109;
    const h = parts[3] ?? 109;
    return Math.hypot(w, h);
  }, [parsed]);

  if (!parsed) {
    return <div className="stroke-anim-placeholder">불러오는 중...</div>;
  }

  const toSvgPoint = (clientX: number, clientY: number): Point => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (done) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrawing(true);
    setUserPoints([toSvgPoint(e.clientX, e.clientY)]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    setUserPoints((prev) => [...prev, toSvgPoint(e.clientX, e.clientY)]);
  };

  const handlePointerUp = () => {
    if (!drawing) return;
    setDrawing(false);
    evaluateStroke();
  };

  function evaluateStroke() {
    const pathEl = pathRefs.current[strokeIndex];
    if (!pathEl || userPoints.length < 2) {
      setUserPoints([]);
      return;
    }
    const reference = sampleReferencePath(pathEl);
    const result = checkStroke(reference, userPoints, viewBoxDiagonal);

    if (result.ok) {
      setFlash('ok');
      setTimeout(() => setFlash(null), 250);
      advanceStroke();
    } else {
      const nextAttempts = attempts + 1;
      setTotalMistakes((m) => m + 1);
      setFlash('bad');
      setTimeout(() => setFlash(null), 250);
      if (nextAttempts >= MAX_ATTEMPTS_BEFORE_HINT) {
        setHintsUsed((h) => h + 1);
        advanceStroke();
      } else {
        setAttempts(nextAttempts);
        setUserPoints([]);
      }
    }
  }

  function advanceStroke() {
    setUserPoints([]);
    setAttempts(0);
    if (strokeIndex + 1 >= parsed!.strokes.length) {
      setDone(true);
      onComplete?.({ mistakes: totalMistakes, hintsUsed });
    } else {
      setStrokeIndex((i) => i + 1);
    }
  }

  const pointsToPath = (points: Point[]) =>
    points.length === 0 ? '' : 'M ' + points.map((p) => `${p.x},${p.y}`).join(' L ');

  return (
    <div className="stroke-tracing">
      <svg
        ref={svgRef}
        viewBox={parsed.viewBox}
        className={`stroke-tracing-svg ${flash ? `flash-${flash}` : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <g className="stroke-anim-grid">
          <line x1="50%" y1="0" x2="50%" y2="100%" />
          <line x1="0" y1="50%" x2="100%" y2="50%" />
        </g>

        {parsed.strokes.map((stroke, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d={stroke.d}
            className={
              i < strokeIndex
                ? 'trace-stroke-done'
                : i === strokeIndex
                  ? 'trace-stroke-target'
                  : 'trace-stroke-future'
            }
          />
        ))}

        {!done && userPoints.length > 0 && (
          <path d={pointsToPath(userPoints)} className="trace-user-path" fill="none" />
        )}
      </svg>

      <div className="stroke-tracing-info">
        <span>
          {kanji} · 획 {Math.min(strokeIndex + 1, parsed.strokes.length)}/{parsed.strokes.length}
        </span>
        {done ? (
          <span className="trace-done-badge">완료! (실수 {totalMistakes}회, 힌트 {hintsUsed}회)</span>
        ) : (
          <button onClick={resetAll}>처음부터</button>
        )}
      </div>
    </div>
  );
}
