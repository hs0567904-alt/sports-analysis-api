# Sports Analysis API

Backend REST para o aplicativo esportivo/estatístico. A arquitetura separa:

- ingestão Sportmonks;
- PostgreSQL;
- normalização de partidas, times, jogadores, escalações, lesões, odds e estatísticas;
- motor estatístico;
- motor de valor (probabilidade, edge e EV);
- análise pré-jogo e live;
- camada de IA;
- histórico/model results;
- integração simples com Base44.

## 1. Rodar localmente

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

API: `http://localhost:3000`

Swagger: `http://localhost:3000/docs`

Health: `GET /api/health`

## 2. Configuração

Preencha no `.env`:

- `SPORTMONKS_API_TOKEN`
- `AI_API_KEY` (opcional para a API subir; necessário para /ai/analyze)
- `AI_MODEL`
- `DATABASE_URL`

Nunca coloque esses segredos no frontend/Base44.

## 3. Endpoints

- GET `/api/health`
- GET `/api/competitions`
- GET `/api/matches/today`
- GET `/api/matches/upcoming`
- GET `/api/matches/live`
- GET `/api/matches/:matchId`
- GET `/api/teams/:teamId`
- GET `/api/players/:playerId`
- GET `/api/odds/:matchId`
- GET `/api/statistics/match/:matchId`
- GET `/api/statistics/team/:teamId`
- GET `/api/statistics/player/:playerId`
- GET `/api/analysis/match/:matchId`
- POST `/api/analysis/market`
- GET `/api/analysis/player/:playerId`
- GET `/api/value/:matchId`
- POST `/api/ai/analyze`
- POST `/api/ai/live`

## 4. Banco

O migration cria as tabelas:

competitions, seasons, teams, players, matches, match_events,
match_statistics, team_statistics, player_statistics, lineups,
injuries, bookmakers, markets, odds, predictions, ai_analysis,
value_opportunities, analysis_history, model_results.

## 5. Observação importante

A integração Sportmonks depende do plano/endpoint contratado e dos campos que sua conta disponibiliza. O adaptador está isolado em `src/providers/sportmonks.ts`, para que mudanças de fornecedor não contaminem o restante da aplicação.
