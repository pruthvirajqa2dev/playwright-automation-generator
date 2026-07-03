# ADR-001 — Template Engine and Context Architecture

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-01 |
| **Deciders** | Core team  |

---

## Context

The generator must produce TypeScript, JSON, Markdown, and configuration files from
parameterised templates. Two interconnected architectural decisions define the template
system: the choice of template engine, and the design of the data contract between the
engine and the templates.

---

## Decision

Use **EJS (Embedded JavaScript)** as the template engine, with a **single typed
`TemplateContext` object** as the sole data contract between `ContextBuilder` and
all templates. All logic, derivations, and computed values live in `ContextBuilder`.
Templates perform substitution and iteration only.

---

## Alternatives Considered

### Template Engine Alternatives

| Engine                          | Reason not chosen                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Handlebars**                  | Logic-less by design. Helpers required for conditionals. Template authors cannot use native JavaScript.     |
| **Mustache**                    | Stricter than Handlebars. Even simple conditionals require helper registration.                             |
| **Nunjucks**                    | Non-JavaScript syntax — additional learning burden. Larger dependency footprint.                            |
| **Custom string interpolation** | Sufficient for simple substitutions but unmanageable for conditional multi-line TypeScript/JSON generation. |

### Context Design Alternatives

| Approach                                | Reason not chosen                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Pass raw config to templates**        | Templates would contain derivation logic (slug generation, boolean flags). Logic scattered across all templates.       |
| **Multiple context objects per module** | Template authors must know which context object to use for which values. Discovery burden increases with module count. |
| **Shared global context variables**     | No type safety. Template errors surface at render time with no indication of which variable was missing.               |

---

## Rationale

### Why EJS

1. **Native JavaScript syntax.** Template authors write `<% if (automation.hasUI) { %>` — not a custom language. Anyone who knows JavaScript can read and write EJS without additional training.

2. **No magic helpers.** Operations as simple as joining an array use native JS: `<%- environments.names.join(", ") %>`. No helper registration.

3. **Minimal surface area.** Three tag types: `<% %>` (execute), `<%= %>` (escape and output), `<%- %>` (output raw). The entire syntax fits in one paragraph.

4. **Mature and stable.** EJS has been stable for a decade. It is a safe long-term dependency with no known breaking change history.

5. **Template composition via `include()`.** `<%- include("./partial.ejs") %>` enables shared partials when templates grow in complexity.

### Why a Single Typed Context Object

1. **Templates are thin.** A template that receives a fully enriched `TemplateContext` performs substitution only. There is no derivation logic to test or maintain inside templates.

2. **Single source of truth for derived values.** The `slug` for the project name is computed once in `ContextBuilder`. Every template that needs it reads `project.slug`. Changing the derivation requires editing one TypeScript file.

3. **Type safety end-to-end.** `TemplateContext` is a TypeScript interface. TypeScript catches missing properties in `ContextBuilder` before they manifest as blank values in generated output.

4. **Template isolation.** Templates can be tested by passing a fixture `TemplateContext`. No engine configuration or global state required.

---

## Consequences

**Positive:**

- Templates are immediately readable by any JavaScript developer
- Complex conditional generation (e.g. dynamic `package.json` scripts) is trivial to express
- Changing a derived value (e.g. slug format) requires editing `ContextBuilder` only — not hunting across all templates
- Template rendering is stateless and easily testable

**Negative:**

- Template authors can accidentally write logic inside templates, violating the "logic in ContextBuilder" principle. This is a discipline constraint enforced by code review.
- EJS provides no compile-time template validation. Errors surface at render time. A template test suite mitigates this risk.

---

## Future Considerations

- A template linting rule or automated test suite that renders all templates against a fixture context would catch template errors at development time rather than render time.
- The `include()` feature should be used to share common blocks (e.g. licence headers, generated-file warning comments) when templates multiply.
- If the context grows significantly, consider splitting into domain-scoped sub-contexts with a root `TemplateContext` that composes them, rather than a flat structure.

---

## Related ADRs

- [ADR-006](ADR-006-template-context-single-contract.md) — Template Context as the single typed contract (detailed)
- [ADR-003-Generator-Architecture.md](ADR-003-Generator-Architecture.md) — Generation pipeline architecture
