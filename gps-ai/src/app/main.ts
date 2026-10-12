import { fetchWeather } from "../weather/openMeteo";
import { parseIntent, type Intent } from "../assistant/intents";
import { fetchRoutes, type Route } from "../nav/routing";
import { phrase, Announcer } from "../nav/instructions";
import { NavigationSession } from "../nav/session";
import type { LatLon } from "../core/geo";

const OSRM_DEMO = "https://router.project-osrm.org";

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const http = (url: string) => fetch(url);
const msgErro = (e: unknown) => (e instanceof Error ? e.message : String(e));

function mostrar(id: string, texto: string, erro = false) {
  const alvo = el(id);
  alvo.textContent = texto;
  alvo.className = erro ? "saida erro" : "saida";
}

function falar(texto: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  const voz = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("pt"));
  if (voz) u.voice = voz;
  speechSynthesis.speak(u);
}

function coord(texto: string): LatLon {
  const [a, b] = texto.split(",").map((x) => Number(x.trim()));
  if (a === undefined || b === undefined || Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error("Coordenadas inválidas. Use o formato: latitude, longitude");
  }
  return [a, b];
}

function descreverClima(code: number): string {
  if (code === 0) return "céu limpo";
  if (code <= 3) return "parcialmente nublado a nublado";
  if (code === 45 || code === 48) return "neblina";
  if (code >= 51 && code <= 57) return "garoa";
  if (code >= 61 && code <= 67) return "chuva";
  if (code >= 71 && code <= 77) return "neve";
  if (code >= 80 && code <= 82) return "pancadas de chuva";
  if (code >= 95) return "trovoada";
  return "condição não classificada";
}

// ---- Clima
async function verClima() {
  try {
    const [lat, lon] = coord(el<HTMLInputElement>("clima-pos").value);
    mostrar("clima-saida", "Buscando…");
    const w = await fetchWeather(http, lat, lon);
    const chuva = w.precipitationProbPct === null ? "indisponível" : `${w.precipitationProbPct}%`;
    mostrar(
      "clima-saida",
      `${w.temperatureC} °C (sensação ${w.apparentC} °C), ${descreverClima(w.code)}.\n` +
        `Vento: ${w.windKmh} km/h. Chance de chuva: ${chuva}.\n` +
        `Fonte: ${w.source}. Medido em ${w.observedAt}.`,
    );
  } catch (e) {
    mostrar("clima-saida", `Não foi possível obter o clima: ${msgErro(e)}`, true);
  }
}
el("btn-clima").onclick = verClima;

// ---- Comandos
function descreverIntencao(i: Intent): string {
  switch (i.type) {
    case "navigate_saved":
      return i.place === "home"
        ? "Navegar para casa (endereços salvos ainda não existem)."
        : "Navegar para o trabalho (endereços salvos ainda não existem).";
    case "find_poi": {
      const nome = { fuel: "posto de combustível", parking: "estacionamento", hospital: "hospital", restaurant: "restaurante" }[i.poi];
      return `Procurar ${nome} (a busca de locais ainda não existe).`;
    }
    case "weather":
      return "Mostrar o clima.";
    case "avoid_tolls":
      return "Evitar pedágios na rota.";
    case "play_music":
      return `Tocar música${i.mood ? ` (${i.mood})` : ""} (o player ainda não existe).`;
    case "unknown":
      return `Não entendi o comando: "${i.text}".`;
  }
}

el("btn-cmd").onclick = () => {
  const intencao = parseIntent(el<HTMLInputElement>("cmd").value);
  const texto = descreverIntencao(intencao);
  mostrar("cmd-saida", texto, intencao.type === "unknown");
  falar(texto);
  if (intencao.type === "weather") void verClima();
};

// ---- Rota e simulação
let rota: Route | null = null;
let timer: number | undefined;

function parar() {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

function registrar(texto: string) {
  const p = document.createElement("div");
  p.textContent = texto;
  el("log").prepend(p);
}

el("btn-rota").onclick = async () => {
  try {
    parar();
    const origem = coord(el<HTMLInputElement>("origem").value);
    const destino = coord(el<HTMLInputElement>("destino").value);
    mostrar("rota-saida", "Calculando…");
    const rotas = await fetchRoutes(http, OSRM_DEMO, [origem, destino]);
    const r = rotas[0];
    if (!r) throw new Error("Nenhuma rota devolvida");
    rota = r;
    const saida = el("rota-saida");
    saida.className = "saida";
    saida.textContent = `${(r.distance / 1000).toFixed(1)} km, cerca de ${Math.round(r.duration / 60)} min.`;
    const lista = document.createElement("ol");
    for (const passo of r.steps) {
      const li = document.createElement("li");
      li.textContent = phrase(passo, passo.distance);
      lista.append(li);
    }
    saida.append(lista);
  } catch (e) {
    rota = null;
    mostrar("rota-saida", `Não foi possível calcular a rota: ${msgErro(e)}`, true);
  }
};

el("btn-falar").onclick = () => {
  if (!rota) return mostrar("rota-saida", "Calcule a rota primeiro.", true);
  for (const passo of rota.steps) falar(phrase(passo, passo.distance));
};

el("btn-sim").onclick = () => {
  if (!rota) return mostrar("rota-saida", "Calcule a rota primeiro.", true);
  parar();
  el("log").textContent = "";
  const geometria = rota.geometry;
  const sessao = new NavigationSession(rota);
  const anunciador = new Announcer();
  const salto = Math.max(1, Math.floor(geometria.length / 300));
  let i = 0;
  timer = window.setInterval(() => {
    const pos = geometria[Math.min(i, geometria.length - 1)];
    if (!pos) return parar();
    const u = sessao.update({ pos, accuracyM: 5 });
    if (u) {
      el("sim-status").textContent = `Faltam ${(u.remainingM / 1000).toFixed(2)} km, cerca de ${Math.round(u.remainingS / 60)} min.`;
      const aviso = anunciador.next(u.stepIndex, u.step, u.distanceToStepM);
      if (aviso) {
        registrar(aviso);
        falar(aviso);
      }
      if (u.status === "arrived") {
        registrar("Você chegou ao destino.");
        return parar();
      }
    }
    if (i >= geometria.length - 1) return parar();
    i += salto;
  }, 100);
};

el("btn-parar").onclick = parar;
