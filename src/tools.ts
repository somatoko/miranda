import { MirandaConfig } from "./config.ts";
import { BundleTool } from "./tools/bundle.tool.ts";
import { CreateTool } from "./tools/create.tool.ts";
import { HelpTool } from "./tools/help.tool.ts";
import { InitTool } from "./tools/init.tool.ts";
import { MigrateTool } from "./tools/migrate.tool.ts";
import { RollbackTool } from "./tools/rollback.tool.ts";
import { StatusTool } from "./tools/status.tool.ts";
import { TestTool } from "./tools/test.tool.ts";
import { ToolDict, ToolInterface } from "./types.ts";

const ALL_TOOLS: ToolInterface[] = [
  BundleTool,
  CreateTool,
  HelpTool,
  InitTool,
  MigrateTool,
  RollbackTool,
  StatusTool,
  TestTool,
]

let _tools: ToolInterface[] | null = null

export function getEnabledTools(): ToolInterface[] {
  if (!_tools) {
    const cfg = MirandaConfig.getInstance()
    _tools = [...ALL_TOOLS].filter(t => !cfg.inProduction || t.getMeta().productionEnabled)
  }

  return _tools
}

export function getToolDict(): ToolDict {
  const tools = getEnabledTools()
  const dict: ToolDict = {}
  tools.forEach(t => {
    const m = t.getMeta()
    if (Array.isArray(m.name)) {
      m.name.forEach(n => dict[n] = t)
    } else {
      dict[m.name] = t
    }
  })

  return dict
}