export function impliedProbability(odd: number): number {
  return odd > 0 ? 1 / odd : 0;
}

export function edge(modelProbability: number, odd: number): number {
  return modelProbability - impliedProbability(odd);
}

export function expectedValue(modelProbability: number, odd: number): number {
  return modelProbability * odd - 1;
}

export function confidence(
  modelProbability: number,
  odd: number,
  dataQuality: number,
  contradictions: number
): "A" | "B" | "C" {
  const e = edge(modelProbability, odd);
  if (e >= 0.08 && dataQuality >= 0.75 && contradictions <= 1) return "A";
  if (e >= 0.04 && dataQuality >= 0.55 && contradictions <= 2) return "B";
  return "C";
}
