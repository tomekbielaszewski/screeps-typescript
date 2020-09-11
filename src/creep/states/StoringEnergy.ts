import {MovingState, resolve, StateResolver} from "./CreepState";

export function storeEnergy(creep: Creep, state: StateResolver): void {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    delete creep.memory.storage;
    creep.memory.state = resolve(state);
    return;
  }

  if (!creep.memory.storage) {
    assignStorage(creep);
    return;
  }

  const assignedStorage = Game.getObjectById(creep.memory.storage as Id<StructureSpawn | StructureExtension | StructureLink | StructureStorage | StructureContainer>);
  if (!assignedStorage) {
    assignStorage(creep);
    return;
  }

  const transferResult = creep.transfer(assignedStorage, RESOURCE_ENERGY);
  if (transferResult === OK) {
    delete creep.memory.storage;
    creep.memory.state = resolve(state);
    return;
  }
  if (transferResult === ERR_NOT_IN_RANGE) {
    creep.memory.state = resolve({nextState: MovingState});
  }
}

function assignStorage(creep: Creep) {
  const spawn = findSpawn(creep);
  if (spawn) {
    setTargetStorage(creep, spawn);
  } else {
    const storage = findClosestStorage(creep);
    if (storage) {
      setTargetStorage(creep, storage);
    } else {
      // TODO idle
    }
  }
}

function findSpawn(creep: Creep): Structure | undefined {
  const spawns = creep.room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  if (spawns && spawns.length) return spawns[0];
  return undefined;
}

function findClosestStorage(creep: Creep): Structure | undefined {
  const storage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: s => (
      (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_LINK) &&
      s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    ) || (
      s.structureType === STRUCTURE_STORAGE &&
      s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    )
  });
  if (storage) return storage;
  return undefined;
}

function setTargetStorage(creep: Creep, storage: Structure): void {
  creep.memory.storage = storage.id;
  creep.memory.targetPos = {
    x: storage.pos.x,
    y: storage.pos.y,
    room: storage.pos.roomName,
  };
}
