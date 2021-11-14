export class NamedLogger {
  private readonly name: string

  public constructor(name: string) {
    this.name = name;
  }

  public log(...messages: string[]): void {
    if (_.get(Memory.log, this.name) === 'true') {
      const message = messages.join(" ")
      console.log(`[${Game.time}] ${this.name}> ${message}`)
    } else {
      Memory.log[this.name] = false
    }
  }
}
