# Implementation Plan

**Last Updated:** 2026-01-13
**Branch:** dev

## Priority 1: Critical Path

- [ ] Verify core chat flow works E2E (tool: Playwriter)
  - Create room → join from second tab → send messages → verify sync
  - Acceptance: Messages appear in both tabs within 100ms

- [ ] Add message timestamps display (tool: frontend-ui-ux-engineer)
  - Show relative time for each message
  - Acceptance: "just now", "1m ago", etc. visible

- [ ] Improve error handling UX (tool: frontend-ui-ux-engineer)
  - Toast notifications for errors
  - Room full / expired feedback
  - Acceptance: User sees clear error messages

## Priority 2: Important

- [ ] Add typing indicator (files: src/lib/realtime.ts, src/app/room/[roomId]/page.tsx)
  - New event type: `chat.typing`
  - Debounced typing detection
  - Tool: Context7 for Upstash Realtime patterns
  - Acceptance: "User is typing..." appears when other user types

- [ ] Improve mobile responsiveness (tool: frontend-ui-ux-engineer)
  - Test on various viewport sizes
  - Fix any overflow issues
  - Acceptance: Usable on 320px width

- [ ] Add connection status indicator (tool: frontend-ui-ux-engineer)
  - Show connected/disconnected state
  - Auto-reconnect feedback
  - Acceptance: Visual indicator in UI

## Priority 3: Nice to Have

- [ ] Add sound notification for new messages
  - Optional, user can disable
  - Tool: Playwriter for testing

- [ ] Add emoji picker
  - Tool: frontend-ui-ux-engineer for UI
  - Lightweight library selection

- [ ] Add message reactions
  - New Redis structure for reactions
  - New realtime event type

## Completed

_None yet - initial plan_

## Blocked

_None currently_

## Notes

### Tool Usage Reference
| Task Type | Primary Tool |
|-----------|--------------|
| UI/Visual | frontend-ui-ux-engineer (MANDATORY) |
| E2E Tests | Playwriter MCP |
| API Docs | Context7 (`/upstash/realtime`, `/elysiajs/elysia`) |
| Debug | Chrome DevTools MCP |
| Examples | Exa web search |

### Key Decisions
- All UI work MUST go through frontend-ui-ux-engineer
- Use frontend-design skill for new components
- E2E verification via Playwriter for multi-user scenarios

### Discovered Patterns
- Elysia plugins mounted in catch-all route
- Realtime events use Zod schemas
- Hold-to-destroy pattern for destructive actions
