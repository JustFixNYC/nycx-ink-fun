import fs from "fs";
import * as assert from "assert";

type TextItAction =
  | {
      type: "send_msg";
      attachments: unknown[];
      quick_replies: unknown[];
      text: string;
      uuid: string;
    }
  | {
      type: "enter_flow";
      uuid: string;
      flow: {
        uuid: string;
        name: string;
      };
    };

type TextItExit = {
  uuid: string;
  destination_uuid: string;
};

type TextItCategory = {
  uuid: string;
  name: string;
  exit_uuid: string;
};

type TextItRouter = {
  type: "switch";
  default_category_uuid: string;
  cases: unknown[];
  categories: TextItCategory[];
  operand: string;
  wait?: {
    type: "msg";
  };
  result_name?: string;
};

type TextItNode = {
  uuid: string;
  actions: TextItAction[];
  exits: TextItExit[];
  router?: TextItRouter;
};

type TextItFlow = {
  name: string;
  uuid: string;
  spec_version: string;
  language: string;
  type: string;
  nodes: TextItNode[];
};

type TextitExport = {
  version: string;
  site: string;
  flows: TextItFlow[];
};

const EXPORTED_JSON: TextitExport = JSON.parse(
  fs.readFileSync(`${__dirname}/justfixnyc.json`, {
    encoding: "utf-8",
  })
);

function validateActionAssumptions(a: TextItAction) {
  switch (a.type) {
    case "enter_flow":
      return;

    case "send_msg":
      assert.strictEqual(typeof a.text, "string");
      return;
  }
  throw new Error(`Unknown action type: ${(a as any).type}`);
}

function validateExportAssumptions(t: TextitExport) {
  for (let flow of t.flows) {
    console.log("Validating flow:", flow.name);
    assert.strictEqual(flow.type, "messaging");
    for (let node of flow.nodes) {
      console.log("Validating node", node.uuid);
      for (let action of node.actions) {
        validateActionAssumptions(action);
      }
      const { router } = node;
      if (router) {
        assert.strictEqual(router.type, "switch");
        if (router.wait) {
          assert.strictEqual(router.wait.type, "msg");
        }
      }
    }
  }
  console.log("All exported flows seem to match our assumptions.");
}

validateExportAssumptions(EXPORTED_JSON);