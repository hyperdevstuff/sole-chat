# Tooling Specification

## MCP Servers & Skills

### 1. Playwriter MCP (Browser Automation)
**When to use:**
- E2E testing of chat flows
- Visual regression testing
- Multi-tab scenarios (2 users chatting)
- Screenshot capture for UI verification

**Key patterns:**
```javascript
// Two-user chat simulation
const tab1 = await context.newPage();
const tab2 = await context.newPage();
await tab1.goto('/room/xyz');
await tab2.goto('/room/xyz');
// Interact and verify messages sync
```

### 2. Context7 MCP (Documentation)
**When to use:**
- Looking up Upstash Realtime API
- Elysia plugin patterns
- TanStack Query mutations
- Next.js 16 App Router specifics

**Query patterns:**
- `resolve-library-id` first, then `query-docs`
- Libraries: `/upstash/realtime`, `/elysiajs/elysia`, `/tanstack/query`

### 3. Exa Web Search
**When to use:**
- Finding implementation examples
- Debugging obscure errors
- Best practices for ephemeral chat systems

### 4. Chrome DevTools MCP
**When to use:**
- Debugging realtime connection issues
- Network request inspection
- Console error investigation
- Performance profiling

## Skills

### frontend-design / frontend-ui-ux-engineer
**MANDATORY for:**
- Any visual/styling changes
- New component creation with UI
- Layout modifications
- Animation/transition work
- Responsive design updates

**Delegation pattern:**
```
Delegate to frontend-ui-ux-engineer:
- TASK: [specific visual task]
- EXPECTED OUTCOME: [visual result]
- MUST DO: Match existing dark theme, use TailwindCSS v4
- MUST NOT: Change component logic, add new dependencies
```

## Verification Strategy

### Automated
- `bun build` - Type checking + build verification
- Playwriter E2E tests for critical flows

### Manual (via Playwriter)
- Visual inspection of UI changes
- Multi-user chat flow testing
- Destruction flow verification

## Tool Selection Matrix

| Task Type | Primary Tool | Fallback |
|-----------|--------------|----------|
| UI changes | frontend-ui-ux-engineer | - |
| API docs lookup | Context7 | Exa search |
| E2E testing | Playwriter | Chrome DevTools |
| Debug realtime | Chrome DevTools | Console logs |
| Find examples | Exa search | Context7 |
