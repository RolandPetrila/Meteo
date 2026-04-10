import type { AISummary } from "@/lib/types";

const CONDITION_DESC: Record<string, string> = {
  senin: "cer senin",
  predominant_senin: "predominant senin",
  partial_noros: "parțial noros",
  noros: "cer noros",
  ceata: "ceață",
  burinta_usoara: "burniță ușoară",
  ploaie_usoara: "ploaie ușoară",
  ploaie_moderata: "ploaie moderată",
  ploaie_puternica: "ploaie puternică",
  ninsoare_usoara: "ninsoare ușoară",
  ninsoare_moderata: "ninsoare moderată",
  ninsoare_puternica: "ninsoare puternică",
  averse_usoare: "averse ușoare",
  averse_moderate: "averse moderate",
  averse_puternice: "averse puternice",
  furtuna: "furtună",
  furtuna_grindina: "furtună cu grindină",
};

function describeCondition(condition: string): string {
  return CONDITION_DESC[condition] || condition.replace(/_/g, " ");
}

function generateRecommendation(
  temp: number,
  condition: string,
  wind: number,
): string {
  const parts: string[] = [];

  if (temp < -10) parts.push("Îmbracă-te foarte gros, temperaturi periculoase");
  else if (temp < 0) parts.push("Îmbracă-te gros, e sub zero grade");
  else if (temp < 10) parts.push("Ia o geacă, e răcoare");
  else if (temp < 20)
    parts.push("Temperatură plăcută, o jachetă ușoară e suficientă");
  else if (temp < 30)
    parts.push("Vreme caldă, ideală pentru activități în aer liber");
  else parts.push("Caniculă, stai la umbră și hidratează-te");

  if (
    condition.includes("ploaie") ||
    condition.includes("averse") ||
    condition.includes("burinta")
  )
    parts.push("Ia umbrela");
  if (condition.includes("ninsoare"))
    parts.push("Drumuri alunecoase, fii precaut");
  if (condition.includes("furtuna"))
    parts.push("Evită deplasările dacă nu e necesar");
  if (wind > 40) parts.push("Vânt puternic, atenție la obiecte nesecurizate");

  return parts.join(". ") + ".";
}

function checkAlerts(
  temp: number,
  wind: number,
  condition: string,
): string | null {
  const alerts: string[] = [];
  if (temp < -10) alerts.push(`Temperatură extrem de scăzută: ${temp}°C`);
  if (temp > 35) alerts.push(`Caniculă: ${temp}°C. Pericol de insolație`);
  if (wind > 60) alerts.push(`Vânt foarte puternic: ${wind} km/h`);
  if (condition.includes("furtuna")) alerts.push("Furtună în zonă");
  if (condition.includes("inghet")) alerts.push("Pericol de îngheț pe drumuri");
  return alerts.length ? alerts.join(". ") + "." : null;
}

interface CurrentInput {
  temperature: number;
  humidity: number;
  wind_speed: number;
  condition: string;
}

/**
 * Genereaza summary cu Google Gemini Flash. Returneaza null la eroare/fara cheie.
 */
async function tryGemini(
  current: CurrentInput,
  fallback: AISummary,
): Promise<AISummary | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.log("[AI] GOOGLE_API_KEY lipseste");
    return null;
  }

  const condText = describeCondition(current.condition);
  const prompt = `Ești un asistent meteo prietenos pentru România. Generează un rezumat scurt și o recomandare practică pentru utilizator.

Vremea acum:
- Temperatură: ${current.temperature}°C
- Condiție: ${condText}
- Umiditate: ${current.humidity}%
- Vânt: ${current.wind_speed} km/h

Răspunde STRICT în format JSON valid (fără markdown, fără \`\`\`json):
{"summary": "1-2 propoziții scurte despre vreme", "recommendation": "1 propoziție cu recomandare practică (haine, umbrelă, etc.)"}

Folosește limba română. Tonul: prietenos, direct.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log("[AI] Gemini HTTP eroare:", res.status, await res.text());
      return null;
    }
    const json = await res.json();
    const text: string | undefined =
      json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.log(
        "[AI] Gemini raspuns fara text:",
        JSON.stringify(json).slice(0, 300),
      );
      return null;
    }

    // Curata eventual cod markdown din raspuns
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(cleaned);

      // Accepta variante de nume pentru campuri (Gemini poate schimba numele)
      const summary =
        parsed.summary ||
        parsed.rezumat ||
        parsed.weather_summary ||
        parsed.description ||
        parsed.text;
      const recommendation =
        parsed.recommendation ||
        parsed.recomandare ||
        parsed.advice ||
        parsed.suggestion ||
        parsed.tip;

      if (!summary || !recommendation) {
        console.error(
          `[AI-DEBUG] Keys=${Object.keys(parsed).join(",")} | Raw=${JSON.stringify(cleaned).slice(0, 500)}`,
        );
        return null;
      }

      console.log("[AI] Gemini OK");
      return {
        summary: String(summary),
        recommendation: String(recommendation),
        alert: fallback.alert,
      };
    } catch (parseErr) {
      console.log("[AI] Gemini JSON parse err:", (parseErr as Error).message);
      console.log("[AI] Text p1:", cleaned.slice(0, 150));
      console.log("[AI] Text p2:", cleaned.slice(150, 300));
      return null;
    }
  } catch (err) {
    console.log("[AI] Gemini fetch err:", (err as Error).message);
    return null;
  }
}

/**
 * Genereaza summary cu OpenAI (legacy fallback). Returneaza null la eroare.
 */
async function tryOpenAI(
  current: CurrentInput,
  fallback: AISummary,
): Promise<AISummary | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const condText = describeCondition(current.condition);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Ești un asistent meteorologic. Rezumă starea vremii în 1-2 propoziții scurte și prietenoase, direct, fără alte comentarii.",
          },
          {
            role: "user",
            content: `Vremea actuală: ${current.temperature}°C, umiditate ${current.humidity}%, vânt ${current.wind_speed} km/h, condiție: ${condText}. Dă-mi un scurt rezumat.`,
          },
        ],
        max_tokens: 80,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    if (!summary) return null;
    return { ...fallback, summary };
  } catch {
    return null;
  }
}

export async function generateSummary(
  current: CurrentInput,
): Promise<AISummary> {
  const { temperature, humidity, wind_speed, condition } = current;
  const condText = describeCondition(condition);

  const fallback: AISummary = {
    summary: `${condText.charAt(0).toUpperCase() + condText.slice(1)}, ${temperature}°C. Umiditate ${humidity}%, vânt ${wind_speed} km/h.`,
    recommendation: generateRecommendation(temperature, condition, wind_speed),
    alert: checkAlerts(temperature, wind_speed, condition),
  };

  // Prioritate: Gemini → OpenAI → template fallback
  const gemini = await tryGemini(current, fallback);
  if (gemini) return gemini;

  const openai = await tryOpenAI(current, fallback);
  if (openai) return openai;

  return fallback;
}
