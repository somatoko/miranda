import { DbClient, MigrationTuple } from "../db-client.ts";
import { Migrator } from "../migrator.ts";



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

    const migrator = await Migrator.new()
    const files = await migrator.collectPresentFiles()
    // console.log(files)
    files.forEach(file => {
      const applied = file.seq in tuplesByVersion
      console.log(`  ${file.seq} ${applied ? '+' : '-'} ${file.label}`)
    })
  }
}

function keyTuplesByVersion(files: MigrationTuple[]) {
  const entries: { [k: number]: MigrationTuple } = {}
  files.forEach(u => entries[u.version] = u)
  return entries
}
