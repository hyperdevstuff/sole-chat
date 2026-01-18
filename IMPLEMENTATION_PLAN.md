# Implementation Plan

**Updated:** 2026-01-18 (Ship-Readiness Audit v2)
**Branch:** dev
**Last Commit:** 2326def refactor: migrate room page to shared Button and Input components

---

## Priority 0: SHIP BLOCKERS (Must Fix Before Launch)

### BLOCKER: Room ID Too Long

Current implementation uses `nanoid()` which generates 21-character URL-safe IDs. Requirement is **6 alphanumeric characters** for easy copying/sharing.

- [x] Change room ID to 6 alphanumeric characters (file: `src/app/api/rooms/index.ts`)
  - Used `customAlphabet` from nanoid with alphanumeric charset, 6 chars
  - Acceptance: Room URLs like `/room/Abc123` instead of `/room/V1StGXR8_Z5jdHi6B-myT`

### BLOCKER: No End-to-End Encryption (E2EE)

The app now has full E2EE. Messages are encrypted client-side before sending to Redis.

- [x] Implement client-side E2EE for messages
  - ECDH P-256 keypair generation (Web Crypto API)
  - Key exchange: creator stores publicKey on room creation, joiner fetches and derives shared key
  - AES-GCM 256-bit encryption for messages
  - Only ciphertext stored in Redis
  - Files: `src/lib/crypto.ts`, `src/hooks/use-e2ee.ts`, `src/app/room/[roomId]/page.tsx`

- [x] Add E2EE tests
  - 10 unit tests for crypto functions (key gen, export/import, derive, encrypt/decrypt)
  - File: `src/lib/__tests__/crypto.test.ts`


---

## Priority 0.1: CRITICAL BUG FIXES (Completed 2026-01-18)

### BUG: ThemeToggle Hydration Mismatch - FIXED

- [x] Fix hydration mismatch in use-theme.ts (file: `src/hooks/use-theme.ts`)
  - Changed: `typeof window !== "undefined"` → `useState` + `useEffect` pattern
  - Root cause: Server/client evaluated `typeof window` differently
  - Fix: Use React state that updates after mount

### BUG: Duplicate Toasts on Room Creation - FIXED

- [x] Remove redundant "Connected to chat" toast (file: `src/app/room/[roomId]/page.tsx`)
  - Added `hasConnectedBefore` ref to track actual reconnection vs initial connection
  - "Reconnected to chat" toast only shows on actual reconnection (status connecting→connected AFTER first connection)
  - Result: No duplicate toast when creating/joining room

### BUG: Keep Alive Toast Duration Too Short - FIXED

- [x] Increase warning toast durations (file: `src/app/room/[roomId]/page.tsx`)
  - 60-second warning: Added `duration: 30000` (30 seconds)
  - 10-second warning: Added `duration: 15000` (15 seconds)
  - Result: Users have adequate time to click "Keep Alive"

---

## Priority 0.2: SHIP BLOCKERS (Lint & Polish) - COMPLETE

**Identified:** 2026-01-18 Ship-Readiness Audit
**Completed:** 2026-01-18

### BLOCKER: ESLint Errors (2) - FIXED

- [x] Fix empty interface in input.tsx (file: `src/components/ui/input.tsx`)
  - Changed `interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}` to `type InputProps = React.InputHTMLAttributes<HTMLInputElement>;`
  - Acceptance: `bun run lint` passes

- [x] Fix setState in useEffect (file: `src/hooks/use-theme.ts`)
  - Changed to use `useSyncExternalStore` pattern to avoid React Compiler lint error
  - Acceptance: `bun run lint` passes

### BLOCKER: ESLint Warnings (5) - FIXED

- [x] Remove unused import RealtimeEvents (file: `src/app/room/[roomId]/page.tsx:18`)
- [x] Remove unused import useRef from toast.tsx, replaced with useCallback
- [x] Remove unused param onKeyExchange (file: `src/hooks/use-e2ee.ts`)
- [x] Remove unused var err (file: `src/hooks/use-e2ee.ts`)
- [x] Fix missing dependency handleDismiss (file: `src/components/toast.tsx`)
  - Wrapped handleDismiss in useCallback and added to dependency array

### BLOCKER: Typo in Home Page - FIXED

- [x] Fix typo "ablities" → "abilities" (file: `src/app/page.tsx:71`)

### REQUIRED: Missing .env.example - DONE

- [x] Create `.env.example` file with required environment variables

### REQUIRED: Update README - DONE

- [x] Replace boilerplate README with project documentation
  - Describes what the project does
  - Lists required environment variables
  - Explains how E2EE works
  - Provides deployment instructions

---

