#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env --allow-run

import { CliParser } from "./miranda/cli-parser.ts";
import { Config } from "./miranda/config-loader.ts";
import { MigrationManager } from "./miranda/migrator.ts";

await Config.load()
await MigrationManager.loadFromFiles()
await CliParser.parseAndRun()
