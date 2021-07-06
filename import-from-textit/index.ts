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
  destination_uuid?: string | null;
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
    assert.strictEqual(flow.type, "messaging");
    for (let node of flow.nodes) {
      try {
        for (let action of node.actions) {
          validateActionAssumptions(action);
        }
        const { router } = node;
        if (router) {
          assert.strictEqual(router.type, "switch");
          if (router.wait) {
            assert.strictEqual(router.wait.type, "msg");
          }
        } else {
          assert.strictEqual(node.exits.length, 1);
        }
        for (let exit of node.exits) {
          if (
            exit.destination_uuid !== null &&
            exit.destination_uuid !== undefined
          ) {
            assert.strictEqual(typeof exit.destination_uuid, "string");
          }
        }
      } catch (e) {
        console.log(
          `Error validating node ${node.uuid} in flow "${flow.name}".`
        );
        throw e;
      }
    }
  }
}

function escapeInkText(text: string): string {
  return text.replace(/\/\//g, "\\/\\/");
}

const END = "END";

class InkExporter {
  private lines: string[] = [];
  private uuidKnotNames = new Map<string, string>();

  constructor(readonly flow: TextItFlow) {
    this.generateKnotNames();
    this.emit(`// Export of TextIt flow "${flow.name}" (${flow.uuid})\n`);

    if (flow.nodes.length === 0) return;

    const firstNode = flow.nodes[0];
    this.emit(`-> ${this.knotFor(firstNode.uuid)}\n`);

    for (let node of flow.nodes) {
      this.emitNode(node);
    }
  }

  get(): string {
    return this.lines.join("\n");
  }

  private generateKnotNames() {
    for (let node of this.flow.nodes) {
      this.uuidKnotNames.set(node.uuid, node.uuid.replace(/-/g, "_"));
    }
  }

  private knotFor(uuid: string): string {
    const knot = this.uuidKnotNames.get(uuid);
    if (!knot) {
      throw new Error(`Unknown UUID: ${uuid}`);
    }
    return knot;
  }

  private emitDivertToExit(exit: TextItExit, indent: string = "") {
    const target = exit.destination_uuid
      ? this.knotFor(exit.destination_uuid)
      : END;
    this.emit(`${indent}-> ${target}`);
  }

  private emit(text: string = "") {
    this.lines.push(text);
  }

  private emitNode(node: TextItNode) {
    this.emit(`== ${this.knotFor(node.uuid)} ==\n`);

    for (let action of node.actions) {
      if (action.type === "send_msg") {
        this.emit(escapeInkText(action.text) + "\n");
      } else if (action.type === "enter_flow") {
        this.emit(`TODO: Implement this!`);
        this.emit(`ENTER FLOW "${action.flow.name}"\n`);
      }
    }

    const { router } = node;

    if (router) {
      if (router.result_name) {
        this.emit(`// TextIt result name: ${router.result_name}\n`);
      }
      for (let cat of router.categories) {
        this.emit(`* ${cat.name}`);
        for (let exit of node.exits) {
          if (exit.uuid === cat.exit_uuid) {
            this.emitDivertToExit(exit, "  ");
          }
        }
      }
    } else {
      assert.strictEqual(node.exits.length, 1);
      this.emitDivertToExit(node.exits[0]);
    }
    this.emit();
  }
}

validateExportAssumptions(EXPORTED_JSON);

for (let flow of EXPORTED_JSON.flows) {
  console.log(new InkExporter(flow).get());
}
