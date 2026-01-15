# Implementation Plan

**Updated:** 2026-01-15
**Branch:** dev
**Last Commit:** efed18b feat: add leave/rejoin system

## Priority 1: Critical Bugs

### Race Condition in Room Join
- [x] Fix cookie set before Lua script confirms join (file: `src/proxy.ts:32-59`)
  - Move cookie setting AFTER Lua script returns 1 (success)
  - If Lua returns 0 (room full), return 403 without setting cookie
  - Acceptance: User cannot have auth cookie if not in connected set

### Redis Key Mismatch in Room Deletion
- [x] Fix DELETE route cleaning wrong key (commit: ad87430)
  - Changed `users:{roomId}` to `connected:{roomId}`
  - Added `leaving:{roomId}` cleanup
  - Acceptance: All Redis keys for room are deleted on destruction

### Security: Token in Message History
- [x] Remove auth token from stored messages (file: `src/app/api/messages/index.ts:24`)
  - Don't include `token` in the object pushed to Redis list
  - Token should only be in request validation, not persisted
  - Acceptance: Messages in Redis have no token field

### Memory Leak in Chat Room
- [x] Clean up typingTimeoutRef on unmount (file: `src/app/room/[roomId]/page.tsx:117-121`)
  - Add clearTimeout in useEffect cleanup
  - Acceptance: No dangling timeout references

## Priority 2: Error Handling & Reliability

### Silent Error Handling
- [x] Add proper error handling for realtime emit (file: `src/app/room/[roomId]/page.tsx:210`)
  - Show toast on join emit failure
  - Handle typing emit errors gracefully (only for typing=true to avoid spam)
  - Acceptance: User sees error toast when emit fails

### Connection Recovery
- [ ] Handle Upstash Realtime disconnections
  - Implement reconnection with exponential backoff
  - Show connection status indicator updates
  - Acceptance: Connection recovers after network blip

## Priority 3: UI/UX Improvements (Use frontend-ui-ux-engineer)

### Accessibility
- [ ] Add aria-labels to buttons (files: `src/app/page.tsx`, `src/components/*.tsx`)
  - Create Room, Join, Exit, Destroy buttons
  - Acceptance: All interactive elements have accessible names

- [ ] Add focus trap to modals (files: `src/components/destruct-modal.tsx`, `expired-modal.tsx`)
  - Trap focus within modal when open
  - Add aria-modal="true" and role="dialog"
  - Acceptance: Tab key cycles within modal only

### Mobile Responsiveness
- [ ] Fix viewport height on mobile (file: `src/app/room/[roomId]/page.tsx`)
  - Change `h-screen` to `h-svh` (small viewport height)
  - Fixes iOS Safari address bar issue
  - Acceptance: Chat fills viewport correctly on iOS

### Loading States
- [ ] Add skeleton loader for message history
  - Show animated placeholders while loading
  - Acceptance: Visual feedback during initial load

### Typing Indicator Enhancement
- [ ] Improve typing indicator animation
  - Add dot-bounce animation instead of static text
  - Acceptance: More polished typing indicator

## Priority 4: Testing (Zero tests exist)

### E2E Tests (Playwright)
- [ ] Test room creation flow
  - Create room, verify URL generated, auto-copy works
  - Acceptance: E2E test passes

- [ ] Test 2-user limit enforcement
  - User 1 joins, User 2 joins, User 3 should see "room full"
  - Acceptance: Third user cannot join

- [ ] Test message delivery
  - Send message, verify other user receives via realtime
  - Acceptance: <100ms delivery verified

- [ ] Test room destruction
  - Hold button 2s, verify both users redirected
  - Acceptance: Room destroyed, Redis cleaned

### Unit Tests
- [ ] Test Lua scripts in isolation
  - Join script with 0, 1, 2 users
  - Leave script with grace period
  - Acceptance: All edge cases covered

## Completed

- [x] Room creation with unique ID (commit: initial)
- [x] Realtime messaging with Upstash (commit: initial)
- [x] Hold-to-destroy pattern - 2s hold time (commit: initial)
- [x] Anonymous usernames - anon-{adjective}-{nanoid(4)} (commit: initial)
- [x] Join system messages (commit: initial)
- [x] Typing indicators (commit: initial)
- [x] TTL warnings with keep-alive button (commit: initial)
- [x] Export chat on destruct (commit: initial)
- [x] Leave/rejoin with 30s grace period (commit: efed18b)
- [x] Exit button (commit: efed18b)
- [x] Connection status indicator (commit: initial)
- [x] Room expired modal (commit: initial)

## Blocked

_None currently_

## Notes

### Key Decisions
- Elysia over Next.js API routes (better DX, Eden treaty client)
- Upstash Realtime over raw WebSocket (managed, scales automatically)
- 30s grace period for leave/rejoin (balance between UX and slot availability)
- beforeunload is unreliable - server-side heartbeat may be needed for production

### Redis Key Schema
```
connected:{roomId}  - SET of auth tokens (max 2)
leaving:{roomId}    - SET of tokens in grace period
meta:{roomId}       - HASH with creator info
messages:{roomId}   - LIST of messages
```

### Patterns Discovered
- Hold-to-destroy uses clip-path animation for visual feedback
- TTL refreshed on every message send
- All realtime events defined with Zod in `src/lib/realtime.ts`

### Risks
- No heartbeat = can't detect zombie connections
- beforeunload doesn't always fire (mobile, crash)
- Consider server-side connection tracking for production

### Tool Usage
| Task | Tool |
|------|------|
| UI changes | `frontend-ui-ux-engineer` agent (MANDATORY) |
| E2E tests | Playwriter MCP |
| API docs | Context7 (`/upstash/realtime`, `/elysiajs/elysia`) |
| Debug | Chrome DevTools MCP |
| Examples | Exa web search |
