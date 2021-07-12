import fs from "fs";
import { Story } from "inkjs/engine/Story";
import { ConsoleIO } from "./console-io";
import { makeConversationState, processConversation } from "./conversation";

const PROMPT = "> ";

const rawText = fs
  .readFileSync("nycx.ink.json", { encoding: "utf-8" })
  // Remove any BOM at the beginning.
  .replace(/^\uFEFF/, "");

const storyJson = JSON.parse(rawText);

async function main() {
  const story = new Story(storyJson);
  const io = new ConsoleIO();

  story.onError = (msg, type) => {
    console.error(msg, type);
  };

  let convState = makeConversationState(story);

  while (!convState.hasEnded) {
    for (let message of convState.queuedOutput) {
      io.writeLine(message);
      convState.queuedOutput = [];
    }

    if (convState.isWaitingForInput) {
      convState.queuedInput.push(await io.question(PROMPT));
    }

    convState = await processConversation(convState, story);
  }

  io.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
