import { DbClient, MigrationTuple } from "../db-client.ts";
import { MigrationManager } from "../migrator.ts";



export class StatusTool {
  static getMeta() {
    return {
      name: 'status',
      help: 'show migration status',
      productionEnabled: true,
    }
  }

  static async activate() {
    const db = await DbClient.new()
    db.ensureMigrationTableExists()

    const present = await db.collectPresentMigrations()
    const tuplesByVersion = keyTuplesByVersion(present)

    const actions = MigrationManager.getActionsUp()
    const versions = Object.keys(actions).sort()
    versions.forEach(v => {
      const applied = v in tuplesByVersion
      console.log(`  ${v} ${applied ? '+' : '-'} ${actions[v].label}`)
    })

    // TODO: check for anomalies i.e. versions pretend in DB but absent in actions.
  }
}

function keyTuplesByVersion(files: MigrationTuple[]) {
  const entries: { [k: number]: MigrationTuple } = {}
  files.forEach(u => entries[u.version] = u)
  return entries
}
