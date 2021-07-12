import { Story } from "inkjs/engine/Story";
import { assertNotNull, assertNotUndefined } from "@justfixnyc/util/commonjs";
import {
  HousingType,
  HOUSING_TYPES,
  predictHousingType,
  validateHousingType,
} from "./predict-housing-type";

const INVALID_CHOICE_MSG = "Invalid choice!";

const SPECIAL_INSTRUCTION_PREDICT_HOUSING_TYPE = ">>> PREDICT_HOUSING_TYPE";

async function getPredictedHousingTypeChoiceIdx(
  story: Story,
  input: string
): Promise<number> {
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
  return assertNotUndefined(choiceMap.get(housingType));
}

export type SpecialInputMode = "predictHousingType";

export type ConversationState = {
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

export async function processConversation(
  cs: ConversationState,
  story: Story
): Promise<ConversationState> {
  let { specialInputMode, queuedInput, queuedOutput } = cs;
  let didStoryContinue = false;
  let didChoose = false;
  const output = (message: string) => {
    queuedOutput = [...queuedOutput, message];
  };
  const consumeInput = () => {
    let input = null;
    if (queuedInput.length > 0) {
      input = queuedInput[0];
      queuedInput = queuedInput.slice(1);
    }
    return input;
  };
  const choose = (idx: number) => {
    story.ChooseChoiceIndex(idx);
    didChoose = true;
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
        choose(await getPredictedHousingTypeChoiceIdx(story, input));
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
          choose(choiceIdx);
        } else {
          output(INVALID_CHOICE_MSG);
        }
      }
    }
  }

  if (didChoose) {
    // Ink always prints the choice the user made, which we don't want to do.
    story.Continue();
  }

  return {
    ...makeConversationState(story),
    queuedInput,
    queuedOutput,
    specialInputMode,
  };
}

export function makeConversationState(story: Story): ConversationState {
  return {
    storyState: JSON.parse(story.state.ToJson()),
    queuedInput: [],
    queuedOutput: [],
    specialInputMode: null,
    isWaitingForInput: story.currentChoices.length > 0,
    hasEnded: !story.canContinue && story.currentChoices.length === 0,
  };
}
