# ADR-005 — Zod Validation at the CLI Boundary

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-01 |
| **Deciders** | Core team  |

---

## Decision

All user-supplied configuration (whether from CLI flags or a JSON config file)
is validated with [Zod](https://zod.dev) at the CLI layer before any generation
begins. The rest of the pipeline (ContextBuilder, TemplateRenderer, FileWriter)
operates on a fully-typed, guaranteed-valid `GeneratorConfig` object.

---

## Context

The generator accepts input from two sources: individual CLI flags and a JSON
configuration file. Both are untyped at the point of entry. Invalid input —
a missing required field, an invalid environment name, an unknown automation
type — must be caught and reported clearly before any files are created.

---

## Alternatives Considered

### Manual validation with if-statements

Validate individual fields with explicit checks (`if (!options.name)`) and
print custom error messages. Simple for a small number of fields; becomes
unwieldy as the configuration schema grows.

**Why not chosen:** Does not produce a typed `GeneratorConfig` object. Field
constraints (e.g. `type` must be `"ui" | "api" | "both"`) are checked
separately from the type system. Adding a new field requires writing both
the validation logic and the type annotation separately.

### TypeScript interface with runtime casting

Define a TypeScript interface and cast the parsed input to it. Relies on the
caller providing valid data — no actual runtime validation occurs.

**Why not chosen:** Does not catch invalid input. Would produce confusing
errors deep in the pipeline (e.g. in a template) rather than at the entry point.

---

## Reasoning

Zod was chosen because:

1. **Schema is the single source of truth.** The Zod schema (`src/config/schema.ts`)
   defines both the runtime validation rules and the TypeScript type (`GeneratorConfig`).
   There is no duplication between a type definition file and a validation file.

2. **Rich error messages.** Zod produces structured error objects with field paths
   and human-readable messages. Invalid input is reported before the filesystem
   is touched.

3. **Defaults.** Zod handles default values (`automation.type` defaults to `"ui"`,
   `environments.default` defaults to the first environment name). Default logic
   lives in the schema, not scattered through the CLI command handler.

4. **Single validation point.** Whether input comes from flags or a JSON file,
   both paths flow through the same `GeneratorConfigSchema.parse()` call. There
   is one place to add new fields, new constraints, or new defaults.

5. **TypeScript integration.** `z.infer<typeof GeneratorConfigSchema>` gives the
   downstream pipeline a fully-typed config object with no casting required.

---

## Consequences

**Positive:**

- Invalid configurations are rejected with clear messages before any files are written.
- Adding a new configuration field requires only editing the Zod schema — the type and validation are updated simultaneously.
- The rest of the pipeline can assume the config is valid and skip defensive checks.

**Negative:**

- Zod is an additional dependency. For a CLI tool that is not distributed as a library, this is acceptable.
- The JSON config file format is tightly coupled to the Zod schema structure. Changing field names is a breaking change for users with existing config files.

---

## Future Considerations

- A `pw-gen validate --config pw-gen.config.json` command could expose Zod validation as a standalone check, useful for CI/CD pre-flight validation.
- As the configuration schema grows (new module flags, new environment options), consider organising the schema into sub-schemas per concern (project, automation, modules, environments).
