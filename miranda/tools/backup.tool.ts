export class BackupTool {
  static getMeta() {
    return {
      name: 'backup',
      help: 'create or apply backups',
      productionEnabled: false,
    }
  }

  static async activate() {
  }
}
