export class BuildingSearch {
  private lowHpStructures: { [id: string]: Structure[] }
  private myConstructionSites: { [id: string]: ConstructionSite[] }

  public constructor() {
    this.lowHpStructures = {}
    this.myConstructionSites = {}
  }

  public resetCache(): void {
    this.lowHpStructures = {}
    this.myConstructionSites = {}
  }

  public findLowHpStructures(room: Room, includeFortifications?: boolean): Structure[] {
    if (this.lowHpStructures[room.name]) return this.lowHpStructures[room.name]

    const lowHpStructures: Structure[] = room.find(FIND_STRUCTURES)
      .filter(s => s.structureType !== STRUCTURE_CONTROLLER)
      .filter(s => s.structureType !== STRUCTURE_WALL)
      .filter(s => s.structureType !== STRUCTURE_RAMPART)
      .filter(s => this.hpPercent(s) < Memory.repair.lowHP)

    if (includeFortifications) {
      lowHpStructures.push(...room.find(FIND_STRUCTURES)
        .filter(s => s.structureType === STRUCTURE_WALL && s.hits < Memory.repair.wall ||
          s.structureType === STRUCTURE_RAMPART && s.hits < Memory.repair.rampartLow))
    }

    return this.lowHpStructures[room.name] = lowHpStructures
  }

  public findMyConstructionSites(room: Room): ConstructionSite[] {
    if (this.myConstructionSites[room.name]) return this.myConstructionSites[room.name]
    return this.myConstructionSites[room.name] = room.find(FIND_MY_CONSTRUCTION_SITES)
  }

  private hpPercent(s: Structure): number {
    return s.hits / s.hitsMax
  }
}
