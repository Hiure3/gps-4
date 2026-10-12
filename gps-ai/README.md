# GPS AI — Navegação inteligente (v0.2.0)

App de desktop (Windows) com núcleo em TypeScript testado e uma tela simples.

## O que funciona
- Clima (Open-Meteo), com fonte e horário.
- Comandos em português (digitados), entendidos por regras locais.
- Rota entre dois pontos (servidor de demonstração do OSRM) com instruções em português.
- Simulação de viagem com avisos de voz (voz do Windows, pt-BR se instalada).

## O que ainda NÃO existe
Mapa visual, GPS real do computador, trânsito em tempo real, notícias, música, busca de endereços.
As rotas usam um servidor de demonstração, apenas para teste.

## Como usar no Windows
**Opção A — só rodar:** instale o Node.js 22 (https://nodejs.org) e dê dois cliques em `RODAR.bat`.

**Opção B — instalador (.exe) pelo GitHub:** envie esta pasta para um repositório no GitHub (branch `main`).
O GitHub gera o instalador sozinho em alguns minutos. Baixe em *Releases* (lado direito da página do repositório).

**Opção C — instalador no seu PC:** com o Node.js instalado, dê dois cliques em `GERAR-INSTALADOR.bat`. O `.exe` fica na pasta `release`.

O instalador não é assinado digitalmente. Na primeira execução, o Windows pode mostrar "O Windows protegeu seu PC":
clique em *Mais informações* e depois em *Executar assim mesmo*.

## Para desenvolvedores
    npm install
    npm run check   # tsc + vitest

Licença: MIT. Decisões: `docs/DECISOES.md`.
