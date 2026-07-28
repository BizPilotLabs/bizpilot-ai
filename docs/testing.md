# Testing

BizPilot AI uses one testing stack across the monorepo:

- Vitest for TypeScript tests.
- Supertest for Express route integration tests.
- Testing Library for React component tests.
- MSW for frontend API mocking.
- V8 coverage through `@vitest/coverage-v8`.

## Commands

Run all test tasks through Turborepo:

```bash
pnpm test
pnpm test:run
pnpm test:coverage
```

Run package tests directly:

```bash
pnpm --filter @bizpilot-ai/api test:run
pnpm --filter @bizpilot-ai/web test:run
```

Watch mode:

```bash
pnpm --filter @bizpilot-ai/api test:watch
pnpm --filter @bizpilot-ai/web test:watch
```

## Backend Structure

API tests live under `apps/api/tests`.

- `setup/env.ts` sets deterministic test-only environment variables before modules are imported.
- `helpers/fixtures.ts` contains deterministic builders for organizations, users, roles and permissions.
- `unit` contains service-focused tests with repository boundaries mocked.
- `integration` contains Express route tests using the real application and middleware stack where practical.

## Database Strategy

This milestone does not provision a disposable PostgreSQL database. Service tests mock repositories, and route tests avoid live database access. Future persistence integration tests should use a dedicated PostgreSQL database through `TEST_DATABASE_URL` and must refuse to run unless `NODE_ENV=test`.

Never point tests at development or production databases.

## Frontend Structure

Frontend tests live next to feature pages and use helpers in `apps/web/src/test`.

- `server.ts` configures MSW.
- `setup.ts` installs Testing Library matchers, starts MSW and resets Zustand state.
- `render-with-providers.tsx` wraps components with Memory Router, TanStack Query and Toast providers.

Query retries are disabled in tests to keep failures fast and deterministic.

## Coverage

Coverage reports are written to each package's `coverage` directory and are excluded from Git. No global failure threshold is enforced yet because this is the first automated testing milestone. Add module-level thresholds after the initial suite stabilizes.

## CI Notes

No CI workflow existed when this testing foundation was added. A future validation workflow should run:

```bash
pnpm install
pnpm --filter @bizpilot-ai/api exec prisma.cmd validate
pnpm --filter @bizpilot-ai/api exec prisma.cmd generate
pnpm --filter @bizpilot-ai/api build
pnpm --filter @bizpilot-ai/web build
pnpm --filter @bizpilot-ai/api lint
pnpm --filter @bizpilot-ai/web lint
pnpm test:run
```

Use `prisma validate` instead of `prisma.cmd validate` on non-Windows systems.
