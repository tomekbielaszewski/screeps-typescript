interface IdentifiableRoomObject extends _HasId, _HasRoomPosition {
}

interface CreepMemory {
  repair?: SerializableRoomObject<Structure>
  construction?: SerializableRoomObject<ConstructionSite>
  container?: SerializableRoomObject<StructureContainer>
  storage?: SerializableRoomObject<Structure>
  source?: SerializableRoomObject<Source>
  sourceTargeted?: SerializableRoomObject<Source>
  role: string
  room: string
  state?: string
  lastState?: string
  targetPos?: SerializablePosition
  param?: Record<string, any>
}

interface RoomMemory {
  links: { [type: string]: string }
}

interface SourceMemory {
  creeps: string[]
  spots: number
}

interface ContainerMemory {
  type: number
}

interface Memory {
  repair: {
    hysteresis: number
    lowHP: number
    fortifications: boolean
    wall: number
    rampart: number
    rampartLow: number
  }
  minEnergyAvailable: number
  features: { [name: string]: boolean }
  creeps: { [name: string]: CreepMemory }
  powerCreeps: { [name: string]: PowerCreepMemory }
  flags: { [name: string]: FlagMemory }
  rooms: { [name: string]: RoomMemory }
  spawns: { [name: string]: SpawnMemory }
  sources: { [id: string]: SourceMemory }
  containers: { [id: string]: ContainerMemory }
  stats: Record<string, any>
  mainComponentsTime: Record<string, any>
  log: {
    state: boolean
  }
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any
    legacy: boolean
    cli: any
  }
}
