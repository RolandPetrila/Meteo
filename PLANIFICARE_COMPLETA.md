# PLANIFICARE COMPLETA - Aplicatia Meteo

## Document de referinta pentru implementare cu Claude Code

**Data:** 2026-04-09
**Autor:** Claude Code (consultant tehnic)
**Scop:** Explicatii complete + plan + ghiduri obtinere API keys

---

## PARTEA 1: EXPLICATII SIMPLE PE PUNCTE

### Ce construim?

O **pagina web** (site) pe care o deschizi de pe telefon sau laptop, si care iti arata:

- Prognoza meteo pentru orice localitate (default: Nadlac)
- Date adunate din **mai multe surse** (ca sa fie cat mai corecte)
- Un **AI** care iti spune pe romaneste: "Maine ploua dupa 14:00, ia umbrela!"
- Comparatie intre surse (cat de mult difera intre ele)

### Cum functioneaza?

```
TU (telefon/laptop)
    |
    v
[FRONTEND - pagina web pe Vercel]  ← Ce vezi tu pe ecran
    |
    v
[BACKEND - server pe Railway/Render]  ← Invizibil, lucreaza in spate
    |
    v
[3 SURSE METEO]  ← De unde vin datele
    |
    v
[AI]  ← Transforma cifrele in text natural
    |
    v
Inapoi la tine pe ecran, frumos formatat
```

### Unde "locuieste" aplicatia?

| Component                 | Unde sta                   | Cost                | Ce face                                  |
| ------------------------- | -------------------------- | ------------------- | ---------------------------------------- |
| **Frontend** (pagina web) | Vercel.com                 | GRATUIT             | Afiseaza datele frumos pe ecran          |
| **Backend** (server)      | Railway.app SAU Render.com | GRATUIT             | Aduce datele de la surse, le prelucreaza |
| **Baza de date**          | Pe backend (SQLite)        | GRATUIT             | Salveaza datele temporar (cache 15 min)  |
| **AI**                    | API extern (Gemini/Claude) | GRATUIT (free tier) | Scrie rezumatul in romana                |

### Optiuni backend gratuit - Comparatie

| Serviciu              | Ore gratuite  | Adoarme?         | Python OK? | Recomandat?                  |
| --------------------- | ------------- | ---------------- | ---------- | ---------------------------- |
| **Railway.app**       | 500 ore/luna  | NU               | DA         | DA - cel mai stabil          |
| **Render.com**        | Nelimitat     | DA (dupa 15 min) | DA         | DA - dar primul request lent |
| **Vercel Serverless** | Nelimitat     | NU               | PARTIAL    | NU pentru FastAPI complex    |
| **Fly.io**            | 3 VM gratuite | NU               | DA         | DA - alternativa buna        |

**Recomandarile mele (in ordine):**

1. **Render.com** — cel mai simplu de configurat, gratuit nelimitat, dezavantaj: "adoarme" dupa 15 min inactivitate (30s sa se trezeasca)
2. **Railway.app** — nu adoarme, dar limitat la 500 ore/luna (suficient daca e un singur user)
3. **Fly.io** — bun, dar configurare putin mai complexa

---

## PARTEA 2: SURSE METEO

### A) Surse pe care le CONFIGUREZ EU AUTOMAT (fara API key)

Acestea nu necesita cont, inregistrare, sau cheie. Le integrez direct.

| #   | Sursa               | Ce ofera                                 | Limite      | Acoperire       |
| --- | ------------------- | ---------------------------------------- | ----------- | --------------- |
| 1   | **Open-Meteo**      | Prognoza 7-16 zile, date orare + zilnice | FARA limita | Global          |
| 2   | **ECMWF Open Data** | Prognoza 10 zile, model IFS european     | FARA limita | Europa + Global |

**Open-Meteo** — cea mai importanta sursa. Date de la centre nationale de prognoze (NOAA, DWD, MeteoFrance). Complet gratuit, fara inregistrare, fara limita de apeluri.

**ECMWF Open Data** — datele Centrului European de Prognoze. Calitate ridicata, model IFS la rezolutie 9km. Acces public prin Copernicus.

### B) Surse care NECESITA API Key (obtinere gratuita)

