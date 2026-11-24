import { once } from "node:events";
import { createServer, type RequestListener } from "node:http";
import { describe, expect, it } from "vitest";
import { append, vary } from "./index.js";

describe("vary(res, field)", () => {
  describe("arguments", () => {
    describe("res", () => {
      it("should be required", () => {
        expect(() => {
          // @ts-expect-error testing omitted arguments at runtime
          vary();
        }).toThrow(/res.*required/);
      });

      it("should not allow non-res-like objects", () => {
        expect(() => {
          // @ts-expect-error testing an invalid response at runtime
          vary({}, "Accept");
        }).toThrow(/res.*required/);
      });
    });

    describe("field", () => {
      it("should be required", async () => {
        // @ts-expect-error testing an omitted field at runtime
        await expectResponse(callVary(), 500, /field.*required/);
      });

      it("should accept string", async () => {
        await expectResponse(callVary("foo"), 200);
      });

      it("should accept array of string", async () => {
        await expectResponse(callVary(["foo", "bar"]), 200);
      });

      it("should accept string that is Vary header", async () => {
        await expectResponse(callVary("foo, bar"), 200);
      });

      it('should not allow separator ":"', async () => {
        await expectResponse(
          callVary("invalid:header"),
          500,
          /field.*contains.*invalid/,
        );
      });

      it('should not allow separator " "', async () => {
        await expectResponse(
          callVary("invalid header"),
          500,
          /field.*contains.*invalid/,
        );
      });
    });
  });

  describe("when no Vary", () => {
    it("should set value", async () => {
      await expectResponse(callVary("Origin"), 200, "Origin");
    });

    it("should set value with multiple calls", async () => {
      await expectResponse(
        callVary(["Origin", "User-Agent"]),
        200,
        "Origin, User-Agent",
      );
    });

    it("should preserve case", async () => {
      await expectResponse(
        callVary(["ORIGIN", "user-agent", "AccepT"]),
        200,
        "ORIGIN, user-agent, AccepT",
      );
    });

    it("should not set Vary on empty array", async () => {
      await expectResponse(callVary([]), 200, null);
    });
  });

  describe("when existing Vary", () => {
    it("should set value", async () => {
      await expectResponse(
        alterVary("Accept", "Origin"),
        200,
        "Accept, Origin",
      );
    });

    it("should set value with multiple calls", async () => {
      await expectResponse(
        (_req, res) => {
          res.setHeader("Vary", "Accept");
          vary(res, "Origin");
          vary(res, "User-Agent");
        },
        200,
        "Accept, Origin, User-Agent",
      );
    });

    it("should not duplicate existing value", async () => {
      await expectResponse(alterVary("Accept", "Accept"), 200, "Accept");
    });

    it("should compare case-insensitive", async () => {
      await expectResponse(alterVary("Accept", "accEPT"), 200, "Accept");
    });

    it("should preserve case", async () => {
      await expectResponse(
        alterVary("AccepT", ["accEPT", "ORIGIN"]),
        200,
        "AccepT, ORIGIN",
      );
    });
  });

  describe("when existing Vary as array", () => {
    it("should set value", async () => {
      await expectResponse(
        alterVary(["Accept", "Accept-Encoding"], "Origin"),
        200,
        "Accept, Accept-Encoding, Origin",
      );
    });

    it("should not duplicate existing value", async () => {
      await expectResponse(
        alterVary(["Accept", "Accept-Encoding"], ["accept", "origin"]),
        200,
        "Accept, Accept-Encoding, origin",
      );
    });
  });

  describe("when Vary: *", () => {
    it("should set value", async () => {
      await expectResponse(callVary("*"), 200, "*");
    });

    it("should act as if all values already set", async () => {
      await expectResponse(alterVary("*", ["Origin", "User-Agent"]), 200, "*");
    });

    it("should remove existing values", async () => {
      await expectResponse(alterVary("Accept, Accept-Encoding", "*"), 200, "*");
    });

    it("should update bad existing header", async () => {
      await expectResponse(
        alterVary("Accept, Accept-Encoding, *", "Origin"),
        200,
        "*",
      );
    });
  });

  describe("when field is string", () => {
    it("should set value", async () => {
      await expectResponse(callVary("Accept"), 200, "Accept");
    });

    it("should set value when vary header", async () => {
      await expectResponse(
        callVary("Accept, Accept-Encoding"),
        200,
        "Accept, Accept-Encoding",
      );
    });

    it("should accept LWS", async () => {
      await expectResponse(
        callVary("  Accept     ,     Origin    "),
        200,
        "Accept, Origin",
      );
    });

    it("should handle contained *", async () => {
      await expectResponse(callVary("Accept,*"), 200, "*");
    });
  });

  describe("when optional whitespace includes tabs", () => {
    it.each([
      ["", "\t Accept\t, \tOrigin \t", "Accept, Origin"],
      ["\tAccept\t,\tOrigin\t", ["accept", "origin"], "\tAccept\t,\tOrigin\t"],
      ["Accept,\t*\t", "Origin", "*"],
      ["Accept", "\t*\t", "*"],
    ])("should append to %j with field %j", (header, field, expected) => {
      expect(append(header, field)).toBe(expected);
    });

    it("should reject tabs inside supplied field names", () => {
      expect(() => append("", "Accept\tEncoding")).toThrow(
        /field.*contains.*invalid/,
      );
    });
  });

  describe("when field is array", () => {
    it("should set value", async () => {
      await expectResponse(
        callVary(["Accept", "Accept-Language"]),
        200,
        "Accept, Accept-Language",
      );
    });

    it("should ignore double-entries", async () => {
      await expectResponse(callVary(["Accept", "Accept"]), 200, "Accept");
    });

    it("should be case-insensitive", async () => {
      await expectResponse(callVary(["Accept", "ACCEPT"]), 200, "Accept");
    });

    it("should handle contained *", async () => {
      await expectResponse(
        callVary(["Origin", "User-Agent", "*", "Accept"]),
        200,
        "*",
      );
    });

    it("should handle existing values", async () => {
      await expectResponse(
        alterVary("Accept, Accept-Encoding", [
          "origin",
          "accept",
          "accept-charset",
        ]),
        200,
        "Accept, Accept-Encoding, origin, accept-charset",
      );
    });
  });
});

