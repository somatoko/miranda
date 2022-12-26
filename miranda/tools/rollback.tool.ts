import { DbClient, MigrationTuple } from "../db-client.ts";
import { MigrationManager } from "../migrator.ts";


export class RollbackTool {
  static getMeta() {
    return {
      name: 'rollback',
      help: 'rollback migrations to specific version',
      productionEnabled: true,
    }
  }

  static async activate() {
    const db = await DbClient.new()
    db.ensureMigrationTableExists()

    const present = await db.collectPresentMigrations()
    const [currentVersion, targetVersion] = getVersionPair(present)

    const actions = MigrationManager.getActionsDown()
    const pendingVersions = MigrationManager.pendingVersionsDown(currentVersion, targetVersion)

    for (const version of pendingVersions) {
      const entry = actions[version]
      console.log('  -', entry.label)
      await db.runTextQuery(entry.action)
      await db.unregisterMigrationEntry(entry.version, entry.label)
    }
  }
}

function getVersionPair(installed: MigrationTuple[]) {
  let versionNow = 0
  if (installed.length > 0) {
    versionNow = installed[0].version
  } else {
    console.log('No present migrations.')
    Deno.exit(0)
  }

  // By default -1 to latest installed; zero means empty migrations
  // much work because in JS '0' is false
  const versionGiven = Deno.args[1]
  let targetVersion = 0
  if (versionGiven !== undefined) {
    const num = parseInt(versionGiven, 10)
    if (num > versionNow) {
      console.log(`- cant move to version ${num}, now at version ${versionNow}; done.`)
      Deno.exit(0)
    } else if (num === versionNow) {
      console.log(`- already at version ${num}; done.`)
      Deno.exit(0)
    }
    targetVersion = num
  } else {
    // version not provided choose curren -1
    targetVersion = versionNow - 1
  }

  const tuplesByVersion = keyTuplesByVersion(installed)
  const installedVersions = Object.keys(tuplesByVersion).map(v => parseInt(v, 10))
  const currentVersion = Math.max(...installedVersions)

  return [currentVersion, targetVersion]
}

function keyTuplesByVersion(files: MigrationTuple[]) {
  const entries: { [k: number]: MigrationTuple } = {}
  files.forEach(u => entries[u.version] = u)
  return entries
}
