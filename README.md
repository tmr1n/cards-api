# LangCards API

Backend für **LangCards** — eine Lernkarten-App zum Sprachenlernen. REST-API auf Basis von NestJS.

> Nicht-kommerzielles Lernprojekt.

## Tech-Stack

- **NestJS 11** (Node.js, TypeScript)
- **Prisma ORM** + **PostgreSQL**
- **JWT**-Authentifizierung + Refresh-Tokens, **Google OAuth**
- **Nodemailer** (E-Mail-Versand), **Swagger** (API-Dokumentation)
- **Docker** (PostgreSQL + Mailpit), **GitHub Actions** (CI)

## Lokal starten

Voraussetzung: Docker und Node.js 22.

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
| `src/auth` | Registrierung, Login, Tokens, Google OAuth, Passwort-Reset |
| `src/users` · `src/decks` · `src/cards` | Domänenmodule (Nutzer, Stapel, Karten) |
| `src/mail` | E-Mail-Versand (Nodemailer) |
| `src/prisma` | Datenbankzugriff (Prisma) |
| `prisma/` | Schema und Migrationen |

## Tests

```bash
npm test
```

## Frontend

Das zugehörige Frontend (Next.js) liegt in einem separaten Repository (LangCards Frontend).