Aici trebuie sa iti faci cont si sa obtii o cheie. E gratuit, dureza 2-5 minute fiecare.

---

#### SURSA 1: OpenWeatherMap

**Ce ofera:** Prognoza 5 zile cu interval de 3 ore, date curente, icoane meteo
**Limita gratuita:** ~1.000 apeluri/zi (mai mult decat suficient)
**Link direct inregistrare:** https://home.openweathermap.org/users/sign_up

**Ghid pas cu pas:**

1. Deschide link-ul de mai sus
2. Completeaza: Username, Email, Parola
3. Bifeaza "I agree to Terms" si "I'm not a robot"
4. Click **Create Account**
5. Confirma email-ul (verifica si Spam)
6. Dupa login, mergi la: **API keys** (in meniu sus)
   - Link direct: https://home.openweathermap.org/api_keys
7. Vei vedea un API key generat automat (un sir lung de litere si cifre)
8. Copiaza acel key — il vom pune in aplicatie

**IMPORTANT:** Key-ul devine activ in ~10 minute dupa creare. Nu functioneaza instant.

**Exemplu de key:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` (al tau va fi diferit)

---

#### SURSA 2: WeatherAPI.com (SURSA BONUS - recomandata)

**Ce ofera:** Prognoza 3 zile (free), date curente, astronomie (rasarit/apus)
**Limita gratuita:** 1.000.000 apeluri/luna
**Link direct inregistrare:** https://www.weatherapi.com/signup.aspx

**Ghid pas cu pas:**

1. Deschide link-ul de mai sus
2. Completeaza: Email, Parola
3. Click **Sign Up**
4. Confirma email-ul
5. Dupa login, vei vedea **API Key** direct pe dashboard
6. Copiaza key-ul

**De ce o recomand:** Limita generoasa (1M apeluri/luna), raspuns rapid, date de calitate. Poate inlocui sau suplimenta OpenWeatherMap.

---

#### SURSA 3: Tomorrow.io (fost ClimaCell) — OPTIONAL

**Ce ofera:** Prognoza 6 zile, date minutare (precipitatii in urmatoarea ora)
**Limita gratuita:** 500 apeluri/zi
**Link direct inregistrare:** https://app.tomorrow.io/signup

**Ghid pas cu pas:**

1. Deschide link-ul
2. Click **Sign Up Free**
3. Completeaza cu email + parola (sau Google account)
4. Dupa login, mergi la **Development** > **API Keys**
5. Copiaza key-ul

---

### C) CONFIGURATIE FINALA SURSE (Recomandata)

| Prioritate    | Sursa           | API Key? | Rol                               |
| ------------- | --------------- | -------- | --------------------------------- |
| **Principal** | Open-Meteo      | NU       | Sursa principala, cea mai stabila |
| **Secundar**  | OpenWeatherMap  | DA       | Validare + comparatie             |
| **Tertiar**   | WeatherAPI.com  | DA       | Sursa bonus, limita generoasa     |
| **Quaternar** | ECMWF Open Data | NU       | Date europene de calitate         |

**Minim necesar pentru a functiona:** Open-Meteo (fara key) + OpenWeatherMap (key gratuit)
**Recomandat:** Toate 4 sursele — cu cat mai multe surse, cu atat prognoza finala e mai precisa.

---

## PARTEA 3: AI — OPTIUNI GRATUITE

AI-ul va primi datele meteo si va genera un rezumat natural in romana.

| Serviciu                | Limita gratuita | Calitate    | Necesita API Key? |
| ----------------------- | --------------- | ----------- | ----------------- |
| **Google Gemini Flash** | 60 req/min      | Foarte buna | DA (gratuit)      |
| **Claude Haiku**        | Trial credits   | Buna        | DA (trial)        |
| **Groq (Llama 3)**      | 30 req/min      | Buna        | DA (gratuit)      |

### Decizie: SE VA STABILI ULTERIOR

Utilizatorul are deja mai multe API keys obtinute. Modelul AI si serviciul se vor decide in faza de implementare.

---

## PARTEA 4: PLAN DE IMPLEMENTARE

### Faza 0: Pregatire (tu, manual)

- [ ] Obtine API key OpenWeatherMap (ghid detaliat in Partea 2, Sectiunea B, Sursa 1)
- [ ] Obtine API key WeatherAPI.com (ghid detaliat in Partea 2, Sectiunea B, Sursa 2)
- [ ] AI service: SE VA STABILI ULTERIOR (utilizatorul are deja mai multe API keys)
- [x] Backend: **Railway.app** (DECIS)

### Faza 1: Backend (Claude Code implementeaza)

- [ ] Structura proiect Python (FastAPI)
- [ ] Conectori pentru fiecare sursa meteo
- [ ] Logica de agregare (merge date din surse multiple)
- [ ] Cache cu SQLite (15 min TTL)
- [ ] Endpoint-uri API (/weather, /locations, etc.)
- [ ] Integrare AI (Gemini Flash)

### Faza 2: Frontend (Claude Code implementeaza)

- [ ] Proiect Next.js + Tailwind CSS
- [ ] Pagina principala cu card meteo + rezumat AI
- [ ] Tab Orar — grafic 24h (temperatura, umiditate)
- [ ] Tab 7 Zile — prognoza saptamanala
- [ ] Tab Comparatie — tabel diferente intre surse
- [ ] Tab Harta — click pe harta = selecteaza locatie noua
- [ ] Design responsive (mobile-first)

### Faza 3: Conectare Frontend + Backend

- [ ] Frontend cere date de la backend
- [ ] Tratare erori (sursa indisponibila, timeout)
- [ ] Loading states (indicator de incarcare)
- [ ] Refresh manual + ultima actualizare

### Faza 4: Publicare Online

- [ ] Deploy frontend pe Vercel
- [ ] Deploy backend pe Railway/Render
- [ ] Configurare variabile de mediu (API keys)
- [ ] Testare pe telefon + laptop
- [ ] Link final de acces

---

## PARTEA 5: STRUCTURA FISIERE (cum va arata proiectul)

```
Meteo/
├── backend/
│   ├── main.py              ← Serverul principal FastAPI
│   ├── sources/
│   │   ├── open_meteo.py    ← Conector Open-Meteo
│   │   ├── openweather.py   ← Conector OpenWeatherMap
│   │   ├── weatherapi.py    ← Conector WeatherAPI
│   │   └── ecmwf.py         ← Conector ECMWF
│   ├── services/
│   │   ├── aggregator.py    ← Logica de merge date
│   │   ├── ai_summary.py    ← Integrare AI
│   │   └── cache.py         ← Cache SQLite
│   ├── models.py            ← Schema baza de date
│   ├── requirements.txt     ← Dependinte Python
│   └── .env                 ← API keys (NICIODATA pe GitHub!)
│
├── frontend/
│   ├── src/
│   │   ├── app/             ← Paginile Next.js
│   │   ├── components/      ← Componente reutilizabile
│   │   └── lib/             ← Utilitare
│   ├── package.json         ← Dependinte JavaScript
│   └── .env.local           ← URL backend
│
├── SPEC_METEO_COMPLET.md    ← Specificatia ta originala
├── PLANIFICARE_COMPLETA.md  ← Acest fisier
└── Chat_Claude_Haiku.md     ← Istoricul conversatiei cu Haiku
```

---

## PARTEA 6: DECIZII CONFIRMATE

1. **Backend hosting:** ✅ **Railway.app** — nu adoarme, 500 ore/luna (suficient)

2. **Cate surse meteo:** ✅ **Toate 4** (Open-Meteo + OpenWeatherMap + WeatherAPI + ECMWF)
   - Arhitectura ramane deschisa pentru adaugarea de surse noi ulterior

3. **AI service:** ⏳ **SE VA STABILI ULTERIOR** — utilizatorul are mai multe API keys deja obtinute

4. **Dark mode:** ✅ **DA** — tema intunecata inclusa

5. **Notificari push:** ❌ **NU** — nu se doresc notificari

6. **Limba:** ✅ **Doar romana**

---

## PARTEA 7: REPO GITHUB

- **Repository:** https://github.com/RolandPetrila/Meteo.git
- **Vizibilitate:** Private
- **Branch principal:** main

---

**Status:** Decizii confirmate. Document actualizat. Gata pentru implementare.
