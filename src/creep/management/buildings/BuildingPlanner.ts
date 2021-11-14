import {SerializablePosition} from "../../../utils/Serializables";
import {SpiralPattern} from "./Patterns";

interface PlannedBuilding {
  pos: SerializablePosition
  type: BuildableStructureConstant
}

interface BuildingPlan {
  roomName: string
  pos: SerializablePosition
  buildings: PlannedBuilding[]
}

class BunkerPlanner {
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

  public findBunkerPosition(room: Room): SerializablePosition {
    const bestPos = this.findBestSpot(room)
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

    return bunkerCenterCandidates
    .reduce((p1, p2) => p1.getRangeTo(bestPos) < p2.getRangeTo(bestPos) ? p1 : p2)
  }

  public setupBunkerLayout(bunkerPosition: SerializablePosition): BuildingPlan {
    const plan: BuildingPlan = {
      roomName: bunkerPosition.room,
      pos: bunkerPosition,
      buildings: []
    }
    const xOffset = this.mainLayout[0].length / 2
    const yOffset = this.mainLayout.length / 2

    for (let i = 0; i < this.mainLayout.length; i++) {
      const bunkerLine = this.mainLayout[i]
      const buildings = bunkerLine.split('')
      for (let j = 0; j < buildings.length; j++) {
        const buildingKey = buildings[j];
        if (buildingKey === ' ') continue
        const buildingType = this.keys[buildingKey]

        plan.buildings.push({
          type: buildingType,
          pos: new SerializablePosition(
            bunkerPosition.x + j - xOffset,
            bunkerPosition.y + i - yOffset,
            bunkerPosition.room
          )
        })
      }
    }

    return plan
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
  private readonly bunkerPlanner = new BunkerPlanner();

  public runOnAllRooms(): void {
    Object.values(Game.rooms)
    .forEach(this.initializeRoomMemory) //TODO move this outside to main maybe

    Object.values(Game.rooms)
    .filter(r => !this.hasAnyPlan(r))
    .forEach(this.initializeEmptyPlan)

    Object.values(Game.rooms)
    .filter(this.isEligibleForPlanning)
    .filter(r => !this.isAlreadyPlanned(r))
    .forEach(room => {
      const bunkerPos = this.bunkerPlanner.findBunkerPosition(room)
      this.savePlan(bunkerPos)
      Memory.rooms[room.name].plan.isPlanned = true
    })

    console.log(Memory.features.BuildingPlanVisualization)
    if (Memory.features.BuildingPlanVisualization) {
      Object.values(Game.rooms)
      .forEach(r => this.visualizePlan(r))
    } else {
      Memory.features.BuildingPlanVisualization = false
    }
  }

  public getBuildingPlan(room: Room): BuildingPlan | undefined {
    const planPos = Memory.rooms[room.name].plan.pos;
    if (planPos.exists()) {
      return this.bunkerPlanner.setupBunkerLayout(planPos)
    }
    return undefined
  }

  private visualizePlan(room: Room): void {
    const plan = this.bunkerPlanner.setupBunkerLayout(Memory.rooms[room.name].plan.pos);
    for (const b of plan.buildings) {
      room.visual.text(b.type.substr(0, 1), b.pos.x, b.pos.y, {opacity: 0.3})
    }
  }

  private savePlan(bunkerPos: SerializablePosition) {
    Memory.rooms[bunkerPos.room].plan = {
      isEligible: true,
      isPlanned: true,
      pos: bunkerPos
    }
  }

  private isEligibleForPlanning(room: Room): boolean {
    return Memory.rooms[room.name].plan.isEligible
  }

  private isAlreadyPlanned(room: Room): boolean {
    return Memory.rooms[room.name].plan.isPlanned
  }

  private initializeRoomMemory(room: Room): void {
    Memory.rooms = Memory.rooms || {}
    Memory.rooms[room.name] = Memory.rooms[room.name] || {
      plan: undefined,
      links: undefined
    }
  }

  private hasAnyPlan(room: Room): boolean {
    return !!Memory.rooms[room.name].plan
  }

  private initializeEmptyPlan(room: Room): void {
    Memory.rooms[room.name].plan = {
      isEligible: false,
      isPlanned: false,
      pos: SerializablePosition.NON_EXISTING_L
    }
  }
}
