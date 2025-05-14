the game of master mind

The secret = ordered sequence of 4 pins. Each pin is chosen among 6 colors.

The computer plays against itself:

- it randomly chooses a secret among all possible permutations of 4^6
- then it proposes guesses based on the previous feedbacks
    - 1 correct = a pin color is correct and correctly placed
    - 1 misplaced = a pin color is correct but not in the right position

Strategy reference
https://www.cs.uni.edu/~wallingf/teaching/cs3530/resources/knuth-mastermind.pdf

The first guess is always the same, apparently it's always the best choice

The strategies are
  - naive: take the first valid candidate as the guess
  - random: take a random valid candidate as the guess
  - minimax: wins in 5 guesses or less. Is significantly slower
