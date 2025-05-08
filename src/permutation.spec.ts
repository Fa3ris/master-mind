import { expect, test } from "vitest";
import { permutations, permutations2, permutations3 } from "./permutations";

test.each([permutations, permutations2, permutations3])(
  "permutations %o",
  (permutationFn) => {
    const actual = permutationFn([1, 2, 3], 2);

    const expected = [
      [1, 2],
      [1, 1],
      [1, 3],
      [2, 1],
      [2, 3],
      [2, 2],
      [3, 1],
      [3, 2],
      [3, 3],
    ];

    expect(actual).toHaveLength(expected.length);
    expect(actual).toStrictEqual(expect.arrayContaining(expected));
  }
);

test.each([permutations, permutations2, permutations3])(
  "%o should generate 1296 permutations for 6 choices and length of 4",
  (permutationFn) => {
    const actual = permutationFn([1, 2, 3, 4, 5, 6], 4);
    expect(actual).toHaveLength(1296);
  }
);
