import { describe, it, expect } from "vitest";
import { fetchWeather, WeatherError } from "../src/weather/openMeteo";
import { parseIntent } from "../src/assistant/intents";
import { PrefsStore, type KV } from "../src/settings/prefs";

const ok = (body: unknown) => async () => ({ ok: true, status: 200, json: async () => body });
// Payload SIMULADO no formato documentado da Open-Meteo.
const wx = { current: { time: "2026-10-11T10:00", temperature_2m: 29.1, apparent_temperature: 32, wind_speed_10m: 14, weather_code: 3 },
  hourly: { time: ["2026-10-11T09:00", "2026-10-11T10:00", "2026-10-11T11:00"], precipitation_probability: [5, 40, 60] } };

describe("clima", () => {
  it("parseia e registra fonte e horários", async () => {
    const w = await fetchWeather(ok(wx), -5.8, -35.2, () => new Date("2026-10-11T13:05:00Z"));
    expect(w).toMatchObject({ source: "Open-Meteo", temperatureC: 29.1, precipitationProbPct: 40, observedAt: "2026-10-11T10:00" });
    expect(w.fetchedAt).toBe("2026-10-11T13:05:00.000Z");
  });
  it("não inventa dados quando a API devolve lixo", async () => {
    await expect(fetchWeather(ok({}), 0, 0)).rejects.toBeInstanceOf(WeatherError);
    await expect(fetchWeather(async () => { throw new Error("x"); }, 0, 0)).rejects.toMatchObject({ code: "NETWORK" });
    await expect(fetchWeather(async () => ({ ok: false, status: 429, json: async () => ({}) }), 0, 0)).rejects.toMatchObject({ code: "HTTP" });
  });
});

describe("intenções", () => {
  it.each([
    ["Leve-me para casa", { type: "navigate_saved", place: "home" }],
    ["Procure um posto próximo", { type: "find_poi", poi: "fuel" }],
    ["Qual é a previsão do tempo?", { type: "weather" }],
    ["Quero uma rota sem pedágios", { type: "avoid_tolls" }],
    ["Toque músicas tranquilas", { type: "play_music", mood: "tranquilas" }],
    ["Onde tem estacionamento?", { type: "find_poi", poi: "parking" }],
  ])("%s", (txt, exp) => expect(parseIntent(txt)).toMatchObject(exp));
  it("desconhecido", () => expect(parseIntent("blá blá").type).toBe("unknown"));
});

const mem = (): KV => { const m = new Map<string, string>(); return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v), remove: (k) => void m.delete(k) }; };
describe("preferências", () => {
  it("adiciona, pausa e apaga interesses (LGPD)", () => {
    const s = new PrefsStore(mem()); s.addInterest("Ciência"); s.addInterest("ciência"); s.addInterest("música");
    expect(s.activeInterests()).toEqual(["ciência", "música"]);
    s.save({ ...s.load(), paused: true }); expect(s.activeInterests()).toEqual([]);
    s.eraseAll(); expect(s.load().interests).toEqual([]);
  });
  it("tolera dados corrompidos e limita velocidade da voz", () => {
    const kv = mem(); kv.set("prefs.v1", "{lixo"); const s = new PrefsStore(kv); expect(s.load().voice).toBe("feminina");
    s.save({ ...s.load(), rate: 9 }); expect(s.load().rate).toBe(2);
  });
});
