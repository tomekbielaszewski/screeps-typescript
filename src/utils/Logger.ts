export class NamedLogger {
  private readonly name: string

  public constructor(name: string) {
    this.name = name;
  }

  public log(...messages: string[]): void {
    if (this.checkFlag(Memory.log, this.name)) {
      const message = messages.join(" ")
      console.log(`[${Game.time}] ${this.name}> ${message}`)
    } else {
      Memory.log[this.name] = false
    }
  }

  private checkFlag(container: { [name: string]: any }, variable: string) {
    if (variable in container) {
      const value = container[variable]
      if (typeof value === 'string') return value === 'true'
      if (typeof value === 'boolean') return value as boolean
    }
    return false
  }
}
