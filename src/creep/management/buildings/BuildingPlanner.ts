import { SerializablePosition } from "../../../utils/Serializables";
import { SpiralPattern } from "./Patterns";
import { getLogger, Logger } from "./../../../utils/Logger"
import { ServerOptions } from "https";

interface PlannedBuilding {
  pos: SerializablePosition
  type: BuildableStructureConstant
}

export class RoomPlanner {
  private readonly logger: Logger = getLogger("RoomPlanner")
  private readonly bunkerPlanner: BunkerPlanner = new BunkerPlanner()

  public findPlaceForBunker(room: Room): SerializablePosition {
    let bunkerPosition = this.getSavedBunkerPosition(room)
    if (!bunkerPosition) {
      this.logger.log(`No saved bunker position for room ${room.name}. Running BunkerPlanner...`)
      bunkerPosition = this.bunkerPlanner.findBunkerPosition(room)
      this.saveBunkerPosition(bunkerPosition, room)
      this.logger.log(`Bunker will be positioned at ${bunkerPosition.x} ${bunkerPosition.y}`)
    }
    return bunkerPosition
  }

  public setupBuildingsLayout(bunkerPos: SerializablePosition): PlannedBuilding[] {
    let layout = Memory.rooms[bunkerPos.room].plan!.layout
    if (!layout || layout.length === 0) {
      this.logger.log(`No saved bunker layout for room ${bunkerPos.room}. Running BunkerPlanner...`)
      layout = this.bunkerPlanner.setupBunkerLayout(bunkerPos)
      Memory.rooms[bunkerPos.room].plan!.layout = layout
      this.logger.log(`Bunker layout generated`)

      this.logger.log(`Finding bunker exit points...`)
      let exitPoints = this.bunkerPlanner.getExitPoints(bunkerPos)
      Memory.rooms[bunkerPos.room].plan!.exits = exitPoints
      this.logger.log(`Exit points found`)

      this.logger.log(`Generating paths to resources...`)
      let room = Game.rooms[bunkerPos.room]
      let roadPlanner = new RoadConnectionsPlanner(exitPoints)
      layout.push(...roadPlanner.setupRoadsToSources(room))
      layout.push(...roadPlanner.setupRoadToController(room))
      layout.push(...roadPlanner.setupRoadToMineral(room))
      this.logger.log(`Paths generated`)
    }
    return layout
  }

  private getSavedBunkerPosition(room: Room): SerializablePosition | undefined {
    return Memory.rooms[room.name]?.plan?.bunkerPosition
  }

  private saveBunkerPosition(bunkerPos: SerializablePosition, room: Room) {
    Memory.rooms[room.name].plan = {
      bunkerPosition: bunkerPos,
      layout: [],
      exits: []
    }
  }
}

class RoadConnectionsPlanner {
  private readonly bunkerExitPoints: RoomPosition[]

  constructor(bunkerExitPoints: SerializablePosition[]) {
    this.bunkerExitPoints = bunkerExitPoints.map(e => e.toPos())
  }

  public setupRoadsToSources(room: Room): PlannedBuilding[] {
    const roads = [] as PlannedBuilding[]
    const sources = room.find(FIND_SOURCES)
    for (const source of sources) {
      roads.push(...this.setupPathTo(source.pos))
    }
    return roads
  }

  public setupRoadToController(room: Room): PlannedBuilding[] {
    const controller = room.controller!
    return this.setupPathTo(controller.pos)
  }

  public setupRoadToMineral(room: Room): PlannedBuilding[] {
    const mineral = room.find(FIND_MINERALS)[0]
    return this.setupPathTo(mineral.pos)
  }

  private setupPathTo(pos: RoomPosition): PlannedBuilding[] {
    const closestExitPoint = pos.findClosestByPath(this.bunkerExitPoints)!
    return pos.findPathTo(closestExitPoint)
      .map(pathStep => {
        return {
          pos: new SerializablePosition(pathStep.x, pathStep.y, pos.roomName),
          type: STRUCTURE_ROAD
        } as PlannedBuilding
      })
  }
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

  private readonly EXIT_POINT: string = "*"

  // exit points are marked with `*`
  private readonly mainLayout: string[] = [
    '    .....    ',
    '   .*EEEE.   ',
    '  .EE.AELL.  ',
    ' .EEEE.LLLL. ',
    '.EEEE.T.LLL*.',
    '.EEE.NTA.L.E.',
    '.EO.TS MT.AE.',
    '.E.E.PTK.EEE.',
    '.*EEE.T.EEEE.',
    ' .EEEE.EEEE. ',
    '  .EEEE.EE.  ',
    '   .EEEE*.   ',
    '    .....    ',
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

  public setupBunkerLayout(bunkerPosition: SerializablePosition): PlannedBuilding[] {
    const buildings: PlannedBuilding[] = []
    const xOffset = this.mainLayout[0].length / 2
    const yOffset = this.mainLayout.length / 2

    for (let i = 0; i < this.mainLayout.length; i++) {
      const bunkerLine = this.mainLayout[i]
      const buildingKeys = bunkerLine.split('')
      for (let j = 0; j < buildingKeys.length; j++) {
        const buildingKey = buildingKeys[j];
        const buildingType = this.keys[buildingKey]
        if (!buildingType) continue

        buildings.push({
          type: buildingType,
          pos: new SerializablePosition(
            Math.floor(bunkerPosition.x + j - xOffset),
            Math.floor(bunkerPosition.y + i - yOffset),
            bunkerPosition.room
          )
        })
      }
    }

    return buildings
  }

  public getExitPoints(bunkerPosition: SerializablePosition): SerializablePosition[] {
    const exitPoints: SerializablePosition[] = []
    const xOffset = this.mainLayout[0].length / 2
    const yOffset = this.mainLayout.length / 2

    for (let i = 0; i < this.mainLayout.length; i++) {
      const bunkerLine = this.mainLayout[i]
      const buildingKeys = bunkerLine.split('')
      for (let j = 0; j < buildingKeys.length; j++) {
        const buildingKey = buildingKeys[j];
        if (buildingKey !== this.EXIT_POINT) continue

        exitPoints.push(new SerializablePosition(
          bunkerPosition.x + j - xOffset,
          bunkerPosition.y + i - yOffset,
          bunkerPosition.room
        ))
      }
    }

    return exitPoints
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
