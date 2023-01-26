import { CliParser } from "./miranda/cli-parser.ts";
import { Config } from "./miranda/config-loader.ts";
import { MigrationManager } from "./miranda/migrator.ts";

if (import.meta.main) {
  await Config.load()
  await MigrationManager.loadFromFiles()
  await CliParser.parseAndRun()
}
