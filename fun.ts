import { assertNotNull, assertNotUndefined } from "@justfixnyc/util/commonjs";
import fs from "fs";
import { Story } from "inkjs/engine/Story";
import { ConsoleIO } from "./console-io";
import {
  HousingType,
  HOUSING_TYPES,
  predictHousingType,
  validateHousingType,
} from "./predict-housing-type";

const SPECIAL_INSTRUCTION_PREDICT_HOUSING_TYPE = ">>> PREDICT_HOUSING_TYPE";

const PROMPT = "> ";

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
    const choice = await io.question(PROMPT);
    const index = parseInt(choice);
    if (index > 0 && index <= story.currentChoices.length) {
      return index - 1;
    }
    io.writeLine("Invalid choice!");
  }
}

async function askForAddressAndPredictHousingType(story: Story, io: ConsoleIO) {
  const address = await io.question(PROMPT);
  const choiceEntries = story.currentChoices.map(
    (choice) =>
      [validateHousingType(choice.text), choice.index] as [HousingType, number]
  );
  const choiceMap = new Map<HousingType, number>(choiceEntries);

  for (let type of HOUSING_TYPES) {
    if (!choiceMap.has(type)) {
      throw new Error(`Story doesn't contain a choice for ${type}`);
    }
  }

  const housingType = await predictHousingType(address);

  story.ChooseChoiceIndex(assertNotUndefined(choiceMap.get(housingType)));
}

async function main() {
  const story = new Story(storyJson);
  const io = new ConsoleIO();
  let specialInputMode: "predictHousingType" | null = null;

  story.onError = (msg, type) => {
    console.error(msg, type);
  };

  while (true) {
    if (story.canContinue) {
      const message = assertNotNull(story.Continue());
      if (message.startsWith(SPECIAL_INSTRUCTION_PREDICT_HOUSING_TYPE)) {
        specialInputMode = "predictHousingType";
      } else {
        io.writeLine(message);
      }
    } else if (story.currentChoices.length > 0) {
      if (specialInputMode === "predictHousingType") {
        await askForAddressAndPredictHousingType(story, io);
        specialInputMode = null;
      } else {
        const choiceIdx = await getChoiceIndex(story, io);
        story.ChooseChoiceIndex(choiceIdx);
      }
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
