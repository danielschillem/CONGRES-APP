# CONGRES APP

Monorepo de l'application de gestion du congres.

La nouvelle structure de travail est organisee en trois applications :

- `backend/` : API Go avec Gin, GORM et PostgreSQL.
- `frontend/` : interface web React, TypeScript, Vite et Tailwind CSS.
- `mobile/` : application mobile Flutter.

L'ancienne application Laravel a ete retiree de la racine afin de conserver cette structure comme base unique du projet.

## Backend

```bash
cd backend
cp .env.example .env
go mod download
go run ./cmd/server
```

L'API ecoute par defaut sur le port defini dans `backend/.env`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Branches

La branche principale de travail est `main`.
