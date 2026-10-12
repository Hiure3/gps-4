export type Intent =
  | { type: "navigate_saved"; place: "home" | "work" }
  | { type: "find_poi"; poi: "fuel" | "parking" | "hospital" | "restaurant" }
  | { type: "weather" } | { type: "avoid_tolls" } | { type: "play_music"; mood?: string }
  | { type: "unknown"; text: string };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/** Parser determinístico (offline, sem enviar fala a terceiros). */
export function parseIntent(raw: string): Intent {
  const t = norm(raw);
  if (/\b(casa|lar)\b/.test(t) && /(leve|levar|ir |va |navegar|rota)/.test(t)) return { type: "navigate_saved", place: "home" };
  if (/\b(trabalho|servico|escritorio)\b/.test(t) && /(leve|levar|ir |va |navegar|rota)/.test(t)) return { type: "navigate_saved", place: "work" };
  if (/(sem pedagio|evitar pedagio|evite pedagio)/.test(t)) return { type: "avoid_tolls" };
  if (/(posto|combustivel|gasolina)/.test(t)) return { type: "find_poi", poi: "fuel" };
  if (/estacionamento/.test(t)) return { type: "find_poi", poi: "parking" };
  if (/hospital|pronto.socorro|upa\b/.test(t)) return { type: "find_poi", poi: "hospital" };
  if (/restaurante|comer|almoco|jantar/.test(t)) return { type: "find_poi", poi: "restaurant" };
  if (/(previsao|tempo|chuva|clima)/.test(t)) return { type: "weather" };
  if (/(toque|tocar|ouvir|musica)/.test(t)) {
    const m = t.match(/(tranquil\w*|relaxant\w*|animad\w*|rock|mpb|classic\w*)/);
    return { type: "play_music", mood: m?.[1] };
  }
  return { type: "unknown", text: raw };
}
