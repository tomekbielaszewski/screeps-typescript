export class NamedLogger {
  private readonly name: string

  public constructor(name: string) {
    this.name = name;
  }

  public log(...messages: string[]): void {
    if (_.get(Memory.log, this.name) === true) {
      const message = messages.reduce((a, b) => a + " " + b, "")
      console.log(`[${Game.time}] ${message}`)
    } else {
      Memory.log[this.name] = false
    }
  }
}
