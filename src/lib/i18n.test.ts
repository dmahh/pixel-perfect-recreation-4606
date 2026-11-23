import { describe, expect, it } from "vitest";
import { parseLanguage, translate } from "./i18n";

describe("Site language", () => {
  it("supports English and Kazakh with a safe English default", () => {
    expect(parseLanguage("kk")).toBe("kk");
    expect(parseLanguage("en")).toBe("en");
    expect(parseLanguage(null)).toBe("en");
    expect(parseLanguage("unsupported")).toBe("en");
  });
  it("leaves numeric algorithm values and identifiers unchanged when translating", () => {
    const result = translate("kk", "Bayterek: g=3.56, h=0.65, f=4.21 km");
    expect(result).toContain("g=3.56, h=0.65, f=4.21");
    expect(translate("kk", "nur-alem")).toBe("nur-alem");
    expect(translate("en", "g(n) + h(n) = f(n)")).toBe("g(n) + h(n) = f(n)");
  });
});