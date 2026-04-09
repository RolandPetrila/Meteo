# SISTEM MONITORIZARE METEO MULTI-SURSĂ + AI
## Documentație pentru Claude Code Implementation

---

## 1. OVERVIEW

**Obiectiv:** Aplicație web responsivă (mobile-first) care agregrează prognoze meteo din multiple surse, le compară pentru acuratețe și prezintă sinteza cu ajutorul AI.

**Default Location:** Nădlac (46.194°N, 21.233°E)

**Caracteristică principală:** Utilizator poate selecta orice locație și primește prognoze agregate din 3 surse + AI summary

**Timezone:** Europe/Bucharest (hardcoded, conversie UTC automată)

**Acces:** Link unic pe telefon și laptop (responsive design)

---

## 2. TECH STACK

### Frontend
- **Framework:** React 18 + Next.js (App Router)
- **Deployment:** Vercel (gratuit)
- **Styling:** Tailwind CSS
- **Grafice:** Recharts (LineChart, BarChart)
- **Hartă:** Leaflet + react-leaflet
- **State Management:** React hooks (useState, useContext)
- **HTTP Client:** fetch API

### Backend
- **Framework:** FastAPI (Python 3.13)
- **Async HTTP:** httpx
- **Timezone:** pytz
- **Database:** SQLite (local) / Vercel KV (optional upgrade)
- **Deployment Option 1:** Vercel Serverless (Python runtime)
- **Deployment Option 2:** Render.com Free Tier (Node.js wrapper + Python subprocess)
- **Deployment Option 3:** Railway.app Free Tier (Docker container)

**Notă:** Vercel suportă Python serverless doar cu limitări. Se recomandă Railway.app sau Render.com pentru backend Python free.

### Surse Meteo (API Gratuit)
1. **Open-Meteo** (openmeteo.com)
   - Fără API key
   - Fără limit rate
   - Predicții: 7-16 zile
   - Rezoluție: orar + zilnic

2. **OpenWeatherMap** (openweathermap.org)
   - API key necesar (înregistrare gratuită)
   - Limit: ~1000 apeluri/zi
   - Predicții: 5 zile cu 3h interval
   - Plan: Free tier

3. **ECMWF OpenData** (copernicus.eu / OPEN DATA)
   - Fără API key (acces public)
   - Datele: IFS model (prognoze europene)
   - Predicții: 10 zile
   - Rezoluție: 9km grid

### AI Summary (API Gratuit)
- **Opțiuni:** Claude Haiku (cu API key gratuit trial) / Gemini Flash (Google) / Ollama local
- **Integrare:** La decizierul utilizatorului (posterior)
- **Cost:** Negli­jabil dacă 1 apel/oră

---

## 3. CERINȚE FUNCȚIONALE

### F1. Selectare Locație
- Input implicit: Nădlac (46.194°N, 21.233°E)
- Utilizator poate:
  - Căuta pe hartă (Leaflet click)
  - Introduce lat/lon manual
  - Salva locații favorite (localStorage)

### F2. Fetch Meteo Multi-Sursă
- Apeluri paralele la 3 surse
- Timeout per sursă: 30s
- Fall-back: dacă 2/3 surse reușesc, agregare parțială
- Conversie automat UTC → Europe/Bucharest

### F3. Agregare & Validare Date
- Merge rând cu rând (timestamp matching)
- Deduplicare (períoadă overlap)
- Validare outliers (temp extremă)
- Calcul deviație între surse (°C)

### F4. AI Summary (Opțional în MVP)
- Input: datele agregate + locație
- Output: 
  - Summary (1-2 fraze naturale)
  - Recommendation (ce-i bun de făcut azi?)
  - Alert (dacă temp < -10°C sau > 35°C)
- Limbă: Română

### F5. Prezentare Date
- **Card principal:** temp actual + condition + AI recommendation
- **Tab Orar:** grafic 24h (Recharts) - temp, umiditate, precipitații
- **Tab 7 Zile:** prognoza zilnică
- **Tab Comparație:** tabel surse + devieri
- **Tab Hartă:** Leaflet cu selector noua locație

### F6. Caching
- TTL: 15 minute per locație
- Storage: SQLite local / Vercel KV
- Key: `weather:{lat}:{lon}:{hour}`

---

## 4. CERINȚE NON-FUNCȚIONALE

