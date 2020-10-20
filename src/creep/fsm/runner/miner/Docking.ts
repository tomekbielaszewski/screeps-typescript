import {SerializableRoomObject} from "../../../../utils/Serializables";

export enum DockingResult {
  NO_SOURCE,
  SOURCE_OUT_OF_RANGE,
  DOCKED,
  CONTAINER_OUT_OF_RANGE,
  READY_TO_BUILD_CONTAINER,
  CONTAINER_CSITE_OUT_OF_RANGE,
  CONTAINER_CSITE_CREATED
}

export function docking(creep: Creep): DockingResult {
  if (!creep.memory.source) return DockingResult.NO_SOURCE
  if (!creep.memory.source.isVisible() || //in case of source being in another room - lets walk to that room first
    creep.pos.getRangeTo(creep.memory.source.pos.toPos()) > 1) {
    return DockingResult.SOURCE_OUT_OF_RANGE
  }

  const source = creep.memory.source.get()
  if (!source) return DockingResult.NO_SOURCE

  // when there is container already
  const containers = source.pos.findInRange(FIND_STRUCTURES, 1)
    .filter(s => s.structureType === STRUCTURE_CONTAINER)
  if (containers && containers.length) {
    const container = containers[0]
    creep.memory.container = SerializableRoomObject.from(container as StructureContainer)

    if (container.pos === creep.pos) {
      return DockingResult.DOCKED
    } else {
      return DockingResult.CONTAINER_OUT_OF_RANGE
    }
  }

  // when there is no container but there is a CSite
  const containerCSites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1)
    .filter(cs => cs.structureType === STRUCTURE_CONTAINER)
  if (containerCSites && containerCSites.length) {
    const containerCSite = containerCSites[0]
    creep.memory.construction = SerializableRoomObject.from(containerCSite as ConstructionSite)

    if (containerCSite.pos === creep.pos) {
      return DockingResult.READY_TO_BUILD_CONTAINER
    } else {
      return DockingResult.CONTAINER_CSITE_OUT_OF_RANGE
    }
  }

  // when the source has no CSite nor container
  if (creep.pos.getRangeTo(source.pos) <= 1) {
    creep.pos.createConstructionSite(STRUCTURE_CONTAINER)
    return DockingResult.CONTAINER_CSITE_CREATED
  } else {
    return DockingResult.SOURCE_OUT_OF_RANGE
  }
}
