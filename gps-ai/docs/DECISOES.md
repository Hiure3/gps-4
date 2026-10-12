# Decisões de arquitetura (v0.1.0)

| Área | Escolha | Motivo / custo / ressalva |
|---|---|---|
| Linguagem do núcleo | TypeScript | Testável aqui; reutilizável em PWA, Capacitor (Android) e Electron (Windows). Flutter foi considerado, mas o SDK não é baixável neste ambiente de build. |
| Mapas | MapLibre GL + tiles OSM (planejado) | Sem custo por requisição se hospedar tiles; tiles públicos do OSM proibem uso intensivo. Google/Mapbox/HERE: pagos por volume, melhor trânsito. |
| Rotas | OSRM/Valhalla próprio (implementado cliente OSRM) | O servidor demo público não é para produção. Cobertura Brasil via extrato OSM (Geofabrik). **Sem trânsito em tempo real.** |
| Trânsito | NÃO implementado | Exige fonte paga (Google, HERE, TomTom). Interface deve mostrar "indisponível". |
| Clima | Open-Meteo (implementado) | Grátis para uso não comercial; comercial exige plano. |
| Notícias | Planejado | Usar RSS/APIs autorizadas; só título, fonte, data e link. |
| Voz | TTS nativo (Web Speech / Android TTS) como padrão grátis; voz neural opcional via backend | Vozes disponíveis dependem do aparelho; sem garantia de duas vozes pt-BR em todos. |
| IA | Parser local + LLM via backend proxy (planejado) | Nenhuma chave no app. |
| Música | Arquivos locais + MediaSession; serviços via OAuth próprio (planejado) | Sem contornar DRM. |
| App Windows | Electron + electron-builder (instalador NSIS), gerado no GitHub Actions | Instalador sem assinatura digital: o Windows SmartScreen mostra aviso. Rotas usam o servidor demo do OSRM (só para teste). |
