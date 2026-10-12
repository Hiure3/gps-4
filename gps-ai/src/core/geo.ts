export type LatLon = [lat: number, lon: number];
const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversine(a: LatLon, b: LatLon): number {
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distância do ponto a um segmento (projeção equirretangular local) e fração t do ponto projetado. */
export function pointToSegment(p: LatLon, a: LatLon, b: LatLon): { dist: number; t: number } {
  const k = Math.cos(rad(p[0]));
  const ax = (a[1] - p[1]) * k, ay = a[0] - p[0];
  const bx = (b[1] - p[1]) * k, by = b[0] - p[0];
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  const px = ax + t * dx, py = ay + t * dy;
  return { dist: Math.hypot(px, py) * rad(1) * R, t };
}

export function cumulativeDistances(line: LatLon[]): number[] {
  const out = [0];
  for (let i = 1; i < line.length; i++) out.push(out[i - 1]! + haversine(line[i - 1]!, line[i]!));
  return out;
}

export function project(p: LatLon, line: LatLon[], cum: number[]): { offset: number; along: number } {
  let best = { offset: Infinity, along: 0 };
  for (let i = 0; i < line.length - 1; i++) {
    const s = pointToSegment(p, line[i]!, line[i + 1]!);
    if (s.dist < best.offset) best = { offset: s.dist, along: cum[i]! + s.t * (cum[i + 1]! - cum[i]!) };
  }
  return best;
}
