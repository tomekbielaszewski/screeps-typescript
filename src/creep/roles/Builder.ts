import {
  BuildingState,
  CreepState,
  IdleState,
  MovingState,
  RefillingState,
  RepairingState,
  resolve,
  resolveAndReplay,
  SpawningState,
  StateResolver
} from "../states/CreepState";
import {move} from "../states/Moving";
import {refillCreep} from "../states/RefillingCreep";
import {building} from "../states/Building";

export function BuilderJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob});
      break;
    case RefillingState:
      refillCreep(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob});
      break;
    case MovingState:
      move(creep, {replay: BuilderJob});
      break;
    case BuildingState:
      building(creep, {nextState: RefillingState, replay: BuilderJob});
      break;
    case RepairingState:
    case IdleState:
      if (creep.room.find(FIND_MY_CONSTRUCTION_SITES)) {
        resolve(creep, {nextState: BuildingState, replay: BuilderJob});
      }
      break;
  }
}

function buildingOrRepairing(creep: Creep) {
  return function (): CreepState {
    const constructionSite = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    if (constructionSite) return BuildingState;
    return RepairingState;
  };
}

function initialize(creep: Creep, state: StateResolver): void {
  if (creep.spawning) return;
  resolveAndReplay(creep, state);
}
