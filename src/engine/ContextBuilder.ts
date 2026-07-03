import type { GeneratorConfig } from "../config/schema";
import { toSlug } from "../utils/string";

/**
 * TemplateContext — the single object passed to every EJS template.
 *
 * Templates must not call functions or compute values — all logic lives
 * here in the ContextBuilder. Templates are thin: they contain layout
 * and EJS substitution tags only.
 */
export interface TemplateContext {
  project: {
    /** Human-readable project name: "FMS Automation" */
    name: string;
    /** kebab-case package slug: "playwright-fms" */
    slug: string;
    /** Organisation name */
    organisation: string;
    /** Full application name: "Financial Management System" */
    applicationName: string;
    /** kebab-case application slug: "fms" */
    applicationSlug: string;
    /** Framework description for package.json and README */
    description: string;
  };
  automation: {
    type: "ui" | "api" | "both";
    hasUI: boolean;
    hasAPI: boolean;
  };
  environments: {
    names: string[];
    default: string;
    count: number;
  };
  /** Boolean flags indicating which optional modules were selected. */
  modules: {
    auth: boolean;
    email: boolean;
    pdf: boolean;
    excel: boolean;
    database: boolean;
    networkCapture: boolean;
    accessibility: boolean;
    aiReadiness: boolean;
  };
  generator: {
    /** Semver of pw-gen that produced this framework */
    version: string;
    /** ISO-8601 generation timestamp */
    generatedAt: string;
  };
}

/**
 * Transforms a validated GeneratorConfig into a flat TemplateContext.
 * Called once per generation run; the result is shared across all modules.
 */
export function buildContext(config: GeneratorConfig): TemplateContext {
  const appSlug = toSlug(config.project.applicationName);
  const selected = config.modules.selected;

  return {
    project: {
      name: config.project.name,
      slug: `playwright-${appSlug}`,
      organisation: config.project.organisation,
      applicationName: config.project.applicationName,
      applicationSlug: appSlug,
      description:
        config.project.description ??
        `${config.project.applicationName} — Playwright Automation Framework`,
    },
    automation: {
      type: config.automation.type,
      hasUI:
        config.automation.type === "ui" || config.automation.type === "both",
      hasAPI:
        config.automation.type === "api" || config.automation.type === "both",
    },
    environments: {
      names: config.environments.names,
      default: config.environments.default,
      count: config.environments.names.length,
    },
    modules: {
      auth: selected.includes("auth"),
      email: selected.includes("email"),
      pdf: selected.includes("pdf"),
      excel: selected.includes("excel"),
      database: selected.includes("database"),
      networkCapture: selected.includes("networkCapture"),
      accessibility: selected.includes("accessibility"),
      aiReadiness: selected.includes("aiReadiness"),
    },
    generator: {
      version: "0.1.0",
      generatedAt: new Date().toISOString(),
    },
  };
}
