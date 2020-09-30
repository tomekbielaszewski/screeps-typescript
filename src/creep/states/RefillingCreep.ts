import {IdleState, MovingState, ReplayFunction, resolve, resolveAndReplay, StateResolver} from "./CreepState";

export function refillCreep(creep: Creep, takeFromSpawn: boolean, state: StateResolver): void {
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    resolveAndReplay(creep, state);
    return;
  }

  let storage;

  if (creep.memory.container &&
    Game.getObjectById(creep.memory.container as Id<StructureContainer>)?.store.getUsedCapacity(RESOURCE_ENERGY)) {
    storage = Game.getObjectById(creep.memory.container as Id<Structure>);
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
      const spawns = creep.room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_SPAWN
      });
      storage = spawns.length ? spawns[0] : undefined;
    }
  }

  if (storage) {
    const result = creep.withdraw(storage, RESOURCE_ENERGY)
    switch (result) {
      case OK:
        resolve(creep, state);
        break;
      case ERR_NOT_IN_RANGE:
        goToStorage(creep, storage, state.replay);
        break;
      default:
        console.log(`Refilling: withdraw result ${result}`);
    }
  } else {
    resolveAndReplay(creep, {nextState: IdleState, replay: state.replay});
  }
}

function goToStorage(creep: Creep, assignedStorage: Structure, replay: ReplayFunction | undefined) {
  setTargetStorage(creep, assignedStorage);
  creep.say("🥾");
  resolveAndReplay(creep, {nextState: MovingState, params: {target: creep.memory.targetPos}, replay});
}

function setTargetStorage(creep: Creep, storage: Structure): void {
  creep.memory.targetPos = {
    x: storage.pos.x,
    y: storage.pos.y,
    room: storage.pos.roomName,
  };
}
