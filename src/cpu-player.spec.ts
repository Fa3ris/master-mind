import { test, describe, expect, assert } from "vitest";
import { permutations2 } from "./permutations";

import { randomInt } from "node:crypto";
import type { Color } from "./model";
import { Combination } from "./model";
import { GuessGenerator, MINMAX, narrowCandidates, RANDOM } from "./cpu-player";

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

describe(`${GuessGenerator.name}`, () => {
  test("generate a Combination of size 2", () => {
    const size = 2;
    const guessGenerator = new GuessGenerator<Color>([1, 2], size);
    const guess = guessGenerator.next();
    expect(guess).toBeInstanceOf(Combination);
    expect(guess.size).toBe(size);
  });

  describe("2 choices, size 2", () => {
    const size = 2;
    const choices: Color[] = [1, 2];

    describe("secret = 12, guess = 11", () => {
      const secret = new Combination([1, 2]);
      const guess = new Combination([1, 1]);

      test("naive - next guess is 12 or 21", () => {
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

      test("random - next guess is 12 or 21", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        guessGenerator.strategy(RANDOM);
        const feedback = secret.compare(guess);

        guessGenerator.acceptFeedback(guess, feedback);
        const nextGuess = guessGenerator.next();

        const possibleSolutions = [
          new Combination([1, 2]),
          new Combination([2, 1]),
        ];
        expect(possibleSolutions).toContainEqual(nextGuess);

        const kSamples = 10;
        const samples = [...Array(kSamples)].map(() => guessGenerator.next());
        expect(samples).toContainEqual(new Combination([1, 2]));
        expect(samples).toContainEqual(new Combination([2, 1]));
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

  describe("3 choices, size 2", () => {
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

  describe("6 choices, size 2", () => {
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

  describe("2 choices, size 4", () => {
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

  describe("6 choices, size 4", () => {
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
        guessGenerator.strategy(MINMAX);
        expect(findSolution(guessGenerator, secret, 5)).toBe(true);
      });
    });

    describe("secret = 6666", () => {
      const secret = new Combination<Color>([6, 6, 6, 6]);

      test("naive - finds the solution in 7 tries", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        expect(findSolution(guessGenerator, secret, 7)).toBe(true);
      });

      test("minmax - finds the solution in 5 tries", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        guessGenerator.strategy(MINMAX);
        expect(findSolution(guessGenerator, secret, 5)).toBe(true);
      });
    });

    describe("secret = 3565", () => {
      const secret = new Combination<Color>([3, 5, 6, 5]);

      test("minmax - finds the solution in 5 tries", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        guessGenerator.strategy(MINMAX);
        expect(findSolution(guessGenerator, secret, 5)).toBe(true);
      });
    });

    const numberOfTests = 1;
    const combinationsToTest = pickKRandom(
      permutations2(choices, size).map((c) => new Combination(c)),
      numberOfTests
    );

    // warning: takes ~1.5 s per test
    describe.each(combinationsToTest)(`secret %o`, (secret) => {
      test("minmax - finds the solution in at most 5 tries", () => {
        const guessGenerator = new GuessGenerator<Color>(choices, size);
        guessGenerator.strategy(MINMAX);
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

    // console.log("try", maxTries - tries, "guess", guess, "secret", secret);
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

function pickKRandom<T>(array: T[], k: number): T[] {
  if (k > array.length) {
    throw new Error("k cannot be larger than the array length");
  }

  const copied = [...array];

  // Perform a partial Fisher–Yates shuffle
  for (let i = 0; i < k; i++) {
    const randomIndex = i + randomInt(copied.length - i);
    [copied[i], copied[randomIndex]] = [copied[randomIndex], copied[i]];
  }

  return copied.slice(0, k);
}