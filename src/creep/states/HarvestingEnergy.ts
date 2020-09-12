import {MovingState, resolveAndReplay, StateResolver} from "./CreepState";
import {assignToSource} from "../management/SourceAssigner";

export function harvest(creep: Creep, checkCapacity: boolean, state: StateResolver): void {
  if (checkCapacity && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    resolveAndReplay(creep, state);
    return;
  }

  if (!creep.memory.source) {
    findSource(creep);
  }

  const source = Game.getObjectById(creep.memory.source as Id<Source>);
  if (!source) {
    findSource(creep);
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
  creep.room.find(FIND_SOURCES)
    .sort((s1, s2) => creep.pos.getRangeTo(s1.pos) - creep.pos.getRangeTo(s2.pos))
    .find(source => assignToSource(creep, source));
}
