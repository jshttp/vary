import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { describe, expect, expectTypeOf, it } from "vitest";
import { append, format, parse, vary, type Response } from "./index.js";

describe("vary(res, field)", () => {
  it("should accept Node's ServerResponse as a Response", () => {
    expectTypeOf<ServerResponse>().toExtend<Response>();
  });

  it("should require a response with header methods", () => {
    expect(() => {
      // @ts-expect-error testing omitted arguments at runtime
      vary();
    }).toThrow(TypeError);

    expect(() => {
      // @ts-expect-error testing an invalid response at runtime
      vary({}, "Accept");
    }).toThrow(TypeError);
  });

  it.each([
    ["Origin", "Origin"],
    [["Origin", "User-Agent"], "Origin, User-Agent"],
    [["ORIGIN", "user-agent", "AccepT"], "ORIGIN, user-agent, AccepT"],
    [[], undefined],
    ["Accept, Accept-Encoding", "Accept, Accept-Encoding"],
    ["  Accept     ,     Origin    ", "Accept, Origin"],
    [["Accept", "Accept-Language"], "Accept, Accept-Language"],
    [["Accept", "Accept"], "Accept"],
    [["Accept", "ACCEPT"], "Accept"],
    ["*", "*"],
    ["Accept,*", "*"],
    [["Origin", "User-Agent", "*", "Accept"], "*"],
  ])("should set Vary from %j to %j", (field, expected) => {
    const res = new ServerResponse(new IncomingMessage(new Socket()));

    vary(res, field);

    expect(res.getHeader("Vary")).toBe(expected);
  });

  it.each([
    ["Accept", "Origin", "Accept, Origin"],
    ["Accept", "Accept", "Accept"],
    ["Accept", "accEPT", "Accept"],
    ["AccepT", ["accEPT", "ORIGIN"], "AccepT, ORIGIN"],
    [
      ["Accept", "Accept-Encoding"],
      "Origin",
      "Accept, Accept-Encoding, Origin",
    ],
    [
      ["Accept", "Accept-Encoding"],
      ["accept", "origin"],
      "Accept, Accept-Encoding, origin",
    ],
    [0, "Origin", "0, Origin"],
    ["*", ["Origin", "User-Agent"], "*"],
    ["Accept, Accept-Encoding", "*", "*"],
    ["Accept, Accept-Encoding, *", "Origin", "*"],
    [
      "Accept, Accept-Encoding",
      ["origin", "accept", "accept-charset"],
      "Accept, Accept-Encoding, origin, accept-charset",
    ],
  ])("should update Vary %j with %j", (header, field, expected) => {
    const res = new ServerResponse(new IncomingMessage(new Socket()));
    res.setHeader("Vary", header);

    vary(res, field);

    expect(res.getHeader("Vary")).toBe(expected);
  });

  it("should append fields across multiple calls", () => {
    const res = new ServerResponse(new IncomingMessage(new Socket()));
    res.setHeader("Vary", "Accept");

    vary(res, "Origin");
    vary(res, "User-Agent");

    expect(res.getHeader("Vary")).toBe("Accept, Origin, User-Agent");
  });

  it.each(["invalid:header", "invalid header"])(
    "should reject %j without changing Vary",
    (field) => {
      const res = new ServerResponse(new IncomingMessage(new Socket()));
      res.setHeader("Vary", "Accept");

      expect(() => vary(res, field)).toThrow(/field.*contains.*invalid/);
      expect(res.getHeader("Vary")).toBe("Accept");
    },
  );
});

describe("append(header, field)", () => {
  describe("arguments", () => {
    describe("header", () => {
      it("should be required", () => {
        expect(() => {
          // @ts-expect-error testing an invalid call at runtime
          append();
        }).toThrow(TypeError);
      });

      it("should be a string", () => {
        expect(() => {
          // @ts-expect-error testing an invalid call at runtime
          append(42);
        }).toThrow(TypeError);
      });
    });

    describe("field", () => {
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

    it("should preserve the existing header when adding formatted fields", () => {
      expect(append("Accept,\tOrigin", ["accept", "X-Foo", "x-foo"])).toBe(
        "Accept,\tOrigin, X-Foo",
      );
    });

    it("should reject an invalid field even when it is already listed", () => {
      expect(() => append("invalid:header", "invalid:header")).toThrow(
        TypeError,
      );
    });
  });

  describe("when *", () => {
    it("should set value", () => {
      expect(append("", "*")).toBe("*");
    });

    it("should act as if all values already set", () => {
      expect(append("*", "Origin")).toBe("*");
    });

    it("should still validate new field names", () => {
      expect(() => append("*", "invalid:header")).toThrow(TypeError);
      expect(() => append("Origin", ["*", "invalid:header"])).toThrow(
        TypeError,
      );
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

    it.each([
      [", Accept, , Origin,", "Accept, Origin"],
      [" ,\t, ", "Accept"],
      ["", "Accept"],
    ])("should skip empty members in %j", (field, expected) => {
      expect(append("Accept", field)).toBe(expected);
    });

    it("should handle contained *", () => {
      expect(append("", "Accept,*")).toBe("*");
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

describe("parse(header)", () => {
  it.each([
    ["", []],
    ["foo bar, x y, whatever", ["foo bar", "x y", "whatever"]],
    ["\t\u0000X \tY\u00a0 ", ["\u0000X \tY\u00a0"]],
    [" ,\t, ", []],
    [" ,\tAccept\t, , accept, Origin, ", ["Accept", "accept", "Origin"]],
    ["Accept, *", ["Accept", "*"]],
  ])("should parse %j", (header, expected) => {
    expect(parse(header)).toEqual(expected);
  });
});

describe("format(fields)", () => {
  it.each([
    ["", ""],
    ["\tAccept, Origin, accept, Accept", "Accept, Origin, accept, Accept"],
    ["Accept, *, Origin", "Accept, *, Origin"],
  ])("should format the fields parsed from %j", (header, expected) => {
    expect(format(parse(header))).toBe(expected);
  });

  it("should reject invalid field names", () => {
    expect(() => format([""])).toThrow(TypeError);
    expect(() => format(["*", "invalid:header"])).toThrow(TypeError);
  });
});
