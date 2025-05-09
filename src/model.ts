export type Color = 1 | 2 | 3 | 4 | 5 | 6;
export type Frequency<T extends number> = {
  [k in T]: number;
};
export type Feedback = { correct: number; misplaced: number };

export class Combination<T extends number> {
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
