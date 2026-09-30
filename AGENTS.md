# InsightSphere — Agent Operating Guide

## Project Identity

InsightSphere — Multi-API Analytics Dashboard is a portfolio-grade analytics product that transforms public weather, currency, economic, and cryptocurrency data into useful KPIs, trends, comparisons, tables, and drill-down views. It must become a coherent analytics product, not a collection of API cards.

## Current Development Phase

### Current Phase: Phase 3 — Currency Analytics

Status: Complete. Phases 0, 1, and 2 are complete. Phase 3 is authorized for Currency Analytics only. Phase 4 requires a separate request. Deployment is owned by the user. Update this field and the roadmap when the authorized phase changes. Read this file, README.md, and docs/DEVELOPMENT_ROADMAP.md before working.

## Technology Stack

- Foundation: React, TypeScript (strict), Vite, ESLint.
- Phase 1: Tailwind CSS, React Router, TanStack Query, Lucide React as needed.
- Feature development: Zod, React Hook Form, Recharts, date-fns when a concrete feature needs them.
- HTTP: native Fetch; introduce Axios only with a clear project-level benefit.
- Testing: Vitest, React Testing Library, MSW when relevant tests are introduced.
- Providers: Open-Meteo, Frankfurter, World Bank Indicators API, CoinGecko.

Do not install the whole planned stack in advance. Use Tailwind consistently once configured in Phase 1; do not introduce competing styling systems without justification.

## Agent Working Rules

1. Inspect existing code and repository status before changes.
2. Preserve working areas; avoid unnecessary rewrites.
3. Follow the feature architecture and keep domain logic within its feature.
4. Scope changes to the requested task; no unrelated future roadmap work.
5. Justify every new dependency and avoid unused dependencies.
6. Never expose API secrets.
7. Preserve TypeScript strictness.
8. Avoid casual `any`; document exceptional uses.
9. Validate untrusted external data before domain use.
10. Maintain accessibility and responsive behavior.
11. Handle loading, success, empty, partial, error, retry, and stale data in API features.
12. Run relevant available checks after changes.
13. Claim verification only for commands or reviews actually performed.
14. Report unresolved warnings, failures, and unverified behavior.
15. Prefer composition and focused components over giant files.
16. Reuse established patterns instead of adding competing architectures.
17. Update documentation when behavior, architecture, scripts, or phase changes.
18. Do not create empty source files, speculative abstractions, duplicate types, or placeholder production logic.
19. Use meaningful, focused commits when commits are requested; do not alter global Git identity.

## Architecture and Naming

Application composition belongs in `src/app`; shared UI, layout, and chart wrappers belong in `src/components/{ui,layout,charts}`. Features live in `src/features/{dashboard,weather,currencies,economy,crypto}`. Each domain owns its API services, schemas, hooks, components, and types. Feature-specific charts stay in the feature. Shared infrastructure lives in `src/lib`, shared hooks in `src/hooks`, and truly cross-domain utilities/types/schemas in their corresponding shared directories. Avoid duplicating domain concerns globally.

Use PascalCase components and types, camelCase functions, `useX` hooks, and UPPER_SNAKE_CASE for true constants when appropriate. Prefer descriptive names over abbreviations.

## API Rules

Components should not contain uncontrolled direct API logic. Follow:

`API service → runtime validation → normalization → TanStack Query → UI`

Use Zod where useful to validate unknown response data. Keep raw API models separate from normalized domain models when their structures differ. Pass cancellation signals through Fetch, handle non-success HTTP responses, and choose caching/retry behavior appropriate to provider limits. Avoid manual server-state effects when TanStack Query owns the data. One failed API should not unnecessarily break the unified dashboard.

## TypeScript Rules

Keep strict mode enabled. Type component props and function inputs/outputs. Treat external responses as `unknown` until validated. Use interfaces, aliases, discriminated unions, and generics only where they improve clarity. Never suppress type errors to get a build through without resolving the cause.

## React Rules

Use functional components and hooks. Keep presentation and interaction separate from domain transformations. Avoid unnecessary effects and stored derived state. Separate server state from local UI state. Add another state library only when demonstrated requirements justify it.

## Styling and Responsive Rules

Establish a consistent visual language with Tailwind in Phase 1. Consider mobile, tablet, laptop, desktop, and large desktop for every interface change. Plan adaptive sidebar navigation and intentional overflow or alternate views for analytical tables. Avoid excessive chart animation, layout shifts, and decorative chart junk.

## Accessibility Rules

Use semantic HTML, keyboard-operable controls, associated labels, visible focus, meaningful control names, accessible validation, and sufficient contrast. Use ARIA only where needed. Charts need questions they answer, units, readable dates/axes, tooltips, accessible context or alternatives, and sensible empty states. Check focus behavior when navigation or dialogs change.

## Security Rules

Ignore real `.env` files; `.env.example` contains documentation and non-secret examples only. Every `VITE_*` variable is public browser data. Never place confidential keys in frontend code, URLs, logs, fixtures, or examples. If CoinGecko needs a confidential key, implement a server-side/serverless proxy in Phase 5. Validate external data and URL parameters. Avoid `dangerouslySetInnerHTML`; any unavoidable use requires documented sanitization. Validate external URL schemes and use appropriate protections for new-tab links. Review dependency risks when adding or upgrading packages.

## Testing Rules

Run only scripts that actually exist in package.json. Run `npm run lint`, `npm run test`, `npm run format:check`, and `npm run build`. Phase 2 uses Vitest, React Testing Library, and MSW for offline API and component tests. Cover transformations, schema failures, network errors, missing data, retries, and user behavior rather than mirroring implementation details. Browser, responsive, keyboard, provider, and deployment checks must be reported separately from compilation. No test script means tests were not run, not that they passed.

## Completion Checklist

- [ ] TypeScript compiles.
- [ ] Lint passes.
- [ ] Relevant tests pass, or their absence is stated.
- [ ] Loading, error, empty, partial, retry, and stale states handled where relevant.
- [ ] Responsive behavior checked where relevant.
- [ ] Accessibility considered and relevant interaction checks performed.
- [ ] No exposed secrets or unsafe external data handling.
- [ ] No unnecessary dependencies, dead code, or unrelated changes.
- [ ] Documentation updated where necessary.
- [ ] Unresolved warnings and verification limits reported.
