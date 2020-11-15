export interface Logger {
  log: (...messages: string[]) => void
}

class NamedLogger implements Logger {
  private readonly name: string

  public constructor(name: string) {
    this.name = name;
  }

  public log(...messages: string[]): void {
    if (_.get(Memory.log, this.name) === true) {
      const message = messages.reduce((a, b) => a + " " + b, "")
      console.log(`[${Game.time}] ${message}`)
    }
  }
}

export function getLogger(name: string): Logger {
  return new NamedLogger(name)
}
