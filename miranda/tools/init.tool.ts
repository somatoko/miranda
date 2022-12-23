
export class InitTool {
  static getMeta() {
    return {
      name: 'init',
      help: 'create configuration file',
      productionEnabled: false,
    }
  }

  static activate() {
    const path = `${Deno.cwd()}/miranda.conf.ini`
    const template = `# Database connection line
DSN=postgres://user:password@localhost:5432/my_db

# Folders
DIR_MIGRATIONS=scripts/migrate/migrations
DIR_SEEDS=scripts/migrate/seeds
    `
    Deno.writeTextFileSync(path, template)
    console.log(' = Success! Created `miranda.conf.ini` (edit this file for your setup)')
  }
}