# Architecture — Playwright Automation Generator

> **pw-gen** is a CLI tool that generates opinionated, enterprise-grade Playwright
> TypeScript frameworks from a set of composable module templates.
>
> For the project vision, goals, and non-goals, see [PROJECT.md](PROJECT.md).
> For Playwright alignment decisions, see [PLAYWRIGHT_ALIGNMENT.md](PLAYWRIGHT_ALIGNMENT.md).

---

## Table of Contents

- [Product Vision](#product-vision)
- [Core Concept](#core-concept)
- [High-Level Architecture](#high-level-architecture)
- [Major Components](#major-components)
- [Generation Pipeline](#generation-pipeline)
- [Scaffolding Engine](#scaffolding-engine)
- [Module System](#module-system)
- [Template Engine](#template-engine)
- [Template Context](#template-context)
- [Generated Framework Anatomy](#generated-framework-anatomy)
- [Design Principles](#design-principles)

---

## Product Vision

Most automation teams start a new project by manually assembling a Playwright
framework from scratch — copying boilerplate, wiring up environment configs,
choosing a logger, deciding on a Page Object structure. This takes days, produces
inconsistent results, and means each team inherits its own slightly-different
foundation.

**pw-gen** solves this by encoding the complete enterprise automation foundation
into a generator. Running one command produces a fully-structured, immediately
runnable framework that reflects production engineering standards — not a tutorial
skeleton.

The generator is also the long-term governance mechanism. When best practices
evolve, the templates are updated once and all future projects inherit the improvement.

---

## Core Concept

```
CLI input (flags or JSON)
        │
        ▼
  ValidatedConfig
        │
        ▼
  TemplateContext   ◄──  buildContext()  enriches and shapes the config
        │
        ▼
  Module resolution  ◄──  always: core; optional: auth, api, db, …
        │
        ▼
  Template rendering  ◄──  EJS renders each template with the shared context
        │
        ▼
  StagedFiles (in-memory)
        │
        ▼
  FileWriter  ──►  output directory (generated framework)
```

The generated framework is a **complete, independent project**. It has its own
`package.json`, its own `node_modules`, and no runtime dependency on pw-gen.
The generator is a one-time scaffolding tool, not a runtime library.

---

## High-Level Architecture

```
playwright-automation-generator/     ← the generator (this repo)
│
├── src/
│   ├── cli/                         ← Commander.js CLI entry-point
│   │   ├── index.ts                 Commander program root
│   │   └── commands/
│   │       ├── generate.ts          "pw-gen new" command — validates + calls Assembler
│   │       └── add.ts               "pw-gen add" command group — calls Scaffolder
│   │
│   ├── config/
│   │   └── schema.ts                Zod schema — validates user input at the CLI boundary
│   │
│   ├── engine/                      ← core generation pipeline (stateless)
│   │   ├── Assembler.ts             Orchestrates the full pipeline (1 public method)
│   │   ├── ContextBuilder.ts        Config → TemplateContext transformation
│   │   ├── TemplateRenderer.ts      EJS rendering → StagedFile[] + renderSingle()
│   │   └── FileWriter.ts            StagedFile[] → filesystem writes
│   │
│   ├── scaffold/                    ← scaffolding engine (reuses engine components)
│   │   ├── ScaffoldContext.ts       ScaffoldContext interface + buildScaffoldContext()
│   │   └── Scaffolder.ts           Orchestrates single-artefact scaffold operations
│   │
│   ├── modules/                     ← composable module definitions
│   │   ├── types.ts                 ModuleManifest and ModuleFileDefinition interfaces
│   │   ├── registry.ts              ModuleRegistry — module resolution and ordering
│   │   ├── core/                    ← the "core" module (always included)
│   │   │   ├── manifest.ts          Declares template→output file mappings
│   │   │   └── templates/           EJS templates for the generated framework
│   │   │       ├── playwright.config.ts.ejs
│   │   │       ├── package.json.ejs
│   │   │       ├── README.md.ejs
│   │   │       └── src/
│   │   │           ├── config/env.ts.ejs
│   │   │           ├── fixtures/test.ts.ejs
│   │   │           ├── logging/logger.ts.ejs
│   │   │           ├── pages/BasePage.ts.ejs
│   │   │           ├── pages/LoginPage.ts.ejs
│   │   │           └── tests/smoke/login.smoke.spec.ts.ejs
│   │   │
│   │   └── scaffold/                ← scaffold artefact templates
│   │       └── templates/
│   │           ├── page.ts.ejs      Page Object scaffold template
│   │           └── test.spec.ts.ejs Test file scaffold template
│   │
│   └── utils/
│       └── string.ts                toSlug(), toKebabCase(), toCamelCase(), toPascalCase()
│
└── Generated/                       ← sample generated output (gitignored)
    └── playwright-fms/              ← example: FMS framework
```

---

## Component Dependencies

```
src/cli/
  index.ts ──────────► commands/generate.ts
                              │
                              │  new GeneratorConfig (Zod-validated)
                              ▼
                         Assembler
                         ┌────────────────────────────────────┐
                         │  1. ContextBuilder.build(config)   │
                         │         ▼ TemplateContext          │
                         │  2. ModuleRegistry.resolve(config) │
                         │         ▼ ModuleManifest[]         │
                         │  3. TemplateRenderer.render(       │
                         │       manifests, context)          │
                         │         ▼ StagedFile[]             │
                         │  4. FileWriter.write(              │
                         │       stagedFiles, outputDir)      │
                         └────────────────────────────────────┘
                                       │
                                       ▼
                              Output directory
                             (generated framework)
```

Each component is stateless. Components receive inputs and return outputs — they
do not call each other. Only `Assembler` knows the pipeline order.

---

## Major Components

### CLI (`src/cli/`)

The CLI is the sole entry point. It uses [Commander.js](https://github.com/tj/commander.js)
to parse either individual flags (`--name`, `--org`, `--app`, …) or a JSON
configuration file (`--config`). All input is validated with Zod before any
files are touched.

The CLI does no generation itself — it validates input, resolves the output
directory, and delegates everything to `Assembler`.

### Assembler (`src/engine/Assembler.ts`)

The top-level orchestrator. Has one public method: `assemble(config, outputDir)`.
Calls `ContextBuilder`, `ModuleRegistry`, `TemplateRenderer`, and `FileWriter`
in sequence. Keeps the pipeline explicit and easy to trace — each stage has a
clear responsibility.

### ContextBuilder (`src/engine/ContextBuilder.ts`)

Transforms a validated `GeneratorConfig` into a single `TemplateContext` object.
All logic and derived values live here — slugs, booleans, enriched descriptions.
Templates receive the result and perform substitution only; they contain no logic.

This separation keeps templates maintainable. Changing a derived value (e.g.
how the package slug is computed) requires editing one TypeScript file, not
searching through every template.

### TemplateRenderer (`src/engine/TemplateRenderer.ts`)

Iterates over all module manifests, reads each `.ejs` template from disk, renders
it with `ejs.render(source, context)`, and returns an array of `StagedFile`
objects. Nothing is written to disk at this stage — rendering is fully in-memory.

### FileWriter (`src/engine/FileWriter.ts`)

Receives the `StagedFile[]` array and writes each file to the output directory,
creating intermediate directories as needed. Because all rendering happens before
any writing begins, a template error can never produce a partially-written output
directory.

### ModuleRegistry (`src/modules/registry.ts`)

Maintains the catalogue of available modules. Resolves the ordered set of modules
for a given run: `alwaysIncluded` modules (currently only `core`) are prepended
automatically. Future optional modules (auth, api, database, …) will be resolved
here with dependency checking.

### ModuleManifest (`src/modules/types.ts`)

The contract every module must satisfy. A manifest declares:

- The module's name, version, and description
- Whether it is always included (`alwaysIncluded: true`)
- Which other modules it requires (`dependencies`)
- The path to its template directory
- The list of template→output file mappings
- npm packages to add to the generated `package.json`
- npm scripts to merge into the generated `package.json`

---

## Generation Pipeline

```
pw-gen new --name "FMS" --org "SIMS" --app "FMS" --output Generated/playwright-fms
      │
      │  1. Parse and validate
      ▼
GeneratorConfig (Zod-validated)
      │
      │  2. Build context
      ▼
TemplateContext
  { project, automation, environments, modules, generator }
      │
      │  3. Resolve modules
      ▼
ModuleManifest[]   [core]  (in resolution order)
      │
      │  4. Render templates
      ▼
StagedFile[]   (in-memory; not yet on disk)
  [ { outputPath: "playwright.config.ts", content: "…" },
    { outputPath: "src/pages/BasePage.ts", content: "…" },
    … 13 files total (core module only) ]
      │
      │  5. Write to disk
      ▼
Generated/playwright-fms/
  ├── playwright.config.ts
  ├── package.json
  ├── README.md
  └── src/ …
```

---

## Scaffolding Engine

The Scaffolding Engine allows engineers to add individual artefacts to an
**existing** generated framework. It is the second mode of pw-gen — complementing
full-framework generation with incremental productivity commands.

### Commands

```
pw-gen add page <Name>   — Scaffold a Page Object extending BasePage
pw-gen add test <Name>   — Scaffold a Playwright test file
```

### Scaffolding Pipeline

```
pw-gen add page Supplier --output ./playwright-fms
      │
      │  1. Validate framework exists (playwright.config.ts present)
      │  2. Normalise name input to PascalCase
      ▼
buildScaffoldContext("Supplier")
  → { name: "Supplier", slug: "supplier", camelName: "supplier", generator: {…} }
      │
      │  3. Render scaffold template
      ▼
TemplateRenderer.renderSingle(templatePath, outputPath, context)
  → StagedFile  { outputPath: "src/pages/SupplierPage.ts", content: "…" }
      │
      │  4. Overwrite check (throws if file exists and --force not set)
      │  5. Write to framework root
      ▼
FileWriter.write(frameworkDir, [stagedFile])
  → playwright-fms/src/pages/SupplierPage.ts
```

### Reused Infrastructure

The Scaffolding Engine is built on top of the existing generation engine — no
logic is duplicated:

| Component                                          | Reuse                                             |
| -------------------------------------------------- | ------------------------------------------------- |
| `TemplateRenderer.renderSingle()`                  | EJS rendering for single-file scaffold operations |
| `FileWriter.write()`                               | Atomic file write with directory creation         |
| `toKebabCase()`, `toCamelCase()`, `toPascalCase()` | Name derivation in `ScaffoldContext`              |

The only new components are `ScaffoldContext` (lighter context shape for artefact
templates) and `Scaffolder` (the orchestrator that sequences the scaffold pipeline).

### ScaffoldContext

Scaffold templates receive a `ScaffoldContext` — a much lighter object than the
full `TemplateContext` used by generation runs:

```typescript
{
  name: string; // PascalCase: "Supplier", "SupplierSearch"
  slug: string; // kebab-case: "supplier", "supplier-search"
  camelName: string; // camelCase: "supplier", "supplierSearch"
  generator: {
    version: string;
    generatedAt: string;
  }
}
```

All name derivations live in `buildScaffoldContext()`. Scaffold templates are
thin substitution views — they contain no logic.

### Overwrite Protection

The Scaffolder checks for an existing file before any write occurs. If the target
file already exists and `--force` is not specified, the operation throws with a
clear message:

```
Error: File already exists: src/pages/SupplierPage.ts
  Use --force to overwrite the existing file.
```

### Scaffold Templates

Scaffold templates live in `src/modules/scaffold/templates/` and follow the same
EJS conventions as full-generation templates:

| Template           | Output path                | Command                  |
| ------------------ | -------------------------- | ------------------------ |
| `page.ts.ejs`      | `src/pages/{Name}Page.ts`  | `pw-gen add page <Name>` |
| `test.spec.ts.ejs` | `src/tests/{slug}.spec.ts` | `pw-gen add test <Name>` |

### Future Extension Points

The scaffold foundation is intentionally minimal. Each future `pw-gen add` command
adds one template file and one method to `Scaffolder`:

| Future command                    | Template               | Notes                                                  |
| --------------------------------- | ---------------------- | ------------------------------------------------------ |
| `pw-gen add fixture <Name>`       | `fixture.ts.ejs`       | Typed AppFixtures extension                            |
| `pw-gen add api <Name>`           | `api-client.ts.ejs`    | Requires api module                                    |
| `pw-gen add module <name>`        | n/a                    | Installs an optional module into an existing framework |
| `pw-gen add business-flow <Name>` | `business-flow.ts.ejs` | Multi-page workflow class                              |
| `pw-gen add utility <Name>`       | `utility.ts.ejs`       | Typed utility helper                                   |

---

## Module System

A module is a directory under `src/modules/{name}/` containing:

```
src/modules/core/
├── manifest.ts          TypeScript — exports `const manifest: ModuleManifest`
└── templates/           EJS templates (mirroring the output structure)
    ├── playwright.config.ts.ejs
    └── src/
        ├── pages/
        │   ├── BasePage.ts.ejs
        │   └── LoginPage.ts.ejs
        └── …
```

Modules are composed **at generation time**, not at runtime. When a new module
is selected, its templates are rendered into the same output directory alongside
the core templates. The generated framework is a single unified project — it
contains no reference to pw-gen modules after generation.

The `core` module is always included and always rendered first. Future modules
(e.g. `auth`, `api`) will add to or override files contributed by `core` via
the ordering in `ModuleRegistry.resolve()`.

---

## Template Engine

pw-gen uses [EJS](https://ejs.co) (Embedded JavaScript) as its template engine.

Templates use `<%- expression %>` for unescaped substitution and `<%= expression %>`
for HTML-escaped substitution. All logic is pushed to `ContextBuilder`; templates
contain substitution and iteration only.

Example:

```ejs
// src/config/env.ts — generated for <%= project.applicationName %>
static readonly TEST_ENV: string =
  process.env.TEST_ENV ?? "<%- environments.default %>";
```

Template files are named `{output-filename}.ejs` and mirror the output directory
structure so the relationship between template and output file is immediately obvious.

---

## Template Context

Every template receives a single typed `TemplateContext` object:

```typescript
{
  project: {
    name: string;          // "Financial Management Suite"
    slug: string;          // "playwright-fms"
    organisation: string;  // "SIMS Education"
    applicationName: string; // "FMS"
    applicationSlug: string; // "fms"
    description: string;
  };
  automation: {
    type: "ui" | "api" | "both";
    hasUI: boolean;
    hasAPI: boolean;
  };
  environments: {
    names: string[];       // ["uat", "staging", "prod"]
    default: string;       // "uat"
    count: number;
  };
  modules: {
    email: boolean;        // future optional modules
    pdf: boolean;
    // …
  };
  generator: {
    version: string;       // "0.1.0"
    generatedAt: string;   // ISO-8601 timestamp
  };
}
```

`ContextBuilder` enriches the raw config — it derives slugs, sets automation
booleans, and stamps the generation version and timestamp. Templates never
derive these values themselves.

---

## Generated Framework Anatomy

The `core` module generates a complete, standalone Playwright framework:

```
playwright-{slug}/
├── playwright.config.ts   Timeouts, reporters, browser projects, env loading
├── package.json           All deps + per-environment npm scripts
├── tsconfig.json          Strict TypeScript, CommonJS output
├── .gitignore             Gitignores node_modules, test-results, .env files
├── .env.example           Credential template — copy to src/config/.env
├── README.md              Full self-documenting enterprise README
└── src/
    ├── config/
    │   └── env.ts         Typed, readonly ENV wrapper (ENV.URL, ENV.USERID, …)
    ├── fixtures/
    │   └── test.ts        Extended test object — loginPage fixture + lifecycle logger
    ├── logging/
    │   └── logger.ts      Winston singleton — info/warn/error/debug
    ├── pages/
    │   ├── BasePage.ts    Abstract base — navigation, wait, assertion, screenshot helpers
    │   └── LoginPage.ts   Authentication Page Object template
    └── tests/
        └── smoke/
            └── login.smoke.spec.ts   Login smoke test template
```

---

## Design Principles

### 1. Logic in ContextBuilder, not in templates

Templates are dumb. All derived values, conditionals, and computations live in
`ContextBuilder`. This makes templates readable, maintainable, and testable
independently of the template syntax.

### 2. Stage-then-write atomicity

All templates are rendered into memory before any disk writes begin. A template
error or compilation failure leaves the output directory untouched — there is
no partially-written state to clean up.

### 3. Generated frameworks are self-contained

The generated project has no runtime dependency on pw-gen. It is a complete,
independent repository that an engineer can own and modify without any connection
back to the generator. This makes upgrades and deviations safe and explicit.

### 4. Module composition at generation time

Optional capabilities (auth, API, database) are composed by rendering additional
templates into the same output directory. The final framework is a flat, unified
codebase — not a collection of packages or plugins loaded at test runtime.

### 5. Validate early, fail clearly

Zod validates all user input at the CLI boundary before the pipeline starts.
If the config is invalid, the user sees a clear error message and nothing is
written to disk.

### 6. Every generated file is owned by the team

Generated code is a starting point, not a runtime dependency. Engineers are
expected to modify, extend, and own the generated files. The generator produces
professional-grade starting code, not a black box.
