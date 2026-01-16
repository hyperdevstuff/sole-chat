# Architecture Specification

## Overview

Sole-Chat is an anonymous ephemeral 2-person chat application with auto-destruction.

## Core Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16 + React 19 | SSR, routing, React Compiler |
| API | Elysia (via catch-all route) | Type-safe API with Eden client |
| Realtime | Upstash Realtime | WebSocket/SSE for live messages |
| Storage | Upstash Redis | Ephemeral room/message storage |
| Styling | TailwindCSS v4 | Utility-first CSS |

## Key Architectural Decisions

### 1. Elysia over Next.js API Routes
- All API endpoints via `src/app/api/[[...slugs]]/route.ts`
- Eden treaty client for type-safe client calls
- Plugins mounted in catch-all, NOT separate route files

### 2. Room Mechanics
- Max 2 users per room (atomic Lua script validation)
- 10-minute TTL, refreshed on each message
- Auth token via `x-auth-token` cookie on join
- Room destruction broadcasts `chat.destroy` event

### 3. Realtime Pattern
- Upstash Realtime (NOT raw WebSocket)
- Channel naming: `chat:{roomId}`
- Events defined with Zod schemas in `src/lib/realtime.ts`

### 4. State Management
- TanStack Query for server state
- localStorage for anonymous username persistence
- No global client state library needed

## Data Flow

```
User Action → Eden Client → Elysia API → Redis → Upstash Realtime → All Clients
```

## Security Model

- Anonymous users (no auth system)
- Room access validated via Redis SISMEMBER
- Token stored in httpOnly cookie
- Room auto-expires (no manual cleanup needed)
