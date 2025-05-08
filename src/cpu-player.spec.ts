import { test, describe, expect } from "vitest";
import { permutations2 } from "./permutations";

type Color = 1 | 2 | 3 | 4 | 5 | 6;

type Frequency<T extends number> = { [k in T]: number };

class Combination<T extends number> {
  private combination: ReadonlyArray<T>;

  constructor(combination: ReadonlyArray<T>) {
    this.combination = combination;
  }

  compare(other: Combination<T>): { correct: number; misplaced: number } {
    const matchedIds = this.combination
      .map((choice, index) =>
        choice === other.combination[index] ? index : -1
      )
      .filter((index) => index !== -1);

    const secretFrequencies = this.frequencies(matchedIds);
    const misplaced = Object.entries<T>(
      other.frequencies(matchedIds) as Record<string, T>
    ).reduce<number>((acc, [color, count]) => {
      const secretFrequency = secretFrequencies[Number(color) as T] ?? 0;
      const misplacedForColor = Math.min(count, secretFrequency);
      return acc + misplacedForColor;
    }, 0);

    return { correct: matchedIds.length, misplaced };
  }

  private frequencies(idsToIgnore: number[]): Partial<Frequency<T>> {
    const potentialMisplacedChoices = this.combination.filter(
      (_, index) => !idsToIgnore.includes(index)
    );
    return potentialMisplacedChoices.reduce<Partial<Frequency<T>>>(
      (record, choice) => {
        record[choice] = (record[choice] ?? 0) + 1;
        return record;
      },
      {}
    );
  }
}

function narrowCandidates(
  candidates: Combination<Color>[],
  guess: Combination<Color>,
  { correct, misplaced }: { correct: number; misplaced: number }
) {
  return candidates.filter((candidate) => {
    const { correct: candidateCorrect, misplaced: candidateMisplaced } =
      guess.compare(candidate);
    return candidateCorrect === correct && candidateMisplaced === misplaced;
  });
}

describe("narrow candidates list", () => {
  const candidates = permutations2([1, 2, 3, 4, 5, 6], 4).map(
    (c) => new Combination(c)
  );

  describe("when beginning with all possibilities and guess is 1122 and feedback is 0 correct and 4 misplaced", () => {
    test("should narrow down to 1 solution 2211", () => {
      const feedback = { correct: 0, misplaced: 4 };

      const remaining = narrowCandidates(
        candidates,
        new Combination([1, 1, 2, 2] as const),
        feedback
      );

      expect(remaining).toStrictEqual([new Combination([2, 2, 1, 1])]);
    });
  });

  describe("when beginning with all possibilities and guess is 1122 and feedback is 0 correct and 3 misplaced", () => {
    test("should narrow down to 16 solutions", () => {
      const feedback = { correct: 0, misplaced: 3 };

      const remaining = narrowCandidates(
        candidates,
        new Combination([1, 1, 2, 2] as const),
        feedback
      );

      expect(remaining).toHaveLength(16);
    });
  });

  describe("scenario choose 2611 and guess 1122 then 1213", () => {
    test("should narrow down to 16 solutions then 4 solutions", () => {
      const secretCombination = new Combination<Color>([2, 6, 1, 1]);

      const guess1 = new Combination([1, 1, 2, 2]);
      const feedback1 = secretCombination.compare(guess1);
      const remaining1 = narrowCandidates(candidates, guess1, feedback1);
      expect(remaining1).toHaveLength(16);

      const guess2 = new Combination([1, 2, 1, 3]);
      const feedback2 = secretCombination.compare(guess2);
      const remaining2 = narrowCandidates(remaining1, guess2, feedback2);
      expect(remaining2).toHaveLength(4);
    });
  });
});
