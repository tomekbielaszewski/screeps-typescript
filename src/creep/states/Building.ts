export enum BuildingSubState {
  Working,
  NoResources,
  NoConstructionSite,
  ConstructionSiteDoesNotExist,
  OutOfRange
}

export function building(creep: Creep): BuildingSubState {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    return BuildingSubState.NoResources
  }

  if (!creep.memory.construction) {
    creep.memory.construction = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)?.id
  }

  if (!creep.memory.construction) {
    return BuildingSubState.NoConstructionSite
  }

  const construction = Game.getObjectById(creep.memory.construction as Id<ConstructionSite>)
  if (!construction) {
    delete creep.memory.construction
    return BuildingSubState.ConstructionSiteDoesNotExist
  }

  creep.memory.construction = construction.id
  const buildResult = creep.build(construction)
  switch (buildResult) {
    case OK:
      return BuildingSubState.Working
    case ERR_NOT_IN_RANGE:
      return BuildingSubState.OutOfRange
    default:
      console.log(`Building: build result ${buildResult}`)
      return BuildingSubState.Working
  }
}
