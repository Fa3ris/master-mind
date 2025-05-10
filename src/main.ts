import {
  GuessGenerator,
  MINMAX,
  NAIVE,
  RANDOM,
  type PlayerStrategy,
} from "./cpu-player.ts";
import { Combination, type Color } from "./model.ts";
import { permutations2 } from "./permutations.ts";
import { randInt } from "./random.ts";
import "./style.css";

const triggerId = "start";
const playSectionId = "play";
const configTriesId = "maxTries";
const configStratId = "strategy";
const naive = "naive";
const random = "random";
const minimax = "minimax";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Mastermind</h1>

    <main>
      <button id="${triggerId}" type="button">start</button>
      <div id="${playSectionId}"></div>
    </main>

    <aside id="config">
      <div>
        <label>tries</label>
        <input id="${configTriesId}" value="5" type="number" min="1" max="10"/>
      </div>
      <div>
        <label>strategy</label> 
        <select name="strategy" id="${configStratId}">
          <option value="">--Please choose an option--</option>
          <option value="${naive}">Naive</option>
          <option value="${random}">Random</option>
          <option value="${minimax}">Minimax</option>
        </select>
      </div>
    </aside>
  </div>
`;

class CombinationGenerator<T extends number> {
  private candidates: Combination<T>[];

  constructor(choices: T[], permutationLength: number) {
    this.candidates = permutations2(choices, permutationLength).map(
      (combination) => new Combination(combination)
    );
  }

  next(): Combination<T> {
    const i = randInt(0, this.candidates.length - 1);
    return this.candidates[i];
  }
}

const choices: Color[] = [1, 2, 3, 4, 5, 6];
const size = 4;
const combinationGenerator = new CombinationGenerator(choices, size);

document
  .querySelector<HTMLButtonElement>(`#${triggerId}`)!
  .addEventListener("click", function startPlay() {
    const section = document.querySelector(`#${playSectionId}`)!;

    section.innerHTML = "";

    const secret = combinationGenerator.next();

    const generator = new GuessGenerator<Color>(choices, size);

    const stratLabel =
      document.querySelector<HTMLSelectElement>(`#${configStratId}`)?.value ||
      naive;

    let playerStrategy: PlayerStrategy;
    switch (stratLabel) {
      case random:
        playerStrategy = RANDOM;
        break;
      case minimax:
        playerStrategy = MINMAX;
        break;
      default:
        playerStrategy = NAIVE;
    }
    generator.strategy(playerStrategy);

    const maxTries: number = Number(
      document.querySelector<HTMLInputElement>(`#${configTriesId}`)?.value ?? 5
    );

    let tries = maxTries;

    function play() {
      tries--;
      const guess = generator.next();

      const feedback = secret.compare(guess);
      const div = document.createElement("div");
      div.innerHTML = `guess ${maxTries - tries} ${guess} correct:${
        feedback.correct
      } misplaced:${feedback.misplaced}`;
      section.append(div);

      if (feedback.correct === size) {
        winState();
        return;
      }

      if (tries <= 0) {
        loseState();
        return;
      }

      generator.acceptFeedback(guess, feedback);
      setTimeout(play);
    }

    function winState() {
      const div = document.createElement("div");
      div.innerHTML = `WIN ✅ 🙌 secret was ${secret}`;
      section.append(div);
    }

    function loseState() {
      const div = document.createElement("div");
      div.innerHTML = `LOSE ❌ !! secret was ${secret}`;
      section.append(div);
    }

    play();
  });
