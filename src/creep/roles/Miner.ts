import {HarvestingState, MovingState, resolve, SpawningState, StateResolver} from "../states/CreepState";
import {harvest} from "../states/HarvestingEnergy";
import {move} from "../states/Moving";

export function MinerJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {nextState: HarvestingState});
      break;
    case HarvestingState:
      harvest(creep, false, {nextState: HarvestingState});
      break;
    case MovingState:
      move(creep, {nextState: HarvestingState});
      break;
  }
}

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return;
  creep.memory.state = resolve(state);
}
