export enum StoringResult {
  CreepStoreEmpty,
  NoStorageSpaceAvailableInRoom,
  Storing,
  StoringFinished,
  OutOfRange,
  AssignedStorageFull,
  CouldNotTransfer
}

export function storeEnergy(creep: Creep): StoringResult {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    delete creep.memory.storage
    return StoringResult.CreepStoreEmpty
  }

  if (!creep.memory.storage || Game.getObjectById(creep.memory.storage) === null) {
    creep.memory.storage = findStorage(creep)?.id
    if (!creep.memory.storage) {
      return StoringResult.NoStorageSpaceAvailableInRoom
    }
  }

  const assignedStorage = Game.getObjectById(creep.memory.storage as Id<StructureSpawn | StructureExtension | StructureStorage | StructureContainer>)
  if (!assignedStorage) {
    delete creep.memory.storage
    return StoringResult.NoStorageSpaceAvailableInRoom
  }

  const transferResult = creep.transfer(assignedStorage, RESOURCE_ENERGY)
  switch (transferResult) {
    case OK:
      if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        delete creep.memory.storage
        return StoringResult.StoringFinished
      }
      return StoringResult.Storing
    case ERR_NOT_IN_RANGE:
      return StoringResult.OutOfRange
    case ERR_FULL:
      delete creep.memory.storage
      return StoringResult.AssignedStorageFull
    default:
      console.log(`StoringEnergy: transfer result ${transferResult}`)
      return StoringResult.CouldNotTransfer
  }
}

function findStorage(creep: Creep): Structure | undefined {
  return findSpawn(creep) ||
    findTower(creep) ||
    findClosestExtension(creep) ||
    findClosestContainer(creep) ||
    findClosestStorage(creep);
}

function findSpawn(creep: Creep): Structure | undefined {
  const spawns = creep.room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  if (spawns && spawns.length) return spawns[0];
  return undefined;
}

function findTower(creep: Creep): Structure | undefined {
  const towers = creep.room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  if (towers && towers.length) return towers[0];
  return undefined;
}

function findClosestExtension(creep: Creep): Structure | undefined {
  const extension = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  if (extension) return extension;
  return undefined;
}

function findClosestContainer(creep: Creep): Structure | undefined {
  const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: s => (
      s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 //&& Memory.containers[s.id]?.type === ContainerType.STORAGE)
    )
  });
  if (container) return container;
  return undefined;
}

function findClosestStorage(creep: Creep): Structure | undefined {
  const storages = creep.room.find(FIND_STRUCTURES, {
    filter: s => (
      s.structureType === STRUCTURE_STORAGE && s.my && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    )
  });
  if (storages && storages.length) return storages[0];
  return undefined;
}
