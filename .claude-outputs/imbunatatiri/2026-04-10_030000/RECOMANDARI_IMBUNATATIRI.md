# RECOMANDARI IMBUNATATIRI - Proiect Meteo Nadlac

**Data:** 2026-04-10
**Versiune proiect:** commit `cdc4f16` (LIVE pe https://meteo-ten-mu.vercel.app)
**Stack:** Next.js 14 + TypeScript + Tailwind + 4 surse meteo + PWA

---

## SUMAR EXECUTIV

Proiectul e **functional in productie** cu toate cele 4 surse meteo active. Algoritmii de confidence si agregare sunt pragmatici. Limitari identificate:

- **17 functii existente** pot fi imbunatatite (error handling, accessibility, UX mobile)
- **12 functii noi** valoroase care completeaza workflow-urile (favorite locations UI, geocoding, alerte)
- **9 imbunatatiri tehnice** (teste, race conditions, cache persistent, bundle)

---

## PARTEA I — IMBUNATATIRI FUNCTII EXISTENTE

### 1. `useWeather()` — Abort controller pentru race conditions

**Fisier:** `src/hooks/useWeather.ts`
**Problema actuala:** Daca utilizatorul schimba rapid locatia (click pe harta + click pe alt punct), fetch-urile vechi pot arrive dupa cele noi si suprascriu state-ul cu date invechite.

**Imbunatatire propusa:**

- AbortController pentru anulare fetch-uri obsolete
- Cleanup in useEffect la schimbare lat/lon
- Ignora response daca signal.aborted

**Exemplu implementare:**

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function fetchWeather() {
    setLoading(true);
    try {
      const res = await fetch(`/api/weather/${lat}/${lon}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e: unknown) {
      if ((e as Error).name === "AbortError") return;
      setError("Nu am putut încărca datele meteo");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  fetchWeather();
  const interval = setInterval(fetchWeather, REFRESH_INTERVAL);

  return () => {
    controller.abort();
    clearInterval(interval);
  };
}, [lat, lon]);
```

**Complexitate:** Mica | **Impact:** Mare

---

### 2. `aggregateDaily()` — Humidity agregat corect

**Fisier:** `src/lib/services/aggregator.ts` — linia ~313
**Problema actuala:** `humidity: 0` hardcodat in forecast-ul 7 zile. Utilizatorul vede 0% peste tot la umiditate zilnica.

**Imbunatatire propusa:**

- Media humidity din surse (daca au date)
- Fallback la humidity orara din prima ora a zilei daca daily nu are

**Exemplu implementare:**

```tsx
// In aggregateDaily, unde se construieste DailyForecast
const humidities = sourceForecasts
  .map((s) => s.daily?.find((d) => d.date === dateStr)?.humidity)
  .filter((h): h is number => typeof h === "number" && h > 0);

const avgHumidity =
  humidities.length > 0
    ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
    : 0;

return {
  // ...
  humidity: avgHumidity,
};
```

**Complexitate:** Mica | **Impact:** Mediu

---

### 3. `MapContent.tsx` — Marker reactiv la schimbare locatie

**Fisier:** `src/components/tabs/MapContent.tsx` — linia ~61
**Problema actuala:** `useEffect` dependency array e `[]`, deci marker-ul nu se actualizeaza daca `latitude`/`longitude` se schimba din alta sursa (GPS, favorite).

**Imbunatatire propusa:**

- Al doilea useEffect dedicat sincronizarii marker cu props
- Preserve zoom level curent (nu resetare la 10)

**Exemplu implementare:**

```tsx
useEffect(() => {
  if (mapInstanceRef.current && markerRef.current) {
    const currentZoom = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.setView([latitude, longitude], currentZoom);
    markerRef.current.setLatLng([latitude, longitude]);
  }
}, [latitude, longitude]);
```

**Complexitate:** Mica | **Impact:** Mediu

---

### 4. `aggregateCurrent()` — Wind direction agregat

**Fisier:** `src/lib/services/aggregator.ts`
**Problema actuala:** `wind_direction` e luat doar din prima sursa disponibila. Daca sursele au directii diferite, pierdem info.

**Imbunatatire propusa:**

- Media vectoriala (nu scalara) a directiilor — formula corecta pentru unghiuri
- Media aritmetica greseste (ex: 350° + 10° = 180°, dar corect e 0°)

**Exemplu implementare:**

```tsx
function averageWindDirection(directions: number[]): number {
  if (directions.length === 0) return 0;
  const radians = directions.map((d) => (d * Math.PI) / 180);
  const sumSin = radians.reduce((a, r) => a + Math.sin(r), 0);
  const sumCos = radians.reduce((a, r) => a + Math.cos(r), 0);
  const avgRad = Math.atan2(sumSin / radians.length, sumCos / radians.length);
  const avgDeg = (avgRad * 180) / Math.PI;
  return Math.round((avgDeg + 360) % 360);
}
```

**Complexitate:** Mica | **Impact:** Mic (dar corect matematic)

---

### 5. `cache.ts` — LRU eviction

**Fisier:** `src/lib/services/cache.ts`
**Problema actuala:** Daca sunt > 50 chei si nicio intrare expirata, cache-ul creste nelimitat. Pe Vercel serverless asta poate cauza cold starts mai lente.

**Imbunatatire propusa:**

- Map pastreaza ordinea de insertie → LRU simplu
- La evict, sterge cea mai veche cheie accesata

**Exemplu implementare:**

```tsx
const MAX_SIZE = 50;
const cache = new Map<string, CachedEntry>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  // LRU: muta la sfarsit pe access
  cache.delete(key);
  cache.set(key, entry);
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
  if (cache.size >= MAX_SIZE && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, expires: Date.now() + ttlMs });
}
```

**Complexitate:** Mica | **Impact:** Mediu

---

### 6. `RefreshBar.tsx` — Cleanup interval la unmount

**Fisier:** `src/components/RefreshBar.tsx`
**Problema actuala:** Verifica codul — probabil interval 10s nu e cleanup-at corect la schimbarea locatiei (daca componenta se unmount-eaza si remount-eaza rapid).

**Imbunatatire propusa:**

- Cleanup explicit cu clearInterval in return useEffect
- Depinde de `lastUpdated` ca sa reseteze progresul

**Complexitate:** Mica | **Impact:** Mic

---

### 7. `InstallPrompt.tsx` — Nu mai arata daca deja instalat

**Fisier:** `src/components/InstallPrompt.tsx`
**Problema actuala:** Afiseaza banner-ul de instalare chiar si pe iOS (care nu suporta `beforeinstallprompt`) sau dupa instalare.

**Imbunatatire propusa:**

- Detecteaza standalone mode (`window.matchMedia('(display-mode: standalone)').matches`)
- Ascunde daca e deja instalat
- Pe iOS, arata instructiuni manuale (Share → Add to Home Screen)

**Exemplu implementare:**

```tsx
const [isStandalone, setIsStandalone] = useState(false);

useEffect(() => {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  setIsStandalone(standalone);
}, []);

if (isStandalone || dismissed) return null;

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
if (isIOS && !canInstall) {
  return <IOSInstallInstructions onDismiss={() => setDismissed(true)} />;
}
```

**Complexitate:** Mica | **Impact:** Mediu

---

### 8. `Header.tsx` — GPS button disabled state clar

**Fisier:** `src/components/Header.tsx`
**Problema actuala:** Cand `gpsLoading` e true, butonul doar face pulse pe icon, dar nu e evident utilizatorului ca proceseaza.

**Imbunatatire propusa:**

- Spinner loader explicit in loc de pulse
- Culoare diferita (amber) cand asteapta permisiune
- Tooltip cu stare curenta

**Complexitate:** Mica | **Impact:** Mic

---

### 9. `WeatherCard.tsx` — Iconita vant rotita dupa directie

**Fisier:** `src/components/WeatherCard.tsx`
**Problema actuala:** Directia vantului e afisata ca numar (ex: 321°) dar nu vizual. Utilizatorul nu intelege instant din ce directie bate.

**Imbunatatire propusa:**

- Sageata SVG rotita cu `transform: rotate(${wind_direction}deg)`
- Label text: N, NE, E, SE, S, SV, V, NV

**Exemplu implementare:**

```tsx
function degToDirection(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SV", "V", "NV"];
  return dirs[Math.round(deg / 45) % 8];
}

<div className="flex items-center gap-1">
  <svg
    className="w-4 h-4 text-gray-500"
    style={{ transform: `rotate(${current.wind_direction}deg)` }}
    viewBox="0 0 24 24"
  >
    <path d="M12 2 L16 10 L12 8 L8 10 Z" fill="currentColor" />
  </svg>
  <span>
    {current.wind_speed} km/h {degToDirection(current.wind_direction)}
  </span>
</div>;
```

**Complexitate:** Mica | **Impact:** Mic

---

### 10. `HourlyTab.tsx` — Skeleton loader cand e gol

**Fisier:** `src/components/tabs/HourlyTab.tsx`
**Problema actuala:** Daca `hourly` e gol sau in curs de incarcare, componenta afiseaza grafic gol fara feedback.

**Imbunatatire propusa:**

- Conditional rendering: skeleton cu pulse animation cand `hourly.length === 0`
- Mesaj explicativ cand nu sunt date

**Complexitate:** Mica | **Impact:** Mediu

---

### 11. `ComparisonTab.tsx` — Sortare dupa confidence

**Fisier:** `src/components/tabs/ComparisonTab.tsx`
**Problema actuala:** Sursele sunt afisate in ordinea hardcodata (Open-Meteo, ECMWF, OpenWeather, WeatherAPI). Utilizatorul nu vede instant care e cea mai sigura.

**Imbunatatire propusa:**

- Sorted descending by confidence
- Badge "Cea mai sigura" pentru top
- Badge "Cea mai rapida" pentru sursa cu cel mai mic response_time_ms

**Complexitate:** Mica | **Impact:** Mediu

---

### 12. `SevenDayTab.tsx` — Afisare precipitatii

**Fisier:** `src/components/tabs/SevenDayTab.tsx`
**Problema actuala:** `precipitation` exista in `DailyForecast` dar nu e afisat. Important pentru planificare.

**Imbunatatire propusa:**

- Iconita picatura cu mm pe langa iconita condition
- Bara verticala cu intensitate (0-5mm verde, 5-15 amber, 15+ rosu)

**Complexitate:** Mica | **Impact:** Mare (utilizatorul vrea sa stie daca ploua)

---

### 13. `ai-summary.ts` — Weighted confidence in prompt

**Fisier:** `src/lib/services/ai-summary.ts`
**Problema actuala:** Template-based fallback nu mentioneaza cat de incerta e prognoza cand sursele difera mult.

**Imbunatatire propusa:**

- Daca `aggregated_confidence < 60` → adauga disclaimer: "Sursele au dezacord, prognoza nesigura"
- Daca `max_deviation > 5°C` → adauga sugestia de verificat local

**Complexitate:** Mica | **Impact:** Mediu

---

### 14. `requestGPS()` — watchPosition pentru update continuu (optional)

**Fisier:** `src/hooks/useLocation.ts`
**Problema actuala:** `getCurrentPosition` face un singur fix. Daca utilizatorul se deplaseaza, locatia nu se actualizeaza.

**Imbunatatire propusa:**

- Optional: `watchPosition` + toggle "Urmareste locatia"
- Auto-update locatie la mutare > 500m

**Complexitate:** Medie | **Impact:** Mic (nu e caz principal de utilizare)

---

### 15. API routes — Validation Zod / manual stricta

**Fisier:** `src/app/api/weather/[lat]/[lon]/route.ts`
**Problema actuala:** Validare basic `parseFloat` + range check. Nu respinge `NaN`, `Infinity`, string-uri cu litere.

**Imbunatatire propusa:**

- Schema validation cu check finit + range
- Return 400 cu mesaj specific

**Exemplu implementare:**

```tsx
function validateCoord(value: string, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

const lat = validateCoord(params.lat, -90, 90);
const lon = validateCoord(params.lon, -180, 180);
if (lat === null || lon === null) {
  return Response.json({ error: "Coordonate invalide" }, { status: 400 });
}
```

**Complexitate:** Mica | **Impact:** Mediu (previne crash-uri cu input manipulat)

---

### 16. Manifest.json — `screenshots` pentru install prompt mai frumos

**Fisier:** `public/manifest.json`
**Problema actuala:** Prompt-ul de instalare pe Android arata doar iconita. Cu `screenshots` arata preview-uri ale aplicatiei — mai atractiv.

**Imbunatatire propusa:**

- Adauga 2-3 screenshots (light + dark + hourly tab)
- Format JSON: `{"src": "/screenshots/1.png", "sizes": "1080x1920", "type": "image/png", "form_factor": "narrow"}`

**Complexitate:** Mica (trebuie capturate screenshots) | **Impact:** Mediu

---

### 17. Meta tags SEO si sharing

**Fisier:** `src/app/layout.tsx`
**Problema actuala:** Fara Open Graph, Twitter Card. Cand trimiti link-ul pe WhatsApp/Telegram, nu apare preview frumos.

**Imbunatatire propusa:**

- Adauga `openGraph` si `twitter` in `metadata`
- OG image: captura + text "Meteo Nadlac"

**Exemplu implementare:**

```tsx
export const metadata: Metadata = {
  title: "Meteo Nădlac — Prognoză Multi-Sursă",
  description: "Monitorizare meteo din multiple surse cu agregare inteligentă",
  manifest: "/manifest.json",
  metadataBase: new URL("https://meteo-ten-mu.vercel.app"),
  openGraph: {
    title: "Meteo Nădlac",
    description: "Prognoză meteo cu 4 surse agregate",
    url: "https://meteo-ten-mu.vercel.app",
    siteName: "Meteo",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "ro_RO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meteo Nădlac",
    description: "Prognoză meteo multi-sursă",
    images: ["/og-image.png"],
  },
};
```

**Complexitate:** Mica | **Impact:** Mediu

---

## PARTEA II — FUNCTII NOI

### 18. UI pentru locatii favorite (hook e gata, UI lipseste)

**Descriere:** Hook-ul `useLocation` deja salveaza/sterge favorite in localStorage, dar nicio componenta nu le afiseaza. Adauga un panou dropdown cu lista favorite + buton "Adauga locatie curenta".

**De ce e util:** Utilizatorul poate salva Nadlac, Arad, Timisoara, Oradea si switcha instant intre ele fara a le cauta pe harta de fiecare data.

**Complexitate:** Medie | **Impact:** Mare

**Exemplu implementare:**

```tsx
// src/components/FavoritesDropdown.tsx
"use client";
import { useState } from "react";
import type { FavoriteLocation } from "@/lib/types";

interface Props {
  current: { name: string; latitude: number; longitude: number };
  favorites: FavoriteLocation[];
  onSelect: (lat: number, lon: number, name: string) => void;
  onAdd: () => void;
  onRemove: (lat: number, lon: number) => void;
}

export default function FavoritesDropdown({
  current,
  favorites,
  onSelect,
  onAdd,
  onRemove,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {current.name}
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border z-50">
          <div className="p-2 max-h-64 overflow-y-auto">
            {favorites.length === 0 ? (
              <p className="text-xs text-gray-500 p-2">Nicio locație salvată</p>
            ) : (
              favorites.map((f) => (
                <div
                  key={`${f.latitude},${f.longitude}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface"
                >
                  <button
                    onClick={() => {
                      onSelect(f.latitude, f.longitude, f.name);
                      setOpen(false);
                    }}
                    className="flex-1 text-left text-sm"
                  >
                    {f.name}
                  </button>
                  <button
                    onClick={() => onRemove(f.latitude, f.longitude)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    aria-label={`Șterge ${f.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => {
              onAdd();
              setOpen(false);
            }}
            className="w-full p-3 border-t border-gray-200 dark:border-dark-border text-sm font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10"
          >
            + Salvează „{current.name}"
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 19. Reverse geocoding — nume locatie din coordonate

**Descriere:** Cand utilizatorul da click pe harta sau foloseste GPS, in loc de "46.194°N, 21.233°E" afiseaza numele real al localitatii ("Nadlac", "Arad", "Pecica").

**De ce e util:** Mai intuitiv decat coordonate. Favoritele devin identificabile.

**Complexitate:** Mica | **Impact:** Mare

**Exemplu implementare:**

```tsx
// src/lib/services/geocoding.ts
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      format: "json",
      lat: lat.toString(),
      lon: lon.toString(),
      zoom: "10",
      "accept-language": "ro",
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": "MeteoNadlac/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      null
    );
  } catch {
    return null;
  }
}
```

Apoi in `useLocation.ts`:

```tsx
const setLocation = useCallback(
  async (lat: number, lon: number, name?: string) => {
    let finalName = name;
    if (!name) {
      finalName =
        (await reverseGeocode(lat, lon)) ||
        `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;
    }
    const loc = { name: finalName, latitude: lat, longitude: lon };
    setCurrentLocation(loc);
    localStorage.setItem(CURRENT_KEY, JSON.stringify(loc));
  },
  [],
);
```

**Gratuit:** Nominatim accepta 1 req/sec — perfect pentru uz personal.

---

### 20. Cautare locatie dupa nume (search box)

**Descriere:** Input text in header unde utilizatorul scrie "Bucuresti" si primeste sugestii. Click → switch locatie.

**De ce e util:** Mai rapid decat harta pentru locatii cunoscute. Covers use-case "vreau sa vad cat e la tara/vacanta".

**Complexitate:** Medie | **Impact:** Mare

**Exemplu implementare:**

```tsx
// src/components/LocationSearch.tsx
"use client";
import { useState, useEffect } from "react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationSearch({
  onSelect,
}: {
  onSelect: (lat: number, lon: number, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: "json",
          limit: "5",
          "accept-language": "ro",
          countrycodes: "ro,hu,md",
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
        );
        setResults(await res.json());
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Caută localitate..."
        className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-surface text-sm"
      />
      {results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border z-50 max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(
                  parseFloat(r.lat),
                  parseFloat(r.lon),
                  r.display_name.split(",")[0],
                );
                setQuery("");
                setResults([]);
              }}
              className="w-full text-left p-3 text-sm hover:bg-gray-100 dark:hover:bg-dark-surface border-b border-gray-100 dark:border-dark-border last:border-b-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 21. Alerte meteo (badge cu notificare in aplicatie)

**Descriere:** Daca prognoza are furtuna, ploaie puternica sau temperaturi extreme, afiseaza un banner colorat in partea de sus cu alerta.

**De ce e util:** Utilizatorul nu trebuie sa caute prin tab-uri — vede instant daca ziua are un pericol.

**Complexitate:** Mica | **Impact:** Mare

**Exemplu implementare:**

```tsx
// src/components/WeatherAlert.tsx
"use client";
import type { HourlyForecast } from "@/lib/types";

interface Alert {
  level: "info" | "warning" | "danger";
  message: string;
  icon: string;
}

function detectAlerts(hourly: HourlyForecast[], currentTemp: number): Alert[] {
  const alerts: Alert[] = [];
  const next12h = hourly.slice(0, 12);

  // Detectie furtuna in urmatoarele 6 ore
  const stormHours = next12h
    .slice(0, 6)
    .filter(
      (h) =>
        h.condition.includes("furtuna") || h.condition.includes("puternica"),
    );
  if (stormHours.length > 0) {
    alerts.push({
      level: "danger",
      message: `Furtună posibilă la ${stormHours[0].hour}`,
      icon: "⚠️",
    });
  }

  // Ploaie semnificativa
  const rainSum = next12h.reduce((s, h) => s + h.precipitation, 0);
  if (rainSum > 10) {
    alerts.push({
      level: "warning",
      message: `Ploaie: ${rainSum.toFixed(0)}mm în următoarele 12h`,
      icon: "🌧️",
    });
  }

  // Temperaturi extreme
  if (currentTemp > 35) {
    alerts.push({
      level: "danger",
      message: "Caniculă — hidratează-te",
      icon: "🥵",
    });
  } else if (currentTemp < -10) {
    alerts.push({
      level: "warning",
      message: "Ger — îmbracă-te gros",
      icon: "🥶",
    });
  }

  return alerts;
}

export default function WeatherAlert({
  hourly,
  currentTemp,
}: {
  hourly: HourlyForecast[];
  currentTemp: number;
}) {
  const alerts = detectAlerts(hourly, currentTemp);
  if (alerts.length === 0) return null;

  return (
    <div className="mx-4 mt-3 space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`p-3 rounded-xl flex items-center gap-3 text-sm font-medium ${
            a.level === "danger"
              ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20"
              : a.level === "warning"
                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"
          }`}
        >
          <span className="text-xl">{a.icon}</span>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}
```

---

### 22. Istoric comparatie prognoza vs realitate

**Descriere:** Pagina separata /istoric care afiseaza cat de precise au fost prognozele din ultimele 7 zile, per sursa. Necesita cron job care salveaza zilnic realitatea.

**De ce e util:** Utilizatorul afla care sursa minte cel mai putin. Construieste incredere in app.

**Complexitate:** Mare (necesita persistence DB — Vercel KV sau Postgres) | **Impact:** Mare strategic

---

### 23. Alerte push notificari (PWA)

**Descriere:** Subscribe la notificari web push. Trimite alerta daca se schimba prognoza semnificativ (ex: va incepe ploaia in 2h).

**De ce e util:** Nu trebuie sa deschizi aplicatia — primesti info cand conteaza.

**Complexitate:** Mare (Web Push API + service worker extins + backend VAPID) | **Impact:** Mare

**Nota:** Utilizatorul a zis initial "NU notificari". A se reconfirma inainte de implementare.

---

### 24. Widgets comparativ "Astazi vs acum o saptamana"

**Descriere:** Un card extra care arata: "Astazi 6°C, acum o saptamana a fost 12°C — s-a racit cu 6°C"

**De ce e util:** Context emotional ("de ce mi se pare frig astazi") — comparare fata de recent.

**Complexitate:** Medie (necesita stocare istoric) | **Impact:** Mic (nice-to-have)

---

### 25. Export PDF / imagine a prognozei

**Descriere:** Buton "Descarca prognoza" → genereaza PDF sau PNG cu prognoza 7 zile, pentru trimis pe WhatsApp.

**De ce e util:** Utilizatorul vrea sa trimita prognoza cuiva fara browser.

**Complexitate:** Medie (html2canvas + jspdf sau server-side cu Puppeteer) | **Impact:** Mic

---

### 26. Unit toggle: °C/°F, km/h/mph, mm/inch

**Descriere:** Pentru utilizatori internationali. Toggle in Settings.

**De ce e util:** Nu pare necesar pentru "doar Nadlac", dar daca aplicatia e partajata cu strainatate e util.

**Complexitate:** Mica | **Impact:** Mic (publicul tinta e RO)

---

### 27. Dark mode auto dupa ora (sunset/sunrise)

**Descriere:** In loc de auto-detectie OS, schimba tema la apus/rasarit local.

**De ce e util:** Ecran dark noaptea fara a depinde de setarea OS.

**Complexitate:** Mica | **Impact:** Mic

---

### 28. AI real cu Gemini (GOOGLE_API_KEY deja disponibil)

**Descriere:** Activeaza AI summary real folosind Gemini Flash (gratuit). `ai-summary.ts` are deja fallback template — adauga Gemini ca primary.

**De ce e util:** Text mai natural, context-aware. Exemplu: "Soare dimineata, dar atentie la ora 15 cand vine furtuna din vest — ia umbrela daca iesi dupa pranz".

**Complexitate:** Mica | **Impact:** Mare

**Exemplu implementare:**

```tsx
// In ai-summary.ts
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function generateWithGemini(
  data: AggregatedData,
): Promise<AISummary | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const prompt = `Ești un asistent meteo în română. Dă un rezumat scurt (max 2 propoziții) și o recomandare practică bazate pe aceste date pentru ${data.location.name}:

Temperatură: ${data.current.temperature}°C
Condiție: ${data.current.condition}
Umiditate: ${data.current.humidity}%
Vânt: ${data.current.wind_speed} km/h
Precipitații următoarele 6h: ${data.hourly.slice(0, 6).reduce((s, h) => s + h.precipitation, 0)}mm

Răspunde în format JSON: {"summary": "...", "recommendation": "..."}. Fără markdown.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text.trim());
    return {
      summary: parsed.summary,
      recommendation: parsed.recommendation,
      alert: null,
    };
  } catch {
    return null;
  }
}
```

---

### 29. Widget Android homescreen

**Descriere:** In loc de doar icoana PWA, un widget care afiseaza temperatura curenta direct pe ecranul principal Android.

**Complexitate:** Mare (necesita Trusted Web Activity sau native wrapper) | **Impact:** Mediu

**Nota:** PWA pur nu suporta widgets pe Android. Necesita wrapping in TWA + Bubblewrap.

---

## PARTEA III — IMBUNATATIRI TEHNICE

### 30. Zero teste automate

**Problema:** Nicio suita de teste. Orice refactor risca sa introduca regresii.
**Solutie:** Vitest + React Testing Library. Prioritate: aggregator.ts (logica critica), calculateConfidence, weightedAverage.
**Complexitate:** Medie | **Impact:** Calitate/Mentenanta

---

### 31. `fetchHourly` / `fetchDaily` timeout inconsistent intre surse

**Problema:** Unele surse au TIMEOUT 15000ms, altele 4000ms (in aggregator). Inconsistenta poate cauza comportament haotic.
**Solutie:** Constante comune in `constants.ts`: `SOURCE_TIMEOUT = 8000`.
**Complexitate:** Mica | **Impact:** Mentenanta

---

### 32. Bundle size — importuri totale Recharts

**Problema:** `import { AreaChart, ... } from "recharts"` tree-shakes partial. Recharts e ~100KB gzipped.
**Solutie:** Import dinamic pentru HourlyTab: `const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart))`.
**Complexitate:** Mica | **Impact:** Performanta (First Load JS mai mic)

---

### 33. Service worker — strategia cache pentru API responses

**Problema:** SW cache-uieste `/api` requests indefinit pana se suprascriu. Nu are TTL. Utilizatorul poate vedea date vechi offline.
**Solutie:** Cache-first cu `max-age` in `Date` header + validation. Sau `stale-while-revalidate`.
**Complexitate:** Medie | **Impact:** Performanta/UX

---

### 34. N+1 fetch in aggregateDaily — posibil

**Problema:** Daca aggregateDaily refetches daily din aceleasi surse pe care aggregateCurrent deja le-a apelat, dubleaza traficul.
**Solutie:** Cache la nivel de request (Map in closure) pentru sursele `fetchAll()`.
**Complexitate:** Medie | **Impact:** Performanta

---

### 35. HTTP pentru WeatherAPI

**Problema:** `const BASE_URL = "http://api.weatherapi.com/v1"` — HTTP in loc de HTTPS.
**Solutie:** Schimba la `https://`. Poate cauza mixed content warning pe HTTPS in Vercel.
**Complexitate:** Mica (1 linie) | **Impact:** Securitate

---

### 36. Accessibility — no focus-visible styles

**Problema:** Utilizatorii cu keyboard nu vad unde e focus-ul pe butoane.
**Solutie:** `focus-visible:ring-2 focus-visible:ring-primary-500` pe toate butoanele.
**Complexitate:** Mica | **Impact:** Accesibilitate

---

### 37. Accessibility — ARIA live region pentru updateuri

**Problema:** Screen reader nu anunta cand se actualizeaza temperatura.
**Solutie:** `aria-live="polite"` pe WeatherCard.
**Complexitate:** Mica | **Impact:** Accesibilitate

---

### 38. TypeScript strict — `unknown` in catch blocks

**Problema:** Unele `catch (e)` fara tip pot masca bug-uri.
**Solutie:** `catch (e: unknown)` + `instanceof Error` guards. Enable `useUnknownInCatchVariables` in tsconfig.
**Complexitate:** Mica | **Impact:** Calitate cod

---

## SUMAR PRIORITATI

| Prioritate            | #   | Nume                               | Complexitate | Impact | Categorie                 |
| --------------------- | --- | ---------------------------------- | ------------ | ------ | ------------------------- |
| **P0 — URGENT**       | 1   | AbortController in useWeather      | Mica         | Mare   | Corectitudine             |
| **P0**                | 2   | Daily humidity agregat corect      | Mica         | Mediu  | Corectitudine             |
| **P0**                | 35  | WeatherAPI HTTPS                   | Mica         | Mare   | Securitate                |
| **P0**                | 15  | Validation coordonate API          | Mica         | Mediu  | Securitate                |
| **P1 — IMPORTANT**    | 18  | UI favorite locations              | Medie        | Mare   | Feature                   |
| **P1**                | 19  | Reverse geocoding                  | Mica         | Mare   | UX                        |
| **P1**                | 20  | Cautare locatie                    | Medie        | Mare   | Feature                   |
| **P1**                | 28  | AI Gemini real                     | Mica         | Mare   | Feature                   |
| **P1**                | 12  | Precipitatii in 7-day tab          | Mica         | Mare   | UX                        |
| **P1**                | 21  | Alerte meteo in-app                | Mica         | Mare   | Feature                   |
| **P1**                | 3   | Map marker reactiv                 | Mica         | Mediu  | Bug fix                   |
| **P1**                | 7   | InstallPrompt standalone detection | Mica         | Mediu  | UX                        |
| **P2 — VALOROS**      | 17  | OG meta tags                       | Mica         | Mediu  | SEO                       |
| **P2**                | 11  | Sortare comparison by confidence   | Mica         | Mediu  | UX                        |
| **P2**                | 10  | Skeleton loader Hourly             | Mica         | Mediu  | UX                        |
| **P2**                | 5   | Cache LRU                          | Mica         | Mediu  | Performanta               |
| **P2**                | 9   | Iconita vant rotita                | Mica         | Mic    | UX                        |
| **P2**                | 13  | AI confidence disclaimer           | Mica         | Mediu  | UX                        |
| **P2**                | 36  | Focus-visible a11y                 | Mica         | Mediu  | Accesibilitate            |
| **P2**                | 4   | Wind direction vectorial           | Mica         | Mic    | Corectitudine             |
| **P3 — STRATEGIC**    | 30  | Teste automate                     | Medie        | Mare   | Calitate                  |
| **P3**                | 22  | Istoric prognoza vs realitate      | Mare         | Mare   | Feature                   |
| **P3**                | 23  | Push notifications                 | Mare         | Mare   | Feature (cere confirmare) |
| **P3**                | 33  | SW cache stale-while-revalidate    | Medie        | Mediu  | Performanta               |
| **P3**                | 32  | Dynamic import Recharts            | Mica         | Mediu  | Performanta               |
| **P4 — NICE-TO-HAVE** | 16  | Manifest screenshots               | Mica         | Mic    | Polish                    |
| **P4**                | 27  | Dark mode sunset/sunrise           | Mica         | Mic    | Polish                    |
| **P4**                | 24  | Comparare cu acum o saptamana      | Medie        | Mic    | Polish                    |
| **P4**                | 25  | Export PDF                         | Medie        | Mic    | Polish                    |
| **P4**                | 26  | Unit toggle                        | Mica         | Mic    | Polish                    |
| **P4**                | 29  | Widget Android (TWA)               | Mare         | Mediu  | Distributie               |
| **P4**                | 14  | watchPosition GPS continuu         | Medie        | Mic    | Polish                    |

---

## NOTE IMPLEMENTARE

1. **Constrangere buget zero** — toate recomandarile folosesc servicii gratuite (Nominatim, Gemini Flash free tier, Vercel free). NU adauga dependinte platite.

2. **Stack existent obligatoriu** — Next.js 14 App Router, TypeScript strict, Tailwind. Nu introduce alte state management (Redux/Zustand) decat daca e justificat.

3. **Dependinte intre recomandari:**
   - #18 (favorites UI) depinde de #19 (reverse geocoding) pentru nume frumoase
   - #22 (istoric) depinde de Vercel KV sau alta persistence — **investigheaza inainte**
   - #21 (alerte) nu depinde de nimic — poate fi implementat primul
   - #28 (Gemini) nu depinde de nimic — activeaza AI real intr-un singur commit

4. **Ordine sugerata de implementare P0+P1:**
   1. #35 HTTPS WeatherAPI (5 secunde)
   2. #1 AbortController (30 min)
   3. #2 Daily humidity (15 min)
   4. #15 Validation coords (15 min)
   5. #28 Gemini AI (1h — cel mai mare impact)
   6. #19 Reverse geocoding (30 min)
   7. #18 Favorites UI (2h)
   8. #20 Cautare locatie (1h)
   9. #21 Alerte meteo (1h)
   10. #12 Precipitatii 7-day (20 min)

5. **Ce NU se schimba:**
   - Arhitectura Next.js + API routes (e optima pentru Vercel)
   - 4 surse meteo + aggregator pattern (functioneaza bine)
   - Design Tailwind + dark mode
   - Limba romana exclusiv
   - Cache in-memory (e suficient pentru uz personal)

---

## METRICI FINALE

- **Functii existente analizate:** ~40
- **Imbunatatiri propuse (Partea I):** 17
- **Functii noi propuse (Partea II):** 12
- **Imbunatatiri tehnice (Partea III):** 9
- **Total recomandari:** 38

**Recomandare urgenta:** Aplica P0 #35 (HTTPS WeatherAPI) — 1 linie, risc zero, fix securitate imediat.
**Cel mai mare ROI:** P1 #28 (Gemini AI) — 1 ora munca, transforma experienta utilizatorului.
