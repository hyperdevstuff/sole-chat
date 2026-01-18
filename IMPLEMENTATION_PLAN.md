# Implementation Plan

**Updated:** 2026-01-18 (v2 Planning)
**Branch:** dev
**Last Commit:** f121eef fix: resolve all ship blockers (lint errors, typos, docs)

---

## Priority 0: CRITICAL BUG (Blocking Production)

### BUG: Room Full Redirect Crashes Server

**Error in production:**
```
TypeError: Invalid URL
at new URL (node:internal/url:828:25)
input: '/?error=room-full'
```

- [x] Fix missing base URL in redirect (file: `src/proxy.ts:43`)
  - Current: `new URL("/?error=room-full")` — missing second argument
  - Fix: `new URL("/?error=room-full", req.url)`
  - Note: Lines 9, 13 already correct with `req.url`
  - Acceptance: Room full redirects to home with error param, no crash

---

## Priority 1: Core v2 Features

### 1.1 Increase Room Participant Limit to 10

- [x] Update constant (file: `src/lib/constants.ts`)
  - Change `MAX_USERS_PER_ROOM = 2` → `MAX_USERS_PER_ROOM = 10`
  - Acceptance: Constant reflects new limit

- [x] Update Lua join script (file: `src/lib/lua-scripts.ts`)
  - Change `if count >= 2` → `if count >= 10`
  - Acceptance: Lua script allows up to 10 users

- [x] Handle E2EE for multi-party rooms
  - Implemented: Room type selector ("private" vs "group")
  - Private rooms: 2 users max, E2EE enabled
  - Group rooms: up to 10 users, E2EE disabled
  - API stores room type and e2ee flag in metadata
  - useE2EE hook checks room info and skips encryption for group rooms
  - UI: Room type selector on home page with Lock/Users icons
  - Files: `src/lib/constants.ts`, `src/app/api/rooms/index.ts`, `src/proxy.ts`, `src/hooks/use-e2ee.ts`, `src/app/page.tsx`, `src/app/room/[roomId]/page.tsx`, `src/lib/lua-scripts.ts`

- [x] Add participant count display in room header
  - Shows "X/Y" users badge with Users icon
  - Real-time updates via chat.join/chat.leave events
  - File: `src/app/room/[roomId]/page.tsx`

### 1.2 Room Creation with TTL Selection

- [x] Add TTL option constants (file: `src/lib/constants.ts`)
  ```typescript
  export const ROOM_TTL_OPTIONS = {
    '10m': 60 * 10,      // 600
    '24h': 60 * 60 * 24, // 86400
    '7d': 60 * 60 * 24 * 7, // 604800
  } as const;
  ```

- [x] Update API to accept TTL (file: `src/app/api/rooms/index.ts`)
  - Added `ttl?: number` to POST body schema
  - Validates TTL is one of allowed values (600, 86400, 604800)
  - Uses `ttl ?? ROOM_TTL_SECONDS` for Redis expiration

- [x] Add duration selector to home page (file: `src/app/page.tsx`)
  - Segmented control: 10 min | 24 hours | 7 days
  - Passes selected TTL to API on room creation

### 1.3 Extend Room Button (Replace Toast Action)

- [x] Add "Extend" button to room header (file: `src/app/room/[roomId]/page.tsx`)
  - Placed next to countdown timer in DestructButton area
  - Shows "+10m" with Plus icon
  - Visual states: default, loading (spinner), success (checkmark), disabled

- [x] Track extension limit state
  - Added `canExtend` state based on API `max_reached` response
  - Button disabled with visual feedback when maximum reached

- [x] Update warning toasts to remove action buttons
  - Removed "Keep Alive" action from warning toasts
  - Toasts are now pure notifications since button exists in header

---

## Priority 2: UI/UX Overhaul ("Less Toast, Cleaner UI")

### 2.1 Reduce Toast Noise

Current: 23 toast calls. Target: ~10 (essential errors only).

- [ ] Remove redundant success toasts
  - "Room created! Link copied" → rely on clipboard icon feedback
  - "Secure connection established" → add lock icon in header instead
  - "Reconnected to chat" → status dot already shows this
  - "Room extended" → timer update is sufficient feedback
  - File: `src/app/room/[roomId]/page.tsx`, `src/app/page.tsx`

- [ ] Keep essential toasts
  - All error toasts (failures need attention)
  - Connection lost warning (important for UX)
  - Max extension reached notification

### 2.2 Add Connection/Encryption Status to Header

- [ ] Create `<RoomStatus>` component (file: `src/components/room-status.tsx`)
  - Connection state: green dot (connected), yellow pulse (reconnecting), red (error)
  - E2EE indicator: lock icon when encrypted, unlocked when not
  - User count: "2/10" badge
  - **MUST USE**: `frontend-ui-ux-engineer` agent

