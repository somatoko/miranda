import { loadMigrationFiles } from "../migrator.ts";

export class BundleTool {
  static getMeta() {
    return {
      name: 'bundle',
      help: 'create migration bundle for production',
      productionEnabled: false,
    }
  }

  static async activate() {
    await mergeMigrationFiles()
  }
}

// Construct two ubjects: `migrate` and `rollback`
// where each key represents a version and values are
// SQL statements.
async function mergeMigrationFiles() {
  // 1. collect migration files into single object
  const data = await loadMigrationFiles()
  const template = `export const data = "${btoa(JSON.stringify(data))}"`
  const migrationsImageName = '_data.js'
  Deno.writeTextFileSync(migrationsImageName, template)

  // 2. create migrator entrypoint; imports migrationsImage
  const relaseEntryName = './miranda-entry.prod.ts'
  // await Deno.writeTextFile(relaseEntryName, atob(entry))

  // 3. bundle entrypoint with everything else
  const releaseName = 'miranda.bundle.js'
  const proc = Deno.run({
    cmd: ['deno', 'bundle', relaseEntryName, releaseName],
  })
  await proc.status()

  await Deno.run({
    cmd: ['rm', '-rf', '_data.js', relaseEntryName],
  }).status()

  console.log('- Ready! You can now compile ' + releaseName)
}