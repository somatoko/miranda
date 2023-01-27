import { postgres } from './deps.ts'
import { MirandaConfig } from "./config.ts";

export type MigrationTuple = {
  id: number,
  version: number,
  label: string,
  inserted_at: Date,
}


export class DbClient {

  constructor(private _db: postgres.Client) {
  }

  public async ensureMigrationTableExists() {
    const existsQuery = `SELECT EXISTS(
      SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'migrations'
    )`
    const result = await this._db.queryArray(existsQuery)

    if (!result.rows[0]) {
      const q = `
      CREATE TABLE migrations (
        id serial PRIMARY KEY,
        version int,
        label VARCHAR(255),
        inserted_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`
      await this._db.queryArray(q)
    }
  }

  async collectPresentMigrations() {
    const q = `select * from migrations order by version DESC`
    const result = await this._db.queryObject<MigrationTuple>(q)
    return result.rows
  }

  async runTextQuery(query: string) {
    const trans = this._db.createTransaction('text-query')

    await trans.begin()
    const result = await trans.queryArray(query)
    await trans.commit()

    const ok = result.query.result_type === 0
    return ok
  }

  async registerMigrationEntry(version: number, label: string) {
    const q = `insert into migrations(version, label)
      values ($version, $label)`
    const result = await this._db.queryArray(q, { version, label })
    const ok = result.query.result_type === 0
    return ok
  }

  async unregisterMigrationEntry(version: number, label: string) {
    const q = `delete from migrations
      where version = $version AND label = $label`
    const result = await this._db.queryArray(q, { version, label })
    const ok = result.query.result_type === 0
    return ok
  }

  private async ping() {
    // ping: empty sql statement to test connection
    const result = await this._db.queryArray(';')
    // console.log('- DB ping', result)
    if (result.rows.length !== 0) {
      console.log('ERR  db ping failed')
    }
  }

  static async new() {
    const client = new postgres.Client(MirandaConfig.getInstance().dbClientConf)

    try {
      await client.connect()
      const wrapper = new DbClient(client)
      wrapper.ping()
      return wrapper
    } catch (e) {
      console.error('ERR\tunable to establish database connection', e.toString())
      Deno.exit(1)
    }
  }
}