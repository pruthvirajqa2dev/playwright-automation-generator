#!/usr/bin/env node
import { Command } from "commander";
import { registerGenerateCommand } from "./commands/generate";
import { registerAddCommand } from "./commands/add";

const program = new Command();

program
  .name("pw-gen")
  .version("0.1.0")
  .description("Enterprise Playwright Automation Platform Generator");

registerGenerateCommand(program);
registerAddCommand(program);

program.parse(process.argv);
