export interface ParsedStroke {
  d: string;
  length: number;
}

export interface ParsedKanjiSvg {
  viewBox: string;
  strokes: ParsedStroke[];
}

const cache = new Map<string, Promise<ParsedKanjiSvg>>();

function strokeIndexFromId(id: string): number {
  const match = id.match(/-s(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function parseKanjiVgSource(source: string): ParsedKanjiSvg {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  const viewBox = svgEl?.getAttribute('viewBox') ?? '0 0 109 109';

  const pathEls = Array.from(doc.querySelectorAll('path[id]')).filter((el) =>
    /-s\d+$/.test(el.id),
  );
  pathEls.sort((a, b) => strokeIndexFromId(a.id) - strokeIndexFromId(b.id));

  const measureSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  measureSvg.setAttribute('viewBox', viewBox);
  measureSvg.style.position = 'absolute';
  measureSvg.style.width = '0';
  measureSvg.style.height = '0';
  measureSvg.style.overflow = 'hidden';
  document.body.appendChild(measureSvg);

  const strokes: ParsedStroke[] = pathEls.map((el) => {
    const d = el.getAttribute('d') ?? '';
    const measurePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    measurePath.setAttribute('d', d);
    measureSvg.appendChild(measurePath);
    const length = measurePath.getTotalLength();
    return { d, length };
  });

  document.body.removeChild(measureSvg);

  return { viewBox, strokes };
}

function resolveAssetUrl(url: string): string {
  return url.startsWith('/') ? import.meta.env.BASE_URL + url.slice(1) : url;
}

export async function loadKanjiVg(svgUrl: string): Promise<ParsedKanjiSvg> {
  let promise = cache.get(svgUrl);
  if (!promise) {
    promise = fetch(resolveAssetUrl(svgUrl))
      .then((res) => res.text())
      .then((text) => parseKanjiVgSource(text));
    cache.set(svgUrl, promise);
  }
  return promise;
}
