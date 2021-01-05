import {SerializablePosition} from "../../../utils/Serializables";
import {SpiralPattern} from "./Patterns";

interface PlannedBuilding {
  pos: SerializablePosition
  type: BuildableStructureConstant
}

interface BuildingPlan {
  roomName: string
  buildings: PlannedBuilding[]
}

class BuildingsPlanner {
  private readonly BORDER_MARGIN: number = 4;

  private readonly keys: { [key: string]: BuildableStructureConstant } = {
    'A': STRUCTURE_SPAWN,
    'N': STRUCTURE_NUKER,
    'K': STRUCTURE_LINK,
    'L': STRUCTURE_LAB,
    'E': STRUCTURE_EXTENSION,
    'S': STRUCTURE_STORAGE,
    'T': STRUCTURE_TOWER,
    'O': STRUCTURE_OBSERVER,
    'M': STRUCTURE_TERMINAL,
    'P': STRUCTURE_POWER_SPAWN,
    '.': STRUCTURE_ROAD,
    'C': STRUCTURE_CONTAINER,
    'R': STRUCTURE_RAMPART,
    'W': STRUCTURE_WALL,
  }
  private readonly mainLayout: string[] = [
    '   ......    ',
    '   ..EEEE.   ',
    '  .EE.AELL.  ',
    ' .EEEE.LLLL..',
    '.EEEE.T.LLL..',
    '.EEE.NTA.L.E.',
    '.EO.TS MT.AE.',
    '.E.E.PTK.EEE.',
    '..EEE.T.EEEE.',
    '..EEEE.EEEE. ',
    '  .EEEE.EE.  ',
    '   .EEEE..   ',
    '    ......   ',
  ]

  public plan(room: Room): BuildingPlan {
    const bestPos = this.findBestSpot(room)
    const buildings: PlannedBuilding[] = []
    const bunkerWidth = Math.max(Math.floor(this.mainLayout[0].length / 2), Math.floor(this.mainLayout.length / 2),)

    const map = room.lookAtArea(0, 0, 49, 49)

    const spiralLevels = Math.max(bestPos.x, bestPos.y, 50 - bestPos.x, 50 - bestPos.y);

    const spiralOfObstacles = new SpiralPattern(bestPos, spiralLevels)
      .run()
      .filter(p => this.isFarFromBorder(p, 1))
      .filter(p => !this.isWalkable(map[p.y][p.x]))

    const bunkerCenterCandidates = new SpiralPattern(bestPos, spiralLevels)
      .run()
      .filter(p => this.isFarFromBorder(p, bunkerWidth + this.BORDER_MARGIN))
      .filter(p => this.isWalkable(map[p.y][p.x]))
      .filter(p => !this.isInRangeOf(spiralOfObstacles, bunkerWidth, p))

    const drawableCandidates = bunkerCenterCandidates
      .map(pos => ({
        pos,
        type: STRUCTURE_EXTENSION
      }))
    buildings.push(...drawableCandidates)

    const bunkerCenter = bunkerCenterCandidates
      .reduce((p1, p2) => p1.getRangeTo(bestPos) < p2.getRangeTo(bestPos) ? p1 : p2)

    buildings.push({
      pos: bunkerCenter,
      type: STRUCTURE_EXTENSION
    })

    return {
      buildings,
      roomName: room.name
    }
  }

  private isWalkable(objects: LookAtResult[]): boolean {
    return !objects.find(o =>
      o.type === LOOK_TERRAIN && this.isNonWalkableTerrain(o) ||
      o.type === LOOK_STRUCTURES && this.isNonWalkableStructure(o) ||
      o.type === LOOK_SOURCES
    )
  }

  private isNonWalkableTerrain(terrain: LookAtResult): boolean {
    return terrain.terrain === "wall";
  }

  private isNonWalkableStructure(structure: LookAtResult): boolean {
    return !!OBSTACLE_OBJECT_TYPES.find(o => o === structure.structure?.structureType)
  }

  private isInRangeOf(positions: SerializablePosition[], range: number, testedPos: SerializablePosition): boolean {
    return !!positions.find(p => p.getRangeTo(testedPos) <= range)
  }

  private isFarFromBorder(pos: SerializablePosition, range: number): boolean {
    return pos.x > range && pos.y > range && pos.x < 50 - range && pos.y < 50 - range
  }

  private findBestSpot(room: Room): SerializablePosition {
    const pos: RoomPosition[] = []
    pos.push(...room.find(FIND_SOURCES).map(s => s.pos))
    pos.push(...room.find(FIND_MINERALS).map(s => s.pos))
    if (room.controller) pos.push(room.controller.pos)

    const x = Math.floor(pos.map(p => p.x).reduce((x1, x2) => x1 + x2, 0) / pos.length)
    const y = Math.floor(pos.map(p => p.y).reduce((y1, y2) => y1 + y2, 0) / pos.length)

    return new SerializablePosition(x, y, room.name)
  }
}

export class RoomsPlanner {
  public runOnAllRooms(): void {
    Object.values(Game.rooms)
      // .filter(this.isEligibleForPlanning)
      .forEach(room => this.run(room))
  }

  private run(room: Room): void {
    const plan = this.getSavedBuildingPlan(room) || this.createBuildingPlan(room)
    this.savePlan(plan, room)
  }

  private getSavedBuildingPlan(room: Room): BuildingPlan | undefined {
    return undefined
  }

  private createBuildingPlan(room: Room): BuildingPlan {
    return new BuildingsPlanner().plan(room)
  }

  private savePlan(plan: BuildingPlan, room: Room) {
    const opacity = 0.3
    for (const b of plan.buildings) {
      if (b.type) {
        room.visual.text('X', b.pos.x, b.pos.y, {opacity})
        room.visual.rect(b.pos.x - 6.5, b.pos.y - 6.5, 13, 13, {fill: "", opacity, stroke: "red"})
      }
    }
  }

  private isEligibleForPlanning(room: Room): boolean {
    return Memory.rooms[room.name]?.plan?.isEligible || false
  }
}
