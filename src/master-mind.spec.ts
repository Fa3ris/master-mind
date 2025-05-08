import { describe, expect, it } from "vitest";
import {
  BLUE,
  Combination,
  MasterMind,
  RED,
  YELLOW,
  type Color,
} from "./master-mind";

describe("compare combinations", () => {
  it.each<[Color[], Color[], { correct: number; misplaced: number }]>([
    [[RED], [RED], { correct: 1, misplaced: 0 }],
    [[RED], [BLUE], { correct: 0, misplaced: 0 }],
    [[RED, YELLOW], [BLUE, RED], { correct: 0, misplaced: 1 }],
    [[RED, BLUE], [BLUE, RED], { correct: 0, misplaced: 2 }],
    [[RED, RED, YELLOW], [RED, RED, YELLOW], { correct: 3, misplaced: 0 }],
    [[RED, YELLOW, RED], [RED, RED, YELLOW], { correct: 1, misplaced: 2 }],
    [[RED, YELLOW, RED], [RED, RED, RED], { correct: 2, misplaced: 0 }],
    [[RED, RED, RED], [RED, YELLOW, RED], { correct: 2, misplaced: 0 }],
    [[RED, YELLOW, BLUE], [YELLOW, BLUE, RED], { correct: 0, misplaced: 3 }],
    [[RED, YELLOW, BLUE], [YELLOW, YELLOW, RED], { correct: 1, misplaced: 1 }],
    [[RED, YELLOW, BLUE], [BLUE, YELLOW, RED], { correct: 1, misplaced: 2 }],
    [[RED, YELLOW, BLUE], [RED, YELLOW, BLUE], { correct: 3, misplaced: 0 }],
    [
      [RED, YELLOW, BLUE, YELLOW],
      [RED, YELLOW, BLUE, BLUE],
      { correct: 3, misplaced: 0 },
    ],
    [
      [RED, YELLOW, BLUE, YELLOW],
      [RED, YELLOW, YELLOW, BLUE],
      { correct: 2, misplaced: 2 },
    ],
    [
      [RED, YELLOW, BLUE, YELLOW],
      [YELLOW, YELLOW, YELLOW, BLUE],
      { correct: 1, misplaced: 2 },
    ],
  ])("should validate %s %s", (secret, guess, expected) => {
    const masterMind = new MasterMind(new Combination(secret));
    const guessCombination = new Combination(guess);
    expect(masterMind.check(guessCombination)).toStrictEqual(expected);
  });
});
