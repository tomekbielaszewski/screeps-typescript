import {UpgraderJob} from "./Upgrader";
import {
  CreepState,
  HarvestingState,
  MovingState,
  SpawningState,
  StateResolver,
  StoringState,
  resolve
} from "../states/CreepState";
import {harvest} from "../states/HarvestingEnergy";
import {move} from "../states/Moving";
import {storeEnergy} from "../states/StoringEnergy";

export function HarvesterJob(creep: Creep): void {
  if (global.legacy) {
    runLegacy(creep);
  } else {
    if (!creep.memory.state) {
      creep.memory.state = SpawningState
    }

    switch (creep.memory.state) {
      case SpawningState:
        initialize(creep, {nextState: HarvestingState});
        break;
      case MovingState:
        move(creep, {getNextState: stateAfterMoving(creep)});
        break;
      case HarvestingState:
        harvest(creep, {nextState: StoringState});
        break;
      case StoringState:
        storeEnergy(creep, {nextState: HarvestingState});
        break;
    }
  }
}

function stateAfterMoving(creep: Creep) {
  return function (): CreepState {
    return creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 ? StoringState : HarvestingState;
  };
}

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return;
  creep.memory.state = resolve(state);
}
