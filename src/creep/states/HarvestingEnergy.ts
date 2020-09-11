import {MovingState, resolveAndReplay, StateResolver} from "./CreepState";

export function harvest(creep: Creep, checkCapacity: boolean, state: StateResolver): void {
  if (checkCapacity && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    resolveAndReplay(creep, state);
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
  creep.say("🥾");
  resolveAndReplay(creep, {nextState: MovingState})
}

function findSource(creep: Creep) {
  const newSource = creep.pos.findClosestByRange(FIND_SOURCES);
  creep.memory.source = newSource?.id;
}
