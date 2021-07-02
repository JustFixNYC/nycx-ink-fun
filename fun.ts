import { assertNotNull } from "@justfixnyc/util/commonjs";
import fs from "fs";
import { Story } from "inkjs/engine/Story";
import { ConsoleIO } from "./console-io";

const rawText = fs
  .readFileSync("nycx.ink.json", { encoding: "utf-8" })
  // Remove any BOM at the beginning.
  .replace(/^\uFEFF/, "");

const storyJson = JSON.parse(rawText);

async function getChoiceIndex(story: Story, io: ConsoleIO): Promise<number> {
  for (let choice of story.currentChoices) {
    console.log(`${choice.index + 1}. ${choice.text}`);
  }
  while (true) {
    const choice = await io.question("> ");
    const index = parseInt(choice);
    if (index > 0 && index <= story.currentChoices.length) {
      return index - 1;
    }
    io.writeLine("Invalid choice!");
  }
}

async function main() {
  const story = new Story(storyJson);
  const io = new ConsoleIO();

  story.onError = (msg, type) => {
    console.error(msg, type);
  };

  while (true) {
    if (story.canContinue) {
      const message = story.Continue();
      io.writeLine(assertNotNull(message));
    } else if (story.currentChoices.length > 0) {
      const choiceIdx = await getChoiceIndex(story, io);
      story.ChooseChoiceIndex(choiceIdx);
    } else {
      break;
    }
  }

  io.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
