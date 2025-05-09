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

  private guessStrat: () => Combination<T>;

  private allCombinations: Combination<T>[] = [];

  constructor(choices: T[], permutationLength: number) {
    this.choices = choices;
    this.permutationLength = permutationLength;
    this.totalPossibilities = choices.length ** permutationLength;

    this.candidates = permutations2(choices, permutationLength).map(
      (combination) => new Combination(combination)
    );
    this.guessStrat = this.naiveGuess;
  }

  next(): Combination<T> {
    if (this.candidates.length === 1) return this.candidates[0];
    if (this.candidates.length === this.totalPossibilities) {
      const half = Math.floor(this.permutationLength / 2);
      const combination = new Array(half)
        .fill(this.choices[0])
        .concat(new Array(this.permutationLength - half).fill(this.choices[1]));
      return new Combination(combination);
    }

    return this.guessStrat();
  }

  strat(s: "naive" | "minmax"): void {
    if (s === "naive") {
      this.guessStrat = this.naiveGuess;
    } else {
      this.guessStrat = this.minMaxGuess;

      this.allCombinations = permutations2(
        [...this.choices],
        this.permutationLength
      ).map((c) => new Combination(c));
    }
  }

  private naiveGuess(): Combination<T> {
    return this.candidates[0];
  }

  static readonly possibleFeedbacks: ReadonlyArray<Feedback> = [
    { correct: 0, misplaced: 0 },
    { correct: 0, misplaced: 1 },
    { correct: 0, misplaced: 2 },
    { correct: 0, misplaced: 3 },
    { correct: 0, misplaced: 4 },
    { correct: 1, misplaced: 0 },
    { correct: 1, misplaced: 1 },
    { correct: 1, misplaced: 2 },
    { correct: 1, misplaced: 3 },
    { correct: 2, misplaced: 0 },
    { correct: 2, misplaced: 1 },
    { correct: 2, misplaced: 2 },
    { correct: 3, misplaced: 0 },
    { correct: 4, misplaced: 0 },
  ];

  private minMaxGuess(): Combination<T> {
    const maxCandidatesRemainingPerCombination = this.allCombinations.map(
      (combination) => {
        const maxRemainingCandidates = Math.max(
          ...GuessGenerator.possibleFeedbacks.map(
            (feedback) =>
              narrowCandidates(this.candidates, combination, feedback).length
          )
        );
        return [combination, maxRemainingCandidates] as [
          Combination<T>,
          number
        ];
      }
    );

    return maxCandidatesRemainingPerCombination.reduce(
      (previousValue, newValue) => {
        return newValue[1] < previousValue[1] ? newValue : previousValue;
      }
    )[0];
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

  describe("2 choices, size 2", () => {
    const size = 2;
    const choices: Color[] = [1, 2];

    describe("secret = 12, guess = 11", () => {
      const secret = new Combination([1, 2]);
      const guess = new Combination([1, 1]);

      test("next guess is 12 or 21", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        const feedback = secret.compare(guess);

        guessGenerator.acceptFeedback(guess, feedback);
        const nextGuess = guessGenerator.next();

        const possibleSolutions = [
          new Combination([1, 2]),
          new Combination([2, 1]),
        ];
        expect(possibleSolutions).toContainEqual(nextGuess);
      });
    });

    describe("secret = 22, guess = 11", () => {
      const secret = new Combination<Color>([2, 2]);
      const guess = new Combination([1, 1]);

      test("next guess is 22", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        const feedback = secret.compare(guess);
        guessGenerator.acceptFeedback(guess, feedback);

        expect(guessGenerator.next()).toStrictEqual(new Combination([2, 2]));
      });
    });
  });

  describe("3 choices and size 2", () => {
    const size = 2;
    const choices: Color[] = [1, 2, 3];

    test("first guess should be 12", () => {
      const guessGenerator = new GuessGenerator<Color>(choices, size);
      expect(guessGenerator.next()).toStrictEqual(new Combination([1, 2]));
    });

    test("check assert works", () => {
      assert.deepEqual(new Combination([1, 2]), new Combination([1, 2]));
    });

    describe("secret = 33", () => {
      const secret = new Combination<Color>([3, 3]);

      test("finds the solution", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        expect(findSolution(guessGenerator, secret, 2)).toBe(true);
      });
    });

    describe("secret = 23", () => {
      const secret = new Combination<Color>([2, 3]);

      test("finds the solution", () => {
        const guessGenerator = new GuessGenerator<Color>([1, 2, 3], size);
        expect(findSolution(guessGenerator, secret, 3)).toBe(true);
      });
    });

    describe("secret = 31", () => {
      const secret = new Combination<Color>([2, 3]);

      test("finds the solution", () => {
        const guessGenerator = new GuessGenerator<Color>([1, 2, 3], size);
        expect(findSolution(guessGenerator, secret, 2)).toBe(true);
      });
    });
  });

  describe("6 choices and size 2", () => {
    const size = 2;
    const choices: Color[] = [1, 2, 3, 4, 5, 6];

    test("first guess should be 12", () => {
      const guessGenerator = new GuessGenerator<Color>(choices, size);
      expect(guessGenerator.next()).toStrictEqual(new Combination([1, 2]));
    });

    describe("secret = 51", () => {
      const secret = new Combination<Color>([5, 1]);

      test("finds the solution", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        expect(findSolution(guessGenerator, secret, 4)).toBe(true);
      });
    });
  });

  describe("2 choices and size 4", () => {
    const size = 4;
    const choices: Color[] = [1, 2] as const;

    test("first guess should be 1122", () => {
      const guessGenerator = new GuessGenerator<Color>(choices, size);
      expect(guessGenerator.next()).toStrictEqual(
        new Combination([1, 1, 2, 2])
      );
    });

    describe("secret = 2222", () => {
      const secret = new Combination<Color>([2, 2, 2, 2]);

      test("finds the solution", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        expect(findSolution(guessGenerator, secret, 4)).toBe(true);
      });
    });
  });

  describe("6 choices and size 4", () => {
    const size = 4;
    const choices: Color[] = [1, 2, 3, 4, 5, 6] as const;

    test("first guess should be 1122", () => {
      const guessGenerator = new GuessGenerator<Color>(choices, size);
      expect(guessGenerator.next()).toStrictEqual(
        new Combination([1, 1, 2, 2])
      );
    });

    describe("secret = 2222", () => {
      const secret = new Combination<Color>([2, 2, 2, 2]);

      test("finds the solution", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        expect(findSolution(guessGenerator, secret, 4)).toBe(true);
      });
    });

    describe("secret = 6422", () => {
      const secret = new Combination<Color>([6, 4, 2, 2]);

      test("naive - finds the solution in 7 tries", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        expect(findSolution(guessGenerator, secret, 7)).toBe(true);
      });

      test("minmax - finds the solution in 5 tries", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        guessGenerator.strat("minmax");
        expect(findSolution(guessGenerator, secret, 5)).toBe(true);
      });
    });

    test(`generate a Combination of size ${size}`, () => {
      const guessGenerator = new GuessGenerator<Color>(choices, size);
      expect(guessGenerator.next().size).toBe(size);
    });
  });
});

function findSolution<T extends number>(
  generator: GuessGenerator<T>,
  secret: Combination<T>,
  maxTries: number
): boolean {
  let tries = maxTries;
  let found = false;
  while (tries-- > 0) {
    const guess = generator.next();

    console.log("try", maxTries - tries, "guess", guess, "secret", secret);
    try {
      assert.deepEqual(secret, guess);
      found = true;
      break;
    } catch (e) {}

    const feedback = secret.compare(guess);
    generator.acceptFeedback(guess, feedback);
  }
  return found;
}
