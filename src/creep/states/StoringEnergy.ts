import {IdleState, MovingState, ReplayFunction, resolve, resolveAndReplay, StateResolver} from "./CreepState";

export function storeEnergy(creep: Creep, state: StateResolver): void {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    delete creep.memory.storage;
    resolveAndReplay(creep, state);
    return;
  }

  if (!creep.memory.storage) {
    const assigned = assignStorage(creep, state?.replay);
    if (!assigned) return;
  }

  const assignedStorage = Game.getObjectById(creep.memory.storage as Id<StructureSpawn | StructureExtension | StructureLink | StructureStorage | StructureContainer>);
  if (!assignedStorage) {
    assignStorage(creep, state?.replay);
    return;
  }

  const transferResult = creep.transfer(assignedStorage, RESOURCE_ENERGY);
  switch (transferResult) {
    case OK:
      delete creep.memory.storage;
      resolve(creep, state);
      break;
    case ERR_NOT_IN_RANGE:
      goToStorage(creep, assignedStorage, state?.replay);
      break;
    case ERR_FULL:
      assignStorage(creep, state?.replay);
      break;
    default:
      console.log(`StoringEnergy: transfer result ${transferResult}`);
  }
}

function assignStorage(creep: Creep, replay: ReplayFunction | undefined): boolean {
  const spawn = findSpawn(creep);
  if (spawn) {
    setTargetStorage(creep, spawn);
  } else {
    const storage = findClosestStorage(creep);
    if (storage) {
      setTargetStorage(creep, storage);
    } else {
      resolveAndReplay(creep, {nextState: IdleState, replay});
      return false;
    }
  }
  return true;
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

function goToStorage(creep: Creep, assignedStorage: Structure, replay: ReplayFunction | undefined) {
  setTargetStorage(creep, assignedStorage);
  creep.say("🥾");
  resolveAndReplay(creep, {nextState: MovingState, replay});
}

function setTargetStorage(creep: Creep, storage: Structure): void {
  creep.memory.storage = storage.id;
  creep.memory.targetPos = {
    x: storage.pos.x,
    y: storage.pos.y,
    room: storage.pos.roomName,
  };
}
