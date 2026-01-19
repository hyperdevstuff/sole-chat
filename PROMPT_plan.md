# Planning Mode Prompt

You are in PLANNING MODE. Your job is to analyze, understand, and create a comprehensive implementation plan.

## Phase 0: Orient (MANDATORY - Do These First)

### 0a. Study Project Context
```
Study AGENTS.md to understand project structure and conventions.
Study specs/architecture.md for technical decisions.
Study specs/features.md for requirements and acceptance criteria.
Study specs/tooling.md for available tools and when to use them.
```

### 0b. Study Existing Implementation
```
Study src/lib/ for shared utilities and patterns.
Study src/app/api/ for API structure (Elysia plugins).
Study src/components/ for UI patterns.
Study src/hooks/ for custom hooks.
```

### 0c. Study Current Plan
```
Study IMPLEMENTATION_PLAN.md if it exists.
Note completed items, in-progress work, and blockers.
```

### 0d. Check Git State
```
Run: git status && git log --oneline -10
Understand what has been done vs what remains.
```

## Phase 1: Gap Analysis

**IMPORTANT: Don't assume something isn't implemented. VERIFY first.**

Use up to 5 explore subagents IN PARALLEL to search for:
- Existing implementations of planned features
- Patterns that should be followed
- Technical debt or TODOs in code
- Test coverage gaps

Use librarian subagent if external docs needed:
- Upstash Realtime patterns
- Elysia plugin conventions
- TanStack Query best practices

## Phase 2: Create/Update IMPLEMENTATION_PLAN.md

Structure the plan as a prioritized bullet list:

```markdown
# Implementation Plan

## Priority 1: Critical Path
- [ ] Task description (file: path/to/file.ts)
  - Subtask detail
  - Acceptance: How to verify complete

## Priority 2: Important
- [ ] ...

## Priority 3: Nice to Have
- [ ] ...

## Completed
- [x] Task that was done (commit: abc1234)

## Blocked
- [ ] Task waiting on X

## Notes
- Key decisions made
- Patterns discovered
- Risks identified
```

## Phase 3: Tool Selection Planning

For each task, note which tools to use:

| Task Type | Tool/Skill |
|-----------|------------|
| UI/Visual changes | `frontend-ui-ux-engineer` agent (MANDATORY) |
| E2E testing | Playwriter MCP |
| API documentation | Context7 MCP (`/upstash/realtime`, `/elysiajs/elysia`) |
| Debug/inspect | Chrome DevTools MCP |
| Find examples | Exa web search |

## Phase 4: Theming Audit

When planning UI tasks, check for theming violations:

### Scan for Anti-Patterns
```bash
# Find hardcoded dark: variants in components
grep -r "dark:" src/components/

# Find hardcoded Tailwind colors
grep -rE "(bg|text|border)-(red|green|blue|amber|yellow|zinc|neutral|gray)-[0-9]" src/components/
```

### For Each Violation Found
1. Identify the semantic meaning (success, warning, danger, muted, etc.)
2. Check if token exists in AGENTS.md THEMING section
3. If missing, add task to create token in globals.css
4. Add migration task for each file with violations

### Theming Task Template
```markdown
- [ ] Migrate [file] to semantic tokens
  - Line X: `[current]` → `[semantic token]`
  - Acceptance: No `dark:` variants in file
```

## Guardrails (999...)

9991. **Capture the why** - Document reasoning for architectural decisions
9992. **Single sources of truth** - Don't duplicate logic
9993. **Keep plan current** - Update IMPLEMENTATION_PLAN.md with findings
9994. **Identify acceptance tests** - Each task needs verification method
9995. **Note UI tasks** - Mark tasks requiring frontend-ui-ux-engineer
9996. **Audit theming** - Check for `dark:` variants, add migration tasks if found

## CRITICAL RULES

1. **PLAN ONLY** - Do NOT implement anything in planning mode
2. **VERIFY before assuming** - Check if feature exists before adding to plan
3. **Be specific** - Include file paths, function names, line numbers
4. **Prioritize ruthlessly** - Critical path first, nice-to-haves last
5. **Output completion signal** when done: `<promise>COMPLETE</promise>`

## Output Format

After analysis, update IMPLEMENTATION_PLAN.md and output:

```
## Planning Complete

### Summary
- X tasks identified
- Y already implemented
- Z blocked items

### Next Actions (for Building Mode)
1. First priority task
2. Second priority task
3. ...

<promise>COMPLETE</promise>
```
