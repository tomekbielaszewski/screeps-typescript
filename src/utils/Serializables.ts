class SerializablePosition {
  public x: number
  public y: number
  public room: string

  public constructor(x: number, y: number, room: string) {
    this.x = x;
    this.y = y;
    this.room = room;
  }

  public toPos() {
    return new RoomPosition(this.x, this.y, this.room)
  }

  public static from(pos: RoomPosition) {
    return new SerializablePosition(pos.x, pos.y, pos.roomName)
  }
}

class SerializableRoomObject<T extends IdentifiableRoomObject> {
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
