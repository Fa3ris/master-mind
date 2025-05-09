import { test, describe, expect, assert } from "vitest";
import { permutations2 } from "./permutations";

type Color = 1 | 2 | 3 | 4 | 5 | 6;

type Frequency<T extends number> = { [k in T]: number };

class Combination<T extends number> {
  private combination: ReadonlyArray<T>;

  constructor(combination: ReadonlyArray<T>) {
    this.combination = combination;
  }

  get size(): number {
    return this.combination.length;
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

/**
 * keep only the candidates that match the feedback
 * @param candidates
 * @param guess
 * @param actualFeedback
 * @returns
 */
function narrowCandidates<T extends number>(
  candidates: Combination<T>[],
  guess: Combination<T>,
  { correct, misplaced }: Feedback
) {
  return candidates.filter((candidate) => {
    const { correct: candidateCorrect, misplaced: candidateMisplaced } =
      guess.compare(candidate);
    return candidateCorrect === correct && candidateMisplaced === misplaced;
  });
}

describe("narrow candidates list", () => {
  describe("2 choices and size 2", () => {
    const candidates = permutations2([1, 2], 2).map((c) => new Combination(c));

    test("secret = 11, choice = 22, should narrow down to 1 solution", () => {
      const feedback = { correct: 0, misplaced: 0 };

      const remaining = narrowCandidates(
        candidates,
        new Combination([2, 2] as const),
        feedback
      );

      expect(remaining).toStrictEqual([new Combination([1, 1])]);
    });
  });

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

type Feedback = {
  correct: number;
  misplaced: number;
};

class GuessGenerator<T extends number> {
  private choices: ReadonlyArray<T>;
  private readonly permutationLength: number;

  private readonly totalPossibilities: number;

  private candidates: Combination<T>[];

  constructor(choices: T[], permutationLength: number) {
    this.choices = choices;
    this.permutationLength = permutationLength;
    this.totalPossibilities = choices.length ** permutationLength;

    this.candidates = permutations2(choices, permutationLength).map(
      (combination) => new Combination(combination)
    );
  }

  next(): Combination<T> {
    if (this.candidates.length === this.totalPossibilities) {
      const half = Math.floor(this.permutationLength / 2);
      const combination = new Array(half)
        .fill(this.choices[0])
        .concat(new Array(this.permutationLength - half).fill(this.choices[1]));
      return new Combination(combination);
    }

    return this.naiveGuess();
  }

  private naiveGuess(): Combination<T> {
    return this.candidates[0];
  }

  acceptFeedback(guess: Combination<T>, feedback: Feedback): void {
    this.candidates = narrowCandidates(this.candidates, guess, feedback);
  }
}

describe("guess generator", () => {
  test("generate a Combination of size 2", () => {
    const size = 2;
    const guessGenerator = new GuessGenerator<Color>([1, 2], size);
    const guess = guessGenerator.next();
    expect(guess).toBeInstanceOf(Combination);
    expect(guess.size).toBe(size);

    console.log(permutations2([1, 2, 3], 2));
  });

  describe("3 choices and size 2", () => {
    test("first guess should be 12", () => {
      const size = 2;
      const guessGenerator = new GuessGenerator<Color>([1, 2, 3], size);
      const guess = guessGenerator.next();
      expect(guess).toStrictEqual(new Combination([1, 2]));
    });

    test("check assert works", () => {
      assert.deepEqual(new Combination([1, 2]), new Combination([1, 2]));
    });

    describe("secret = 33", () => {
      const secret = new Combination<Color>([3, 3]);

      test("finds the solution", () => {
        let tries = 2;
        const size = 2;
        const guessGenerator = new GuessGenerator<Color>([1, 2, 3], size);
        let found = false;
        while (tries-- > 0) {
          const guess = guessGenerator.next();

          // console.log("tries", tries, "guess", guess, "secret", secret);
          try {
            assert.deepEqual(secret, guess);
            found = true;
            break;
          } catch (e) {}

          const feedback = secret.compare(guess);
          guessGenerator.acceptFeedback(guess, feedback);
        }

        expect(found).toBe(true);
      });
    });

    describe("secret = 23", () => {
      const secret = new Combination<Color>([2, 3]);

      test("finds the solution", () => {
        let tries = 2;
        const size = 2;
        const guessGenerator = new GuessGenerator<Color>([1, 2, 3], size);
        let found = false;
        while (tries-- > 0) {
          const guess = guessGenerator.next();

          try {
            assert.deepEqual(secret, guess);
            found = true;
            break;
          } catch (e) {}

          const feedback = secret.compare(guess);
          guessGenerator.acceptFeedback(guess, feedback);
        }

        expect(found).toBe(true);
      });
    });

    describe("secret = 31", () => {
      const secret = new Combination<Color>([2, 3]);

      test("finds the solution", () => {
        let tries = 2;
        const size = 2;
        const guessGenerator = new GuessGenerator<Color>([1, 2, 3], size);
        let found = false;
        while (tries-- > 0) {
          const guess = guessGenerator.next();

          try {
            assert.deepEqual(secret, guess);
            found = true;
            break;
          } catch (e) {}

          const feedback = secret.compare(guess);
          guessGenerator.acceptFeedback(guess, feedback);
        }

        expect(found).toBe(true);
      });
    });
  });

  describe("6 choices and size 2", () => {
    test("first guess should be 12", () => {
      const size = 2;
      const guessGenerator = new GuessGenerator<Color>(
        [1, 2, 3, 4, 5, 6],
        size
      );
      const guess = guessGenerator.next();
      expect(guess).toStrictEqual(new Combination([1, 2]));
    });

    describe("secret = 51", () => {
      const secret = new Combination<Color>([5, 1]);

      test("finds the solution", () => {
        let tries = 4;
        const size = 2;
        const guessGenerator = new GuessGenerator<Color>(
          [1, 2, 3, 4, 5, 6],
          size
        );
        let found = false;
        while (tries-- > 0) {
          const guess = guessGenerator.next();

          try {
            assert.deepEqual(secret, guess);
            found = true;
            break;
          } catch {}

          const feedback = secret.compare(guess);
          guessGenerator.acceptFeedback(guess, feedback);
        }

        expect(found).toBe(true);
      });
    });
  });

  describe("2 choices and size 4", () => {
    const size = 4;
    const choices: Color[] = [1, 2] as const;

    test("first guess should be 1122", () => {
      const guessGenerator = new GuessGenerator<Color>(choices, size);
      const guess = guessGenerator.next();
      expect(guess).toStrictEqual(new Combination([1, 1, 2, 2]));
    });

    describe("secret = 2222", () => {
      const secret = new Combination<Color>([2, 2, 2, 2]);

      test("finds the solution", () => {
        let tries = 4;
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        let found = false;
        while (tries-- > 0) {
          const guess = guessGenerator.next();

          try {
            assert.deepEqual(secret, guess);
            found = true;
            break;
          } catch {}

          const feedback = secret.compare(guess);
          guessGenerator.acceptFeedback(guess, feedback);
        }

        expect(found).toBe(true);
      });
    });
  });
  describe("6 choices and size 4", () => {
    const size = 4;
    const choices: Color[] = [1, 2, 3, 4, 5, 6] as const;

    test("first guess should be 1122", () => {
      const guessGenerator = new GuessGenerator<Color>(choices, size);
      const guess = guessGenerator.next();
      expect(guess).toStrictEqual(new Combination([1, 1, 2, 2]));
    });

    describe("secret = 2222", () => {
      const secret = new Combination<Color>([2, 2, 2, 2]);

      test("finds the solution", () => {
        let tries = 4;
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        let found = false;
        while (tries-- > 0) {
          const guess = guessGenerator.next();

          try {
            assert.deepEqual(secret, guess);
            found = true;
            break;
          } catch {}

          const feedback = secret.compare(guess);
          guessGenerator.acceptFeedback(guess, feedback);
        }

        expect(found).toBe(true);
      });
    });

    describe("secret = 6422", () => {
      const secret = new Combination<Color>([6, 4, 2, 2]);

      test("finds the solution", () => {
        let tries = 7;
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        let found = false;
        while (tries-- > 0) {
          const guess = guessGenerator.next();

          try {
            assert.deepEqual(secret, guess);
            found = true;
            break;
          } catch {}

          const feedback = secret.compare(guess);
          guessGenerator.acceptFeedback(guess, feedback);
        }

        expect(found).toBe(true);
      });
    });
  });
  describe("secret = 12, guess = 11", () => {
    test("next guess is 12 or 21", () => {
      const size = 2;
      const guessGenerator = new GuessGenerator<Color>([1, 2], size);
      const secret = new Combination([1, 2]);
      const guess = new Combination([1, 1]);
      const feedback = secret.compare(guess);
      guessGenerator.acceptFeedback(guess, feedback);
      const guess1 = guessGenerator.next();
      const possibleSolutions = [
        new Combination([1, 2]),
        new Combination([2, 1]),
      ];

      expect(possibleSolutions).toContainEqual(guess1);
    });
  });

  describe("secret = 22, guess = 11", () => {
    test("next guess is 22", () => {
      const size = 2;
      const guessGenerator = new GuessGenerator<Color>([1, 2], size);
      const secret = new Combination<Color>([2, 2]);
      const guess = new Combination([1, 1]);
      const feedback = secret.compare(guess);
      guessGenerator.acceptFeedback(guess, feedback);
      const guess1 = guessGenerator.next();

      expect(guess1).toStrictEqual(new Combination([2, 2]));
    });
  });

  test("generate a Combination of size 4", () => {
    const size = 4;
    const guessGenerator = new GuessGenerator<Color>([1, 2, 3, 4, 5, 6], size);
    const guess = guessGenerator.next();
    expect(guess).toBeInstanceOf(Combination);
    expect(guess.size).toBe(size);
  });
});
