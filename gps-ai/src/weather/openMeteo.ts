export interface Weather {
  source: "Open-Meteo"; fetchedAt: string; observedAt: string;
  temperatureC: number; apparentC: number; windKmh: number; precipitationProbPct: number | null; code: number;
}
export class WeatherError extends Error { constructor(public code: "NETWORK" | "HTTP" | "INVALID", m: string) { super(m); } }
type Fetch = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export const weatherUrl = (lat: number, lon: number) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=precipitation_probability&forecast_days=1&timezone=auto`;

export async function fetchWeather(f: Fetch, lat: number, lon: number, now = () => new Date()): Promise<Weather> {
  let res;
  try { res = await f(weatherUrl(lat, lon)); } catch (e) { throw new WeatherError("NETWORK", String(e)); }
  if (!res.ok) throw new WeatherError("HTTP", `HTTP ${res.status}`);
  const j: any = await res.json().catch(() => null);
  const c = j?.current;
  const nums = [c?.temperature_2m, c?.apparent_temperature, c?.wind_speed_10m, c?.weather_code];
  if (!c || nums.some((n) => typeof n !== "number") || typeof c.time !== "string") throw new WeatherError("INVALID", "Dados meteorológicos ausentes");
  const hours: string[] = j.hourly?.time ?? [], probs: unknown[] = j.hourly?.precipitation_probability ?? [];
  const i = hours.findIndex((t) => t >= c.time);
  const p = i >= 0 && typeof probs[i] === "number" ? (probs[i] as number) : null;
  return { source: "Open-Meteo", fetchedAt: now().toISOString(), observedAt: c.time, temperatureC: c.temperature_2m, apparentC: c.apparent_temperature, windKmh: c.wind_speed_10m, precipitationProbPct: p, code: c.weather_code };
}
