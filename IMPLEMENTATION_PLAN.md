# Implementation Plan

**Last Updated:** 2026-01-13
**Branch:** dev

## Priority 1: Core Chat Implementation (Critical Path)

- [x] **Add Message History API** (file: `src/app/api/messages/index.ts`)
  - Add `GET` handler to fetch messages from Redis list `messages:{roomId}`
  - Ensure it validates room access via auth token
  - Acceptance: `curl` request returns JSON array of messages

- [ ] **Implement Chat Frontend Logic** (file: `src/app/room/[roomId]/page.tsx`)
  - Use `useRealtime` hook to subscribe to `chat:{roomId}`
  - Handle `chat.message` events to update local state
  - Fetch initial history on mount (using TanStack Query)
  - Acceptance: Sending a message updates the UI immediately; refreshing preserves history

- [ ] **Implement Message List UI** (file: `src/app/room/[roomId]/page.tsx`)
  - Create `MessageBubble` component (or inline)
  - Distinguish between "You" (right aligned) and "Them" (left aligned)
  - Auto-scroll to bottom on new message
  - **Tool:** `frontend-ui-ux-engineer` (MANDATORY)
  - Acceptance: Messages render correctly with visual distinction

- [ ] **Verify Core Chat Flow E2E** (Tool: Playwriter)
  - Create room -> join from second tab -> send messages -> verify sync
  - Acceptance: Messages appear in both tabs within 100ms

## Priority 2: Essential UX

- [ ] **Add Message Timestamps** (file: `src/app/room/[roomId]/page.tsx`)
  - Show relative time (e.g., "now", "2m")
  - **Tool:** `frontend-ui-ux-engineer`
  - Acceptance: Timestamps visible and accurate

- [ ] **Add Typing Indicators** (files: `src/lib/realtime.ts`, `src/app/room/[roomId]/page.tsx`)
  - Add `chat.typing` event to Zod schema
  - Implement debounce logic for emitting typing events
  - Show "User is typing..." in UI
  - **Tool:** `frontend-ui-ux-engineer`
  - Acceptance: Indicator appears when other user types

- [ ] **Improve Error Handling** (files: `src/components/ui/toast.tsx`, `page.tsx`)
  - Implement Toast component (or use library if available)
  - Show errors for: Room full, Room expired, Network issues
  - **Tool:** `frontend-ui-ux-engineer`
  - Acceptance: Toast appears on error

## Priority 3: Polish & Nice to Have

- [ ] **Improve Mobile Responsiveness**
  - Check input field on mobile (virtual keyboard handling)
  - **Tool:** `frontend-ui-ux-engineer`

- [ ] **Connection Status Indicator**
  - Show distinct visual for "Connecting...", "Connected", "Disconnected"
  - **Tool:** `frontend-ui-ux-engineer`

- [ ] **Sound Effects**
  - Simple "pop" sound on new message
  - Toggle in UI

## Completed
- [x] Basic Project Setup (Next.js, Elysia, Upstash)
- [x] Room Creation API & UI
- [x] Room Joining Logic (Proxy middleware)
- [x] Basic Message POST API (Backend only)
- [x] Destruct Button UI

## Blockers
- None

## Notes
- **Realtime:** Events are defined in `src/lib/realtime.ts`. Channel is `chat:{roomId}`.
- **State:** No global state; use `useState` + `useQuery` in `page.tsx`.
- **Styling:** Tailwind v4. Use `frontend-ui-ux-engineer` for all visual changes.
