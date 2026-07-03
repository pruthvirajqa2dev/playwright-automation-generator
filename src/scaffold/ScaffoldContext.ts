import { toKebabCase, toCamelCase, toPascalCase } from "../utils/string";

/**
 * ScaffoldContext — the object passed to every scaffold EJS template.
 *
 * Scaffold templates receive a much lighter context than full-generation templates.
 * They need the artifact name in various forms, and a generator stamp.
 *
 * All name derivations live here — scaffold templates are thin substitution views.
 */
export interface ScaffoldContext {
  /** PascalCase name as normalised from user input: "Supplier", "SupplierSearch" */
  name: string;

  /** kebab-case slug derived from name: "supplier", "supplier-search" */
  slug: string;

  /** camelCase instance name derived from name: "supplier", "supplierSearch" */
  camelName: string;

  generator: {
    /** Semver of pw-gen that produced this artefact */
    version: string;
    /** ISO-8601 generation timestamp */
    generatedAt: string;
  };
}

/**
 * Builds a ScaffoldContext from a raw artifact name.
 *
 * Input is normalised to PascalCase. All derived values (slug, camelName)
 * are computed here so scaffold templates perform substitution only.
 *
 * @param rawName - Artifact name as provided by the user, e.g. "Supplier", "supplierSearch"
 */
export function buildScaffoldContext(rawName: string): ScaffoldContext {
  const name = toPascalCase(rawName);
  const slug = toKebabCase(name);
  const camelName = toCamelCase(name);

  return {
    name,
    slug,
    camelName,
    generator: {
      version: "0.1.0",
      generatedAt: new Date().toISOString(),
    },
  };
}
