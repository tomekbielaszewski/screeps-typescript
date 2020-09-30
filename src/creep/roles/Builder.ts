import {
  BuildingState,
  CreepState,
  IdleState,
  MovingState,
  RefillingState,
  RepairingState,
  resolveAndReplay,
  SpawningState,
  StateResolver
} from "../states/CreepState";
import {move} from "../states/Moving";
import {refillCreep} from "../states/RefillingCreep";
import {building, BuildingSubState} from "../states/Building";
import {repairing} from "../states/Repairing";

export function BuilderJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob});
      break;
    case RefillingState:
      refillCreep(creep, true, {getNextState: buildingOrRepairing(creep), replay: BuilderJob});
      break;
    case MovingState:
      move(creep, {replay: BuilderJob});
      break;
    case BuildingState:
      runBuildingState(creep)
      break;
    case RepairingState:
      repairing(creep, Memory.repair.fortifications, {nextState: RefillingState, replay: BuilderJob});
      break;
    case IdleState:
      repairing(creep, true, {nextState: RefillingState});
      break;
  }
}

function runBuildingState(creep: Creep) {
  const buildingSubState = building(creep)//, {nextState: RefillingState, replay: BuilderJob})
  switch (buildingSubState) {
    case BuildingSubState.Working:
      break;
    case BuildingSubState.OutOfRange:
      resolveAndReplay(creep, {
        nextState: MovingState, params: {
          range: 3,
          target: getTarget(Game.getObjectById<ConstructionSite>(creep.memory.construction))
        },
        replay: BuilderJob
      });
      break;
    case BuildingSubState.ConstructionSiteDoesNotExist: //has CS been completed? Lets reply the current state
      resolveAndReplay(creep, {nextState: BuildingState, replay: BuilderJob})
      break;
    case BuildingSubState.NoConstructionSite: //nothing to build - try repairing stuff
      resolveAndReplay(creep, {nextState: RepairingState, replay: BuilderJob})
      break;
    case BuildingSubState.NoResources:
      resolveAndReplay(creep, {nextState: RefillingState, replay: BuilderJob})
      break;
  }
}

function getTarget(construction: ConstructionSite | null): { x: number; y: number; room: string } {
  if (!construction) throw Error('No target set')
  return {
    x: construction.pos.x,
    y: construction.pos.y,
    room: construction.pos.roomName,
  }
}

function buildingOrRepairing(creep: Creep) {
  return function (): CreepState {
    const constructionSite = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    if (constructionSite.length) return BuildingState;
    return RepairingState;
  };
}

function initialize(creep: Creep, state: StateResolver): void {
  if (creep.spawning) return;
  resolveAndReplay(creep, state);
}
