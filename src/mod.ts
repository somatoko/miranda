import { CliParser } from "./cli-parser.ts";
import { MirandaConfig } from "./config.ts";

if (import.meta.main) {
  await MirandaConfig.load()
  await CliParser.parseAndRun()
}
