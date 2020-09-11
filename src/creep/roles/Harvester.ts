import {
  CreepState,
  HarvestingState,
  IdleState,
  MovingState,
  resolve,
  SpawningState,
  StateResolver,
  StoringState
} from "../states/CreepState";
import {harvest} from "../states/HarvestingEnergy";
import {move} from "../states/Moving";
import {storeEnergy} from "../states/StoringEnergy";
import {upgradeController} from "../states/UpgradingController";

export function HarvesterJob(creep: Creep): void {
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
      harvest(creep, true,{nextState: StoringState});
      break;
    case StoringState:
      storeEnergy(creep, {nextState: HarvestingState});
      break;
    case IdleState:
      upgradeController(creep, {nextState: HarvestingState});
      break;
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
