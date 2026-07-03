/**
 * String utility functions for the generator.
 */

/**
 * Converts an arbitrary string to a kebab-case slug suitable for use
 * as a package name, directory name, or identifier.
 *
 * Examples:
 *   "Financial Management System" → "financial-management-system"
 *   "SIMS Finance 2.0"           → "sims-finance-2-0"
 *   "ParentPay"                  → "parentpay"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Converts a PascalCase or camelCase identifier to kebab-case.
 * Used by the scaffolding engine to derive file names from artifact names.
 *
 * Examples:
 *   "Supplier"       → "supplier"
 *   "SupplierSearch" → "supplier-search"
 *   "MyPageObject"   → "my-page-object"
 */
export function toKebabCase(name: string): string {
  return name
    .replace(/([A-Z])/g, (char, _, offset) =>
      offset > 0 ? `-${char.toLowerCase()}` : char.toLowerCase(),
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Converts a PascalCase identifier to camelCase.
 * Used by the scaffolding engine to derive instance variable names.
 *
 * Examples:
 *   "Supplier"       → "supplier"
 *   "SupplierSearch" → "supplierSearch"
 */
export function toCamelCase(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Ensures the first character of a name is uppercased (PascalCase).
 * Used to normalise user input for scaffold artifact names.
 *
 * Examples:
 *   "supplier"       → "Supplier"
 *   "SupplierSearch" → "SupplierSearch"
 */
export function toPascalCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
