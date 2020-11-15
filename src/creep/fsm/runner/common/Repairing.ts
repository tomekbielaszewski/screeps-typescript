import {SerializableRoomObject} from "../../../../utils/Serializables";

export enum RepairingResult {
  CreepStoreEmpty,
  NothingToRepair,
  StructureNoLongerExists,
  StructureRepaired,
  Working,
  OutOfRange,
  CouldNotRepair
}

export function repairing(creep: Creep, repairFortifications: boolean): RepairingResult {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    return RepairingResult.CreepStoreEmpty
  }

  Memory.repair.lowHP = Memory.repair.lowHP || 0.8
  Memory.repair.hysteresis = Memory.repair.hysteresis || 0.19
  Memory.repair.wall = Memory.repair.wall || 50000
  Memory.repair.rampartLow = Memory.repair.rampartLow || 40000
  Memory.repair.rampart = Memory.repair.rampart || 50000

  if (Memory.repair.lowHP + Memory.repair.hysteresis > 1) {
    throw new Error("Wrong repairing settings! Low HP + Hysteresis must be lower or equal to 1!")
  }

  if (!creep.memory.repair) {
    const lowHpStructures = findLowHpStructures(creep.room, repairFortifications)
    if (lowHpStructures.length) {
      const lowestHpStructure = lowHpStructures.reduce((s1, s2) => (hpPercent(s1) < hpPercent(s2) ? s1 : s2))
      creep.memory.repair = SerializableRoomObject.from(lowestHpStructure)
    }
  }

  if (!creep.memory.repair) {
    return RepairingResult.NothingToRepair
  }

  const repairedStructure = SerializableRoomObject.clone(creep.memory.repair).get() as Structure
  if (!repairedStructure) {
    delete creep.memory.repair
    return RepairingResult.StructureNoLongerExists
  }

  if (isRepaired(repairedStructure)) {
    delete creep.memory.repair
    return RepairingResult.StructureRepaired
  }

  const repairResult = creep.repair(repairedStructure)
  switch (repairResult) {
    case OK:
      return RepairingResult.Working
    case ERR_NOT_IN_RANGE:
      return RepairingResult.OutOfRange
    default:
      console.log(`Repairing: repair result ${repairResult}`)
      return RepairingResult.CouldNotRepair
  }
}

export function findLowHpStructures(room: Room, repairFortifications: boolean): Structure[] {
  const lowHpStructures = room.find(FIND_STRUCTURES)
    .filter(s => s.structureType !== STRUCTURE_CONTROLLER)
    .filter(s => s.structureType !== STRUCTURE_WALL)
    .filter(s => s.structureType !== STRUCTURE_RAMPART)
    .filter(s => hpPercent(s) < Memory.repair.lowHP)
  if (repairFortifications) {
    lowHpStructures.push(...room.find(FIND_STRUCTURES)
      .filter(s => s.structureType === STRUCTURE_WALL && s.hits < Memory.repair.wall ||
        s.structureType === STRUCTURE_RAMPART && s.hits < Memory.repair.rampartLow))
  }
  return lowHpStructures
}

function isRepaired(repairedStructure: Structure): boolean {
  switch (repairedStructure.structureType) {
    case STRUCTURE_WALL:
      return repairedStructure.hits > Memory.repair.wall
    case STRUCTURE_RAMPART:
      return repairedStructure.hits > Memory.repair.rampart
    default:
      return hpPercent(repairedStructure) > Memory.repair.lowHP + Memory.repair.hysteresis
  }
}

function hpPercent(s: Structure): number {
  return s.hits / s.hitsMax
}
