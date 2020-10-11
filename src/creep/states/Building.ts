import {SerializableRoomObject} from "../../utils/Serializables";

export enum BuildingResult {
  Working,
  CreepStoreEmpty,
  NoConstructionSite,
  ConstructionSiteNoLongerExist,
  OutOfRange
}

export function building(creep: Creep): BuildingResult {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    return BuildingResult.CreepStoreEmpty
  }

  if (!creep.memory.construction) {
    creep.memory.construction = findClosestConstructionSite(creep)
  }

  if (!creep.memory.construction) {
    return BuildingResult.NoConstructionSite
  }

  const construction = creep.memory.construction?.get() as ConstructionSite
  if (!construction) {
    delete creep.memory.construction
    return BuildingResult.ConstructionSiteNoLongerExist
  }

  creep.memory.construction = SerializableRoomObject.from(construction)
  const buildResult = creep.build(construction)
  switch (buildResult) {
    case OK:
      return BuildingResult.Working
    case ERR_NOT_IN_RANGE:
      return BuildingResult.OutOfRange
    default:
      console.log(`Building: build result ${buildResult}`)
      return BuildingResult.Working
  }
}

function findClosestConstructionSite(creep: Creep): SerializableRoomObject<ConstructionSite> | undefined {
  const csite = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
  if (!csite) return undefined
  return SerializableRoomObject.from(csite)
}
