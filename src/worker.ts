import { GuessGenerator } from "./cpu-player.ts";
import { Combination, type Color } from "./model.ts";

let generator: GuessGenerator<Color>;

self.addEventListener("message", (e) => {
  const { type, data } = e.data;
  if (type === "init") {
    generator = new GuessGenerator<Color>(data.choices, data.size);
    generator.strategy(data.strategy);
  } else if (type === "nextGuess") {
    const guess = generator.next();
    self.postMessage({ guess });
  } else if (type === "feedback") {
    // data is serialised as an Object so need to recreate Combination instance
    const guess = new Combination<Color>(data.guess.combination);
    generator.acceptFeedback(guess, data.feedback);
  }
});
