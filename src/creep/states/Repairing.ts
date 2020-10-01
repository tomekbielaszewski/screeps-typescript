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

  if (!Memory.repair.lowHP || !Memory.repair.hysteresis) {
    Memory.repair.lowHP = 0.8
    Memory.repair.hysteresis = 0.19
  }

  if (Memory.repair.lowHP + Memory.repair.hysteresis > 1) {
    throw new Error("Wrong repairing settings! Low HP + Hysteresis must be lower or equal to 1!")
  }

  if (!creep.memory.repair) {
    findLowHpStructure(creep, repairFortifications)
  }

  if (!creep.memory.repair) {
    return RepairingResult.NothingToRepair
  }

  const repairedStructure = Game.getObjectById<OwnedStructure>(creep.memory.repair)
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

//Game.rooms['W24N13'].find(FIND_STRUCTURES).filter(s => s.structureType !== STRUCTURE_CONTROLLER).filter(s => s.hits / s.hitsMax < Memory.repair.lowHP)
// .filter(s => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART)
// .reduce((s1, s2) => (s1.hits / s1.hitsMax < s2.hits / s2.hitsMax ? s1 : s2))
// .map(s => s.structureType)

function findLowHpStructure(creep: Creep, repairFortifications: boolean) {
  let lowestHpStructures = creep.room.find(FIND_STRUCTURES)
    .filter(s => s.structureType !== STRUCTURE_CONTROLLER)
    .filter(s => hpPercent(s) < Memory.repair.lowHP);
  if (repairFortifications) {
    lowestHpStructures = lowestHpStructures
      .filter(s =>
        s.structureType !== STRUCTURE_WALL &&
        s.structureType !== STRUCTURE_RAMPART
      )
  }
  if (lowestHpStructures.length) {
    const lowestHpStructure = lowestHpStructures.reduce((s1, s2) => (hpPercent(s1) < hpPercent(s2) ? s1 : s2));
    creep.memory.repair = lowestHpStructure.id;
  }
}

function isRepaired(repairedStructure: Structure): boolean {
  switch (repairedStructure.structureType) {
    case STRUCTURE_WALL:
      return repairedStructure.hits > (Memory.repair.wall || 500000)
    case STRUCTURE_RAMPART:
      return repairedStructure.hits > (Memory.repair.rampart || 500000)
    default:
      return hpPercent(repairedStructure) > Memory.repair.lowHP + Memory.repair.hysteresis;
  }
}

function hpPercent(s: Structure): number {
  return s.hits / s.hitsMax;
}
