import { query } from "../db/client.js";
import { evaluateValue } from "./value.service.js";

export async function getMatchAnalysis(matchId: number) {
  const match = await query("SELECT * FROM matches WHERE id=$1", [matchId]);
  const stats = await query("SELECT * FROM match_statistics WHERE match_id=$1", [matchId]);
  const odds = await query("SELECT * FROM odds WHERE match_id=$1 ORDER BY updated_at DESC", [matchId]);

  return {
    match: match.rows[0] ?? null,
    statistics: stats.rows[0] ?? null,
    odds: odds.rows
  };
}

export async function getValueOpportunities(matchId: number) {
  const rows = await query(
    `SELECT market, selection, line, odd, model_probability,
            implied_probability, edge, expected_value, confidence, reasons, warnings
     FROM value_opportunities WHERE match_id=$1
     ORDER BY edge DESC`,
    [matchId]
  );
  return rows.rows;
}

export async function analyzeMarket(body: {
  match_id: number;
  market: string;
  selection: string;
  line?: number;
  odd: number;
  model_probability: number;
  reasons?: string[];
  warnings?: string[];
  data_quality?: number;
  contradictions?: number;
}) {
  const result = evaluateValue({
    market: body.market,
    selection: body.selection,
    line: body.line,
    odd: body.odd,
    modelProbability: body.model_probability,
    reasons: body.reasons,
    warnings: body.warnings,
    dataQuality: body.data_quality,
    contradictions: body.contradictions
  });

  await query(
    `INSERT INTO predictions
      (match_id, market, selection, line, probability, odd, edge, expected_value, confidence, decision)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      body.match_id, body.market, body.selection, body.line ?? null,
      result.model_probability, result.odd, result.edge,
      result.expected_value, result.confidence, result.decision
    ]
  );

  return result;
}
