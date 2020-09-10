import {MovingState, resolve, StateResolver} from "./CreepState";

export function storeEnergy(creep: Creep, state: StateResolver) {
  if (!creep.memory.storage) {
    const spawn = creep.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (spawn && spawn.length) {
      creep.memory.storage = spawn[0].id;
      creep.memory.targetPos = {
        x: spawn[0].pos.x,
        y: spawn[0].pos.y,
        room: spawn[0].pos.roomName,
      };
    } else {
      const storage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: s => (
          (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_LINK) &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        ) || (
          s.structureType === STRUCTURE_STORAGE &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        )
      });
      if (storage) {
        creep.memory.storage = storage.id;
        creep.memory.targetPos = {
          x: storage.pos.x,
          y: storage.pos.y,
          room: storage.pos.roomName,
        };
      } else {
        // TODO idle
      }
    }
    creep.memory.state = resolve({nextState: MovingState});
    return;
  }
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    delete creep.memory.storage;
    creep.memory.state = resolve(state);
    return;
  }
  const store = Game.getObjectById(creep.memory.storage as Id<StructureSpawn | StructureExtension | StructureLink | StructureStorage | StructureContainer>);
  if (store) {
    creep.transfer(store, RESOURCE_ENERGY);
  } else {
    delete creep.memory.storage;
  }
}
