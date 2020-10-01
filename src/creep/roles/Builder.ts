import {
  BuildingState,
  CreepState,
  IdleState,
  MovingState,
  RefillingState,
  RepairingState,
  resolve,
  resolveAndReplay,
  SpawningState,
  StateResolver
} from "../states/CreepState"
import {move} from "../states/Moving"
import {refillCreep, RefillingResult} from "../states/RefillingCreep"
import {building, BuildingResult} from "../states/Building"
import {repairing} from "../states/Repairing"

export function BuilderJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob})
      break
    case RefillingState:
      runRefillingState(creep)
      break
    case MovingState:
      move(creep, {replay: BuilderJob})
      break
    case BuildingState:
      runBuildingState(creep)
      break
    case RepairingState:
      repairing(creep, Memory.repair.fortifications, {nextState: RefillingState, replay: BuilderJob})
      break
    case IdleState:
      repairing(creep, true, {nextState: RefillingState})
      break
  }
}

function runRefillingState(creep: Creep) {
  const refillingSubState = refillCreep(creep, true)
  switch (refillingSubState) {
    case RefillingResult.CreepRefilled:
      resolve(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob})
      break
    case RefillingResult.CreepStoreFull:
      resolveAndReplay(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob})
      break
    case RefillingResult.NoResourcesInStorage: //do not advance to another state
    case RefillingResult.CouldNotWithdraw: //do not advance to another state
      break
    case RefillingResult.OutOfRange:
      resolveAndReplay(creep, {
        nextState: MovingState, params: {
          range: 3,
          target: getTarget(Game.getObjectById<RoomObject>(creep.memory.storage))
        },
        replay: BuilderJob
      })
      break
  }
}

function runBuildingState(creep: Creep) {
  const buildingSubState = building(creep)
  switch (buildingSubState) {
    case BuildingResult.Working:
      break
    case BuildingResult.OutOfRange:
      resolveAndReplay(creep, {
        nextState: MovingState, params: {
          range: 3,
          target: getTarget(Game.getObjectById<RoomObject>(creep.memory.construction))
        },
        replay: BuilderJob
      })
      break
    case BuildingResult.ConstructionSiteNoLongerExist: //has CS been completed? Lets reply the current state
      resolveAndReplay(creep, {nextState: BuildingState, replay: BuilderJob})
      break
    case BuildingResult.NoConstructionSite: //nothing to build - try repairing stuff
      resolveAndReplay(creep, {nextState: RepairingState, replay: BuilderJob})
      break
    case BuildingResult.CreepStoreEmpty:
      resolveAndReplay(creep, {nextState: RefillingState, replay: BuilderJob})
      break
  }
}

function getTarget(roomObject: RoomObject | null): { x: number, y: number, room: string } {
  if (!roomObject) throw Error('No target set')
  return {
    x: roomObject.pos.x,
    y: roomObject.pos.y,
    room: roomObject.pos.roomName,
  }
}

function buildingOrRepairing(creep: Creep) {
  return function (): CreepState {
    const constructionSite = creep.room.find(FIND_MY_CONSTRUCTION_SITES)
    if (constructionSite.length) return BuildingState
    return RepairingState
  }
}

function initialize(creep: Creep, state: StateResolver): void {
  if (creep.spawning) return
  resolveAndReplay(creep, state)
}
