export function CleanerJob(creep: Creep): void {
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
    const result = creep.transfer(spawn, RESOURCE_ENERGY);
    if (result === OK) return
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn);
    }
  } else {
    const ruins = creep.room.find(FIND_RUINS)
      .filter(r => r.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
    if (ruins && ruins.length) {
      const result = creep.withdraw(ruins[0], RESOURCE_ENERGY)
      if (result === OK) return
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(ruins[0]);
      }
    }
  }
}
