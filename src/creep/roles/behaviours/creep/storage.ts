import {BTNodeResult, LeafNode} from "../../../../utils/BehaviourTree";

export class CreepHasEmptyEnergyStore extends LeafNode<Creep> {
  public constructor() {
    super((creep: Creep) => {
      return creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0 ? BTNodeResult.SUCCESS : BTNodeResult.FAILURE
    });
  }
}

export function CreepHasFullEnergyStore(creep: Creep): BTNodeResult {
  return creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 ? BTNodeResult.SUCCESS : BTNodeResult.FAILURE
}
