import { DbClient, MigrationTuple } from "../db-client.ts";
import { MigrationFile, MigrationManager } from "../migrator.ts";


export class MigrateTool {
  static getMeta() {
    return {
      name: 'migrate',
      help: 'apply migrations',
      productionEnabled: true,
    }
  }

  static async activate() {
    const db = await DbClient.new()
    db.ensureMigrationTableExists()

    const present = await db.collectPresentMigrations()

    const [currentVersion, targetVersion] = getVersionPair(present)
    const actions = MigrationManager.getActionsUp()
    const pendingVersions = MigrationManager.pendingVersionsUp(currentVersion, targetVersion)

    if (pendingVersions.length === 0) {
      console.log('- No new versions to apply; done.')
      Deno.exit(0)
    }

    for (const version of pendingVersions) {
      const entry = actions[version]
      console.log('  +', entry.label)
      await db.runTextQuery(entry.action)
      await db.registerMigrationEntry(entry.version, entry.label)
    }
  }
}

function getVersionPair(installed: MigrationTuple[]) {
  const versionGiven = Deno.args[1]
  let targetVersion = 9999
  if (versionGiven !== undefined && !versionGiven.startsWith('-')) {
    const num = parseInt(versionGiven, 10)
    if (num > targetVersion) {
      console.log('- Maxiumum possible version is ${targetVersion}; exiting.')
      Deno.exit(1)
    }
    targetVersion = num
    console.log('- targetVersion:', targetVersion)
  }

  // current version
  const installedVersions = installed.map(t => t.version)
  const currentVersion = Math.max(...installedVersions)
  return [currentVersion, targetVersion]
}