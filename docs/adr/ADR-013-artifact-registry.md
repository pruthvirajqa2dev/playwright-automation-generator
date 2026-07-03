# ADR-013 — Artifact Registry

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-07-03 |
| **Deciders** | Core team  |
| **Sprint**   | 3          |

---

## Decision

Introduce an `ArtifactRegistry` as the single source of truth for all scaffoldable
artefacts supported by the `pw-gen add` command group.

Each artefact is described by an `ArtifactDefinition` — a self-contained descriptor
that encapsulates the command name, template file, output path derivation, display
names, CLI help text, and post-generation guidance.

The CLI and `Scaffolder` are refactored to derive all artefact-specific behaviour
from the registry at runtime, replacing three hardcoded per-artefact code paths
with a single, data-driven pipeline.

---

## Context

Sprint 2B introduced `pw-gen add component`, the third scaffoldable artefact
alongside `add page` (Sprint 1) and `add test` (Sprint 1).

Each artefact was implemented by:

1. Adding a dedicated method to `Scaffolder` (`scaffoldPage`, `scaffoldTest`,
   `scaffoldComponent`) — each with hardcoded template filenames, output paths,
   and naming rules.
2. Adding a dedicated command block to `add.ts` — each block ~40 lines of nearly
   identical code (banner, context build, scaffolder call, success message,
   next-steps guidance, error handler).

This pattern does not scale. Every new artefact (fixture, api-client, utility,
business-flow, matcher, reporter) requires:

- A new method in `Scaffolder` containing artefact-specific strings
- A new ~40-line command block in `add.ts` with duplicated orchestration logic
- No single place to inspect "what artefacts does this platform support?"

The coupling between artefact knowledge and execution infrastructure makes
the code harder to review, test, and extend.

---

## Problem

Before this sprint:

- `Scaffolder` had one method per artefact (`scaffoldPage`, `scaffoldTest`,
  `scaffoldComponent`). Each method duplicated the same pipeline with different
  string constants.
- `add.ts` had one command block per artefact. Each block duplicated the same
  orchestration logic (banner print, context build, delegate to Scaffolder,
  success print, error handler).
- There was no single place that listed the set of supported artefacts.
- Adding a new artefact required changes to two unrelated files (`Scaffolder.ts`
  and `add.ts`), neither of which should own artefact knowledge.

---

## Decision Drivers

1. **Extensibility** — Future artefacts should require minimal change surface.
2. **Single source of truth** — The set of supported artefacts should be inspectable
   from one place.
3. **Reduced coupling** — Artefact knowledge should not live in orchestration code.
4. **No external regressions** — The external CLI behaviour must remain identical.
5. **Minimal complexity** — The registry should be a lightweight data structure,
   not a plugin system or dependency container.

---

## Solution

### ArtifactDefinition

A typed interface that each artefact satisfies:

```typescript
interface ArtifactDefinition {
  command: string; // CLI subcommand name
  label: string; // banner display
  templateFile: string; // EJS template filename
  outputPath: (context: ScaffoldContext) => string; // derived output path
  displayName: (context: ScaffoldContext) => string; // derived display name
  description: string; // --help text
  example: string; // --help example
  successTitle: string; // success headline
  nextSteps: (context: ScaffoldContext, outputPath: string) => string; // next-steps text
}
```

### ArtifactRegistry

A `Map<string, ArtifactDefinition>` wrapped in a class with `register()`,
`resolve()`, and `all()` methods. A pre-populated `artifactRegistry` singleton
is exported and imported wherever artefact resolution is needed.

### Scaffolder refactoring

`scaffoldPage`, `scaffoldTest`, and `scaffoldComponent` are replaced by a single
generic method:

```typescript
async scaffold(
  definition: ArtifactDefinition,
  rawName: string,
  frameworkDir: string,
  force = false,
): Promise<string>
```

The method delegates to `definition.outputPath(context)` and
`definition.templateFile` instead of hardcoded strings. The private
`writeArtifact()` method is unchanged.

### CLI refactoring

The three command blocks in `add.ts` are replaced by a `for` loop over
`artifactRegistry.all()` and a single `createAction(definition)` factory
function. All artefact-specific strings are sourced from the definition.

---

## Consequences

### Positive

**Extensibility**: Adding a new artefact requires:

1. A new file in `src/scaffold/artifacts/`
2. One `.register()` call in `ArtifactRegistry.ts`
3. One EJS template in `src/modules/scaffold/templates/`

No changes to `add.ts`, `Scaffolder.ts`, or any other existing file are needed.

**Single source of truth**: `artifactRegistry.all()` is the authoritative list
of supported artefacts. Discovery, documentation generation, and help output
all derive from the same source.

**Reduced coupling**: `Scaffolder` no longer contains artefact-specific string
constants. `add.ts` no longer contains artefact-specific banner text or next-step
guidance. Each concern lives in its own file.

**Reduced code volume**: `Scaffolder.ts` is reduced by ~70 lines (three methods →
one). `add.ts` is reduced by ~160 lines (three command blocks → one loop + factory).
The removed code is pure duplication.

### Neutral

**Registry initialisation cost**: The registry is populated at module load time
via three `register()` calls. This is negligible and runs once per CLI invocation.

**Indirection**: Artefact-specific strings now live in `src/scaffold/artifacts/`
rather than inline in `Scaffolder.ts` and `add.ts`. This is a deliberate trade-off
— indirection is the mechanism that enables extensibility.

### Negative

None identified. The external CLI interface is unchanged. All existing artefacts
produce identical output. The internal API surface (TypeScript methods) changes,
but `Scaffolder` and `add.ts` are internal to the generator and have no external
callers.

---

## Alternatives Considered

### Option A — Continue adding per-artefact methods and command blocks

**Rejected.** Each new artefact would duplicate ~40 lines in `add.ts` and ~20
lines in `Scaffolder.ts`. By the fifth artefact the pattern would be visibly
unsustainable.

### Option B — Dynamic filesystem-based discovery

Scan `src/scaffold/artifacts/` at runtime and import every `.ts` file as a
definition. No explicit registration step required.

**Rejected for now.** Filesystem scanning at CLI startup adds latency, requires
careful path handling across compiled and development environments, and is
significantly more complex than explicit registration. The current set of artefacts
is small and well-known; the complexity is not justified. This option remains open
for a future sprint if the artefact count grows large enough.

### Option C — Abstract base class instead of interface

Define `abstract class BaseArtifact` that artefact subclasses extend, with
template methods for output path and display name derivation.

**Rejected.** An interface is sufficient. TypeScript structural typing means any
object that satisfies `ArtifactDefinition` works without inheritance. A base class
would add ceremony without benefit.

---

## Related

- [ADR-003 — Generator Architecture](ADR-003-Generator-Architecture.md) — the module
  manifest pattern that this decision mirrors for scaffold artefacts
- [ADR-005 — Current MVP](ADR-005-Current-MVP.md) — the sprint context
- [ARCHITECTURE.md — Artifact Registry](../ARCHITECTURE.md#artifact-registry)
