import { CliParser } from "./src/cli-parser.ts";
import { MirandaConfig } from "./src/config.ts";

if (import.meta.main) {
  await MirandaConfig.load()
  await CliParser.parseAndRun()
}
