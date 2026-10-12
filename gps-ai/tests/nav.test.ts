import { describe, it, expect } from "vitest";
import { buildRouteUrl, parseOsrm, fetchRoutes, RoutingError } from "../src/nav/routing";
import { phrase, speakDistance, Announcer } from "../src/nav/instructions";
import { NavigationSession } from "../src/nav/session";
import { haversine } from "../src/core/geo";
import { osrmOk } from "./fixtures";

const route = () => parseOsrm(osrmOk)[0]!;

describe("geo", () => { it("haversine ~ 111 km por grau de latitude", () => expect(haversine([0, 0], [1, 0])).toBeGreaterThan(111000)); });

describe("routing", () => {
  it("monta URL com lon,lat e exclude=toll", () => {
    const u = buildRouteUrl("https://r.example", [[-5.8, -35.2], [-5.8, -35.19]], { avoidTolls: true });
    expect(u).toContain("/route/v1/driving/-35.2,-5.8;-35.19,-5.8");
    expect(u).toContain("exclude=toll");
  });
  it("parseia resposta válida", () => { const r = route(); expect(r.steps).toHaveLength(3); expect(r.geometry[0]).toEqual([-5.8, -35.2]); });
  it("rejeita resposta inválida e NoRoute", () => {
    expect(() => parseOsrm({ code: "NoRoute" })).toThrowError(RoutingError);
    expect(() => parseOsrm({ code: "Ok", routes: [{}] })).toThrow();
    expect(() => parseOsrm(null)).toThrow();
  });
  it("trata perda de rede, HTTP 500 e JSON inválido", async () => {
    await expect(fetchRoutes(async () => { throw new Error("offline"); }, "x", [[0, 0], [1, 1]])).rejects.toMatchObject({ code: "NETWORK" });
    await expect(fetchRoutes(async () => ({ ok: false, status: 500, json: async () => ({}) }), "x", [[0, 0], [1, 1]])).rejects.toMatchObject({ code: "HTTP" });
    await expect(fetchRoutes(async () => ({ ok: true, status: 200, json: async () => { throw new Error(); } }), "x", [[0, 0], [1, 1]])).rejects.toMatchObject({ code: "INVALID" });
  });
});

describe("instruções em pt-BR", () => {
  it("fala distâncias arredondadas", () => { expect(speakDistance(312)).toBe("300 metros"); expect(speakDistance(1000)).toBe("1 quilômetro"); expect(speakDistance(1480)).toBe("1,5 quilômetros"); });
  it("frase de manobra", () => expect(phrase(route().steps[1]!, 300)).toBe("Em 300 metros, vire à direita na Rua Sul."));
  it("não repete anúncios e pula limiares já passados", () => {
    const a = new Announcer(); const s = route().steps[1]!;
    expect(a.next(1, s, 900)).toBeNull();
    expect(a.next(1, s, 790)).not.toBeNull();
    expect(a.next(1, s, 780)).toBeNull();
    expect(a.next(1, s, 290)).not.toBeNull();
    expect(a.next(1, s, 20)).toContain("Agora");
    expect(a.next(1, s, 10)).toBeNull();
    const b = new Announcer(); expect(b.next(0, s, 40)).not.toBeNull(); expect(b.next(0, s, 290)).toBeNull();
  });
});

describe("sessão de navegação", () => {
  it("segue na rota e informa próxima manobra", () => {
    const u = new NavigationSession(route()).update({ pos: [-5.8, -35.1985] })!;
    expect(u.status).toBe("on_route"); expect(u.stepIndex).toBe(1); expect(u.distanceToStepM).toBeGreaterThan(370); expect(u.distanceToStepM).toBeLessThan(400); // 0,0035° de lon ≈ 387 m
  });
  it("só declara off_route após leituras consecutivas", () => {
    const s = new NavigationSession(route()); const off: [number, number] = [-5.799, -35.195];
    expect(s.update({ pos: off })!.status).toBe("on_route");
    expect(s.update({ pos: off })!.status).toBe("on_route");
    expect(s.update({ pos: off })!.status).toBe("off_route");
  });
  it("um fix bom entre ruins zera a contagem", () => {
    const s = new NavigationSession(route()); const off: [number, number] = [-5.799, -35.195];
    s.update({ pos: off }); s.update({ pos: off }); s.update({ pos: [-5.8, -35.197] });
    expect(s.update({ pos: off })!.status).toBe("on_route");
  });
  it("ignora fix com precisão ruim", () => expect(new NavigationSession(route()).update({ pos: [0, 0], accuracyM: 500 })).toBeNull());
  it("detecta chegada", () => expect(new NavigationSession(route()).update({ pos: [-5.8, -35.19001] })!.status).toBe("arrived"));
});
