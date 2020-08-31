interface CreepMemory {
  role: string;
  room: string;
  state?: number
  param: Record<string, string>
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
