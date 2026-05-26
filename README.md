# Westcoast Scholar

En mini-SaaS utbildningsplattform där studenter kan bläddra bland kurser och boka platser, och lärare kan administrera kursutbud och se inkomna bokningar. Byggd i vanilla JavaScript (ES modules) med Vite som dev-server/bundler och JSON Server som mock-backend.

![Demo](assets/Scholar-demo.png)

## Innehåll

- [Funktioner](#funktioner)
- [Teknisk stack](#teknisk-stack)
- [Kom igång](#kom-igång)
- [Testkonton](#testkonton)
- [Sidor och routing](#sidor-och-routing)
- [Projektstruktur](#projektstruktur)
- [NPM-skript](#npm-skript)
- [TypeScript och tester](#typescript-och-tester)
- [Autentisering](#autentisering)
- [Miljövariabler](#miljövariabler)

## Funktioner

### För studenter
- Bläddra i kursutbud med bild, beskrivning, kursinnehåll och lärarinfo
- Populära kurser markeras med en badge
- Detaljvy som expanderar kortet direkt i gridet
- Bokningsformulär med fältvalidering
- Bokningshistorik kopplad till inloggad student

### För lärare (admin)
- Skapa nya kurser via formulär med validering
- Radera kurser med bekräftelsedialog
- Se alla bokningar från alla studenter

### Autentisering och säkerhet
- Login med e-post och 4-siffrig PIN
- Registrering med rollval (student / teacher)
- SessionStorage-baserad auth-session
- Rollskyddad navigation — admin-vyer är endast tillgängliga för lärare
- Tre separata guard-funktioner med tydligt ansvar — se [`src/auth/AUTH.md`](src/auth/AUTH.md)

### Övrigt
- Realtidsklocka i headern
- Väder via OpenWeather (kräver API-nyckel)
- Path alias `@/` mappad till `./src`
- Prefetch av sidor för snabbare navigering

## Teknisk stack

| Verktyg     | Version  | Användning                  |
|-------------|----------|-----------------------------|
| Vite        | 7.x      | Dev-server och bundler      |
| JSON Server | 0.17.4   | Mock REST API på port 3001  |
| Vitest      | 4.x      | Enhetstester                |
| TypeScript  | 5.x      | Typning av utils-lager      |
| Happy DOM   | 20.x     | DOM-miljö för tester        |
| Vanilla JS  | ES2022   | All applikationskod         |

Inga frontend-ramverk används — projektet är ett medvetet vanilla JS-bygge med ES modules.

## Kom igång

### Krav
- Node.js 18 eller senare
- npm

### Installation

```bash
git clone https://github.com/0pFlow/westcoast-scholar.git
cd westcoast-scholar
npm install
```

Skapa en `.env`-fil baserad på `.env.example`:

```bash
cp .env.example .env
```

### Starta projektet

Projektet behöver två terminaler — en för mock-API:t och en för Vite dev-servern.

**Terminal 1 — API:**
```bash
npm run api
```
JSON Server körs på `http://localhost:3001`.

**Terminal 2 — Frontend:**
```bash
npm run dev
```
Vite öppnar `http://localhost:5173/index.html` automatiskt.

## Testkonton

| Roll    | E-post                 | PIN  |
|---------|------------------------|------|
| Student | student@westcoast.se   | 1234 |
| Teacher | teacher@westcoast.se   | 4321 |

## Sidor och routing

| Sida         | URL                                     | Skyddad av                |
|--------------|-----------------------------------------|---------------------------|
| Landing      | http://localhost:5173/index.html        | Publik                    |
| Login        | http://localhost:5173/login.html        | `redirectForPage`         |
| Registrering | http://localhost:5173/register.html     | Publik                    |
| Kurser       | http://localhost:5173/courses.html      | `requireAuthUser`         |
| Bokning      | http://localhost:5173/booking.html      | `requireAuthUser`         |
| Admin        | http://localhost:5173/admin.html        | `requireRole("teacher")`  |

## Projektstruktur

```
root/
├── public/              HTML-sidor och CSS
│   ├── css/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── courses.html
│   ├── booking.html
│   └── admin.html
├── src/
│   ├── api/             API-anrop (http, courses, bookings, users) och app-bootstrap
│   ├── auth/            Auth-logik, guards och AUTH.md kontrakt
│   ├── constants/       Routes och textkonstanter
│   ├── ui/              Render- och DOM-funktioner per vy
│   └── utils/           TypeScript helpers + Vitest-tester
├── db/
│   └── db.json          Mock-databas för JSON Server
├── assets/              Bilder, ikoner och demo-screenshot
├── vite.config.js
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

## NPM-skript

| Skript              | Beskrivning                                      |
|---------------------|--------------------------------------------------|
| `npm run dev`       | Startar Vite dev-server på port 5173             |
| `npm run api`       | Startar JSON Server på port 3001                 |
| `npm run build`     | Bygger produktionsversion till `dist/`           |
| `npm test`          | Kör alla Vitest-tester en gång                   |
| `npm run test:ui`   | Kör Vitest med interaktivt UI                    |
| `npm run typecheck` | Kör `tsc --noEmit` för typkontroll               |

## TypeScript och tester

Logiklagret är skrivet i TypeScript med full testtäckning via Vitest och Happy DOM:

| Fil                             | Innehåll                                            | Tester |
|---------------------------------|-----------------------------------------------------|--------|
| `src/utils/courseUtils.ts`      | Datumformatering, bildmatchning, bokningsvalidering | 18 st  |
| `src/utils/courseAdminUtils.ts` | Kursvalidering, prisformatering, datumkontroll      | 13 st  |

```bash
npm test           # kör alla 31 tester
npm run typecheck  # tsc --noEmit, noll fel
```

## Autentisering

Auth-lagret bygger på tre guard-funktioner med separata ansvarsområden för att undvika överlappande redirects och dubbla skydd:

- `redirectForPage(page, user)` — public-entry redirect-policy (används endast för `login.html`)
- `requireAuthUser({ redirectTo })` — auth-gate för inloggad användare
- `requireRole(role, { redirectTo })` — auth-gate + rollkontroll

Se [`src/auth/AUTH.md`](src/auth/AUTH.md) för det fullständiga kontraktet inklusive page guard-map och regler för vad man ska och inte ska göra när nya sidor läggs till.

## Miljövariabler

Variabler läses från `.env` (se `.env.example` för en mall).

| Variabel              | Beskrivning                                        |
|-----------------------|----------------------------------------------------|
| `VITE_API_BASE_URL`   | Bas-URL för JSON Server (default `http://localhost:3001`) |
| `VITE_WEATHER_KEY`    | API-nyckel för OpenWeather (visar väder på landing) |

## Licens

ISC — se `package.json`.
