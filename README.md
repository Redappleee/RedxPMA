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

## Setup

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

- `npm run dev` - ensure self-healing API daemon is running, then start frontend
- `npm run dev:web` - Next.js frontend only
- `npm run api` - Express API + Socket server (watch mode)
- `npm run api:daemon:ensure` - ensure API supervisor is running
- `npm run api:daemon:start` - start API supervisor daemon
- `npm run api:daemon:stop` - stop API supervisor + child API process
- `npm run api:daemon:status` - show supervisor and API listener status
- `npm run api:daemon:logs` - tail supervisor + API logs
- `npm run api:bg:start` - start API in background (keeps running)
- `npm run api:bg:stop` - stop background API
- `npm run api:bg:status` - check if API listens on `:4000`
- `npm run api:bg:logs` - tail background API logs
- `npm run build` - production build
- `npm run typecheck` - TypeScript checks
