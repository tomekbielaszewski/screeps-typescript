interface CreepMemory {
  construction?: any;
  container?: Id<StructureContainer>;
  storage?: string;
  source?: string;
  role: string;
  room: string;
  state?: string;
  lastState?: string;
  targetPos?: {
    x: number,
    y: number,
    room: string,
  };
  param?: Record<string, any>;
}

interface SourceMemory {
  creeps: string[],
  spots: number;
}

interface Memory {
  creeps: { [name: string]: CreepMemory };
  powerCreeps: { [name: string]: PowerCreepMemory };
  flags: { [name: string]: FlagMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  sources: { [id: string]: SourceMemory };
  stats: Record<string, any>;
  mainComponentsTime: Record<string, any>;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
    legacy: boolean;
  }
}
