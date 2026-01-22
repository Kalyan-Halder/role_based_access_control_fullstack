# RBAC (Invite-based) — Next.js + Express + MongoDB

A full-stack Role-Based Access Control (RBAC) app with:
- **JWT login**
- **Invite-only registration** (Admin sends an invite link)
- **Admin user management** (change roles, activate/deactivate)
- **Projects module**
  - Authenticated users can **list** projects
  - Admin can **archive/unarchive** and **soft-delete**

---

## Features

- Authentication with **JWT** (1 day expiry)
- Roles: **ADMIN**, **MANAGER**, **STAFF**
- Invite flow:
  1. Admin creates invite for an email + role
  2. Backend stores invite token (24h expiry)
  3. Backend sends invite email (Gmail API)
  4. User registers using invite token

---

## Tech Stack

### Frontend
- Next.js (Pages Router)
- React
- TanStack React Query
- Tailwind CSS
- Heroicons

### Backend
- Express (TypeScript)
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- Gmail API via `googleapis` (OAuth2) for invite emails

---

## Repo Structure (logical)

```
/backend
  app.ts
  router/routes.ts
  middleware/auth.ts
  models/{user,invite,project}.ts
  utils/{connection,errors,inviteEmail}.ts

/src
  pages/{_app,login,register,index,projects,users}.tsx
  context/AuthContext.tsx
  lib/{api,auth}.ts
  components/{Nav,RequireAuth}.tsx
  styles/globals.css
```

---

## Setup

### Prerequisites
- Node.js 18+ recommended
- MongoDB (local or Atlas)
- Google OAuth2 credentials (only if you want invite emails)

> Important: as currently written, the backend **requires Gmail env vars at startup**.

---

## 1) Backend Setup (Express + MongoDB)

### Install
```bash
cd backend
npm install
```

### Configure environment
Create `backend/config.env`:

```env
# Server
PORT=5000
JWT_SECRET=replace_it_with_your_own_secret
FRONTEND_URL=http://localhost:3000

# Mongo
DB=mongodb://127.0.0.1:27017/rbac

# Dev-only admin seed
ALLOW_SEED=true

# Gmail OAuth (required by current backend code at startup)
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REDIRECT_URL=https://developers.google.com/oauthplayground
REFRESH_TOKEN=your_refresh_token
OAUTH_USER=your_sender_email@gmail.com
```

### Run (dev)
The backend is TypeScript (`app.ts`). There are no ready-made scripts in `backend/package.json`, so use one of these:

**Option A — quick run**
```bash
npx ts-node app.ts
```

**Option B — recommended: add scripts**
Add this to `backend/package.json`:
```jsonc
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/app.js",
    "dev": "ts-node app.ts"
  }
}
```

Then:
```bash
npm run dev
```

Backend will run on:
- `http://localhost:5000`
- API base: `http://localhost:5000/api`

---

## 2) Frontend Setup (Next.js)

### Install
From the frontend root (where the frontend `package.json` is):
```bash
npm install
```

### Configure environment
Create `.env.local` in the frontend root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
Use any backend root if you have any. and modify it.
### Run
```bash
npm run dev
```

Frontend will run on:
- `http://localhost:3000`

---

## First Admin (dev-only seed)

Backend includes a dev-only seed route that only works if:
- `ALLOW_SEED=true`
- no existing `ADMIN` user exists yet

```bash
curl -X POST http://localhost:5000/api/dev/seed-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"admin123"}'
```

Then login at:
- `http://localhost:3000/login`

---

## How It Works (Architecture)

### Frontend architecture
- **AuthContext** stores `{token, user}` and persists it in `localStorage` under `auth_state_v1`.
- **apiFetch(path, options)**:
  - Adds `Authorization: Bearer <token>` if token exists
  - If the backend returns `401`, it clears auth storage (forces logout next render)
- **RequireAuth** component guards protected pages and redirects to `/login` when unauthenticated.
- **TanStack React Query** handles:
  - caching
  - optimistic-ish UI patterns (invalidate & refetch on mutations)
  - server-state synchronization

### Backend architecture
- `app.ts`:
  - loads env from `./config.env`
  - enables `cors()` and `express.json()`
  - mounts router at `/api`
  - uses `notFound` + `errorHandler`
- `utils/connection.ts` connects to Mongo via `process.env.DB`
- `middleware/auth.ts`:
  - `requireAuth` verifies `Bearer <JWT>` and loads user role/status from DB
  - `requireAdmin` checks `req.user.role === "ADMIN"`

### Data models (MongoDB via Mongoose)
- **User**
  - `name`, `email` (unique), `password` (hashed via bcrypt pre-save)
  - `role`: ADMIN | MANAGER | STAFF
  - `status`: ACTIVE | INACTIVE
- **Invite**
  - `email`, `role`
  - `token` (unique), `expiresAt`, `acceptedAt`
- **Project**
  - `name`, `description`
  - `status`: ACTIVE | ARCHIVED | DELETED
  - `isDeleted` (soft-delete flag)
  - `userID`, `creator_Name`, `creator_Email` (creator metadata)

---

## RBAC (Roles & Permissions)

### Enforced server-side
- **Admin-only**
  - Create invites
  - List users
  - Update user role/status
  - Patch projects
  - Delete (soft-delete) projects

### Everyone authenticated
- View projects
- Create project (see “Known issues” — current implementation has a bug)

---

## API Endpoints

Base: `/api`

### Health
- `GET /` → `"This is the Home Page"` (plain text)

### Dev
- `POST /dev/seed-admin` → creates first admin (only if `ALLOW_SEED=true` and no admin exists)

### Auth
- `POST /auth/login`
  - body: `{ email, password }`
  - returns: `{ token, user }`

- `POST /auth/invite` (**ADMIN**)
  - body: `{ email, role }`
  - creates invite, emails invite link
  - returns: `{ invite, inviteUrl, inviteLink }`

- `POST /auth/register-via-invite`
  - body: `{ token, name, password }`
  - creates user using invite email + role

### Users (**ADMIN**)
- `GET /users?page=1&limit=10`
  - returns: `{ page, limit, total, items }` (NOTE: frontend expects more fields; see “Known issues”)
- `PATCH /users/:id/role`
  - body: `{ role }`
- `PATCH /users/:id/status`
  - body: `{ status }`

### Projects
- `POST /projects` (authenticated)
  - body: `{ name, description, userID }` (NOTE: frontend currently does NOT send `userID`; see “Known issues”)
- `GET /projects` (authenticated)
- `PATCH /projects/:id` (**ADMIN**)
  - body: `{ name?, description?, status?: ACTIVE|ARCHIVED }`
- `DELETE /projects/:id` (**ADMIN**)
  - soft-deletes: sets `isDeleted=true` and `status="DELETED"`

---

 