- **Mobile-first:** design responsiv 320px+
- **Performance:** TTFB < 2s, TTI < 4s
- **Reliability:** 95%+ uptime (surse redundante)
- **Offline:** indicator de conexiune
- **Timezone:** timezone Africa/Bucharest aplicat tuturor orelor afișate
- **Touch-friendly:** butoane/input ≥ 48px
- **Browsers:** Chrome, Safari, Firefox (mobile + desktop)

---

## 5. DATABASE SCHEMA

### Tabel: locations
```sql
CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT DEFAULT 'Europe/Bucharest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel: weather_data
```sql
CREATE TABLE weather_data (
    id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL,
    source TEXT NOT NULL,  -- 'open_meteo', 'openweather', 'ecmwf'
    timestamp TIMESTAMP NOT NULL,
    temperature REAL,
    humidity INTEGER,
    wind_speed REAL,
    wind_direction INTEGER,
    precipitation REAL,
    condition TEXT,  -- 'sunny', 'cloudy', 'rainy', etc.
    raw_json TEXT,  -- backup JSON brut
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, source, timestamp)
);
```

### Tabel: ai_summaries
```sql
CREATE TABLE ai_summaries (
    id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    summary TEXT,
    recommendation TEXT,
    alert TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. API ENDPOINTS (Backend FastAPI)

### GET /api/weather/{latitude}/{longitude}
**Descriere:** Meteo curent + 24h forecast pentru locație

**Response:**
```json
{
  "location": {
    "name": "Nădlac",
    "latitude": 46.194,
    "longitude": 21.233,
    "timezone": "Europe/Bucharest"
  },
  "timestamp": "2026-04-09T16:30:00+02:00",
  "current": {
    "temperature": 12.5,
    "humidity": 65,
    "wind_speed": 5.2,
    "wind_direction": 270,
    "condition": "partly_cloudy"
  },
  "forecast_hourly": [
    {
      "hour": "17:00",
      "temperature": 12.8,
      "humidity": 63,
      "wind_speed": 5.5,
      "condition": "partly_cloudy"
    }
  ],
  "forecast_7days": [
    {
      "date": "2026-04-10",
      "temp_min": 8.5,
      "temp_max": 18.2,
      "condition": "rainy"
    }
  ],
  "comparison": {
    "open_meteo": {
      "temperature": 12.5,
      "status": "ok"
    },
    "openweather": {
      "temperature": 12.8,
      "status": "ok"
    },
    "ecmwf": {
      "temperature": null,
      "status": "timeout"
    }
  },
  "ai_summary": {
    "summary": "Parțial noros, temp 12-13°C",
    "recommendation": "Bun pentru mersul pe jos",
    "alert": null
  },
  "cache_hit": false
}
```

### GET /api/weather/{latitude}/{longitude}/hourly
**Descriere:** Detaliat orele următoare (24h)

### GET /api/weather/{latitude}/{longitude}/comparison
**Descriere:** Tabel devieri între surse

### GET /api/locations
**Descriere:** List locații salvate

### POST /api/locations
**Descriere:** Salvare locație nouă

---

## 7. FLUX APLICAȚIE

```
User accesează link
    ↓
Frontend load → Default Nădlac
    ↓
Frontend → Backend: GET /api/weather/46.194/21.233
    ↓
Backend → Paralel fetch:
  • Open-Meteo
  • OpenWeatherMap
  • ECMWF
    ↓
Backend → Agregare + Validare
    ↓
Backend → [Optional] AI prompt → Summary
    ↓
Backend → Cache (TTL 15min)
    ↓
Backend → JSON response
    ↓
Frontend → Render:
  • Card principal (temp + AI)
  • Tabs (Orar, 7 Zile, Comparație, Hartă)
    ↓
User interact:
  • Click hartă → new location
  • Scroll grafice
  • Citire comparație
```

---

## 8. INTERFAȚĂ (UI/UX WIREFRAME)

### Mobile Layout

```
┌─────────────────────────────┐
│ 🔍 Nădlac      ⛅ 16°C      │  (Header + search)
├─────────────────────────────┤
│                             │
│       ☁️ PARȚIAL NOROS     │  (AI Summary + Card)
│     12-15°C | 65% umiditate│
│  "Bun pentru mersul pe jos" │
│                             │
├─────────────────────────────┤
│ [Orar] [7 Zile] [Compar] [🗺️] │ (Tabs)
├─────────────────────────────┤
│                             │
│  GRAFIC ORAR (Recharts)    │
│  Temp curve cu X: ore      │
│  (14:00, 15:00, 16:00...)  │
│                             │
├─────────────────────────────┤
│ [Refresh]  [Ultima update]  │
│ 16:30 ROZ                   │
└─────────────────────────────┘
```

### Desktop Layout
- Sidebar: locații + căutare
- Main: card + grafice side-by-side
- Bottom: tabel comparație

---

## 9. DEPLOYMENT STRATEGY

### Frontend (Vercel)
```
GitHub → Push
  ↓
Vercel auto-deploy
  ↓
Next.js build
  ↓
URL: https://app-meteo.vercel.app
```

### Backend (Railway.app Free Tier - RECOMANDARE)
```
GitHub → Push (branch: /api)
  ↓
Railway detect Python (requirements.txt + Dockerfile)
  ↓
Deploy Uvicorn + FastAPI
  ↓
URL: https://backend-meteo.railway.app
  
Cost: Gratuit (prima 500 ore/lună)
```

**Alternative:**
- Render.com (Free tier, hibernate după 15min inactiv)
- Supabase (PostgreSQL gratuit + defs cloud functions)

### Environment Variables
```
FRONTEND (.env.local):
  NEXT_PUBLIC_API_URL=https://backend-meteo.railway.app

BACKEND (.env):
  OPENWEATHER_API_KEY=xxx (user obtains)
  CLAUDE_API_KEY=xxx (if using)
  DATABASE_URL=sqlite:///weather.db
  TIMEZONE=Europe/Bucharest
```

---

## 10. CONFIGURAȚIE DEFAULT

### Locație Implicită
- **Nume:** Nădlac
- **Latitude:** 46.194
- **Longitude:** 21.233
- **Timezone:** Europe/Bucharest

### Parametri Fetching
- **Open-Meteo:**
  - Parametri: `latitude`, `longitude`, `hourly`, `daily`
  - Timeout: 30s

- **OpenWeatherMap:**
  - Parametri: `lat`, `lon`, `units=metric`
  - API Key: user-provided
  - Timeout: 15s

- **ECMWF:**
  - Acces data public (fără key)
  - Timeout: 45s

### Cache
- **TTL:** 15 minute
- **Strategy:** First 2/3 surse = proceed; timeout = skip + log

---

## 11. NOTE IMPLEMENTARE

1. **Timezone Handling:**
   - Toate timestamp-urile din DB: UTC
   - Afișaj frontend: Europe/Bucharest (pytz.timezone)
   - Format: "HH:MM ROZ" pe ecran

2. **Error Handling:**
   - Sursă indisponibilă: agregare din restul
   - Toate 3 timeout: afişare cache vechi + warning
   - API key invalid: disable sursa + notificare

3. **AI Integration:**
   - Prompt template: "Analizează prognoza meteo: [JSON]. Prezintă în Română: (1) rezumat (1-2 fraze), (2) recomandare (ce-i bun), (3) alert (dacă pericol)."
   - Model: TBD (user decide)
   - Caching: salva răspuns AI 24h per locație

4. **Performance:**
   - Lazy load Leaflet (pe click tab hartă)
   - Code split React components
   - Recharts: memoization (React.memo)

5. **Testing:**
   - Desktop: Chrome DevTools (mobile emulation)
   - Telefon real: QR code din Vercel sau ngrok local

6. **Limitări Free Tier:**
   - Railway: 500 ore/lună (suficient)
   - Vercel: unlimited untuk hobby project
   - Open-Meteo: fără limit
   - OpenWeatherMap: 1000 calls/zi (suficient)

---

## 12. FAZE IMPLEMENTARE (ORIENTATIV)

1. **Setup:** Repo structure, dependencies, DB init
2. **Backend Sourcing:** Wrapper functions pentru 3 surse
3. **Agregation Logic:** Merge + validare
4. **Frontend Skeleton:** Layout + tabs
5. **API Integration:** Connect frontend ↔ backend
6. **Caching:** SQLite TTL
7. **AI Integration:** (Optional) Claude/Gemini prompt
8. **Deployment:** Railway + Vercel
9. **Testing:** Telefon + Desktop
10. **Polish:** UX refinement, error messages

---

**Document Date:** 2026-04-09  
**Status:** Ready for Claude Code Implementation  
**Next:** Detalii specifice de implementare în Claude Code
