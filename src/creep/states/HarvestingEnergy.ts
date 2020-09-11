import {MovingState, resolve, StateResolver} from "./CreepState";

export function harvest(creep: Creep, state: StateResolver): void {
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.state = resolve(state);
    return;
  }

  if (!creep.memory.source) {
    findSource(creep)
    return;
  }

  const source = Game.getObjectById(creep.memory.source as Id<Source>);
  if (!source) {
    findSource(creep)
    return;
  }

  const harvestResult = creep.harvest(source);
  if (harvestResult === OK) return;
  if (harvestResult === ERR_NOT_IN_RANGE) {
    goToSource(creep, source)
    return;
  }
}

function goToSource(creep: Creep, source: Source) {
  creep.memory.targetPos = {
    x: source.pos.x,
    y: source.pos.y,
    room: source.pos.roomName,
  };
  creep.memory.state = resolve({nextState: MovingState});
}

function findSource(creep: Creep) {
  const newSource = _.shuffle(creep.room.find(FIND_SOURCES))[0];
  creep.memory.source = newSource.id;
}
