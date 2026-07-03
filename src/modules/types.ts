/**
 * ModuleFileDefinition — describes a single file a module contributes
 * to the generated framework.
 */
export interface ModuleFileDefinition {
  /**
   * Path to the EJS template, relative to the module's templateDir.
   * Example: "src/config/env.ts.ejs"
   */
  templatePath: string;

  /**
   * Output path in the generated framework.
   * May contain EJS expressions: e.g. "src/config/<%= project.slug %>.ts"
   * Example: "src/config/env.ts"
   */
  outputPath: string;
}

/**
 * ModuleManifest — full descriptor for a generator module.
 *
 * Each module in src/modules/{name}/ must export a const named `manifest`
 * that satisfies this interface.
 */
export interface ModuleManifest {
  /** Unique module slug — must match the directory name */
  name: string;

  /** Semver version of this module */
  version: string;

  /** Human-readable description shown in pw-gen output */
  description: string;

  /**
   * When true this module is always included regardless of user selection.
   * Only the "core" module should set this to true.
   */
  alwaysIncluded: boolean;

  /** Names of other modules that must be present when this module is included */
  dependencies: string[];

  /**
   * Absolute path to the directory containing EJS template files.
   * Set via: path.join(__dirname, "templates") in the manifest file.
   */
  templateDir: string;

  /** All files this module contributes to the generated framework */
  files: ModuleFileDefinition[];

  /** npm packages to add to the generated framework's package.json */
  packageDependencies: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  /** npm scripts to merge into the generated framework's package.json */
  npmScripts: Record<string, string>;
}