- [ ] Integrate into room header
  - Replace inline connection status with new component
  - File: `src/app/room/[roomId]/page.tsx`

### 2.3 Light Mode Polish

- [ ] Audit message bubbles for light mode
  - Current green bubbles optimized for dark mode
  - Ensure sufficient contrast in light mode
  - File: `src/app/room/[roomId]/page.tsx`
  - **MUST USE**: `frontend-ui-ux-engineer` agent

- [ ] Audit DestructButton in light mode
  - Red states visibility
  - Timer text contrast
  - File: `src/components/destruct-button.tsx`
  - **MUST USE**: `frontend-ui-ux-engineer` agent

- [ ] Audit modals in light mode
  - Background overlay visibility
  - Button contrast
  - Files: `src/components/destruct-modal.tsx`, `src/components/expired-modal.tsx`
  - **MUST USE**: `frontend-ui-ux-engineer` agent

### 2.4 Home Page Redesign

- [ ] Add room type selector
  - "Private Chat" (2 users, E2EE) vs "Group Room" (up to 10)
  - Visual differentiation (lock icon for private)
  - File: `src/app/page.tsx`
  - **MUST USE**: `frontend-ui-ux-engineer` agent

- [ ] Improve visual hierarchy
  - Cleaner card layout
  - Better spacing
  - More intuitive flow
  - **MUST USE**: `frontend-ui-ux-engineer` agent

---

## Priority 3: Component Migration (Cleanup)

### Migrate Remaining Buttons to Shared Component

- [ ] Migrate modal buttons (file: `src/components/destruct-modal.tsx`)
  - "Export & Destroy" → `<Button variant="success">`
  - "Just Destroy" → `<Button variant="danger">`
  - "Cancel" → `<Button variant="ghost">`
  - **MUST USE**: `frontend-ui-ux-engineer` agent

- [ ] Migrate expired modal buttons (file: `src/components/expired-modal.tsx`)
  - "Export Chat" → `<Button variant="success">`
  - "Create New Room" → `<Button variant="secondary">`
  - **MUST USE**: `frontend-ui-ux-engineer` agent

- [ ] Migrate theme toggle (file: `src/components/theme-toggle.tsx`)
  - Use `<Button variant="ghost">` wrapper
  - **MUST USE**: `frontend-ui-ux-engineer` agent

- [ ] Migrate toast buttons (file: `src/components/toast.tsx`)
  - Action button → `<Button variant="ghost" size="sm">`
  - Dismiss button → `<Button variant="ghost" size="sm">`
  - **MUST USE**: `frontend-ui-ux-engineer` agent

---

## Priority 4: Testing & Verification

### E2E Tests for v2 Features

- [ ] Test 10-user room flow (file: `tests/multi-user.spec.ts`)
  - Create group room
  - Join with multiple browser contexts
  - Verify all users can send/receive messages
  - Acceptance: 10 users can chat simultaneously

- [ ] Test TTL selection (file: `tests/ttl-selection.spec.ts`)
  - Create room with each duration option
  - Verify correct TTL in API response
  - Acceptance: TTL persists correctly

- [ ] Test extend button (file: `tests/extend-room.spec.ts`)
  - Click extend, verify TTL increases
  - Extend until max, verify button disables
  - Acceptance: Extension works up to 7-day limit

### Visual Tests

- [ ] Test light mode across all pages
  - Home page
  - Room page
  - All modals
  - Use Playwriter for screenshots
  - Acceptance: All elements readable in light mode

- [ ] Test mobile viewports
  - iPhone SE (375px)
  - iPhone 14 Pro (393px)
  - Pixel 7 (412px)
  - Acceptance: No layout issues

---

## Completed (v1)

### Ship Blockers - FIXED
- [x] Room ID shortened to 6 chars (commit: f065b5b)
- [x] E2EE implemented with ECDH P-256 + AES-GCM (commit: 1d37d0f)
- [x] E2EE tests added - 10 unit tests (commit: 9352263)
- [x] ESLint errors fixed (commit: f121eef)
- [x] README updated with project documentation
- [x] .env.example created

### Theme Infrastructure - COMPLETE
- [x] Migrated to next-themes (commit: e163fc0)
- [x] CSS variables in globals.css (light + dark)
- [x] Theme toggle component
- [x] Hydration mismatch fixed (commit: 1b4a702)
- [x] Home page theme tokens migrated
- [x] Theme toggle theme tokens migrated

