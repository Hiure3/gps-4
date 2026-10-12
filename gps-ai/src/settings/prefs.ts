export interface Prefs { interests: string[]; paused: boolean; voice: "feminina" | "masculina"; rate: number; units: "km" | "mi" }
export interface KV { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void }
const KEY = "prefs.v1";
export const defaults = (): Prefs => ({ interests: [], paused: false, voice: "feminina", rate: 1, units: "km" });

export class PrefsStore {
  constructor(private kv: KV) {}
  load(): Prefs {
    try { const r = this.kv.get(KEY); return r ? { ...defaults(), ...JSON.parse(r) } : defaults(); } catch { return defaults(); }
  }
  save(p: Prefs) { this.kv.set(KEY, JSON.stringify({ ...p, rate: Math.min(2, Math.max(0.5, p.rate)) })); }
  addInterest(i: string) { const p = this.load(); const v = i.trim().toLowerCase(); if (v && !p.interests.includes(v)) p.interests.push(v); this.save(p); }
  activeInterests(): string[] { const p = this.load(); return p.paused ? [] : p.interests; }
  eraseAll() { this.kv.remove(KEY); }
}
