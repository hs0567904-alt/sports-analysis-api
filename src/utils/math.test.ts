import { describe, expect, it } from "vitest";
import { impliedProbability, expectedValue, edge } from "./math.js";

describe("value math", () => {
  it("calculates implied probability", () => {
    expect(impliedProbability(2)).toBe(0.5);
  });

  it("calculates edge", () => {
    expect(edge(0.58, 2)).toBeCloseTo(0.08);
  });

  it("calculates EV", () => {
    expect(expectedValue(0.58, 2)).toBeCloseTo(0.16);
  });
});
