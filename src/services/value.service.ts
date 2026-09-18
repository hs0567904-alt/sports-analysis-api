import { confidence, edge, expectedValue, impliedProbability } from "../utils/math.js";

export type ValueInput = {
  market: string;
  selection: string;
  line?: number;
  odd: number;
  modelProbability: number;
  reasons?: string[];
  warnings?: string[];
  dataQuality?: number;
  contradictions?: number;
};

export function evaluateValue(input: ValueInput) {
  const implied = impliedProbability(input.odd);
  const e = edge(input.modelProbability, input.odd);
  const ev = expectedValue(input.modelProbability, input.odd);
  const conf = confidence(
    input.modelProbability,
    input.odd,
    input.dataQuality ?? 0.5,
    input.contradictions ?? 2
  );

  return {
    market: input.market,
    selection: input.selection,
    line: input.line ?? null,
    odd: input.odd,
    model_probability: input.modelProbability,
    implied_probability: implied,
    edge: e,
    expected_value: ev,
    confidence: conf,
    decision: conf === "C" ? "AVOID" : "BET",
    reasons: input.reasons ?? [],
    warnings: input.warnings ?? []
  };
}
