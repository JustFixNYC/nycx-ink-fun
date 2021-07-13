import http from "http";
import path from "path";
import express from "express";
import { urlencoded } from "body-parser";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";
import { existsSync, mkdirSync } from "fs";
import { FilesystemJsonStorage } from "./storage";
import {
  ConversationState,
  makeConversationState,
  processConversation,
} from "./conversation";
import { loadNycxStory } from "./story";

const PORT = process.env.PORT || "3000";

const MAX_STORY_LOOPS_PER_REQUEST = 10;

const SESSION_DATA_DIR = path.join(__dirname, ".session-data");

if (!existsSync(SESSION_DATA_DIR)) {
  mkdirSync(SESSION_DATA_DIR);
}

const storage = new FilesystemJsonStorage<ConversationState>(SESSION_DATA_DIR);

const app = express();

app.use(urlencoded({ extended: false }));

app.post("/sms", async (req, res) => {
  // https://www.twilio.com/docs/messaging/guides/webhook-request
  const inputMessage = req.body.Body;
  const phoneNumber = req.body.From;

  if (inputMessage && phoneNumber) {
    console.log(`Received message from ${phoneNumber}: ${inputMessage}`);

    const story = await loadNycxStory();
    let hasErrored = false;

    story.onError = (msg, type) => {
      // TODO: Return a 500 HTTP response too.
      console.error(msg, type);
      // TODO: We might be able to just use story.hasError instead.
      hasErrored = true;
    };

    const twiml = new MessagingResponse();

    let state = await storage.get(phoneNumber);

    if (state?.hasEnded) {
      // If the conversation ended but they just texted us again,
      // restart the story.
      console.log(`Restarting story for ${phoneNumber}.`);
      state = null;
    }

    if (!state) {
      // The user's input has initiated the story, ignore the
      // content of their actual input for now.
      state = makeConversationState(story);
    } else {
      state.queuedInput.push(inputMessage);
      if (state.isWaitingForInput) {
        state = await processConversation(state, story);
      }
    }

    let i = 0;

    while (true) {
      for (let message of state.queuedOutput) {
        twiml.message(message);
        state.queuedOutput = [];
      }

      if (i++ >= MAX_STORY_LOOPS_PER_REQUEST) {
        console.error("Maximum story loops exceeded.");
        hasErrored = true;
      }

      if (state.hasEnded || state.isWaitingForInput || hasErrored) {
        break;
      }

      state = await processConversation(state, story);
    }

    await storage.put(phoneNumber, state);

    if (hasErrored) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Alas, a fatal error has occurred.");
    } else {
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(twiml.toString());
    }
  } else {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Body and From parameters required!");
  }
});

http.createServer(app).listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}.`);
});
