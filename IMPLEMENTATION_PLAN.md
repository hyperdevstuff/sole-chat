# Implementation Plan

## Completed

- [x] Room creation/joining with 2-user limit
- [x] Realtime messaging
- [x] Hold-to-destroy pattern
- [x] Anonymous usernames
- [x] Join system messages
- [x] Typing indicators
- [x] TTL warnings with keep-alive
- [x] Export on destruct

### Priority 1: Edge Case Handling

- [x] 1.1 Add `chat.leave` event to realtime schema
- [x] 1.2 Handle `chat.leave` in room page
- [x] 1.3 Client-side join message deduplication
- [x] 1.4 Add `beforeunload` leave emission
- [x] 1.5 Create leave API endpoint
- [x] 1.6 Update proxy.ts for grace period rejoin
- [x] 1.7 Add Exit button (non-destructive leave)
- [x] 1.8 Connection status indicator
- [x] 1.9 Room expired modal (TTL = 0)

### Priority 2: UI Polish

- [x] Style connection status indicator (subtle pulse animation)
- [x] Style exit button to complement destruct button (ghost style with border)
- [x] Add subtle animation for leave system messages (fade-in)

## Notes

### Architecture Decisions
- **`beforeunload` limitation**: Unreliable on mobile/crash, but covers 80% of cases
- **Grace period**: 30s allows accidental refresh recovery without blocking new users indefinitely
- **Client-side dedupe**: Simpler than server-side, solves UX issue directly
- **No heartbeat**: Avoided complexity; connection status indicator provides awareness

### Redis Key Structure
- `connected:{roomId}` - SET of active auth tokens (max 2)
- `leaving:{roomId}` - SET of tokens in grace period (30s TTL per token)
- `meta:{roomId}` - HASH with room metadata

### Event Flow: User Leaves
1. User clicks Exit OR closes tab
2. `beforeunload`/button triggers POST to `/api/rooms/:roomId/leave`
3. Server: SREM token from `connected`, SADD to `leaving` with TTL
4. Server: emit `chat.leave` event
5. Other user: receives leave event, shows "X left" message

### Event Flow: User Rejoins (within 30s)
1. User navigates to room URL
2. `proxy.ts`: token not in `connected` but found in `leaving`
3. SMOVE token from `leaving` back to `connected`
4. Page loads, `chat.join` emitted
5. Client-side dedupe: "X joined" not shown again if already in systemMessages
