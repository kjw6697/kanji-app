export interface Point {
  x: number;
  y: number;
}

const SAMPLE_COUNT = 12;

export function sampleReferencePath(pathEl: SVGPathElement): Point[] {
  const length = pathEl.getTotalLength();
  const points: Point[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const dist = (length * i) / (SAMPLE_COUNT - 1);
    const pt = pathEl.getPointAtLength(dist);
    points.push({ x: pt.x, y: pt.y });
  }
  return points;
}

function pathLengthOf(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export function resampleUserPoints(raw: Point[]): Point[] {
  if (raw.length === 0) return [];
  if (raw.length === 1) return new Array(SAMPLE_COUNT).fill(raw[0]);

  const total = pathLengthOf(raw);
  if (total === 0) return new Array(SAMPLE_COUNT).fill(raw[0]);

  const result: Point[] = [raw[0]];
  const step = total / (SAMPLE_COUNT - 1);
  let segIdx = 0;
  let segStart = raw[0];
  let segEnd = raw[1];
  let segLen = Math.hypot(segEnd.x - segStart.x, segEnd.y - segStart.y);
  let coveredBeforeSeg = 0;

  for (let i = 1; i < SAMPLE_COUNT - 1; i++) {
    const targetDist = step * i;
    while (
      coveredBeforeSeg + segLen < targetDist &&
      segIdx < raw.length - 2
    ) {
      segIdx++;
      coveredBeforeSeg += segLen;
      segStart = raw[segIdx];
      segEnd = raw[segIdx + 1];
      segLen = Math.hypot(segEnd.x - segStart.x, segEnd.y - segStart.y);
    }
    const remain = targetDist - coveredBeforeSeg;
    const t = segLen === 0 ? 0 : Math.min(1, remain / segLen);
    result.push({
      x: segStart.x + (segEnd.x - segStart.x) * t,
      y: segStart.y + (segEnd.y - segStart.y) * t,
    });
  }
  result.push(raw[raw.length - 1]);
  return result;
}

export interface StrokeCheckResult {
  ok: boolean;
  avgDistance: number;
  directionOk: boolean;
  reversed: boolean;
}

export function checkStroke(
  reference: Point[],
  userRaw: Point[],
  viewBoxDiagonal: number,
): StrokeCheckResult {
  const user = resampleUserPoints(userRaw);
  const distThreshold = viewBoxDiagonal * 0.16;

  const forwardAvg = averageDistance(reference, user);
  const reversedAvg = averageDistance(reference, [...user].reverse());
  const reversed = reversedAvg < forwardAvg;
  const avgDistance = Math.min(forwardAvg, reversedAvg);

  const refDir = direction(reference[0], reference[reference.length - 1]);
  const userDir = direction(userRaw[0], userRaw[userRaw.length - 1]);
  const angleDiff = angleBetween(refDir, userDir);
  const directionOk = reversed ? angleDiff > 120 : angleDiff < 75;

  return {
    ok: avgDistance < distThreshold && directionOk,
    avgDistance,
    directionOk,
    reversed,
  };
}

function averageDistance(a: Point[], b: Point[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
  }
  return sum / a.length;
}

function direction(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function angleBetween(a: Point, b: Point): number {
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y));
  return (Math.acos(dot) * 180) / Math.PI;
}
