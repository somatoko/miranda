import { readConfigFile } from "./config-loader.ts";
import { SqlData, SqlDataDict } from "./types.ts";

let _actionsUp: SqlDataDict = {}
let _actionsDown: SqlDataDict = {}

export class MigrationManager {

  public static loadFromString(data: string) {
    const parsed: SqlData = JSON.parse(atob(data))
    _actionsUp = parsed.dataUp
    _actionsDown = parsed.dataDown
  }

  public static async loadFromFiles() {
    const actions = await loadMigrationFiles()
    _actionsUp = actions.dataUp
    _actionsDown = actions.dataDown
  }

  static getActionsUp(): SqlDataDict {
    return _actionsUp
  }

  static getActionsDown(): SqlDataDict {
    return _actionsDown
  }

  static pendingVersionsUp(currentVersion: number, targetVersion: number) {
    return Object.keys(_actionsUp)
      .map(v => parseInt(v, 10))
      .filter(v => v > currentVersion && v <= targetVersion)
      .sort((a, b) => a - b)
  }

  static pendingVersionsDown(currentVersion: number, targetVersion: number) {
    // sort in reverse order
    return Object.keys(_actionsDown)
      .map(v => parseInt(v, 10))
      .filter(v => v <= currentVersion && v > targetVersion)
      .sort((a, b) => b - a)
  }

}

export async function loadMigrationFiles() {
  const migrator = await Migrator.new()
  const files = await migrator.collectPresentFiles()
  if (files.length === 0) {
    console.log('- No migration files found; done.')
    Deno.exit(0)
  }

  type MigrationData = { [k: string]: { version: number, label: string, action: string } }
  const dataUp: MigrationData = {}
  const dataDown: MigrationData = {}

  await Promise.all(files.map(async f => {
    const sUp = await f.getSectionUp()
    const sDown = await f.getSectionDown()
    dataUp[f.seq] = { version: f.seq, label: f.label, action: sUp }
    dataDown[f.seq] = { version: f.seq, label: f.label, action: sDown }
    return null
  }))

  return {
    dataUp,
    dataDown,
  }
}

export class Migrator {

  constructor(private _dir: string) { }

  async collectPresentFiles() {
    const entries: MigrationFile[] = []

    for await (const u of Deno.readDir(this._dir)) {
      const match = u.name.match(/^(\d{4})\_/)
      if (match) {
        const num = parseInt(match[1], 10)
        entries.push(new MigrationFile(this._dir, num, u.name))
      }
    }

    entries.sort((a, b) => a.seq - b.seq)
    return entries
  }

  static async new() {
    const cfg = await readConfigFile()

    const migrator = new Migrator(cfg.DIR_MIGRATIONS)
    await migrator.collectPresentFiles()
    return migrator
  }
}

export class MigrationFile {

  constructor(
    private _dir: string,
    public seq: number,
    private _filename: string) { }

  get label(): string {
    return this._filename.substring(0, this._filename.lastIndexOf('.'))
  }
  get path(): string {
    return `${this._dir}/${this._filename}`
  }

  toString(): string {
    return `${this.seq}\t${this.label}`
  }

  readSectionUp() {
    const all = Deno.readTextFile(this.path)
    console.log(all)
  }

  async getSectionUp() {
    const full = await Deno.readTextFile(this.path)
    const [up, _down] = full.split('-- < UP above / DOWN below >--')
    return up.trim()
  }

  async getSectionDown() {
    const full = await Deno.readTextFile(this.path)
    const [_up, down] = full.split('-- < UP above / DOWN below >--')
    return down.trim()
  }
}