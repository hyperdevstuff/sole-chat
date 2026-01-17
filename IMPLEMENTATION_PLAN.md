# Implementation Plan

**Updated:** 2026-01-17 (Building Mode)
**Branch:** dev
**Last Commit:** 7154c01 refactor: migrate modal and toast components to theme tokens

---

## Priority 1: Complete Theming (Use frontend-ui-ux-engineer)

### Room Page Theme Migration

- [x] Update room page colors (file: `src/app/room/[roomId]/page.tsx`) - ALREADY DONE
  - Uses `bg-surface/30` for header/footer
  - Uses `bg-surface-elevated` for received messages
  - Uses `border-border` throughout
  - Uses `text-muted` / `text-foreground` appropriately
  - Uses `bg-surface-sunken` for input
  - Skeleton loader uses theme tokens
  - Acceptance: Chat readable in both light and dark themes ✓

### Component Theme Migration

- [x] Update destruct-button.tsx (commit: 7154c01)
  - Replace `bg-neutral-800` with `bg-surface-elevated`
  - Replace `text-neutral-300` with `text-foreground`
  - Keep `bg-red-900` for destruction overlay (semantic color)
  - Acceptance: Button visible in both themes

- [x] Update destruct-modal.tsx (commit: 7154c01)
  - Replace `bg-neutral-900` with `bg-surface-elevated`
  - Replace `border-neutral-800` with `border-border`
  - Replace `text-neutral-400` with `text-muted`
  - Keep `bg-black/80` for overlay (intentional dimming)
  - Acceptance: Modal readable in both themes

- [x] Update expired-modal.tsx (commit: 7154c01)
  - Same pattern as destruct-modal
  - Acceptance: Modal readable in both themes

- [x] Update toast.tsx (commit: 7154c01)
  - Replace `text-neutral-200/400` with `text-foreground/muted`
  - Replace `bg-neutral-800` action button with `bg-surface-elevated`
  - Keep semantic status colors (red/emerald/blue/amber)
  - Acceptance: Toast visible in both themes

---

## Priority 2: Scroll Behavior UX

### Scroll Position Preservation

- [x] Add scroll position tracking (commit: pending)
  - Added `messagesContainerRef` to scrollable message div
  - Added `isAtBottom` state with 50px threshold detection
  - Added `onScroll` handler to update `isAtBottom`
  - Acceptance: State correctly reflects user scroll position

- [x] Implement conditional auto-scroll (commit: pending)
  - Only scrolls to bottom if `isAtBottom === true`
  - Increments unread counter for messages from other users when not at bottom
  - Acceptance: User scroll position preserved when reading history

### New Messages Indicator

- [x] Add unread message counter (commit: pending)
  - Added `unreadCount` state
  - Increments when message arrives AND `!isAtBottom` AND not from current user
  - Resets to 0 when user scrolls to bottom
  - Acceptance: Counter accurately tracks unread messages

- [x] Add floating "New Messages" badge (commit: pending)
  - Shows when `unreadCount > 0 && !isAtBottom`
  - Displays count (e.g., "3 new messages")
  - Click scrolls to bottom and resets counter
  - Uses green accent styling with shadow
  - Acceptance: Badge visible, clickable, disappears on scroll

---

## Priority 3: Code Quality & DX

### Reusable UI Components

- [ ] Create Button component (file: `src/components/ui/button.tsx`)
  - Variants: primary, secondary, danger, ghost
  - Sizes: sm, md, lg
  - Theme-aware using CSS variables
  - Acceptance: Reduces duplication in page.tsx and room page

- [ ] Create Input component (file: `src/components/ui/input.tsx`)
  - Consistent focus/disabled states
  - Theme-aware styling
  - Acceptance: Consistent input styling across app

- [ ] Refactor existing buttons to use Button component
  - Home page create/join buttons
  - Room page send button, exit button
  - Modal action buttons
  - Acceptance: No inline button styling in page files

### Uncommitted Work

- [ ] Review and commit current changes
  - `src/app/room/[roomId]/page.tsx` - Mobile header improvements
  - `src/app/api/[[...slugs]]/route.ts` - API query param fixes
  - Acceptance: Clean git state with descriptive commit

---

## Priority 4: Testing & Verification

### Visual Testing

- [ ] Test on mobile viewports
  - iPhone SE (375px) - smallest common
  - iPhone 14 Pro (393px) - notch/dynamic island
  - Pixel 7 (412px) - Android reference
  - Acceptance: No layout issues on any device

