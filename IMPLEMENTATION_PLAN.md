# Implementation Plan

## Priority 1: Edge Case Handling

### 1.1 Add `chat.leave` event to realtime schema
- [ ] Update `src/lib/realtime.ts`
  - Add `leave` event schema: `{ username: string, timestamp: number }`
  - Acceptance: Event type available in `RealtimeEvents`

### 1.2 Handle `chat.leave` in room page
- [ ] Update `src/app/room/[roomId]/page.tsx`
  - Add `chat.leave` to `events` array in `useRealtime`
  - Handle in `handleRealtimeData`: show "X left" system message
  - Acceptance: When leave event received, shows italicized system message

### 1.3 Client-side join message deduplication
- [ ] Update `src/app/room/[roomId]/page.tsx`
  - In `chat.join` handler, check if username already has a join message in `systemMessages`
  - Only add "X joined" if not already present for that username
  - Acceptance: User exits and rejoins -> no duplicate "joined" message

### 1.4 Add `beforeunload` leave emission
- [ ] Update `src/app/room/[roomId]/page.tsx`
  - Add `useEffect` with `beforeunload` event listener
  - Use `navigator.sendBeacon` to POST leave event (more reliable than fetch on unload)
  - Cleanup listener on unmount
  - Acceptance: Closing tab sends leave event to other user

### 1.5 Create leave API endpoint
- [ ] Create Elysia plugin in `src/app/api/[[...slugs]]/`
  - POST `/api/rooms/:roomId/leave`
  - Extract token from `x-auth-token` cookie
  - Lua script: SREM from `connected:{roomId}`, SADD to `leaving:{roomId}` with 30s TTL
  - Emit `chat.leave` via realtime
  - Return success
  - Acceptance: Token moved to grace set, leave event broadcast

### 1.6 Update proxy.ts for grace period rejoin
- [ ] Update `src/proxy.ts`
  - After checking `connected:{roomId}`, also check `leaving:{roomId}`
  - If token found in leaving set: SMOVE back to connected set
  - This allows 30s grace window for rejoin
  - Acceptance: User who left within 30s can rejoin seamlessly

### 1.7 Add Exit button (non-destructive leave)
- [ ] Update `src/app/room/[roomId]/page.tsx` or create component
  - Add "Exit" button in header (next to destruct button)
  - onClick: call leave API, emit leave event, redirect to "/"
  - Style: subtle, not destructive red
  - Acceptance: User can leave room without destroying it

### 1.8 Connection status indicator
- [ ] Update `src/app/room/[roomId]/page.tsx`
  - Destructure `status` from `useRealtime` return value
  - Add `onStatusChange` callback for logging
  - Show visual indicator in header when `status !== "connected"`
    - "reconnecting" -> pulsing yellow dot
    - "error" -> red dot with "Connection lost"
  - Acceptance: Network interruption shows visual feedback

### 1.9 Room expired modal (TTL = 0)
- [ ] Create `src/components/expired-modal.tsx`
  - Reuse styling from `destruct-modal.tsx`
  - Props: `isOpen`, `onExport`, `onCreateNew`
  - **Key differences from destruct-modal**:
    - No `onClose` - modal is unclosable (no escape, no backdrop click)
    - No "Just Destroy" - room is already dead
    - No "Cancel" - no going back
  - Buttons:
    - "Export Chat" (green) -> downloads .txt, stays on modal
    - "Create New Room" (neutral) -> navigates to "/"
  - Title: "Room Expired"
  - Message: "This room has expired. Export your chat or start fresh."
  - Acceptance: Modal blocks all interaction, only two actions available

- [ ] Update `src/app/room/[roomId]/page.tsx`
  - Add `showExpiredModal` state
  - In countdown effect: when `timeRemaining` hits 0, set `showExpiredModal = true`
  - Render `<ExpiredModal>` with handlers
  - **Disable chat input** when expired (disable input + send button)
  - Acceptance: At TTL 0, modal appears, chat becomes unusable

## Priority 2: UI Polish (delegate to frontend-ui-ux-engineer)

- [ ] Style connection status indicator
- [ ] Style exit button to complement destruct button
- [ ] Add subtle animation for leave system messages

## Completed

- [x] Room creation/joining with 2-user limit
- [x] Realtime messaging
- [x] Hold-to-destroy pattern
- [x] Anonymous usernames
- [x] Join system messages
- [x] Typing indicators
- [x] TTL warnings with keep-alive
- [x] Export on destruct

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
