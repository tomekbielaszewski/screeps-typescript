export interface IdentifiableRoomObject extends _HasId, _HasRoomPosition {
}

export class SerializablePosition {
  public x: number
  public y: number
  public room: string

  public constructor(x: number, y: number, room: string) {
    this.x = x;
    this.y = y;
    this.room = room;
  }

  public toPos(): RoomPosition {
    return new RoomPosition(this.x, this.y, this.room)
  }

  public static from(pos: RoomPosition): SerializablePosition {
    return new SerializablePosition(pos.x, pos.y, pos.roomName)
  }
}

export class SerializableRoomObject<T extends IdentifiableRoomObject> {
  public id: Id<T>
  public pos: SerializablePosition

  public constructor(id: Id<T>, pos: SerializablePosition) {
    this.id = id;
    this.pos = pos;
  }

  public isVisible(): boolean {
    return !!Game.getObjectById(this.id)
  }

  public get(): IdentifiableRoomObject | null {
    return Game.getObjectById(this.id)
  }

  public static from<T extends IdentifiableRoomObject>(obj: T): SerializableRoomObject<T> {
    return new SerializableRoomObject(obj.id, SerializablePosition.from(obj.pos))
  }
}

interface SourceMemory {
  creeps: string[]
  spots: number
}

interface ContainerMemory {
  type: number
}

declare global {
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
    move?: {
      target: SerializablePosition
      range?: number
    }
  }

  interface RoomMemory {
    links: { [type: string]: string }
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
}
