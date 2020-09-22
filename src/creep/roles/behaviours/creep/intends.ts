import {BTNodeResult, LeafNode} from "../../../../utils/BehaviourTree";


export class MineEnergy extends LeafNode<Creep> {
  public constructor() {
    super((creep: Creep) => {
      const source = Game.getObjectById<Source>(creep.memory.source as Id<Source>)
      if (!source) return BTNodeResult.FAILURE
      if (source.energy < 1) return BTNodeResult.FAILURE
      return BTNodeResult.SUCCESS
    });
  }
}
