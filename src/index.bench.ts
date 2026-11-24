import { describe, test } from "vitest";
import { append } from "./index.js";

const appendField = append;
const fields = ["Accept", "Accept-Encoding", "Accept-Language"];
const header = "Accept, Accept-Encoding, Accept-Language";

describe("append", () => {
  test.for([
    { name: "field to *", header: "*", field: "Accept-Encoding" },
    { name: "* to field", header: "Accept-Encoding", field: "*" },
    { name: "field to empty", header: "", field: "Accept-Encoding" },
    { name: "fields array to empty", header: "", field: fields },
    { name: "fields string to empty", header: "", field: header },
    { name: "field to fields", header, field: "X-Foo" },
  ])("$name", async ({ name, header, field }, { bench }) => {
    await bench(name, () => {
      appendField(header, field);
    }).run();
  });
});
