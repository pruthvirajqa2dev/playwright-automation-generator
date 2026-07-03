#!/usr/bin/env node
import { Command } from "commander";
import { registerGenerateCommand } from "./commands/generate";

const program = new Command();

program
  .name("pw-gen")
  .version("0.1.0")
  .description("Enterprise Playwright Automation Platform Generator");

registerGenerateCommand(program);

program.parse(process.argv);
