
export type ToolMeta = {
  name: string | string[]
  help: string
  productionEnabled: boolean
}

export type ToolInterface = {
  activate(): void
  getMeta(): ToolMeta
}

export type ToolDict = { [k: string]: ToolInterface }

export type SqlDataEntry = {
  version: number
  label: string
  action: string
}

export type SqlDataDict = { [k: string]: SqlDataEntry }

export type SqlData = {
  dataUp: SqlDataDict
  dataDown: SqlDataDict
}