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

## THEMING

### Architecture (Tailwind v4)

```
:root { --token: value }  →  .dark { --token: value }  →  @theme inline { --color-token: var(--token) }
                                                                    ↓
                                                          Use: bg-token, text-token, border-token
```

### Rules

1. **NEVER use `dark:` variant** in components - add semantic token to `globals.css` instead
2. **All colors via CSS variables** - no hardcoded Tailwind colors (`red-500`, `zinc-800`, etc.)
3. **Use semantic names** - `bg-surface-elevated` not `bg-neutral-800`

### Token Categories

| Category | Tokens | Usage |
|----------|--------|-------|
| Layout | `background`, `foreground`, `surface`, `surface-elevated`, `surface-sunken` | Page/card backgrounds |
| Borders | `border`, `border-strong` | Dividers, outlines |
| Text | `muted`, `muted-foreground` | Secondary text |
| Primary | `accent`, `accent-foreground` | Green accent (buttons, links) |
| Danger | `destructive`, `destructive-foreground`, `danger-subtle`, `danger-subtle-foreground` | Red/error states |
| Success | `success`, `success-foreground`, `success-subtle`, `success-subtle-foreground` | Green success states |
| Warning | `warning`, `warning-foreground`, `warning-subtle`, `warning-subtle-foreground` | Amber warning states |

### Adding New Tokens

```css
/* 1. Add to :root in globals.css */
:root {
  --my-token: #hexvalue;
}

/* 2. Add dark override in .dark */
.dark {
  --my-token: #dark-hexvalue;
}

/* 3. Map in @theme inline */
@theme inline {
  --color-my-token: var(--my-token);
}
```

Then use: `bg-my-token`, `text-my-token`, `border-my-token`

### Anti-Patterns

```tsx
// ❌ WRONG - hardcoded dark variant
className="bg-green-100 dark:bg-green-600/20"

// ✅ CORRECT - semantic token
className="bg-success-subtle"

// ❌ WRONG - raw Tailwind color
className="text-neutral-400"

// ✅ CORRECT - semantic token
className="text-muted"

// ❌ WRONG - hardcoded color with dark variant
className="text-red-600 dark:text-red-400"

// ✅ CORRECT - semantic token
className="text-destructive"
```

### Quick Reference

| Need | Use |
|------|-----|
| Page background | `bg-background` |
| Card/modal background | `bg-surface-elevated` |
| Input background | `bg-surface-sunken` |
| Primary text | `text-foreground` |
| Secondary text | `text-muted` |
| Border | `border-border` |
| Green button | `bg-accent text-accent-foreground` |
| Red button | `bg-destructive text-destructive-foreground` |
| Soft green bg | `bg-success-subtle text-success-subtle-foreground` |
| Soft red bg | `bg-danger-subtle text-danger-subtle-foreground` |
| Timer warning | `text-warning` |
| Timer critical | `text-destructive` |

## COMMANDS

```bash
bun dev          # Development server
bun run build        # Production build
bun start        # Start production
```

## NOTES

- Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars
- Room destruction emits `chat.destroy` event to all connected clients
- SSR client detection via `typeof window === "undefined"`
