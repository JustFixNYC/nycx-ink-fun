import dotenv from "dotenv";
import twilio from "twilio";
import http from "http";
import express from "express";
import { urlencoded } from "body-parser";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";

dotenv.config();

const PORT = process.env.PORT || "3000";
const TWILIO_ACCOUNT_SID = getRequiredEnvVar("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = getRequiredEnvVar("TWILIO_AUTH_TOKEN");

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const app = express();

app.use(urlencoded({ extended: false }));

app.post("/sms", (req, res) => {
  const body = req.body.Body;

  if (body) {
    const twiml = new MessagingResponse();

    // TODO: Actually start/continue conversation.
    twiml.message("BOOP");

    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  } else {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Body parameter required!");
  }
});

http.createServer(app).listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}.`);
});

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.log(`Please define ${name} in your environment (or .env file).`);
    process.exit(1);
  }
  return value;
}
