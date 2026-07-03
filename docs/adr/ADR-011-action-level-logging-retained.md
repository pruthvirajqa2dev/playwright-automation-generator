# ADR-011 — Action-Level Logging Retained in `BasePage`

| Field             | Value      |
| ----------------- | ---------- |
| **Status**        | Accepted   |
| **Date**          | 2026-07-03 |
| **Deciders**      | Core team  |
| **Gap reference** | G11        |

---

## Decision

`BasePage` will continue to emit a Winston log message for every UI interaction
(`click`, `fill`, `navigateTo`, `selectOption`, etc.). This produces intentional
overlap with the information captured by Playwright's Trace Viewer, and the
overlap is accepted as a deliberate redundancy for enterprise CI pipelines.

---

## Context

Playwright's Trace Viewer captures a complete record of every test action:

- Every `click`, `fill`, `goto`, `waitFor` call
- DOM snapshots before and after each action
- Network requests and responses
- Console log messages
- Timing information

The generated `BasePage` also logs every action via Winston:

```typescript
async click(locator: Locator, description?: string): Promise<void> {
    await locator.click();
    logger.info(`Clicked: ${description ?? locator.toString()}`);
}

async navigateTo(urlPath: string): Promise<void> {
    await this.page.goto(urlPath);
    logger.info(`Navigated to: ${urlPath}`);
}
```

The question is whether this Winston logging is redundant given the Trace Viewer,
and whether it should be reduced to business-level events only.

---

## Alternatives Considered

### Option A — Remove action-level logging from `BasePage`; log only in tests

Remove `logger.info()` from every `BasePage` method. Reserve Winston logging for
test-level business events in `test.step()` callbacks:

```typescript
await test.step("Submit invoice", async () => {
  await invoicePage.fillInvoiceNumber("INV-001");
  await invoicePage.submit();
  logger.info("Invoice INV-001 submitted"); // ← business event, not action
});
```

**Why rejected:**

1. **CI pipeline output would lose action-level detail.** Without action-level
   logging, the only immediate output in a CI pipeline is the test name and the
   business-level log messages in `test.step()` callbacks. When a test fails,
   the pipeline log shows "step X failed" but not which specific action within
   that step failed. The engineer must download and open the trace file to get
   that information.

2. **Not all CI environments surface the trace viewer.** The Playwright HTML
   report and trace viewer are excellent tools when accessible, but many
   enterprise CI pipelines (Jenkins, Azure DevOps with custom dashboards, TeamCity)
   do not embed the trace viewer natively. The Winston log in stdout is immediately
   visible in any CI system without additional tooling.

3. **Log output is machine-parseable.** The Winston log can be parsed by log
   aggregation tools (Splunk, ELK, Azure Monitor) to build test metrics, detect
   patterns in failing actions, and generate dashboards. The Trace Viewer is a
   human-facing tool, not a data source.

### Option B — Keep action-level logging; reduce verbosity by removing description fallback

Keep logging but emit the locator role/name instead of the raw locator string
when no description is provided:

```typescript
logger.info(`Clicked: ${description ?? "button"}`); // simplified
```

**Why rejected:**

This reduces the signal value. The current pattern logs the locator representation
when no description is given, which, while verbose, provides actionable information
about which element was targeted. The description parameter is already available
for teams to use meaningful names.

### Option C — Keep action-level logging as-is (selected)

Accept the overlap with the Trace Viewer as deliberate redundancy. Document the
logging strategy in the README: action-level logging in Page Objects, business-event
logging in tests.

---

## Reasoning

1. **Redundancy is a feature in enterprise automation.** Enterprise teams require
   multiple, independent lines of evidence for test failures. A test that fails
   silently in CI (no logs, trace unavailable) is far more expensive to debug than
   a test with verbose, parseable output.

2. **The Trace Viewer and Winston serve different audiences at different times.**
   Winston logs are available immediately in CI pipeline stdout, viewable by any
   team member with CI access, parseable by log aggregation tools, and useful for
   real-time alerting. The Trace Viewer requires downloading an artifact and
   opening a dedicated tool — appropriate for deep debugging, not for initial
   triage.

3. **The log format is already clean and low-noise.** With the padded level
   format (`[2025-06-15 09:23:41] INFO  Navigated to: /invoices`), the Winston
   output is readable rather than overwhelming. Console output is suppressed in CI
   by default unless `LOG_LEVEL=debug` is set.

4. **Removing logging from `BasePage` does not prevent engineers from adding it
   elsewhere.** The `logger` is a named import; it can be used anywhere. However,
   removing it from `BasePage` means each team must re-add it, producing
   inconsistent logging patterns across projects.

---

## Logging Strategy

The logging strategy in the generated framework is:

| Layer            | What to log                             | Tool                                       |
| ---------------- | --------------------------------------- | ------------------------------------------ |
| `BasePage`       | Every UI action (click, fill, navigate) | Winston (`logger.info`)                    |
| `test.step()`    | Business workflow steps                 | Winston (`logger.info`)                    |
| `test.step()`    | Test outcomes (pass/fail)               | Winston via `_testLifecycle` fixture       |
| All interactions | Timing, DOM snapshots, network          | Playwright Trace Viewer                    |
| All interactions | Screenshots on failure                  | Playwright `screenshot: "only-on-failure"` |

This creates a layered evidence model:

- **Immediate** (CI stdout): Winston business and action logs
- **Near-term** (CI artifact): Playwright HTML report with screenshots
- **Deep debugging** (CI artifact): Playwright trace file with full replay

---

## Consequences

**Positive:**

- Complete action log immediately visible in CI pipeline stdout
- Logs parseable by external log aggregation tools
- Consistent logging across all generated frameworks
- No additional tooling required to understand what a test did

**Negative:**

- Winston log output overlaps with Trace Viewer — same actions recorded twice
- Verbose log output for complex tests (each `fill`, `click`, `scroll` is logged)
- Page Objects import and depend on the logger module

---

## Future Considerations

- If Playwright exposes a hook for custom action reporters (a stable `onAction`
  callback), logging could be moved from `BasePage` methods to a central action
  reporter, removing the logger dependency from Page Objects entirely while
  preserving the output.
- The `description` parameter in all `BasePage` interaction methods should be
  treated as mandatory in team coding standards — it is the primary signal in
  the log output.
