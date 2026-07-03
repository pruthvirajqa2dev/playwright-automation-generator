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
