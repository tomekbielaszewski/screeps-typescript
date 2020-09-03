interface CreepMemory {
  role: string;
  room: string;
  state?: number
  param: Record<string, any>
}

interface Memory {
  creeps: { [name: string]: CreepMemory };
  powerCreeps: { [name: string]: PowerCreepMemory };
  flags: { [name: string]: FlagMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  stats: Record<string, any>
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
