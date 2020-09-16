import {
  BuildingState,
  CreepState,
  IdleState,
  MovingState,
  RefillingState,
  RepairingState,
  resolveAndReplay,
  SpawningState,
  StateResolver
} from "../states/CreepState";
import {move} from "../states/Moving";
import {refillCreep} from "../states/RefillingCreep";
import {building} from "../states/Building";
import {repairing} from "../states/Repairing";
import {upgradeController} from "../states/UpgradingController";

export function BuilderJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob});
      break;
    case RefillingState:
      refillCreep(creep, true, {getNextState: buildingOrRepairing(creep), replay: BuilderJob});
      break;
    case MovingState:
      move(creep, {replay: BuilderJob});
      break;
    case BuildingState:
      building(creep, {nextState: RefillingState, replay: BuilderJob});
      break;
    case RepairingState:
      repairing(creep, Memory.repair.fortifications, {nextState: RefillingState, replay: BuilderJob});
      break;
    case IdleState:
      upgradeController(creep, {nextState: RefillingState});
      break;
  }
}

function buildingOrRepairing(creep: Creep) {
  return function (): CreepState {
    const constructionSite = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    if (constructionSite.length) return BuildingState;
    return RepairingState;
  };
}

function initialize(creep: Creep, state: StateResolver): void {
  if (creep.spawning) return;
  resolveAndReplay(creep, state);
}
