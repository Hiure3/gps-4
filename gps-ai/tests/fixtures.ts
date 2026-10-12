// Rota SIMULADA (reta leste, ~1,1 km) no formato OSRM. Não é dado real de provedor.
export const osrmOk = {
  code: "Ok",
  routes: [{
    distance: 1112, duration: 120,
    geometry: { coordinates: [[-35.2, -5.8], [-35.195, -5.8], [-35.19, -5.8]] },
    legs: [{ steps: [
      { name: "Av. Norte", distance: 556, duration: 60, maneuver: { type: "depart", location: [-35.2, -5.8] } },
      { name: "Rua Sul", distance: 556, duration: 60, maneuver: { type: "turn", modifier: "right", location: [-35.195, -5.8] } },
      { name: "", distance: 0, duration: 0, maneuver: { type: "arrive", location: [-35.19, -5.8] } },
    ] }],
  }],
};
