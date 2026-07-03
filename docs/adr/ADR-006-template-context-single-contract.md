# ADR-006 — TemplateContext as the Single Typed Contract Between Engine and Templates

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-01 |
| **Deciders** | Core team  |

---

## Decision

All logic and computed values are resolved in `ContextBuilder` and stored in
a single typed `TemplateContext` object. EJS templates perform substitution
and iteration only — they contain no conditional logic, no computations, and
no function calls beyond simple array methods.

---

## Context

Template engines allow varying degrees of logic within templates. EJS in
particular allows arbitrary JavaScript. Without a discipline rule, templates
can accumulate logic: conditional imports, computed paths, inline string
manipulation. This makes templates hard to read, hard to test, and produces
surprising output when context values change.

---

## Reasoning

Separating logic from templates is enforced by convention:

1. **Templates are the view layer.** A template's job is to express the
   structure of a generated file with substitution slots. It should be
   readable as a near-facsimile of the file it generates.

2. **ContextBuilder is testable TypeScript.** The derivation of `project.slug`,
   the `automation.hasUI` boolean, the `environments.count` — these are plain
   TypeScript functions that can be unit-tested with standard tooling. Template
   logic cannot be unit-tested without rendering the entire template.

3. **One place to change derived values.** If the slug algorithm changes (e.g.
   to support Unicode characters), the fix is in one TypeScript function. If slug
   computation lived in templates, it would need to be updated in every template
   that uses it.

4. **Stability under context evolution.** When a new context field is added
   (e.g. `project.applicationSlug`), it is added to `ContextBuilder` and the
   TypeScript interface. Templates that don't use the new field are unaffected.
   Templates that need it reference it directly.

---

## Applied Rule

> Templates may use: `<%- value %>`, `<%= value %>`, `<%- array.join("…") %>`,
> `<% for (const item of array) { %>`, `<% if (condition) { %>`.
>
> Templates may NOT use: function definitions, variable declarations, external
> `require()` calls, or multi-step computations.

---

## Consequences

**Positive:**

- Templates are readable by anyone familiar with the output file format — no EJS expertise required.
- Context logic is unit-testable and type-checked at compile time.
- A new engineer can understand what a template produces by reading the template and the `TemplateContext` interface.

**Negative:**

- Template authors must request additions to `ContextBuilder` when they need a new derived value. This adds a small overhead compared to computing inline.
- The discipline is enforced by convention, not by the toolchain. A future linting rule could enforce it mechanically.

---

## Future Considerations

- A `ContextBuilder` unit test suite would validate that all derived values are computed correctly for a range of input configs.
- An EJS linter or reviewer convention could detect templates that violate the "no logic in templates" rule.
