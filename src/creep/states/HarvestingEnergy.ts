import {IdleState, MovingState, ReplayFunction, resolve, resolveAndReplay, StateResolver} from "./CreepState";
import {assignToSource} from "../management/SourceAssigner";

export function harvest(creep: Creep, checkCapacity: boolean, changeSourceWhenEmpty: boolean, state: StateResolver): void {
  if (checkCapacity && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    resolveAndReplay(creep, state);
    return;
  }

  if (!creep.memory.source) {
    findSource(creep);
  }

  let source = Game.getObjectById(creep.memory.source as Id<Source>);
  if (!source) {
    findSource(creep);
    return;
  } else if (changeSourceWhenEmpty && source.energy === 0) {
    source = findAlternativeSource(creep);
  }

  if (!source) {
    resolve(creep, {nextState: IdleState});
    return;
  }

  const harvestResult = creep.harvest(source);
  switch (harvestResult) {
    case OK:
      return;
    case ERR_NOT_IN_RANGE:
      goToSource(creep, source, state?.replay)
      return;
    default:
      console.log(`HarvestingEnergy: harvest result ${harvestResult}`);
  }
}

function goToSource(creep: Creep, source: Source, replay: ReplayFunction | undefined) {
  creep.memory.targetPos = {
    x: source.pos.x,
    y: source.pos.y,
    room: source.pos.roomName,
  };
  creep.say("🥾");
  resolveAndReplay(creep, {nextState: MovingState, params: {target: creep.memory.targetPos}, replay});
}

function findSource(creep: Creep) {
  creep.room.find(FIND_SOURCES)
    .sort((s1, s2) => creep.pos.getRangeTo(s1.pos) - creep.pos.getRangeTo(s2.pos))
    .find(source => assignToSource(creep, source));
}

function findAlternativeSource(creep: Creep): Source | null {
  const find = creep.room.find(FIND_SOURCES)
    .filter(s => s.id !== creep.memory.source)
    .find(s => s.energy > 0);
  return find === undefined ? null : find;
}
