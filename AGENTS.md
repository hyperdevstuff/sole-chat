# SOLE-CHAT

**Generated:** 2026-01-13
**Commit:** 30453f7
**Branch:** dev

## OVERVIEW

Anonymous ephemeral 2-person chat rooms with auto-destruction. Next.js 16 + React 19 + Elysia API + Upstash (Redis + Realtime).

## STRUCTURE

```
src/
├── app/
│   ├── api/
│   │   ├── [[...slugs]]/   # Elysia catch-all (NOT standard Next.js API routes)
│   │   ├── rooms/          # Room creation endpoint
│   │   ├── messages/       # Message sending endpoint
│   │   └── realtime/       # WebSocket/SSE passthrough
│   ├── room/[roomId]/      # Chat room UI
│   └── page.tsx            # Home - room creation
├── lib/                    # Shared utilities
├── components/             # React components
├── hooks/                  # Custom hooks
└── proxy.ts                # Room join middleware
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `src/app/api/[[...slugs]]/route.ts` | Mount Elysia plugin |
| Room logic | `src/proxy.ts` | Join validation, 2-user limit |
| Realtime events | `src/lib/realtime.ts` | Zod schema, event types |
| Auth/session | `src/app/api/[[...slugs]]/auth.ts` | Cookie + Redis SISMEMBER |
| Redis ops | `src/lib/redis.ts` | Singleton client |
| Client API calls | `src/lib/client.ts` | Eden treaty client |

## CONVENTIONS

### API Pattern (NON-STANDARD)
- Uses **Elysia** via catch-all route, NOT Next.js API routes
- New endpoints: create Elysia plugin, mount in `[[...slugs]]/route.ts`
- Client calls via Eden treaty (`src/lib/client.ts`)

### Realtime
- Upstash Realtime, NOT raw WebSocket
- Events defined with Zod in `src/lib/realtime.ts`
- Channel per room: `chat:{roomId}`

### Room Mechanics
- 10-minute TTL on creation, synced on each message
- Max 2 users per room (atomic Lua script in `proxy.ts`)
- Auth token set via `x-auth-token` cookie on join

## ANTI-PATTERNS

- **NEVER** use standard Next.js API routes (use Elysia plugins)
- **NEVER** bypass `proxy.ts` for room access validation
- **NEVER** import `redis` client outside `src/lib/`

## UNIQUE STYLES

- Anonymous usernames: `anon-{adjective}-{nanoid(4)}` (localStorage)
- Hold-to-destroy UI pattern (2s hold time)
- React Compiler enabled (`next.config.ts`)

## COMMANDS

```bash
bun dev          # Development server
bun build        # Production build
bun start        # Start production
```

## NOTES

- Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars
- Room destruction emits `chat.destroy` event to all connected clients
- SSR client detection via `typeof window === "undefined"`
