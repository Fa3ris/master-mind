import type { Feedback } from "./model";
import { Combination } from "./model";
import { permutations2 } from "./permutations";
import { randInt } from "./random";

export const NAIVE = 1;
export const RANDOM = 2;
export const MINMAX = 3;
type PlayerStrategy = typeof NAIVE | typeof RANDOM | typeof MINMAX;

export class GuessGenerator<T extends number> {
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

  acceptFeedback(guess: Combination<T>, feedback: Feedback): void {
    this.candidates = narrowCandidates(this.candidates, guess, feedback);
  }

  strategy(s: PlayerStrategy): void {
    switch (s) {
      case NAIVE:
        this.guessStrat = this.naiveGuess;
        break;
      case MINMAX:
        this.guessStrat = this.minMaxGuess;
        this.allCombinations = permutations2(
          [...this.choices],
          this.permutationLength
        ).map((c) => new Combination(c));
        break;
      case RANDOM:
        this.guessStrat = this.randomGuess;
        break;
    }
  }

  private naiveGuess(): Combination<T> {
    return this.candidates[0];
  }

  private randomGuess(): Combination<T> {
    const i = randInt(0, this.candidates.length - 1);
    return this.candidates[i];
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
}
/**
 * keep only the candidates that match the feedback for this guess
 */

export function narrowCandidates<T extends number>(
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
