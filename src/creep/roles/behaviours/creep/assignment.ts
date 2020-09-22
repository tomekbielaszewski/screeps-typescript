import {BTNodeResult, LeafNode} from "../../../../utils/BehaviourTree"
import {assignToSource} from "../../../management/SourceAssigner"

export class CreepHasSourceAssigned extends LeafNode<Creep> {
  public constructor() {
    super((creep: Creep) => {
      if (!creep.memory.source) {
        return BTNodeResult.FAILURE
      }

      const source = Game.getObjectById<Source>(creep.memory.source as Id<Source>)
      if (!source) {
        return BTNodeResult.FAILURE
      }

      return BTNodeResult.SUCCESS
    });
  }
}

export class AssignSource extends LeafNode<Creep> {
  public constructor() {
    super((creep: Creep) => {
      const foundSource = creep.room.find(FIND_SOURCES)
        .sort((s1, s2) => creep.pos.getRangeTo(s1.pos) - creep.pos.getRangeTo(s2.pos))
        .find(source => assignToSource(creep, source))
      if (!foundSource) return BTNodeResult.FAILURE
      creep.memory.source = foundSource.id
      return BTNodeResult.SUCCESS
    });
  }
}

export class AssignedSourceHasEnergy extends LeafNode<Creep> {
  public constructor() {
    super((creep: Creep) => {
      const source = Game.getObjectById<Source>(creep.memory.source as Id<Source>)
      if (!source) return BTNodeResult.FAILURE
      if (source.energy < 1) return BTNodeResult.FAILURE
      return BTNodeResult.SUCCESS
    });
  }
}

export class AssignAlternativeSource extends LeafNode<Creep> {
  public constructor() {
    super((creep: Creep) => {
      const foundSource = creep.room.find(FIND_SOURCES)
        .filter(s => s.id !== creep.memory.source)
        .find(s => s.energy > 0)
      if (!foundSource) return BTNodeResult.FAILURE
      creep.memory.alternativeSource = foundSource.id
      return BTNodeResult.SUCCESS
    });
  }
}
