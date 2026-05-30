import { describe, it, expect } from "vitest";
import { getStr, validateText } from "@/lib/action-utils";

// ── getStr ────────────────────────────────────────────────────────────────────

describe("getStr", () => {
  function fd(pairs: Record<string, string>) {
    const f = new FormData();
    for (const [k, v] of Object.entries(pairs)) f.append(k, v);
    return f;
  }

  it("extracts a present field", () => {
    expect(getStr(fd({ title: "Hello" }), "title")).toBe("Hello");
  });

  it("trims leading and trailing whitespace", () => {
    expect(getStr(fd({ title: "  Hello  " }), "title")).toBe("Hello");
  });

  it("returns empty string for a missing field", () => {
    expect(getStr(fd({}), "title")).toBe("");
  });

  it("returns empty string when the field is blank whitespace", () => {
    expect(getStr(fd({ title: "   " }), "title")).toBe("");
  });
});

// ── validateText ──────────────────────────────────────────────────────────────

describe("validateText — required field", () => {
  it("returns an error when value is empty", () => {
    const result = validateText("Title", "");
    expect(result).toEqual(["Title is required"]);
  });

  it("uses the label in the required error", () => {
    const result = validateText("Content", "");
    expect(result?.[0]).toContain("Content");
  });

  it("returns undefined for a valid non-empty value", () => {
    expect(validateText("Title", "My title")).toBeUndefined();
  });

  it("returns an error when value exceeds max", () => {
    const result = validateText("Title", "a".repeat(121), 120);
    expect(result).toEqual(["Title must be 120 characters or fewer"]);
  });

  it("returns undefined exactly at max length", () => {
    expect(validateText("Title", "a".repeat(120), 120)).toBeUndefined();
  });

  it("returns undefined one character under max", () => {
    expect(validateText("Title", "a".repeat(119), 120)).toBeUndefined();
  });

  it("includes the max in the error message", () => {
    const result = validateText("Content", "a".repeat(5001), 5000);
    expect(result?.[0]).toContain("5000");
  });

  it("reports required error even when max is provided and value is empty", () => {
    const result = validateText("Title", "", 120);
    expect(result).toEqual(["Title is required"]);
  });
});

describe("validateText — optional field", () => {
  it("returns undefined when optional field is empty", () => {
    expect(validateText("Blockers", "", 500, { optional: true })).toBeUndefined();
  });

  it("returns undefined when optional field has a valid value", () => {
    expect(validateText("Blockers", "Some blocker", 500, { optional: true })).toBeUndefined();
  });

  it("returns an error when optional field exceeds max", () => {
    const result = validateText("Blockers", "x".repeat(501), 500, { optional: true });
    expect(result).toEqual(["Blockers must be 500 characters or fewer"]);
  });
});

describe("validateText — no max provided", () => {
  it("accepts any length when no max is given", () => {
    expect(validateText("Field", "x".repeat(100_000))).toBeUndefined();
  });
});
