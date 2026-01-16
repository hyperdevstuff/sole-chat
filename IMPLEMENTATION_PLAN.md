# Implementation Plan

**Updated:** 2026-01-16 (Planning Review)
**Branch:** dev
**Last Commit:** 13f6f25 fix: silent catch blocks

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

- [x] Handle Upstash Realtime disconnections (providers.tsx, page.tsx)
  - RealtimeProvider configured with maxReconnectAttempts={5}
  - Upstash Realtime auto-handles exponential backoff internally
  - Re-emits join event on successful reconnection
  - Shows "Reconnecting" indicator and toasts for status changes
  - Acceptance: Connection recovers after network blip

## Priority 3: UI/UX Improvements (Use frontend-ui-ux-engineer)

### Accessibility

- [x] Add aria-labels to buttons (files: `src/app/page.tsx`, `src/components/*.tsx`)
  - Moved exit button to rightmost position in header
  - Added aria-labels to: Create Room, Join, Exit, Copy, Destroy, Send buttons
  - Added aria-label to message input
  - Acceptance: All interactive elements have accessible names

- [x] Add focus trap to modals (files: `src/components/destruct-modal.tsx`, `expired-modal.tsx`)
  - Created reusable `useFocusTrap` hook in `src/hooks/use-focus-trap.ts`
  - Added aria-modal="true" and role="dialog" to both modals
  - Tab cycles within modal, Shift+Tab cycles backwards
  - Focus auto-set to first button, restored on close
  - Added Escape key handling to ExpiredModal for consistency
  - Acceptance: Tab key cycles within modal only

### Mobile Responsiveness

- [x] Fix viewport height on mobile (file: `src/app/room/[roomId]/page.tsx:412`)
  - Changed `h-screen max-h-screen` to `h-svh max-h-svh` (small viewport height)
  - Changed `min-h-screen` to `min-h-svh` in `src/app/page.tsx:53`
  - Fixes iOS Safari address bar issue
  - Acceptance: Chat fills viewport correctly on iOS

### Loading States

- [x] Add skeleton loader for message history (file: `src/app/room/[roomId]/page.tsx`)
  - Created inline MessageSkeleton component with 4 animated placeholder bubbles
  - Alternating left/right alignment to mimic conversation
  - Uses animate-pulse for shimmer effect with bg-neutral-800
  - Shows skeleton when historyQuery.isLoading is true
  - Acceptance: Visual feedback during initial load

### Typing Indicator Enhancement

- [x] Improve typing indicator animation (file: `src/app/room/[roomId]/page.tsx`)
  - Created TypingIndicator component with 3 bouncing dots
  - Staggered animation delays (0s, 0.15s, 0.3s)
  - Subtle container with bg-neutral-800/30 rounded-full
  - Uses TailwindCSS animate-bounce with [animation-duration:1s]
  - Acceptance: Smooth bouncing dot animation

## Priority 4: Testing

### Test Infrastructure Setup

- [x] Initialize Playwright for E2E tests
  - Installed @playwright/test with TypeScript
  - Created playwright.config.ts with Chromium only
  - Added test:e2e and test:e2e:ui scripts to package.json
  - Created tests/ directory with 4 E2E test files
  - Note: Requires `bunx playwright install-deps` on fresh systems
  - Acceptance: `bun run test:e2e` works (requires browser deps)

### E2E Tests (Playwright)

- [x] Test room creation flow (file: `tests/room-creation.spec.ts`)
  - Create room, verify URL generated, auto-copy works
  - Acceptance: E2E test passes

- [x] Test 2-user limit enforcement (file: `tests/user-limit.spec.ts`)
  - User 1 joins, User 2 joins, User 3 should see "room full"
  - Acceptance: Third user cannot join

- [x] Test message delivery (file: `tests/message-delivery.spec.ts`)
  - Send message, verify other user receives via realtime
  - Acceptance: <100ms delivery verified

- [x] Test room destruction (file: `tests/room-destruction.spec.ts`)
  - Hold button 2s, verify both users redirected
  - Acceptance: Room destroyed, Redis cleaned

### Unit Tests

