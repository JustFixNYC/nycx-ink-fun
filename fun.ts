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

const INVALID_CHOICE_MSG = "Invalid choice!";

const SPECIAL_INSTRUCTION_PREDICT_HOUSING_TYPE = ">>> PREDICT_HOUSING_TYPE";

const PROMPT = "> ";

const rawText = fs
  .readFileSync("nycx.ink.json", { encoding: "utf-8" })
  // Remove any BOM at the beginning.
  .replace(/^\uFEFF/, "");

const storyJson = JSON.parse(rawText);

async function choosePredictedHousingType(story: Story, input: string) {
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

  const housingType = await predictHousingType(input);
  const choiceIdx = assertNotUndefined(choiceMap.get(housingType));

  story.ChooseChoiceIndex(choiceIdx);
}

type SpecialInputMode = "predictHousingType";

type ConversationState = {
  storyState: any;
  queuedInput: string[];
  queuedOutput: string[];
  specialInputMode: SpecialInputMode | null;
  isWaitingForInput: boolean;
  hasEnded: boolean;
};

function parseStoryChoice(story: Story, input: string): number | undefined {
  const choiceInt = parseInt(input);
  if (choiceInt > 0 && choiceInt <= story.currentChoices.length) {
    return choiceInt - 1;
  }
}

function getStoryChoicesMenu(story: Story): string {
  return story.currentChoices
    .map((choice) => `${choice.index + 1}. ${choice.text}`)
    .join("\n");
}

async function processConversation(
  cs: ConversationState
): Promise<ConversationState> {
  const story = new Story(storyJson);
  let { specialInputMode, queuedInput, queuedOutput } = cs;
  let didStoryContinue = false;
  let output = (message: string) => {
    queuedOutput = [...queuedOutput, message];
  };
  let consumeInput = () => {
    let input = null;
    if (queuedInput.length > 0) {
      input = queuedInput[0];
      queuedInput = queuedInput.slice(1);
    }
    return input;
  };
  story.state.LoadJson(JSON.stringify(cs.storyState));

  if (story.canContinue) {
    didStoryContinue = true;
    const message = assertNotNull(story.Continue());
    if (message.startsWith(SPECIAL_INSTRUCTION_PREDICT_HOUSING_TYPE)) {
      specialInputMode = "predictHousingType";
    } else {
      output(message);
    }
  }

  if (story.currentChoices.length > 0) {
    if (specialInputMode === "predictHousingType") {
      const input = consumeInput();
      if (input) {
        await choosePredictedHousingType(story, input);
        specialInputMode = null;
      }
    } else {
      if (didStoryContinue) {
        output(getStoryChoicesMenu(story));
      }

      const input = consumeInput();
      if (input) {
        const choiceIdx = parseStoryChoice(story, input);
        if (choiceIdx !== undefined) {
          story.ChooseChoiceIndex(choiceIdx);
        } else {
          output(INVALID_CHOICE_MSG);
        }
      }
    }
  }

  return {
    ...makeConversationState(story),
    queuedInput,
    queuedOutput,
    specialInputMode,
  };
}

function makeConversationState(story: Story): ConversationState {
  return {
    storyState: JSON.parse(story.state.ToJson()),
    queuedInput: [],
    queuedOutput: [],
    specialInputMode: null,
    isWaitingForInput: story.currentChoices.length > 0,
    hasEnded: !story.canContinue && story.currentChoices.length === 0,
  };
}

async function main() {
  const story = new Story(storyJson);
  const io = new ConsoleIO();
  let convState = makeConversationState(story);

  story.onError = (msg, type) => {
    console.error(msg, type);
  };

  while (!convState.hasEnded) {
    for (let message of convState.queuedOutput) {
      io.writeLine(message);
      convState.queuedOutput = [];
    }

    if (convState.isWaitingForInput) {
      convState.queuedInput.push(await io.question(PROMPT));
    }

    convState = await processConversation(convState);
  }

  io.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
