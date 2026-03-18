# RedxPMA - Premium Product Management SaaS

A production-style product management platform built with modern tooling:

- Next.js 15 + App Router + TypeScript
- Tailwind CSS + custom shadcn-style UI primitives
- Framer Motion animations
- TanStack Query + Zustand
- Express REST API + MongoDB (Mongoose)
- JWT authentication + RBAC
- Socket.io real-time updates

## Folder Structure

- `/app` - Next.js app routes (public + application pages)
- `/components` - feature components and layout
- `/ui` - reusable UI primitives
- `/hooks` - custom hooks
- `/lib` - shared runtime utilities
- `/services` - API service clients
- `/store` - Zustand stores
- `/models` - Mongoose models
- `/api` - Express backend (routes, middleware, socket, controllers)
- `/utils` - helper functions
- `/types` - shared TypeScript types

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Copy envs

```bash
cp .env.example .env
```

3. Configure Google OAuth (optional)

- Create a Web OAuth client in Google Cloud Console
- Set Authorized JavaScript origin to `http://localhost:3000`
- Set both `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` in `.env`

If you run frontend on a non-default port (for example `3005`), set:

- `CLIENT_URL=http://localhost:3005`
- `CLIENT_URLS=http://localhost:3005,http://localhost:3000`

4. Start development

```bash
npm run dev
```

5. Open [http://localhost:3005](http://localhost:3005)

## Render Deployment

This repo is prepared for Render using a two-service blueprint in `render.yaml`:

- `redxpma-web` - Next.js frontend
- `redxpma-api` - Express API + Socket.IO backend

### What the blueprint configures

- separate frontend and backend web services
- production build/start commands
- generated `JWT_SECRET`
- frontend/backend URL wiring through Render service environment variables
- a persistent disk for `/uploads` on the API service

### Deploy steps

1. Push the repo to GitHub.
2. In Render, create a new Blueprint and select this repository.
3. Review the generated services from `render.yaml`.
4. Set these required secrets before first deploy:

```text
MONGO_URI
GOOGLE_CLIENT_ID (optional unless Google OAuth is enabled)
NEXT_PUBLIC_GOOGLE_CLIENT_ID (same value as GOOGLE_CLIENT_ID when Google OAuth is enabled)
```

### Google OAuth on Render

If Google login is enabled, add the frontend Render URL to the Google Cloud OAuth client as an authorized JavaScript origin:

```text
https://your-frontend-service.onrender.com
```

Use the same client ID in:

- `GOOGLE_CLIENT_ID` on the API service
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on the web service

### Notes

- The backend health endpoint is `/api/health`.
- The frontend public URL is provided by Render as `RENDER_EXTERNAL_URL`.
- Product image uploads are stored on the API service disk mounted at `/uploads`.
- MongoDB should remain external, for example MongoDB Atlas.

## Main Features

- Auth: signup/login/logout, forgot/reset password, cookie-based JWT sessions
- Google OAuth sign-in with backend ID token verification
- RBAC: admin / manager / member permissions
- Product domain: CRUD, status, stock, pricing, comments, managers
- Dashboard: analytics metrics, charting, activity feed
- Team collaboration: invite members, activity logs, notifications
- Real-time: product and notification events via Socket.io
- UI/UX: animated transitions, glassmorphism surfaces, dark/light mode

## Security Controls

- Zod input validation
- Sanitized text fields
- Helmet + CORS
- Express rate limiting
- Protected routes + role guards

## Scripts

- `npm run dev` - start API and frontend together for local development
- `npm run dev:web` - Next.js frontend only
- `npm run api` - Express API + Socket server (watch mode)
- `npm run start:web` - production frontend start using Render `PORT`
- `npm run start:api` - production API start
- `npm run api:daemon:ensure` - ensure API supervisor is running
- `npm run api:daemon:start` - start API supervisor daemon
- `npm run api:daemon:stop` - stop API supervisor + child API process
- `npm run api:daemon:status` - show supervisor and API listener status
- `npm run api:daemon:logs` - tail supervisor + API logs
- `npm run api:bg:start` - start API in background (keeps running)
- `npm run api:bg:stop` - stop background API
- `npm run api:bg:status` - check if API listens on `:4000`
- `npm run api:bg:logs` - tail background API logs
- `npm run build` - production Next.js build
- `npm run build:web` - explicit frontend build command for Render
- `npm run typecheck` - TypeScript checks
