import { readFileSync } from "fs";
import { Story } from "inkjs/engine/Story";
import path from "path";

const STORY_FILE = path.join(__dirname, "nycx.ink.json");

export async function loadNycxStory(): Promise<Story> {
  const rawText = readFileSync(STORY_FILE, { encoding: "utf-8" })
    // Remove any BOM at the beginning.
    .replace(/^\uFEFF/, "");

  const storyJson = JSON.parse(rawText);

  return new Story(storyJson);
}
