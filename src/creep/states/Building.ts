import {IdleState, MovingState, ReplayFunction, resolveAndReplay, StateResolver} from "./CreepState";

export function building(creep: Creep, state: StateResolver): void {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    resolveAndReplay(creep, state);
    return;
  }

  if (!creep.memory.construction) {
    creep.memory.construction = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)?.id;
  }

  if (!creep.memory.construction) {
    resolveAndReplay(creep, {nextState: IdleState, replay: state.replay});
    return;
  }

  const construction = Game.getObjectById(creep.memory.construction as Id<ConstructionSite>);
  if (!construction) {
    delete creep.memory.construction;
    resolveAndReplay(creep, state);
    return;
  }

  const buildResult = creep.build(construction);
  switch (buildResult) {
    case OK:
      break;
    case ERR_NOT_IN_RANGE:
      goToConstruction(creep, construction, state.replay);
      break;
    default:
      console.log(`Building: build result ${buildResult}`);
  }
}

function goToConstruction(creep: Creep, construction: ConstructionSite, replay: ReplayFunction | undefined) {
  setTarget(creep, construction);
  creep.say("🥾");
  resolveAndReplay(creep, {nextState: MovingState, replay});
}

function setTarget(creep: Creep, construction: ConstructionSite): void {
  creep.memory.construction = construction.id;
  creep.memory.targetPos = {
    x: construction.pos.x,
    y: construction.pos.y,
    room: construction.pos.roomName,
  };
}
