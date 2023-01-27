import { getEnabledTools } from "../tools.ts";

export class HelpTool {
  static getMeta() {
    return {
      name: 'help',
      help: 'show this help information',
      productionEnabled: true,
    }
  }

  static activate() {
    const tools = getEnabledTools()
    tools.forEach(t => {
      const meta = t.getMeta()

      // name length
      const nameLength = 14
      if (Array.isArray(meta.name)) {
        const nameLines: string[] = []
        meta.name.forEach((name, i) => {
          const line = ' '.repeat(nameLength - name.length) + name + '  ' + meta.help
          nameLines.push(line)
        })
        console.log(nameLines.join('\n'))
      } else {
        const nameLine = ' '.repeat(nameLength - meta.name.length) + meta.name + '  ' + meta.help
        console.log(nameLine)
      }
    })
  }
}
