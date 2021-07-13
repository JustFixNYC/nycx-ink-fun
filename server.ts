import http from "http";
import path from "path";
import express from "express";
import { urlencoded } from "body-parser";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";
import { existsSync, mkdirSync } from "fs";

const PORT = process.env.PORT || "3000";

const SESSION_DATA_DIR = path.join(__dirname, ".session-data");

if (!existsSync(SESSION_DATA_DIR)) {
  mkdirSync(SESSION_DATA_DIR);
}

const app = express();

app.use(urlencoded({ extended: false }));

app.post("/sms", (req, res) => {
  // https://www.twilio.com/docs/messaging/guides/webhook-request
  const body = req.body.Body;
  const from = req.body.From;

  if (body && from) {
    const twiml = new MessagingResponse();

    // TODO: Actually start/continue conversation.
    twiml.message("BOOP");

    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  } else {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Body and From parameters required!");
  }
});

http.createServer(app).listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}.`);
});
