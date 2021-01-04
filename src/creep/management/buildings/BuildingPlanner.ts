import {SerializablePosition} from "../../../utils/Serializables";
import {SpiralPattern} from "./Patterns";

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
    this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 60))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_TOWER, 1))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_STORAGE, 1))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_TOWER, 1))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_TOWER, 1))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_EXTENSION, 10))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_TERMINAL, 1))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_LAB, 10))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_TOWER, 3))
    // this.buildingList.push(...this.multipleOf(STRUCTURE_OBSERVER, 1))
  }

  public plan(room: Room, level: number): BuildingPlan {
    if (!Game.flags.flag) return {
      roomName: room.name,
      level,
      buildings: []
    }
    const x = Game.flags.flag.pos.x
    const y = Game.flags.flag.pos.y
    const buildings: PlannedBuilding[] = []

    const controllerPos = room.controller ? [room.controller.pos] : []
    const sourcesPos = room.find(FIND_SOURCES).map(s => s.pos)
    const mineralsPos = room.find(FIND_MINERALS).map(m => m.pos)

    buildings.push(...new SpiralPattern(new SerializablePosition(x, y, room.name), 10)
      .run()
      .filter(p => this.isFarFromBorder(p, 3))
      .filter(p => this.isWalkable(room.lookAt(p.toPos())))
      .filter(p => !this.isInRangeOf(controllerPos, 2, p))
      .filter(p => !this.isInRangeOf(sourcesPos, 2, p))
      .filter(p => !this.isInRangeOf(mineralsPos, 2, p))
      .filter(p => (p.x + p.y) % 2 === 0)
      .map(pos => ({
        pos,
        type: STRUCTURE_EXTENSION
      })))

    return {
      buildings,
      level,
      roomName: room.name
    }
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

  private isInRangeOf(positions: RoomPosition[], range: number, testedPos: SerializablePosition): boolean {
    return !!positions.find(p => testedPos.toPos().getRangeTo(p) <= range);
  }

  private isFarFromBorder(pos: SerializablePosition, range: number): boolean {
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
