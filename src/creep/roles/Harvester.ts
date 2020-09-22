import {
  HarvestingState,
  IdleState,
  MovingState,
  resolveAndReplay,
  SpawningState,
  StateResolver,
  StoringState
} from "../states/CreepState";
import {harvest} from "../states/HarvestingEnergy";
import {move} from "../states/Moving";
import {storeEnergy} from "../states/StoringEnergy";
import {upgradeController} from "../states/UpgradingController";
import {SelectorNode, SequenceNode} from "../../utils/BehaviourTree";
import {CreepHasEmptyEnergyStore} from "./behaviours/creep/storage";
import {
  AssignAlternativeSource,
  AssignedSourceHasEnergy,
  AssignSource,
  CreepHasSourceAssigned
} from "./behaviours/creep/assignment";

/*
export class Name extends LeafNode<Creep> {
  public constructor() {
    super((creep: Creep) => {
    });
  }
}
*/

const HarvesterBehaviour = new SelectorNode([
  new SequenceNode([ //harvest
    new CreepHasEmptyEnergyStore(),
    new SelectorNode([
      new CreepHasSourceAssigned(),
      new AssignSource(),
    ]),
    new SelectorNode([
      new AssignedSourceHasEnergy(),
      new AssignAlternativeSource(),
    ]),
    new RepeatUntilFailed([])
  ])
])

export function HarvesterJob(creep: Creep): void {
  if (Memory.features.behaviourTree) {

  } else {
    if (!creep.memory.state) {
      creep.memory.state = SpawningState
    }

    switch (creep.memory.state) {
      case SpawningState:
        initialize(creep, {nextState: HarvestingState, replay: HarvesterJob});
        break;
      case MovingState:
        move(creep, {replay: HarvesterJob});
        break;
      case HarvestingState:
        harvest(creep, true, true, {nextState: StoringState, replay: HarvesterJob});
        break;
      case StoringState:
        storeEnergy(creep, {nextState: HarvestingState, replay: HarvesterJob});
        break;
      case IdleState:
        upgradeController(creep, {nextState: HarvestingState, replay: HarvesterJob});
        break;
    }
  }
}

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return;
  resolveAndReplay(creep, state);
}
