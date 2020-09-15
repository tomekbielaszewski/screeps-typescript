import {HarvestingState, MovingState, resolveAndReplay, SpawningState, StateResolver} from "../states/CreepState";
import {harvest} from "../states/HarvestingEnergy";
import {move} from "../states/Moving";

export function MinerJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {nextState: HarvestingState, replay: MinerJob});
      break;
    case HarvestingState:
      harvest(creep, false, {nextState: HarvestingState, replay: MinerJob});
      break;
    case MovingState:
      move(creep, {nextState: HarvestingState, replay: MinerJob});
      break;
  }
}

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return;
  resolveAndReplay(creep, state);
}
