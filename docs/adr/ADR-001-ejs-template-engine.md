# ADR-001 — EJS as the Template Engine

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-06-01 |
| **Deciders** | Core team  |

---

## Decision

Use [EJS (Embedded JavaScript)](https://ejs.co) as the template engine for
rendering all generated framework files.

---

## Context

The generator must produce TypeScript, JSON, Markdown, and plain-text files
from parameterised templates. The template engine is a core dependency — it
determines how templates are authored, how logic is expressed, and how
maintainable the template library will be over time.

---

## Alternatives Considered

| Engine                          | Reason not chosen                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Handlebars**                  | Logic-less by design — helpers required for any conditional output. Template authors cannot use native JavaScript, making complex generation patterns verbose. |
| **Mustache**                    | Stricter logic-less philosophy than Handlebars. Even simple conditionals require helper registration, adding boilerplate to the engine setup.                  |
| **Nunjucks**                    | Powerful but introduces a non-JavaScript template syntax that team members must learn separately. Dependency footprint is larger.                              |
| **Custom string interpolation** | Sufficient for simple cases but unmanageable for multi-line conditional TypeScript/JSON generation.                                                            |

---

## Reasoning

EJS was chosen because:

1. **Native JavaScript syntax inside templates.** Template authors write `<% if (automation.hasUI) { %>` — not a custom templating language. Anyone who knows JavaScript can read and write EJS templates without additional training.

2. **No magic helpers.** Handlebars and Mustache require registering custom helpers for operations as simple as joining an array. EJS uses native JS directly: `<%- environments.names.join(", ") %>`.

3. **Minimal surface area.** EJS has three tag types (`<% %>`, `<%= %>`, `<%- %>`). The entire syntax fits on one page.

4. **Mature and stable.** EJS has been stable for a decade. It is a safe long-term dependency.

5. **Supports `include()`.** EJS supports partial templates via `<%- include("./partial.ejs") %>`, enabling template composition when needed in the future.

---

## Consequences

**Positive:**

- Templates are immediately readable by any JavaScript developer.
- Complex multi-environment configuration (e.g. dynamic `package.json` scripts) is trivial to express.
- No custom helper registration plumbing.

**Negative:**

- Template authors can accidentally write complex logic inside templates, violating the "logic in ContextBuilder only" principle. This is a discipline constraint, not a technical one.
- EJS does not provide compile-time template validation — errors surface at render time.

---

## Future Considerations

- If templates grow in complexity, consider a linting rule or template test suite that validates templates render without errors against a fixture context.
- The `<%- include() %>` feature could be used to share common header/footer blocks across templates.
