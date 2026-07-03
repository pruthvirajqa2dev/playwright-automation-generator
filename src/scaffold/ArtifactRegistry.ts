import type { ArtifactDefinition } from "./ArtifactDefinition";
import { pageArtifact } from "./artifacts/page";
import { testArtifact } from "./artifacts/test";
import { componentArtifact } from "./artifacts/component";

/**
 * ArtifactRegistry — the single source of truth for all scaffoldable artefacts.
 *
 * The registry maps command names (e.g. "page", "test", "component") to their
 * full `ArtifactDefinition`. The CLI, Scaffolder dispatch, and template
 * resolution all derive from the registry — no artefact knowledge is hardcoded
 * elsewhere in the platform.
 *
 * Registration order determines the order artefacts appear in `pw-gen add --help`.
 *
 * ## Adding a new artefact
 *
 * 1. Create `src/scaffold/artifacts/{name}.ts` exporting an `ArtifactDefinition`.
 * 2. Call `.register(yourArtifact)` on the `artifactRegistry` singleton below.
 * 3. Add the corresponding EJS template to `src/modules/scaffold/templates/`.
 *
 * No changes to `add.ts`, `Scaffolder.ts`, or any other platform file are needed.
 */
export class ArtifactRegistry {
  private readonly registry = new Map<string, ArtifactDefinition>();

  /**
   * Registers an artefact definition.
   * Returns `this` to allow fluent chaining during initialisation.
   *
   * @throws if a definition with the same command name is already registered.
   */
  register(definition: ArtifactDefinition): this {
    if (this.registry.has(definition.command)) {
      throw new Error(`Artifact already registered: "${definition.command}"`);
    }
    this.registry.set(definition.command, definition);
    return this;
  }

  /**
   * Resolves an artefact definition by command name.
   *
   * @throws with a clear message listing available commands if unknown.
   */
  resolve(command: string): ArtifactDefinition {
    const definition = this.registry.get(command);
    if (!definition) {
      throw new Error(
        `Unknown artefact: "${command}". ` +
          `Available: ${Array.from(this.registry.keys()).join(", ")}`,
      );
    }
    return definition;
  }

  /**
   * Returns all registered artefact definitions in registration order.
   * Used by the CLI to auto-register subcommands from the registry.
   */
  all(): ArtifactDefinition[] {
    return Array.from(this.registry.values());
  }
}

/**
 * The platform artefact registry — pre-populated with all built-in artefacts.
 *
 * Import this singleton wherever artefact resolution is needed.
 * Register additional artefacts by calling `.register(definition)` after import.
 */
export const artifactRegistry = new ArtifactRegistry()
  .register(pageArtifact)
  .register(testArtifact)
  .register(componentArtifact);
