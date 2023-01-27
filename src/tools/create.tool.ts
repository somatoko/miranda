import { MirandaConfig } from "../config.ts"

export class CreateTool {
  static getMeta() {
    return {
      name: ['make', 'make:migration'],
      help: 'create migration file',
      productionEnabled: false,
    }
  }

  static async activate() {
    const commandName = Deno.args[0]
    let [_, subtool] = commandName.split(':')
    subtool = subtool || 'migration'
    switch (subtool) {
      case 'migration':
        await createNewMigrationFile()
        break;

      case 'seed':
        await createNewSeedFile()
        break;

      default:
        break;
    }
  }
}


async function createNewMigrationFile() {
  const dirMigrations = MirandaConfig.getDirMigrations()
  ensureDirExists(dirMigrations)

  // read existing files with a pattern and extract serial numbers
  const numSet = new Set<number>([0])
  for await (const u of Deno.readDir(dirMigrations)) {
    const match = u.name.match(/^(\d{4})\_/)
    if (match) {
      const num = parseInt(match[1], 10)
      numSet.add(num)
    }
  }

  // create next serial number
  const nums = Array.from(numSet.values())
  nums.sort((a, b) => b - a)
  const index = nums[0] + 1
  const indexSerial = zeroPaddedNumber(index)

  const note = Deno.args[1] || 'unnamed_migration'
  const filename = `${indexSerial}_${note}.sql`
  await Deno.writeTextFile(`${dirMigrations}/${filename}`, defaultMigrationTemplate())

  console.log(` OK\tcreated migration file ${filename}`)
}

function defaultMigrationTemplate() {
  return `\n\n-- < UP above / DOWN below >--\n\n`
}

function createNewSeedFile() {
  ensureDirExists(MirandaConfig.getDirSeeds())
}

function ensureDirExists(dir: string) {
  // throws on missing dir
  // const stat = await Deno.stat(dir)
  // console.log('- stat', stat.isFile)
  return Deno.mkdir(dir)
    .catch(e => { })
}

function zeroPaddedNumber(num: number, size = 4) {
  let n = num.toString()
  while (n.length < size) {
    n = "0" + n
  }
  return n
}