import { describe, it, expect } from "vitest";
import {
  calculateConfidence,
  calculateAgreement,
  weightedAverage,
  majorityCondition,
} from "./aggregator";

describe("calculateConfidence", () => {
  it("returneaza 95 pentru o singura sursa (fara comparatie posibila)", () => {
    const result = calculateConfidence({ open_meteo: 15 });
    expect(result.open_meteo).toBe(95);
  });

  it("returneaza scoruri egale cand toate sursele sunt identice", () => {
    const result = calculateConfidence({
      open_meteo: 15,
      ecmwf: 15,
      openweather: 15,
      weatherapi: 15,
    });
    // Toate ar trebui sa fie 100 (nicio deviatie + bonus spread<2)
    expect(result.open_meteo).toBe(100);
    expect(result.ecmwf).toBe(100);
    expect(result.openweather).toBe(100);
    expect(result.weatherapi).toBe(100);
  });

  it("penalizeaza o sursa outlier", () => {
    const result = calculateConfidence({
      open_meteo: 15,
      ecmwf: 15.2,
      openweather: 14.8,
      weatherapi: 25, // outlier clar
    });
    // Outlier-ul primeste scor mult mai mic
    expect(result.weatherapi).toBeLessThan(result.open_meteo);
    expect(result.weatherapi).toBeLessThan(60);
  });

  it("nu scade scorul sub 40 (floor)", () => {
    const result = calculateConfidence({
      a: 0,
      b: 50, // deviatie foarte mare
    });
    expect(result.b).toBeGreaterThanOrEqual(40);
    expect(result.a).toBeGreaterThanOrEqual(40);
  });

  it("aplica bonus +5 cand toate sursele au spread < 2°C", () => {
    const withBonus = calculateConfidence({
      a: 15,
      b: 15.5,
      c: 16.5,
    });
    // Spread 1.5 < 2 → bonus
    // Pentru sursa la median: 100 - 0*15 + 5 = capped la 100
    expect(withBonus.b).toBe(100);
  });

  it("returneaza scoruri valide si cu 2 surse", () => {
    const result = calculateConfidence({
      open_meteo: 10,
      ecmwf: 12,
    });
    expect(result.open_meteo).toBeGreaterThanOrEqual(40);
    expect(result.open_meteo).toBeLessThanOrEqual(100);
    expect(result.ecmwf).toBeGreaterThanOrEqual(40);
    expect(result.ecmwf).toBeLessThanOrEqual(100);
  });
});

describe("calculateAgreement", () => {
  it("returneaza 'necunoscut' pentru o singura sursa", () => {
    const result = calculateAgreement({ open_meteo: 15 });
    expect(result.level).toBe("necunoscut");
    expect(result.color).toBe("gray");
  });

  it("returneaza 'puternic' verde pentru deviatie < 2°C", () => {
    const result = calculateAgreement({
      a: 15,
      b: 15.5,
      c: 16.2,
    });
    expect(result.level).toBe("puternic");
    expect(result.color).toBe("green");
    expect(result.max_deviation).toBeCloseTo(1.2, 1);
  });

  it("returneaza 'moderat' galben pentru deviatie 2-5°C", () => {
    const result = calculateAgreement({
      a: 15,
      b: 18,
      c: 17,
    });
    expect(result.level).toBe("moderat");
    expect(result.color).toBe("yellow");
    expect(result.max_deviation).toBe(3);
  });

  it("returneaza 'dezacord' rosu pentru deviatie > 5°C", () => {
    const result = calculateAgreement({
      a: 10,
      b: 20,
    });
    expect(result.level).toBe("dezacord");
    expect(result.color).toBe("red");
    expect(result.max_deviation).toBe(10);
  });

  it("include deviatia maxima in description", () => {
    const result = calculateAgreement({ a: 10, b: 12 });
    expect(result.description).toContain("2");
    expect(result.description).toMatch(/°C/);
  });
});

describe("weightedAverage", () => {
  it("returneaza media simpla cand toate weights sunt egale", () => {
    const temps = { a: 10, b: 20, c: 30 };
    const conf = { a: 100, b: 100, c: 100 };
    expect(weightedAverage(temps, conf)).toBe(20);
  });

  it("prioritizeaza sursa cu confidence mai mare", () => {
    const temps = { a: 10, b: 20 };
    const conf = { a: 100, b: 50 };
    // media ponderata: (10*100 + 20*50) / (100+50) = 2000/150 = 13.333
    expect(weightedAverage(temps, conf)).toBeCloseTo(13.3, 1);
  });

  it("foloseste default 50 daca confidence lipseste", () => {
    const temps = { a: 10, b: 20 };
    const conf = { a: 100 }; // lipseste b
    // (10*100 + 20*50) / 150 = 13.333
    expect(weightedAverage(temps, conf)).toBeCloseTo(13.3, 1);
  });

  it("returneaza 0 pentru obiect gol", () => {
    expect(weightedAverage({}, {})).toBe(0);
  });

  it("rotunjeste la 1 zecimala", () => {
    const temps = { a: 10, b: 11 };
    const conf = { a: 100, b: 100 };
    const result = weightedAverage(temps, conf);
    // Verifica format cu max 1 zecimala
    const str = result.toString();
    if (str.includes(".")) {
      expect(str.split(".")[1].length).toBeLessThanOrEqual(1);
    }
  });

  it("gestioneaza temperaturi negative", () => {
    const temps = { a: -10, b: -5 };
    const conf = { a: 100, b: 100 };
    expect(weightedAverage(temps, conf)).toBe(-7.5);
  });
});

describe("majorityCondition", () => {
  it("returneaza 'necunoscut' pentru obiect gol", () => {
    expect(majorityCondition({})).toBe("necunoscut");
  });

  it("returneaza conditia unica cand toate sursele sunt de acord", () => {
    const result = majorityCondition({
      a: "senin",
      b: "senin",
      c: "senin",
    });
    expect(result).toBe("senin");
  });

  it("returneaza conditia majoritara cand sursele difera", () => {
    const result = majorityCondition({
      a: "senin",
      b: "senin",
      c: "noros",
    });
    expect(result).toBe("senin");
  });

  it("functioneaza chiar si cu o singura sursa", () => {
    expect(majorityCondition({ open_meteo: "ploaie_usoara" })).toBe(
      "ploaie_usoara",
    );
  });

  it("returneaza prima conditie gasita in caz de egalitate", () => {
    // Cu 2 surse diferite, ambele au count 1 — prima intalnita castiga
    const result = majorityCondition({
      a: "senin",
      b: "noros",
    });
    expect(["senin", "noros"]).toContain(result);
  });
});
