import { describe, it, expect } from "vitest";
import { toCsv, toCsvValue } from "../lib/csv";

describe("toCsvValue", () => {
  it("leaves ordinary text alone", () => {
    expect(toCsvValue("Kariuki Auto Garage")).toBe("Kariuki Auto Garage");
  });

  it("quotes values that contain commas, quotes or new lines", () => {
    expect(toCsvValue("Nairobi, Kenya")).toBe('"Nairobi, Kenya"');
    expect(toCsvValue('The "Best" Garage')).toBe('"The ""Best"" Garage"');
    expect(toCsvValue("line one\nline two")).toBe('"line one\nline two"');
  });

  it("neutralises text a spreadsheet would run as a formula", () => {
    expect(toCsvValue("=HYPERLINK(\"http://evil.test\",\"click\")")).toBe(
      "\"'=HYPERLINK(\"\"http://evil.test\"\",\"\"click\"\")\""
    );
    expect(toCsvValue("+254700000000")).toBe("'+254700000000");
    expect(toCsvValue("-2+3")).toBe("'-2+3");
    expect(toCsvValue("@SUM(A1:A9)")).toBe("'@SUM(A1:A9)");
  });

  it("does not touch real numbers, even negative ones", () => {
    expect(toCsvValue(-5)).toBe("-5");
    expect(toCsvValue(42)).toBe("42");
  });

  it("turns missing values into empty cells", () => {
    expect(toCsvValue(null)).toBe("");
    expect(toCsvValue(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("builds rows and applies the same protection to every cell", () => {
    expect(toCsv([["Name", "Phone"], ["A", "+254700000000"]])).toBe("Name,Phone\nA,'+254700000000");
  });
});