### Component Migration - PARTIAL
- [x] Home page uses shared Button/Input (commit: ec27066)
- [x] Room page uses shared Button/Input (commit: 2326def)
- [x] All modals use theme tokens (commit: 7154c01)
- [x] Toast uses theme tokens (commit: 7154c01)
- [x] DestructButton uses theme tokens (commit: 7154c01)

### Bug Fixes - COMPLETE
- [x] ThemeToggle hydration mismatch
- [x] Duplicate toasts on room creation
- [x] Keep alive toast duration too short
- [x] Typo "ablities" → "abilities"

### UX Features - COMPLETE
- [x] Scroll position tracking with unread indicator (commit: aca2235)
- [x] Conditional auto-scroll only when at bottom
- [x] Floating "New Messages" badge with click-to-scroll

### Mobile Responsiveness - COMPLETE
- [x] Header improvements (commit: 0778cc3)
- [x] Safe area support for iOS
- [x] Touch targets sized correctly
- [x] Toast overflow fixes

### E2E Test Coverage - COMPLETE
- [x] room-creation.spec.ts
- [x] user-limit.spec.ts
- [x] message-delivery.spec.ts
- [x] room-destruction.spec.ts
- [x] Lua script unit tests (9 tests)

### Code Quality - COMPLETE
- [x] Constants extracted to src/lib/constants.ts
- [x] Silent catch blocks audited
- [x] Debug logs removed
- [x] Type inconsistencies fixed

---

## Future Enhancements (v3+)

### Heartbeat System (Reliability)
- [ ] Implement heartbeat for zombie connection detection
  - Current: beforeunload is unreliable (mobile/crash)
  - Solution: Periodic ping, server-side timeout tracking
  - Acceptance: Zombie slots freed within 60s

### Group E2EE
- [ ] Implement group key distribution for 10-user E2EE
  - Research: Signal Protocol group messaging
  - Consider: MLS (Messaging Layer Security) standard

### Message Features
- [ ] Message reactions
- [ ] Image/file sharing (with E2EE)
- [ ] Message editing/deletion

---

## Blocked

_None currently_

---

## Architecture Notes

### E2EE with 10 Users (v2 Decision)

Current 2-party implementation:
1. Creator generates ECDH P-256 keypair, stores public key in Redis
2. Joiner fetches creator's public key, generates own keypair
3. Both derive shared secret via ECDH
4. AES-GCM-256 encryption with shared key

**v2 Approach**: Disable E2EE for group rooms (>2 users)
- Show room type selector: "Private" vs "Group"
- Private: 2 users max, E2EE enabled
- Group: up to 10 users, no E2EE (messages still ephemeral)

### Room Configuration Model
```typescript
type RoomConfig = {
  type: 'private' | 'group';
  maxUsers: 2 | 10;
  ttl: 600 | 86400 | 604800;
  e2ee: boolean; // true only for private
};
```

### TTL Extension Logic
- Each extension adds `ROOM_TTL_SECONDS` (10 min) to current TTL
- Max total room life: 7 days from creation
- Extension blocked when: `age + currentTtl + 10min > 7 days`

---

## Tool/Agent Assignment

| Task | Tool/Agent |
|------|------------|
| Bug fix (proxy.ts) | Direct edit |
| API schema changes | Direct edit |
| Constants updates | Direct edit |
| Lua script updates | Direct edit |
| UI components | `frontend-ui-ux-engineer` agent |
| Home page redesign | `frontend-ui-ux-engineer` agent |
| Room header changes | `frontend-ui-ux-engineer` agent |
| Light mode audit | `frontend-ui-ux-engineer` agent |
| E2E tests | Playwriter MCP |

---

## CSS Variable Reference

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--background` | #ffffff | #0a0a0a | Page background |
| `--foreground` | #171717 | #ededed | Primary text |
| `--surface` | #f5f5f5 | #171717 | Card backgrounds |
| `--surface-elevated` | #ffffff | #262626 | Buttons, modals |
| `--surface-sunken` | #e5e5e5 | #0a0a0a | Input backgrounds |
| `--border` | #e5e5e5 | #262626 | Default borders |
| `--border-strong` | #d4d4d4 | #404040 | Emphasized borders |
| `--muted` | #737373 | #a3a3a3 | Secondary text |
| `--accent` | #22c55e | #22c55e | Green accent |
| `--destructive` | #ef4444 | #dc2626 | Red/danger |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Room full bug in production | High | Fix in Priority 0 immediately |
| 10-user E2EE complexity | Medium | v2: Disable E2EE for group rooms |
| No heartbeat for zombies | Medium | Grace period (30s) helps, full fix in v3 |
| beforeunload unreliable | Low | Server-side TTL ensures cleanup |
| E2E tests need live Redis | Low | Use Upstash free tier for CI |
