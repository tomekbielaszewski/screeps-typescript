export interface IdentifiableRoomObject extends _HasId, _HasRoomPosition {
}

export class SerializablePosition {
  public static NON_EXISTING_L = new SerializablePosition(-1,-1, "");
  public static NON_EXISTING_H = new SerializablePosition(50,50, "");

  public x: number
  public y: number
  public room: string

  public constructor(x: number, y: number, room: string) {
    this.x = x;
    this.y = y;
    this.room = room;
  }

  public getRangeTo(pos: SerializablePosition | RoomPosition): number {
    return Math.max(Math.abs(pos.x - this.x), Math.abs(pos.y - this.y))
  }

  public toPos(): RoomPosition {
    return new RoomPosition(this.x, this.y, this.room)
  }

  public clone(): SerializablePosition {
    return SerializablePosition.clone(this)
  }

  public exists(): boolean {
    return this !== SerializablePosition.NON_EXISTING_L &&
      this !== SerializablePosition.NON_EXISTING_H &&
      this.x >= 0 && this.y >= 0 &&
      this.x < 50 && this.y < 50
  }

  public static from(pos: RoomPosition): SerializablePosition {
    return new SerializablePosition(pos.x, pos.y, pos.roomName)
  }

  public static clone(pos: SerializablePosition): SerializablePosition {
    return new SerializablePosition(pos.x, pos.y, pos.room)
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

  public static clone<T extends IdentifiableRoomObject>(obj: SerializableRoomObject<T>): SerializableRoomObject<T> {
    return new SerializableRoomObject(obj.id, SerializablePosition.clone(obj.pos))
  }

  public static cloneNullable<T extends IdentifiableRoomObject>(obj: SerializableRoomObject<T> | null | undefined): SerializableRoomObject<T> | null | undefined {
    if (!obj) return obj
    return this.clone(obj)
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
    pastStates?: string[]
    move?: {
      target: SerializablePosition
      range?: number
    }
  }

  interface RoomPlanMemory {
    isEligible: boolean
    isPlanned: boolean
    pos: SerializablePosition
  }

  interface RoomMemory {
    links: { [type: string]: string }
    plan: RoomPlanMemory
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
    watch?: {
      expressions?: {
        [exp: string]: string
      }
      values?: {
        [val: string]: string
      }
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
    log: { [name: string]: boolean }
  }
}
