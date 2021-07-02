import fs from "fs";
import { Story } from "inkjs";

const rawText = fs
  .readFileSync("nycx.ink.json", { encoding: "utf-8" })
  .replace(/^\uFEFF/, "");

const storyJson = JSON.parse(rawText);

const story = new Story(storyJson);

console.log(story.ContinueMaximally());
