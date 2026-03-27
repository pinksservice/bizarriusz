# Bizarriusz

Aplikacja webowa dla kina dla dorosłych Bizarriusz (Warszawa, Hoża 41).

## Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Express 4 + TypeScript
- **Baza danych**: PostgreSQL via Drizzle ORM
- **Auth**: Supabase JWT
- **Deploy**: Railway

---

## Lokalny development

### 1. Sklonuj repo

```bash
git clone https://github.com/TWOJ_USER/bizarriusz.git
cd bizarriusz
```

### 2. Zainstaluj zależności

```bash
npm install
```

### 3. Skonfiguruj zmienne środowiskowe

```bash
cp .env.example .env
```

Uzupełnij `.env` wartościami z panelu Supabase:
- **Supabase Dashboard → Project Settings → API**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (secret key)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Supabase Dashboard → Project Settings → Database → Connection string (Transaction mode)**
  - `DATABASE_URL`

### 4. Uruchom dev server

W dwóch terminalach:

```bash
# Terminal 1 – backend API
npm run dev

# Terminal 2 – frontend Vite
npx vite
```

Frontend: `http://localhost:5173`
API: `http://localhost:5000`

---

## Deploy na Railway

### Krok 1 – Utwórz nowy projekt na Railway

1. Wejdź na [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. Wybierz repozytorium `bizarriusz`

### Krok 2 – Dodaj zmienne środowiskowe

W zakładce **Variables** wpisz wszystkie zmienne z `.env.example`:

| Zmienna | Skąd wziąć |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret) |
| `VITE_SUPABASE_URL` | (tak samo jak SUPABASE_URL) |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon public) |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (Transaction mode, port 6543) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

> ⚠️ **Ważne**: `VITE_*` zmienne muszą być ustawione **przed buildem**, bo Vite wbudowuje je statycznie do JS. Railway build automatycznie je widzi jeśli są w Variables.

### Krok 3 – Deploy

Railway automatycznie:
1. Wykrywa `railway.json`
2. Uruchamia `npm install && npm run build` (buduje frontend do `dist/public/`)
3. Startuje `npm run start` (Express serwuje frontend + API)

### Krok 4 – Domena

Railway → **Settings → Networking → Generate Domain** → dostaniesz adres `*.up.railway.app`.

Możesz też podpiąć własną domenę (np. `bizarriusz.pl`).

---

## Architektura

```
bizarriusz/
├── client/src/
│   ├── App.tsx              # Routing (wouter)
│   ├── layout/BizLayout.tsx # Age gate, topbar, bottom nav
│   ├── pages/
│   │   ├── Dzis.tsx         # Dziś: event + chat + adres
│   │   ├── Repertuar.tsx    # Plan tygodniowy + cennik
│   │   ├── Galeria.tsx      # Galeria wnętrz
│   │   ├── Grupy.tsx        # Grupy zainteresowań
│   │   └── Ogloszenia.tsx   # Ogłoszenia
│   └── hooks/
│       ├── use-auth.ts      # Supabase auth
│       └── use-ads.ts       # Pobieranie ogłoszeń
├── server/
│   ├── index.ts             # Express entry point
│   ├── db.ts                # Drizzle + PostgreSQL
│   ├── auth.ts              # Supabase JWT middleware
│   └── routes.ts            # /api/shoutbox, /api/ads, /api/auth/user
├── shared/
│   └── schema.ts            # Drizzle tabele: shoutbox_messages, ads
├── railway.json
└── .env.example
```

## Wspólna baza danych z gay.pl

Bizarriusz używa **tego samego projektu Supabase** co gay.pl. Tabele `shoutbox_messages` i `ads` są wspólne. Nie trzeba nic migrować – dane są od razu dostępne.

---

## Kolory

| Token | Wartość |
|---|---|
| bg | `#FFFEF9` |
| ink | `#0D0D0D` |
| orange (akcent) | `#FF6B35` |
| gray | `#787878` |
| green | `#00C27A` |
