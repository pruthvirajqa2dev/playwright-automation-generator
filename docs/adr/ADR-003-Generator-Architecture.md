# ADR-003 — Generator Architecture: Five-Stage Pipeline

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-01 |
| **Deciders** | Core team  |

---

## Context

The generator must reliably transform user configuration into a set of generated
files. The architecture of the generation engine determines: how errors are caught
and reported, whether partial output can occur, how modules compose, and how the
codebase is maintained as complexity grows.

Multiple architectures are possible — a single monolithic function, a streaming
pipeline, a plugin-based system, or a staged pipeline. The choice has long-term
implications for testability, debuggability, and the ability to add new capabilities.

---

## Decision

The generation engine uses a **five-stage, staged pipeline** with clear separation
of concerns across four stateless components:

1. **Validate** — Zod validates user input at the CLI boundary
2. **Build Context** — `ContextBuilder` transforms config into a typed `TemplateContext`
3. **Resolve Modules** — `ModuleRegistry` returns the ordered set of module manifests
4. **Render Templates** — `TemplateRenderer` renders all EJS templates into in-memory `StagedFile[]`
5. **Write Files** — `FileWriter` writes the staged files to the output directory

The `Assembler` orchestrates these stages in sequence. It has one public method:
`assemble(config, outputDir)`.

---

## Alternatives Considered

### Monolithic Generator Function

A single function that reads config, processes templates, and writes files in one
pass. No separation between context building, rendering, and writing.

**Why rejected:**

- A template error writes partial output. Cleaning up requires manual intervention.
- Logic for derivation, rendering, and writing are entangled. Unit testing any one
  part requires testing all parts.
- Adding a new stage (e.g. a validation step after rendering) requires modifying
  the function body rather than inserting a new stage.

### Streaming Pipeline

Render and write each template immediately as it is processed, rather than
staging all renders in memory before writing.

**Why rejected:**

- A template error partway through leaves a partially-written output directory.
  The user's output directory is in an unknown, unusable state.
- Rolling back a partial write is more complex than never writing until all
  renders succeed.
- The memory cost of staging all files is negligible for a code generator — the
  output is dozens of files, not gigabytes.

### Plugin-Based Runtime System

A plugin architecture where modules register themselves and are invoked at
generation time through a discovery mechanism.

**Why rejected:**

- Plugin discovery and ordering is a solved problem in the explicit module registry.
- Plugin systems add complexity (registration, lifecycle hooks, conflict detection)
  without providing capability that the manifest-based module system lacks.
- See [ADR-003-module-composition-at-generation-time.md](ADR-003-module-composition-at-generation-time.md)
  for the detailed module composition rationale.

---

## Rationale

### Two-Phase Rendering (Stage-Then-Write)

Separating rendering from writing is the most important architectural decision in
the pipeline. The guarantee it provides is:

> **A template error can never produce a partially-written output directory.**

If any template fails to render, `TemplateRenderer` throws before `FileWriter` is
called. The output directory is never created. The user sees an error and their
filesystem is untouched.

This guarantee eliminates an entire class of failure mode — the frustrating
scenario where a command fails halfway through and leaves behind a broken
directory that must be diagnosed and cleaned up before retrying.

### Clear Component Responsibilities

Each component in the pipeline has a single responsibility:

| Component          | Input                        | Output              | Responsibility                                   |
| ------------------ | ---------------------------- | ------------------- | ------------------------------------------------ |
| `ContextBuilder`   | `GeneratorConfig`            | `TemplateContext`   | Enrich config — derive slugs, booleans, metadata |
| `ModuleRegistry`   | Module selection flags       | `ModuleManifest[]`  | Resolve ordered module set with dependencies     |
| `TemplateRenderer` | `ModuleManifest[]` + context | `StagedFile[]`      | Render all templates into memory                 |
| `FileWriter`       | `StagedFile[]` + outputDir   | Files on disk       | Write staged files, create directories           |
| `Assembler`        | Config + outputDir           | Side effect (files) | Orchestrate the four stages in order             |

This separation means each component can be unit-tested independently with
controlled inputs and inspectable outputs.

### Assembler as the Single Orchestration Point

The `Assembler` is the only component that knows the order of stages. This means:

- Adding a new stage (e.g. post-render validation) requires one change: inserting
  a call in `Assembler.assemble()`.
- Stage components never call each other — they receive inputs and return outputs.
- The full pipeline is readable from top to bottom in a single method.

---

## Pipeline Diagram

```
pw-gen new --name "FMS" --org "SIMS" --app "FMS" --output ./playwright-fms
      │
      │  CLI: parse flags or JSON config file
      ▼
GeneratorConfig   (Zod-validated; throws on invalid input)
      │
      │  ContextBuilder: enrich and derive
      ▼
TemplateContext
  { project, automation, environments, modules, generator }
      │
      │  ModuleRegistry: resolve ordered module set
      ▼
ModuleManifest[]   [core, ...optional]
      │
      │  TemplateRenderer: render all templates (in-memory, all-or-nothing)
      ▼
StagedFile[]
  [ { outputPath: "playwright.config.ts", content: "..." },
    { outputPath: "src/pages/BasePage.ts", content: "..." },
    ...13 files (core module) ]
      │
      │  FileWriter: write to disk (only if all renders succeeded)
      ▼
./playwright-fms/
  ├── playwright.config.ts
  ├── package.json
  └── src/
      └── ...
```

---

## Consequences

**Positive:**

- Partial output is impossible — either all files are written or none are
- Each stage is independently testable with typed inputs and outputs
- Adding a new stage requires a single insertion in `Assembler.assemble()`
- The pipeline is explicit and traceable — no hidden state between stages
- The `StagedFile[]` representation enables dry-run mode (`--dry-run` flag) with no changes to the pipeline

**Negative:**

- All templates must render successfully before any file is written — there is
  no incremental output for partial success. This is the correct behavior for a
  code generator but means all errors surface together, not one at a time.
- In-memory staging adds minimal overhead. For a generator producing hundreds of
  files, this would need profiling. At current scale (13 files), it is irrelevant.

---

## Future Considerations

- **Dry-run mode:** `FileWriter` can be replaced with a `DryRunWriter` that logs
  planned writes without touching the filesystem. The rest of the pipeline is unchanged.
- **Parallel rendering:** `TemplateRenderer` currently renders templates sequentially.
  For large module sets, parallel rendering (via `Promise.all`) would be a drop-in
  optimisation.
- **Post-render validation:** A `TemplateValidator` stage between rendering and writing
  could verify that rendered TypeScript compiles, rendered JSON is valid, etc.
- **Upgrade pipeline:** The `pw-gen upgrade` command (v0.7) will use the same pipeline
  with a `DiffWriter` that compares staged output against existing files.

---

## Related ADRs

- [ADR-001-Template-Engine.md](ADR-001-Template-Engine.md) — Template engine and context architecture
- [ADR-003](ADR-003-module-composition-at-generation-time.md) — Module composition at generation time
- [ADR-005](ADR-005-zod-validation-at-cli-boundary.md) — Zod validation at the CLI boundary
- [ADR-006](ADR-006-template-context-single-contract.md) — Template context as the single typed contract