## Priority 0.5: Migrate to next-themes (Theming Simplification)

### Why next-themes?
Current custom theme system has ~50 lines of code that next-themes handles automatically:
- FOUC prevention (no custom inline script needed)
- System preference detection
- Hydration mismatch handling
- localStorage persistence

### Migration Steps

- [x] Install next-themes
  ```bash
  bun add next-themes
  ```
  - Acceptance: Package in dependencies

- [x] Update providers.tsx to use ThemeProvider from next-themes
  - File: `src/lib/providers.tsx`
  - Add `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
  - Acceptance: Theme provider wraps app

- [x] Update use-theme.ts to wrap next-themes
  - File: `src/hooks/use-theme.ts`
  - Replace custom implementation with next-themes' `useTheme()`
  - Keep `mounted` check for hydration safety
  - Acceptance: Hook works with same API

- [x] Remove custom theme utilities
  - Delete: `src/lib/theme.ts` (getStoredTheme, setStoredTheme, getSystemTheme)
  - Remove: `themeInitScript` from `src/app/layout.tsx`
  - Acceptance: No custom FOUC prevention code

- [x] Fix page.tsx hardcoded colors (file: `src/app/page.tsx`)
  - `text-neutral-500` → `text-muted`
  - `border-neutral-800 bg-neutral-900/50` → `border-border bg-surface/50`
  - `bg-neutral-950 border-neutral-800 text-neutral-400` → `bg-surface-sunken border-border text-muted`
  - `bg-neutral-100 text-black` → theme-aware button styling
  - **MUST USE**: frontend-ui-ux-engineer agent

- [x] Fix theme-toggle.tsx hardcoded colors (file: `src/components/theme-toggle.tsx`)
  - `bg-neutral-800` skeleton → `bg-surface-elevated`
  - `bg-neutral-100 dark:bg-neutral-800` → `bg-surface-elevated`
  - **MUST USE**: frontend-ui-ux-engineer agent

- [x] Verify theme switching works
  - Test light/dark toggle
  - Test system preference detection
  - Test persistence across refresh
  - Acceptance: Seamless theme switching without FOUC


---

## Priority 1: Complete Home Page Theme Migration (Use frontend-ui-ux-engineer)

### VERIFIED GAP: Home Page Uses Hardcoded Colors

The home page (`src/app/page.tsx`) still uses `neutral-*` classes that will break in light mode.

- [x] Migrate page.tsx to theme tokens (file: `src/app/page.tsx`)
  - Line 64: `text-neutral-500` → `text-muted`
  - Line 68: `border-neutral-800 bg-neutral-900/50` → `border-border bg-surface/50`
  - Line 75: `bg-neutral-950 border-neutral-800 text-neutral-400` → `bg-surface-sunken border-border text-muted`
  - Line 84: `bg-neutral-100 text-black` → needs proper theme-aware button styling
  - Acceptance: Home page readable in both light and dark themes
  - **MUST USE**: frontend-ui-ux-engineer agent

### VERIFIED GAP: Theme Toggle Uses Hardcoded Colors

- [x] Migrate theme-toggle.tsx to theme tokens (file: `src/components/theme-toggle.tsx`)
  - Line 16: `bg-neutral-800` skeleton → `bg-surface-elevated`
  - Line 25: `bg-neutral-100 dark:bg-neutral-800` → `bg-surface-elevated border-border`
  - Acceptance: Toggle visible and consistent in both themes
  - **MUST USE**: frontend-ui-ux-engineer agent

### VERIFIED: Room Page Theme - COMPLETE

- [x] Room page colors migrated (commit: prior work)
  - Uses `bg-surface/30` for header/footer
  - Uses `bg-surface-elevated` for received messages
  - Uses `border-border` throughout
  - NOTE: Green message bubbles (line 574) are intentional accent colors

---

## Priority 2: Adopt Shared UI Components (Optional Refactor)

### Context: Components Exist But Are Unused

Button and Input components were created (commit: 50089fa) but are not imported anywhere yet.

- [x] Migrate home page to use shared components
  - Replaced 2 inline buttons with `<Button>` variants (primary + ghost)
  - Replaced 1 inline input with `<Input>`
  - File: `src/app/page.tsx`
  - Used className overrides for exact visual match (rounded-none, h-auto)

- [x] Migrate room page to use shared components
  - Replaced 4 inline buttons (copy link, exit, new messages badge, send)
  - Replaced 1 inline input (message input)
  - File: `src/app/room/[roomId]/page.tsx`
  - Used className overrides for exact visual match (h-auto, rounded-none)

- [ ] Migrate modals to use Button component
  - expired-modal.tsx: 2 buttons
  - destruct-modal.tsx: 3 buttons (use `danger` variant for destructive actions)
  - **MUST USE**: frontend-ui-ux-engineer agent

- [ ] Migrate other components
  - theme-toggle.tsx: 1 button (likely `ghost` variant)
  - toast.tsx: 2 buttons
  - destruct-button.tsx: 1 button
  - **MUST USE**: frontend-ui-ux-engineer agent

**Summary**: 15 buttons + 2 inputs across 7 files can be migrated incrementally.

---

## Priority 3: Visual Testing & Verification

### Theme Testing

- [ ] Test theme switching end-to-end
  - Verify all components respond to theme change
  - Verify persistence across page refresh
  - Verify system preference detection
  - Use Playwriter MCP for automation
  - Acceptance: Seamless light/dark switching

- [ ] Test on mobile viewports
  - iPhone SE (375px) - smallest common
  - iPhone 14 Pro (393px) - notch/dynamic island
  - Pixel 7 (412px) - Android reference
  - Acceptance: No layout issues on any device

### E2E Test Expansion

- [ ] Add theme toggle E2E test (file: `tests/theme-toggle.spec.ts`)
  - Toggle theme, verify localStorage update
  - Refresh page, verify theme persists
  - Verify correct class on `<html>` element
  - Acceptance: Theme persistence works reliably

---

## Priority 4: Test Coverage Gaps (Future Work)

### VERIFIED GAPS from Explore Agent:

- [ ] Component unit tests
  - No tests for individual React components
  - Consider Vitest or Bun Test for src/components/
  
- [ ] API boundary tests
  - No direct testing of Elysia endpoints without UI
  - Could use Eden treaty client in test environment

- [ ] TTL validation tests
  - No tests verify rooms expire after 10 minutes
  - Would require time mocking

- [ ] Accessibility (a11y) tests
  - No automated axe-core checks
  - Could integrate with Playwright

- [ ] Realtime reconnection tests
  - No tests for connection drop/recovery scenarios

---

## Completed (Verified)

### Scroll Behavior UX - FULLY VERIFIED
- [x] Scroll position tracking with `messagesContainerRef`, `isAtBottom` state (commit: aca2235)
- [x] Conditional auto-scroll only when at bottom
- [x] Unread message counter increments correctly
- [x] Floating "New Messages" badge with click-to-scroll
- [x] All logic verified by explore agent

### Component Theme Migration - VERIFIED COMPLETE
- [x] button.tsx uses `bg-surface-elevated`, `border-border` (commit: 50089fa)
- [x] input.tsx uses `bg-surface-sunken`, `border-border` (commit: 50089fa)
- [x] destruct-modal.tsx migrated (commit: 7154c01)
- [x] expired-modal.tsx migrated (commit: 7154c01)
- [x] toast.tsx migrated (commit: 7154c01)
- [x] destruct-button.tsx migrated (commit: 7154c01)

### Theme Infrastructure - VERIFIED COMPLETE
- [x] Theme utilities (src/lib/theme.ts)
- [x] Theme hook (src/hooks/use-theme.ts)
- [x] Theme toggle component
- [x] Flash prevention inline script
- [x] CSS variables in globals.css
- [x] Hydration mismatch fix (commit: 1b4a702)

### Mobile Responsiveness - VERIFIED COMPLETE
- [x] Header improvements (commit: 0778cc3)
- [x] Safe area support
- [x] Touch targets
- [x] Toast overflow fixes

### E2E Test Coverage - VERIFIED COMPLETE
- [x] room-creation.spec.ts
- [x] user-limit.spec.ts
- [x] message-delivery.spec.ts
- [x] room-destruction.spec.ts
- [x] Lua script unit tests (9 tests)

### Code Quality - VERIFIED COMPLETE
- [x] Constants extracted to src/lib/constants.ts
- [x] Silent catch blocks audited
- [x] Debug logs removed
- [x] Type inconsistencies fixed

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

### Verified Migration Status (via Explore Agents)
| File | Status | Notes |
|------|--------|-------|
| page.tsx | **NEEDS MIGRATION** | 4 locations with neutral-* |
| theme-toggle.tsx | **NEEDS MIGRATION** | 2 locations with neutral-* |
| room/[roomId]/page.tsx | COMPLETE | Green bubbles are intentional |
| button.tsx | COMPLETE | Uses theme tokens |
| input.tsx | COMPLETE | Uses theme tokens |
| modals | COMPLETE | All migrated |
| toast.tsx | COMPLETE | Uses theme tokens |

### Risks
- No heartbeat = can't detect zombie connections
- beforeunload doesn't always fire (mobile, crash)
- E2E tests require live Upstash Redis
