# Frontend Architecture

## Stack
- Framework: Next.js 15 (App Router)
- React: 19
- Styling: `styled-jsx` (from package.json)
- Shared UI: `packages/ui`

## Structure
- Pages and routes are in `apps/web/app/` (assuming App Router) or `pages/`.
- Reusable, generic components live in `packages/ui`.
- Specific feature components stay in `apps/web`.

## State Management
- Prefer React Server Components (RSC) where possible.
- Use Client Components only when interactivity or browser APIs are needed.

## Routing
- Utilize Next.js routing conventions.
- Data fetching occurs on the server using Server Components.
