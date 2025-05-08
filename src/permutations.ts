export function permutations(
  choices: number[],
  permutationLength: number
): number[][] {
  const permutations: number[][] = [];
  const numericBase = choices.length;
  const totalPermutations = numericBase ** permutationLength;

  for (let i = 0; i < totalPermutations; i++) {
    const permutation: number[] = [];
    let decimalValue = i;
    // Build the permutation by expressing decimalValue in numberBase
    for (let j = 0; j < permutationLength; j++) {
      const digit = decimalValue % numericBase;
      permutation.unshift(choices[digit]);
      decimalValue = Math.floor(decimalValue / numericBase);
    }
    permutations.push(permutation);
  }
  return permutations;
}

export function permutations2(
  choices: number[],
  permutationLength: number
): number[][] {
  const permutations: number[][] = [];

  function helper(current: number[]) {
    if (current.length === permutationLength) {
      permutations.push([...current]);
      return;
    }
    for (const choice of choices) {
      current.push(choice);
      helper(current);
      current.pop(); // backtracking
    }
  }

  helper([]);
  return permutations;
}

export function permutations3(
  choices: number[],
  permutationLength: number
): number[][] {
  if (permutationLength <= 1) return choices.map((choice) => [choice]);

  return permutations3(choices, permutationLength - 1).flatMap(
    (permutationNMinus1) =>
      choices.map((choice) => [choice, ...permutationNMinus1])
  );
}
