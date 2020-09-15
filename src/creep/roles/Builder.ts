import {
  BuildingState,
  IdleState,
  MovingState,
  RefillingState,
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
      initialize(creep, {nextState: RefillingState, replay: BuilderJob});
      break;
    case RefillingState:
      refillCreep(creep, {nextState: BuildingState, replay: BuilderJob});
      break;
    case MovingState:
      move(creep, {replay: BuilderJob});
      break;
    case BuildingState:
      building(creep, {getNextState: stateAfterBuilding(creep), replay: BuilderJob});
      break;
    case IdleState:
      break;
  }
}

function stateAfterBuilding(creep: Creep) {
  return function () {
    return creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 ? BuildingState : RefillingState;
  };
}

function initialize(creep: Creep, state: StateResolver): void {

}
