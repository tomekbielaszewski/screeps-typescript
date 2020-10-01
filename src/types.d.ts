interface CreepMemory {
  repair?: any;
  construction?: any;
  container?: string;
  storage?: any;
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
  repair: {
    hysteresis: number;
    lowHP: number;
    fortifications: boolean;
    wall: number;
    rampart: number;
  }
  features: { [name: string]: boolean };
  creeps: { [name: string]: CreepMemory };
  powerCreeps: { [name: string]: PowerCreepMemory };
  flags: { [name: string]: FlagMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  sources: { [id: string]: SourceMemory };
  containers: { [id: string]: ContainerMemory };
  stats: Record<string, any>;
  mainComponentsTime: Record<string, any>;
  log: {
    state: boolean
  }
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
    legacy: boolean;
    cli: any;
  }
}
