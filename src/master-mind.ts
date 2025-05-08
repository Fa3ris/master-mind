export const RED = "red";
export const BLUE = "blue";
export const YELLOW = "yellow";
export type Color = typeof RED | typeof BLUE | typeof YELLOW;

export class MasterMind {
  private combination: Combination;
  constructor(combination: Combination) {
    this.combination = combination;
  }

  check(guess: Combination) {
    return this.combination.compare(guess);
  }
}

export class Combination {
  private colors: Color[];
  constructor(colors: Color[]) {
    this.colors = colors;
  }

  compare(other: Combination) {
    const matchedIds = this.colors
      .map((color, index) => (color === other.colors[index] ? index : -1))
      .filter((index) => index !== -1);

    const secretFrequencies = this.frequencies(matchedIds);
    const misplaced = Object.entries(
      other.frequencies(matchedIds)
    ).reduce<number>((acc, [color, count]) => {
      const secretFrequency = secretFrequencies[color as Color] ?? 0;
      const misplacedForColor = Math.min(count, secretFrequency);
      return acc + misplacedForColor;
    }, 0);

    return { correct: matchedIds.length, misplaced };
  }

  private frequencies(idsToIgnore: number[]): Partial<Record<Color, number>> {
    const colors = this.colors.filter(
      (_, index) => !idsToIgnore.includes(index)
    );
    return colors.reduce<Partial<Record<Color, number>>>((record, color) => {
      record[color] = (record[color] ?? 0) + 1;
      return record;
    }, {});
  }
}
