import type { Step } from "./routing";

const DIR: Record<string, string> = {
  left: "vire à esquerda", right: "vire à direita", "slight left": "mantenha-se à esquerda", "slight right": "mantenha-se à direita",
  "sharp left": "faça uma curva fechada à esquerda", "sharp right": "faça uma curva fechada à direita", uturn: "faça o retorno", straight: "siga em frente",
};

export function roundDistance(m: number): number {
  if (m >= 1000) return Math.round(m / 100) * 100;
  if (m >= 100) return Math.round(m / 50) * 50;
  return Math.round(m / 10) * 10;
}
export function speakDistance(m: number): string {
  const r = roundDistance(m);
  if (r >= 1000) { const km = r / 1000; return `${String(km).replace(".", ",")} ${km === 1 ? "quilômetro" : "quilômetros"}`; }
  return `${r} metros`;
}

export function maneuverText(s: Step): string {
  if (s.type === "arrive") return "você chegou ao seu destino";
  if (s.type === "depart") return "siga em frente";
  if (s.type === "roundabout" || s.type === "rotary") return `na rotatória, pegue a ${s.exit ?? 1}ª saída`;
  return DIR[s.modifier ?? "straight"] ?? "siga em frente";
}

export function phrase(s: Step, distanceM: number): string {
  const base = maneuverText(s);
  const via = s.name && s.type !== "arrive" ? ` na ${s.name}` : "";
  if (distanceM <= 30) return `Agora, ${base}${via}.`;
  return `Em ${speakDistance(distanceM)}, ${base}${via}.`;
}

/** Cada limiar dispara no máximo uma vez por manobra; limiares já ultrapassados são descartados. */
export class Announcer {
  private fired = new Set<string>();
  constructor(private thresholds = [800, 300, 50]) {}
  next(stepIndex: number, step: Step, distanceM: number): string | null {
    const eligible = this.thresholds.filter((t) => distanceM <= t);
    if (eligible.length === 0) return null;
    const t = Math.min(...eligible);
    const key = `${stepIndex}:${t}`;
    if (this.fired.has(key)) return null;
    for (const x of this.thresholds) if (x >= t) this.fired.add(`${stepIndex}:${x}`);
    return phrase(step, distanceM);
  }
}
