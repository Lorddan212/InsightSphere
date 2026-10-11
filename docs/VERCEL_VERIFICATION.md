# Vercel adapter verification snapshot

Date: 2026-10-10. This records the adapter-only checks before the user expanded scope to premium UI refinement. See [combined release verification](VERCEL_PREMIUM_UI_VERIFICATION.md) for the final state.

- Thin Web Request/Response entry delegates to the unchanged proxy once per warm instance.
- API routing precedes files and SPA fallback; missing built assets return 404.
- Installed Vercel CLI configuration-schema validation passed.
- Full suite passed: 349 tests in 19 files, including all 323 existing tests and 26 adapter/routing cases. An initial worker startup timeout was resolved by a complete rerun; no listener limits or isolation settings changed.
- Lint, strict TypeScript/build, formatting and whitespace checks passed. npm audit reported zero vulnerabilities.
- Main bundle: 346.08 kB; charts: 360.90 kB; CSS: 23.04 kB.
- No new dependency. TypeScript 6.0.3 and MSW 2.15.0 remain pinned.

Offline checks do not certify Vercel function packaging, production ingress, actual credentials, live providers or rendered browser behavior. No project was linked and no deployment was created.
