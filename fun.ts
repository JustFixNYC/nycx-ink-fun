import { ConsoleIO } from "./console-io";
import { makeConversationState, processConversation } from "./conversation";
import { loadNycxStory } from "./story";

const PROMPT = "> ";

async function main() {
  const story = await loadNycxStory();
  const io = new ConsoleIO();

  story.onError = (msg, type) => {
    console.error(msg, type);
  };

  let convState = makeConversationState(story);

  while (true) {
    for (let message of convState.queuedOutput) {
      io.writeLine(message);
      convState.queuedOutput = [];
    }

    if (convState.isWaitingForInput) {
      convState.queuedInput.push(await io.question(PROMPT));
    } else if (convState.hasEnded) {
      break;
    }

    convState = await processConversation(convState, story);
  }

  io.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
