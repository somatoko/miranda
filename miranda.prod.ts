#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env --allow-run

import { CliParser } from "./miranda/cli-parser.ts";
import { Config } from "./miranda/config-loader.ts";
import { MigrationManager } from "./miranda/migrator.ts";
import { data } from './_data.js'

await Config.load(true)
await MigrationManager.loadFromString(data)
await CliParser.parseAndRun()
