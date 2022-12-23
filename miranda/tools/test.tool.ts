
export class TestTool {
  static getMeta() {
    return {
      name: 'test',
      help: 'for dev testing purposes',
      productionEnabled: false,
    }
  }

  static async activate() {
  }
}