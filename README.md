# DiabetCare — Frontend

Aplikacja webowa typu CGM (Continuous Glucose Monitoring) do zarządzania cukrzycą. Wyłącznie frontend — backend jest w pełni zamockowany.

## Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Style | CSS Modules (plain CSS z design tokenami) |
| Czcionki | Outfit (nagłówki), Manrope (treść) — Google Fonts |
| Ikony | Inline SVG (własny komponent `Icon`) |

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja działa na `http://localhost:5173`.

## Logowanie (mock)

Backend nie istnieje — API jest w pełni zasymulowane przez pliki w `src/mocks/`.
Sesja przechowywana w `sessionStorage` (kasowana po zamknięciu przeglądarki).

| Login | Hasło |
|---|---|
| `admin` | `admin` |
| `anna.kowalska@example.com` | `admin` |

## Struktura projektu

```
src/
├── components/          # Komponenty UI (Button, Card, Icon, Input)
├── design-system/       # Tokeny projektowe (kolory, spacing, promienie)
├── features/
│   ├── login/           # Ekran logowania
│   ├── dashboard/       # Ekran główny (kafelki: glikemia, statystyki, wykres)
│   │   └── tiles/       # Rejestr kafelków dashboardu
│   ├── account/         # Profil użytkownika + parametry kliniczne
│   └── placeholder/     # Widok zastępczy dla niezaimplementowanych zakładek
├── layouts/
│   └── AppShell.tsx     # Nawigacja dolna + nagłówek aplikacji
├── mocks/               # Zamockowane API
│   ├── api.ts           # Funkcje api.login(), api.getCurrentUser() itp.
│   └── types.ts         # Typy danych
└── index.css            # Globalne CSS i design tokeny (zmienne CSS)
```

## Widoki aplikacji

| Zakładka | Status | Opis |
|---|---|---|
| Główny | ✅ Zaimplementowany | Bieżąca glikemia, TIR/GMI/IOB, wykres 24h |
| Glikemia | 🔧 Placeholder | Historia pomiarów (w przygotowaniu) |
| Posiłki | 🔧 Placeholder | Kalkulator posiłków (w przygotowaniu) |
| Insulina | 🔧 Placeholder | Kalkulator bolusa (w przygotowaniu) |
| Konto | ✅ Zaimplementowany | Profil, parametry kliniczne, preferencje |

## Mock API — dostępne funkcje

```ts
api.login(email, password)       // Logowanie — walidacja credentials
api.getCurrentUser()             // Zwraca zalogowanego użytkownika lub rzuca błąd
api.logout()                     // Kasuje sesję
api.getCurrentGlycemia()         // Aktualny odczyt CGM
api.getGlycemia24h()             // Dane wykresu 24h
api.getDashboardStats()          // Statystyki: TIR, GMI, IOB
api.getAccountProfile()          // Profil + parametry kliniczne
```

## Design

Projekt bazuje na makietach Figma. Tokeny kolorystyczne:

- **Primary** — teal `#087E8B` (główny kolor akcji)
- **Tertiary** — zielony `#2E7D32` (strefa docelowa glikemii)
- **Neutral** — szarości od `#F8F9FA` do `#1A1F24`
