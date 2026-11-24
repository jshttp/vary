import { describe, test } from "vitest";
import { append, format, parse } from "./index.js";

const fields = ["Accept", "Accept-Encoding", "Accept-Language"];
const header = "Accept, Accept-Encoding, Accept-Language";

describe("append", () => {
  const _append = append;

  test.for([
    { name: "field to *", header: "*", field: "Accept-Encoding" },
    { name: "* to field", header: "Accept-Encoding", field: "*" },
    { name: "field to empty", header: "", field: "Accept-Encoding" },
    { name: "fields array to empty", header: "", field: fields },
    { name: "fields string to empty", header: "", field: header },
    { name: "field to fields", header, field: "X-Foo" },
  ])("$name", async ({ name, header, field }, { bench }) => {
    await bench(name, () => {
      _append(header, field);
    }).run();
  });
});

describe("parse", () => {
  const _parse = parse;

  test.for([
    { name: "single field", header: "Accept-Encoding" },
    { name: "multiple fields", header },
    { name: "whitespace and empty members", header: `,\t${header}\t, ` },
  ])("$name", async ({ name, header }, { bench }) => {
    await bench(name, () => {
      _parse(header);
    }).run();
  });
});

describe("format", () => {
  const _format = format;

  test.for([
    { name: "single field", fields: ["Accept-Encoding"] },
    { name: "multiple fields", fields },
    { name: "duplicates", fields: [...fields, "accept", "ACCEPT-ENCODING"] },
    { name: "wildcard", fields: [...fields, "*"] },
  ])("$name", async ({ name, fields }, { bench }) => {
    await bench(name, () => {
      _format(fields);
    }).run();
  });
});
