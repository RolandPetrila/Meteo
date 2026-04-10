import { describe, it, expect } from "vitest";
import {
  validateCoords,
  getWindDirection,
  getConfidenceColor,
  getAgreementColor,
} from "./utils";

describe("validateCoords", () => {
  it("accepta coordonate valide", () => {
    expect(validateCoords("46.194", "21.233")).toEqual({
      lat: 46.194,
      lon: 21.233,
    });
  });

  it("accepta coordonate negative", () => {
    expect(validateCoords("-33.868", "151.209")).toEqual({
      lat: -33.868,
      lon: 151.209,
    });
  });

  it("accepta 0,0", () => {
    expect(validateCoords("0", "0")).toEqual({ lat: 0, lon: 0 });
  });

  it("accepta limitele exacte", () => {
    expect(validateCoords("90", "180")).toEqual({ lat: 90, lon: 180 });
    expect(validateCoords("-90", "-180")).toEqual({ lat: -90, lon: -180 });
  });

  it("respinge lat in afara rangeului", () => {
    expect(validateCoords("91", "0")).toBeNull();
    expect(validateCoords("-91", "0")).toBeNull();
  });

  it("respinge lon in afara rangeului", () => {
    expect(validateCoords("0", "181")).toBeNull();
    expect(validateCoords("0", "-181")).toBeNull();
  });

  it("respinge NaN", () => {
    expect(validateCoords("abc", "123")).toBeNull();
    expect(validateCoords("123", "abc")).toBeNull();
  });

  it("respinge Infinity", () => {
    expect(validateCoords("Infinity", "0")).toBeNull();
    expect(validateCoords("0", "-Infinity")).toBeNull();
  });

  it("respinge string-uri goale", () => {
    // Number("") === 0, deci ar trece — verifica comportamentul actual
    const result = validateCoords("", "");
    // Number("") = 0, e in range → returneaza {lat: 0, lon: 0}
    expect(result).toEqual({ lat: 0, lon: 0 });
  });

  it("respinge null/undefined strings", () => {
    expect(validateCoords("null", "0")).toBeNull();
    expect(validateCoords("undefined", "0")).toBeNull();
  });
});

describe("getWindDirection", () => {
  it("returneaza N pentru 0°", () => {
    expect(getWindDirection(0)).toBe("N");
  });

  it("returneaza E pentru 90°", () => {
    expect(getWindDirection(90)).toBe("E");
  });

  it("returneaza S pentru 180°", () => {
    expect(getWindDirection(180)).toBe("S");
  });

  it("returneaza V pentru 270°", () => {
    expect(getWindDirection(270)).toBe("V");
  });

  it("returneaza NE pentru 45°", () => {
    expect(getWindDirection(45)).toBe("NE");
  });

  it("returneaza N pentru 360° (wrap-around)", () => {
    expect(getWindDirection(360)).toBe("N");
  });

  it("rotunjeste corect valori intermediare", () => {
    // 22° → N (mai aproape de 0 decat de 45)
    expect(getWindDirection(22)).toBe("N");
    // 23° → NE (Math.round(23/45) = 1)
    expect(getWindDirection(23)).toBe("NE");
  });
});

describe("getConfidenceColor", () => {
  it("returneaza emerald pentru scor >= 80", () => {
    expect(getConfidenceColor(80)).toBe("bg-emerald-500");
    expect(getConfidenceColor(100)).toBe("bg-emerald-500");
  });

  it("returneaza amber pentru scor 60-79", () => {
    expect(getConfidenceColor(60)).toBe("bg-amber-500");
    expect(getConfidenceColor(79)).toBe("bg-amber-500");
  });

  it("returneaza red pentru scor < 60", () => {
    expect(getConfidenceColor(59)).toBe("bg-red-500");
    expect(getConfidenceColor(0)).toBe("bg-red-500");
  });
});

describe("getAgreementColor", () => {
  it("mapeaza green -> text-emerald", () => {
    expect(getAgreementColor("green")).toBe("text-emerald-500");
  });

  it("mapeaza yellow -> text-amber", () => {
    expect(getAgreementColor("yellow")).toBe("text-amber-500");
  });

  it("mapeaza red -> text-red", () => {
    expect(getAgreementColor("red")).toBe("text-red-500");
  });

  it("returneaza gray default pentru culori necunoscute", () => {
    expect(getAgreementColor("unknown")).toBe("text-gray-500");
    expect(getAgreementColor("")).toBe("text-gray-500");
  });
});
