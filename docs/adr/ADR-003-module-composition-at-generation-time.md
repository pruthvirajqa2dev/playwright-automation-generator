# ADR-003 — Module Composition at Generation Time

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-01 |
| **Deciders** | Core team  |

---

## Decision

Optional framework capabilities (authentication helpers, API testing utilities,
database fixtures, email verification, etc.) are composed **at generation time**
by rendering additional EJS templates into the output directory. They are not
loaded as plugins, injected as providers, or delivered as runtime packages.

---

## Context

Enterprise automation frameworks need more than a basic structure. Over time,
projects require authentication utilities, API clients, database seeders, PDF
extractors, and more. There must be a design for how these capabilities are
added.

Two viable approaches exist:

- **Runtime composition:** A plugin system where modules are loaded and configured when tests run.
- **Generation-time composition:** Module templates are rendered once, producing a flat, unified codebase.

pw-gen uses generation-time composition.

---

## Alternatives Considered

### Runtime plugin system

A plugin system where modules register themselves with a central runner at test
start-up. The generated framework imports a `pw-gen` runtime that discovers and
initialises configured plugins.

**Why rejected:**

1. **Adds runtime complexity with no benefit.** Playwright's fixture system
   already provides a clean composition mechanism (`test.extend()`). Building a
   separate plugin layer on top duplicates this without adding capability.

2. **Requires a maintained runtime package.** Every generated project would
   depend on a `@pw-gen/runtime` package. See ADR-002 for why runtime dependencies
   are avoided.

3. **Discovery and ordering complexity.** Plugin systems require solving module
   discovery, initialisation ordering, conflict detection, and version
   compatibility — all ongoing maintenance burden.

4. **Obscures the generated code.** If a page object helper comes from a plugin,
   the automation engineer must look in two places to understand how the framework
   behaves.

---

## Reasoning

Generation-time composition is chosen because:

1. **The output is always a flat, unified codebase.** After generation with
   `core + auth + api`, the engineer sees a single `src/` directory containing
   all the code. There is no distinction between "core code" and "module code"
   in the generated project — it is one coherent framework.

2. **Modules can modify any layer.** An `auth` module can contribute templates
   for pages (`AuthPage.ts`), fixtures (`auth.ts`), utilities (`credentials.ts`),
   and npm packages — all in one manifest. There is no restriction on which layer
   a module can touch.

3. **No runtime overhead.** Module selection happens once at generation. The
   generated framework's test runner has no awareness of modules at all.

4. **Fixture composition via `test.extend()`** is the Playwright-idiomatic way
   to compose test capabilities. Modules generate the `.extend()` calls that wire
   their fixtures into the test object — no custom composition system is needed.

5. **Ordering is explicit.** `ModuleRegistry.resolve()` returns modules in a
   deterministic order. `core` is always first. Module templates are rendered in
   order, so later modules can override files contributed by earlier ones.

---

## How It Works

Each module declares a `ModuleManifest` with:

- A `templates/` directory mirroring the output structure
- A `files` array mapping each template to its output path
- `packageDependencies` to merge into `package.json`
- `npmScripts` to merge into the `scripts` block

When multiple modules are composed, `TemplateRenderer` iterates modules in
resolution order and renders all their templates. `FileWriter` writes them all
to the output directory. If two modules contribute the same output path, the
later module wins (override semantics).

---

## Consequences

**Positive:**

- Generated frameworks are simple, flat codebases with no runtime composition machinery.
- Module authors work in TypeScript and EJS — no framework-specific API to learn.
- The full output can be reviewed and understood by reading the generated files alone.
- Adding a new module requires only: a `manifest.ts` + a `templates/` directory.

**Negative:**

- Modules cannot adapt their output based on what other modules generated (no inter-module communication at render time). If module B needs to know what module A generated, it must express that through the shared `TemplateContext`.
- There is no hot-reloading or incremental module addition after initial generation. Re-running `pw-gen new` overwrites the output (though a future `pw-gen upgrade` command could handle this more carefully).

---

## Future Considerations

- `TemplateContext.modules` already has boolean flags for known optional modules (`email`, `pdf`, etc.). Core templates can conditionally include import statements or comments based on these flags, enabling cross-module awareness at render time.
- Module dependency resolution (a module requiring another module) is already modelled in `ModuleManifest.dependencies` — implementation is deferred until a second module with a dependency exists.
