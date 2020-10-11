import {
  HarvestingState,
  IdleState,
  MovingState,
  resolveAndReplay,
  resolveLastStateAndReplay,
  SpawningState
} from "../states/CreepState";
import {harvest, HarvestingResult} from "../states/HarvestingEnergy";
import {move, MovingResult, toTarget} from "../states/Moving";
import {SerializablePosition, SerializableRoomObject} from "../../utils/Serializables";

export function MinerJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  //TODO

  //spawn with source assigned
  //goto source
  //search in range 1 around source for container. if not found create csite
  //goto and stand on source container/csite
  //harvest energy
  //if container exist - store in it, if not build it
  //if source empty - fix container using energy from container

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep);
      break;
    case HarvestingState:
      runHarvestingState(creep)
      break;
    case MovingState:
      runMovingState(creep)
      break;
  }
}

function runHarvestingState(creep: Creep) {
  const harvestingResult = harvest(creep, false, false)
  switch (harvestingResult) {
    case HarvestingResult.CouldNotFindSource: //well... lets call it a day
      resolveAndReplay(creep, {nextState: IdleState, replay: MinerJob})
      break
    case HarvestingResult.CouldNotHarvest: //try again next tick
    case HarvestingResult.Harvesting: //then keep it up
    case HarvestingResult.CreepStoreFull: //do nothing and keep working
      break
    case HarvestingResult.OutOfRange:
      creep.memory.move = {
        target: toTarget(creep.memory.source?.get())
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
      break
  }
}

function runMovingState(creep: Creep) {
  const movingResult = move(creep)
  switch (movingResult) {
    case MovingResult.CouldNotMove: //do not advance to another state and see what happens
    case MovingResult.Moving: //so keep moving
      break
    case MovingResult.NoPath: //something blocking the path? wait to next tick and run again. In future good to have some traffic control here
      creep.say('🗺️🤔')
      break
    case MovingResult.NoTargetPositionSet:
      resolveLastStateAndReplay(creep, {replay: MinerJob})
      break
    case MovingResult.ReachedDestination:
      resolveLastStateAndReplay(creep, {replay: MinerJob})
      break
    case MovingResult.Tired:
      creep.say('😩')
      break
  }
}

function initialize(creep: Creep) {
  if (creep.spawning) return
  if (!creep.memory.source) {
    creep.memory.source = getAvailableSource(creep)
    if (!creep.memory.source) throw new Error('No source available for Miner')
  }

  if (creep.pos.getRangeTo(creep.memory.source.pos.toPos()) > 1) {
    creep.memory.move = {
      range: 1,
      target: toTarget(creep.memory.source?.get())
    }
    resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
    return;
  }


}

function getAvailableSource(creep: Creep): SerializableRoomObject<Source> {
  return new SerializableRoomObject("" as Id<Source>, new SerializablePosition(1, 1, ""))
}