- [x] Test Lua scripts in isolation (file: `src/lib/__tests__/lua-scripts.test.ts`)
  - Created `src/lib/lua-scripts.ts` with exported JOIN_SCRIPT and LEAVE_SCRIPT
  - 9 tests covering: empty room join, 1-user join, 2-user rejection, idempotent join
  - Leave moves to leaving set, leave sets TTL, leave without connected
  - Rejoin flow after leave, full integration test
  - Acceptance: All edge cases covered

## Priority 5: Code Quality

### Debug Code Cleanup

- [x] Remove console.log from proxy.ts (file: `src/proxy.ts:10`)
  - Production code should not have debug logging
  - Acceptance: No console.log in production code

### Dead Code Removal

- [x] Remove commented code in messages/index.ts (file: `src/app/api/messages/index.ts:28-29`)
  - Clean up unused/commented code
  - Acceptance: No commented-out code blocks

### Constants Refactor

- [x] Extract hardcoded constants to config (file: `src/lib/constants.ts`)
  - Created constants for all TTL, timeout, and threshold values
  - Updated rooms/index.ts, destruct-button.tsx, room page
  - Acceptance: Single source of truth for magic numbers

### Error Handling Audit

- [x] Review silent catch blocks (files: multiple)
  - Audited 5 catch blocks across 2 files
  - Added console.warn to reconnection join emit
  - Added toast feedback to copyLink() failure
  - Acceptance: All catch blocks either log or notify

## Priority 6: Type Safety (Discovered Issue)

### createdAt Type Inconsistency

- [x] Fix type mismatch between proxy.ts and rooms/index.ts (files: `src/proxy.ts:11`, `src/app/api/rooms/index.ts:29`)
  - Changed proxy.ts to type createdAt as `string` (matches Redis storage)
  - rooms/index.ts already correct with `string` type and parseInt parsing
  - Acceptance: Consistent typing across files

## Future Enhancements

### Heartbeat System (Reliability)

- [ ] Implement heartbeat for zombie connection detection
  - Current: beforeunload is unreliable (doesn't fire on mobile/crash)
  - Solution: Periodic ping from client, server-side timeout tracking
  - Consider: WebSocket ping/pong or periodic /api/heartbeat calls
  - Acceptance: Zombie slots freed within 60s

### Scroll Behavior (UX)

- [ ] Handle "user scrolled up" case for new messages
  - Current: Auto-scrolls regardless of user position
  - Solution: Track scroll position, show "new messages" indicator when scrolled up
  - Only auto-scroll if user is at bottom (within threshold)
  - Acceptance: User scroll position preserved, badge shows new message count

### Reusable UI Components (DX)

- [ ] Extract common UI patterns to shared components
  - Button component (variants: primary, secondary, danger)
  - Input component with consistent styling
  - Empty state component
  - Acceptance: Consistent UI, reduced duplication

### Mobile UX Improvements

- [ ] Improve mobile ergonomics for DestructButton
  - Current: Hold-to-destroy may be awkward on mobile
  - Consider: Alternative mobile gesture or confirmation flow
  - Acceptance: User testing confirms usability

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
- [x] Connection recovery with auto-reconnection and re-join

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
- Message deduplication by ID on client side
- TypingIndicator uses staggered bounce animation

### Test Coverage Summary

| Area | Coverage | Notes |
|------|----------|-------|
| Lua scripts | High | 9 unit tests, edge cases covered |
| E2E flows | High | 4 test files covering core flows |
| API integration | None | No dedicated API tests |
| React hooks | None | No unit tests for hooks |
| Error boundaries | None | No error boundary tests |

### Risks

- No heartbeat = can't detect zombie connections
- beforeunload doesn't always fire (mobile, crash)
- E2E tests require live Upstash Redis
- Consider server-side connection tracking for production

### Tool Usage

| Task | Tool |
|------|------|
| UI changes | `frontend-ui-ux-engineer` agent (MANDATORY) |
| E2E tests | Playwriter MCP |
| API docs | Context7 (`/upstash/realtime`, `/elysiajs/elysia`) |
| Debug | Chrome DevTools MCP |
| Examples | Exa web search |
