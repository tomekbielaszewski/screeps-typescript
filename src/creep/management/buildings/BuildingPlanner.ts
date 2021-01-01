import {SerializablePosition} from "../../../utils/Serializables";

interface PlannedBuilding {
  pos: SerializablePosition
  type: BuildableStructureConstant
}

interface BuildingPlan {
  roomName: string
  level: number
  buildings: PlannedBuilding[]
}

class BuildingsPlanner {
  private readonly buildingList: BuildableStructureConstant[]

  public constructor() {
    this.buildingList = []
    this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    this.buildingList.push(...this.multipleOf(STRUCTURE_TOWER, 1))
    this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    this.buildingList.push(...this.multipleOf(STRUCTURE_STORAGE, 1))
    this.buildingList.push(...this.multipleOf(STRUCTURE_TOWER, 1))
    this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    this.buildingList.push(...this.multipleOf(STRUCTURE_TOWER, 1))
    this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    this.buildingList.push(...this.multipleOf(STRUCTURE_TERMINAL, 1))
    this.buildingList.push(...this.multipleOf(STRUCTURE_LAB, 10))
    this.buildingList.push(...this.multipleOf(STRUCTURE_TOWER, 3))
    this.buildingList.push(...this.multipleOf(STRUCTURE_OBSERVER, 1))
  }

  public plan(room: Room, level: number): BuildingPlan {
    const x = Game.flags.flag.pos.x
    const y = Game.flags.flag.pos.y
    const buildingPlan: BuildingPlan = {
      roomName: room.name,
      level,
      buildings: []
    }
    buildingPlan.buildings.push({
      pos: new SerializablePosition(x, y, room.name),
      type: "spawn"
    })
    const blacklistedPos = this.getBlacklistedPoses(room)
    let buildingCounter = 0
    let ringCounter = 1
    while (buildingCounter <= this.buildingList.length) {
      const ringWidth = ringCounter * 2
      for (let dx = -ringCounter; dx <= -ringCounter + ringWidth; dx++) {
        for (let dy = -ringCounter; dy <= -ringCounter + ringWidth; dy++) {
          if (dx === -ringCounter || dy === -ringCounter || dx === -ringCounter + ringWidth || dy === -ringCounter + ringWidth) {
            if ((dx + dy) % 2 === 0) {
              const pos = new SerializablePosition(x + dx, y + dy, room.name)
              if (this.isFarFromBorder(pos, 3))
                if (this.isWalkable(room.lookAt(pos.toPos()))) {
                  if (!this.isInRangeOfAnyPos(blacklistedPos, 4, pos)) {
                    buildingPlan.buildings.push({
                      pos,
                      type: this.buildingList[buildingCounter]
                    })
                    buildingCounter++
                  }
                }
            }
          }
        }
      }
      ringCounter++
    }
    return buildingPlan
  }

  private isWalkable(objects: LookAtResult[]): boolean {
    return objects
      .filter(o =>
        o.type === LOOK_TERRAIN && this.isNonWalkableTerrain(o) ||
        o.type === LOOK_STRUCTURES && !this.isWalkableStructure(o) ||
        o.type === LOOK_SOURCES
      )
      .length === 0;
  }

  private isNonWalkableTerrain(terrain: LookAtResult) {
    return terrain.terrain === "wall";
  }

  private isWalkableStructure(structure: LookAtResult) {
    return structure.structure?.structureType === STRUCTURE_CONTAINER ||
      structure.structure?.structureType === STRUCTURE_ROAD ||
      structure.structure?.structureType === STRUCTURE_RAMPART;
  }

  private getBlacklistedPoses(room: Room) {
    const bp = []
    if (room.controller) bp.push(room.controller.pos)
    room.find(FIND_SOURCES)
      .map(s => s.pos)
      .forEach(s => bp.push(s))
    room.find(FIND_MINERALS)
      .map(m => m.pos)
      .forEach(m => bp.push(m))
    return bp
  }

  private isInRangeOfAnyPos(positions: RoomPosition[], range: number, testedPos: SerializablePosition): boolean {
    return !!positions.find(p => testedPos.toPos().getRangeTo(p) <= range);
  }

  private isFarFromBorder(pos: SerializablePosition, range: number) {
    return pos.x > range && pos.y > range && pos.x < 50 - range && pos.y < 50 - range
  }

  private multipleOf(obj: BuildableStructureConstant, amount: number): BuildableStructureConstant[] {
    const arr: BuildableStructureConstant[] = []
    for (let i = 0; i < amount; i++) {
      arr.push(obj)
    }
    return arr
  }
}

export class RoomsPlanner {
  public runOnAllRooms(): void {
    Object.values(Game.rooms)
      // .filter(this.isEligibleForPlanning)
      .forEach(room => this.run(room))
  }

  private run(room: Room): void {
    const desiredRoomLevel = this.evaluateRoomLevel(room)
    const actualRoomLevel = 0//this.getActualRoomLevel(room)
    if (desiredRoomLevel === 0) console.log(`Room ${room.name} has no controller or controller is on level 0`)
    if (desiredRoomLevel > actualRoomLevel) {
      const plan = this.getSavedBuildingPlan(room) || this.createBuildingPlan(room, desiredRoomLevel)
      this.applyPlan(plan, room)
    }
  }

  private evaluateRoomLevel(room: Room): number {
    return room.controller?.level || 0
  }

  private getActualRoomLevel(room: Room): number {
    const appliedLevel = Memory.rooms[room.name]?.plan?.appliedLevel;
    return appliedLevel || 0
  }

  private getSavedBuildingPlan(room: Room): BuildingPlan | undefined {
    return undefined
  }


  private createBuildingPlan(room: Room, level: number): BuildingPlan {
    return new BuildingsPlanner().plan(room, level)
  }

  private applyPlan(plan: BuildingPlan, room: Room) {
    const opacity = 0.3
    for (const b of plan.buildings) {
      if (b.type)
        room.visual.text(b.type.substr(0, 3), b.pos.toPos(), {opacity})
    }
  }

  private isEligibleForPlanning(room: Room): boolean {
    return Memory.rooms[room.name]?.plan?.isEligible || false
  }
}