- [ ] Test theme switching
  - Verify all components respond to theme change
  - Verify persistence across page refresh
  - Verify system preference detection
  - Acceptance: Seamless light/dark switching

### E2E Test Coverage

- [ ] Add theme toggle E2E test
  - Toggle theme, verify localStorage update
  - Refresh page, verify theme persists
  - Acceptance: Theme persistence works reliably

---

## Previously Completed

### Mobile Responsiveness (All Complete)
- [x] Fix cramped header on mobile (commit: 0778cc3)
- [x] Reduce DestructButton width on mobile
- [x] Improve input bar for mobile (safe area, touch targets)
- [x] Improve message bubble width on mobile
- [x] Fix toast overflow on narrow screens
- [x] Add safe area support for iOS

### Theme Infrastructure (All Complete)
- [x] Create theme utilities (src/lib/theme.ts)
- [x] Create theme hook (src/hooks/use-theme.ts)
- [x] Create theme toggle component
- [x] Add flash prevention inline script
- [x] Expand CSS variables in globals.css
- [x] Update home page for theming (commit: fda3f64)
- [x] Fix hydration mismatch in ThemeToggle (commit: 1b4a702)

### Critical Bugs (All Fixed)
- [x] Fix cookie set before Lua script confirms join
- [x] Fix DELETE route cleaning wrong key
- [x] Remove auth token from stored messages
- [x] Clean up typingTimeoutRef on unmount

### Error Handling (All Fixed)
- [x] Add proper error handling for realtime emit
- [x] Handle Upstash Realtime disconnections with auto-reconnect

### UI/UX (All Fixed)
- [x] Add aria-labels to all buttons
- [x] Add focus trap to modals
- [x] Fix viewport height on mobile (svh units)
- [x] Add skeleton loader for message history
- [x] Improve typing indicator animation

### Testing (All Fixed)
- [x] Initialize Playwright for E2E tests
- [x] Test room creation, 2-user limit, message delivery, room destruction
- [x] Test Lua scripts in isolation (9 unit tests)

### Code Quality (All Fixed)
- [x] Remove console.log from proxy.ts
- [x] Remove commented code
- [x] Extract hardcoded constants to src/lib/constants.ts
- [x] Review silent catch blocks
- [x] Fix createdAt type inconsistency

---

## Future Enhancements

### Heartbeat System (Reliability)
- [ ] Implement heartbeat for zombie connection detection
  - Current: beforeunload is unreliable (mobile/crash)
  - Solution: Periodic ping, server-side timeout tracking
  - Acceptance: Zombie slots freed within 60s

---

## Blocked

_None currently_

---

## Notes

### Key Decisions
- Elysia over Next.js API routes (better DX, Eden treaty client)
- Upstash Realtime over raw WebSocket (managed, scales automatically)
- 30s grace period for leave/rejoin (balance UX and slot availability)
- Class-based theming via `.dark` on `<html>` element

### Redis Key Schema
```
connected:{roomId}  - SET of auth tokens (max 2)
leaving:{roomId}    - SET of tokens in grace period
meta:{roomId}       - HASH with creator info
messages:{roomId}   - LIST of messages
```

### CSS Variable Mapping
| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--surface` | #f5f5f5 | #171717 | Card backgrounds |
| `--surface-elevated` | #ffffff | #262626 | Buttons, modals |
| `--surface-sunken` | #e5e5e5 | #0a0a0a | Input backgrounds |
| `--border` | #e5e5e5 | #262626 | Default borders |
| `--muted` | #737373 | #a3a3a3 | Secondary text |

### Tool Usage
| Task | Tool |
|------|------|
| UI/Visual changes | `frontend-ui-ux-engineer` agent (MANDATORY) |
| E2E tests | Playwriter MCP |
| API docs | Context7 (`/upstash/realtime`, `/elysiajs/elysia`) |
| Debug | Chrome DevTools MCP |
| Examples | Exa web search |

### Test Coverage Summary
| Area | Coverage | Notes |
|------|----------|-------|
| Lua scripts | High | 9 unit tests |
| E2E flows | High | 4 test files |
| API integration | None | No dedicated tests |
| React hooks | None | No unit tests |

### Risks
- No heartbeat = can't detect zombie connections
- beforeunload doesn't always fire (mobile, crash)
- E2E tests require live Upstash Redis
