# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## End-to-End Tests

The web app uses Playwright for browser workflows that need real layout,
pointer events, dialogs, and React Flow behavior.

```bash
pnpm test:e2e
```

Runs the full Playwright suite for `apps/web`, including smoke specs.

```bash
pnpm --filter web test:e2e:smoke
```

Runs only files ending in `.smoke.spec.ts` in Chromium. AI agents should run
this after workflow editor UI, browser interaction, example, or Playwright-covered
changes.

```bash
pnpm --filter web test:e2e:ui
```

Opens Playwright UI mode for authoring and debugging e2e tests.

Before PR, merge, or archiving an OpenSpec change, run the full e2e command
alongside the relevant lint, typecheck, and unit test commands.
