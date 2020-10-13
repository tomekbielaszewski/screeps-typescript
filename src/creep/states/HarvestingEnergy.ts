import {assignToSource} from "../management/SourceAssigner";
import {SerializableRoomObject} from "../../utils/Serializables";

export enum HarvestingResult {
  CreepStoreFull,
  CouldNotFindSource,
  Harvesting,
  OutOfRange,
  CouldNotHarvest,
  SourceEmpty,
}

export function harvest(creep: Creep, checkCapacity: boolean, changeSourceWhenEmpty: boolean): HarvestingResult {
  if (checkCapacity && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    return HarvestingResult.CreepStoreFull
  }

  if (!creep.memory.source) {
    assignSource(creep)
  }

  let source = creep.memory.source?.get() as Source | null
  if (!source) {
    assignSource(creep);
    return HarvestingResult.CouldNotFindSource
  }

  if (changeSourceWhenEmpty && source.energy === 0) {
    source = findAlternativeSource(creep)
  }

  if (!source) {
    return HarvestingResult.CouldNotFindSource
  }

  creep.memory.sourceTargeted = SerializableRoomObject.from(source)
  const harvestResult = creep.harvest(source)
  switch (harvestResult) {
    case OK:
      return HarvestingResult.Harvesting
    case ERR_NOT_IN_RANGE:
      return HarvestingResult.OutOfRange
    case ERR_NOT_ENOUGH_RESOURCES:
      return HarvestingResult.SourceEmpty
    default:
      console.log(`HarvestingEnergy: harvest result ${harvestResult}`);
      return HarvestingResult.CouldNotHarvest
  }
}

function assignSource(creep: Creep) {
  creep.room.find(FIND_SOURCES)
    .sort((s1, s2) => creep.pos.getRangeTo(s1.pos) - creep.pos.getRangeTo(s2.pos))
    .find(source => assignToSource(creep, source));
}

function findAlternativeSource(creep: Creep): Source | null {
  const find = creep.room.find(FIND_SOURCES)
    .filter(s => s.id !== creep.memory.source?.id)
    .find(s => s.energy > 0);
  return find === undefined ? null : find;
}
