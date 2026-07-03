# ADR-012 — Component Object Model (BaseComponent)

| Field        | Value      |
| ------------ | ---------- |
| **Status**   | Accepted   |
| **Date**     | 2026-07-03 |
| **Deciders** | Core team  |
| **Sprint**   | 2A         |

---

## Decision

Introduce an abstract `BaseComponent` class into the generated framework's `src/components/`
layer. `BaseComponent` is Locator-scoped, not Page-scoped. It is infrastructure only —
it provides no application-specific behaviour and contains no business logic.

---

## Context

The initial framework provides `BasePage` as the only base abstraction. This is correct for
page-level concerns (navigation, URL assertions, full-page screenshots) but insufficient for
reusable UI widgets that appear inside pages.

Enterprise applications contain recurring UI patterns — data tables, modal dialogs, search
panels, pagination controls, date pickers, file upload widgets — that appear across multiple
screens. Without a component abstraction, automation engineers face two choices, both
sub-optimal:

1. **Duplicate interaction code across Page Objects.** Each page that contains a table
   re-implements the same row selection, column header, and sort logic. Maintenance cost
   is multiplied by every page that hosts the widget.

2. **Place component logic inside Page Objects.** An `InvoicePage` that contains a table,
   a modal, and pagination controls accumulates all three interaction patterns in a single
   class. The class grows without boundary and violates the single-responsibility principle.

A component abstraction solves both problems: each widget pattern is modelled once and
composed into Page Objects that need it.

---

## Why BaseComponent is Locator-scoped, not Page-scoped

`BasePage` receives a `Page` because it controls an entire screen. `BaseComponent` receives
a root `Locator` because it controls a specific, bounded DOM region.

Using `Locator` as the constructor parameter:

1. **Enables composition.** The same `TableComponent` subclass can be instantiated in
   `InvoicePage`, `PurchaseOrderPage`, and `SupplierPage` — each supplying a different
   root locator without any change to the component class.

2. **Enforces scope.** A component that only holds a `Locator` cannot navigate to a
   different URL, check the page title, or wait for network idle. These capabilities are
   correctly absent from a component's contract.

3. **Enables element-scoped screenshots.** `locator.screenshot()` captures only the
   component's bounding box, producing focused evidence artefacts rather than full-page
   captures. This is not possible with a `Page`-scoped base class.

4. **Aligns with Playwright's composable locator model.** Playwright's `locator.locator()`
   chaining is designed precisely for this scoped-element pattern. `BaseComponent.find()`
   wraps this directly.

### Alternative considered: Extend BasePage

An alternative design would have `BaseComponent` extend `BasePage`, inheriting all page-level
helpers and adding a `root: Locator` field.

**Rejected because:**

- It would expose navigation methods (`navigateTo`, `waitForPageLoad`, `waitForNetworkIdle`)
  on components, which is architecturally incorrect.
- It would expose URL and title assertions on components, which are meaningless.
- It would require a `Page` parameter in the component constructor, preventing pure
  Locator-scoped composition.
- It conflates page-level and component-level concerns in a single inheritance chain.

---

## Why BaseComponent is separated from BasePage

A single combined base class would provide two incompatible contracts simultaneously:

| Concern              | BasePage owns it                | BaseComponent owns it              |
| -------------------- | ------------------------------- | ---------------------------------- |
| Navigation           | ✅ `navigateTo()`, `goto()`     | ✗ Not applicable                   |
| Network / load state | ✅ `waitForNetworkIdle()`       | ✗ Not applicable                   |
| URL assertion        | ✅ `expectURL()`                | ✗ Not applicable                   |
| Title assertion      | ✅ `expectTitle()`              | ✗ Not applicable                   |
| Scoped element wait  | Possible but convention-only    | ✅ Enforced by root `Locator`      |
| Element screenshot   | Full page (`page.screenshot()`) | ✅ Bounded box (`root.screenshot`) |

Separating the two classes makes the contract explicit: engineers who see
`extends BasePage` know they are building a screen; engineers who see
`extends BaseComponent` know they are building a reusable widget.

---

## Why business-specific components are excluded from the generator

The generator is deliberately application-agnostic. A `TableComponent` for an invoice
approval screen differs in its selectors, row structure, and column set from a table on a
student registration screen. The generator cannot produce correct, application-specific
implementations for these components.

Generating concrete business components would violate the core design principle established
in ADR-002 (independent generated repositories) and the product philosophy of "no magic":
generated code must be readable and modifiable by the team that owns it.

The correct delivery mechanism for concrete components is `pw-gen add component <Name>` —
a scaffolding command (planned for a future sprint) that generates a correctly-structured
subclass of `BaseComponent` with TODO stubs for the team to implement.

**What is generated (this sprint):** `BaseComponent` only — the abstract infrastructure.

**What is not generated:** `TableComponent`, `ModalComponent`, `PaginationComponent`,
or any other application-specific or pattern-specific component class.

---

## Consequences

### Positive

- A stable abstraction for the component layer exists from the first generated framework.
  Teams can immediately create their own component subclasses following the established pattern.
- The `find()` helper promotes Playwright's `locator.locator()` scoping pattern, producing
  robust, maintainable locator declarations.
- `takeScreenshot()` captures only the component boundary, reducing report noise.
- The `isVisible()` anti-pattern warning is preserved from `BasePage`, maintaining
  the framework's flakiness-prevention conventions.

### Negative / Accepted Trade-offs

- `BaseComponent.ts` is generated even for frameworks that have no components yet. It is
  a zero-cost file — it introduces no runtime overhead and occupies minimal disk space —
  but teams that never build components will have an unused file.
  _Mitigation: The generated README and the class's own JSDoc make the intended use clear._

- Concrete component implementations are not generated. Teams must create their own
  subclasses. This is intentional: the generator cannot produce correct application-specific
  implementations. See "Why business-specific components are excluded" above.
