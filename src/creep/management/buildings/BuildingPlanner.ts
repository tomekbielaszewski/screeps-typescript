import { SerializablePosition } from "../../../utils/Serializables";
import { SpiralPattern } from "./Patterns";
import { getLogger, Logger } from "./../../../utils/Logger"

interface PlannedBuilding {
  pos: SerializablePosition
  type: BuildableStructureConstant
}

export class RoomPlanner {
  private readonly logger: Logger = getLogger("RoomPlanner")
  private readonly bunkerPlanner: BunkerPlanner = new BunkerPlanner()

  private readonly buildingPriority: { [key: string]: number } = {
    STRUCTURE_SPAWN: 1,
    STRUCTURE_EXTENSION: 1,
    STRUCTURE_TOWER: 1,
    STRUCTURE_CONTAINER: 2,
    STRUCTURE_LINK: 3,
    STRUCTURE_ROAD: 3,
    STRUCTURE_WALL: 4,
    STRUCTURE_RAMPART: 4,
    STRUCTURE_STORAGE: 4,
    STRUCTURE_OBSERVER: 4,
    STRUCTURE_TERMINAL: 4,
    STRUCTURE_POWER_SPAWN: 4,
    STRUCTURE_LAB: 4,
    STRUCTURE_NUKER: 4
  }

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

      this.logger.log(`Removing duplicated positions from room layout. Plan size (${layout.length})...`)
      layout = [...layout.reduce(function (acc, building) {
        if (!acc.get(building.pos.toString())) {
          acc.set(building.pos.toString(), building)
        }
        return acc;
      }, new Map<string, PlannedBuilding>()).values()]
      this.logger.log(`Duplicated positions removed. Plan size (${layout.length})`)
    }
    Memory.rooms[bunkerPos.room].plan!.layout = layout.sort((a, b) => this.buildingPriority[a.type] - this.buildingPriority[b.type])
    return layout
  }

  /*
  Issues & ideas:
  - lack of priorities - roads should be build when there is no more needed buildings like extensions
  - reset CSites at RCL change
  - container at source should be built first of all
  - containers should be allowed to be placed at roads
   */
  public placeConstructionSites(layout: PlannedBuilding[], room: Room) {
    if (room.find(FIND_CONSTRUCTION_SITES).length == 0) { //TODO: it wont work correctly when layout is fully finished or no new CS can be placed (low RCL)
      let maxPriority = 10;
    layout.forEach(pb => {
      let pbPriority = this.buildingPriority[pb.type]
      if (pbPriority > maxPriority)
        return
      pb.pos = SerializablePosition.clone(pb.pos)
      let look1 = pb.pos.toPos().lookFor("structure")
      if (look1.length) {
        let struct = look1[0].structureType
        if (struct !== pb.type) {
          this.logger.log(`There is conflicting structure at ${pb.pos.toString()}. It's ${struct}, but should be ${pb.type} according to plan`)
        }
        return
      }

      let look2 = pb.pos.toPos().lookFor("constructionSite")
      if (look2.length) {
        let struct = look2[0].structureType
        if (struct !== pb.type) {
          this.logger.log(`There is conflicting construction site at ${pb.pos.toString()}. It's ${struct}, but should be ${pb.type} according to plan`)
        }
        return
      }

      let result = room.createConstructionSite(pb.pos.toPos(), pb.type)
      if (result === OK) {
        maxPriority = this.buildingPriority[pb.type]
      }
      this.logger.log(`CSite placement result: ${result}`)

    });
  }
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
      roads.push(...this.setupPathTo(source.pos, true))
    }
    return roads
  }

  public setupRoadToController(room: Room): PlannedBuilding[] {
    const controller = room.controller!
    return this.setupPathTo(controller.pos, true)
  }

  public setupRoadToMineral(room: Room): PlannedBuilding[] {
    const mineral = room.find(FIND_MINERALS)[0]
    return this.setupPathTo(mineral.pos, false)
  }

  private setupPathTo(pos: RoomPosition, containerAtEnd: boolean): PlannedBuilding[] {
    const closestExitPoint = pos.findClosestByPath(this.bunkerExitPoints)!
    const road = pos.findPathTo(closestExitPoint)
      .map(pathStep => {
        return {
          pos: new SerializablePosition(pathStep.x, pathStep.y, pos.roomName),
          type: STRUCTURE_ROAD
        } as PlannedBuilding
      })
    if (containerAtEnd) {
      road[road.length - 1].type = STRUCTURE_CONTAINER
    }
    return road
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
    '*': STRUCTURE_ROAD,
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
