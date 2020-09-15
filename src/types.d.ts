interface CreepMemory {
  construction?: any;
  container?: string;
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

interface ContainerMemory {
  type: number
}

interface Memory {
  creeps: { [name: string]: CreepMemory };
  powerCreeps: { [name: string]: PowerCreepMemory };
  flags: { [name: string]: FlagMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  sources: { [id: string]: SourceMemory };
  containers: { [id: string]: ContainerMemory };
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
