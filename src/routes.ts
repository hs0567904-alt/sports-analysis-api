import { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "./db/client.js";
import { sportmonks } from "./providers/sportmonks.js";
import { analyzeMarket, getMatchAnalysis, getValueOpportunities } from "./services/analysis.service.js";
import { analyzeWithAI } from "./services/ai.service.js";

const marketSchema = z.object({
  match_id: z.coerce.number(),
  market: z.string().min(1),
  selection: z.string().min(1),
  line: z.number().optional(),
  odd: z.number().positive(),
  model_probability: z.number().min(0).max(1),
  reasons: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  data_quality: z.number().min(0).max(1).optional(),
  contradictions: z.number().int().min(0).optional()
});

export async function routes(app: FastifyInstance) {
  app.get("/api/health", async () => ({
    status: "ok",
    service: "sports-analysis-api",
    timestamp: new Date().toISOString()
  }));

  app.get("/api/competitions", async () => {
    const result = await query("SELECT * FROM competitions ORDER BY name");
    return { competitions: result.rows };
  });

  app.get("/api/matches/today", async () => {
    const result = await query(
      `SELECT * FROM matches
       WHERE starting_at >= CURRENT_DATE
         AND starting_at < CURRENT_DATE + INTERVAL '1 day'
       ORDER BY starting_at`
    );
    return { matches: result.rows };
  });

  app.get("/api/matches/upcoming", async () => {
    const result = await query(
      `SELECT * FROM matches
       WHERE starting_at > NOW()
       ORDER BY starting_at LIMIT 100`
    );
    return { matches: result.rows };
  });

  app.get("/api/matches/live", async () => {
    const result = await query(
      `SELECT * FROM matches
       WHERE status IN ('LIVE','1H','2H','HT','ET','PEN')
       ORDER BY starting_at`
    );
    return { matches: result.rows };
  });

  app.get("/api/matches/:matchId", async (request, reply) => {
    const id = Number((request.params as { matchId: string }).matchId);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "matchId inválido" });

    const analysis = await getMatchAnalysis(id);
    return {
      match: analysis.match,
      form: {},
      statistics: analysis.statistics,
      lineups: [],
      injuries: [],
      odds: analysis.odds,
      events: [],
      xg: { home: 0, away: 0 },
      analysis: {
        result: {},
        goals: {},
        corners: {},
        cards: {},
        shots: {},
        players: {}
      },
      value: await getValueOpportunities(id)
    };
  });

  app.get("/api/teams/:teamId", async (request) => {
    const id = Number((request.params as { teamId: string }).teamId);
    const result = await query("SELECT * FROM teams WHERE id=$1", [id]);
    return { team: result.rows[0] ?? null };
  });

  app.get("/api/players/:playerId", async (request) => {
    const id = Number((request.params as { playerId: string }).playerId);
    const player = await query("SELECT * FROM players WHERE id=$1", [id]);
    const stats = await query<any>("SELECT * FROM player_statistics WHERE player_id=$1", [id]);
    const lineup = await query<any>(
      `SELECT starter, minutes FROM lineups
       WHERE player_id=$1 ORDER BY id DESC LIMIT 5`,
      [id]
    );

    const minutes = lineup.rows.map((r: any) => Number(r.minutes ?? 0));
    return {
      player: player.rows[0] ?? null,
      availability: {
        probable_starter: Boolean(lineup.rows[0]?.starter ?? false),
        injured: false,
        suspended: false
      },
      minutes: {
        last_5: minutes,
        average: minutes.length ? minutes.reduce((a, b) => a + b, 0) / minutes.length : 0
      },
      statistics: stats.rows[0]?.stats ?? {}
    };
  });

  app.get("/api/odds/:matchId", async (request) => {
    const id = Number((request.params as { matchId: string }).matchId);
    const result = await query(
      `SELECT o.*, b.name AS bookmaker_name
       FROM odds o LEFT JOIN bookmakers b ON b.id=o.bookmaker_id
       WHERE o.match_id=$1 ORDER BY o.updated_at DESC`,
      [id]
    );
    return { match_id: id, updated_at: new Date().toISOString(), odds: result.rows };
  });

  app.get("/api/statistics/match/:matchId", async (request) => {
    const id = Number((request.params as { matchId: string }).matchId);
    const result = await query("SELECT * FROM match_statistics WHERE match_id=$1", [id]);
    return result.rows[0] ?? { match_id: id, home: {}, away: {} };
  });

  app.get("/api/statistics/team/:teamId", async (request) => {
    const id = Number((request.params as { teamId: string }).teamId);
    const result = await query("SELECT * FROM team_statistics WHERE team_id=$1", [id]);
    return result.rows[0] ?? { team_id: id, stats: {} };
  });

  app.get("/api/statistics/player/:playerId", async (request) => {
    const id = Number((request.params as { playerId: string }).playerId);
    const result = await query("SELECT * FROM player_statistics WHERE player_id=$1", [id]);
    return result.rows[0] ?? { player_id: id, stats: {} };
  });

  app.get("/api/analysis/match/:matchId", async (request) => {
    const id = Number((request.params as { matchId: string }).matchId);
    return getMatchAnalysis(id);
  });

  app.post("/api/analysis/market", async (request, reply) => {
    const parsed = marketSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return analyzeMarket(parsed.data);
  });

  app.get("/api/analysis/player/:playerId", async (request) => {
    const id = Number((request.params as { playerId: string }).playerId);
    const result = await query(
      `SELECT p.*, ps.stats, l.starter, l.minutes
       FROM players p
       LEFT JOIN player_statistics ps ON ps.player_id=p.id
       LEFT JOIN LATERAL (
         SELECT starter, minutes FROM lineups WHERE player_id=p.id ORDER BY id DESC LIMIT 1
       ) l ON TRUE
       WHERE p.id=$1`,
      [id]
    );
    return { player: result.rows[0] ?? null };
  });

  app.get("/api/value/:matchId", async (request) => {
    const id = Number((request.params as { matchId: string }).matchId);
    return { match_id: id, opportunities: await getValueOpportunities(id) };
  });

  app.post("/api/ai/analyze", async (request, reply) => {
    const body = request.body as { match_id?: number; markets?: string[] };
    if (!body?.match_id || !Array.isArray(body.markets)) {
      return reply.code(400).send({ error: "match_id e markets são obrigatórios" });
    }

    const context = await getMatchAnalysis(body.match_id);
    const ai = await analyzeWithAI({
      match_id: body.match_id,
      markets: body.markets,
      context
    });

    await query(
      `INSERT INTO ai_analysis (match_id, mode, response) VALUES ($1,$2,$3)`,
      [body.match_id, "pre_match", JSON.stringify(ai)]
    );

    return { match_id: body.match_id, ai_analysis: ai };
  });

  app.post("/api/ai/live", async (request, reply) => {
    const body = request.body as { match_id?: number; markets?: string[] };
    if (!body?.match_id) {
      return reply.code(400).send({ error: "match_id é obrigatório" });
    }

    const context = await getMatchAnalysis(body.match_id);
    const ai = await analyzeWithAI({
      match_id: body.match_id,
      markets: body.markets ?? ["goals", "corners", "cards", "shots"],
      context: { mode: "live", ...context }
    });

    await query(
      `INSERT INTO ai_analysis (match_id, mode, response) VALUES ($1,$2,$3)`,
      [body.match_id, "live", JSON.stringify(ai)]
    );

    return { match_id: body.match_id, ai_analysis: ai };
  });

  // Proxy opcional para chamadas do fornecedor durante desenvolvimento.
  app.get("/api/provider/competitions", async () => {
    return sportmonks.get("/competitions");
  });
}
