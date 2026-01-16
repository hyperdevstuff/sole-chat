# Implementation Plan

**Updated:** 2026-01-16 (Mobile & Theming Sprint)
**Branch:** dev
**Last Commit:** ed2ba2d fix: correct createdAt type

---

## Priority 1: Mobile Responsiveness (Use frontend-ui-ux-engineer)

### Header Layout Reorganization

- [x] Fix cramped header on mobile (file: `src/app/room/[roomId]/page.tsx:466-516`)
  - Current: All elements on one row with `absolute left-1/2` for DestructButton causing overlap
  - Mobile layout: Stack into 2 rows (Room ID + Exit top, DestructButton below centered)
  - Desktop (sm:): Restore single row layout
  - Changes:
    - Remove `absolute left-1/2 -translate-x-1/2` from DestructButton wrapper
    - Use `flex-col sm:flex-row` for header
    - Add `order-*` classes for mobile reordering
  - Acceptance: All header elements visible and accessible on 375px viewport

### DestructButton Responsive Sizing

- [x] Reduce DestructButton width on mobile (file: `src/components/destruct-button.tsx:61`)
  - Change `min-w-[180px]` to `min-w-[140px] sm:min-w-[180px]`
  - Acceptance: Button fits in mobile header without overflow

### Input Bar Mobile Improvements

- [x] Improve input bar for mobile (file: `src/app/room/[roomId]/page.tsx:557-596`)
  - Add safe area inset: `pb-[env(safe-area-inset-bottom)]` to container
  - Reduce gap on mobile: `gap-2 sm:gap-4`
  - Increase send button touch target: `min-h-[44px] min-w-[44px]`
  - Use `text-base` on input to prevent iOS zoom (16px minimum)
  - Acceptance: Input visible with keyboard open, proper touch targets

### Message Bubbles Responsive

- [x] Improve message bubble width on mobile (file: `src/app/room/[roomId]/page.tsx:537-544`)
  - Change `max-w-[70%]` to `max-w-[85%] sm:max-w-[70%]`
  - Acceptance: Better space utilization on narrow screens

### Toast Container Fix

- [x] Fix toast overflow on narrow screens (file: `src/hooks/use-toast.tsx:33`)
  - Current: `right-4` without left protection causes overflow
  - Change to: `left-4 right-4 sm:left-auto sm:right-4`
  - Add: `mx-auto sm:mx-0` for mobile centering
  - Acceptance: Toast visible and readable on 320px viewport

### Safe Area Insets (iOS)

- [x] Add safe area support (files: `src/app/globals.css`, `src/app/layout.tsx`)
  - Add viewport meta with `viewportFit: 'cover'`
  - Add CSS utility `.pb-safe { padding-bottom: env(safe-area-inset-bottom) }`
  - Acceptance: No content hidden behind notch/home indicator

---

## Priority 2: Light/Dark Theming (Use frontend-ui-ux-engineer)

### Theme Infrastructure

- [x] Create theme utilities (file: `src/lib/theme.ts`)
  - Export `THEME_KEY = 'sole-chat-theme'`
  - Export `type Theme = 'light' | 'dark' | 'system'`
  - Export `getSystemTheme(): 'light' | 'dark'`
  - Export `getStoredTheme(): Theme | null`
  - Export `applyTheme(theme: Theme): void` - adds/removes `dark` class on `<html>`
  - Also exports: `setStoredTheme()`, `resolveTheme()`, `themeInitScript`
  - Acceptance: Clean separation of theme logic ✓

- [ ] Create theme hook (file: `src/hooks/use-theme.ts` - NEW)
  - Return `{ theme, setTheme, resolvedTheme }`
  - Listen to `prefers-color-scheme` changes
  - Persist to localStorage
  - Acceptance: React components can read/write theme

- [ ] Create theme toggle component (file: `src/components/theme-toggle.tsx` - NEW)
  - Sun/Moon icon toggle
  - Accessible with aria-label
  - Smooth transition between states
  - Acceptance: Clicking toggles theme immediately

### Prevent Flash of Wrong Theme

- [ ] Add inline script to layout (file: `src/app/layout.tsx`)
  - Add `<script>` before body content to set `dark` class immediately
  - Add `suppressHydrationWarning` to `<html>` element
  - Acceptance: No flash of light theme when dark preferred

### CSS Variable Expansion

- [ ] Expand CSS variables for theming (file: `src/app/globals.css`)
  - Add variables for all surface colors, text colors, borders
  - Use `dark:` variant throughout or CSS variable approach
  - Color mapping:

    ```
    Light                 Dark
    bg-white             bg-neutral-900
    bg-neutral-50        bg-neutral-950
    bg-neutral-100       bg-neutral-800
    text-neutral-900     text-neutral-100
    border-neutral-200   border-neutral-800
    text-green-600       text-green-500
    ```

  - Acceptance: All colors respond to theme change

### Update Components for Theming

- [ ] Update home page (file: `src/app/page.tsx`)
  - Add theme toggle to top-right corner
  - Replace hardcoded dark colors with theme-aware classes
  - Acceptance: Page looks good in both themes

- [ ] Update room page (file: `src/app/room/[roomId]/page.tsx`)
  - Replace hardcoded colors: `bg-neutral-900/30`, `bg-neutral-800`, `text-neutral-*`
  - Update message bubbles for light mode visibility
  - Acceptance: Chat readable in both themes

- [ ] Update all components for theming
  - `src/components/destruct-button.tsx`
  - `src/components/destruct-modal.tsx`
  - `src/components/expired-modal.tsx`
  - `src/components/toast.tsx`
  - Acceptance: All components theme-aware

---

## Priority 3: Polish & Testing

### Visual Testing

- [ ] Test on real devices / emulators
  - iPhone SE (375px) - smallest common viewport
  - iPhone 14 Pro (393px) - notch + dynamic island
  - Pixel 7 (412px) - Android reference
  - Acceptance: No layout issues on any device

### Theme Persistence Testing

- [ ] Verify theme persistence across sessions
  - Set theme, refresh, verify it persists
  - Clear localStorage, verify system preference used
  - Acceptance: Theme choice remembered

---

## Previously Completed

### Critical Bugs (All Fixed)

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

- [x] Fix cookie set before Lua script confirms join (file: `src/proxy.ts`)
- [x] Fix DELETE route cleaning wrong key (commit: ad87430)
- [x] Remove auth token from stored messages
- [x] Clean up typingTimeoutRef on unmount

### Error Handling & Reliability (All Fixed)

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
- [x] Extract hardcoded constants to `src/lib/constants.ts`
- [x] Review silent catch blocks
- [x] Fix createdAt type inconsistency

---

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

---

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
