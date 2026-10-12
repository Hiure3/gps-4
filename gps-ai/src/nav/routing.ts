import type { LatLon } from "../core/geo";

export type Profile = "driving" | "cycling" | "walking";
export interface Step { name: string; type: string; modifier?: string; exit?: number; distance: number; duration: number; location: LatLon }
export interface Route { distance: number; duration: number; geometry: LatLon[]; steps: Step[] }
export class RoutingError extends Error {
  constructor(public code: "NETWORK" | "HTTP" | "INVALID" | "NO_ROUTE", msg: string) { super(msg); }
}
export interface RouteOptions { profile?: Profile; alternatives?: boolean; avoidTolls?: boolean }
type Fetch = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** baseUrl deve ser um OSRM/Valhalla próprio em produção; o servidor demo público NÃO é para uso comercial. */
export function buildRouteUrl(baseUrl: string, pts: LatLon[], o: RouteOptions = {}): string {
  const coords = pts.map(([la, lo]) => `${lo},${la}`).join(";");
  const q = new URLSearchParams({ overview: "full", geometries: "geojson", steps: "true", alternatives: String(!!o.alternatives) });
  if (o.avoidTolls) q.set("exclude", "toll");
  return `${baseUrl}/route/v1/${o.profile ?? "driving"}/${coords}?${q}`;
}

export function parseOsrm(json: any): Route[] {
  if (!json || typeof json !== "object") throw new RoutingError("INVALID", "Resposta vazia");
  if (json.code === "NoRoute") throw new RoutingError("NO_ROUTE", "Nenhuma rota encontrada");
  if (json.code !== "Ok" || !Array.isArray(json.routes) || json.routes.length === 0) throw new RoutingError("INVALID", `Resposta inesperada: ${json.code}`);
  return json.routes.map((r: any): Route => {
    if (!Array.isArray(r?.geometry?.coordinates) || !Array.isArray(r?.legs)) throw new RoutingError("INVALID", "Rota malformada");
    return {
      distance: Number(r.distance), duration: Number(r.duration),
      geometry: r.geometry.coordinates.map(([lo, la]: number[]) => [la, lo] as LatLon),
      steps: r.legs.flatMap((l: any) => l.steps ?? []).map((s: any): Step => ({
        name: s.name ?? "", type: s.maneuver?.type ?? "continue", modifier: s.maneuver?.modifier, exit: s.maneuver?.exit,
        distance: s.distance, duration: s.duration, location: [s.maneuver.location[1], s.maneuver.location[0]],
      })),
    };
  });
}

export async function fetchRoutes(f: Fetch, baseUrl: string, pts: LatLon[], o?: RouteOptions): Promise<Route[]> {
  let res;
  try { res = await f(buildRouteUrl(baseUrl, pts, o)); } catch (e) { throw new RoutingError("NETWORK", String(e)); }
  if (!res.ok) throw new RoutingError("HTTP", `HTTP ${res.status}`);
  let body: unknown;
  try { body = await res.json(); } catch { throw new RoutingError("INVALID", "JSON inválido"); }
  return parseOsrm(body);
}
