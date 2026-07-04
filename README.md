# LangCards API

Backend für **LangCards** — eine Lernkarten-App zum Sprachenlernen. REST-API auf Basis von NestJS.

[![CI](https://github.com/tmr1n/cards-api/actions/workflows/ci.yml/badge.svg)](https://github.com/tmr1n/cards-api/actions/workflows/ci.yml)

> Nicht-kommerzielles Lernprojekt. **[Live-API-Doku (Swagger)](https://cards-api-production-92cf.up.railway.app/api/docs)**

## Features

- **Auth mit zwei Tokens**: kurzlebiges Access-JWT (15 Min.) + Refresh-Token (30 Tage) in der `Session`-Tabelle — serverseitig widerrufbar, als httpOnly-Cookie gesetzt
- **Google OAuth 2.0** (Passport-Strategie) inkl. Konto-Verknüpfung, wenn die E-Mail bereits mit Passwort registriert ist
- **Demo-Gastzugang**: `POST /demo` erstellt ein temporäres Konto; beim Logout wird es mitsamt allen Daten in einer Transaktion gelöscht
- **Sicherheit**: bcrypt-Passwort-Hashing, Rate-Limiting (global 100/min, Login 5/min pro IP), `secure` httpOnly-Cookies, Besitz-Prüfung bei allen Deck-/Karten-Zugriffen
- **E-Mail-Versand**: Brevo HTTP-API in Produktion (die Hosting-Plattform blockiert ausgehendes SMTP), Nodemailer + Mailpit in der lokalen Entwicklung
- **Swagger/OpenAPI**-Dokumentation, **GitHub Actions** CI (Build + Tests)

## Tech-Stack

- **NestJS 11** (Node.js, TypeScript)
- **Prisma ORM** + **PostgreSQL**
- **Passport** (JWT- und Google-Strategie), **@nestjs/throttler**
- **Docker Compose** (PostgreSQL + Mailpit für die lokale Entwicklung)
- Hosting: **Railway** (EU, Amsterdam) — App, PostgreSQL und Frontend als getrennte Services

## Datenmodell

```
User 1──n Deck 1──n Card
 │
 ├──n Session                 (Refresh-Tokens)
 ├──n PasswordResetToken
 └──n EmailVerificationToken
```

Kein DB-seitiges Cascade-Delete: beim Löschen eines Kontos werden alle abhängigen Daten explizit in einer **Prisma-Transaktion** entfernt (alles oder nichts).

<!-- TODO: Excalidraw-Architekturdiagramm einfügen (docs/architecture.png) -->

## Lokal starten

Voraussetzung: Docker und Node.js 22 (oder Bun).

```bash
# 1. Datenbank + Mailserver (Docker) starten
docker compose up -d

# 2. Abhängigkeiten installieren
npm install

# 3. .env anlegen (Vorlage: .env.example), dann Migrationen ausführen
npx prisma migrate deploy

# 4. Entwicklungsserver starten
npm run start:dev
```

- API: `http://localhost:3001`
- Swagger-Doku: `http://localhost:3001/api/docs`
- Mailpit (abgefangene E-Mails im Dev): `http://localhost:8025`

## Struktur

| Ordner | Inhalt |
|--------|--------|
| `src/auth` | Registrierung, Login, Tokens, Google OAuth, Demo-Login, Passwort-Reset |
| `src/users` · `src/decks` · `src/cards` | Domänenmodule (Nutzer, Stapel, Karten) |
| `src/mail` | E-Mail-Versand (Brevo API / Nodemailer) |
| `src/prisma` | Datenbankzugriff (Prisma) |
| `prisma/` | Schema und Migrationen |

## Tests

```bash
npm test
```

## Frontend

Das zugehörige Frontend (Next.js) liegt in einem separaten Repository: [tmr1n/projectcards](https://github.com/tmr1n/projectcards).