describe("append(header, field)", () => {
  describe("arguments", () => {
    describe("header", () => {
      it("should be required", () => {
        expect(() => {
          // @ts-expect-error testing an invalid call at runtime
          append();
        }).toThrow(/header.*required/);
      });

      it("should be a string", () => {
        expect(() => {
          // @ts-expect-error testing an invalid call at runtime
          append(42);
        }).toThrow(/header.*required/);
      });
    });

    describe("field", () => {
      it("should be required", () => {
        expect(() => {
          // @ts-expect-error testing an invalid call at runtime
          append("");
        }).toThrow(/field.*required/);
      });

      it("should accept string", () => {
        expect(() => append("", "foo")).not.toThrow();
      });

      it("should accept string that is Vary header", () => {
        expect(() => append("", "foo, bar")).not.toThrow();
      });

      it("should accept array of string", () => {
        expect(() => append("", ["foo", "bar"])).not.toThrow();
      });

      it('should not allow separator ":"', () => {
        expect(() => append("", "invalid:header")).toThrow(
          /field.*contains.*invalid/,
        );
      });

      it('should not allow separator " "', () => {
        expect(() => append("", "invalid header")).toThrow(
          /field.*contains.*invalid/,
        );
      });

      it("should not allow non-token characters", () => {
        expect(() => append("", "invalid\nheader")).toThrow(
          /field.*contains.*invalid/,
        );
        expect(() => append("", "invalid\u0080header")).toThrow(
          /field.*contains.*invalid/,
        );
      });
    });
  });

  describe("when header empty", () => {
    it("should set value", () => {
      expect(append("", "Origin")).toBe("Origin");
    });

    it("should set value with array", () => {
      expect(append("", ["Origin", "User-Agent"])).toBe("Origin, User-Agent");
    });

    it("should preserve case", () => {
      expect(append("", ["ORIGIN", "user-agent", "AccepT"])).toBe(
        "ORIGIN, user-agent, AccepT",
      );
    });
  });

  describe("when header has values", () => {
    it("should set value", () => {
      expect(append("Accept", "Origin")).toBe("Accept, Origin");
    });

    it("should set value with array", () => {
      expect(append("Accept", ["Origin", "User-Agent"])).toBe(
        "Accept, Origin, User-Agent",
      );
    });

    it("should not duplicate existing value", () => {
      expect(append("Accept", "Accept")).toBe("Accept");
    });

    it("should compare case-insensitive", () => {
      expect(append("Accept", "accEPT")).toBe("Accept");
    });

    it("should preserve case", () => {
      expect(append("Accept", "AccepT")).toBe("Accept");
    });
  });

  describe("when *", () => {
    it("should set value", () => {
      expect(append("", "*")).toBe("*");
    });

    it("should act as if all values already set", () => {
      expect(append("*", "Origin")).toBe("*");
    });

    it("should remove existing values", () => {
      expect(append("Accept, Accept-Encoding", "*")).toBe("*");
    });

    it("should update bad existing header", () => {
      expect(append("Accept, Accept-Encoding, *", "Origin")).toBe("*");
    });
  });

  describe("when field is string", () => {
    it("should set value", () => {
      expect(append("", "Accept")).toBe("Accept");
    });

    it("should set value when vary header", () => {
      expect(append("", "Accept, Accept-Encoding")).toBe(
        "Accept, Accept-Encoding",
      );
    });

    it("should accept LWS", () => {
      expect(append("", "  Accept     ,     Origin    ")).toBe(
        "Accept, Origin",
      );
    });

    it("should handle contained *", () => {
      expect(append("", "Accept,*")).toBe("*");
    });
  });

  describe("when field is array", () => {
    it("should set value", () => {
      expect(append("", ["Accept", "Accept-Language"])).toBe(
        "Accept, Accept-Language",
      );
    });

    it("should ignore double-entries", () => {
      expect(append("", ["Accept", "Accept"])).toBe("Accept");
    });

    it("should be case-insensitive", () => {
      expect(append("", ["Accept", "ACCEPT"])).toBe("Accept");
    });

    it("should handle contained *", () => {
      expect(append("", ["Origin", "User-Agent", "*", "Accept"])).toBe("*");
    });

    it("should handle existing values", () => {
      expect(
        append("Accept, Accept-Encoding", [
          "origin",
          "accept",
          "accept-charset",
        ]),
      ).toBe("Accept, Accept-Encoding, origin, accept-charset");
    });
  });
});

function alterVary(
  header: string | string[],
  field: string | string[],
): RequestListener {
  return (_req, res) => {
    res.setHeader("Vary", header);
    vary(res, field);
  };
}

function callVary(field: string | string[]): RequestListener {
  return (_req, res) => {
    vary(res, field);
  };
}

async function expectResponse(
  handler: RequestListener,
  status: number,
  expected?: string | null | RegExp,
): Promise<void> {
  const server = createServer((req, res) => {
    try {
      handler(req, res);
      res.statusCode = 200;
      res.end();
    } catch (error) {
      res.statusCode = 500;
      res.end(error instanceof Error ? error.message : String(error));
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  await using listeningServer = server;
  const address = listeningServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected a TCP server");
  }

  const response = await fetch(`http://127.0.0.1:${address.port}`);
  const body = await response.text();
  expect(response.status).toBe(status);

  if (expected instanceof RegExp) {
    expect(body).toMatch(expected);
  } else if (expected !== undefined) {
    expect(response.headers.get("vary")).toBe(expected);
  }
}
