export enum RefillingResult {
  CreepStoreFull,
  CreepRefilled,
  OutOfRange,
  NoResourcesInStorage,
  CouldNotWithdraw
}

export function refillCreep(creep: Creep, takeFromSpawn: boolean): RefillingResult {
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    return RefillingResult.CreepStoreFull
  }

  let storage;

  if (creep.memory.container?.get()) {
    storage = creep.memory.container.get() as StructureContainer;
  } else {
    storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: s =>
        (s.structureType === STRUCTURE_STORAGE && s.my && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0) ||
        (s.structureType === STRUCTURE_LINK && s.my && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0) ||
        (s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
    });
  }
  if (!storage && takeFromSpawn) { // in case of lack of any storage facility other than spawn
    const storageAvailable = creep.room.find(FIND_STRUCTURES, {
      filter: s =>
        (s.structureType === STRUCTURE_STORAGE && s.my) ||
        (s.structureType === STRUCTURE_LINK && s.my) ||
        (s.structureType === STRUCTURE_CONTAINER)
    });
    if (!storageAvailable.length) {
      const spawns = creep.room.find(FIND_MY_STRUCTURES)
        .filter(s => s.structureType === STRUCTURE_SPAWN &&
          s.room.energyAvailable > (Memory.minEnergyAvailable || 250))
      storage = spawns.length ? spawns[0] : undefined;
    }
  }

  if (storage) {
    creep.memory.storage = SerializableRoomObject.from(storage)
    const result = creep.withdraw(storage, RESOURCE_ENERGY)
    switch (result) {
      case OK:
        return RefillingResult.CreepRefilled
      case ERR_NOT_IN_RANGE:
        return RefillingResult.OutOfRange
      default:
        console.log(`Refilling: withdraw result ${result}`)
        return RefillingResult.CouldNotWithdraw
    }
  }
  delete creep.memory.storage
  return RefillingResult.NoResourcesInStorage
}
