# ADR-010 — Chromium as Primary Browser, Multi-Browser as Opt-In

| Field             | Value      |
| ----------------- | ---------- |
| **Status**        | Accepted   |
| **Date**          | 2026-07-03 |
| **Deciders**      | Core team  |
| **Gap reference** | G7         |

---

## Decision

The generated `playwright.config.ts` will configure **Chromium as the single
active browser project** by default. Firefox and WebKit projects will be present
in the config as **commented-out templates** that teams can enable with a single
line. This diverges from the Playwright best practices recommendation to "test
across all browsers."

---

## Context

Playwright's best practices guide states:

> _"Playwright makes it easy to test your site across all browsers no matter what
> platform you are on. Testing across all browsers ensures your app works for all
> users."_

The guide provides a config example with all three browser engines active:
Chromium, Firefox, and WebKit.

The generated framework targets **internal enterprise applications** — line-of-business
systems (ERP, payroll, CRM, finance) used by employees within an organisation's
IT policy. These applications have fundamentally different browser compatibility
requirements than public-facing web applications.

---

## Alternatives Considered

### Option A — All three browsers active by default

Aligns with Playwright's best practices recommendation. Every generated framework
runs on Chromium, Firefox, and WebKit.

**Why rejected:**

1. **Tripled execution time.** Adding Firefox and WebKit multiplies test
   execution time by approximately 3x. A 5-minute Chromium-only suite becomes
   a 15-minute multi-browser suite. For a CI build that runs on every pull
   request, this is a significant cost.

2. **Most enterprise applications mandate a corporate browser.** Organisations
   frequently mandate Chrome or Edge as the standard browser and do not support
   Firefox or Safari for line-of-business applications. Testing unsupported
   browsers against these applications wastes CI resources and generates
   meaningless results.

3. **Noise from browser-specific layout differences.** Running on all three
   browsers produces false failures from minor rendering differences between
   Blink, Gecko, and WebKit — differences that are not bugs in the enterprise
   application. Teams spend time debugging browser-specific test failures that
   are not application defects.

4. **Operational complexity.** Running multi-browser in parallel requires more
   CI agent capacity, more disk space for browser binaries, and more complex
   failure triage when a test fails on Firefox but passes on Chromium. This
   complexity is not appropriate for an enterprise team getting started with
   Playwright automation.

### Option B — Chromium only, no Firefox/WebKit mentioned

Clean and simple. Only Chromium is in the config.

**Why rejected:**

Teams that do need cross-browser testing (public-facing enterprise portals,
customer self-service applications) would need to research how to add other
browsers rather than finding them pre-documented in the generated config. Having
the projects commented out makes the extension path trivially obvious.

### Option C — Chromium active + Firefox/WebKit commented out (selected)

Chromium runs on every `npm test`. Firefox and WebKit are present as
ready-to-uncomment project configurations — a one-line change to add them.

---

## Reasoning

1. **Appropriate defaults for the target audience.** The primary users of
   pw-gen are enterprise automation engineers building internal automation suites.
   Their browser compatibility requirements are typically narrower than public web
   applications.

2. **Opt-in to cross-browser rather than opt-out.** Disabling Firefox and WebKit
   after they've already been running and failing is more disruptive than enabling
   them when the team decides they need cross-browser coverage.

3. **The Playwright recommendation is correct for its audience.** For public-facing
   web applications, cross-browser testing is essential. The recommendation is
   not wrong — it is targeted at a different context than pw-gen serves.

4. **Explicit opt-in is documented.** The commented-out projects are present in
   every generated config. The generated `README.md` will document how to enable
   them. Teams who need cross-browser coverage are not blocked — they are guided.

---

## Consequences

**Positive:**

- `npm test` completes in a predictable time without multi-browser overhead
- No false failures from browser-specific rendering differences
- Generated framework matches most enterprise browser policies
- Firefox and WebKit are one uncomment away when needed

**Negative:**

- Diverges from Playwright best practices recommendation
- Teams building customer-facing portals must actively enable the other browsers
- Cross-browser testing is not enforced — teams may forget to enable it

---

## Configuration Pattern

The generated `playwright.config.ts` will include:

```typescript
projects: [
    {
        name: "chromium",
        use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 1280, height: 720 },
        },
    },

    // ── Optional: enable additional browsers for cross-browser coverage ────
    // Uncomment the projects below when your application requires cross-browser
    // certification. Consider running these in a separate nightly pipeline
    // rather than on every pull request to keep PR build times short.

    // {
    //     name: "firefox",
    //     use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //     name: "webkit",
    //     use: { ...devices["Desktop Safari"] },
    // },
],
```

---

## Future Considerations

- The Azure DevOps module (Milestone 5) will generate a separate pipeline stage
  for cross-browser runs, demonstrating the pattern of Chromium on every PR and
  all browsers in a scheduled nightly run.
- If a project is generated with `--type api`, cross-browser is irrelevant and
  the Firefox/WebKit comments should be omitted entirely.
