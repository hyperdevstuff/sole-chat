# Implementation Plan

**Last Updated:** 2026-01-13
**Branch:** dev

## Priority 1: Core Chat Implementation (Critical Path)

- [x] **Add Message History API** (file: `src/app/api/messages/index.ts`)
  - Add `GET` handler to fetch messages from Redis list `messages:{roomId}`
  - Ensure it validates room access via auth token
  - Acceptance: `curl` request returns JSON array of messages

- [x] **Implement Chat Frontend Logic** (file: `src/app/room/[roomId]/page.tsx`)
  - [x] Use `useRealtime` hook to subscribe to `chat:{roomId}`
  - [x] Handle `chat.message` events to update local state
  - [x] Fetch initial history on mount (using TanStack Query)
  - Acceptance: Sending a message updates the UI immediately; refreshing preserves history

- [x] **Implement Message List UI** (file: `src/app/room/[roomId]/page.tsx`)
  - Inline MessageBubble with sender-based alignment
  - Auto-scroll to bottom via `scrollIntoView`
  - **Tool:** `frontend-ui-ux-engineer` (MANDATORY)
  - Acceptance: Messages render correctly with visual distinction

- [x] **Verify Core Chat Flow E2E** (Tool: Playwriter)
  - Create room -> join from second tab -> send messages -> verify sync
  - Acceptance: Messages appear in both tabs within 100ms

## Priority 2: Essential UX

### Completed
- [x] **Add Message Timestamps** (file: `src/app/room/[roomId]/page.tsx`)
  - Show relative time (e.g., "now", "2m")
  - **Tool:** `frontend-ui-ux-engineer`
  - Acceptance: Timestamps visible and accurate

- [x] **Add Typing Indicators** (files: `src/lib/realtime.ts`, `src/app/room/[roomId]/page.tsx`)
  - Add `chat.typing` event to Zod schema
  - Implement debounce logic for emitting typing events
  - Show "User is typing..." in UI
  - **Tool:** `frontend-ui-ux-engineer`
  - Acceptance: Indicator appears when other user types

- [x] **Improve Error Handling** (files: `src/components/toast.tsx`, `src/hooks/use-toast.tsx`, `page.tsx`)
  - Implement Toast component
  - Show errors for: Room full, Room expired, Network issues
  - **Tool:** `frontend-ui-ux-engineer`
  - Acceptance: Toast appears on error

### New Items
- [x] **User Connected System Message** (commit: 84762a8)
  - Add `chat.join` event to Zod schema: `{ type: "chat.join", sender: string }`
  - Emit `chat.join` from client on room mount
  - Display system message in chat: "anon-xyz joined" (centered, muted, no bubble)
  - Acceptance: System message appears when second user joins

- [x] **Timestamp Below Bubble** (commit: 772c594)
  - Move timestamp from sender line to below message content
  - Align: right for own messages, left for other's
  - Style: text-xs, muted color
  - **Tool:** `frontend-ui-ux-engineer`
  - Acceptance: Timestamp renders below bubble, not in sender line

- [x] **Destruction Warnings** (commit: 487981c)
  - Backend: GET `/messages` returns `{ messages, ttl: number }` (Redis TTL on `meta:{roomId}`)
  - Frontend: Track `timeRemaining` state, decrement with `setInterval`
  - Toast at <60s: "Room expires in 1 minute" with Keep Alive action
  - Toast at <10s: "Room expires in 10 seconds!" with Keep Alive action
  - Acceptance: Warning toasts appear at correct thresholds

- [x] **Keep Alive** (commit: 5425f3d)
  - Backend: Add `PATCH /rooms/:roomId` to extend TTL by 10 min
    - Track total session age (createdAt in meta)
    - Reject if total would exceed 7 days
    - Return new TTL
  - Frontend: Keep Alive button in warning toast
  - On success: reset timer, show "Extended by 10 minutes"
  - On max reached: show "Maximum session length (7 days) reached"
  - Acceptance: TTL extends on click, caps at 7 days

- [ ] **Export on Destruct** (file: `src/app/room/[roomId]/page.tsx`)
  - Destruct button opens confirmation modal with two options:
    - [Export & Destroy]: Downloads chat as .txt, then destroys
    - [Just Destroy]: Destroys immediately
  - Export format (plain text):
    ```
    SOLE-CHAT Export
    Room: {roomId}
    Exported: {date}
    ---
    [12:34] anon-happy-x7k2: Hello!
    [12:35] anon-swift-p9m1: Hey there
    [12:35] --- anon-swift-p9m1 joined ---
    ```
  - Use Blob + URL.createObjectURL for download
  - **Tool:** `frontend-ui-ux-engineer` (for modal UI)
  - Acceptance: Export downloads valid .txt file before destruction

## Priority 3: Polish & Nice to Have

- [ ] **Improve Mobile Responsiveness**
  - Use `dvh` units for mobile viewport (iOS Safari address bar)
  - Add `safe-area-inset` for notched devices
  - Virtual keyboard detection via `visualViewport` API
  - **Tool:** `frontend-ui-ux-engineer`

- [ ] **Connection Status Indicator**
  - Show distinct visual for "Connecting...", "Connected", "Disconnected"
  - Research Upstash Realtime client for connection state exposure
  - **Tool:** `frontend-ui-ux-engineer`

- [ ] **Sound Effects**
  - Simple "pop" sound on new message
  - Toggle in UI (localStorage preference)
  - Only play when tab is backgrounded (optional)

## Completed
- [x] Basic Project Setup (Next.js, Elysia, Upstash)
- [x] Room Creation API & UI
- [x] Room Joining Logic (Proxy middleware)
- [x] Basic Message POST API (Backend only)
- [x] Destruct Button UI

## Blockers
None

## Notes
- **Realtime:** Events defined in `src/lib/realtime.ts`: `chat.message`, `chat.destroy`, `chat.typing`, `chat.join`. Channel is `chat:{roomId}`.
- **State:** No global state; use `useState` + `useQuery` in `page.tsx`.
- **Styling:** Tailwind v4. Use `frontend-ui-ux-engineer` for all visual changes.
- **Toast:** Custom toast system in `src/components/toast.tsx` + `src/hooks/use-toast.tsx`.
- **TTL:** Room default is 10 min, can extend via keep-alive, max total 7 days.
- **Export:** Plain text format, triggered only on destruct confirmation.
