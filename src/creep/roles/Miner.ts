import {
  HarvestingState,
  IdleState,
  MovingState,
  resolveAndReplay,
  resolveLastStateAndReplay,
  SpawningState,
  StateResolver
} from "../states/CreepState";
import {harvest, HarvestingResult} from "../states/HarvestingEnergy";
import {move, MovingResult, toTarget} from "../states/Moving";

export function MinerJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  //TODO
  //assign container
  //idle by repairing container
  //store into container (only!)
  //do not move to container - stay in range at all times

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {nextState: HarvestingState, replay: MinerJob});
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
      resolveAndReplay(creep, {
        nextState: MovingState,
        params: {
          target: toTarget(Game.getObjectById<RoomObject>(creep.memory.source))
        },
        replay: MinerJob
      })
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

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return;
  resolveAndReplay(creep, state);
}
