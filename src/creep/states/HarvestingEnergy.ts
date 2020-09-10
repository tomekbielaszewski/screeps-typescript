import {MovingState, resolve, StateResolver} from "./CreepState";

export function harvest(creep: Creep, state: StateResolver) {
  if (!creep.memory.source) {
    const newSource = _.shuffle(creep.room.find(FIND_SOURCES))[0];
    creep.memory.source = newSource.id;
    creep.memory.targetPos = {
      x: newSource.pos.x,
      y: newSource.pos.y,
      room: newSource.pos.roomName,
    };
    creep.memory.state = resolve({nextState: MovingState});
  }
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.state = resolve(state);
    return;
  }
  const source = Game.getObjectById(creep.memory.source as Id<Source>);
  if (source && creep.harvest(source) === OK) return;
}
