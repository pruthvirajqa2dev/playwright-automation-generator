import type { ModuleManifest } from "./types";
import { manifest as coreManifest } from "./core/manifest";
import { manifest as authManifest } from "./auth/manifest";

/**
 * ModuleRegistry — central store for all available generator modules.
 *
 * For the core vertical slice, modules are registered explicitly.
 * Future phases will add filesystem-based discovery so new modules
 * can be added by placing a manifest.ts + templates/ directory under
 * src/modules/{name}/ with no changes to existing code.
 */
export class ModuleRegistry {
  private readonly modules = new Map<string, ModuleManifest>();

  constructor() {
    this.register(coreManifest);
    this.register(authManifest);
  }

  private register(manifest: ModuleManifest): void {
    this.modules.set(manifest.name, manifest);
  }

  get(name: string): ModuleManifest {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(
        `Module not found: "${name}". ` +
          `Available modules: ${Array.from(this.modules.keys()).join(", ")}`,
      );
    }
    return module;
  }

  /**
   * Resolves the full ordered set of modules to include for a generation run.
   *
   * Always-included modules (e.g. "core") are prepended regardless of the
   * selected list. Dependencies are not yet resolved transitively — that will
   * be added when a second module with dependencies exists.
   */
  resolve(selected: string[]): ModuleManifest[] {
    const alwaysIncluded = Array.from(this.modules.values())
      .filter((m) => m.alwaysIncluded)
      .map((m) => m.name);

    const ordered = [...new Set([...alwaysIncluded, ...selected])];
    return ordered.map((name) => this.get(name));
  }
}
