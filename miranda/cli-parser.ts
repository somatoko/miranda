import { MigrationManager } from "./migrator.ts";
import { getToolDict } from "./tools.ts";

export class CliParser {

  // get tools(): ToolDict {
  //   const all = {
  //     init: InitTool,
  //     migrate: MigrateTool,
  //     rollback: RollbackTool,
  //     make: CreateTool,
  //     'make:migration': CreateTool,
  //     'make:seed': CreateTool,
  //     status: StatusTool,
  //     help: HelpTool,
  //     test: TestTool,
  //     bundle: BundleTool,
  //   }

  // HelpTool.setAvailableTools(all)
  // return all
  // }

  static async parseAndRun() {
    let name = Deno.args[0]
    name = name === undefined ? 'help' : name

    const tools = getToolDict()

    if (!(name in tools)) {
      console.log(`Error: unknown task '${name}'; exiting.`)
      Deno.exit(1)
    }
    
    if (['rollback', 'migrate', 'status'].includes(name)) {
      await MigrationManager.loadFromFiles()
    }
    
    return await tools[name].activate()
  }
}
