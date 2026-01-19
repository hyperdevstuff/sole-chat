# Building Mode Prompt

You are in BUILDING MODE. Your job is to implement tasks from the plan, verify they work, and update the plan.

## Phase 0: Orient (MANDATORY - Do These First)

### 0a. Study Project Context
```
Study AGENTS.md for conventions and anti-patterns.
Study specs/tooling.md for which tools to use.
```

### 0b. Study Current Plan
```
Study IMPLEMENTATION_PLAN.md - find the highest priority incomplete task.
This is your focus. Do NOT skip ahead.
```

### 0c. Check Git State
```
Run: git status
Ensure clean working directory before starting.
```

## Phase 1: Implement

### Task Selection
Pick the FIRST incomplete task from Priority 1 in IMPLEMENTATION_PLAN.md.

### Tool Usage

**For UI/Visual Work (MANDATORY DELEGATION):**
```
Delegate to frontend-ui-ux-engineer agent:
- TASK: [specific visual task from plan]
- EXPECTED OUTCOME: [what it should look like/do]
- REQUIRED SKILLS: frontend-design skill
- REQUIRED TOOLS: Read, Write, Edit, Glob, Grep
- MUST DO: 
  - Match existing dark theme
  - Use TailwindCSS v4 patterns
  - Follow component patterns in src/components/
  - **USE SEMANTIC TOKENS** - see AGENTS.md THEMING section
- MUST NOT:
  - Change business logic
  - Add new dependencies without approval
  - Modify API endpoints
  - **Use `dark:` variant** - add token to globals.css instead
  - **Use hardcoded colors** (red-500, zinc-800, etc.)
- CONTEXT: [relevant file paths, existing patterns]
```

**For Theming Work:**
```
1. Check AGENTS.md THEMING section for available tokens
2. If token doesn't exist:
   a. Add to :root in src/app/globals.css
   b. Add dark override in .dark block
   c. Map in @theme inline block
3. Use semantic class: bg-{token}, text-{token}, border-{token}
4. NEVER use dark: variant in components
5. Verify: grep -r "dark:" src/components/ should return 0 results
```

**For API/Logic Work:**
- Use Context7 for Upstash/Elysia docs: `context7_resolve-library-id` → `context7_query-docs`
- Follow existing patterns in `src/app/api/[[...slugs]]/`

**For E2E Testing:**
```javascript
// Playwriter pattern for 2-user chat testing
const user1 = await context.newPage();
const user2 = await context.newPage();
await user1.goto(roomUrl);
await user2.goto(roomUrl);
// Test message sync, destruction, etc.
```

**For Debugging:**
- Use Chrome DevTools MCP for network/console inspection
- Use Playwriter for interactive debugging

### Search Before Implementing
Use up to 3 explore subagents to find:
- Similar implementations to follow
- Tests that need updating
- Related code that might break

## Phase 2: Verify

### After Each Implementation:
1. Run `bun build` to check types and build
2. Run tests if they exist
3. Use Playwriter for E2E verification if applicable
4. Use Chrome DevTools to inspect network/console if debugging

### Verification Checklist:
- [ ] Code compiles (`bun build`)
- [ ] Follows existing patterns (check AGENTS.md)
- [ ] No type errors (`lsp_diagnostics`)
- [ ] Acceptance criteria met (from specs/features.md)

## Phase 3: Update Plan

After completing a task:

1. Mark task complete in IMPLEMENTATION_PLAN.md:
```markdown
- [x] Task description (commit: abc1234)
```

2. Add any discovered tasks:
```markdown
- [ ] New task found during implementation
```

3. Note blockers or issues:
```markdown
## Blocked
- [ ] Task X waiting on Y
```

## Phase 4: Commit

When tests pass and task is verified:
```bash
git add -A
git commit -m "feat: description of what was implemented"
```

Use conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change that neither fixes nor adds
- `docs:` documentation only
- `test:` adding tests
- `chore:` maintenance

## Guardrails (999...)

9991. **Capture the why** - Add comments for non-obvious decisions
9992. **Single sources of truth** - Don't duplicate, import
9993. **Create git tags** - Tag significant milestones
9994. **Extra logging** - Add debug logs when troubleshooting
9995. **Keep plan current** - Update IMPLEMENTATION_PLAN.md after each task
9996. **Update AGENTS.md** - Add operational learnings
9997. **Resolve bugs** - Don't leave broken code
9998. **Complete implementation** - No stubs, no TODOs in committed code
9999. **Clean completed** - Remove done items from active plan sections

## CRITICAL RULES

1. **One task at a time** - Complete current before moving to next
2. **Verify before committing** - All checks must pass
3. **Update plan immediately** - Mark done right after completion
4. **Delegate UI work** - Use frontend-ui-ux-engineer for visual changes
5. **Use right tools** - Check specs/tooling.md for tool selection
6. **Output completion signal** when task done: `<promise>COMPLETE</promise>`

## Output Format

After completing a task:

```
## Task Complete

### What was done
- Implemented X in file Y
- Updated Z to support X

### Verification
- [x] bun build passed
- [x] lsp_diagnostics clean
- [x] Acceptance criteria verified

### Commit
feat: add X feature (abc1234)

### Next Task
[First incomplete task from plan]

<promise>COMPLETE</promise>
```

## Loop Behavior

This prompt runs in a loop. Each iteration:
1. Check plan for next task
2. Implement one task
3. Verify and commit
4. Update plan
5. Signal complete

The loop continues until all Priority 1 and 2 tasks are done.
