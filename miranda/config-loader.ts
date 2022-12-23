import { SqlData, SqlDataDict } from "./types.ts";

export type ConfigDict = { [k: string]: string }

export class Config {

  private static sharedInstance: Config | null = null
  private sqlData: SqlData | undefined

  constructor(
    public isProduction: boolean,
    private config: ConfigDict,
  ) { }

  public static getInstance() {
    return this.sharedInstance!
  }

  public static async load(isProduction = false) {
    const dict = await this.readFromFile()
    this.sharedInstance = new Config(isProduction, dict)
  }

  get configDict(): ConfigDict {
    return this.config
  }

  get actionsUp(): SqlDataDict {
    return this.sqlData?.dataUp || {}
  }

  get actionsDown(): SqlDataDict {
    return this.sqlData?.dataDown || {}
  }

  get dbClientConf() {
    // return this.sqlData?.dataDown || {}
    return {
      database: this.config.db,
      user: this.config.user,
      password: this.config.pass,
      hostname: this.config.host,
      port: this.config.port,
    }
  }

  private static async readFromFile(): Promise<ConfigDict> {
    const dir = _currentScriptDir()
    const configPath = `${dir}/miranda.conf.ini`

    let data: string

    try {
      data = await Deno.readTextFile(configPath);
    } catch (error) {
      console.log('Error: unable to find config file.', error.message)
      console.log(`Looked here: '${configPath}'`)
      Deno.exit(1)
    }

    const cfg: ConfigDict = {}

    data.split(/\r?\n/)
      .filter(u => !(u.match(/^\s*$/) || u.startsWith('#')))
      .map(u => u.trim())
      .forEach(u => {
        const key = u.substring(0, u.indexOf('='))
        const val = u.substring(u.indexOf('=') + 1)

        switch (key) {
          case 'DSN':
            Object.assign(cfg, parseDsnEntry(val))
            break;

          default:
            Object.assign(cfg, parseDefaultEntry(key, val))
            break;
        }
      })

    return cfg
  }
}

export async function readConfigFile() {
  const dir = _currentScriptDir()
  const configPath = `${dir}/miranda.conf.ini`

  let data: string

  try {
    data = await Deno.readTextFile(configPath);
  } catch (error) {
    console.log('Error: unable to find config file.', error.message)
    console.log(`Looked here: '${configPath}'`)
    Deno.exit(1)
  }

  const cfg: ConfigDict = {}

  data.split(/\r?\n/)
    .filter(u => !(u.match(/^\s*$/) || u.startsWith('#')))
    .map(u => u.trim())
    .forEach(u => {
      const key = u.substring(0, u.indexOf('='))
      const val = u.substring(u.indexOf('=') + 1)

      switch (key) {
        case 'DSN':
          Object.assign(cfg, parseDsnEntry(val))
          break;

        default:
          Object.assign(cfg, parseDefaultEntry(key, val))
          break;
      }
    })

  return cfg
}

function parseDsnEntry(dsn: string): ConfigDict {
  const schemaB = dsn.indexOf('://')
  const hostB = dsn.indexOf('@')

  const driver = dsn.substring(0, schemaB)

  const accountFull = dsn.substring(schemaB + 3, hostB)
  const [user, pass] = accountFull.split(':')

  const dbB = dsn.indexOf('/', schemaB + 3)
  const hostFull = dsn.substring(hostB + 1, dbB)
  let [host, port] = hostFull.split(':')
  host = host || 'localhost'
  port = port || '5432'

  const db = dsn.substring(dbB + 1)

  return {
    driver, user, pass, host, port, db
  }
}

function parseDefaultEntry(key: string, val: string): ConfigDict {
  const dir = _currentScriptDir()

  // handle relative directory; make it absolute
  if (key.toLowerCase().startsWith('dir_') && !val.startsWith('/')) {
    let full = val
    if (val.startsWith('./')) {
      const sepB = val.indexOf('/')
      full = `${dir}/${val.substring(sepB + 1)}`
    } else {
      full = `${dir}/${val}`
    }

    return {
      [key]: full
    }
  }

  return {
    [key]: val
  }
}

// Return the absolute path of the current script directory
function _currentScriptDir() {
  // will break in bundle or compile
  // const scriptPath = new URL(import.meta.url).pathname
  // return scriptPath.substring(0, scriptPath.lastIndexOf('/'))
  return Deno.cwd()
}