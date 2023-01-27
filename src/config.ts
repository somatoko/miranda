import { path } from "./deps.ts";

export type ConfigDict = { [k: string]: string }

export interface ManualConfig {
  dsn: string
  dirMigrations: string
  dirseeds: string
}

export class MirandaConfig {
  private static sharedInstance: MirandaConfig
  private dict?: ConfigDict
  private _inProduction = false

  private constructor() {
    this._inProduction = isInProduction()
  }
  private setDict(dict: ConfigDict) {
    this.dict = dict
    console.log(this);

  }

  get inProduction(): boolean {
    return this._inProduction
  }

  get dirMigrations(): string {
    if (this.dict && 'DIR_MIGRATIONS' in this.dict) {
      return this.dict.DIR_MIGRATIONS
    }
    console.error('Error: config file not found');
    Deno.exit(1)
    return ''
  }

  get dbClientConf() {
    if (!this.dict) {
      console.error('Error: unable to find database config');
      Deno.exit(1)
    }

    const cfg = this.dict
    return {
      database: cfg.db,
      user: cfg.user,
      password: cfg.pass,
      hostname: cfg.host,
      port: cfg.port,
    }
  }

  static getDirMigrations() {
    const inst = this.sharedInstance
    if (inst.dict) {
      return inst.dict.DIR_MIGRATIONS
    } else {
      console.error('Error: configuration is not set');
      Deno.exit(1)
    }
  }

  static getDirSeeds() {
    const inst = this.sharedInstance
    if (inst.dict) {
      return inst.dict.DIR_SEEDS
    } else {
      console.error('Error: configuration is not set');
      Deno.exit(1)
    }
  }

  public static getInstance() {
    return this.sharedInstance
  }

  static async load() {
    this.sharedInstance = new MirandaConfig()

    const dict = await findAndLoad()
    if (dict) {
      this.sharedInstance.setDict(dict)
    }
  }

  /**
   * Manually provide configuration entries.
   * @param cfg object containing configuration properties.
   */
  static configure(cfg: ManualConfig) {
    const content = `# Manual config
    DSN=${cfg.dsn}
    DIR_MIGRATIONS=${cfg.dirMigrations}
    DIR_MIGRATIONS=${cfg.dirseeds}
    `
    const parser = new ConfigParser(Deno.cwd())
    const dict = parser.parse(content)
    this.sharedInstance = new MirandaConfig()
    this.sharedInstance.setDict(dict)
  }
}

async function findAndLoad(): Promise<ConfigDict | null> {
  const carefullyGetConfigContent = async (path: string) => {
    try {
      return await Deno.readTextFile(path);
    } catch (_error) {
      // console.error(`Error: unable to find config file; looked here: '${path}'`)
      // Deno.exit(1)
      return null
    }
  }

  // Look if we have something on command line
  const allMarks = ['--config', '--conf', '-c']
  const markIndex = allMarks.map(u => Deno.args.indexOf(u)).filter(u => u >= 0)
  if (markIndex.length > 0) {
    const configPath = Deno.args[markIndex[0] + 1]
    const content = await carefullyGetConfigContent(configPath)
    if (content) {
      const parser = new ConfigParser(path.dirname(configPath))
      return parser.parse(content)
    }
  } else {
    // Assume to find in default location
    const configPath = path.join(Deno.cwd(), 'miranda.conf.ini')
    const content = await carefullyGetConfigContent(configPath)
    if (content) {
      const parser = new ConfigParser(Deno.cwd())
      return parser.parse(content)
    }
  }

  return null
}

function isInProduction(): boolean {
  const allMarks = ['--production', '--prod', '-p']
  return allMarks.some(u => Deno.args.includes(u))
}

class ConfigParser {
  constructor(private baseDir: string) {
    this.baseDir = path.resolve(baseDir)
  }

  parse(content: string) {
    const cfg: ConfigDict = {}

    content.split(/\r?\n/)
      .filter(u => !(u.match(/^\s*$/) || u.startsWith('#')))
      .map(u => u.trim())
      .forEach(u => {
        const key = u.substring(0, u.indexOf('='))
        const val = u.substring(u.indexOf('=') + 1)

        switch (key) {
          case 'DSN':
            Object.assign(cfg, this.parseDsnEntry(val))
            break;

          default:
            Object.assign(cfg, this.parseDefaultEntry(key, val))
            break;
        }
      })

    return cfg
  }

  private parseDsnEntry(dsn: string): ConfigDict {
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

  private parseDefaultEntry(key: string, val: string): ConfigDict {
    // handle relative directory; make it absolute
    if (key.toLowerCase().startsWith('dir_') && !val.startsWith('/')) {
      return {
        [key]: path.join(this.baseDir, val)
      }
    }

    return {
      [key]: val
    }
  }
}