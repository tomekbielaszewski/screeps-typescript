interface CreepMemory {
  role: string;
  room: string;
  state?: number
  param: Record<string, string>
}

interface Memory {
  uuid: number;
  log: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
