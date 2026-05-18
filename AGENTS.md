# AGENTS.md

This file provides project-level guidance for Codex and other agents that read `AGENTS.md`.

## Flow Package Styling

- In `packages/flow`, do not import or use `cn` for class composition.
- Compose component classes with `tv` from `tailwind-variants`.
- Prefer local or exported `tv` style definitions with slots and variants; pass `className` overrides through those slots when needed.
- Keep shared UI helpers such as `cn` inside `packages/ui`; `packages/flow` should not depend on them.
