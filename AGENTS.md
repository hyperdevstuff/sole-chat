# AGENTS.md - sole-chat

Guidelines for AI coding agents working in this Next.js codebase.

## Project Overview

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.1 with React Compiler enabled
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript 5 (strict mode)
- **Package Manager**: bun
- **Linting**: ESLint 9 with next/core-web-vitals config

---

## Build / Lint / Test Commands

```bash
# Development server
bun dev

# Production build
bun run build

# Start production server
bun start

# Lint entire project
bun lint

# Type checking
bun tsc --noEmit

# Install dependencies
bun install
```

### Running Single Tests

No test framework configured yet. When adding tests:

```bash
# Vitest (recommended for Next.js)
bun test                    # Run all tests
bun test path/to/file.test.ts  # Single test file
bun test -t "test name"     # Run by test name pattern
```

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
│   ├── layout.tsx    # Root layout with fonts and metadata
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles and Tailwind config
└── ...
public/               # Static assets
```

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - do not use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Use explicit return types for exported functions
- Prefer `interface` over `type` for object shapes
- Use `Readonly<>` wrapper for props: `Readonly<{ children: React.ReactNode }>`

```typescript
// Good
export function Component({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div>{children}</div>;
}

// Bad - avoid any
function bad(data: any) { ... }
```

### Imports

- Use path alias `@/*` for imports from `src/`
- Group imports: external packages first, then internal modules
- Use named exports over default exports (except pages/layouts)

```typescript
// Good
import Image from "next/image";
import { Geist } from "next/font/google";

import { SomeComponent } from "@/components/SomeComponent";
```

### React & Next.js

- **React Compiler is enabled** - avoid manual memoization (useMemo, useCallback, memo)
- Use Server Components by default; add `"use client"` only when needed
- Export `metadata` object for page SEO (not generateMetadata unless dynamic)
- Use `next/image` for all images
- Use `next/font` for fonts (Geist is already configured)

```typescript
// Metadata pattern
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
};
```

### Styling (Tailwind CSS v4)

- Use Tailwind utility classes directly in JSX
- CSS variables defined in `globals.css` under `@theme inline`
- Dark mode: use `dark:` prefix (class-based dark mode)
- Avoid inline styles; prefer Tailwind utilities

```tsx
// Good - Tailwind classes
<div className="flex items-center gap-4 dark:bg-gray-900">

// Avoid - inline styles
<div style={{ display: 'flex', alignItems: 'center' }}>
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Utilities/hooks | camelCase | `useAuth.ts`, `formatDate.ts` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| CSS classes | kebab-case | `user-profile` |
| Files (non-components) | camelCase | `apiClient.ts` |

### Error Handling

- Never use empty catch blocks
- Use error boundaries for component-level errors
- Log errors with context before re-throwing or handling

```typescript
// Good
try {
  await fetchData();
} catch (error) {
  console.error("Failed to fetch data:", error);
  throw error;
}

// Bad - silent failure
try {
  await fetchData();
} catch (e) {}
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config (React Compiler enabled) |
| `tsconfig.json` | TypeScript config (strict, path aliases) |
| `eslint.config.mjs` | ESLint 9 flat config |
| `postcss.config.mjs` | PostCSS with Tailwind plugin |
| `globals.css` | Tailwind imports and CSS variables |

---

## Key Patterns

### App Router Conventions

- `page.tsx` - Route page component
- `layout.tsx` - Shared layout wrapper
- `loading.tsx` - Loading UI
- `error.tsx` - Error boundary (must be client component)
- `not-found.tsx` - 404 page

### Environment Variables

- Use `.env.local` for local secrets (gitignored)
- Prefix client-side vars with `NEXT_PUBLIC_`
- Access via `process.env.VARIABLE_NAME`

---

## Do's and Don'ts

### Do

- Run `bun lint` before committing
- Use Server Components for data fetching
- Keep components small and focused
- Use TypeScript strict mode features

### Don't

- Suppress TypeScript errors with `any` or ignore comments
- Use `useEffect` for data fetching (use Server Components or React Query)
- Commit `.env.local` or secrets
- Use `var` - prefer `const` and `let`
- Manually memoize (React Compiler handles this)

---

## Adding New Features

1. Create components in `src/components/`
2. Create utilities in `src/lib/` or `src/utils/`
3. Add new routes in `src/app/[route]/page.tsx`
4. Run `bun lint` and `bun tsc --noEmit` to verify
